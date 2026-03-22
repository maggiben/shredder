import type { StrategyInput, StrategySignal } from "@shredder/core";
import type { StrategyTool } from "./strategy-tool.js";

export function wrapStrategy(
  name: string,
  evaluate: (input: StrategyInput) => StrategySignal,
): StrategyTool {
  return {
    name,
    execute: async (input) => evaluate(input),
  };
}
