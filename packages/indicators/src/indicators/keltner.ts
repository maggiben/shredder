/**
 * Keltner Channels
 *
 * :param candles: np.ndarray
 * :param period: int - default: 20
 * :param multiplier: float - default: 2
 * :param matype: int - default: 1
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: KeltnerChannel(upperband, middleband, lowerband)
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { ma } from "./ma.js";

export type KeltnerChannel = {
  upperband: number | Float64Array;
  middleband: number | Float64Array;
  lowerband: number | Float64Array;
};

function atrKeltner(high: Float64Array, low: Float64Array, close: Float64Array, period: number): Float64Array {
  const n = close.length;
  const tr = new Float64Array(n);
  tr[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    tr[i] = Math.max(Math.max(hl, hc), lc);
  }
  const atrVals = new Float64Array(n);
  atrVals.fill(Number.NaN);
  if (n < period) {
    return atrVals;
  }
  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    sum += tr[i]!;
  }
  atrVals[period - 1] = sum / period;
  for (let i = period; i < n; i += 1) {
    atrVals[i] = (atrVals[i - 1]! * (period - 1) + tr[i]!) / period;
  }
  return atrVals;
}

export function keltner(
  candles: OhlcvMatrix,
  period: number = 20,
  multiplier: number = 2,
  matype: number = 1,
  sourceType: string = "close",
  sequential: boolean = false,
): KeltnerChannel {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  let maValues: Float64Array;
  if (matype === 24 || matype === 29) {
    maValues = ma(m, period, matype, sourceType, true) as Float64Array;
  } else {
    maValues = ma(source, period, matype, sourceType, true) as Float64Array;
  }
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const atrVals = atrKeltner(high, low, close, period);
  const upper = new Float64Array(source.length);
  const lower = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    upper[i] = maValues[i]! + atrVals[i]! * multiplier;
    lower[i] = maValues[i]! - atrVals[i]! * multiplier;
  }
  if (sequential) {
    return { upperband: upper, middleband: maValues, lowerband: lower };
  }
  const li = source.length - 1;
  return { upperband: upper[li]!, middleband: maValues[li]!, lowerband: lower[li]! };
}
