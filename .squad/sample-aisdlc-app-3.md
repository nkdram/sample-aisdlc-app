# SAMPLE-AISDLC-APP-3: Remember the last tip choice

## Acceptance criteria

- The selected tip percentage (preset or custom) is saved in localStorage under "tip-splitter:tip" whenever it changes.
- On load, a saved valid value (0-100) is selected; an invalid or missing value falls back to 15%.
- localStorage errors (private mode, quota) never break the page.

## Technical notes
- Read storage in an effect after mount to avoid hydration mismatches.
- Put parsing in lib/ (parseSavedTip) so it can be unit tested.

## Test plan
- Unit: parseSavedTip for "20", "12.5", "150", "abc", null.
- E2E: choose 20%, reload, 20% is still pressed.
- Run `npm run validate` and `npm run test:e2e` before opening the PR.

## Out of scope
- Remembering the bill or people count.

Size: S · Priority: P2

_Build attempt 1 by Full-stack engineer._
