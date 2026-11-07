import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Ticket SAMPLE-AISDLC-APP-22 is size S, priority P1. Ticket metadata is not
 * behaviour, so what is provable in code is the constraint that keeps this
 * change inside that band and the rule that would blow it up: no new
 * dependencies (AGENTS.md), and the reporting seam built on the platform
 * instead of a third-party client.
 */

interface PackageJson {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

function repoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const pkg = JSON.parse(repoFile("package.json")) as PackageJson;

describe("Size: S · Priority: P1", () => {
  it("adds no dependency: error reporting uses the platform, not a library", () => {
    // Exactly the three runtime packages the tip splitter already shipped with.
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual(["next", "react", "react-dom"]);
  });

  it("adds no test dependency beyond the ones the gates already use", () => {
    expect(Object.keys(pkg.devDependencies ?? {}).sort()).toEqual([
      "@playwright/test",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "typescript",
      "vitest",
    ]);
  });

  it("keeps the reporting seam free of imports, so it is platform fetch only", () => {
    const source = repoFile("lib/report-error.ts");

    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).toContain('fetch("/api/errors"');
  });

  it("keeps the route handler dependent on this app alone", () => {
    const source = repoFile("app/api/errors/route.ts");
    const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);

    expect(imports).toEqual(["@/lib/report-error"]);
  });
});
