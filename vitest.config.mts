import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the "@/*" alias from tsconfig.json (replaces the vite-tsconfig-paths plugin).
  resolve: { tsconfigPaths: true },
  test: { environment: "node", include: ["tests/unit/**/*.test.ts"] },
});
