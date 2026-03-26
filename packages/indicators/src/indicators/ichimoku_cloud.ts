/*
 Ichimoku Cloud

 :param candles: np.ndarray
 :param conversion_line_period: int - default: 9
 :param base_line_period: int - default: 26
 :param lagging_line_period: int - default: 52
 :param displacement: - default: 26

 :return: IchimokuCloud(conversion_line, base_line, span_a, span_b)
*/
import type { OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { ichimokuCloud } from "../series/extra.js";

export type IchimokuCloudResult = {
  readonly conversion_line: number;
  readonly base_line: number;
  readonly span_a: number;
  readonly span_b: number;
};

export function ichimoku_cloud(
  candles: OhlcvMatrix,
  conversionLinePeriod: number = 9,
  baseLinePeriod: number = 26,
  laggingLinePeriod: number = 52,
  displacement: number = 26,
): IchimokuCloudResult {
  if (isCandles1D(candles)) {
    throw new Error("ichimoku_cloud requires OHLCV candle matrix");
  }
  const n = candles.length;
  if (n < 80) {
    return {
      conversion_line: Number.NaN,
      base_line: Number.NaN,
      span_a: Number.NaN,
      span_b: Number.NaN,
    };
  }
  const window = n > 80 ? candles.slice(-80) : candles;
  return ichimokuCloud(window, conversionLinePeriod, baseLinePeriod, laggingLinePeriod, displacement);
}
