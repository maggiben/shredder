import { sma } from "./sma.js";

/** SMA at last bar and at previous bar (if both exist). */
export function smaPair(
  closes: readonly number[],
  period: number,
): { current: number; previous: number } | undefined {
  if (closes.length < period + 1) {
    return undefined;
  }
  const current = sma(closes, period);
  const previous = sma(closes.slice(0, -1), period);
  if (current === undefined || previous === undefined) {
    return undefined;
  }
  return { current, previous };
}
