import { describe, expect, it } from "vitest";
import { commissionQuoteFromBinanceFills } from "./binance-fills.js";

describe("commissionQuoteFromBinanceFills", () => {
  it("sums USDT commission on BTCUSDT", () => {
    const { totalQuote } = commissionQuoteFromBinanceFills("BTCUSDT", [
      { price: "40000", qty: "0.1", commission: "4", commissionAsset: "USDT" },
    ]);
    expect(totalQuote).toBe(4);
  });

  it("converts base BTC commission to quote at fill price", () => {
    const { totalQuote } = commissionQuoteFromBinanceFills("BTCUSDT", [
      { price: "40000", qty: "0.1", commission: "0.0001", commissionAsset: "BTC" },
    ]);
    expect(totalQuote).toBeCloseTo(4, 8);
  });
});
