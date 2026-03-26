/**
 * "Correlation Cycle, Correlation Angle, Market State - John Ehlers
 *
 * :param candles: np.ndarray
 * :param period: int - default: 20
 * :param threshold: int - default: 9
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: CC(real, imag, angle, state)
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, npShift, sliceCandles } from "../candles/helpers.js";

export type CorrelationCycle = {
  real: number | Float64Array;
  imag: number | Float64Array;
  angle: number | Float64Array;
  state: number | Float64Array;
};

function goFast(source: Float64Array, period: number): { realPart: Float64Array; imagPart: Float64Array; angle: Float64Array } {
  let p = Math.max(2, period);
  const PIx2 = 4.0 * Math.asin(1.0);
  const n = source.length;
  const realPart = new Float64Array(n);
  const imagPart = new Float64Array(n);
  realPart.fill(Number.NaN);
  imagPart.fill(Number.NaN);
  for (let i = p; i < n; i += 1) {
    let Rx = 0;
    let Rxx = 0;
    let Rxy = 0;
    let Ryy = 0;
    let Ry = 0;
    let Ix = 0;
    let Ixx = 0;
    let Ixy = 0;
    let Iyy = 0;
    let Iy = 0;
    for (let j = 0; j < p; j += 1) {
      const jMinusOne = j + 1;
      const X = Number.isNaN(source[i - jMinusOne]!) ? 0 : source[i - jMinusOne]!;
      const temp = (PIx2 * jMinusOne) / p;
      const Yc = Math.cos(temp);
      const Ys = -Math.sin(temp);
      Rx += X;
      Ix += X;
      Rxx += X * X;
      Ixx += X * X;
      Rxy += X * Yc;
      Ixy += X * Ys;
      Ryy += Yc * Yc;
      Iyy += Ys * Ys;
      Ry += Yc;
      Iy += Ys;
    }
    let temp1 = p * Rxx - Rx ** 2;
    let temp2 = p * Ryy - Ry ** 2;
    if (temp1 > 0 && temp2 > 0) {
      realPart[i] = (p * Rxy - Rx * Ry) / Math.sqrt(temp1 * temp2);
    }
    temp1 = p * Ixx - Ix ** 2;
    temp2 = p * Iyy - Iy ** 2;
    if (temp1 > 0 && temp2 > 0) {
      imagPart[i] = (p * Ixy - Ix * Iy) / Math.sqrt(temp1 * temp2);
    }
  }
  const HALF_OF_PI = Math.asin(1);
  const angle = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const im = imagPart[i]!;
    const re = realPart[i]!;
    if (im === 0) {
      angle[i] = 0;
    } else {
      angle[i] = (Math.atan(re / im) + HALF_OF_PI) * (180 / Math.PI);
    }
    if (im > 0) {
      angle[i] = angle[i]! - 180;
    }
  }
  return { realPart, imagPart, angle };
}

export function correlation_cycle(
  candles: IndicatorCandles,
  period: number = 20,
  threshold: number = 9,
  sourceType: string = "close",
  sequential: boolean = false,
): CorrelationCycle {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    source = getCandleSource(sliceCandles(candles, sequential), sourceType);
  }
  const { realPart, imagPart, angle: angle0 } = goFast(source, period);
  const priorAngle = npShift(angle0, 1);
  const angle = angle0.slice();
  for (let i = 0; i < angle.length; i += 1) {
    const pa = priorAngle[i]!;
    const an = angle0[i]!;
    if (pa > an && pa - an < 270.0) {
      angle[i] = pa;
    }
  }
  const state = new Float64Array(angle.length);
  for (let i = 0; i < angle.length; i += 1) {
    const pa = priorAngle[i]!;
    const an = angle[i]!;
    if (Math.abs(an - pa) < threshold) {
      if (an >= 0) {
        state[i] = 1;
      } else if (an < 0) {
        state[i] = -1;
      }
    }
  }
  if (sequential) {
    return { real: realPart, imag: imagPart, angle, state };
  }
  const li = source.length - 1;
  return {
    real: realPart[li]!,
    imag: imagPart[li]!,
    angle: angle[li]!,
    state: state[li]!,
  };
}
