"use client";

import { formatMoney, parseBillAmount, type Currency } from "@/lib/currency";
import { splitBill, summaryText, TipInputError, type TipResult } from "@/lib/tip";

export interface TipCalculation {
  result: TipResult | null;
  error: string | null;
  summary: string;
  canCopy: boolean;
}

/** The one place the UI calls splitBill: derives the result, the error and the shareable summary. */
export function useTipCalculation(
  bill: string,
  tipPercent: number,
  people: string,
  currency: Currency
): TipCalculation {
  let result: TipResult | null = null;
  let error: string | null = null;
  const billAmount = parseBillAmount(bill, currency);

  if (bill !== "") {
    try {
      result = splitBill({ bill: billAmount, tipPercent, people: Number(people) });
    } catch (e) {
      if (!(e instanceof TipInputError)) throw e;
      error = e.message;
    }
  }

  const canCopy = result !== null && !error;
  const summary =
    canCopy && result !== null
      ? summaryText(
          result,
          { bill: billAmount, tipPercent, people: Number(people) },
          formatMoney(currency).format
        )
      : "";

  return { result, error, summary, canCopy };
}
