import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Two acceptance criteria of SAMPLE-AISDLC-APP-22 are about the test harness
 * itself, not about product behaviour: the e2e scenario must exist and must
 * actually do what the test plan says, and the gates the PR must pass must be
 * wired up. Both are checked here so a later edit cannot quietly drop them.
 */

interface PackageJson {
  readonly scripts?: Record<string, string>;
}

function repoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const pkg = JSON.parse(repoFile("package.json")) as PackageJson;
const scripts = pkg.scripts ?? {};

describe('E2E: open /?crash=1, see "Something went wrong", intercept the /api/errors request and assert its fields; click Try again', () => {
  const spec = repoFile("e2e/error-boundary.spec.ts");

  it("opens /?crash=1", () => {
    expect(spec).toContain('page.goto("/?crash=1")');
  });

  it('sees "Something went wrong" with a "Try again" button', () => {
    expect(spec).toContain('getByRole("heading", { name: "Something went wrong" })');
    expect(spec).toContain('getByRole("button", { name: "Try again" })');
  });

  it("intercepts the /api/errors request and asserts its fields", () => {
    expect(spec).toContain('page.route("**/api/errors"');
    for (const field of ["message", "stack", "digest", "url", "version", "scope"]) {
      expect(spec).toContain(`report.${field}`);
    }
    // No personal data leaves the page: no bill, no number of people, no name.
    for (const field of ["bill", "people", "name"]) {
      expect(spec).toContain(`not.toHaveProperty("${field}")`);
    }
  });

  it("clicks Try again and recovers", () => {
    expect(spec).toContain('.getByRole("button", { name: "Try again" }).click()');
    expect(spec).toContain('getByRole("heading", { name: "Tip splitter" })');
  });
});

describe("Run `npm run validate` and `npm run test:e2e` before opening the PR", () => {
  it("defines the validate gate as typecheck + unit tests + production build", () => {
    expect(scripts["validate"]).toBe("npm run typecheck && npm test && npm run build");
    expect(scripts["typecheck"]).toBe("tsc --noEmit");
    expect(scripts["test"]).toBe("vitest run");
    expect(scripts["build"]).toBe("next build");
  });

  it("defines the e2e gate as the Playwright runner over e2e/", () => {
    expect(scripts["test:e2e"]).toBe("playwright test");
    expect(repoFile("playwright.config.ts")).toContain('testDir: "e2e"');
  });

  it("lets the e2e production build honour the test-only ?crash=1 trigger", () => {
    // The e2e run is a production build, so the trigger must be opted in there.
    expect(repoFile("playwright.config.ts")).toContain('NEXT_PUBLIC_ALLOW_CRASH_TRIGGER: "1"');
  });

  it("keeps the crash trigger inert in the real production build", () => {
    expect(repoFile("components/crash-trigger.tsx")).toContain(
      'process.env.NEXT_PUBLIC_ALLOW_CRASH_TRIGGER === "1"'
    );
  });
});
