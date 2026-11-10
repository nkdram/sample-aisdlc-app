import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("../app/history/page.tsx", import.meta.url), "utf8");

/** Server-only APIs that would mean the history page persists data on the server. */
const SERVER_PERSISTENCE = [
  /from "node:/,
  /require\(/,
  /next\/headers/,
  /next\/server/,
  /cookies\(\)/,
  /fetch\(/,
  /prisma|drizzle|kysely|mongoose|pg\b/i,
  /export const dynamic/,
  /export async function generateMetadata/,
];

describe("app/history/page.tsx", () => {
  it("app/history/page.tsx is a client page; no server persistence", () => {
    // A client page: the directive must be the first statement in the module.
    expect(pageSource.startsWith('"use client";')).toBe(true);

    // No server-only imports or data access: history lives in localStorage only.
    for (const pattern of SERVER_PERSISTENCE) {
      expect(pageSource, `app/history/page.tsx must not use ${pattern}`).not.toMatch(pattern);
    }

    // The only storage it touches is the device-local history hook.
    expect(pageSource).toContain("useHistory");
    expect(pageSource).not.toContain("localStorage");
  });
});
