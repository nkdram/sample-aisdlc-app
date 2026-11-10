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

/**
 * Behaviour owned by the tickets that rebase on this refactor. None of it may
 * land here: this change is a pure move-and-extract.
 */
const CONFLICTING_FEATURES: ReadonlyArray<{ ticket: string; pattern: RegExp }> = [
  { ticket: "Add a custom tip percentage", pattern: /custom/i },
  { ticket: "People stepper buttons", pattern: /stepper|increment|decrement/i },
  { ticket: "Show the tip per person", pattern: /tipPerPerson|tip per person/i },
  { ticket: "Round the per-person amount up", pattern: /roundUp|round up|Math\.ceil/i },
  { ticket: "Support euro and pound", pattern: /euro|pound|gbp|eur\b/i },
  { ticket: "Split unevenly by shares", pattern: /\bshares\b|\bweights?\b/i },
  { ticket: "Itemised bills", pattern: /itemis|itemiz/i },
  { ticket: "Keyboard shortcuts", pattern: /onKeyDown|onKeyUp|onKeyPress|keydown/i },
];

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

function lineCount(text: string): number {
  return text.replace(/\n$/, "").split("\n").length;
}

describe("components/tip split", () => {
  it("ships the five focused components in components/tip: BillInput, TipPresets, PeopleInput, ErrorMessage and ResultList; TipCalculator only holds state and composes them", () => {
    for (const name of FOCUSED_COMPONENTS) {
      const source = read(join(tipDir, `${name}.tsx`));
      expect(source).toContain(`export function ${name}(`);
    }

    const calculator = read(calculatorPath);
    for (const name of FOCUSED_COMPONENTS) {
      expect(calculator).toContain(`<${name}`);
    }
    // State and composition only: no rules, no formatting, no clipboard work.
    expect(calculator).toContain("useState");
    expect(calculator).not.toContain("splitBill");
    expect(calculator).not.toContain("summaryText");
    expect(calculator).not.toContain("navigator.clipboard");
    expect(calculator).not.toContain("Intl.NumberFormat");
    expect(calculator).not.toMatch(/Math\./);
  });

  it("no visible or behavioural change: same labels, test ids, aria attributes, focus order and text", () => {
    // Markup contract, in document order, exactly as the pre-refactor component rendered it.
    const bill = read(join(tipDir, "BillInput.tsx"));
    expect(bill).toContain('<label htmlFor="bill">Bill</label>');
    expect(bill).toContain('id="bill"');
    expect(bill).toContain('inputMode="decimal"');
    expect(bill).toContain('placeholder="0.00"');

    const presets = read(join(tipDir, "TipPresets.tsx"));
    expect(presets).toContain('<span className="label">Tip</span>');
    expect(presets).toContain('role="group"');
    expect(presets).toContain('aria-label="Tip percentage"');
    expect(presets).toContain("aria-pressed={tipPercent === p}");
    expect(presets).toContain("{p}%");

    const people = read(join(tipDir, "PeopleInput.tsx"));
    expect(people).toContain('<label htmlFor="people">People</label>');
    expect(people).toContain('id="people"');
    expect(people).toContain('inputMode="numeric"');

    const error = read(join(tipDir, "ErrorMessage.tsx"));
    expect(error).toContain('role="alert"');
    expect(error).toContain('className="error"');

    const result = read(join(tipDir, "ResultList.tsx"));
    expect(result).toContain('className="result"');
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
    expect(copy).toContain("readOnly");
    expect(copy).toContain('"Copied"');
    expect(copy).toContain('"Copy summary"');

    // Focus order is the order the calculator composes the fields in.
    const calculator = read(calculatorPath);
    const order = ["<BillInput", "<TipPresets", "<PeopleInput", "<ResultList", "<CopySummary"].map((tag) =>
      calculator.indexOf(tag)
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((index) => index >= 0)).toBe(true);

    // Same derived values and text as before the split.
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

  it("each new component takes typed props (no any) and owns no business rules; splitBill is still called only from TipCalculator", () => {
    for (const name of FOCUSED_COMPONENTS) {
      const source = read(join(tipDir, `${name}.tsx`));
      expect(source).toMatch(new RegExp(`interface ${name}Props`));
      expect(source).toContain(`: ${name}Props`);
      expect(source).not.toMatch(/\bany\b/);
      expect(source).not.toContain("splitBill");
      expect(source).not.toContain("roundCents");
      expect(source).not.toContain("summaryText");
      expect(source).not.toMatch(/Math\./);
      expect(source).not.toMatch(/Number\(/);
    }

    // splitBill is called from exactly one UI file, and the calculator itself never calls it.
    const callers = productFiles(tipDir)
      .filter((file) => read(file).includes("splitBill("))
      .map(relative);
    expect(callers).toEqual(["components/tip/useTipCalculation.ts"]);
    expect(read(calculatorPath)).not.toContain("splitBill");
  });

  it("components/tip-calculator.tsx is under 40 lines", () => {
    expect(lineCount(read(calculatorPath))).toBeLessThan(40);
  });

  it("keeps the money formatter in one place (lib/format.ts)", () => {
    const files = ["lib", "components", "app"].flatMap((dir) => productFiles(join(repoRoot, dir)));
    const formatters = files.filter((file) => read(file).includes("Intl.NumberFormat")).map(relative);
    expect(formatters).toEqual(["lib/format.ts"]);
  });

  it("pure move-and-extract: no feature ticket behaviour is combined in this change", () => {
    // The presets are still the three the app shipped with.
    expect([...TIP_PRESETS]).toEqual([10, 15, 20]);

    // The calculator still holds exactly the three inputs it held before.
    const calculator = read(calculatorPath);
    expect(calculator.match(/useState[<(]/g)).toHaveLength(3);

    // No dependency was added for the refactor.
    const pkg = JSON.parse(read(join(repoRoot, "package.json"))) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies).sort()).toEqual(["next", "react", "react-dom"]);
  });

  it("conflicts with: Add a custom tip percentage, People stepper buttons, Show the tip per person, Round the per-person amount up, Support euro and pound, Split unevenly by shares, Itemised bills, Keyboard shortcuts — none of them is present", () => {
    const files = [calculatorPath, ...productFiles(tipDir)];
    for (const file of files) {
      const source = read(file);
      for (const { ticket, pattern } of CONFLICTING_FEATURES) {
        expect(source, `${relative(file)} must not implement "${ticket}"`).not.toMatch(pattern);
      }
    }
  });
});
