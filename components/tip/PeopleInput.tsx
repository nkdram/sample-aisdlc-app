import { MAX_PEOPLE } from "@/lib/tip";

interface PeopleInputProps {
  people: string;
  onChange: (value: string) => void;
  onStep: (delta: number) => void;
  peopleCount: number;
}

/** People field: presentational only, the parent owns the value. */
export function PeopleInput({ people, onChange, onStep, peopleCount }: PeopleInputProps) {
  return (
    <>
      <label htmlFor="people">People</label>
      <div className="people-controls">
        <button type="button" aria-label="Fewer people" disabled={peopleCount <= 1} onClick={() => onStep(-1)}>
          -
        </button>
        <input id="people" inputMode="numeric" value={people} onChange={(e) => onChange(e.target.value)} />
        <button type="button" aria-label="More people" disabled={peopleCount >= MAX_PEOPLE} onClick={() => onStep(1)}>
          +
        </button>
      </div>
    </>
  );
}
