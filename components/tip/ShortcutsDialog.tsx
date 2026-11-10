"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

interface ShortcutsDialogProps {
  onClose: () => void;
}

const SHORTCUTS: ReadonlyArray<{ keys: string; description: string }> = [
  { keys: "1 / 2 / 3", description: "Select the first, second or third tip preset" },
  { keys: "+ / -", description: "Add or remove a person (1 to 50)" },
  { keys: "/", description: "Move focus to the Bill input" },
  { keys: "?", description: "Show this list of shortcuts" },
  { keys: "Escape", description: "Close this dialog" },
];

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

/** The help dialog: presentational, lists every shortcut, takes focus and keeps it while open. */
export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  // aria-modal promises the rest of the page is inert, so Tab must not leave the dialog.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === undefined || last === undefined) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog.current)) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      tabIndex={-1}
      className="shortcuts-dialog"
      data-testid="shortcuts-dialog"
      onKeyDown={handleKeyDown}
    >
      <h2>Keyboard shortcuts</h2>
      <dl>
        {SHORTCUTS.map(({ keys, description }) => (
          <div key={keys}>
            <dt>
              <kbd>{keys}</kbd>
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="shortcuts-close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
