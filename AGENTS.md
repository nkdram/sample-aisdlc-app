# Working in this repo (for agents)

A deliberately small Next.js 15 app used to test the agent squad end to end.

- Business rules live in `lib/` as pure functions with Vitest tests next to them (`*.test.ts`).
- UI lives in `components/` and `app/`; components call `lib/`, never the other way round.
- Every acceptance criterion gets a test: a unit test for rules, a Playwright test in `e2e/` for behaviour on the page.
- Before opening a PR run `npm run validate` (typecheck, unit tests, build) and `npm run test:e2e`.
- Keep PRs small: one ticket, one branch, one PR. No new dependencies without saying why in the PR.
- No secrets in code. Deployment is Vercel (zero config); previews are built for every PR.
