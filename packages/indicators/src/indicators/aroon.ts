/**
 * AROON indicator
 *
 * :param candles: np.ndarray, expected to have at least 5 columns, with high at index 3 and low at index 4.
 * :param period: int - period for the indicator (default: 14)
 * :param sequential: bool - whether to return the whole series (default: False)
 * :return: AROON(down, up) where each value is computed as above.
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export type AroonResult = { down: number | Float64Array; up: number | Float64Array };

export function aroon(candles: OhlcvMatrix, period: number = 14, sequential: boolean = false): AroonResult {
  const m = sliceCandles(candles, sequential);
  const highs = column(m, 3);
  const lows = column(m, 4);
  const n = highs.length;
  if (sequential) {
    const aroonUp = new Float64Array(n);
    const aroonDown = new Float64Array(n);
    aroonUp.fill(Number.NaN);
    aroonDown.fill(Number.NaN);
    if (n >= period + 1) {
      for (let i = period; i < n; i += 1) {
        let bestIdx = 0;
        let worstIdx = 0;
        let bestVal = highs[i - period]!;
        let worstVal = lows[i - period]!;
        for (let j = 0; j <= period; j += 1) {
          const h = highs[i - period + j]!;
          const l = lows[i - period + j]!;
          if (h > bestVal) {
            bestVal = h;
            bestIdx = j;
          }
          if (l < worstVal) {
            worstVal = l;
            worstIdx = j;
          }
        }
        aroonUp[i] = (100 * bestIdx) / period;
        aroonDown[i] = (100 * worstIdx) / period;
      }
    }
    return { down: aroonDown, up: aroonUp };
  }
  if (n < period + 1) {
    return { down: Number.NaN, up: Number.NaN };
  }
  const start = n - period - 1;
  let bestIdx = 0;
  let worstIdx = 0;
  let bestVal = highs[start]!;
  let worstVal = lows[start]!;
  for (let j = 0; j <= period; j += 1) {
    const h = highs[start + j]!;
    const l = lows[start + j]!;
    if (h > bestVal) {
      bestVal = h;
      bestIdx = j;
    }
    if (l < worstVal) {
      worstVal = l;
      worstIdx = j;
    }
  }
  return { down: (100 * worstIdx) / period, up: (100 * bestIdx) / period };
}
