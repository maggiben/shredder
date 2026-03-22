import type { Candle, PortfolioState } from "@shredder/core";
import { describe, expect, it } from "vitest";
import { BollingerMeanReversionStrategy } from "./bollinger-mean-reversion.js";

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 0.1, low: close - 0.1, close, volume: 1 };
}

const portfolio: PortfolioState = { cash: 1000, positions: [] };

describe("BollingerMeanReversionStrategy", () => {
  it("rejects invalid params", () => {
    expect(() => new BollingerMeanReversionStrategy(0, 2)).toThrow();
  });

  it("signals BUY below lower band", () => {
    const strategy = new BollingerMeanReversionStrategy(5, 2);
    const candles: Candle[] = [];
    let t = 0;
    for (const c of [10, 10, 10, 10, 10, 5]) {
      candles.push(candle(t, c));
      t += 60_000;
    }
    const sig = strategy.evaluate({
      symbol: "T",
      candles,
      indicators: {},
      portfolio,
    });
    expect(sig.action).toBe("BUY");
  });
});
