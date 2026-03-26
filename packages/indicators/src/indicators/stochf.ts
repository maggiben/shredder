/*
 Stochastic Fast

 :param candles: np.ndarray
 :param fastk_period: int - default: 5
 :param fastd_period: int - default: 3
 :param fastd_matype: int - default: 0
 :param sequential: bool - default: False

 :return: Stochastic(k, d)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { stochf as stochfRust } from "../series/series.js";

export type StochfResult =
  | { readonly k: number; readonly d: number }
  | { readonly k: Float64Array; readonly d: Float64Array };

export function stochf(
  candles: IndicatorCandles,
  fastkPeriod: number = 5,
  fastdPeriod: number = 3,
  fastdMatype: number = 0,
  sequential: boolean = false,
): StochfResult {
  if (isCandles1D(candles)) {
    throw new Error("stochf requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const { k, d } = stochfRust(m, fastkPeriod, fastdPeriod, fastdMatype);
  if (sequential) {
    return { k, d };
  }
  const li = k.length - 1;
  return { k: k[li]!, d: d[li]! };
}
