/*
 Stochastic RSI – uses Rust implementation for speed.

 :param candles: np.ndarray
 :param period: int - default: 14
 :param period_stoch: int - default: 14
 :param k: int - default: 3
 :param d: int - default: 3
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: Stochastic(k, d)
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { srsi as srsiRust } from "../series/series.js";

export type SrsiResult =
  | { readonly k: number; readonly d: number }
  | { readonly k: Float64Array; readonly d: Float64Array };

export function srsi(
  candles: IndicatorCandles,
  period: number = 14,
  periodStoch: number = 14,
  kPeriod: number = 3,
  dPeriod: number = 3,
  sourceType: string = "close",
  sequential: boolean = false,
): SrsiResult {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }
  const { k, d } = srsiRust(source, period, periodStoch, kPeriod, dPeriod);
  if (sequential) {
    return { k, d };
  }
  const li = k.length - 1;
  return { k: k[li]!, d: d[li]! };
}
