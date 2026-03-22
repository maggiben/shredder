import { describe, expect, it } from "vitest";
import { sma } from "./sma.js";

describe("sma", () => {
  it("returns undefined when period invalid or insufficient data", () => {
    expect(sma([1, 2, 3], 0)).toBeUndefined();
    expect(sma([1, 2], 3)).toBeUndefined();
  });

  it("averages the last period closes", () => {
    expect(sma([1, 2, 3, 4], 2)).toBe(3.5);
    expect(sma([10, 20, 30], 3)).toBe(20);
  });
});
