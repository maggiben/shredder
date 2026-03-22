import type { StrategyInput, StrategySignal } from "@shredder/core";
import { bollingerBands } from "@shredder/core";
import type { Strategy } from "./strategy.js";
import { closesFrom } from "./candles.js";

export class BollingerMeanReversionStrategy implements Strategy {
  readonly id: string;

  constructor(
    private readonly period: number,
    private readonly stdDevMultiplier: number,
    id = "bollinger-mean-reversion",
  ) {
    if (period <= 0 || stdDevMultiplier <= 0) {
      throw new Error("Invalid Bollinger parameters");
    }
    this.id = id;
  }

  evaluate(input: StrategyInput): StrategySignal {
    const closes = closesFrom(input.candles);
    const bands = bollingerBands(closes, this.period, this.stdDevMultiplier);
    if (bands === undefined) {
      return {
        action: "HOLD",
        confidence: 0,
        reason: "Insufficient data for Bollinger Bands",
      };
    }
    const last = closes[closes.length - 1]!;
    if (last <= bands.lower) {
      return {
        action: "BUY",
        confidence: Math.min(1, (bands.lower - last) / (bands.middle - bands.lower + 1e-9)),
        reason: `Price at or below lower Bollinger (${this.period}, ${this.stdDevMultiplier}σ)`,
      };
    }
    if (last >= bands.upper) {
      return {
        action: "SELL",
        confidence: Math.min(1, (last - bands.upper) / (bands.upper - bands.middle + 1e-9)),
        reason: `Price at or above upper Bollinger (${this.period}, ${this.stdDevMultiplier}σ)`,
      };
    }
    return {
      action: "HOLD",
      confidence: 0.25,
      reason: "Price inside Bollinger Bands",
    };
  }
}
