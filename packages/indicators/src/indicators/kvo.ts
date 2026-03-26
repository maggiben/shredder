/**
 * KVO - Klinger Volume Oscillator
 *
 * :param candles: np.ndarray
 * :param short_period: int - default: 34
 * :param long_period: int - default: 55
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { ema } from "./ema.js";

export function kvo(
  candles: OhlcvMatrix,
  shortPeriod: number = 34,
  longPeriod: number = 55,
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const volume = column(m, 5);
  const n = close.length;
  const hlc3 = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    hlc3[i] = (high[i]! + low[i]! + close[i]!) / 3;
  }
  const mom = new Float64Array(n);
  mom[0] = 0;
  for (let i = 1; i < n; i += 1) {
    mom[i] = hlc3[i]! - hlc3[i - 1]!;
  }
  const trend = new Float64Array(n);
  trend[0] = 0;
  for (let i = 1; i < n; i += 1) {
    if (mom[i]! > 0) {
      trend[i] = 1;
    } else if (mom[i]! < 0) {
      trend[i] = -1;
    } else {
      trend[i] = trend[i - 1]!;
    }
  }
  const dm = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    dm[i] = high[i]! - low[i]!;
  }
  const cm = new Float64Array(n);
  cm[0] = 0;
  for (let i = 1; i < n; i += 1) {
    if (trend[i]! === trend[i - 1]!) {
      cm[i] = cm[i - 1]! + dm[i]!;
    } else {
      cm[i] = dm[i]! + dm[i - 1]!;
    }
  }
  const vf = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    if (cm[i]! === 0) {
      vf[i] = 0;
    } else {
      const expr = Math.abs((2 * dm[i]!) / cm[i]! - 1);
      vf[i] = 100 * volume[i]! * trend[i]! * expr;
    }
  }
  const fastEma = ema(vf, shortPeriod, "close", true) as Float64Array;
  const slowEma = ema(vf, longPeriod, "close", true) as Float64Array;
  const res = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    res[i] = fastEma[i]! - slowEma[i]!;
  }
  return sequential ? res : res[res.length - 1]!;
}
