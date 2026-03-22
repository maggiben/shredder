import type { StrategyAction } from "@shredder/core";
import type {
  RiskDecision,
  RiskEngine,
  RiskEvaluationContext,
  RiskLimits,
} from "./types.js";

export class DefaultRiskEngine implements RiskEngine {
  constructor(private readonly limits: RiskLimits) {}

  evaluate(action: StrategyAction, ctx: RiskEvaluationContext): RiskDecision {
    if (action === "HOLD" || action === "SELL") {
      return { allow: true, reason: "Risk layer does not block HOLD or SELL" };
    }
    if (ctx.peakEquity <= 0) {
      return { allow: false, reason: "Invalid peak equity" };
    }
    if (this.limits.minEquity !== undefined && ctx.equity <= this.limits.minEquity) {
      return {
        allow: false,
        reason: `Equity ${ctx.equity} at or below floor ${this.limits.minEquity}`,
      };
    }
    const drawdown = (ctx.peakEquity - ctx.equity) / ctx.peakEquity;
    if (drawdown > this.limits.maxDrawdownFraction) {
      return {
        allow: false,
        reason: `Drawdown ${(drawdown * 100).toFixed(2)}% exceeds limit ${(this.limits.maxDrawdownFraction * 100).toFixed(2)}%`,
      };
    }
    const maxNotional = ctx.equity * this.limits.maxNotionalFractionPerTrade;
    if (ctx.proposedBuyNotional > maxNotional) {
      return {
        allow: false,
        reason: `Proposed notional ${ctx.proposedBuyNotional.toFixed(2)} exceeds cap ${maxNotional.toFixed(2)}`,
      };
    }
    return { allow: true, reason: "Within risk limits" };
  }
}
