"use client";

interface BillInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function BillInput({ value, onChange }: BillInputProps) {
  return (
    <>
      <label htmlFor="bill">Bill</label>
      <input id="bill" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00" />
    </>
  );
}
