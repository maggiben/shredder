import { describe, expect, it } from "vitest";
import { closesFrom } from "./candles.js";

describe("closesFrom", () => {
  it("maps closes", () => {
    const candles = [
      {
        timestamp: 1,
        open: 1,
        high: 1,
        low: 1,
        close: 2,
        volume: 1,
      },
    ] as const;
    expect(closesFrom(candles)).toEqual([2]);
  });
});
