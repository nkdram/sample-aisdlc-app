import { money } from "@/lib/format";
import type { TipResult } from "@/lib/tip";

interface ResultListProps {
  result: TipResult | null;
}

/** Tip, total, per-person and tip-per-person amounts; shows zeros until the input is valid. */
export function ResultList({ result }: ResultListProps) {
  return (
    <dl className="result" aria-live="polite">
      <dt>Tip</dt>
      <dd data-testid="tip">{money.format(result?.tip ?? 0)}</dd>
      <dt>Total</dt>
      <dd data-testid="total">{money.format(result?.total ?? 0)}</dd>
      <dt>Per person</dt>
      <dd data-testid="per-person">{money.format(result?.perPerson ?? 0)}</dd>
      <dt>Tip per person</dt>
      <dd data-testid="tip-per-person">{money.format(result?.tipPerPerson ?? 0)}</dd>
    </dl>
  );
}
