import { describe, expect, it } from "vitest";
import { bucketChartToCandles } from "./bucket-chart.js";

describe("bucketChartToCandles", () => {
  it("builds OHLCV and returns last limit bars", () => {
    const interval = 60_000;
    const prices: [number, number][] = [
      [0, 10],
      [30_000, 12],
      [60_000, 11],
      [90_000, 13],
    ];
    const volumes: [number, number][] = [
      [0, 100],
      [60_000, 200],
    ];
    const candles = bucketChartToCandles(prices, volumes, interval, 2);
    expect(candles).toHaveLength(2);
    expect(candles[0]).toMatchObject({
      timestamp: 0,
      open: 10,
      high: 12,
      low: 10,
      close: 12,
      volume: 100,
    });
    expect(candles[1]).toMatchObject({
      timestamp: 60_000,
      open: 11,
      high: 13,
      low: 11,
      close: 13,
      volume: 200,
    });
  });

  it("returns empty for no prices", () => {
    expect(bucketChartToCandles([], [], 60_000, 10)).toEqual([]);
  });
});
