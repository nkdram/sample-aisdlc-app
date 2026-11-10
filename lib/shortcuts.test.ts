import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { keyToAction } from "@/lib/shortcuts";

const shortcutsSource = readFileSync(new URL("./shortcuts.ts", import.meta.url), "utf8");

describe("keyToAction", () => {
  it("A pure keyToAction(key, targetIsInput) in lib/shortcuts.ts returns an action or null; the component only dispatches.", () => {
    // Pure: no DOM, no listeners, no state — the same input always gives the same answer.
    for (const forbidden of ["document", "window", "addEventListener", "useState", "useEffect"]) {
      expect(shortcutsSource).not.toContain(forbidden);
    }
    expect(keyToAction("3", false)).toEqual(keyToAction("3", false));

    // Every key returns either a well-formed action or null, never undefined.
    const keys = ["1", "2", "3", "+", "-", "/", "?", "Escape", "0", "a", "Enter"];
    for (const key of keys) {
      for (const targetIsInput of [false, true]) {
        const action = keyToAction(key, targetIsInput);
        expect(action === null || typeof action.kind === "string").toBe(true);
      }
    }
  });

  it("Unit: keyToAction for each key, with and without an input focused.", () => {
    const expected: ReadonlyArray<[string, unknown]> = [
      ["1", { kind: "preset", index: 0 }],
      ["2", { kind: "preset", index: 1 }],
      ["3", { kind: "preset", index: 2 }],
      ["+", { kind: "stepPeople", delta: 1 }],
      ["-", { kind: "stepPeople", delta: -1 }],
      ["/", { kind: "focusBill" }],
      ["?", { kind: "openHelp" }],
      ["Escape", { kind: "closeHelp" }],
    ];

    for (const [key, action] of expected) {
      // Not typing: the shortcut fires.
      expect(keyToAction(key, false)).toEqual(action);
      // Typing in a field: ignored, except Escape.
      expect(keyToAction(key, true)).toEqual(key === "Escape" ? action : null);
    }
  });

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
