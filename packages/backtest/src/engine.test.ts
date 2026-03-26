import type { Candle } from "@shredder/core";
import { MovingAverageCrossoverStrategy } from "@shredder/strategies";
import { DefaultRiskEngine } from "@shredder/risk";
import { describe, expect, it } from "vitest";
import { runBacktest } from "./engine.js";

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 0.1, low: close - 0.1, close, volume: 1 };
}

describe("runBacktest", () => {
  it("throws on invalid deploy fraction", () => {
    expect(() =>
      runBacktest({
        symbol: "TEST",
        candles: [candle(0, 1)],
        strategies: [new MovingAverageCrossoverStrategy(2, 3)],
        initialCash: 1000,
        deployFraction: 0,
        warmupBars: 5,
        fee: { takerRate: 0 },
        risk: new DefaultRiskEngine({
          maxNotionalFractionPerTrade: 1,
          maxDrawdownFraction: 1,
        }),
      }),
    ).toThrow();
  });

  it("runs without crashing on synthetic data", () => {
    const candles: Candle[] = [];
    let t = 0;
    let price = 100;
    for (let i = 0; i < 60; i += 1) {
      price += Math.sin(i / 5) * 0.5;
      candles.push(candle(t, price));
      t += 60_000;
    }
    const result = runBacktest({
      symbol: "TEST",
      candles,
      strategies: [new MovingAverageCrossoverStrategy(3, 7)],
      initialCash: 10_000,
      deployFraction: 0.5,
      warmupBars: 15,
      fee: { takerRate: 0 },
      risk: new DefaultRiskEngine({
        maxNotionalFractionPerTrade: 0.5,
        maxDrawdownFraction: 0.9,
      }),
    });
    expect(result.equityCurve.length).toBeGreaterThan(0);
    expect(result.equityCurve[result.equityCurve.length - 1]).toBeDefined();
    expect(Number.isFinite(result.finalCash)).toBe(true);
    expect(Number.isFinite(result.finalPositionQty)).toBe(true);
  });
});
