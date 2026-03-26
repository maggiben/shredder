/*
 @author daviddtech
 credits: https://www.tradingview.com/script/MOw6mUQl-Stiffness-Indicator-DaviddTech

 STIFNESS - Stifness

 :param candles: np.ndarray
 :param ma_length: int - default: 100
 :param stiff_length: int - default: 60
 :param stiff_smooth: int - default: 3
 :param source_type: str - default: "close"

 :return: Stiffness(stiffness, threshold)
*/
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { sma } from "./sma.js";
import { stddev } from "./stddev.js";
import { ema } from "./ema.js";

function countPriceExceedSeries(closePrices: Float64Array, artSeries: Float64Array, len: number): Float64Array {
  const exCounts = new Float64Array(closePrices.length);
  for (let i = 0; i < closePrices.length; i += 1) {
    if (i < len) {
      exCounts[i] = 0;
      continue;
    }
    let count = 0;
    for (let j = i - len + 1; j <= i; j += 1) {
      if (closePrices[j]! > artSeries[j]!) {
        count += 1;
      }
    }
    exCounts[i] = count;
  }
  return exCounts;
}

export function stiffness(
  candles: IndicatorCandles,
  maLength: number = 100,
  stiffLength: number = 60,
  stiffSmooth: number = 3,
  sourceType: string = "close",
): number {
  const source = resolveSourceSeries(candles, false, sourceType);
  const boundSeq = sma(source, maLength, "close", true) as Float64Array;
  const stdSeq = stddev(source, maLength, 1, "close", true) as Float64Array;
  const boundStiffness = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    boundStiffness[i] = boundSeq[i]! - 0.2 * stdSeq[i]!;
  }
  const sumAbove = countPriceExceedSeries(source, boundStiffness, stiffLength);
  const scaled = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    scaled[i] = (sumAbove[i]! * 100) / stiffLength;
  }
  return ema(scaled, stiffSmooth, "close", false) as number;
}
