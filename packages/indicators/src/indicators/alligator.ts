/*
 Alligator indicator by Bill Williams

 :param candles: np.ndarray
 :param source_type: str - default: "hl2"
 :param sequential: bool - default: False

 :return: AG(jaw, teeth, lips)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { alligatorFromSource } from "../series/extra.js";

export type AlligatorResult =
  | { readonly jaw: number; readonly teeth: number; readonly lips: number }
  | { readonly jaw: Float64Array; readonly teeth: Float64Array; readonly lips: Float64Array };

export function alligator(
  candles: IndicatorCandles,
  sourceType: string = "hl2",
  sequential: boolean = false,
): AlligatorResult {
  if (isCandles1D(candles)) {
    throw new Error("alligator requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const source = getCandleSource(m, sourceType);
  const { jaw, teeth, lips } = alligatorFromSource(source);
  if (sequential) {
    return { jaw, teeth, lips };
  }
  const li = jaw.length - 1;
  return { jaw: jaw[li]!, teeth: teeth[li]!, lips: lips[li]! };
}
