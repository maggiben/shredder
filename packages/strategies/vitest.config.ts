import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: false,
      include: [
        "src/moving-average-crossover.ts",
        "src/rsi-reversion.ts",
        "src/macd-momentum.ts",
        "src/bollinger-mean-reversion.ts",
        "src/adx-trend.ts",
        "src/candles.ts",
        "src/registry.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 95,
        branches: 88,
        statements: 90,
      },
    },
  },
});
