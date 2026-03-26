/**
 * Gaussian Filter
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param poles: int - default: 4
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";

function gaussFast(sourceClean: Float64Array, period: number, poles: number): Float64Array {
  const PI = Math.PI;
  const beta = (1 - Math.cos((2 * PI) / period)) / (2 ** (1 / poles) - 1);
  const alpha = -beta + Math.sqrt(beta * beta + 2 * beta);
  const N = sourceClean.length;
  const fil = new Float64Array(poles + N);
  const coeffLen = poles + 1;
  const coeff = new Float64Array(coeffLen);
  if (poles === 1) {
    coeff[0] = alpha;
    coeff[1] = 1 - alpha;
  } else if (poles === 2) {
    coeff[0] = alpha ** 2;
    coeff[1] = 2 * (1 - alpha);
    coeff[2] = (-(1 - alpha)) ** 2;
  } else if (poles === 3) {
    coeff[0] = alpha ** 3;
    coeff[1] = 3 * (1 - alpha);
    coeff[2] = -3 * (1 - alpha) ** 2;
    coeff[3] = (1 - alpha) ** 3;
  } else {
    coeff[0] = alpha ** 4;
    coeff[1] = 4 * (1 - alpha);
    coeff[2] = -6 * (1 - alpha) ** 2;
    coeff[3] = 4 * (1 - alpha) ** 3;
    coeff[4] = -((1 - alpha) ** 4);
  }

  for (let i = 0; i < N; i += 1) {
    let acc = coeff[0]! * sourceClean[i]!;
    for (let j = 1; j < coeffLen; j += 1) {
      acc += coeff[j]! * fil[poles - j + i]!;
    }
    fil[poles + i] = acc;
  }
  return fil.subarray(poles);
}

export function gauss(
  candles: IndicatorCandles,
  period: number = 14,
  poles: number = 4,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  let refForLength: OhlcvMatrix | Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
    refForLength = candles;
  } else {
    const m = sliceCandles(candles, sequential);
    refForLength = m;
    source = getCandleSource(m, sourceType);
  }
  const cleanVals: number[] = [];
  for (let i = 0; i < source.length; i += 1) {
    if (!Number.isNaN(source[i]!)) {
      cleanVals.push(source[i]!);
    }
  }
  const toFill = source.length - cleanVals.length;
  const clean = Float64Array.from(cleanVals);
  const fil = gaussFast(clean, period, poles);
  let res: Float64Array;
  if (toFill !== 0) {
    res = new Float64Array(source.length);
    res.fill(Number.NaN, 0, toFill);
    res.set(fil, toFill);
  } else {
    res = fil;
  }
  const out = sameLength(refForLength, res);
  return sequential ? out : out[out.length - 1]!;
}
