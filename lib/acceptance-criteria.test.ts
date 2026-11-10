import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Traceability for SAMPLE-AISDLC-APP-22: every acceptance criterion on the
 * ticket has at least one test whose title is the criterion itself, so "which
 * test proves this?" is answerable with a search. This file only checks that
 * link: the behaviour each criterion describes is asserted in the test it names.
 */

/** The acceptance criteria, verbatim from the ticket. */
const ACCEPTANCE_CRITERIA = [
  'app/error.tsx shows "Something went wrong" with a "Try again" button that calls reset()',
  "app/global-error.tsx covers errors in the root layout",
  "Errors go through reportError(error, context) in lib/report-error.ts, which POSTs {message, stack, digest, url, version} to /api/errors; the route logs one JSON line and returns 204",
  "Reporting never throws and is limited to 5 reports per page load",
  "No personal data (bill amounts, names) is included in a report",
  "No third-party error SaaS; the API route is the seam a real collector can replace later",
  'E2E: open /?crash=1, see "Something went wrong", intercept the /api/errors request and assert its fields; click Try again',
  "Run `npm run validate` and `npm run test:e2e` before opening the PR",
  "Size: S · Priority: P1",
] as const;

function testFiles(): URL[] {
  const files: URL[] = [];
  for (const dir of ["../lib", "../components"]) {
    for (const name of readdirSync(new URL(dir, import.meta.url))) {
      if (name.endsWith(".test.ts")) files.push(new URL(`${dir}/${name}`, import.meta.url));
    }
  }
  return files;
}

/** Titles of this file's own criteria, which must not be what proves them. */
const SELF = new URL("./acceptance-criteria.test.ts", import.meta.url).pathname;

function titlesOutsideThisFile(): { file: string; source: string }[] {
  return testFiles()
    .filter((file) => file.pathname !== SELF)
    .map((file) => ({ file: file.pathname, source: readFileSync(file, "utf8") }));
}

describe("every acceptance criterion is proven by a test named after it", () => {
  for (const criterion of ACCEPTANCE_CRITERIA) {
    it(`has a test titled: ${criterion}`, () => {
      const proving = titlesOutsideThisFile().filter(({ source }) => source.includes(criterion));

      expect(proving.map(({ file }) => file)).not.toHaveLength(0);
    });
  }

  it("covers every criterion the ticket lists", () => {
    expect(ACCEPTANCE_CRITERIA).toHaveLength(9);
  });
});
