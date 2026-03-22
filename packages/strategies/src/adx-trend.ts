import type { StrategyInput, StrategySignal } from "@shredder/core";
import { adx } from "@shredder/core";
import type { Strategy } from "./strategy.js";
import { ohlcFrom } from "./candles.js";

export class AdxTrendStrategy implements Strategy {
  readonly id: string;

  constructor(
    private readonly period: number,
    private readonly adxThreshold: number,
    id = "adx-trend",
  ) {
    if (period <= 0 || adxThreshold <= 0) {
      throw new Error("Invalid ADX parameters");
    }
    this.id = id;
  }

  evaluate(input: StrategyInput): StrategySignal {
    const { highs, lows, closes } = ohlcFrom(input.candles);
    const result = adx(highs, lows, closes, this.period);
    if (result === undefined) {
      return {
        action: "HOLD",
        confidence: 0,
        reason: "Insufficient data for ADX",
      };
    }
    if (result.adx < this.adxThreshold) {
      return {
        action: "HOLD",
        confidence: 0.3,
        reason: `ADX ${result.adx.toFixed(2)} below threshold ${this.adxThreshold}`,
      };
    }
    if (result.plusDi > result.minusDi) {
      return {
        action: "BUY",
        confidence: Math.min(1, (result.adx - this.adxThreshold) / (100 - this.adxThreshold)),
        reason: `Trend up: +DI ${result.plusDi.toFixed(2)} > -DI ${result.minusDi.toFixed(2)}, ADX ${result.adx.toFixed(2)}`,
      };
    }
    if (result.minusDi > result.plusDi) {
      return {
        action: "SELL",
        confidence: Math.min(1, (result.adx - this.adxThreshold) / (100 - this.adxThreshold)),
        reason: `Trend down: -DI ${result.minusDi.toFixed(2)} > +DI ${result.plusDi.toFixed(2)}, ADX ${result.adx.toFixed(2)}`,
      };
    }
    return {
      action: "HOLD",
      confidence: 0.2,
      reason: "+DI and -DI tied with strong ADX",
    };
  }
}
