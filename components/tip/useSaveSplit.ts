"use client";

import { useHistory } from "@/components/tip/useHistory";
import type { HistoryEntry } from "@/lib/history";
import type { TipResult } from "@/lib/tip";

export interface SaveSplitState {
  canSave: boolean;
  unavailable: boolean;
  save: () => void;
}

/** Turns the current calculation into a history entry and stores it on this device. */
export function useSaveSplit(
  bill: string,
  tipPercent: number,
  people: string,
  result: TipResult | null
): SaveSplitState {
  const history = useHistory();

  function save() {
    if (result === null) return;
    const entry: HistoryEntry = {
      bill: Number(bill),
      tipPercent,
      people: Number(people),
      total: result.total,
      perPerson: result.perPerson,
      savedAt: Date.now(),
    };
    history.save(entry);
  }

  return { canSave: result !== null, unavailable: history.unavailable, save };
}
