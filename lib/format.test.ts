import { describe, expect, it } from "vitest";
import { money } from "./format";

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
