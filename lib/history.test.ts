import { describe, expect, it } from "vitest";
import {
  addEntry,
  HISTORY_KEY,
  HISTORY_MAX,
  HISTORY_VERSION,
  parseHistory,
  serializeHistory,
  type HistoryEntry,
} from "./history";

function entry(savedAt: number, bill = 100): HistoryEntry {
  return { bill, tipPercent: 15, people: 4, total: 115, perPerson: 28.75, savedAt };
}

describe("history storage", () => {
  it("stores history under tip-splitter:history with a version field", () => {
    expect(HISTORY_KEY).toBe("tip-splitter:history");
    expect(HISTORY_VERSION).toBe(1);
    expect(JSON.parse(serializeHistory([entry(1)]))).toEqual({
      version: 1,
      entries: [entry(1)],
    });
  });

  it("parseHistory reads back a valid stored history", () => {
    const stored = serializeHistory([entry(2), entry(1)]);
    expect(parseHistory(stored)).toEqual([entry(2), entry(1)]);
  });

  it("parseHistory treats corrupt storage as empty history", () => {
    expect(parseHistory("{not json")).toEqual([]);
    expect(parseHistory("null")).toEqual([]);
    expect(parseHistory('"a string"')).toEqual([]);
    expect(parseHistory(JSON.stringify({ version: 1, entries: "nope" }))).toEqual([]);
  });

  it("parseHistory treats unknown-version storage as empty history", () => {
    expect(parseHistory(JSON.stringify({ version: 99, entries: [entry(1)] }))).toEqual([]);
    expect(parseHistory(JSON.stringify({ entries: [entry(1)] }))).toEqual([]);
  });

  it("parseHistory returns empty history for null", () => {
    expect(parseHistory(null)).toEqual([]);
  });

  it("parseHistory drops entries that do not have the stored shape", () => {
    const stored = JSON.stringify({
      version: 1,
      entries: [entry(1), { bill: "100", tipPercent: 15, people: 4, total: 115, perPerson: 28.75, savedAt: 2 }],
    });
    expect(parseHistory(stored)).toEqual([entry(1)]);
  });

  it("addEntry keeps the newest 20 entries, newest first", () => {
    let list: HistoryEntry[] = [];
    for (let i = 1; i <= 25; i += 1) {
      list = addEntry(list, entry(i, i));
    }

    expect(list).toHaveLength(HISTORY_MAX);
    expect(list.map((item) => item.savedAt)).toEqual(
      Array.from({ length: HISTORY_MAX }, (_, index) => HISTORY_MAX + 5 - index)
    );
  });

  it("addEntry puts the new entry first and honours a custom cap", () => {
    expect(addEntry([entry(1)], entry(2), 1)).toEqual([entry(2)]);
    expect(addEntry([], entry(3))).toEqual([entry(3)]);
  });
});
