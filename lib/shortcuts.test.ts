import { describe, expect, it } from "vitest";
import { keyToAction } from "@/lib/shortcuts";

describe("keyToAction", () => {
  it("1, 2 and 3 select the first, second and third tip preset; + and - change People with the stepper's limits (1-50).", () => {
    expect(keyToAction("1", false)).toEqual({ kind: "preset", index: 0 });
    expect(keyToAction("2", false)).toEqual({ kind: "preset", index: 1 });
    expect(keyToAction("3", false)).toEqual({ kind: "preset", index: 2 });
    expect(keyToAction("+", false)).toEqual({ kind: "stepPeople", delta: 1 });
    expect(keyToAction("-", false)).toEqual({ kind: "stepPeople", delta: -1 });
  });

  it("/ moves focus to the Bill input; ? opens a dialog listing all shortcuts; Escape closes it and returns focus.", () => {
    expect(keyToAction("/", false)).toEqual({ kind: "focusBill" });
    expect(keyToAction("?", false)).toEqual({ kind: "openHelp" });
    expect(keyToAction("Escape", false)).toEqual({ kind: "closeHelp" });
  });

  it("Shortcuts are ignored while typing in an input (except Escape).", () => {
    for (const key of ["1", "2", "3", "+", "-", "/", "?"]) {
      expect(keyToAction(key, true)).toBeNull();
    }
    expect(keyToAction("Escape", true)).toEqual({ kind: "closeHelp" });
  });

  it("returns null for keys that are not shortcuts", () => {
    for (const key of ["0", "4", "a", "Enter", "Tab", " ", "Shift"]) {
      expect(keyToAction(key, false)).toBeNull();
    }
  });
});
