import { describe, expect, it } from "vitest";
import { useTipCalculation } from "./useTipCalculation";

describe("useTipCalculation with a currency", () => {
  it("The choice changes formatting only, never the calculation", () => {
    const usd = useTipCalculation("100", 15, "4", "USD");
    const eur = useTipCalculation("100", 15, "4", "EUR");
    const gbp = useTipCalculation("100", 15, "4", "GBP");

    // Identical numbers in every currency.
    expect(usd.result).toEqual({ tip: 15, total: 115, perPerson: 28.75 });
    expect(eur.result).toEqual(usd.result);
    expect(gbp.result).toEqual(usd.result);

    // Only the formatting differs.
    expect(usd.summary).toBe("Bill $100.00 + tip $15.00 (15%) = $115.00. Each of 4 pays $28.75.");
    expect(eur.summary).toBe(
      "Bill 100,00\u00a0€ + tip 15,00\u00a0€ (15%) = 115,00\u00a0€. Each of 4 pays 28,75\u00a0€."
    );
    expect(gbp.summary).toBe("Bill £100.00 + tip £15.00 (15%) = £115.00. Each of 4 pays £28.75.");
  });

  it("The bill input accepts a comma as the decimal separator when EUR is selected", () => {
    const comma = useTipCalculation("42,50", 15, "1", "EUR");
    const dot = useTipCalculation("42.50", 15, "1", "EUR");

    expect(comma.error).toBeNull();
    expect(comma.result).toEqual(dot.result);
    expect(comma.result).toEqual({ tip: 6.38, total: 48.88, perPerson: 48.88 });
    expect(comma.summary).toBe(dot.summary);
  });

  it("rejects a comma decimal separator outside EUR", () => {
    expect(useTipCalculation("42,50", 15, "1", "USD")).toEqual({
      result: null,
      error: "Bill must be zero or more",
      summary: "",
      canCopy: false,
    });
  });

  it("keeps the empty and invalid states unchanged", () => {
    expect(useTipCalculation("", 15, "1", "EUR")).toEqual({
      result: null,
      error: null,
      summary: "",
      canCopy: false,
    });
    expect(useTipCalculation("10", 15, "0", "EUR")).toEqual({
      result: null,
      error: "At least one person must pay",
      summary: "",
      canCopy: false,
    });
  });
});
