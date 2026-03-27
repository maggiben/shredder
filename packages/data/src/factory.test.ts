import { describe, expect, it } from "vitest";
import { createMarketDataSourceFromEnv } from "./factory.js";

describe("createMarketDataSourceFromEnv", () => {
  it("returns null source for demo / none / unset", () => {
    expect(createMarketDataSourceFromEnv({}).source).toBeNull();
    expect(createMarketDataSourceFromEnv({ MARKET_DATA_PROVIDER: "demo" }).source).toBeNull();
    expect(createMarketDataSourceFromEnv({ MARKET_DATA_PROVIDER: "none" }).source).toBeNull();
  });

  it("builds coingecko source", () => {
    const r = createMarketDataSourceFromEnv({ MARKET_DATA_PROVIDER: "coingecko" });
    expect(r.provider).toBe("coingecko");
    expect(r.source).not.toBeNull();
    expect(typeof r.source!.getCandles).toBe("function");
  });

  it("merges symbol map JSON", () => {
    const r = createMarketDataSourceFromEnv({
      MARKET_DATA_PROVIDER: "coingecko",
      MARKET_DATA_COINGECKO_SYMBOL_MAP: JSON.stringify({ FOO: "foo-coin" }),
    });
    expect(r.source).not.toBeNull();
  });

  it("builds binance source", () => {
    const r = createMarketDataSourceFromEnv({
      MARKET_DATA_PROVIDER: "binance",
      BINANCE_BASE_URL: "https://testnet.binance.vision",
    });
    expect(r.provider).toBe("binance");
    expect(r.source).not.toBeNull();
    expect(typeof r.source!.getCandles).toBe("function");
  });

  it("throws for polygon until implemented", () => {
    expect(() =>
      createMarketDataSourceFromEnv({ MARKET_DATA_PROVIDER: "polygon" }),
    ).toThrow(/not implemented/);
  });

  it("throws for unknown provider", () => {
    expect(() =>
      createMarketDataSourceFromEnv({ MARKET_DATA_PROVIDER: "kraken" }),
    ).toThrow(/Unknown MARKET_DATA_PROVIDER/);
  });

  it("throws on invalid map JSON", () => {
    expect(() =>
      createMarketDataSourceFromEnv({
        MARKET_DATA_PROVIDER: "coingecko",
        MARKET_DATA_COINGECKO_SYMBOL_MAP: "not-json",
      }),
    ).toThrow(/valid JSON/);
  });
});
