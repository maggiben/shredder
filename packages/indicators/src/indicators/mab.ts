/**
 * Moving Average Bands
 *
 * :param candles: np.ndarray
 * :param fast_period: int - default: 10
 * :param slow_period: int - default: 50
 * :param devup: float - default: 1
 * :param devdn: float - default: 1
 * :param fast_matype: int - default: 0
 * :param slow_matype: int - default: 0
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: MAB(upperband, middleband, lowerband)
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { ma } from "./ma.js";

export type MAB = { upperband: number | Float64Array; middleband: number | Float64Array; lowerband: number | Float64Array };

export function mab(
  candles: OhlcvMatrix,
  fastPeriod: number = 10,
  slowPeriod: number = 50,
  devup: number = 1,
  devdn: number = 1,
  fastMatype: number = 0,
  slowMatype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): MAB {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  let fastEma: Float64Array;
  let slowEma: Float64Array;
  if (fastMatype === 24 || fastMatype === 29 || slowMatype === 24 || slowMatype === 29) {
    fastEma = ma(m, fastPeriod, fastMatype, sourceType, true) as Float64Array;
    slowEma = ma(m, slowPeriod, slowMatype, sourceType, true) as Float64Array;
  } else {
    fastEma = ma(source, fastPeriod, fastMatype, sourceType, true) as Float64Array;
    slowEma = ma(source, slowPeriod, slowMatype, sourceType, true) as Float64Array;
  }
  let sqSum = 0;
  const start = Math.max(0, fastEma.length - fastPeriod);
  for (let i = start; i < fastEma.length; i += 1) {
    const d = fastEma[i]! - slowEma[i]!;
    sqSum += d * d;
  }
  const dev = Math.sqrt(sqSum / fastPeriod);
  const middlebands = fastEma;
  const upperbands = new Float64Array(fastEma.length);
  const lowerbands = new Float64Array(fastEma.length);
  for (let i = 0; i < fastEma.length; i += 1) {
    upperbands[i] = slowEma[i]! + devup * dev;
    lowerbands[i] = slowEma[i]! - devdn * dev;
  }
  if (sequential) {
    return { upperband: upperbands, middleband: middlebands, lowerband: lowerbands };
  }
  const li = fastEma.length - 1;
  return { upperband: upperbands[li]!, middleband: middlebands[li]!, lowerband: lowerbands[li]! };
}
