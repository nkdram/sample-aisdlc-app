import { describe, expect, it } from "vitest";
import { roundCents, splitBill, summaryText, TipInputError } from "./tip";

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("roundCents", () => {
  it.each([
    [1.005, 1.01],
    [-1.005, -1.01],
    [2.675, 2.68],
    [1000.005, 1000.01],
    [1234567.895, 1234567.9],
    [0, 0],
    [-0, 0],
    [-0.001, 0],
    [0.004, 0],
    [0.005, 0.01],
    [1e-7, 0],
    [5e-8, 0],
    [-1e-7, 0],
    [1e19, 1e19],
    [1e20, 1e20],
    [1e21, 1e21],
  ])("rounds %f to %f", (input, expected) => {
    expect(roundCents(input)).toBe(expected);
  });

  it("throws TipInputError for non-finite input", () => {
    expect(() => roundCents(NaN)).toThrow(TipInputError);
    expect(() => roundCents(NaN)).toThrow("Amount must be a finite number");
    expect(() => roundCents(Infinity)).toThrow(TipInputError);
    expect(() => roundCents(Infinity)).toThrow("Amount must be a finite number");
    expect(() => roundCents(-Infinity)).toThrow(TipInputError);
    expect(() => roundCents(-Infinity)).toThrow("Amount must be a finite number");
  });

  it("round-trips 10,000 seeded random cent amounts", () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 10_000; i++) {
      const cents = Math.floor(rng() * 1_000_001);
      const amount = cents / 100;
      expect(roundCents(amount)).toBe(amount);
    }
  });
});

describe("summaryText", () => {
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  it("formats the shareable summary for a valid split", () => {
    const input = { bill: 100, tipPercent: 15, people: 4 };
    const result = splitBill(input);
    expect(summaryText(result, input, money.format)).toBe(
      "Bill $100.00 + tip $15.00 (15%) = $115.00. Each of 4 pays $28.75."
    );
  });

  it("formats a zero-bill summary", () => {
    const input = { bill: 0, tipPercent: 0, people: 1 };
    const result = splitBill(input);
    expect(summaryText(result, input, money.format)).toBe(
      "Bill $0.00 + tip $0.00 (0%) = $0.00. Each of 1 pays $0.00."
    );
  });
});

describe("splitBill", () => {
  it("adds the tip and splits the total", () => {
    expect(splitBill({ bill: 100, tipPercent: 15, people: 4 })).toEqual({ tip: 15, total: 115, perPerson: 28.75 });
  });

  it("rounds to cents", () => {
    expect(splitBill({ bill: 10, tipPercent: 10, people: 3 })).toEqual({ tip: 1, total: 11, perPerson: 3.67 });
    expect(roundCents(1.005)).toBe(1.01);
  });

  it("allows a zero bill and a zero tip", () => {
    expect(splitBill({ bill: 0, tipPercent: 0, people: 1 })).toEqual({ tip: 0, total: 0, perPerson: 0 });
  });

  it("rejects invalid input", () => {
    expect(() => splitBill({ bill: -1, tipPercent: 10, people: 1 })).toThrow(TipInputError);
    expect(() => splitBill({ bill: 10, tipPercent: 101, people: 1 })).toThrow("Tip must be between 0 and 100%");
    expect(() => splitBill({ bill: 10, tipPercent: 10, people: 0 })).toThrow("At least one person must pay");
    expect(() => splitBill({ bill: 10, tipPercent: 10, people: 1.5 })).toThrow(TipInputError);
  });
});
