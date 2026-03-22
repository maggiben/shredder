import type { Order } from "@shredder/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BINANCE_SPOT_TESTNET_BASE_URL } from "./binance-defaults.js";
import { BinanceAdapter } from "./binance-adapter.js";

describe("BinanceAdapter", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("defaults to Spot testnet when baseUrl omitted", async () => {
    vi.stubEnv("BINANCE_BASE_URL", "");
    vi.stubEnv("BINANCE_USE_MAINNET", "");
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ balances: [] }), { status: 200 });
    }) as typeof fetch;
    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s" });
    await adapter.getBalance();
    const url = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(url.startsWith(BINANCE_SPOT_TESTNET_BASE_URL)).toBe(true);
  });

  it("parses balances", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          balances: [
            { asset: "BTC", free: "0.1", locked: "0" },
            { asset: "USDT", free: "1000", locked: "0" },
          ],
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const adapter = new BinanceAdapter({
      apiKey: "k",
      apiSecret: "s",
      baseUrl: "https://example.test",
    });
    const balance = await adapter.getBalance();
    expect(balance.assets[0]).toEqual({ asset: "BTC", free: 0.1, locked: 0 });
  });

  it("throws on failed balance fetch", async () => {
    globalThis.fetch = vi.fn(async () => new Response("nope", { status: 500 })) as typeof fetch;
    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s", baseUrl: "https://example.test" });
    await expect(adapter.getBalance()).rejects.toThrow(/failed/);
  });

  it("places market orders", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          orderId: 42,
          symbol: "BTCUSDT",
          status: "FILLED",
          executedQty: "0.01",
          cummulativeQuoteQty: "400",
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s", baseUrl: "https://example.test" });
    const order: Order = {
      id: "c1",
      symbol: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      quantity: 0.01,
    };
    const result = await adapter.placeOrder(order);
    expect(result.status).toBe("FILLED");
    expect(result.filledQuantity).toBe(0.01);
    expect(result.averageFillPrice).toBe(400 / 0.01);
  });

  it("maps unknown order statuses to NEW", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          orderId: 7,
          symbol: "BTCUSDT",
          status: "WEIRD",
          executedQty: "0",
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s", baseUrl: "https://example.test" });
    const order: Order = {
      id: "c2",
      symbol: "BTC/USDT",
      side: "SELL",
      type: "MARKET",
      quantity: 0.01,
    };
    const result = await adapter.placeOrder(order);
    expect(result.status).toBe("NEW");
  });

  it("throws on failed order response", async () => {
    globalThis.fetch = vi.fn(async () => new Response("bad", { status: 400 })) as typeof fetch;
    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s", baseUrl: "https://example.test" });
    const order: Order = {
      id: "cx",
      symbol: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      quantity: 0.01,
    };
    await expect(adapter.placeOrder(order)).rejects.toThrow(/placeOrder failed/);
  });

  it("requires limit price for LIMIT orders", async () => {
    globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200 })) as typeof fetch;
    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s", baseUrl: "https://example.test" });
    const order: Order = {
      id: "c3",
      symbol: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      quantity: 0.01,
    };
    await expect(adapter.placeOrder(order)).rejects.toThrow(/limitPrice/);
  });

  it("maps assorted Binance statuses", async () => {
    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s", baseUrl: "https://example.test" });
    const order: Order = {
      id: "c5",
      symbol: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      quantity: 1,
    };
    for (const [status, expected] of [
      ["PARTIALLY_FILLED", "PARTIALLY_FILLED"],
      ["CANCELED", "CANCELED"],
      ["EXPIRED", "CANCELED"],
      ["REJECTED", "REJECTED"],
    ] as const) {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({
            orderId: 1,
            symbol: "BTCUSDT",
            status,
            executedQty: "0",
          }),
          { status: 200 },
        );
      }) as typeof fetch;
      const res = await adapter.placeOrder(order);
      expect(res.status).toBe(expected);
    }
  });

  it("computes average fill from fills array", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          orderId: 9,
          symbol: "BTCUSDT",
          status: "FILLED",
          executedQty: "3",
          fills: [
            { price: "10", qty: "1" },
            { price: "20", qty: "2" },
          ],
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const adapter = new BinanceAdapter({ apiKey: "k", apiSecret: "s", baseUrl: "https://example.test" });
    const order: Order = {
      id: "c4",
      symbol: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      quantity: 3,
    };
    const result = await adapter.placeOrder(order);
    expect(result.averageFillPrice).toBeCloseTo((10 + 40) / 3, 5);
  });
});
