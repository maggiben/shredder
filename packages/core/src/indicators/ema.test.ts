import { describe, expect, it } from "vitest";
import { ema } from "./ema.js";

describe("ema", () => {
  it("returns undefined for bad input", () => {
    expect(ema([], 10)).toBeUndefined();
    expect(ema([1], 0)).toBeUndefined();
    expect(ema([1, 2, 3], 10)).toBeUndefined();
  });

  it("smooths closes", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const value = ema(closes, 10);
    expect(value).toBeDefined();
    expect(value!).toBeGreaterThan(100);
    expect(value!).toBeLessThan(130);
  });
});
