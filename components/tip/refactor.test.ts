import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative as relativePath } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TIP_PRESETS } from "@/lib/tip";
import { useTipCalculation } from "@/components/tip/useTipCalculation";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const tipDir = join(repoRoot, "components", "tip");
const calculatorPath = join(repoRoot, "components", "tip-calculator.tsx");

/** The focused components the ticket asks for. */
const FOCUSED_COMPONENTS = [
  "BillInput",
  "TipPresets",
  "PeopleInput",
  "ErrorMessage",
  "ResultList",
] as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

function relative(path: string): string {
  return relativePath(repoRoot, path);
}

/** Product sources only: this test file names the very symbols it forbids. */
function productFiles(dir: string): string[] {
  return sourceFiles(dir).filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"));
}

describe("components/tip split", () => {
  it("ships the five focused components, each with typed props and no any", () => {
    for (const name of FOCUSED_COMPONENTS) {
      const source = read(join(tipDir, `${name}.tsx`));
      expect(source).toContain(`export function ${name}(`);
      expect(source).toMatch(new RegExp(`interface ${name}Props`));
      expect(source).toContain(`: ${name}Props`);
      expect(source).not.toMatch(/\bany\b/);
    }
  });

  it("keeps business rules out of the presentational components", () => {
    for (const name of FOCUSED_COMPONENTS) {
      const source = read(join(tipDir, `${name}.tsx`));
      expect(source).not.toContain("splitBill");
      expect(source).not.toContain("roundCents");
      expect(source).not.toContain("summaryText");
      expect(source).not.toMatch(/Math\./);
      expect(source).not.toMatch(/Number\(/);
    }
  });

  it("calls splitBill from exactly one place in the UI", () => {
    const callers = productFiles(tipDir)
      .filter((file) => read(file).includes("splitBill("))
      .map(relative);
    expect(callers).toEqual(["components/tip/useTipCalculation.ts"]);
  });

  it("keeps the money formatter in lib/format.ts and nowhere else", () => {
    const files = ["lib", "components", "app"].flatMap((dir) => productFiles(join(repoRoot, dir)));
    const formatters = files.filter((file) => read(file).includes("Intl.NumberFormat")).map(relative);
    expect(formatters).toEqual(["lib/format.ts"]);
  });

  it("keeps the markup contract the e2e specs rely on", () => {
    const bill = read(join(tipDir, "BillInput.tsx"));
    expect(bill).toContain('<label htmlFor="bill">Bill</label>');
    expect(bill).toContain('id="bill"');
    expect(bill).toContain('inputMode="decimal"');
    expect(bill).toContain('placeholder="0.00"');

    const people = read(join(tipDir, "PeopleInput.tsx"));
    expect(people).toContain('<label htmlFor="people">People</label>');
    expect(people).toContain('id="people"');
    expect(people).toContain('inputMode="numeric"');

    const presets = read(join(tipDir, "TipPresets.tsx"));
    expect(presets).toContain('role="group"');
    expect(presets).toContain('aria-label="Tip percentage"');
    expect(presets).toContain("aria-pressed={tipPercent === p}");
    expect(presets).toContain("{p}%");

    const error = read(join(tipDir, "ErrorMessage.tsx"));
    expect(error).toContain('role="alert"');
    expect(error).toContain('className="error"');

    const result = read(join(tipDir, "ResultList.tsx"));
    expect(result).toContain('aria-live="polite"');
    for (const testId of ["tip", "total", "per-person"]) {
      expect(result).toContain(`data-testid="${testId}"`);
    }
    expect(result).toContain("money.format");

    const copy = read(join(tipDir, "CopySummary.tsx"));
    expect(copy).toContain('data-testid="copy-summary"');
    expect(copy).toContain('aria-live="polite"');
    expect(copy).toContain("disabled={!canCopy}");
    expect(copy).toContain('id="copy-fallback"');
    expect(copy).toContain('readOnly');
    expect(copy).toContain('"Copied"');
    expect(copy).toContain('"Copy summary"');
  });

  it("leaves TipCalculator holding state and composition only", () => {
    const calculator = read(calculatorPath);
    expect(calculator).toContain("useState");
    expect(calculator).not.toContain("splitBill");
    expect(calculator).not.toContain("navigator.clipboard");
    expect(calculator).not.toContain("Intl.NumberFormat");
  });

  it("derives the same result, error and summary as before the split", () => {
    // useTipCalculation holds no React state, so it can be exercised as a plain function.
    expect(useTipCalculation("100", 15, "4")).toEqual({
      result: { tip: 15, total: 115, perPerson: 28.75 },
      error: null,
      summary: "Bill $100.00 + tip $15.00 (15%) = $115.00. Each of 4 pays $28.75.",
      canCopy: true,
    });

    expect(useTipCalculation("", 15, "1")).toEqual({
      result: null,
      error: null,
      summary: "",
      canCopy: false,
    });

    expect(useTipCalculation("10", 15, "0")).toEqual({
      result: null,
      error: "At least one person must pay",
      summary: "",
      canCopy: false,
    });
  });

  it("adds none of the behaviour owned by the conflicting feature tickets", () => {
    expect([...TIP_PRESETS]).toEqual([10, 15, 20]);
    for (const file of productFiles(tipDir)) {
      const source = read(file);
      expect(source).not.toMatch(/onKeyDown|onKeyUp|onKeyPress/);
      expect(source).not.toMatch(/currency|shares|itemised|itemized|stepper/i);
    }
  });
});
