# Tip splitter (sample test app)

A tiny Next.js app the agent squad works on during end-to-end tests: Asana ticket, agents build and test it,
PR on GitHub, Vercel preview, merge.

```bash
npm install
npm run dev          # http://localhost:3000
npm run validate     # typecheck + unit tests + build
npx playwright install chromium && npm run test:e2e
```

Deploy: import the GitHub repo in Vercel (framework preset Next.js, no settings needed).
Conventions for agents: see [AGENTS.md](AGENTS.md).

## Lighthouse CI and performance budgets

Budgets live in [lighthouserc.json](lighthouserc.json) and are checked by `.github/workflows/lighthouse.yml` on every pull request. The job builds the app, starts it, and runs Lighthouse against `/` with mobile emulation. It fails when a budget is missed and uploads the report as the workflow artifact `lighthouse-report`. Reports are not sent to any public Lighthouse server.

| Budget | Limit |
|--------|-------|
| Performance | >= 90 |
| Accessibility | >= 95 |
| Best practices | >= 90 |
| First-load JS for `/` (script resource size, gzip) | <= 120 kB |
| Largest Contentful Paint | <= 2.5 s |

Run the same check locally (needs Chrome installed):

```bash
npm run build && npx @lhci/cli autorun --config=lighthouserc.json
```

The report is written to `lighthouse-report/`. A failing assertion prints the budget that was missed and the command exits non-zero.

`@lhci/cli` is not yet a dev dependency: it is run via `npx` in CI and locally, so `package.json` is unchanged. Adding it as a dev dependency needs a human-approved change to `package.json` and the lockfile.
