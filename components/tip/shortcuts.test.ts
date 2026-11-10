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

  it("A pure keyToAction(key, targetIsInput) in lib/shortcuts.ts returns an action or null; the component only dispatches.", () => {
    // The component never inspects event.key itself: it hands the key to keyToAction
    // and switches on the action it gets back.
    expect(hook).toContain("keyToAction(event.key");
    expect(hook).not.toMatch(/event\.key\s*===/);
    expect(hook).not.toMatch(/switch\s*\(\s*event\.key/);
    expect(hook).toContain("action.kind");
  });

  it("Reuse stepPeople; do not duplicate the clamping.", () => {
    // The hook delegates the 1-50 limits to lib/people instead of clamping again.
    expect(hook).toContain('from "@/lib/people"');
    expect(hook).toContain("stepPeople(");
    expect(hook).not.toContain("Math.min");
    expect(hook).not.toContain("Math.max");
    expect(hook).not.toMatch(/\b(1|50)\b\s*[,)]/);
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
