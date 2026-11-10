/** Device-local split history: pure storage rules, no browser access here. */
export const HISTORY_VERSION = 1;
export const HISTORY_KEY = "tip-splitter:history";
/** How many splits the device keeps; the newest wins. */
export const HISTORY_MAX = 20;

export interface HistoryEntry {
  /** Bill before tip, in the currency's main unit. */
  readonly bill: number;
  readonly tipPercent: number;
  readonly people: number;
  readonly total: number;
  readonly perPerson: number;
  /** When the split was saved, in epoch milliseconds. */
  readonly savedAt: number;
}

interface StoredHistory {
  readonly version: number;
  readonly entries: readonly HistoryEntry[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    isFiniteNumber(entry.bill) &&
    isFiniteNumber(entry.tipPercent) &&
    isFiniteNumber(entry.people) &&
    isFiniteNumber(entry.total) &&
    isFiniteNumber(entry.perPerson) &&
    isFiniteNumber(entry.savedAt)
  );
}

/**
 * Reads stored history. Missing, corrupt, unknown-version or wrongly shaped data
 * is treated as empty history: the page must never crash on it.
 */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (typeof parsed !== "object" || parsed === null) return [];
  const stored = parsed as Partial<StoredHistory>;
  if (stored.version !== HISTORY_VERSION) return [];
  if (!Array.isArray(stored.entries)) return [];

  return stored.entries.filter(isHistoryEntry);
}

/** Puts the new entry first and keeps at most `max` entries, newest first. */
export function addEntry(
  list: readonly HistoryEntry[],
  entry: HistoryEntry,
  max: number = HISTORY_MAX
): HistoryEntry[] {
  return [entry, ...list].slice(0, Math.max(0, max));
}

/** The exact JSON stored under HISTORY_KEY, with the version field the parser checks. */
export function serializeHistory(list: readonly HistoryEntry[]): string {
  const stored: StoredHistory = { version: HISTORY_VERSION, entries: list };
  return JSON.stringify(stored);
}
