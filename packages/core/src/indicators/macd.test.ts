import { describe, expect, it } from "vitest";
import { macd, macdPrevious } from "./macd.js";

describe("macd", () => {
  it("returns undefined when not enough data", () => {
    expect(macd([1, 2, 3], 12, 26, 9)).toBeUndefined();
    expect(macd([1, 2, 3], 0, 26, 9)).toBeUndefined();
    expect(macdPrevious([1], 12, 26, 9)).toBeUndefined();
  });

  it("computes line, signal, histogram", () => {
    const closes = Array.from({ length: 80 }, (_, i) => 50 + Math.sin(i / 4) * 5);
    const result = macd(closes, 12, 26, 9);
    expect(result).toBeDefined();
    expect(result!.histogram).toBeCloseTo(result!.line - result!.signal, 8);
  });

  it("macdPrevious lags by one bar", () => {
    const closes = Array.from({ length: 80 }, (_, i) => 100 + i * 0.1);
    const prev = macdPrevious(closes, 12, 26, 9);
    const cur = macd(closes, 12, 26, 9);
    expect(prev).toBeDefined();
    expect(cur).toBeDefined();
    expect(prev!.line).not.toBe(cur!.line);
  });
});
