import type { Candle, PortfolioState, StrategySignal } from "@shredder/core";
import type { RiskEngine } from "@shredder/risk";
import type { Strategy } from "@shredder/strategies";
import { aggregateSignals } from "./aggregate.js";

export interface BacktestParams {
  readonly symbol: string;
  readonly candles: readonly Candle[];
  readonly strategies: readonly Strategy[];
  readonly initialCash: number;
  /** Fraction of equity to deploy per BUY (0..1]. */
  readonly deployFraction: number;
  readonly warmupBars: number;
  readonly risk: RiskEngine;
}

export interface BacktestTrade {
  readonly timestamp: number;
  readonly side: "BUY" | "SELL";
  readonly price: number;
  readonly quantity: number;
  readonly reason: string;
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
      const riskDecision = params.risk.evaluate("BUY", {
        equity: equityBefore,
        peakEquity,
        proposedBuyNotional: budget,
      });
      if (riskDecision.allow && budget > 0 && markPrice > 0) {
        const buyQty = budget / markPrice;
        cash -= buyQty * markPrice;
        qty += buyQty;
        trades.push({
          timestamp: last.timestamp,
          side: "BUY",
          price: markPrice,
          quantity: buyQty,
          reason: agg.reason,
        });
      }
    } else if (agg.action === "SELL" && qty > 0) {
      cash += qty * markPrice;
      trades.push({
        timestamp: last.timestamp,
        side: "SELL",
        price: markPrice,
        quantity: qty,
        reason: agg.reason,
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

function portfolioState(
  cash: number,
  qty: number,
  mark: number,
  symbol: string,
): PortfolioState {
  if (qty === 0) {
    return { cash, positions: [] };
  }
  return {
    cash,
    positions: [{ symbol, quantity: qty, averageEntryPrice: mark }],
    equity: cash + qty * mark,
  };
}
