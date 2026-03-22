import { describe, expect, it } from "vitest";
import { bollingerBands } from "./bollinger.js";

describe("bollingerBands", () => {
  it("returns undefined when insufficient data", () => {
    expect(bollingerBands([1, 2], 5, 2)).toBeUndefined();
  });

  it("computes symmetric bands around SMA", () => {
    const closes = [10, 10, 10, 10, 10];
    const b = bollingerBands(closes, 5, 2);
    expect(b).toBeDefined();
    expect(b!.middle).toBe(10);
    expect(b!.upper).toBe(10);
    expect(b!.lower).toBe(10);
  });

  it("widens with volatility", () => {
    const closes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const b = bollingerBands(closes, 5, 2);
    expect(b).toBeDefined();
    expect(b!.upper).toBeGreaterThan(b!.middle);
    expect(b!.lower).toBeLessThan(b!.middle);
  });
});
