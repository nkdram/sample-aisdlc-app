interface BillInputProps {
  bill: string;
  onChange: (value: string) => void;
}

/** Bill field: presentational only, the parent owns the value. */
export function BillInput({ bill, onChange }: BillInputProps) {
  return (
    <>
      <label htmlFor="bill">Bill</label>
      <input id="bill" inputMode="decimal" value={bill} onChange={(e) => onChange(e.target.value)} placeholder="0.00" />
    </>
  );
}
