import type { Candle, PortfolioState } from "@shredder/core";
import { describe, expect, it } from "vitest";
import { MovingAverageCrossoverStrategy } from "./moving-average-crossover.js";

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 0.1, low: close - 0.1, close, volume: 1 };
}

const portfolio: PortfolioState = { cash: 1000, positions: [] };

describe("MovingAverageCrossoverStrategy", () => {
  it("rejects invalid periods", () => {
    expect(() => new MovingAverageCrossoverStrategy(20, 5)).toThrow();
  });

  it("emits SELL on bearish crossover", () => {
    const strategy = new MovingAverageCrossoverStrategy(2, 3);
    const candles: Candle[] = [];
    let t = 0;
    for (const c of [10, 10, 10, 12, 11, 9]) {
      candles.push(candle(t, c));
      t += 60_000;
    }
    const signal = strategy.evaluate({
      symbol: "TEST",
      candles,
      indicators: {},
      portfolio,
    });
    expect(signal.action).toBe("SELL");
  });

  it("emits BUY on bullish crossover", () => {
    const strategy = new MovingAverageCrossoverStrategy(2, 3);
    const candles: Candle[] = [];
    let t = 0;
    for (const c of [10, 10, 10, 9, 10, 15]) {
      candles.push(candle(t, c));
      t += 60_000;
    }
    const signal = strategy.evaluate({
      symbol: "TEST",
      candles,
      indicators: {},
      portfolio,
    });
    expect(signal.action).toBe("BUY");
  });

  it("returns HOLD when no crossover", () => {
    const strategy = new MovingAverageCrossoverStrategy(2, 3);
    const candles: Candle[] = [];
    let t = 0;
    for (const c of [10, 10, 10, 10, 10, 10]) {
      candles.push(candle(t, c));
      t += 60_000;
    }
    const signal = strategy.evaluate({
      symbol: "TEST",
      candles,
      indicators: {},
      portfolio,
    });
    expect(signal.action).toBe("HOLD");
  });

  it("returns HOLD when data is thin", () => {
    const strategy = new MovingAverageCrossoverStrategy(5, 10);
    const signal = strategy.evaluate({
      symbol: "TEST",
      candles: [candle(0, 1)],
      indicators: {},
      portfolio,
    });
    expect(signal.action).toBe("HOLD");
  });
});
