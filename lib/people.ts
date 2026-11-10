/** People limits shared by the stepper and the keyboard shortcuts. */
export const MIN_PEOPLE = 1;
export const MAX_PEOPLE = 50;

/**
 * Moves the number of people by `delta`, clamped to MIN_PEOPLE..MAX_PEOPLE.
 * Pure: the UI only passes the current value and the direction.
 */
export function stepPeople(people: number, delta: number): number {
  const current = Number.isFinite(people) ? Math.round(people) : MIN_PEOPLE;
  const clamped = Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, current));
  return Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, clamped + delta));
}
