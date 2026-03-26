/*
 DI - Directional Indicator

 :param candles: np.ndarray, where columns are expected to be: index 2: close, index 3: high, index 4: low.
 :param period: int - default: 14
 :param sequential: bool - default: False

 :return: DI(plus, minus)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { di as diRust } from "../series/candles.js";

export type DiResult =
  | { readonly plus: number; readonly minus: number }
  | { readonly plus: Float64Array; readonly minus: Float64Array };

export function di(candles: IndicatorCandles, period: number = 14, sequential: boolean = false): DiResult {
  if (isCandles1D(candles)) {
    throw new Error("di requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const n = m.length;
  if (n < 2) {
    if (sequential) {
      const nan = new Float64Array(n);
      nan.fill(Number.NaN);
      return { plus: nan, minus: nan };
    }
    return { plus: Number.NaN, minus: Number.NaN };
  }
  const { plus, minus } = diRust(m, period);
  if (sequential) {
    return { plus, minus };
  }
  const li = plus.length - 1;
  return { plus: plus[li]!, minus: minus[li]! };
}
