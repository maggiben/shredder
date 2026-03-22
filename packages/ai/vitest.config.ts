import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: false,
      include: ["src/client.ts", "src/wrap-strategy.ts", "src/agents/shredder-suggest-tools.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 80,
        statements: 100,
      },
    },
  },
});
