import type { StrategyInput, StrategySignal } from "@shredder/core";
import { rsi } from "@shredder/core";
import type { Strategy } from "./strategy.js";
import { closesFrom } from "./candles.js";

export class RsiReversionStrategy implements Strategy {
  readonly id: string;

  constructor(
    private readonly period: number,
    private readonly oversold: number,
    private readonly overbought: number,
    id = "rsi-reversion",
  ) {
    if (period <= 0 || oversold >= overbought) {
      throw new Error("Invalid RSI parameters");
    }
    this.id = id;
  }

  evaluate(input: StrategyInput): StrategySignal {
    const closes = closesFrom(input.candles);
    const value = rsi(closes, this.period);
    if (value === undefined) {
      return {
        action: "HOLD",
        confidence: 0,
        reason: "Insufficient data for RSI",
      };
    }
    if (value < this.oversold) {
      return {
        action: "BUY",
        confidence: Math.min(1, (this.oversold - value) / this.oversold),
        reason: `RSI(${this.period}) oversold at ${value.toFixed(2)}`,
      };
    }
    if (value > this.overbought) {
      return {
        action: "SELL",
        confidence: Math.min(1, (value - this.overbought) / (100 - this.overbought)),
        reason: `RSI(${this.period}) overbought at ${value.toFixed(2)}`,
      };
    }
    return {
      action: "HOLD",
      confidence: 0.25,
      reason: `RSI(${this.period}) neutral at ${value.toFixed(2)}`,
    };
  }
}
