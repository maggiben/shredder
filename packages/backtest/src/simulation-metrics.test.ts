import type { Candle } from "@shredder/core";
import { DefaultRiskEngine } from "@shredder/risk";
import { MovingAverageCrossoverStrategy } from "@shredder/strategies";
import { describe, expect, it } from "vitest";
import { buildSimulationMetrics } from "./simulation-metrics.js";
import { runSimulationLedger } from "./simulation.js";

const MS_PER_DAY = 86_400_000;

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 0.1, low: close - 0.1, close, volume: 1 };
}

describe("buildSimulationMetrics", () => {
  it("produces coherent PnL and market change for a short run", () => {
    const candles: Candle[] = [];
    let t = 0;
    let price = 100;
    for (let i = 0; i < 40; i += 1) {
      price += i % 5 === 0 ? 1 : -0.2;
      candles.push(candle(t, price));
      t += MS_PER_DAY;
    }
    const initialCash = 10_000;
    const warmupBars = 10;
    const result = runSimulationLedger({
      symbol: "TEST",
      candles,
      strategies: [new MovingAverageCrossoverStrategy(3, 7)],
      initialCash,
      deployFraction: 0.5,
      warmupBars,
      risk: new DefaultRiskEngine({
        maxNotionalFractionPerTrade: 0.5,
        maxDrawdownFraction: 0.99,
      }),
    });
    const m = buildSimulationMetrics({ initialCash, warmupBars, candles, result });
    expect(m.startingBalance).toBe(initialCash);
    expect(m.finalBalance).toBeGreaterThan(0);
    expect(m.periodFrom).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(m.closedTradeCount).toBeGreaterThanOrEqual(0);
    expect(m.totalLegCount).toBe(result.trades.length);
    expect(m.marketChangePercent).toBeDefined();
  });
});
