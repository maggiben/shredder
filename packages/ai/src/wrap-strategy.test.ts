import type { StrategyInput, StrategySignal } from "@shredder/core";
import { describe, expect, it } from "vitest";
import { wrapStrategy } from "./wrap-strategy.js";

describe("wrapStrategy", () => {
  it("wraps synchronous evaluators", async () => {
    const tool = wrapStrategy("demo", (_input: StrategyInput): StrategySignal => {
      return { action: "HOLD", confidence: 0, reason: "test" };
    });
    expect(tool.name).toBe("demo");
    const signal = await tool.execute({
      symbol: "X",
      candles: [],
      indicators: {},
      portfolio: { cash: 1, positions: [] },
    });
    expect(signal.reason).toBe("test");
  });
});
