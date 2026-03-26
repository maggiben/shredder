/*
 Donchian Channels

 :param candles: np.ndarray
 :param period: int - default: 20
 :param sequential: bool - default: False

 :return: namedtuple upperband, middleband, lowerband
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { donchian as donchianRust } from "../series/candles.js";

export type DonchianResult =
  | {
      readonly upperband: number;
      readonly middleband: number;
      readonly lowerband: number;
    }
  | {
      readonly upperband: Float64Array;
      readonly middleband: Float64Array;
      readonly lowerband: Float64Array;
    };

export function donchian(
  candles: IndicatorCandles,
  period: number = 20,
  sequential: boolean = false,
): DonchianResult {
  if (isCandles1D(candles)) {
    throw new Error("donchian requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const { upperband, middleband, lowerband } = donchianRust(m, period);
  if (sequential) {
    return { upperband, middleband, lowerband };
  }
  const li = upperband.length - 1;
  return {
    upperband: upperband[li]!,
    middleband: middleband[li]!,
    lowerband: lowerband[li]!,
  };
}
