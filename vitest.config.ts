import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Each test file that touches the database starts its own in-process database (PGlite, WebAssembly). Starting a
    // dozen at once on one machine can take longer than a few seconds each, so run a few files at a time and allow
    // the first start to take its time.
    maxWorkers: 4,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
