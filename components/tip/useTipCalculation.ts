"use client";

import { money } from "@/lib/format";
import { splitBill, summaryText, TipInputError, type TipResult } from "@/lib/tip";

export interface TipCalculation {
  result: TipResult | null;
  error: string | null;
  summary: string;
  canCopy: boolean;
}

/** The one place the UI calls splitBill: derives the result, the error and the shareable summary. */
export function useTipCalculation(bill: string, tipPercent: number, people: string): TipCalculation {
  let result: TipResult | null = null;
  let error: string | null = null;

  if (bill !== "") {
    try {
      result = splitBill({ bill: Number(bill), tipPercent, people: Number(people) });
    } catch (e) {
      if (!(e instanceof TipInputError)) throw e;
      error = e.message;
    }
  }

  const canCopy = result !== null && !error;
  const summary =
    canCopy && result !== null
      ? summaryText(result, { bill: Number(bill), tipPercent, people: Number(people) }, money.format)
      : "";

  return { result, error, summary, canCopy };
}
