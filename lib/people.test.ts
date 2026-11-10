import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_PEOPLE, MIN_PEOPLE, stepPeople } from "@/lib/people";

describe("stepPeople", () => {
  it("steps People up and down by one", () => {
    expect(stepPeople(1, 1)).toBe(2);
    expect(stepPeople(3, -1)).toBe(2);
    expect(stepPeople(49, 1)).toBe(50);
  });

  it("clamps People to the stepper's limits (1-50)", () => {
    expect(MIN_PEOPLE).toBe(1);
    expect(MAX_PEOPLE).toBe(50);
    expect(stepPeople(MIN_PEOPLE, -1)).toBe(MIN_PEOPLE);
    expect(stepPeople(MAX_PEOPLE, 1)).toBe(MAX_PEOPLE);
    expect(stepPeople(0, -1)).toBe(MIN_PEOPLE);
    expect(stepPeople(999, 1)).toBe(MAX_PEOPLE);
  });

  it("steps from the minimum when People is empty or non-numeric", () => {
    expect(stepPeople(Number(""), 1)).toBe(2);
    expect(stepPeople(Number.NaN, 1)).toBe(2);
  });

  it("never steps below the minimum when People is empty or non-numeric", () => {
    expect(stepPeople(Number(""), -1)).toBe(MIN_PEOPLE);
    expect(stepPeople(Number.NaN, -1)).toBe(MIN_PEOPLE);
  });
});

/**
 * The ticket's gate criterion, proven in-process: the Playwright suite cannot run in
 * every environment, so this test keeps the e2e contract checkable where it can be.
 */
describe("Run `npm run validate` and `npm run test:e2e` before opening the PR.", () => {
  const repoRoot = new URL("../", import.meta.url);
  const read = (path: string) => readFileSync(new URL(path, repoRoot), "utf8");

  it("keeps the validate and e2e gates wired to the scripts the ticket names", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts.validate).toBe("npm run typecheck && npm test && npm run build");
    expect(pkg.scripts["test:e2e"]).toBe("playwright test");
  });

  it("ships a Playwright spec with one test per acceptance criterion, titled verbatim", () => {
    const spec = read("e2e/shortcuts.spec.ts");
    for (const criterion of [
      "1, 2 and 3 select the first, second and third tip preset; + and - change People with the stepper's limits (1-50).",
      "/ moves focus to the Bill input; ? opens a dialog listing all shortcuts; Escape closes it and returns focus.",
      "Shortcuts are ignored while typing in an input (except Escape).",
      "Changes made by shortcuts are announced through the existing aria-live result.",
    ]) {
      expect(spec).toContain(`test("${criterion}"`);
    }
    // The spec drives the real page, so it must go through the app's own route and keys.
    expect(spec).toContain('page.goto("/")');
    expect(spec).toContain('page.keyboard.press("3")');
    expect(spec).toContain('page.keyboard.press("?")');
  });
});
