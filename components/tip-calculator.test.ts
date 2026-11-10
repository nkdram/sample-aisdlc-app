import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const calculatorSource = readFileSync(new URL("./tip-calculator.tsx", import.meta.url), "utf8");
const tipDir = new URL("./tip/", import.meta.url);

function lineCount(text: string): number {
  return text.replace(/\n$/, "").split("\n").length;
}

describe("TipCalculator", () => {
  it("stays under 40 lines so it only holds state and composition", () => {
    expect(lineCount(calculatorSource)).toBeLessThan(40);
  });

  it("composes the focused components from components/tip", () => {
    for (const name of ["BillInput", "TipPresets", "PeopleInput", "ErrorMessage", "ResultList"]) {
      expect(calculatorSource).toContain(`<${name}`);
    }
  });

  it("keeps splitBill in exactly one place in the UI", () => {
    const callers = readdirSync(tipDir)
      .filter((file) => (file.endsWith(".ts") || file.endsWith(".tsx")) && !file.endsWith(".test.ts"))
      .filter((file) => readFileSync(new URL(file, tipDir), "utf8").includes("splitBill("));
    expect(callers).toEqual(["useTipCalculation.ts"]);
  });
});
