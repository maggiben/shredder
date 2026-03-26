/*
 SAR - Parabolic SAR

 :param candles: np.ndarray
 :param acceleration: float - default: 0.02
 :param maximum: float - default: 0.2
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

function fastSar(high: Float64Array, low: Float64Array, acceleration: number, maximum: number, n: number): Float64Array {
  const sarValues = new Float64Array(n);
  let uptrend: boolean;
  let ep: number;
  if (high[1]! > high[0]!) {
    uptrend = true;
    sarValues[0] = low[0]!;
    ep = high[0]!;
  } else {
    uptrend = false;
    sarValues[0] = high[0]!;
    ep = low[0]!;
  }
  let af = acceleration;
  for (let i = 1; i < n; i += 1) {
    const prevSar = sarValues[i - 1]!;
    let sarTemp: number;
    if (uptrend) {
      sarTemp = prevSar + af * (ep - prevSar);
      if (i >= 2) {
        sarTemp = Math.min(sarTemp, low[i - 1]!, low[i - 2]!);
      } else {
        sarTemp = Math.min(sarTemp, low[i - 1]!);
      }
    } else {
      sarTemp = prevSar - af * (prevSar - ep);
      if (i >= 2) {
        sarTemp = Math.max(sarTemp, high[i - 1]!, high[i - 2]!);
      } else {
        sarTemp = Math.max(sarTemp, high[i - 1]!);
      }
    }
    if (uptrend) {
      if (low[i]! < sarTemp) {
        sarTemp = ep;
        uptrend = false;
        af = acceleration;
        ep = low[i]!;
      } else {
        if (high[i]! > ep) {
          ep = high[i]!;
          af = af + acceleration;
          if (af > maximum) {
            af = maximum;
          }
        }
      }
    } else {
      if (high[i]! > sarTemp) {
        sarTemp = ep;
        uptrend = true;
        af = acceleration;
        ep = high[i]!;
      } else {
        if (low[i]! < ep) {
          ep = low[i]!;
          af = af + acceleration;
          if (af > maximum) {
            af = maximum;
          }
        }
      }
    }
    sarValues[i] = sarTemp;
  }
  return sarValues;
}

export function sar(
  candles: IndicatorCandles,
  acceleration: number = 0.02,
  maximum: number = 0.2,
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("sar requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const n = m.length;
  const high = column(m, 3);
  const low = column(m, 4);
  if (n === 0) {
    return sequential ? new Float64Array() : Number.NaN;
  }
  if (n < 2) {
    const v = low[n - 1]!;
    return sequential ? Float64Array.from([v]) : v;
  }
  const sarValues = fastSar(high, low, acceleration, maximum, n);
  return sequential ? sarValues : sarValues[n - 1]!;
}
