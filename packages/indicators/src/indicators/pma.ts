/**
 * Ehlers Predictive Moving Average
 *
 * :param candles: np.ndarray
 * :param source_type: str - default: "hl2"
 * :param sequential: bool - default: False
 *
 * :return: PMA(predict, trigger)
 */
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";

export type PMA = { predict: number | Float64Array; trigger: number | Float64Array };

function pmaFast(source: Float64Array): { predict: Float64Array; trigger: Float64Array } {
  const predict = new Float64Array(source.length);
  const trigger = new Float64Array(source.length);
  predict.fill(Number.NaN);
  trigger.fill(Number.NaN);
  const wma1 = new Float64Array(source.length);
  for (let j = 6; j < source.length; j += 1) {
    wma1[j] =
      (7 * source[j]! +
        6 * source[j - 1]! +
        5 * source[j - 2]! +
        4 * source[j - 3]! +
        3 * source[j - 4]! +
        2 * source[j - 5]! +
        source[j - 6]!) /
      28;
    const wma2 =
      (7 * wma1[j]! +
        6 * wma1[j - 1]! +
        5 * wma1[j - 2]! +
        4 * wma1[j - 3]! +
        3 * wma1[j - 4]! +
        2 * wma1[j - 5]! +
        wma1[j - 6]!) /
      28;
    predict[j] = 2 * wma1[j]! - wma2;
    trigger[j] = (4 * predict[j]! + 3 * predict[j - 1]! + 2 * predict[j - 2]! + predict[j - 3]!) / 10;
  }
  return { predict, trigger };
}

export function pma(candles: IndicatorCandles, sourceType: string = "hl2", sequential: boolean = false): PMA {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    source = getCandleSource(sliceCandles(candles, sequential), sourceType);
  }
  const { predict, trigger } = pmaFast(source);
  if (sequential) {
    return { predict, trigger };
  }
  const li = source.length - 1;
  return { predict: predict[li]!, trigger: trigger[li]! };
}
