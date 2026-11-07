import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/errors/route";
import {
  buildErrorReport,
  formatErrorLogLine,
  MAX_REPORTS_PER_PAGE_LOAD,
  parseErrorReport,
  reportError,
  resetReportBudget,
} from "./report-error";

/**
 * Rules for the reporting seam (SAMPLE-AISDLC-APP-22). The describe blocks are
 * named after the acceptance criteria they prove.
 */

const THIRD_PARTY_ERROR_SERVICES =
  /sentry|bugsnag|rollbar|datadog|newrelic|new-relic|honeybadger|logrocket|raygun|airbrake|trackjs|elastic-apm/i;

/** The route handler's own URL path, e.g. "/api/errors". */
function routePath(): string {
  const file = fileURLToPath(new URL("../app/api/errors/route.ts", import.meta.url));
  return file.slice(file.indexOf("/app/") + "/app".length).replace(/\/route\.ts$/, "");
}

function errorWithDigest(message: string, digest?: string): Error & { digest?: string } {
  const error: Error & { digest?: string } = new Error(message);
  if (digest) error.digest = digest;
  return error;
}

/** Calls the route handler the way the browser reporter does. */
function postErrorReport(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost:3000/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

function sentBodies(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown>[] {
  return fetchMock.mock.calls.map((call) => {
    const init = (call as unknown[])[1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  });
}

/** The unit tests run in a node environment, so stand in for the browser location. */
function stubLocation(search = ""): void {
  vi.stubGlobal("window", {
    location: { origin: "http://localhost:3000", pathname: "/", search },
  });
}

beforeEach(() => {
  resetReportBudget();
  stubLocation();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  resetReportBudget();
});

describe("Errors go through reportError(error, context) in lib/report-error.ts, which POSTs {message, stack, digest, url, version} to /api/errors; the route logs one JSON line and returns 204", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetReportBudget();
    stubLocation();
    fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    resetReportBudget();
  });

  it("Errors go through reportError(error, context): it POSTs exactly {message, stack, digest, url, version} to /api/errors", async () => {
    await reportError(errorWithDigest("boom", "digest-1"), { scope: "app/error" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/errors");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });

    const body = sentBodies(fetchMock)[0] ?? {};
    expect(Object.keys(body).sort()).toEqual(["digest", "message", "scope", "stack", "url", "version"]);
    expect(body.message).toBe("boom");
    expect(body.digest).toBe("digest-1");
    expect(body.url).toBe("http://localhost:3000/");
    expect(typeof body.stack).toBe("string");
    expect(typeof body.version).toBe("string");
    expect(body.scope).toBe("app/error");
  });

  it("takes everything but the error from the fixed whitelist, not from the caller", () => {
    const report = buildErrorReport(errorWithDigest("boom", "abc123"), { scope: "app/error" });

    expect(report.message).toBe("boom");
    expect(report.digest).toBe("abc123");
    expect(report.url).toBe("http://localhost:3000/");
    expect(report).not.toHaveProperty("bill");
    expect(report).not.toHaveProperty("people");
  });

  it("copes with values that are not errors", () => {
    expect(buildErrorReport("just a string").message).toBe("Unknown error");
    expect(buildErrorReport(undefined).stack).toBe("");
    expect(buildErrorReport({ message: 42 }).message).toBe("Unknown error");
  });

  it("the route logs one JSON line and returns 204", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postErrorReport({
      message: "boom",
      stack: "at x",
      digest: "d1",
      url: "http://localhost:3000/",
      version: "1.2.3",
    });

    expect(response.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0]?.[0] ?? "");
    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toMatchObject({
      level: "error",
      event: "client_error",
      message: "boom",
      digest: "d1",
      version: "1.2.3",
    });
    log.mockRestore();
  });

  it("still answers 204 and logs one line for a body that is not JSON", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postErrorReport("not json at all");

    expect(response.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(log.mock.calls[0]?.[0] ?? ""))).toMatchObject({
      level: "error",
      event: "client_error",
      message: "Unknown error",
    });
    log.mockRestore();
  });

  it("answers 204 even when the request body cannot be read", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = { json: () => Promise.reject(new Error("stream closed")) } as unknown as Request;

    const response = await POST(broken);

    expect(response.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  it("formats one newline-free JSON log line", () => {
    const line = formatErrorLogLine({ message: "boom", version: "1.2.3" });

    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toMatchObject({ level: "error", event: "client_error", message: "boom" });
  });
});

describe("Reporting never throws and is limited to 5 reports per page load", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetReportBudget();
    stubLocation();
    fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    resetReportBudget();
  });

  it("Reporting never throws: it swallows a fetch that rejects", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("network down")));

    await expect(reportError(errorWithDigest("boom"))).resolves.toBeUndefined();
  });

  it("Reporting never throws: it swallows a fetch that throws synchronously", async () => {
    fetchMock.mockImplementation(() => {
      throw new Error("no fetch here");
    });

    await expect(reportError(errorWithDigest("boom"))).resolves.toBeUndefined();
  });

  it("Reporting never throws: it swallows a missing fetch", async () => {
    vi.stubGlobal("fetch", undefined);

    await expect(reportError(errorWithDigest("boom"))).resolves.toBeUndefined();
  });

  it(`Reporting is limited to ${MAX_REPORTS_PER_PAGE_LOAD} reports per page load: it stops after ${MAX_REPORTS_PER_PAGE_LOAD} reports`, async () => {
    for (let i = 0; i < MAX_REPORTS_PER_PAGE_LOAD + 3; i += 1) {
      await reportError(errorWithDigest(`boom ${i}`));
    }

    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_PAGE_LOAD);
    expect(sentBodies(fetchMock)).toHaveLength(MAX_REPORTS_PER_PAGE_LOAD);
  });

  it("Reporting is limited to 5 reports per page load: a failed report still counts, so a broken endpoint cannot loop", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("network down")));
    for (let i = 0; i < MAX_REPORTS_PER_PAGE_LOAD; i += 1) {
      await reportError(errorWithDigest(`boom ${i}`));
    }
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    await reportError(errorWithDigest("boom after the cap"));

    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_PAGE_LOAD);
  });

  it("starts a fresh budget after resetReportBudget (a new page load)", async () => {
    for (let i = 0; i < MAX_REPORTS_PER_PAGE_LOAD; i += 1) {
      await reportError(errorWithDigest(`boom ${i}`));
    }
    resetReportBudget();
    await reportError(errorWithDigest("boom after reload"));

    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_PAGE_LOAD + 1);
  });
});

describe("No personal data (bill amounts, names) is included in a report", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetReportBudget();
    stubLocation("?bill=42.50&people=3&name=Ada");
    fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    resetReportBudget();
  });

  it("sends the bare url: origin and path only, so the query string never leaves the page", async () => {
    await reportError(errorWithDigest("boom"));

    const body = sentBodies(fetchMock)[0] ?? {};
    expect(body.url).toBe("http://localhost:3000/");
  });

  it("No personal data (bill amounts, names) is included in a report: no bill amount, number of people or name", async () => {
    await reportError(errorWithDigest("boom"), { scope: "app/error" });

    const serialised = JSON.stringify(sentBodies(fetchMock)[0] ?? {});
    expect(serialised).not.toMatch(/bill/i);
    expect(serialised).not.toMatch(/people/i);
    expect(serialised).not.toMatch(/\bname\b/i);
    expect(serialised).not.toMatch(/42\.5/);
    expect(serialised).not.toMatch(/Ada/);
  });

  it("drops personal data an untrusted client puts in the body before logging it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await postErrorReport({
      message: "boom",
      stack: "at x",
      digest: "d1",
      url: "http://localhost:3000/",
      version: "1.2.3",
      bill: 42.5,
      people: 3,
      name: "Ada",
    });

    const line = String(log.mock.calls[0]?.[0] ?? "");
    const logged = JSON.parse(line) as Record<string, unknown>;
    expect(logged).not.toHaveProperty("bill");
    expect(logged).not.toHaveProperty("people");
    expect(logged).not.toHaveProperty("name");
    expect(line).not.toMatch(/42\.5|Ada/);
    log.mockRestore();
  });

  it("keeps the parsed report to the whitelist", () => {
    const report = parseErrorReport({
      message: "boom",
      stack: "at x",
      digest: "d1",
      url: "https://example.test/",
      version: "1.2.3",
      bill: 42.5,
      name: "Ada",
    });

    expect(report).toEqual({
      message: "boom",
      stack: "at x",
      digest: "d1",
      url: "https://example.test/",
      version: "1.2.3",
    });
  });

  it("parses junk without throwing", () => {
    expect(parseErrorReport(null).message).toBe("Unknown error");
    expect(parseErrorReport("nope").version).toBe("unknown");
  });
});

describe("No third-party error SaaS; the API route is the seam a real collector can replace later", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetReportBudget();
    stubLocation();
    fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    resetReportBudget();
  });

  it("No third-party error SaaS: it posts to this app's own /api/errors route, not to a third party", async () => {
    await reportError(new Error("boom"));

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/errors");
    expect(url).toBe(routePath());
    expect(url).not.toMatch(/^https?:\/\//);
  });

  it("ships no third-party error service dependency", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];

    expect(names.filter((name) => THIRD_PARTY_ERROR_SERVICES.test(name))).toEqual([]);
  });

  it("the API route is the seam a real collector can replace later: a single handler that only logs and answers 204", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postErrorReport({ message: "boom", version: "1.2.3" });

    // No outbound call happens on the server: the seam is ours alone.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
    expect(response.headers.get("content-type")).toBeNull();
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
