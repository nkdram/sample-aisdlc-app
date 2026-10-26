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
