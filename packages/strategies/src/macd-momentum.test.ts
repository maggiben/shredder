import type { Candle, PortfolioState } from "@shredder/core";
import { describe, expect, it } from "vitest";
import { MacdMomentumStrategy } from "./macd-momentum.js";

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 0.1, low: close - 0.1, close, volume: 1 };
}

const portfolio: PortfolioState = { cash: 1000, positions: [] };

describe("MacdMomentumStrategy", () => {
  it("rejects invalid macd periods", () => {
    expect(() => new MacdMomentumStrategy(26, 12, 9)).toThrow();
  });

  it("returns HOLD when series is short", () => {
    const strategy = new MacdMomentumStrategy(12, 26, 9);
    const candles = [candle(0, 100), candle(1, 101)];
    const signal = strategy.evaluate({ symbol: "TEST", candles, indicators: {}, portfolio });
    expect(signal.action).toBe("HOLD");
  });

  it("detects upward crossover on synthetic momentum", () => {
    const strategy = new MacdMomentumStrategy(3, 5, 2);
    const candles: Candle[] = [];
    let t = 0;
    const values: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      values.push(100 + i * 0.4 + Math.sin(i) * 0.2);
    }
    for (const close of values) {
      candles.push(candle(t, close));
      t += 60_000;
    }
    let crossed = false;
    for (let end = 10; end < candles.length; end += 1) {
      const slice = candles.slice(0, end);
      const sig = strategy.evaluate({ symbol: "TEST", candles: slice, indicators: {}, portfolio });
      if (sig.action === "BUY") {
        crossed = true;
        break;
      }
    }
    expect(crossed).toBe(true);
  });
});
