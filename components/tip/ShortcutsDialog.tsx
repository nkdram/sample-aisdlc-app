"use client";

import { useEffect, useRef } from "react";

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

/** The help dialog: presentational, lists every shortcut, takes focus when it opens. */
export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      tabIndex={-1}
      className="shortcuts-dialog"
      data-testid="shortcuts-dialog"
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
