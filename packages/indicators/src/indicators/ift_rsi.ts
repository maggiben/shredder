/**
 * Modified Inverse Fisher Transform applied on RSI
 *
 * :param candles: np.ndarray
 * :param rsi_period: int - default: 5
 * :param wma_period: int - default: 9
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { rsi } from "./rsi.js";
import { wma } from "./wma.js";

export function ift_rsi(
  candles: IndicatorCandles,
  rsiPeriod: number = 5,
  wmaPeriod: number = 9,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let ref: OhlcvMatrix | Float64Array;
  if (isCandles1D(candles)) {
    ref = candles;
  } else {
    ref = sliceCandles(candles, sequential);
  }
  const source = isCandles1D(candles) ? candles : getCandleSource(ref as OhlcvMatrix, sourceType);
  const rsiSeq = rsi(source, rsiPeriod, "close", true) as Float64Array;
  const v1 = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    v1[i] = 0.1 * (rsiSeq[i]! - 50);
  }
  const v2 = wma(v1, wmaPeriod, "close", true) as Float64Array;
  const res = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const x = 2 * v2[i]!;
    const d = x * x;
    res[i] = (d - 1) / (d + 1);
  }
  const out = isCandles1D(candles) ? sameLength(ref, res) : sameLength(ref as OhlcvMatrix, res);
  return sequential ? out : out[out.length - 1]!;
}
