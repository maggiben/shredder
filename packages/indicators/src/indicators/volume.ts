/**
 * Volume with Moving Average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 20
 * :param sequential: bool - default: False
 *
 * :return: Volume(volume, ma)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { smaConvolveValid } from "../np/rolling.js";

export type VolumeResult = {
  volume: number | Float64Array;
  ma: number | Float64Array;
};

export function volume(
  candles: OhlcvMatrix,
  period: number = 20,
  sequential: boolean = false,
): VolumeResult {
  const m = sliceCandles(candles, sequential);
  const volumeData = column(m, 5);
  let volumeMa: Float64Array;
  if (volumeData.length < period) {
    volumeMa = new Float64Array(volumeData.length);
    volumeMa.fill(Number.NaN);
  } else {
    volumeMa = smaConvolveValid(volumeData, period);
  }
  if (sequential) {
    return { volume: volumeData, ma: volumeMa };
  }
  const li = volumeData.length - 1;
  return { volume: volumeData[li]!, ma: volumeMa[li]! };
}
