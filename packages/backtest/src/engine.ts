import type { Candle, StrategySignal } from "@shredder/core";
import type { RiskEngine } from "@shredder/risk";
import type { Strategy } from "@shredder/strategies";
import { aggregateSignals } from "./aggregate.js";
import { effectiveTakerRate } from "./fee.js";
import { portfolioState } from "./portfolio-state.js";

/** Taker-fee model: quote-notional fee on each BUY and SELL leg (rates may vary by bar via resolver). */
export interface BacktestFeeModel {
  /** Default / fallback taker rate when no per-bar resolver is set. */
  readonly takerRate: number;
  /** Optional time-varying taker rate (e.g. refreshed from exchange). */
  readonly resolveTakerFeeRate?: (timestampMs: number) => number;
}

export interface BacktestParams {
  readonly symbol: string;
  readonly candles: readonly Candle[];
  readonly strategies: readonly Strategy[];
  readonly initialCash: number;
  /** Fraction of equity to deploy per BUY (0..1]. */
  readonly deployFraction: number;
  readonly warmupBars: number;
  readonly risk: RiskEngine;
  readonly fee?: BacktestFeeModel;
}

export interface BacktestTrade {
  readonly timestamp: number;
  readonly side: "BUY" | "SELL";
  readonly price: number;
  readonly quantity: number;
  readonly reason: string;
  /** Fee paid in quote currency on this leg. */
  readonly fee: number;
  /** Taker rate applied (fraction of quote notional). */
  readonly feeRate: number;
}

export interface BacktestResult {
  readonly finalCash: number;
  readonly finalPositionQty: number;
  readonly equityCurve: readonly number[];
  readonly trades: readonly BacktestTrade[];
}

export function runBacktest(params: BacktestParams): BacktestResult {
  if (params.deployFraction <= 0 || params.deployFraction > 1) {
    throw new Error("deployFraction must be in (0,1]");
  }
  let cash = params.initialCash;
  let qty = 0;
  let peakEquity = params.initialCash;
  const equityCurve: number[] = [];
  const trades: BacktestTrade[] = [];

  for (let i = params.warmupBars; i < params.candles.length; i += 1) {
    const window = params.candles.slice(0, i + 1);
    const last = params.candles[i]!;
    const markPrice = last.close;
    const equityBefore = cash + qty * markPrice;
    if (equityBefore > peakEquity) {
      peakEquity = equityBefore;
    }

    const portfolio = portfolioState(cash, qty, markPrice, params.symbol);
    const signals: StrategySignal[] = params.strategies.map((s) =>
      s.evaluate({
        symbol: params.symbol,
        candles: window,
        indicators: {},
        portfolio,
      }),
    );
    const agg = aggregateSignals(signals);

    if (agg.action === "BUY" && qty === 0) {
      const budget = equityBefore * params.deployFraction;
      const feeRate = effectiveTakerRate(params, last.timestamp);
      const riskDecision = params.risk.evaluate("BUY", {
        equity: equityBefore,
        peakEquity,
        proposedBuyNotional: budget,
        estimatedTakerFeeRate: feeRate,
      });
      if (riskDecision.allow && budget > 0 && markPrice > 0) {
        const notional = budget;
        const fee = notional * feeRate;
        const buyQty = notional / markPrice;
        cash -= notional + fee;
        qty += buyQty;
        trades.push({
          timestamp: last.timestamp,
          side: "BUY",
          price: markPrice,
          quantity: buyQty,
          reason: agg.reason,
          fee,
          feeRate,
        });
      }
    } else if (agg.action === "SELL" && qty > 0) {
      const feeRate = effectiveTakerRate(params, last.timestamp);
      const gross = qty * markPrice;
      const fee = gross * feeRate;
      cash += gross - fee;
      trades.push({
        timestamp: last.timestamp,
        side: "SELL",
        price: markPrice,
        quantity: qty,
        reason: agg.reason,
        fee,
        feeRate,
      });
      qty = 0;
    }

    const equityAfter = cash + qty * markPrice;
    equityCurve.push(equityAfter);
  }

  return {
    finalCash: cash,
    finalPositionQty: qty,
    equityCurve,
    trades,
  };
}
