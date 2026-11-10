import { describe, expect, it } from "vitest";
import { MAX_PEOPLE, MIN_PEOPLE, stepPeople } from "@/lib/people";

describe("stepPeople", () => {
  it("steps People up and down by one", () => {
    expect(stepPeople(1, 1)).toBe(2);
    expect(stepPeople(3, -1)).toBe(2);
    expect(stepPeople(49, 1)).toBe(50);
  });

  it("clamps People to the stepper's limits (1-50)", () => {
    expect(MIN_PEOPLE).toBe(1);
    expect(MAX_PEOPLE).toBe(50);
    expect(stepPeople(MIN_PEOPLE, -1)).toBe(MIN_PEOPLE);
    expect(stepPeople(MAX_PEOPLE, 1)).toBe(MAX_PEOPLE);
    expect(stepPeople(0, -1)).toBe(MIN_PEOPLE);
    expect(stepPeople(999, 1)).toBe(MAX_PEOPLE);
  });

  it("treats an empty or non-numeric People value as the minimum", () => {
    expect(stepPeople(Number(""), 1)).toBe(2);
    expect(stepPeople(Number.NaN, 1)).toBe(2);
  });
});
