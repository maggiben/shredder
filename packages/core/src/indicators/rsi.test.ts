import { describe, expect, it } from "vitest";
import { rsi } from "./rsi.js";

describe("rsi", () => {
  it("returns undefined without enough samples", () => {
    const flat = Array.from({ length: 10 }, () => 100);
    expect(rsi(flat, 14)).toBeUndefined();
  });

  it("clamps to 100 when there is no average loss", () => {
    const up = [100];
    for (let i = 1; i < 20; i += 1) {
      up.push(100 + i);
    }
    expect(rsi(up, 14)).toBe(100);
  });

  it("moves lower on sustained down moves", () => {
    const down = [100];
    for (let i = 1; i < 40; i += 1) {
      down.push(100 - i * 0.5);
    }
    const value = rsi(down, 14);
    expect(value).toBeDefined();
    expect(value!).toBeLessThan(50);
  });
});
