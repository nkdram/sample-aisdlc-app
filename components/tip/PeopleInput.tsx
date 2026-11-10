interface PeopleInputProps {
  people: string;
  onChange: (value: string) => void;
}

/** People field: presentational only, the parent owns the value. */
export function PeopleInput({ people, onChange }: PeopleInputProps) {
  return (
    <>
      <label htmlFor="people">People</label>
      <input id="people" inputMode="numeric" value={people} onChange={(e) => onChange(e.target.value)} />
    </>
  );
}
