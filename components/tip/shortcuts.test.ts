import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
const hook = read("./useShortcuts.ts");
const resultList = read("./ResultList.tsx");
const dialog = read("./ShortcutsDialog.tsx");

describe("keyboard shortcuts wiring", () => {
  it("Changes made by shortcuts are announced through the existing aria-live result.", () => {
    // The result list keeps the live region the app already had...
    expect(resultList).toContain('aria-live="polite"');
    // ...and the shortcuts only ever change state through the calculator's own setters,
    // so the re-render of that live region is what announces them.
    expect(hook).toContain("onPreset(");
    expect(hook).toContain("onPeopleChange(");
    expect(hook).not.toContain("splitBill");
  });

  it("dispatches the pure keyToAction mapping instead of matching keys itself", () => {
    expect(hook).toContain("keyToAction(");
    expect(hook).toContain("stepPeople(");
    expect(hook).toContain("TIP_PRESETS[");
    expect(hook).toContain('window.addEventListener("keydown"');
    expect(hook).toContain('window.removeEventListener("keydown"');
  });

  it("lists every shortcut in the help dialog", () => {
    expect(dialog).toContain('role="dialog"');
    expect(dialog).toContain('aria-modal="true"');
    expect(dialog).toContain('aria-label="Keyboard shortcuts"');
    expect(dialog).toContain('data-testid="shortcuts-dialog"');
    for (const keys of ["1 / 2 / 3", "+ / -", "/", "?", "Escape"]) {
      expect(dialog).toContain(keys);
    }
  });
});
