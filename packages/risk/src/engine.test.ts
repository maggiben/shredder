import { describe, expect, it } from "vitest";
import { DefaultRiskEngine } from "./engine.js";

describe("DefaultRiskEngine", () => {
  const limits = {
    maxNotionalFractionPerTrade: 0.2,
    maxDrawdownFraction: 0.3,
  };

  it("allows HOLD and SELL", () => {
    const engine = new DefaultRiskEngine(limits);
    expect(engine.evaluate("HOLD", ctx(1000, 1000, 500))).toEqual({
      allow: true,
      reason: "Risk layer does not block HOLD or SELL",
    });
    expect(engine.evaluate("SELL", ctx(1000, 1000, 500))).toEqual({
      allow: true,
      reason: "Risk layer does not block HOLD or SELL",
    });
  });

  it("blocks BUY when drawdown breached", () => {
    const engine = new DefaultRiskEngine(limits);
    const decision = engine.evaluate("BUY", ctx(600, 1000, 100));
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/Drawdown/);
  });

  it("blocks BUY when notional too large", () => {
    const engine = new DefaultRiskEngine(limits);
    const decision = engine.evaluate("BUY", ctx(1000, 1000, 300));
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/notional/);
  });

  it("blocks BUY when peak equity invalid", () => {
    const engine = new DefaultRiskEngine(limits);
    const decision = engine.evaluate("BUY", { equity: 100, peakEquity: 0, proposedBuyNotional: 10 });
    expect(decision.allow).toBe(false);
  });

  it("respects optional equity floor", () => {
    const engine = new DefaultRiskEngine({ ...limits, minEquity: 500 });
    const decision = engine.evaluate("BUY", ctx(500, 1000, 50));
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/floor/);
  });

  it("allows BUY inside limits", () => {
    const engine = new DefaultRiskEngine(limits);
    const decision = engine.evaluate("BUY", ctx(1000, 1000, 150));
    expect(decision.allow).toBe(true);
  });

  it("blocks BUY when notional plus taker fee exceeds cap", () => {
    const engine = new DefaultRiskEngine(limits);
    const decision = engine.evaluate("BUY", {
      equity: 1000,
      peakEquity: 1000,
      proposedBuyNotional: 199,
      estimatedTakerFeeRate: 0.01,
    });
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/fees/);
  });
});

function ctx(equity: number, peak: number, proposed: number) {
  return { equity, peakEquity: peak, proposedBuyNotional: proposed };
}
