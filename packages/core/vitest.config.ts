import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: false,
      include: ["src/indicators/**/*.ts"],
      exclude: ["**/*.test.ts", "src/indicators/index.ts", "src/types/**"],
      thresholds: {
        lines: 94,
        functions: 100,
        branches: 80,
        statements: 94,
      },
    },
  },
});
