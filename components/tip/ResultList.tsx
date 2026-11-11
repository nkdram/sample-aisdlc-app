import { formatMoney, type Currency } from "@/lib/currency";
import type { TipResult } from "@/lib/tip";

interface ResultListProps {
  result: TipResult | null;
  currency: Currency;
}

/** Tip, total, per-person and tip-per-person amounts; shows zeros until the input is valid. */
export function ResultList({ result, currency }: ResultListProps) {
  const format = formatMoney(currency).format;

  return (
    <dl className="result" aria-live="polite">
      <dt>Tip</dt>
      <dd data-testid="tip">{format(result?.tip ?? 0)}</dd>
      <dt>Total</dt>
      <dd data-testid="total">{format(result?.total ?? 0)}</dd>
      <dt>Per person</dt>
      <dd data-testid="per-person">{format(result?.perPerson ?? 0)}</dd>
      <dt>Tip per person</dt>
      <dd data-testid="tip-per-person">{format(result?.tipPerPerson ?? 0)}</dd>
    </dl>
  );
}
