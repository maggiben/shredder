/*
 @author lazyBear
 credits: https://www.tradingview.com/script/nqQ1DT5a-Squeeze-Momentum-Indicator-LazyBear/

 squeeze_momentum

 :param candles: np.ndarray
 :length: int - default: 20
 :mult: float - default: 2.0
 :length_kc: float - default: 2.0
 :mult_kc: float - default: 1.5
 :sequential: bool - default: True

 :return: SqueezeMomentum(squeeze, momentum, momentum_signal)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { sma } from "./sma.js";
import { stddev } from "./stddev.js";
import { trange } from "./trange.js";
import { linearreg } from "./linearreg.js";

export type SqueezeMomentumResult =
  | { squeeze: number; momentum: number; momentum_signal: number }
  | { squeeze: Float64Array; momentum: Float64Array; momentum_signal: Float64Array };

function highest(values: Float64Array, length: number): Float64Array {
  const n = values.length;
  const highestValues = new Float64Array(n);
  highestValues.fill(Number.NaN);
  for (let i = length - 1; i < n; i += 1) {
    let mx = values[i - length + 1]!;
    for (let j = i - length + 2; j <= i; j += 1) {
      mx = Math.max(mx, values[j]!);
    }
    highestValues[i] = mx;
  }
  return highestValues;
}

function lowest(values: Float64Array, length: number): Float64Array {
  const n = values.length;
  const lowestValues = new Float64Array(n);
  lowestValues.fill(Number.NaN);
  for (let i = length - 1; i < n; i += 1) {
    let mn = values[i - length + 1]!;
    for (let j = i - length + 2; j <= i; j += 1) {
      mn = Math.min(mn, values[j]!);
    }
    lowestValues[i] = mn;
  }
  return lowestValues;
}

export function squeeze_momentum(
  candles: IndicatorCandles,
  length: number = 20,
  mult: number = 2.0,
  lengthKc: number = 20,
  multKc: number = 1.5,
  sequential: boolean = true,
): SqueezeMomentumResult {
  if (isCandles1D(candles)) {
    throw new Error("squeeze_momentum requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const n = m.length;
  const basis = sma(m, length, "close", true) as Float64Array;
  const dev = stddev(m, length, multKc, "close", true) as Float64Array;
  const upperBb = new Float64Array(n);
  const lowerBb = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    upperBb[i] = basis[i]! + dev[i]!;
    lowerBb[i] = basis[i]! - dev[i]!;
  }
  const maArr = sma(m, lengthKc, "close", true) as Float64Array;
  const trSeq = trange(m, true) as Float64Array;
  const rangeMa = sma(trSeq, lengthKc, "close", true) as Float64Array;
  const upperKc = new Float64Array(n);
  const lowerKc = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    upperKc[i] = maArr[i]! + rangeMa[i]! * multKc;
    lowerKc[i] = maArr[i]! - rangeMa[i]! * multKc;
  }
  const sqz = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const sqzOn = lowerBb[i]! > lowerKc[i]! && upperBb[i]! < upperKc[i]!;
    const sqzOff = lowerBb[i]! < lowerKc[i]! && upperBb[i]! > upperKc[i]!;
    const noSqz = !sqzOn && !sqzOff;
    sqz[i] = noSqz ? 0 : sqzOn ? -1 : 1;
  }
  const highsRaw = highest(column(m, 3), lengthKc);
  const lowsRaw = lowest(column(m, 4), lengthKc);
  const smaArr2 = sma(m, lengthKc, "close", true) as Float64Array;
  const close = column(m, 2);
  const rawMom = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const hi = Number.isNaN(highsRaw[i]!) ? 0 : highsRaw[i]!;
    const lo = Number.isNaN(lowsRaw[i]!) ? 0 : lowsRaw[i]!;
    const sm = Number.isNaN(smaArr2[i]!) ? 0 : smaArr2[i]!;
    rawMom[i] = close[i]! - ((hi + lo) / 2 + sm) / 2;
  }
  const momentum = linearreg(rawMom, lengthKc, "close", true) as Float64Array;
  const momLen = momentum.length;
  const sigLen = Math.max(0, momLen - 1);
  const momentumSignal = new Float64Array(sigLen);
  for (let i = 0; i < sigLen; i += 1) {
    const cur = momentum[i + 1]!;
    const prev = momentum[i]!;
    if (cur > 0) {
      momentumSignal[i] = cur > prev ? 1 : 2;
    } else {
      momentumSignal[i] = cur < prev ? -1 : -2;
    }
  }
  if (sequential) {
    return { squeeze: sqz, momentum, momentum_signal: momentumSignal };
  }
  const li = n - 1;
  const si = momentumSignal.length - 1;
  return {
    squeeze: sqz[li]!,
    momentum: momentum[li]!,
    momentum_signal: si >= 0 ? momentumSignal[si]! : Number.NaN,
  };
}
