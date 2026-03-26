import type { StrategySignal } from "@shredder/core";
import type { RiskEngine } from "@shredder/risk";
import type { Strategy } from "@shredder/strategies";
import { aggregateSignals } from "./aggregate.js";
import type { BacktestParams, BacktestResult, BacktestTrade } from "./engine.js";
import { effectiveTakerRate } from "./fee.js";
import { portfolioState } from "./portfolio-state.js";

export type SimulationLedgerAction = "BUY" | "SELL" | "HOLD";

export interface SimulationLedgerRow {
  readonly barIndex: number;
  readonly timestamp: number;
  readonly close: number;
  /** Majority vote from strategies before execution rules. */
  readonly signalAction: SimulationLedgerAction;
  readonly signalReason: string;
  /** What changed the portfolio (BUY/SELL fill or HOLD). */
  readonly executedAction: SimulationLedgerAction;
  readonly tradeQuantity: number | null;
  readonly tradePrice: number | null;
  /** Notional for BUY (cash spent) or SELL (gross cash before fee). */
  readonly tradeValue: number | null;
  /** Quote fee paid on this bar's fill (if any). */
  readonly tradeFee: number | null;
  readonly cashAfter: number;
  readonly positionQtyAfter: number;
  readonly equityAfter: number;
  readonly notes: string;
}

export interface SimulationSignalStats {
  /** BUY signal blocked by the risk engine (drawdown / notional limits). */
  readonly buyBlockedByRisk: number;
  /** BUY signal while already long (engine does not pyramid). */
  readonly buySkippedInPosition: number;
  /** SELL signal while flat. */
  readonly sellSkippedFlat: number;
  /** Not modeled in this engine; always zero (reserved for future timeout logic). */
  readonly entryTimeouts: number;
  /** Not modeled in this engine; always zero (reserved for future timeout logic). */
  readonly exitTimeouts: number;
}

export interface SimulationLedgerResult extends BacktestResult {
  readonly rows: readonly SimulationLedgerRow[];
  readonly signalStats: SimulationSignalStats;
}

export function runSimulationLedger(params: BacktestParams): SimulationLedgerResult {
  if (params.deployFraction <= 0 || params.deployFraction > 1) {
    throw new Error("deployFraction must be in (0,1]");
  }
  let cash = params.initialCash;
  let qty = 0;
  let peakEquity = params.initialCash;
  const equityCurve: number[] = [];
  const trades: BacktestTrade[] = [];
  const rows: SimulationLedgerRow[] = [];
  let buyBlockedByRisk = 0;
  let buySkippedInPosition = 0;
  let sellSkippedFlat = 0;

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

    let executedAction: SimulationLedgerAction = "HOLD";
    let tradeQuantity: number | null = null;
    let tradePrice: number | null = null;
    let tradeValue: number | null = null;
    let tradeFee: number | null = null;
    const notes: string[] = [];

    if (agg.action === "BUY" && qty === 0) {
      const budget = equityBefore * params.deployFraction;
      const feeRate = effectiveTakerRate(params, last.timestamp);
      const riskDecision = params.risk.evaluate("BUY", {
        equity: equityBefore,
        peakEquity,
        proposedBuyNotional: budget,
        estimatedTakerFeeRate: feeRate,
      });
      if (!riskDecision.allow) {
        buyBlockedByRisk += 1;
        notes.push(`Risk blocked BUY: ${riskDecision.reason}`);
      } else if (budget <= 0 || markPrice <= 0) {
        notes.push("No budget or invalid price for BUY");
      } else {
        const notional = budget;
        const fee = notional * feeRate;
        const buyQty = notional / markPrice;
        cash -= notional + fee;
        qty += buyQty;
        executedAction = "BUY";
        tradeQuantity = buyQty;
        tradePrice = markPrice;
        tradeValue = notional;
        tradeFee = fee;
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
    } else if (agg.action === "BUY" && qty > 0) {
      buySkippedInPosition += 1;
      notes.push("Signal BUY but already in position");
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
      executedAction = "SELL";
      tradeQuantity = qty;
      tradePrice = markPrice;
      tradeValue = gross;
      tradeFee = fee;
      qty = 0;
    } else if (agg.action === "SELL" && qty === 0) {
      sellSkippedFlat += 1;
      notes.push("Signal SELL but flat");
    }

    const equityAfter = cash + qty * markPrice;
    equityCurve.push(equityAfter);

    rows.push({
      barIndex: i,
      timestamp: last.timestamp,
      close: markPrice,
      signalAction: agg.action,
      signalReason: agg.reason,
      executedAction,
      tradeQuantity,
      tradePrice,
      tradeValue,
      tradeFee,
      cashAfter: cash,
      positionQtyAfter: qty,
      equityAfter,
      notes: notes.length > 0 ? notes.join(" · ") : "",
    });
  }

  return {
    finalCash: cash,
    finalPositionQty: qty,
    equityCurve,
    trades,
    rows,
    signalStats: {
      buyBlockedByRisk,
      buySkippedInPosition,
      sellSkippedFlat,
      entryTimeouts: 0,
      exitTimeouts: 0,
    },
  };
}
