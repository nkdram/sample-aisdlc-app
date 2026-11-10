/** What a key press asks the calculator to do. Pure data: the UI only dispatches it. */
export type ShortcutAction =
  | { kind: "preset"; index: number }
  | { kind: "stepPeople"; delta: 1 | -1 }
  | { kind: "focusBill" }
  | { kind: "openHelp" }
  | { kind: "closeHelp" };

/**
 * Maps a keyboard event's `key` to an action, or null when the key is not a shortcut.
 * Shortcuts are ignored while the user types in a field, except Escape.
 */
export function keyToAction(key: string, targetIsInput: boolean): ShortcutAction | null {
  if (key === "Escape") return { kind: "closeHelp" };
  if (targetIsInput) return null;

  switch (key) {
    case "1":
      return { kind: "preset", index: 0 };
    case "2":
      return { kind: "preset", index: 1 };
    case "3":
      return { kind: "preset", index: 2 };
    case "+":
      return { kind: "stepPeople", delta: 1 };
    case "-":
      return { kind: "stepPeople", delta: -1 };
    case "/":
      return { kind: "focusBill" };
    case "?":
      return { kind: "openHelp" };
    default:
      return null;
  }
}
