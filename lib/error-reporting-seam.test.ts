import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/errors/route";
import { reportError, resetReportBudget } from "./report-error";

/**
 * The reporting seam: the client reporter talks to this app's own route handler
 * and nothing else, so a real collector can replace the route later without
 * touching the pages. No third-party error SaaS is involved.
 */

const THIRD_PARTY_ERROR_SERVICES =
  /sentry|bugsnag|rollbar|datadog|newrelic|new-relic|honeybadger|logrocket|raygun|airbrake|trackjs|elastic-apm/i;

/** The route file's own URL path, e.g. "/api/errors". */
function routePath(): string {
  const file = fileURLToPath(new URL("../app/api/errors/route.ts", import.meta.url));
  return file.slice(file.indexOf("/app/") + "/app".length).replace(/\/route\.ts$/, "");
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetReportBudget();
  vi.stubGlobal("window", { location: { origin: "http://localhost:3000", pathname: "/", search: "" } });
  fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  resetReportBudget();
});

describe("the reporting seam", () => {
  it("posts to this app's own /api/errors route, not to a third party", async () => {
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

  it("answers 204 even when the request body cannot be read", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = { json: () => Promise.reject(new Error("stream closed")) } as unknown as Request;

    const response = await POST(broken);

    expect(response.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
