/**
 * Hull Moving Average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { resolveSourceSeries, sameLength, sliceCandles } from "../candles/helpers.js";
import { wmaWeighted1ToN } from "../np/wma-core.js";

export function hma(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const halfLength = Math.floor(period / 2);
  const sqrtLength = Math.floor(Math.sqrt(period));
  const wmaHalf = wmaWeighted1ToN(source, Math.max(1, halfLength));
  const wmaFull = wmaWeighted1ToN(source, period);
  const n = source.length;
  const rawHma = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    rawHma[i] = 2 * wmaHalf[i]! - wmaFull[i]!;
  }
  const hma = wmaWeighted1ToN(rawHma, Math.max(1, sqrtLength));
  if (isCandles1D(candles)) {
    return sequential ? hma : hma[n - 1]!;
  }
  const m = sliceCandles(candles as OhlcvMatrix, sequential);
  const padded = sameLength(m, hma);
  return sequential ? padded : padded[n - 1]!;
}
