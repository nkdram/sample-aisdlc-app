"use client";

import { useCallback, useEffect, useState } from "react";
import { addEntry, HISTORY_KEY, parseHistory, serializeHistory, type HistoryEntry } from "@/lib/history";

export interface HistoryState {
  entries: HistoryEntry[];
  unavailable: boolean;
  save: (entry: HistoryEntry) => void;
  remove: (savedAt: number) => void;
  clear: () => void;
}

function readEntries(): HistoryEntry[] {
  return parseHistory(window.localStorage.getItem(HISTORY_KEY));
}

/**
 * Device-local split history. Reads after mount and wraps every storage access in
 * try/catch, so a browser without storage shows a message instead of crashing.
 */
export function useHistory(): HistoryState {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    try {
      setEntries(readEntries());
    } catch {
      setUnavailable(true);
    }
  }, []);

  const write = useCallback((next: HistoryEntry[]) => {
    try {
      window.localStorage.setItem(HISTORY_KEY, serializeHistory(next));
      setEntries(next);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, []);

  const save = useCallback(
    (entry: HistoryEntry) => {
      try {
        write(addEntry(readEntries(), entry));
      } catch {
        setUnavailable(true);
      }
    },
    [write]
  );

  const remove = useCallback(
    (savedAt: number) => {
      try {
        write(readEntries().filter((entry) => entry.savedAt !== savedAt));
      } catch {
        setUnavailable(true);
      }
    },
    [write]
  );

  const clear = useCallback(() => {
    write([]);
  }, [write]);

  return { entries, unavailable, save, remove, clear };
}
