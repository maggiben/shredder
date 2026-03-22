import type { StrategyInput, StrategySignal } from "@shredder/core";

/**
 * Tool surface for orchestration: strategies are invoked by the worker/AI layer,
 * but AI must never bypass risk or place orders directly.
 */
export interface StrategyTool {
  readonly name: string;
  execute(input: StrategyInput): Promise<StrategySignal>;
}
