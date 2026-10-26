import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 3005);

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${port}` },
  // Against a Vercel preview, set E2E_BASE_URL and no local server starts.
  webServer: process.env.E2E_BASE_URL ? undefined : { command: `npm run build && npx next start -p ${port}`, port, reuseExistingServer: true, timeout: 180_000 },
});
