# SAMPLE-AISDLC-APP-4: Show the split as a shareable summary

## Acceptance criteria

- A "Copy summary" button below the result, enabled only when the bill is valid.
- The copied text is: "Bill $X + tip $Y (Z%) = $T. Each of N pays $P." with currency formatting.
- After copying, the button reads "Copied" for 2 seconds, then returns to "Copy summary".
- If the clipboard is unavailable, the summary is shown in a read-only text box to copy by hand.

## Technical notes
- Build the text with a pure summaryText(result, input, format) in lib/.
- Use navigator.clipboard.writeText inside the click handler.

## Test plan
- Unit: summaryText for bill 100, 15%, 4 people -> "Bill $100.00 + tip $15.00 (15%) = $115.00. Each of 4 pays $28.75."
- E2E: button disabled with no bill; enabled and reads Copied after click (grant clipboard permission in the test).
- Run `npm run validate` and `npm run test:e2e` before opening the PR.

## Out of scope
- Share sheets or links.

Size: S · Priority: P2

_Build attempt 1 by Full-stack engineer._
