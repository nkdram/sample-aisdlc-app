import { describe, expect, it } from "vitest";
import { money, formatMoney } from "./format";
import { CURRENCIES, parseBillAmount } from "./currency";

describe("money", () => {
  it("formats amounts as US dollars with two decimals", () => {
    expect(money.format(0)).toBe("$0.00");
    expect(money.format(15)).toBe("$15.00");
    expect(money.format(28.75)).toBe("$28.75");
  });

  it("can be passed as a bare formatter function", () => {
    const format = money.format;
    expect(format(115)).toBe("$115.00");
  });
});

describe("formatMoney", () => {
  it("Amounts use Intl.NumberFormat: en-US for USD, de-DE for EUR, en-GB for GBP", () => {
    expect(formatMoney("USD").resolvedOptions().locale).toBe("en-US");
    expect(formatMoney("EUR").resolvedOptions().locale).toBe("de-DE");
    expect(formatMoney("GBP").resolvedOptions().locale).toBe("en-GB");

    expect(formatMoney("USD").format(28.75)).toBe("$28.75");
    expect(formatMoney("EUR").format(28.75)).toBe("28,75\u00a0€");
    expect(formatMoney("GBP").format(28.75)).toBe("£28.75");
  });

  it("keeps the USD output byte-identical to the shared money formatter", () => {
    for (const amount of [0, 15, 28.75, 115, 1234.5]) {
      expect(formatMoney("USD").format(amount)).toBe(money.format(amount));
    }
  });

  it("offers USD (default), EUR and GBP in that order", () => {
    expect([...CURRENCIES]).toEqual(["USD", "EUR", "GBP"]);
  });
});

describe("parseBillAmount", () => {
  it('Unit: formatter mapping and comma parsing ("42,50" -> 42.5 for EUR).', () => {
    // Formatter mapping: one locale per currency.
    expect(formatMoney("USD").resolvedOptions().locale).toBe("en-US");
    expect(formatMoney("EUR").resolvedOptions().locale).toBe("de-DE");
    expect(formatMoney("GBP").resolvedOptions().locale).toBe("en-GB");

    // Comma parsing: the same typed amount, read in the selected currency.
    expect(parseBillAmount("42,50", "EUR")).toBe(42.5);
    expect(parseBillAmount("42.50", "EUR")).toBe(42.5);
    expect(parseBillAmount("42.50", "USD")).toBe(42.5);
    expect(parseBillAmount("42.50", "GBP")).toBe(42.5);
  });

  it("The bill input accepts a comma as the decimal separator when EUR is selected", () => {
    expect(parseBillAmount("42,50", "EUR")).toBe(42.5);
    expect(parseBillAmount("100", "EUR")).toBe(100);
    expect(parseBillAmount("0,05", "EUR")).toBe(0.05);
  });

  it("keeps the dot as the decimal separator for every currency", () => {
    for (const currency of CURRENCIES) {
      expect(parseBillAmount("42.50", currency)).toBe(42.5);
      expect(parseBillAmount("100", currency)).toBe(100);
    }
  });

  it("returns NaN for input that is not a number", () => {
    expect(parseBillAmount("abc", "USD")).toBeNaN();
    expect(parseBillAmount("abc", "EUR")).toBeNaN();
    expect(parseBillAmount("42,50", "USD")).toBeNaN();
    expect(parseBillAmount("42,50", "GBP")).toBeNaN();
  });

  it("The choice changes formatting only, never the calculation", () => {
    // The same typed amount parses to the same number in every currency, so
    // splitBill sees identical input and produces identical results.
    const typed = "42.50";
    const amounts = CURRENCIES.map((currency) => parseBillAmount(typed, currency));
    expect(new Set(amounts)).toEqual(new Set([42.5]));
  });
});
