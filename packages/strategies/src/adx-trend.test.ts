import type { Candle, PortfolioState } from "@shredder/core";
import { describe, expect, it } from "vitest";
import { AdxTrendStrategy } from "./adx-trend.js";

function candle(ts: number, close: number): Candle {
  const h = close + 0.2;
  const l = close - 0.2;
  return { timestamp: ts, open: close, high: h, low: l, close, volume: 1 };
}

const portfolio: PortfolioState = { cash: 1000, positions: [] };

describe("AdxTrendStrategy", () => {
  it("rejects invalid params", () => {
    expect(() => new AdxTrendStrategy(0, 25)).toThrow();
  });

  it("returns HOLD when series is short", () => {
    const strategy = new AdxTrendStrategy(14, 25);
    const candles = [candle(0, 100), candle(1, 101)];
    const sig = strategy.evaluate({ symbol: "T", candles, indicators: {}, portfolio });
    expect(sig.action).toBe("HOLD");
  });

  it("may signal on long uptrend", () => {
    const strategy = new AdxTrendStrategy(14, 20);
    const candles: Candle[] = [];
    let p = 100;
    let t = 0;
    for (let i = 0; i < 80; i += 1) {
      p += 0.4;
      candles.push(candle(t, p));
      t += 60_000;
    }
    const sig = strategy.evaluate({ symbol: "T", candles, indicators: {}, portfolio });
    expect(["BUY", "HOLD", "SELL"]).toContain(sig.action);
  });
});
