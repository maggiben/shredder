import { describe, expect, it } from "vitest";
import { parseIntervalToMs } from "./interval-ms.js";

describe("parseIntervalToMs", () => {
  it("parses common units", () => {
    expect(parseIntervalToMs("1m")).toBe(60_000);
    expect(parseIntervalToMs("15m")).toBe(15 * 60_000);
    expect(parseIntervalToMs("1h")).toBe(3_600_000);
    expect(parseIntervalToMs("4h")).toBe(4 * 3_600_000);
    expect(parseIntervalToMs("1d")).toBe(86_400_000);
    expect(parseIntervalToMs("1w")).toBe(7 * 86_400_000);
  });

  it("trims and lowercases", () => {
    expect(parseIntervalToMs("  2H  ")).toBe(2 * 3_600_000);
  });

  it("rejects invalid", () => {
    expect(() => parseIntervalToMs("")).toThrow(/Unsupported/);
    expect(() => parseIntervalToMs("0m")).toThrow(/Unsupported/);
    expect(() => parseIntervalToMs("1x")).toThrow(/Unsupported/);
  });
});
