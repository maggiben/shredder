"use client";

import { useMemo } from "react";
import type { SimulationRunResponse } from "../lib/api";
import type { TradingBotPaperTrade, TradingBotWorkerCandle } from "../lib/api";

function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 120) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 120) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function fmtPlain(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function fmtSigned(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}`;
}

function fmtMaybeNumber(n: number | null, digits = 2): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return String(Math.trunc(n));
}

function MetricTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-0.5 font-mono text-sm text-zinc-200">{children}</div>
    </div>
  );
}

type ResultsLike = SimulationRunResponse;

function isValidDateString(s: unknown): s is string {
  if (typeof s !== "string" || s.trim() === "") return false;
  return Number.isFinite(new Date(s).getTime());
}

/** Exported for unit tests; bot trails only populate a subset of simulation metrics today. */
export function buildBotResultsLike(input: {
  symbol: string;
  interval: string;
  marketTrail: TradingBotWorkerCandle[];
  paperTrail: TradingBotPaperTrade[];
}): ResultsLike {
  const candles = [...input.marketTrail].sort((a, b) => a.timestamp - b.timestamp);
  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];

  const periodFrom =
    firstCandle && Number.isFinite(firstCandle.timestamp) ? new Date(firstCandle.timestamp).toISOString() : new Date(0).toISOString();
  const periodTo =
    lastCandle && Number.isFinite(lastCandle.timestamp) ? new Date(lastCandle.timestamp).toISOString() : new Date(0).toISOString();

  const spanMs =
    firstCandle && lastCandle ? Math.max(0, lastCandle.timestamp - firstCandle.timestamp) : 0;
  const calendarDaysInPeriod = Math.max(1, spanMs / 86_400_000);

  const firstClose = firstCandle?.close;
  const lastClose = lastCandle?.close;
  const marketChangePercent =
    typeof firstClose === "number" && typeof lastClose === "number" && Number.isFinite(firstClose) && Number.isFinite(lastClose) && firstClose > 0
      ? ((lastClose - firstClose) / firstClose) * 100
      : Number.NaN;

  // Pair BUY→SELL across the full persisted history (same rule as backtest metrics: adjacent pairing).
  const sortedTrail = [...input.paperTrail].sort((a, b) => a.timestamp - b.timestamp);
  let closedTradeCount = 0;
  for (let i = 0; i < sortedTrail.length; i += 1) {
    const a = sortedTrail[i];
    const b = sortedTrail[i + 1];
    if (a?.kind === "buy" && b?.kind === "sell") {
      closedTradeCount += 1;
      i += 1;
    }
  }

  const avgTradesPerDay = calendarDaysInPeriod > 0 ? closedTradeCount / calendarDaysInPeriod : Number.NaN;

  // Bot trails don't currently persist quantity/fees/equity, so these metrics are intentionally unknown.
  const unknown = Number.NaN;
  const metrics = {
    periodFrom,
    periodTo,
    calendarDaysInPeriod,
    maxOpenTrades: unknown,
    maxPositionQty: unknown,
    closedTradeCount,
    totalLegCount: sortedTrail.length,
    avgTradesPerDay,
    startingBalance: unknown,
    finalBalance: unknown,
    absoluteProfit: unknown,
    totalProfitPercent: unknown,
    cagrPercent: unknown,
    profitFactor: null,
    expectancy: unknown,
    expectancyRatio: null,
    avgDailyProfitPercent: unknown,
    avgStakeNotional: unknown,
    totalTradeVolume: unknown,
    totalFeesPaid: unknown,
    avgFeePerLeg: unknown,
    avgEffectiveFeeRateBps: unknown,
    profitToFeesRatio: null,
    daysWin: unknown,
    daysDraw: unknown,
    daysLose: unknown,
    bestTrade: unknown,
    worstTrade: unknown,
    bestDay: unknown,
    worstDay: unknown,
    avgDurationWinnersMs: unknown,
    avgDurationLosersMs: unknown,
    maxConsecutiveWins: unknown,
    maxConsecutiveLosses: unknown,
    rejectedEntrySignals: unknown,
    entryTimeouts: unknown,
    exitTimeouts: unknown,
    minBalance: unknown,
    maxBalance: unknown,
    maxUnderwaterPercent: unknown,
    absoluteDrawdown: unknown,
    drawdownHigh: unknown,
    drawdownLow: unknown,
    drawdownStart: periodFrom,
    drawdownEnd: periodTo,
    marketChangePercent,
  } satisfies ResultsLike["metrics"];

  const signalStats = {
    sellSkippedFlat: 0,
    entryTimeouts: 0,
    exitTimeouts: 0,
    buyBlockedByRisk: 0,
    buySkippedInPosition: 0,
  } satisfies ResultsLike["signalStats"];

  return {
    baseUrl: "bot-trails",
    symbol: input.symbol,
    interval: input.interval as any,
    candleCount: candles.length,
    metrics,
    signalStats,
    rows: [],
    feeModel: { takerFeeRate: 0, source: "default" },
  };
}

export function ResultsPanel({
  result,
  title,
}: {
  result:
    | SimulationRunResponse
    | {
        kind: "bot";
        symbol: string;
        interval: string;
        marketTrail: TradingBotWorkerCandle[];
        paperTrail: TradingBotPaperTrade[];
      };
  title?: string;
}) {
  const normalized = useMemo((): ResultsLike => {
    const r = result as { kind?: string };
    if (typeof r?.kind === "string" && r.kind === "bot") {
      return buildBotResultsLike(result as Parameters<typeof buildBotResultsLike>[0]);
    }
    return result as SimulationRunResponse;
  }, [result]);

  const m = normalized.metrics;
  const sig = normalized.signalStats;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
      <div>
        <h3 className="text-md font-medium text-white">{title ?? "Results"}</h3>
        <p className="mt-1 text-xs text-zinc-500">
          <span className="font-mono text-zinc-400">
            {normalized.symbol} · {normalized.interval}
          </span>
          {" · "}
          {normalized.candleCount} candles · Binance{" "}
          <span className="font-mono text-zinc-500">{normalized.baseUrl}</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Taker fee model:{" "}
          <span className="font-mono text-zinc-300">{fmtPlain(normalized.feeModel.takerFeeRate * 100, 4)}%</span>{" "}
          <span className="text-zinc-600">({normalized.feeModel.source})</span>
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Period</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="From (first bar after warmup)">
            {isValidDateString(m.periodFrom) ? new Date(m.periodFrom).toLocaleString() : "—"}
          </MetricTile>
          <MetricTile label="To (last bar)">
            {isValidDateString(m.periodTo) ? new Date(m.periodTo).toLocaleString() : "—"}
          </MetricTile>
          <MetricTile label="Calendar days (span)">{fmtPlain(m.calendarDaysInPeriod)}</MetricTile>
          <MetricTile label="Market change % (buy &amp; hold, same window)">{fmtPct(m.marketChangePercent)}</MetricTile>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Balance &amp; return</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Starting balance">{fmtPlain(m.startingBalance)}</MetricTile>
          <MetricTile label="Final balance (mark to last close)">
            <span className="text-emerald-300/90">{fmtPlain(m.finalBalance)}</span>
          </MetricTile>
          <MetricTile label="Absolute profit">
            <span className={m.absoluteProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {fmtSigned(m.absoluteProfit)}
            </span>
          </MetricTile>
          <MetricTile label="Total profit %">{fmtPct(m.totalProfitPercent)}</MetricTile>
          <MetricTile label="CAGR %">{fmtPct(m.cagrPercent)}</MetricTile>
          <MetricTile label="Min balance">{fmtPlain(m.minBalance)}</MetricTile>
          <MetricTile label="Max balance">{fmtPlain(m.maxBalance)}</MetricTile>
          <MetricTile label="Avg daily profit % (calendar days)">{fmtPct(m.avgDailyProfitPercent)}</MetricTile>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Fees &amp; commissions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Total fees paid (quote)">{fmtPlain(m.totalFeesPaid)}</MetricTile>
          <MetricTile label="Avg fee per leg (quote)">{fmtPlain(m.avgFeePerLeg)}</MetricTile>
          <MetricTile label="Avg effective fee (bps of volume)">{fmtPlain(m.avgEffectiveFeeRateBps, 4)}</MetricTile>
          <MetricTile label="Net profit ÷ fees (×)">{m.profitToFeesRatio === null ? "—" : fmtPlain(m.profitToFeesRatio, 4)}</MetricTile>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Trades &amp; activity</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Max open positions (concurrent)">{fmtInt(m.maxOpenTrades)}</MetricTile>
          <MetricTile label="Peak position size (base qty)">{fmtPlain(m.maxPositionQty, 6)}</MetricTile>
          <MetricTile label="Closed round trips">{fmtInt(m.closedTradeCount)}</MetricTile>
          <MetricTile label="Executed legs (BUY+SELL)">{fmtInt(m.totalLegCount)}</MetricTile>
          <MetricTile label="Avg trades / day (round trips)">{fmtPlain(m.avgTradesPerDay, 4)}</MetricTile>
          <MetricTile label="Total trade volume (quote)">{fmtPlain(m.totalTradeVolume)}</MetricTile>
          <MetricTile label="Avg stake (avg position notional when long)">{fmtPlain(m.avgStakeNotional)}</MetricTile>
          <MetricTile label="Profit factor">{fmtMaybeNumber(m.profitFactor)}</MetricTile>
          <MetricTile label="Expectancy / trade (quote)">{fmtSigned(m.expectancy)}</MetricTile>
          <MetricTile label="Expectancy ratio (avg win ÷ avg loss)">{fmtMaybeNumber(m.expectancyRatio)}</MetricTile>
          <MetricTile label="Best trade (closed)">{fmtSigned(m.bestTrade)}</MetricTile>
          <MetricTile label="Worst trade (closed)">{fmtSigned(m.worstTrade)}</MetricTile>
          <MetricTile label="Avg duration — winners">{formatDurationMs(m.avgDurationWinnersMs)}</MetricTile>
          <MetricTile label="Avg duration — losers">{formatDurationMs(m.avgDurationLosersMs)}</MetricTile>
          <MetricTile label="Max consecutive wins">{m.maxConsecutiveWins}</MetricTile>
          <MetricTile label="Max consecutive losses">{m.maxConsecutiveLosses}</MetricTile>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Daily outcomes (UTC calendar days)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Days win / draw / lose">
            {fmtInt(m.daysWin)} / {fmtInt(m.daysDraw)} / {fmtInt(m.daysLose)}
          </MetricTile>
          <MetricTile label="Best day (quote P&amp;L)">{fmtSigned(m.bestDay)}</MetricTile>
          <MetricTile label="Worst day (quote P&amp;L)">{fmtSigned(m.worstDay)}</MetricTile>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Drawdown</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Max % underwater (from running peak)">{fmtPct(m.maxUnderwaterPercent)}</MetricTile>
          <MetricTile label="Absolute drawdown (quote, account equity)">{fmtPlain(m.absoluteDrawdown)}</MetricTile>
          <MetricTile label="Drawdown high (peak equity)">{fmtPlain(m.drawdownHigh)}</MetricTile>
          <MetricTile label="Drawdown low (trough equity)">{fmtPlain(m.drawdownLow)}</MetricTile>
          <MetricTile label="Drawdown start (peak time)">
            {isValidDateString(m.drawdownStart) ? new Date(m.drawdownStart).toLocaleString() : "—"}
          </MetricTile>
          <MetricTile label="Drawdown end (trough time)">
            {isValidDateString(m.drawdownEnd) ? new Date(m.drawdownEnd).toLocaleString() : "—"}
          </MetricTile>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Signals &amp; timeouts</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Rejected / skipped entry signals (risk + already long)">
            {fmtInt(m.rejectedEntrySignals)}
          </MetricTile>
          <MetricTile label="SELL signal while flat">{fmtInt(sig.sellSkippedFlat)}</MetricTile>
          <MetricTile label="Entry timeouts (not modeled)">{fmtInt(sig.entryTimeouts)}</MetricTile>
          <MetricTile label="Exit timeouts (not modeled)">{fmtInt(sig.exitTimeouts)}</MetricTile>
          <MetricTile label="BUY blocked by risk">{fmtInt(sig.buyBlockedByRisk)}</MetricTile>
          <MetricTile label="BUY skipped (already in position)">{fmtInt(sig.buySkippedInPosition)}</MetricTile>
        </div>
      </div>
    </section>
  );
}

