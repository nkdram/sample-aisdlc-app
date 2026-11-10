import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Guards the accessibility contract of the design tokens in app/globals.css. */
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Reads a `--token: #rrggbb;` declaration from the :root block. */
function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (!match?.[1]) throw new Error(`token --${name} is missing from app/globals.css`);
  return match[1];
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return 0.2126 * channel(r ?? 0) + 0.7152 * channel(g ?? 0) + 0.0722 * channel(b ?? 0);
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

describe("app/globals.css accessibility tokens", () => {
  it("keeps every text colour at WCAG 2.2 AA (4.5:1) on the surface it is used on", () => {
    const pairs: ReadonlyArray<[string, string, string]> = [
      ["ink on card", token("ink"), token("card")],
      ["ink on page", token("ink"), token("bg")],
      ["muted lead on page", token("muted"), token("bg")],
      ["muted lead on card", token("muted"), token("card")],
      ["danger error on card", token("danger"), token("card")],
      ["white on brand (pressed preset, copy button)", "#ffffff", token("brand")],
      ["disabled copy button text on its background", token("disabled-ink"), token("line")],
    ];

    for (const [label, foreground, background] of pairs) {
      expect(contrast(foreground, background), `${label} must reach 4.5:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives inputs, buttons and textareas an explicit 2px focus-visible outline", () => {
    const rule = /:is\(input, button, textarea\):focus-visible\s*\{([^}]*)\}/.exec(css);
    expect(rule, "a shared :focus-visible rule must exist").not.toBeNull();

    const body = rule?.[1] ?? "";
    expect(body).toContain("outline: 2px solid var(--brand)");
    expect(body).toContain("outline-offset: 2px");
  });

  it("keeps the focus outline at least 3:1 against the surfaces it is drawn on", () => {
    const brand = token("brand");
    expect(contrast(brand, token("card"))).toBeGreaterThanOrEqual(3);
    expect(contrast(brand, token("bg"))).toBeGreaterThanOrEqual(3);
  });
});
