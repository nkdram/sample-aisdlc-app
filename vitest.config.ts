import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  // The app compiles JSX with Next's automatic runtime; unit tests that import
  // app/*.tsx components need the same transform (tsconfig keeps jsx: preserve).
  esbuild: { jsx: "automatic" },
  test: { include: ["lib/**/*.test.ts", "components/**/*.test.ts"] },
});
