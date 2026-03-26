/*
 BBANDS - Bollinger Bands

 :param candles: np.ndarray
 :param period: int - default: 20
 :param devup: float - default: 2
 :param devdn: float - default: 2
 :param matype: int - default: 0
 :param devtype: int - default: 0
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: BollingerBands(upperband, middleband, lowerband)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { bollingerBands, movingStd } from "../series/series.js";
import { ma } from "./ma.js";
import { mean_ad } from "./mean_ad.js";
import { median_ad } from "./median_ad.js";

export type BollingerBandsResult =
  | { readonly upperband: number; readonly middleband: number; readonly lowerband: number }
  | {
      readonly upperband: Float64Array;
      readonly middleband: Float64Array;
      readonly lowerband: Float64Array;
    };

export function bollinger_bands(
  candles: IndicatorCandles,
  period: number = 20,
  devup: number = 2,
  devdn: number = 2,
  matype: number = 0,
  devtype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): BollingerBandsResult {
  let source: Float64Array;
  let matrix: OhlcvMatrix | undefined;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }

  let upperbands: Float64Array;
  let middlebands: Float64Array;
  let lowerbands: Float64Array;

  if (matype === 0 && devtype === 0) {
    const bb = bollingerBands(source, period, devup, devdn);
    upperbands = bb.upperband;
    middlebands = bb.middleband;
    lowerbands = bb.lowerband;
  } else {
    let dev: Float64Array;
    if (devtype === 0) {
      dev = movingStd(source, period);
    } else if (devtype === 1) {
      dev = mean_ad(source, period, "hl2", true) as Float64Array;
    } else if (devtype === 2) {
      dev = median_ad(source, period, "hl2", true) as Float64Array;
    } else {
      throw new Error("devtype not in (0, 1, 2)");
    }

    let middleSeq: Float64Array;
    if (matype === 24 || matype === 29) {
      if (!matrix) {
        throw new Error("Bollinger bands with matype 24 or 29 requires OHLCV candles");
      }
      middleSeq = ma(matrix, period, matype, sourceType, true) as Float64Array;
    } else {
      middleSeq = ma(source, period, matype, sourceType, true) as Float64Array;
    }

    const n = source.length;
    upperbands = new Float64Array(n);
    middlebands = new Float64Array(n);
    lowerbands = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      const m = middleSeq[i]!;
      const d = dev[i]!;
      upperbands[i] = m + devup * d;
      middlebands[i] = m;
      lowerbands[i] = m - devdn * d;
    }
  }

  if (sequential) {
    return { upperband: upperbands, middleband: middlebands, lowerband: lowerbands };
  }
  const li = upperbands.length - 1;
  return {
    upperband: upperbands[li]!,
    middleband: middlebands[li]!,
    lowerband: lowerbands[li]!,
  };
}
