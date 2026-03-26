import type { Candle } from "@shredder/core";
import type { BacktestTrade } from "./engine.js";
import type { SimulationLedgerResult, SimulationLedgerRow } from "./simulation.js";

const MS_PER_DAY = 86_400_000;

export interface ClosedRoundTrip {
  readonly buy: BacktestTrade;
  readonly sell: BacktestTrade;
  readonly pnl: number;
  readonly durationMs: number;
}

export interface SimulationMetrics {
  /** ISO timestamp of first simulated bar (after warmup). */
  readonly periodFrom: string;
  /** ISO timestamp of last bar in range. */
  readonly periodTo: string;
  readonly calendarDaysInPeriod: number;
  readonly maxOpenTrades: number;
  readonly maxPositionQty: number;
  /** Completed round trips (matched BUY→SELL). */
  readonly closedTradeCount: number;
  readonly totalLegCount: number;
  readonly avgTradesPerDay: number;
  readonly startingBalance: number;
  readonly finalBalance: number;
  readonly absoluteProfit: number;
  readonly totalProfitPercent: number;
  /** Compound annual growth rate from period length (0 if period too short or invalid). */
  readonly cagrPercent: number;
  /** Gross profit / gross loss; null if no losing trades. */
  readonly profitFactor: number | null;
  /** Average P&amp;L per closed round trip. */
  readonly expectancy: number;
  /** Avg win / avg loss (absolute); null if no losers or no winners. */
  readonly expectancyRatio: number | null;
  readonly avgDailyProfitPercent: number;
  /** Average position notional (quote) on bars where the book is long. */
  readonly avgStakeNotional: number;
  readonly totalTradeVolume: number;
  /** Sum of quote fees on all simulated legs (commissions). */
  readonly totalFeesPaid: number;
  /** Average quote fee per executed leg (each BUY or SELL). */
  readonly avgFeePerLeg: number;
  /** Effective blended fee in basis points of gross quote volume (fees ÷ volume × 10⁴). */
  readonly avgEffectiveFeeRateBps: number;
  /** Net profit ÷ total fees paid (null if no fees). */
  readonly profitToFeesRatio: number | null;
  readonly daysWin: number;
  readonly daysDraw: number;
  readonly daysLose: number;
  readonly bestTrade: number;
  readonly worstTrade: number;
  readonly bestDay: number;
  readonly worstDay: number;
  readonly avgDurationWinnersMs: number;
  readonly avgDurationLosersMs: number;
  readonly maxConsecutiveWins: number;
  readonly maxConsecutiveLosses: number;
  readonly rejectedEntrySignals: number;
  readonly entryTimeouts: number;
  readonly exitTimeouts: number;
  readonly minBalance: number;
  readonly maxBalance: number;
  /** Max (peak − equity) / peak over the run, as a positive percentage. */
  readonly maxUnderwaterPercent: number;
  readonly absoluteDrawdown: number;
  readonly drawdownHigh: number;
  readonly drawdownLow: number;
  readonly drawdownStart: string;
  readonly drawdownEnd: string;
  /** Buy-and-hold on the same window (first→last close of simulated segment). */
  readonly marketChangePercent: number;
}

function utcDayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function parseRoundTrips(trades: readonly BacktestTrade[]): ClosedRoundTrip[] {
  const out: ClosedRoundTrip[] = [];
  for (let i = 0; i < trades.length; i += 1) {
    const b = trades[i];
    if (!b || b.side !== "BUY") {
      continue;
    }
    const s = trades[i + 1];
    if (!s || s.side !== "SELL") {
      continue;
    }
    const pnl = s.quantity * s.price - s.fee - (b.quantity * b.price + b.fee);
    out.push({
      buy: b,
      sell: s,
      pnl,
      durationMs: s.timestamp - b.timestamp,
    });
    i += 1;
  }
  return out;
}

function consecutiveStreaks(wins: boolean[]): { maxWins: number; maxLosses: number } {
  let maxWins = 0;
  let maxLosses = 0;
  let curW = 0;
  let curL = 0;
  for (const w of wins) {
    if (w) {
      curW += 1;
      curL = 0;
      maxWins = Math.max(maxWins, curW);
    } else {
      curL += 1;
      curW = 0;
      maxLosses = Math.max(maxLosses, curL);
    }
  }
  return { maxWins, maxLosses };
}

export interface BuildSimulationMetricsInput {
  readonly initialCash: number;
  readonly warmupBars: number;
  readonly candles: readonly Candle[];
  readonly result: SimulationLedgerResult;
}

export function buildSimulationMetrics(input: BuildSimulationMetricsInput): SimulationMetrics {
  const { initialCash, warmupBars, candles, result } = input;
  const rows = result.rows;
  const firstCandle = candles[warmupBars];
  const lastCandle = candles[candles.length - 1];
  if (!firstCandle || !lastCandle || rows.length === 0) {
    const t0 = firstCandle?.timestamp ?? 0;
    const t1 = lastCandle?.timestamp ?? 0;
    return emptyMetrics(initialCash, t0, t1, result);
  }

  const lastClose = lastCandle.close;
  const finalBalance = result.finalCash + result.finalPositionQty * lastClose;
  const absoluteProfit = finalBalance - initialCash;
  const totalProfitPercent = initialCash !== 0 ? (absoluteProfit / initialCash) * 100 : 0;

  const periodFrom = new Date(firstCandle.timestamp).toISOString();
  const periodTo = new Date(lastCandle.timestamp).toISOString();
  const spanMs = Math.max(0, lastCandle.timestamp - firstCandle.timestamp);
  const calendarDaysInPeriod = Math.max(1, spanMs / MS_PER_DAY);

  let maxQty = 0;
  let barsLong = 0;
  let sumStake = 0;
  for (const r of rows) {
    const q = r.positionQtyAfter;
    maxQty = Math.max(maxQty, q);
    const notional = q * r.close;
    if (q > 0) {
      barsLong += 1;
      sumStake += notional;
    }
  }
  const maxOpenTrades = maxQty > 0 ? 1 : 0;
  const avgStakeNotional = barsLong > 0 ? sumStake / barsLong : 0;

  const equities = rows.map((r) => r.equityAfter);
  const minBalance = equities.length > 0 ? Math.min(...equities) : initialCash;
  const maxBalance = equities.length > 0 ? Math.max(...equities) : initialCash;

  let peak = initialCash;
  let peakTimestamp = firstCandle.timestamp;
  let maxDd = 0;
  let maxUnderwaterPct = 0;
  let ddHigh = initialCash;
  let ddLow = initialCash;
  let ddStart = periodFrom;
  let ddEnd = periodTo;

  for (const r of rows) {
    const eq = r.equityAfter;
    if (eq > peak) {
      peak = eq;
      peakTimestamp = r.timestamp;
    }
    const dd = peak - eq;
    if (peak > 0) {
      maxUnderwaterPct = Math.max(maxUnderwaterPct, (dd / peak) * 100);
    }
    if (dd > maxDd) {
      maxDd = dd;
      ddHigh = peak;
      ddLow = eq;
      ddStart = new Date(peakTimestamp).toISOString();
      ddEnd = new Date(r.timestamp).toISOString();
    }
  }

  const roundTrips = parseRoundTrips(result.trades);
  const closedTradeCount = roundTrips.length;
  const wins = roundTrips.map((rt) => rt.pnl > 0);
  const { maxWins, maxLosses } = consecutiveStreaks(wins);

  let grossProfit = 0;
  let grossLoss = 0;
  for (const rt of roundTrips) {
    if (rt.pnl > 0) {
      grossProfit += rt.pnl;
    } else if (rt.pnl < 0) {
      grossLoss += rt.pnl;
    }
  }
  let profitFactor: number | null = null;
  if (closedTradeCount > 0) {
    if (grossLoss < 0) {
      profitFactor = grossProfit / Math.abs(grossLoss);
    } else if (grossProfit > 0) {
      profitFactor = null;
    } else {
      profitFactor = 0;
    }
  }
  const expectancy =
    closedTradeCount > 0 ? roundTrips.reduce((s, rt) => s + rt.pnl, 0) / closedTradeCount : 0;

  const winningPnls = roundTrips.filter((rt) => rt.pnl > 0).map((rt) => rt.pnl);
  const losingPnls = roundTrips.filter((rt) => rt.pnl < 0).map((rt) => rt.pnl);
  const avgWin = winningPnls.length > 0 ? winningPnls.reduce((a, b) => a + b, 0) / winningPnls.length : 0;
  const avgLossAbs =
    losingPnls.length > 0
      ? Math.abs(losingPnls.reduce((a, b) => a + b, 0) / losingPnls.length)
      : 0;
  const expectancyRatio =
    avgWin > 0 && avgLossAbs > 0 ? avgWin / avgLossAbs : null;

  const bestTrade = closedTradeCount > 0 ? Math.max(...roundTrips.map((rt) => rt.pnl)) : 0;
  const worstTrade = closedTradeCount > 0 ? Math.min(...roundTrips.map((rt) => rt.pnl)) : 0;

  const winners = roundTrips.filter((rt) => rt.pnl > 0);
  const losers = roundTrips.filter((rt) => rt.pnl < 0);
  const avgDurationWinnersMs =
    winners.length > 0 ? winners.reduce((s, rt) => s + rt.durationMs, 0) / winners.length : 0;
  const avgDurationLosersMs =
    losers.length > 0 ? losers.reduce((s, rt) => s + rt.durationMs, 0) / losers.length : 0;

  let totalTradeVolume = 0;
  let totalFeesPaid = 0;
  for (const t of result.trades) {
    totalTradeVolume += t.quantity * t.price;
    totalFeesPaid += t.fee;
  }
  const legCount = result.trades.length;
  const avgFeePerLeg = legCount > 0 ? totalFeesPaid / legCount : 0;
  const avgEffectiveFeeRateBps =
    totalTradeVolume > 0 ? (totalFeesPaid / totalTradeVolume) * 10000 : 0;
  const profitToFeesRatio = totalFeesPaid > 0 ? absoluteProfit / totalFeesPaid : null;

  const daily = dailyEquitySeries(rows, initialCash);
  let daysWin = 0;
  let daysDraw = 0;
  let daysLose = 0;
  const dailyPnls: number[] = [];
  const eps = 1e-8;
  for (let i = 0; i < daily.length; i += 1) {
    const d = daily[i]!;
    const pnl = d.endEquity - d.startEquity;
    dailyPnls.push(pnl);
    if (pnl > eps) {
      daysWin += 1;
    } else if (pnl < -eps) {
      daysLose += 1;
    } else {
      daysDraw += 1;
    }
  }
  const avgDailyProfitPercent =
    dailyPnls.length > 0
      ? dailyPnls.reduce((sum, pnl, i) => {
          const base = daily[i]!.startEquity;
          return sum + (base > 0 ? (pnl / base) * 100 : 0);
        }, 0) / dailyPnls.length
      : 0;

  let bestDay = dailyPnls.length > 0 ? Math.max(...dailyPnls) : 0;
  let worstDay = dailyPnls.length > 0 ? Math.min(...dailyPnls) : 0;

  const years = spanMs / (MS_PER_DAY * 365.25);
  const cagrPercent =
    initialCash > 0 && years > 0 && finalBalance > 0
      ? (Math.pow(finalBalance / initialCash, 1 / years) - 1) * 100
      : 0;

  const firstClose = firstCandle.close;
  const marketChangePercent =
    firstClose > 0 ? ((lastClose - firstClose) / firstClose) * 100 : 0;

  const avgTradesPerDay = closedTradeCount / calendarDaysInPeriod;

  const rejectedEntrySignals =
    result.signalStats.buyBlockedByRisk + result.signalStats.buySkippedInPosition;

  return {
    periodFrom,
    periodTo,
    calendarDaysInPeriod,
    maxOpenTrades,
    maxPositionQty: maxQty,
    closedTradeCount,
    totalLegCount: result.trades.length,
    avgTradesPerDay,
    startingBalance: initialCash,
    finalBalance,
    absoluteProfit,
    totalProfitPercent,
    cagrPercent,
    profitFactor,
    expectancy,
    expectancyRatio,
    avgDailyProfitPercent,
    avgStakeNotional,
    totalTradeVolume,
    totalFeesPaid,
    avgFeePerLeg,
    avgEffectiveFeeRateBps,
    profitToFeesRatio,
    daysWin,
    daysDraw,
    daysLose,
    bestTrade,
    worstTrade,
    bestDay,
    worstDay,
    avgDurationWinnersMs,
    avgDurationLosersMs,
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    rejectedEntrySignals,
    entryTimeouts: result.signalStats.entryTimeouts,
    exitTimeouts: result.signalStats.exitTimeouts,
    minBalance,
    maxBalance,
    maxUnderwaterPercent: maxUnderwaterPct,
    absoluteDrawdown: maxDd,
    drawdownHigh: ddHigh,
    drawdownLow: ddLow,
    drawdownStart: ddStart,
    drawdownEnd: ddEnd,
    marketChangePercent,
  };
}

function dailyEquitySeries(
  rows: readonly SimulationLedgerRow[],
  initialCash: number,
): { day: string; startEquity: number; endEquity: number }[] {
  const byDay = new Map<string, SimulationLedgerRow[]>();
  for (const r of rows) {
    const k = utcDayKey(r.timestamp);
    const list = byDay.get(k);
    if (list) {
      list.push(r);
    } else {
      byDay.set(k, [r]);
    }
  }
  const days = [...byDay.keys()].sort();
  const out: { day: string; startEquity: number; endEquity: number }[] = [];
  let prevEnd = initialCash;
  for (const day of days) {
    const list = byDay.get(day)!;
    list.sort((a, b) => a.timestamp - b.timestamp);
    const first = list[0]!;
    const last = list[list.length - 1]!;
    const startEquity = prevEnd;
    const endEquity = last.equityAfter;
    out.push({ day, startEquity, endEquity });
    prevEnd = endEquity;
  }
  return out;
}

function emptyMetrics(
  initialCash: number,
  t0: number,
  t1: number,
  result: SimulationLedgerResult,
): SimulationMetrics {
  const z = (x: number) => (Number.isFinite(x) ? x : 0);
  const from = new Date(t0).toISOString();
  const to = new Date(t1).toISOString();
  return {
    periodFrom: from,
    periodTo: to,
    calendarDaysInPeriod: 1,
    maxOpenTrades: 0,
    maxPositionQty: 0,
    closedTradeCount: 0,
    totalLegCount: result.trades.length,
    avgTradesPerDay: 0,
    startingBalance: initialCash,
    finalBalance: initialCash,
    absoluteProfit: 0,
    totalProfitPercent: 0,
    cagrPercent: 0,
    profitFactor: null,
    expectancy: 0,
    expectancyRatio: null,
    avgDailyProfitPercent: 0,
    avgStakeNotional: 0,
    totalTradeVolume: 0,
    totalFeesPaid: 0,
    avgFeePerLeg: 0,
    avgEffectiveFeeRateBps: 0,
    profitToFeesRatio: null,
    daysWin: 0,
    daysDraw: 0,
    daysLose: 0,
    bestTrade: 0,
    worstTrade: 0,
    bestDay: 0,
    worstDay: 0,
    avgDurationWinnersMs: 0,
    avgDurationLosersMs: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    rejectedEntrySignals: z(result.signalStats.buyBlockedByRisk + result.signalStats.buySkippedInPosition),
    entryTimeouts: result.signalStats.entryTimeouts,
    exitTimeouts: result.signalStats.exitTimeouts,
    minBalance: initialCash,
    maxBalance: initialCash,
    maxUnderwaterPercent: 0,
    absoluteDrawdown: 0,
    drawdownHigh: initialCash,
    drawdownLow: initialCash,
    drawdownStart: from,
    drawdownEnd: to,
    marketChangePercent: 0,
  };
}
