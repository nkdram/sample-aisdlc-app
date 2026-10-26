# SAMPLE-AISDLC-APP-2: Round the per-person amount up

## Acceptance criteria

- A "Round up per person" checkbox, off by default.
- When on: per person = ceil(total / people) to the next whole unit; total shown = per person x people; the extra goes to the tip.
- Example: bill 10, tip 10%, 3 people -> per person $4.00, total $12.00, tip $2.00.
- Turning it off restores the exact split.

## Technical notes
- Add roundUp: boolean to TipInput (default false) and keep splitBill pure.
- The effective tip percentage is not shown; only amounts change.

## Test plan
- Unit: the example above, an exact split that needs no rounding (bill 9, 0%, 3 people -> $3.00), and roundUp=false unchanged.
- E2E: tick the checkbox and see $4.00 / $12.00 / $2.00.
- Run `npm run validate` and `npm run test:e2e` before opening the PR.

## Out of scope
- Rounding to 5 or 10.

Size: S · Priority: P2

_Build attempt 1 by Full-stack engineer._
