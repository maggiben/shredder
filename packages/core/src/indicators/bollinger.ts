import { sma } from "./sma.js";

export interface BollingerBands {
  readonly upper: number;
  readonly middle: number;
  readonly lower: number;
}

/** Bollinger Bands: middle = SMA; bands = middle ± k × σ over the last `period` closes. */
export function bollingerBands(
  closes: readonly number[],
  period: number,
  stdDevMultiplier: number,
): BollingerBands | undefined {
  if (period <= 0 || stdDevMultiplier <= 0 || closes.length < period) {
    return undefined;
  }
  const middle = sma(closes, period);
  if (middle === undefined) {
    return undefined;
  }
  const slice = closes.slice(-period);
  let sumSq = 0;
  for (const c of slice) {
    const d = c - middle;
    sumSq += d * d;
  }
  const std = Math.sqrt(sumSq / period);
  return {
    middle,
    upper: middle + stdDevMultiplier * std,
    lower: middle - stdDevMultiplier * std,
  };
}
