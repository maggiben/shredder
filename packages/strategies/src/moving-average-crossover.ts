import type { StrategyInput, StrategySignal } from "@shredder/core";
import { smaPair } from "@shredder/core";
import type { Strategy } from "./strategy.js";
import { closesFrom } from "./candles.js";

export class MovingAverageCrossoverStrategy implements Strategy {
  readonly id: string;

  constructor(
    private readonly shortPeriod: number,
    private readonly longPeriod: number,
    id = "ma-crossover",
  ) {
    if (shortPeriod <= 0 || longPeriod <= 0 || shortPeriod >= longPeriod) {
      throw new Error("Invalid MA periods: need 0 < short < long");
    }
    this.id = id;
  }

  evaluate(input: StrategyInput): StrategySignal {
    const closes = closesFrom(input.candles);
    const shortPair = smaPair(closes, this.shortPeriod);
    const longPair = smaPair(closes, this.longPeriod);
    if (shortPair === undefined || longPair === undefined) {
      return {
        action: "HOLD",
        confidence: 0,
        reason: "Insufficient data for SMA pair",
      };
    }
    const wasBelowOrEqual = shortPair.previous <= longPair.previous;
    const isAbove = shortPair.current > longPair.current;
    const wasAboveOrEqual = shortPair.previous >= longPair.previous;
    const isBelow = shortPair.current < longPair.current;

    if (wasBelowOrEqual && isAbove) {
      return {
        action: "BUY",
        confidence: 0.7,
        reason: `Short SMA(${this.shortPeriod}) crossed above long SMA(${this.longPeriod})`,
      };
    }
    if (wasAboveOrEqual && isBelow) {
      return {
        action: "SELL",
        confidence: 0.7,
        reason: `Short SMA(${this.shortPeriod}) crossed below long SMA(${this.longPeriod})`,
      };
    }
    return { action: "HOLD", confidence: 0.2, reason: "No MA crossover" };
  }
}
