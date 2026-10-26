# SAMPLE-AISDLC-APP-1: Add a custom tip percentage

## Acceptance criteria

- A "Custom" button sits after the presets; selecting it shows a number input labelled "Custom tip %".
- Values from 0 to 100 (up to one decimal) are accepted; anything else shows "Tip must be between 0 and 100%" and the totals do not change.
- Choosing a preset again hides the custom input and uses the preset.
- The Custom button has aria-pressed="true" while the custom input is in use.

## Technical notes
- Reuse splitBill's validation; do not duplicate the 0-100 rule in the component.
- Keep the custom value in component state only (persistence is a separate ticket).

## Test plan
- Unit: a helper that parses the custom input ("12.5" -> 12.5, "" -> null, "abc" -> error).
- E2E: bill 100, Custom 12.5% -> tip $12.50, total $112.50; 150 shows the error.
- Run `npm run validate` and `npm run test:e2e` before opening the PR.

## Out of scope
- Remembering the custom value between visits.

Size: S · Priority: P1

_Build attempt 1 by Full-stack engineer._
