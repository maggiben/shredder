import type { StrategyInput, StrategySignal } from "@shredder/core";
import { macd, macdPrevious } from "@shredder/core";
import type { Strategy } from "./strategy.js";
import { closesFrom } from "./candles.js";

export class MacdMomentumStrategy implements Strategy {
  readonly id: string;

  constructor(
    private readonly fast: number,
    private readonly slow: number,
    private readonly signal: number,
    id = "macd-momentum",
  ) {
    if (fast <= 0 || slow <= 0 || signal <= 0 || fast >= slow) {
      throw new Error("Invalid MACD parameters");
    }
    this.id = id;
  }

  evaluate(input: StrategyInput): StrategySignal {
    const closes = closesFrom(input.candles);
    const current = macd(closes, this.fast, this.slow, this.signal);
    const previous = macdPrevious(closes, this.fast, this.slow, this.signal);
    if (current === undefined || previous === undefined) {
      return {
        action: "HOLD",
        confidence: 0,
        reason: "Insufficient data for MACD",
      };
    }
    const crossedUp =
      previous.line <= previous.signal && current.line > current.signal;
    const crossedDown =
      previous.line >= previous.signal && current.line < current.signal;

    if (crossedUp) {
      return {
        action: "BUY",
        confidence: 0.65,
        reason: "MACD line crossed above signal",
      };
    }
    if (crossedDown) {
      return {
        action: "SELL",
        confidence: 0.65,
        reason: "MACD line crossed below signal",
      };
    }
    return { action: "HOLD", confidence: 0.2, reason: "No MACD crossover" };
  }
}
