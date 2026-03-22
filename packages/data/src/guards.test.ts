import { describe, expect, it } from "vitest";
import { isMarketDataSource } from "./guards.js";

describe("isMarketDataSource", () => {
  it("narrows objects with getCandles", () => {
    const source = {
      getCandles: async () => [],
    };
    expect(isMarketDataSource(source)).toBe(true);
  });

  it("rejects primitives", () => {
    expect(isMarketDataSource(null)).toBe(false);
    expect(isMarketDataSource({})).toBe(false);
    expect(isMarketDataSource({ getCandles: 1 })).toBe(false);
  });
});
