import { describe, expect, it } from "vitest";
import { adx } from "./adx.js";

describe("adx", () => {
  it("returns undefined for short series", () => {
    expect(adx([1, 2], [1, 2], [1, 2], 14)).toBeUndefined();
  });

  it("produces finite metrics on trending synthetic data", () => {
    const n = 80;
    const highs: number[] = [];
    const lows: number[] = [];
    const closes: number[] = [];
    let p = 100;
    for (let i = 0; i < n; i += 1) {
      p += 0.5;
      closes.push(p);
      highs.push(p + 0.2);
      lows.push(p - 0.2);
    }
    const r = adx(highs, lows, closes, 14);
    expect(r).toBeDefined();
    expect(r!.adx).toBeGreaterThan(0);
    expect(Number.isFinite(r!.plusDi)).toBe(true);
    expect(Number.isFinite(r!.minusDi)).toBe(true);
  });
});
