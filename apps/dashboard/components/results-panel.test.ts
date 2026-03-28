import { describe, expect, it } from "vitest";
import { buildBotResultsLike } from "./results-panel";

describe("buildBotResultsLike", () => {
  it("fills numeric metrics from persisted bot trails", () => {
    const result = buildBotResultsLike({
      symbol: "BTCUSDT",
      interval: "15m",
      marketTrail: [
        { timestamp: 1_700_000_000_000, open: 100, high: 101, low: 99, close: 100, volume: 10 },
        { timestamp: 1_700_000_900_000, open: 100, high: 111, low: 99, close: 110, volume: 11 },
      ],
      paperTrail: [
        {
          kind: "buy",
          timestamp: 1_700_000_000_000,
          price: 100,
          quantity: 10,
          fee: 1,
          feeRate: 0.001,
          tradeValue: 1000,
          cashAfter: 8999,
          positionQtyAfter: 10,
          equityAfter: 9999,
        },
        {
          kind: "sell",
          timestamp: 1_700_000_900_000,
          price: 110,
          quantity: 10,
          fee: 1.1,
          feeRate: 0.001,
          tradeValue: 1100,
          cashAfter: 10097.9,
          positionQtyAfter: 0,
          equityAfter: 10097.9,
        },
      ],
    });

    expect(result.metrics.closedTradeCount).toBe(1);
    expect(result.metrics.totalLegCount).toBe(2);
    expect(result.metrics.marketChangePercent).toBeCloseTo(10, 5);
    expect(Number.isNaN(result.metrics.totalFeesPaid)).toBe(true);
  });
});
