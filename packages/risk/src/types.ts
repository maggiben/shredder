import type { StrategyAction } from "@shredder/core";

export interface RiskLimits {
  /** Max fraction of equity (0..1) for a new BUY notional. */
  readonly maxNotionalFractionPerTrade: number;
  /** Halt new BUYs if (peakEquity - equity) / peakEquity exceeds this (0..1). */
  readonly maxDrawdownFraction: number;
  /** Optional minimum equity floor; block BUY if equity at or below. */
  readonly minEquity?: number;
}

export interface RiskEvaluationContext {
  readonly equity: number;
  readonly peakEquity: number;
  readonly proposedBuyNotional: number;
  /**
   * Estimated taker fee as a fraction of quote notional (e.g. 0.001).
   * When set, BUY approval requires `proposedBuyNotional * (1 + rate) <= maxNotional`.
   */
  readonly estimatedTakerFeeRate?: number;
}

export interface RiskDecision {
  readonly allow: boolean;
  readonly reason: string;
}

export interface RiskEngine {
  evaluate(action: StrategyAction, ctx: RiskEvaluationContext): RiskDecision;
}
