"use client";

interface PeopleInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PeopleInput({ value, onChange }: PeopleInputProps) {
  return (
    <>
      <label htmlFor="people">People</label>
      <input id="people" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} />
    </>
  );
}
