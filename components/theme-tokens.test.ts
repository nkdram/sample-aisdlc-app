import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The theme is pure CSS: app/globals.css owns the tokens and the dark override.
// These assertions are the fast safety net; e2e/dark-mode.spec.ts proves the
// rendered colours and contrast in a real browser.

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** The declarations of the first block whose selector matches `selector`. */
function block(selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `missing block: ${selector}`).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function token(declarations: string, name: string): string | undefined {
  return declarations.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
}

const LIGHT_TOKENS = ["bg", "card", "ink", "muted", "brand", "danger", "line", "focus"] as const;

describe("theme tokens", () => {
  it("defines every colour token on :root, including a focus colour", () => {
    const root = block(":root");
    for (const name of LIGHT_TOKENS) {
      expect(token(root, name), `--${name} on :root`).toBeTruthy();
    }
  });

  it("overrides the colour tokens inside a prefers-color-scheme: dark media query", () => {
    const mediaStart = css.indexOf("@media (prefers-color-scheme: dark)");
    expect(mediaStart).toBeGreaterThanOrEqual(0);

    const dark = block("@media (prefers-color-scheme: dark)");
    for (const name of LIGHT_TOKENS) {
      expect(token(dark, name), `--${name} in the dark block`).toBeTruthy();
    }

    // Dark means a dark page and light text, not just different values.
    expect(token(dark, "bg")).toBe("#14101f");
    expect(token(dark, "ink")).toBe("#f2eefc");
    // --brand is unchanged so the hard-coded #fff labels on it keep their contrast.
    expect(token(dark, "brand")).toBe(token(block(":root"), "brand"));
  });

  it("draws a visible focus outline from the focus token", () => {
    const focusRule = block(":focus-visible");
    expect(focusRule).toContain("outline:");
    expect(focusRule).toContain("var(--focus)");
  });

  it("keeps components free of hard-coded colours: they read the tokens", () => {
    // Only the two white labels on the --brand background may be literal.
    const literals = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    const allowed = new Set(["#fff"]);
    const unexpected = literals.filter((value) => !allowed.has(value.toLowerCase()));
    // Every remaining literal must be a token definition, not a rule body.
    for (const value of unexpected) {
      expect(css).toMatch(new RegExp(`--[a-z-]+:\\s*${value};`));
    }
  });
});
