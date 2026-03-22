import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: false,
      include: ["src/schema.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 85,
        statements: 100,
      },
    },
  },
});
