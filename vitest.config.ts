import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // The first use of the in-process test database (PGlite) loads WebAssembly, which can take
    // several seconds when test files start at the same time.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
