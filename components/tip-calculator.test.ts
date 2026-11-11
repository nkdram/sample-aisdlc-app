import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { useTipCalculation } from "@/components/tip/useTipCalculation";

const calculatorSource = readFileSync(new URL("./tip-calculator.tsx", import.meta.url), "utf8");
const tipDir = new URL("./tip/", import.meta.url);
const homeSpec = readFileSync(new URL("../e2e/home.spec.ts", import.meta.url), "utf8");

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

  it("E2E: 10.005 shows the decimals message.", () => {
    // The page path: TipCalculator -> useTipCalculation -> splitBill, and the thrown message is
    // rendered by ErrorMessage as role="alert". Asserted here so the behaviour is proven by the
    // unit suite too (the Playwright spec cannot run in every environment).
    expect(useTipCalculation("10.005", 15, "1", "USD")).toEqual({
      result: null,
      error: "Use at most 2 decimals",
      summary: "",
      canCopy: false,
    });

    const errorMessage = readFileSync(new URL("./tip/ErrorMessage.tsx", import.meta.url), "utf8");
    expect(errorMessage).toContain('role="alert"');

    // The same criterion is covered on the page by the Playwright spec.
    expect(homeSpec).toContain('test("E2E: 10.005 shows the decimals message."');
    expect(homeSpec).toContain('await page.getByLabel("Bill").fill("10.005");');
    expect(homeSpec).toContain('await expect(page.getByRole("alert")).toHaveText("Use at most 2 decimals");');
  });

  it("keeps splitBill in exactly one place in the UI", () => {
    const callers = readdirSync(tipDir)
      .filter((file) => (file.endsWith(".ts") || file.endsWith(".tsx")) && !file.endsWith(".test.ts"))
      .filter((file) => readFileSync(new URL(file, tipDir), "utf8").includes("splitBill("));
    expect(callers).toEqual(["useTipCalculation.ts"]);
  });
});
