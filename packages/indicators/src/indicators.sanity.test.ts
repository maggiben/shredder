import { describe, expect, it } from "vitest";
import { mom } from "./indicators/mom.js";
import { sma } from "./indicators/sma.js";

/** Minimal OHLCV matrix: [ts, o, c, h, l, v] */
function makeCandles(closes: number[]): import("./types.js").OhlcvMatrix {
  return closes.map((c, i) => Float64Array.from([i, c, c, c, c, 1]));
}

describe("indicator sanity", () => {
  it("sma last value matches simple mean", () => {
    const candles = makeCandles([1, 2, 3, 4, 5]);
    const last = sma(candles, 3, "close", false) as number;
    expect(last).toBeCloseTo(4, 10);
  });

  it("mom shape and last momentum", () => {
    const candles = makeCandles([10, 11, 12, 15, 14]);
    const seq = mom(candles, 2, "close", true) as Float64Array;
    expect(Number.isNaN(seq[0]!)).toBe(true);
    expect(Number.isNaN(seq[1]!)).toBe(true);
    expect(seq[4]).toBeCloseTo(2, 10);
  });
});
