import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["perf/**/*.perf.ts"], setupFiles: ["fake-indexeddb/auto"] },
});
