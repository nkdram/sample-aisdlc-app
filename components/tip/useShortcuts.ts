"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stepPeople } from "@/lib/people";
import { keyToAction } from "@/lib/shortcuts";
import { TIP_PRESETS } from "@/lib/tip";

interface UseShortcutsOptions {
  people: string;
  onPeopleChange: (people: string) => void;
  onPreset: (tipPercent: number) => void;
  billInputId: string;
}

export interface ShortcutsState {
  helpOpen: boolean;
  closeHelp: () => void;
}

const TYPING_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

/** True when the key press lands in a field the user is typing in. */
function isTypingTarget(target: Element | null): boolean {
  if (target === null) return false;
  if (TYPING_TAGS.includes(target.tagName)) return true;
  return target instanceof HTMLElement && target.isContentEditable;
}

/**
 * The only key listener in the UI: maps a key press with keyToAction and dispatches it
 * through the calculator's existing state setters, so the aria-live result announces it.
 */
export function useShortcuts({ people, onPeopleChange, onPreset, billInputId }: UseShortcutsOptions): ShortcutsState {
  const [helpOpen, setHelpOpen] = useState(false);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    const previous = returnFocusTo.current;
    returnFocusTo.current = null;
    const canRestore = previous !== null && previous.isConnected && previous !== document.body;
    const target = canRestore ? previous : document.getElementById(billInputId);
    target?.focus();
  }, [billInputId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const action = keyToAction(event.key, isTypingTarget(document.activeElement));
      if (action === null) return;

      if (action.kind === "closeHelp") {
        if (!helpOpen) return;
        event.preventDefault();
        closeHelp();
        return;
      }

      // While the help dialog is open only Escape acts.
      if (helpOpen) return;
      event.preventDefault();

      switch (action.kind) {
        case "preset": {
          const preset = TIP_PRESETS[action.index];
          if (preset !== undefined) onPreset(preset);
          return;
        }
        case "stepPeople":
          onPeopleChange(String(stepPeople(Number(people), action.delta)));
          return;
        case "focusBill":
          document.getElementById(billInputId)?.focus();
          return;
        case "openHelp":
          returnFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setHelpOpen(true);
          return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [billInputId, closeHelp, helpOpen, onPeopleChange, onPreset, people]);

  return { helpOpen, closeHelp };
}
