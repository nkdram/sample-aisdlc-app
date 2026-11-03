"use client";

interface ResultListProps {
  tip: string;
  total: string;
  perPerson: string;
}

export function ResultList({ tip, total, perPerson }: ResultListProps) {
  return (
    <dl className="result" aria-live="polite">
      <dt>Tip</dt>
      <dd data-testid="tip">{tip}</dd>
      <dt>Total</dt>
      <dd data-testid="total">{total}</dd>
      <dt>Per person</dt>
      <dd data-testid="per-person">{perPerson}</dd>
    </dl>
  );
}
