import { ema } from "./ema.js";

export interface MacdResult {
  readonly line: number;
  readonly signal: number;
  readonly histogram: number;
}

/**
 * MACD line = EMA(fast) - EMA(slow) on closes; signal = EMA of MACD line.
 */
export function macd(
  closes: readonly number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): MacdResult | undefined {
  if (fastPeriod <= 0 || slowPeriod <= 0 || signalPeriod <= 0) {
    return undefined;
  }
  if (closes.length < slowPeriod + signalPeriod) {
    return undefined;
  }
  const macdSeries: number[] = [];
  for (let end = slowPeriod; end <= closes.length; end += 1) {
    const slice = closes.slice(0, end);
    const fast = ema(slice, fastPeriod);
    const slow = ema(slice, slowPeriod);
    if (fast === undefined || slow === undefined) {
      return undefined;
    }
    macdSeries.push(fast - slow);
  }
  const line = macdSeries[macdSeries.length - 1];
  if (line === undefined) {
    return undefined;
  }
  const signal = ema(macdSeries, signalPeriod);
  if (signal === undefined) {
    return undefined;
  }
  return { line, signal, histogram: line - signal };
}

/** Previous-bar MACD for crossover detection (if available). */
export function macdPrevious(
  closes: readonly number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): MacdResult | undefined {
  if (closes.length < 2) {
    return undefined;
  }
  return macd(closes.slice(0, -1), fastPeriod, slowPeriod, signalPeriod);
}
