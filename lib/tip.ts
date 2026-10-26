/** What one person pays when a bill and its tip are split evenly. Pure: no rounding surprises in the UI. */
export interface TipInput {
  /** Bill before tip, in the currency's main unit (e.g. 42.5). */
  readonly bill: number;
  /** Tip as a percentage of the bill (e.g. 15). */
  readonly tipPercent: number;
  /** How many people share the bill; at least 1. */
  readonly people: number;
}

export interface TipResult {
  readonly tip: number;
  readonly total: number;
  readonly perPerson: number;
}

export class TipInputError extends Error {}

/**
 * Rounds to cents, half away from zero.
 * Throws TipInputError when the input is not a finite number.
 */
export function roundCents(value: number): number {
  if (!Number.isFinite(value)) {
    throw new TipInputError("Amount must be a finite number");
  }

  const scaled = Number(`${value}e2`);
  const rounded = Math.round(Math.abs(scaled)) * Math.sign(scaled);
  const result = Number(`${rounded}e-2`);
  return result === 0 ? 0 : result;
}

export function splitBill({ bill, tipPercent, people }: TipInput): TipResult {
  if (!Number.isFinite(bill) || bill < 0) throw new TipInputError("Bill must be zero or more");
  if (!Number.isFinite(tipPercent) || tipPercent < 0 || tipPercent > 100) throw new TipInputError("Tip must be between 0 and 100%");
  if (!Number.isInteger(people) || people < 1) throw new TipInputError("At least one person must pay");
  const tip = roundCents((bill * tipPercent) / 100);
  const total = roundCents(bill + tip);
  return { tip, total, perPerson: roundCents(total / people) };
}

/** Formats a bill/tip/per-person summary for sharing. */
export function summaryText(
  result: TipResult,
  input: TipInput,
  format: (n: number) => string
): string {
  return `Bill ${format(input.bill)} + tip ${format(result.tip)} (${input.tipPercent}%) = ${format(result.total)}. Each of ${input.people} pays ${format(result.perPerson)}.`;
}

/** Tip presets shown as buttons. */
export const TIP_PRESETS = [10, 15, 20] as const;
