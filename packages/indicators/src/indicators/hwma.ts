/*
 Holt-Winter Moving Average

 :param candles: np.ndarray
 :param na: float - default: 0.2
 :param nb: float - default: 0.1
 :param nc: float - default: 0.1
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";

function hwmaFast(source: Float64Array, na: number, nb: number, nc: number): Float64Array {
  const out = new Float64Array(source.length);
  let lastA = 0;
  let lastV = 0;
  let lastF = source[0]!;
  for (let i = 0; i < source.length; i += 1) {
    const F = (1.0 - na) * (lastF + lastV + 0.5 * lastA) + na * source[i]!;
    const V = (1.0 - nb) * (lastV + lastA) + nb * (F - lastF);
    const A = (1.0 - nc) * lastA + nc * (V - lastV);
    out[i] = F + V + 0.5 * A;
    lastA = A;
    lastF = F;
    lastV = V;
  }
  return out;
}

function hwmaOnSeries(source: Float64Array, na: number, nb: number, nc: number): Float64Array {
  const idx: number[] = [];
  for (let i = 0; i < source.length; i += 1) {
    if (!Number.isNaN(source[i]!)) {
      idx.push(i);
    }
  }
  if (idx.length === 0) {
    const empty = new Float64Array(0);
    return empty;
  }
  const dense = new Float64Array(idx.length);
  for (let j = 0; j < idx.length; j += 1) {
    dense[j] = source[idx[j]!]!;
  }
  const resDense = hwmaFast(dense, na, nb, nc);
  const full = new Float64Array(source.length);
  full.fill(Number.NaN);
  for (let j = 0; j < idx.length; j += 1) {
    full[idx[j]!] = resDense[j]!;
  }
  return full;
}

export function hwma(
  candles: IndicatorCandles,
  na: number = 0.2,
  nb: number = 0.1,
  nc: number = 0.1,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  if (!((na > 0 && na < 1) || (nb > 0 && nb < 1) || (nc > 0 && nc < 1))) {
    throw new Error("Bad parameters. They have to be: 0 < na nb nc < 1");
  }
  let source: Float64Array;
  let bigger: Float64Array | OhlcvMatrix;
  if (isCandles1D(candles)) {
    source = candles;
    bigger = candles;
  } else {
    bigger = sliceCandles(candles, sequential);
    source = getCandleSource(bigger, sourceType);
  }
  const short = hwmaOnSeries(source, na, nb, nc);
  const res = sameLength(bigger, short);
  return sequential ? res : res[res.length - 1]!;
}
