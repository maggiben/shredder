import { describe, expect, it } from "vitest";
import { aggregateSignals } from "./aggregate.js";

describe("aggregateSignals", () => {
  it("handles empty input", () => {
    expect(aggregateSignals([]).action).toBe("HOLD");
  });

  it("selects BUY when dominant", () => {
    const agg = aggregateSignals([
      { action: "BUY", confidence: 0.8, reason: "a" },
      { action: "HOLD", confidence: 0.1, reason: "b" },
    ]);
    expect(agg.action).toBe("BUY");
  });

  it("selects SELL when dominant", () => {
    const agg = aggregateSignals([
      { action: "SELL", confidence: 0.9, reason: "a" },
      { action: "BUY", confidence: 0.2, reason: "b" },
    ]);
    expect(agg.action).toBe("SELL");
  });

  it("falls back to HOLD on ties", () => {
    const agg = aggregateSignals([
      { action: "BUY", confidence: 0.5, reason: "a" },
      { action: "SELL", confidence: 0.5, reason: "b" },
    ]);
    expect(agg.action).toBe("HOLD");
  });

  it("HOLD with zero total confidence when no side has weight", () => {
    const agg = aggregateSignals([
      { action: "HOLD", confidence: 0, reason: "no data" },
      { action: "HOLD", confidence: 0, reason: "no data" },
    ]);
    expect(agg.action).toBe("HOLD");
    expect(agg.confidence).toBe(0);
    expect(agg.reason).toContain("No actionable scores");
  });

  it("includes hold weight in tie-break HOLD reason", () => {
    const agg = aggregateSignals([
      { action: "HOLD", confidence: 0.5, reason: "neutral" },
      { action: "HOLD", confidence: 0.5, reason: "neutral" },
    ]);
    expect(agg.action).toBe("HOLD");
    expect(agg.reason).toContain("hold=1.000");
  });
});
