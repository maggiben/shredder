import { describe, expect, it, vi } from "vitest";
import {
  createCoinGeckoMarketDataSource,
  defaultCoinGeckoMarketDataSourceConfig,
} from "./coingecko-market-data-source.js";

describe("createCoinGeckoMarketDataSource", () => {
  it("maps CoinGecko OHLC rows without flattening O/H/L/C", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => [
        [1000, 10, 14, 9, 13],
        [2000, 13, 15, 12, 14],
      ],
    });
    const source = createCoinGeckoMarketDataSource(
      defaultCoinGeckoMarketDataSourceConfig({
        fetchFn,
        symbolToCoinId: { BTCUSDT: "bitcoin" },
      }),
    );

    const candles = await source.getCandles("BTCUSDT", "5m", 50);

    expect(candles).toEqual([
      { timestamp: 1000, open: 10, high: 14, low: 9, close: 13, volume: 0 },
      { timestamp: 2000, open: 13, high: 15, low: 12, close: 14, volume: 0 },
    ]);
    expect(candles[0]?.open).not.toBe(candles[0]?.high);
    expect(candles[0]?.low).not.toBe(candles[0]?.close);
  });

  it("returns last N candles when response exceeds limit", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => [
        [1000, 1, 2, 0.5, 1.5],
        [2000, 2, 3, 1.8, 2.4],
        [3000, 3, 4, 2.7, 3.5],
      ],
    });
    const source = createCoinGeckoMarketDataSource(
      defaultCoinGeckoMarketDataSourceConfig({
        fetchFn,
        symbolToCoinId: { BTCUSDT: "bitcoin" },
      }),
    );

    const candles = await source.getCandles("BTCUSDT", "5m", 2);
    expect(candles).toHaveLength(2);
    expect(candles[0]?.timestamp).toBe(2000);
    expect(candles[1]?.timestamp).toBe(3000);
  });
});
