import type { StrategyInput, StrategySignal } from "@shredder/core";

export interface Strategy {
  readonly id: string;
  evaluate(input: StrategyInput): StrategySignal;
}
