import { splitBill, summaryText, TipInputError, type TipResult } from "@/lib/tip";

export interface CalculationFormState {
  readonly bill: string;
  readonly tipPercent: number;
  readonly people: string;
}

export interface TipCalculation {
  readonly result: TipResult | null;
  readonly error: string | null;
  readonly summary: string;
  readonly canCopy: boolean;
}

export function useTipCalculation(
  form: CalculationFormState,
  format: (n: number) => string
): TipCalculation {
  const { bill, tipPercent, people } = form;
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
      ? summaryText(result, { bill: Number(bill), tipPercent, people: Number(people) }, format)
      : "";

  return { result, error, summary, canCopy };
}
