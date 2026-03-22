import type { Candle, PortfolioState } from "@shredder/core";
import { describe, expect, it } from "vitest";
import { RsiReversionStrategy } from "./rsi-reversion.js";

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 0.1, low: close - 0.1, close, volume: 1 };
}

const portfolio: PortfolioState = { cash: 1000, positions: [] };

describe("RsiReversionStrategy", () => {
  it("returns HOLD when RSI cannot be computed", () => {
    const strategy = new RsiReversionStrategy(14, 30, 70);
    const candles = [candle(0, 100), candle(1, 101)];
    const signal = strategy.evaluate({ symbol: "TEST", candles, indicators: {}, portfolio });
    expect(signal.action).toBe("HOLD");
  });

  it("rejects invalid thresholds", () => {
    expect(() => new RsiReversionStrategy(14, 70, 30)).toThrow();
  });

  it("flags oversold", () => {
    const strategy = new RsiReversionStrategy(2, 30, 70);
    const candles: Candle[] = [];
    let price = 100;
    let t = 0;
    for (let i = 0; i < 30; i += 1) {
      price -= 2;
      candles.push(candle(t, price));
      t += 60_000;
    }
    const signal = strategy.evaluate({ symbol: "TEST", candles, indicators: {}, portfolio });
    expect(signal.action).toBe("BUY");
  });

  it("returns HOLD in neutral band", () => {
    const strategy = new RsiReversionStrategy(14, 30, 70);
    const candles: Candle[] = [];
    let price = 100;
    let t = 0;
    for (let i = 0; i < 40; i += 1) {
      price += i % 2 === 0 ? 0.1 : -0.1;
      candles.push(candle(t, price));
      t += 60_000;
    }
    const signal = strategy.evaluate({ symbol: "TEST", candles, indicators: {}, portfolio });
    expect(signal.action).toBe("HOLD");
  });

  it("flags overbought", () => {
    const strategy = new RsiReversionStrategy(2, 30, 70);
    const candles: Candle[] = [];
    let price = 50;
    let t = 0;
    for (let i = 0; i < 30; i += 1) {
      price += 3;
      candles.push(candle(t, price));
      t += 60_000;
    }
    const signal = strategy.evaluate({ symbol: "TEST", candles, indicators: {}, portfolio });
    expect(signal.action).toBe("SELL");
  });
});
