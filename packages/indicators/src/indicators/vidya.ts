/**
 * VIDYA - Variable Index Dynamic Average
 *
 * :param candles: np.ndarray
 * :param length: int - default: 9
 * :param fix_cmo: bool - default: True
 * :param select: bool - default: True
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";

function vidyaNumba(source: Float64Array, length: number, fixCmo: boolean, select: boolean): Float64Array {
  const alpha = 2 / (length + 1);
  const momm = new Float64Array(source.length);
  momm[0] = 0;
  for (let i = 1; i < source.length; i += 1) {
    momm[i] = source[i]! - source[i - 1]!;
  }
  const m1 = new Float64Array(source.length);
  const m2 = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    if (momm[i]! >= 0) {
      m1[i] = momm[i]!;
    }
    if (momm[i]! < 0) {
      m2[i] = -momm[i]!;
    }
  }
  const cmoLength = fixCmo ? 9 : length;
  const sm1 = new Float64Array(source.length);
  const sm2 = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const startIdx = Math.max(0, i - cmoLength + 1);
    let s1 = 0;
    let s2 = 0;
    for (let j = startIdx; j <= i; j += 1) {
      s1 += m1[j]!;
      s2 += m2[j]!;
    }
    sm1[i] = s1;
    sm2[i] = s2;
  }
  const totalSum = new Float64Array(source.length);
  const chandeMo = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    totalSum[i] = sm1[i]! + sm2[i]!;
    chandeMo[i] = totalSum[i]! !== 0 ? (100 * (sm1[i]! - sm2[i]!)) / totalSum[i]! : 0;
  }
  const k = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    if (select) {
      k[i] = Math.abs(chandeMo[i]!) / 100;
    } else {
      const startIdx = Math.max(0, i - length + 1);
      let sum = 0;
      let c = 0;
      for (let j = startIdx; j <= i; j += 1) {
        sum += source[j]!;
        c += 1;
      }
      const mean = sum / c;
      let v = 0;
      for (let j = startIdx; j <= i; j += 1) {
        const d = source[j]! - mean;
        v += d * d;
      }
      k[i] = Math.sqrt(v / c);
    }
  }
  const vidya = new Float64Array(source.length);
  vidya[0] = source[0]!;
  for (let i = 1; i < source.length; i += 1) {
    vidya[i] = alpha * k[i]! * source[i]! + (1 - alpha * k[i]!) * vidya[i - 1]!;
  }
  return vidya;
}

export function vidya(
  candles: IndicatorCandles,
  length: number = 9,
  fixCmo: boolean = true,
  select: boolean = true,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let ref: OhlcvMatrix | Float64Array;
  let source: Float64Array;
  if (isCandles1D(candles)) {
    ref = candles;
    source = candles;
  } else {
    ref = sliceCandles(candles, sequential);
    source = getCandleSource(ref, sourceType);
  }
  const res = vidyaNumba(source, length, fixCmo, select);
  return sequential ? sameLength(ref, res) : res[res.length - 1]!;
}
