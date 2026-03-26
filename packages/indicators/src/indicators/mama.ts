/*
 MAMA - MESA Adaptive Moving Average (custom implementation)


 :param candles: np.ndarray of candle data or price series
 :param fastlimit: float - default: 0.5
 :param slowlimit: float - default: 0.05
 :param source_type: str - default: "close"
 :param sequential: bool - if True, returns full arrays; else returns only the last value
 :return: MAMA(mama, fama)
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";

export type MamaResult =
  | { readonly mama: number; readonly fama: number }
  | { readonly mama: Float64Array; readonly fama: Float64Array };

function fastMama(source: Float64Array, fastlimit: number, slowlimit: number): {
  mama: Float64Array;
  fama: Float64Array;
} {
  const n = source.length;
  const sp = new Float64Array(n);
  const dt = new Float64Array(n);
  const q1 = new Float64Array(n);
  const i1Arr = new Float64Array(n);
  const jI = new Float64Array(n);
  const jq = new Float64Array(n);
  const i2Arr = new Float64Array(n);
  const q2Arr = new Float64Array(n);
  const reArr = new Float64Array(n);
  const imArr = new Float64Array(n);
  const p1Arr = new Float64Array(n);
  const p2Arr = new Float64Array(n);
  const p3Arr = new Float64Array(n);
  const pArr = new Float64Array(n);
  const spp = new Float64Array(n);
  const phase = new Float64Array(n);
  const dphase = new Float64Array(n);
  const alphaArr = new Float64Array(n);
  const mamaArr = new Float64Array(n);
  const famaArr = new Float64Array(n);
  const pi = 3.1415926;

  mamaArr[0] = source[0]!;
  famaArr[0] = source[0]!;

  for (let i = 1; i < n; i += 1) {
    sp[i] =
      (4 * source[i]! +
        3 * (i - 1 >= 0 ? source[i - 1]! : 0) +
        2 * (i - 2 >= 0 ? source[i - 2]! : 0) +
        (i - 3 >= 0 ? source[i - 3]! : 0)) /
      10.0;

    dt[i] =
      (0.0962 * sp[i]! +
        0.5769 * (i - 2 >= 0 ? sp[i - 2]! : 0) -
        0.5769 * (i - 4 >= 0 ? sp[i - 4]! : 0) -
        0.0962 * (i - 6 >= 0 ? sp[i - 6]! : 0)) *
      (0.075 * (i - 1 >= 0 ? pArr[i - 1]! : 0) + 0.54);

    q1[i] =
      (0.0962 * dt[i]! +
        0.5769 * (i - 2 >= 0 ? dt[i - 2]! : 0) -
        0.5769 * (i - 4 >= 0 ? dt[i - 4]! : 0) -
        0.0962 * (i - 6 >= 0 ? dt[i - 6]! : 0)) *
      (0.075 * (i - 1 >= 0 ? pArr[i - 1]! : 0) + 0.54);

    i1Arr[i] = i - 3 >= 0 ? dt[i - 3]! : 0;

    jI[i] =
      (0.0962 * i1Arr[i]! +
        0.5769 * (i - 2 >= 0 ? i1Arr[i - 2]! : 0) -
        0.5769 * (i - 4 >= 0 ? i1Arr[i - 4]! : 0) -
        0.0962 * (i - 6 >= 0 ? i1Arr[i - 6]! : 0)) *
      (0.075 * (i - 1 >= 0 ? pArr[i - 1]! : 0) + 0.54);

    jq[i] =
      (0.0962 * q1[i]! +
        0.5769 * (i - 2 >= 0 ? q1[i - 2]! : 0) -
        0.5769 * (i - 4 >= 0 ? q1[i - 4]! : 0) -
        0.0962 * (i - 6 >= 0 ? q1[i - 6]! : 0)) *
      (0.075 * (i - 1 >= 0 ? pArr[i - 1]! : 0) + 0.54);

    const i2Temp = i1Arr[i]! - jq[i]!;
    const q2Temp = q1[i]! + jI[i]!;

    i2Arr[i] = 0.2 * i2Temp + 0.8 * (i - 1 >= 0 ? i2Arr[i - 1]! : 0);
    q2Arr[i] = 0.2 * q2Temp + 0.8 * (i - 1 >= 0 ? q2Arr[i - 1]! : 0);

    const reTemp = i2Arr[i]! * (i - 1 >= 0 ? i2Arr[i - 1]! : 0) + q2Arr[i]! * (i - 1 >= 0 ? q2Arr[i - 1]! : 0);
    const imTemp = i2Arr[i]! * (i - 1 >= 0 ? q2Arr[i - 1]! : 0) - q2Arr[i]! * (i - 1 >= 0 ? i2Arr[i - 1]! : 0);

    reArr[i] = 0.2 * reTemp + 0.8 * (i - 1 >= 0 ? reArr[i - 1]! : 0);
    imArr[i] = 0.2 * imTemp + 0.8 * (i - 1 >= 0 ? imArr[i - 1]! : 0);

    if (imArr[i] !== 0 && reArr[i] !== 0) {
      p1Arr[i] = (2 * pi) / Math.atan(imArr[i]! / reArr[i]!);
    } else {
      p1Arr[i] = i - 1 >= 0 ? pArr[i - 1]! : 0;
    }

    const pPrev = i - 1 >= 0 ? pArr[i - 1]! : 0;
    let p2: number;
    if (p1Arr[i]! > 1.5 * pPrev) {
      p2 = 1.5 * pPrev;
    } else if (p1Arr[i]! < 0.67 * pPrev) {
      p2 = 0.67 * pPrev;
    } else {
      p2 = p1Arr[i]!;
    }
    p2Arr[i] = p2;

    p3Arr[i] = p2Arr[i]! < 6 ? 6 : p2Arr[i]! > 50 ? 50 : p2Arr[i]!;
    pArr[i] = 0.2 * p3Arr[i]! + 0.8 * pPrev;
    spp[i] = 0.33 * pArr[i]! + 0.67 * (i - 1 >= 0 ? spp[i - 1]! : 0);

    phase[i] = i1Arr[i]! !== 0 ? (180 / pi) * Math.atan(q1[i]! / i1Arr[i]!) : 0;
    let dphaseVal = (i - 1 >= 0 ? phase[i - 1]! : 0) - phase[i]!;
    if (dphaseVal < 1) {
      dphaseVal = 1;
    }
    dphase[i] = dphaseVal;

    const alphaTemp = fastlimit / dphase[i]!;
    if (alphaTemp < slowlimit) {
      alphaArr[i] = slowlimit;
    } else if (alphaTemp > fastlimit) {
      alphaArr[i] = fastlimit;
    } else {
      alphaArr[i] = alphaTemp;
    }

    mamaArr[i] =
      alphaArr[i]! * source[i]! +
      (1 - alphaArr[i]!) * (i - 1 >= 0 ? mamaArr[i - 1]! : source[i]!);
    famaArr[i] =
      0.5 * alphaArr[i]! * mamaArr[i]! +
      (1 - 0.5 * alphaArr[i]!) * (i - 1 >= 0 ? famaArr[i - 1]! : source[i]!);
  }

  return { mama: mamaArr, fama: famaArr };
}

export function mama(
  candles: IndicatorCandles,
  fastlimit: number = 0.5,
  slowlimit: number = 0.05,
  sourceType: string = "close",
  sequential: boolean = false,
): MamaResult {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }
  if (source.length === 0) {
    if (!sequential) {
      return { mama: Number.NaN, fama: Number.NaN };
    }
    return { mama: new Float64Array(), fama: new Float64Array() };
  }
  const { mama: mamaArr, fama: famaArr } = fastMama(source, fastlimit, slowlimit);
  if (sequential) {
    return { mama: mamaArr, fama: famaArr };
  }
  const li = mamaArr.length - 1;
  return { mama: mamaArr[li]!, fama: famaArr[li]! };
}
