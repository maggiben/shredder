import type { StrategyInput, StrategySignal } from "@shredder/core";
import { coreCandlesToOhlcvMatrix, rsi } from "@shredder/indicators";
import type { Strategy } from "./strategy.js";

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
    const valueRaw = rsi(coreCandlesToOhlcvMatrix(input.candles), this.period, "close", false);
    const value = typeof valueRaw === "number" ? valueRaw : valueRaw[valueRaw.length - 1]!;
    if (!Number.isFinite(value)) {
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
