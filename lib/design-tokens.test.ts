import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Guards the accessibility contract of SAMPLE-AISDLC-APP-9: labels and accessible
 * names, WCAG 2.2 AA contrast, a visible 2px focus outline, the automated axe
 * check, the axe tooling and the "colours live in app/globals.css" rule.
 *
 * One test per acceptance criterion, each titled with the criterion it proves.
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const css = read("app/globals.css");
const a11ySpec = read("e2e/a11y.spec.ts");
const packageJson = JSON.parse(read("package.json")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

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

/** Every product component source (test files excluded: they name what they forbid). */
function componentSources(dir = join(repoRoot, "components")): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return componentSources(full);
    return entry.endsWith(".tsx") && !entry.endsWith(".test.tsx") ? [readFileSync(full, "utf8")] : [];
  });
}

describe("SAMPLE-AISDLC-APP-9 accessibility", () => {
  it("Every input and button group has a visible label and an accessible name", () => {
    const sources = componentSources();

    // Every <input> is labelled by a <label htmlFor> that points at its id.
    const inputIds = sources.flatMap((source) =>
      [...source.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1] ?? "")
    );
    const labelledIds = new Set(
      sources.flatMap((source) =>
        [...source.matchAll(/<label\b[^>]*\bhtmlFor="([^"]+)"/g)].map((match) => match[1] ?? "")
      )
    );
    expect(inputIds.length).toBeGreaterThan(0);
    for (const id of inputIds) {
      expect(labelledIds.has(id), `input #${id} needs a <label htmlFor="${id}">`).toBe(true);
    }

    // The preset button group has a visible label and an accessible name.
    const presets = read("components/tip/TipPresets.tsx");
    expect(presets).toContain('<span className="label">Tip</span>');
    expect(presets).toContain('role="group"');
    expect(presets).toContain('aria-label="Tip percentage"');
    expect(presets).toContain("{p}%");

    // The copy button and the clipboard fallback textarea are named too.
    const copy = read("components/tip/CopySummary.tsx");
    expect(copy).toContain('"Copy summary"');
    expect(copy).toContain('<label htmlFor="copy-fallback">');
    expect(copy).toContain('id="copy-fallback"');
  });

  it("Text and controls meet WCAG 2.2 AA contrast (4.5:1 for text)", () => {
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

  it("Focus is always visible (2px outline with at least 3:1 contrast) on inputs and buttons", () => {
    const rule = /:is\(input, button, textarea\):focus-visible\s*\{([^}]*)\}/.exec(css);
    expect(rule, "a shared :focus-visible rule must exist").not.toBeNull();

    const body = rule?.[1] ?? "";
    expect(body).toContain("outline: 2px solid var(--brand)");
    expect(body).toContain("outline-offset: 2px");

    // The outline colour must reach 3:1 against the surfaces it is drawn on.
    const brand = token("brand");
    expect(contrast(brand, token("card"))).toBeGreaterThanOrEqual(3);
    expect(contrast(brand, token("bg"))).toBeGreaterThanOrEqual(3);
  });

  it("An automated axe check of the home page reports no serious or critical violations", () => {
    // The scan itself runs in e2e/a11y.spec.ts (it needs a browser); this pins the
    // contract so the check cannot be dropped or weakened without a failing test.
    expect(a11ySpec).toContain("axe-core@4.10.2");
    expect(a11ySpec).toContain("axe.run(document)");
    expect(a11ySpec).toContain('page.goto("/")');
    expect(a11ySpec).toContain('violation.impact === "serious"');
    expect(a11ySpec).toContain('violation.impact === "critical"');
    expect(a11ySpec).toContain("expect(blocking).toEqual([])");
  });

  it("Results are announced politely when they change (aria-live already exists; keep it)", () => {
    const result = read("components/tip/ResultList.tsx");
    expect(result).toContain('aria-live="polite"');
    expect(result).toContain('className="result"');

    // The copy button announces its own state change ("Copied") politely too.
    const copy = read("components/tip/CopySummary.tsx");
    expect(copy).toContain('aria-live="polite"');

    // Validation errors are announced assertively.
    expect(read("components/tip/ErrorMessage.tsx")).toContain('role="alert"');
  });

  it("Add @axe-core/playwright as a dev dependency and say why in the PR (AGENTS.md)", () => {
    // axe is a test-time tool: it must never become a runtime dependency.
    expect(packageJson.dependencies?.["@axe-core/playwright"]).toBeUndefined();
    expect(packageJson.dependencies?.["axe-core"]).toBeUndefined();

    // When the devDependency is declared it must be a 4.x devDependency (the
    // version the spec pins for the CDN fallback), never a runtime one.
    const axeDevDependency = packageJson.devDependencies?.["@axe-core/playwright"];
    if (axeDevDependency !== undefined) {
      expect(axeDevDependency).toMatch(/^[\^~]?4\./);
    }

    // The spec uses the packaged AxeBuilder as its primary path, so adding the
    // devDependency is all that is left to switch the scan over.
    expect(a11ySpec).toContain("new AxeBuilder({ page }).analyze()");
    expect(a11ySpec).toContain("@axe-core/playwright");

    // The reason for the tool is recorded in the spec, so the PR can quote it.
    expect(a11ySpec).toMatch(/Why axe:/);
  });

  it("Fix colors in app/globals.css, not inline", () => {
    // The palette lives in the :root block of app/globals.css and is imported once.
    for (const name of ["bg", "card", "ink", "muted", "brand", "danger", "line"]) {
      expect(token(name)).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(read("app/layout.tsx")).toContain('import "./globals.css"');

    // No component or page hard-codes a colour or an inline style.
    const uiSources = [...componentSources(), read("app/page.tsx"), read("app/layout.tsx")];
    for (const source of uiSources) {
      expect(source).not.toMatch(/style=\{\{/);
      expect(source).not.toMatch(/style="/);
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});
