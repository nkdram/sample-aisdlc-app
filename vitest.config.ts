import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  // Same JSX runtime as Next, so component tests can render without importing React.
  esbuild: { jsx: "automatic" },
  test: { include: ["lib/**/*.test.ts", "components/**/*.test.ts", "components/**/*.test.tsx"] },
});
