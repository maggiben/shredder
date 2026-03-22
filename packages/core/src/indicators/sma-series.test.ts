import { describe, expect, it } from "vitest";
import { smaPair } from "./sma-series.js";

describe("smaPair", () => {
  it("returns undefined without history", () => {
    expect(smaPair([1, 2, 3], 3)).toBeUndefined();
    expect(smaPair([1, 2], 0)).toBeUndefined();
  });

  it("returns current and previous sma", () => {
    const closes = [1, 2, 3, 4, 5];
    const pair = smaPair(closes, 2);
    expect(pair).toEqual({ current: 4.5, previous: 3.5 });
  });
});
