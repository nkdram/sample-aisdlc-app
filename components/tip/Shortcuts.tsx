"use client";

import { ShortcutsDialog } from "@/components/tip/ShortcutsDialog";
import { useShortcuts } from "@/components/tip/useShortcuts";

interface ShortcutsProps {
  people: string;
  onPeopleChange: (people: string) => void;
  onPreset: (tipPercent: number) => void;
  billInputId: string;
}

/** Wires the keyboard shortcuts into the calculator; renders nothing until the help dialog opens. */
export function Shortcuts(props: ShortcutsProps) {
  const { helpOpen, closeHelp } = useShortcuts(props);
  return helpOpen ? <ShortcutsDialog onClose={closeHelp} /> : null;
}
