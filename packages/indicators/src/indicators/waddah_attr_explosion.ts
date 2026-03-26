/*
 @author LazyBear 
 credits: https://www.tradingview.com/v/iu3kKWDI/

 WADDAH_ATTAR_EXPLOSION - Waddah Attar Explosion

 :param candles: np.ndarray
 :param sensitivity: int - default: 150
 :param fast_length: int - default: 20
 :param slow_length: int - default: 40
 :param channel_length: int - default: 20
 :param mult: float - default: 2.0
 :param source_type: str - default: "close"

 :return: WaddahAttarExplosionTuple(explosion_line, trend_power, trend_direction)
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { macd } from "./macd.js";
import { sma } from "./sma.js";
import { stddev } from "./stddev.js";

export type WaddahAttarExplosionResult = {
  readonly explosion_line: number;
  readonly trend_power: number;
  readonly trend_direction: number;
};

function calcBbUpper(source: Float64Array, length: number, mult: number): number {
  const basis = sma(source, length, "close", false) as number;
  const dev = stddev(source, length, 1, "close", false) as number;
  return basis + mult * dev;
}

function calcBbLower(source: Float64Array, length: number, mult: number): number {
  const basis = sma(source, length, "close", false) as number;
  const dev = stddev(source, length, 1, "close", false) as number;
  return basis - mult * dev;
}

export function waddah_attr_explosion(
  candles: IndicatorCandles,
  sensitivity: number = 150,
  fastLength: number = 20,
  slowLength: number = 40,
  channelLength: number = 20,
  mult: number = 2.0,
  sourceType: string = "close",
): WaddahAttarExplosionResult {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, false);
    source = getCandleSource(matrix, sourceType);
  }
  const prev =
    source.length > 1 ? source.subarray(0, source.length - 1) : new Float64Array(0);
  const curMacd = macd(source, fastLength, slowLength, 9, "close", false) as {
    macd: number;
    signal: number;
    hist: number;
  };
  const prevMacd =
    prev.length > 0
      ? (macd(prev, fastLength, slowLength, 9, "close", false) as {
          macd: number;
          signal: number;
          hist: number;
        })
      : curMacd;
  const t1 = (curMacd.macd - prevMacd.macd) * sensitivity;
  const trend = t1 >= 0 ? 1 : -1;
  const e1 = calcBbUpper(source, channelLength, mult) - calcBbLower(source, channelLength, mult);
  return {
    explosion_line: e1,
    trend_power: t1,
    trend_direction: trend,
  };
}
