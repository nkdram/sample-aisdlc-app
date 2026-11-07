import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildErrorReport,
  formatErrorLogLine,
  MAX_REPORTS_PER_PAGE_LOAD,
  parseErrorReport,
  reportError,
  resetReportBudget,
} from "./report-error";
import { POST } from "@/app/api/errors/route";

function errorWithDigest(message: string, digest?: string): Error & { digest?: string } {
  const error: Error & { digest?: string } = new Error(message);
  if (digest) error.digest = digest;
  return error;
}

function sentBodies(fetchMock: ReturnType<typeof vi.fn>): unknown[] {
  return fetchMock.mock.calls.map((call) => JSON.parse(String((call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).body)));
}

/** The unit tests run in a node environment, so stand in for the browser location. */
function stubLocation(search = ""): void {
  vi.stubGlobal("window", {
    location: { origin: "http://localhost:3000", pathname: "/", search },
  });
}

beforeEach(() => {
  stubLocation();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildErrorReport", () => {
  it("keeps only the whitelisted fields", () => {
    const report = buildErrorReport(errorWithDigest("boom", "abc123"), { scope: "app/error" });

    expect(Object.keys(report).sort()).toEqual(["digest", "message", "scope", "stack", "url", "version"]);
    expect(report.message).toBe("boom");
    expect(report.digest).toBe("abc123");
    expect(report.scope).toBe("app/error");
    expect(report.url).toBe("http://localhost:3000/");
    expect(typeof report.version).toBe("string");
  });

  it("never includes bill amounts or names from the page", () => {
    const error = errorWithDigest("boom");
    const report = buildErrorReport(error, { scope: "app/error" });
    const serialised = JSON.stringify(report);

    expect(serialised).not.toMatch(/bill/i);
    expect(serialised).not.toMatch(/people/i);
    expect(serialised).not.toMatch(/42\.5/);
    expect(serialised).not.toMatch(/Ada|Grace/);
  });

  it("drops the query string, which can carry user data", () => {
    stubLocation("?bill=42.50&name=Ada");
    const report = buildErrorReport(errorWithDigest("boom"));

    expect(report.url).toBe("http://localhost:3000/");
  });

  it("has an empty url when there is no browser location", () => {
    vi.unstubAllGlobals();
    expect(buildErrorReport(errorWithDigest("boom")).url).toBe("");
  });

  it("copes with values that are not errors", () => {
    expect(buildErrorReport("just a string").message).toBe("Unknown error");
    expect(buildErrorReport(undefined).stack).toBe("");
    expect(buildErrorReport({ message: 42 }).message).toBe("Unknown error");
  });
});

describe("reportError", () => {
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

  it("POSTs the payload to /api/errors", async () => {
    await reportError(errorWithDigest("boom", "digest-1"), { scope: "app/error" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/errors");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.message).toBe("boom");
    expect(body.digest).toBe("digest-1");
    expect(body.url).toBe("http://localhost:3000/");
    expect(typeof body.stack).toBe("string");
    expect(typeof body.version).toBe("string");
    expect(body).not.toHaveProperty("bill");
    expect(body).not.toHaveProperty("people");
  });

  it("swallows a failing fetch", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("network down")));

    await expect(reportError(errorWithDigest("boom"))).resolves.toBeUndefined();
  });

  it("swallows a fetch that throws synchronously", async () => {
    fetchMock.mockImplementation(() => {
      throw new Error("no fetch here");
    });

    await expect(reportError(errorWithDigest("boom"))).resolves.toBeUndefined();
  });

  it(`stops after ${MAX_REPORTS_PER_PAGE_LOAD} reports per page load`, async () => {
    for (let i = 0; i < MAX_REPORTS_PER_PAGE_LOAD + 3; i += 1) {
      await reportError(errorWithDigest(`boom ${i}`));
    }

    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_PAGE_LOAD);
    expect(sentBodies(fetchMock)).toHaveLength(MAX_REPORTS_PER_PAGE_LOAD);
  });

  it("counts a failed report against the budget", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("network down")));
    await reportError(errorWithDigest("boom"));
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    await reportError(errorWithDigest("boom again"));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("server side helpers", () => {
  it("parses a report and drops unknown fields", () => {
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

  it("formats one JSON log line", () => {
    const line = formatErrorLogLine({ message: "boom", version: "1.2.3" });

    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toMatchObject({ level: "error", event: "client_error", message: "boom" });
  });
});

describe("POST /api/errors", () => {
  it("logs exactly one JSON line and answers 204", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postErrorReport({
      message: "boom",
      stack: "at x",
      digest: "d1",
      url: "http://localhost:3000/",
      version: "1.2.3",
      bill: 42.5,
      name: "Ada",
    });

    expect(response.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0]?.[0] ?? "");
    expect(line).not.toContain("\n");
    const logged = JSON.parse(line) as Record<string, unknown>;
    expect(logged).toMatchObject({
      level: "error",
      event: "client_error",
      message: "boom",
      digest: "d1",
      version: "1.2.3",
    });
    // Untrusted extra fields never reach the log line.
    expect(logged).not.toHaveProperty("bill");
    expect(logged).not.toHaveProperty("name");
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
});

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

