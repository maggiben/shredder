import { describe, expect, it } from "vitest";
import { parseShredderConfig } from "./schema.js";

describe("parseShredderConfig", () => {
  it("parses a valid config", () => {
    const cfg = parseShredderConfig({
      portfolio: { btc: 0.3, stocks: 0.4 },
      strategies: ["ma-crossover", "rsi-reversion"],
      risk: {
        maxNotionalFractionPerTrade: 0.1,
        maxDrawdownFraction: 0.25,
      },
    });
    expect(cfg.strategies).toEqual(["ma-crossover", "rsi-reversion"]);
  });

  it("rejects invalid payloads", () => {
    expect(() => parseShredderConfig({})).toThrow();
  });
});
