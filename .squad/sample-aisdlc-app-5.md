# SAMPLE-AISDLC-APP-5: Support euro and pound

## Acceptance criteria

- A currency select with USD (default), EUR and GBP.
- Amounts use Intl.NumberFormat: en-US for USD, de-DE for EUR, en-GB for GBP.
- The choice changes formatting only, never the calculation.
- The bill input accepts a comma as the decimal separator when EUR is selected.

## Technical notes
- Map currency -> locale in lib/currency.ts.
- Coordinate with the shareable summary ticket: it should use the same formatter.

## Test plan
- Unit: formatter mapping and comma parsing ("42,50" -> 42.5 for EUR).
- E2E: switch to EUR, bill 100, 4 people -> per person shows "28,75 €".
- Run `npm run validate` and `npm run test:e2e` before opening the PR.

## Out of scope
- Exchange rates or converting between currencies.

Size: M · Priority: P2

_Build attempt 1 by Full-stack engineer._
