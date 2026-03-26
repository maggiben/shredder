import type { Candle } from "@shredder/core";
import { MovingAverageCrossoverStrategy } from "@shredder/strategies";
import { DefaultRiskEngine } from "@shredder/risk";
import { describe, expect, it } from "vitest";
import { runBacktest } from "./engine.js";
import { runSimulationLedger } from "./simulation.js";

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 0.1, low: close - 0.1, close, volume: 1 };
}

describe("runSimulationLedger", () => {
  it("matches runBacktest trades and final state", () => {
    const candles: Candle[] = [];
    let t = 0;
    let price = 100;
    for (let i = 0; i < 60; i += 1) {
      price += Math.sin(i / 5) * 0.5;
      candles.push(candle(t, price));
      t += 60_000;
    }
    const params = {
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
    };
    const bt = runBacktest(params);
    const sim = runSimulationLedger(params);
    expect(sim.finalCash).toBe(bt.finalCash);
    expect(sim.finalPositionQty).toBe(bt.finalPositionQty);
    expect(sim.trades.length).toBe(bt.trades.length);
    expect(sim.equityCurve).toEqual(bt.equityCurve);
    for (let i = 0; i < bt.trades.length; i += 1) {
      expect(sim.trades[i]).toEqual(bt.trades[i]);
    }
    expect(sim.rows.length).toBe(candles.length - params.warmupBars);
    expect(sim.signalStats).toMatchObject({
      buyBlockedByRisk: expect.any(Number),
      buySkippedInPosition: expect.any(Number),
      sellSkippedFlat: expect.any(Number),
      entryTimeouts: 0,
      exitTimeouts: 0,
    });
  });
});
