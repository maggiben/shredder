import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: false,
      include: ["src/binance-adapter.ts", "src/binance-signing.ts", "src/binance-defaults.ts"],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 88,
        statements: 95,
      },
    },
  },
});
