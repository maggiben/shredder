/**
 * Know Sure Thing (KST)
 *
 * :param candles: np.ndarray
 * ...
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries, sliceCandles } from "../candles/helpers.js";
import { isCandles1D } from "../types.js";
import { getCandleSource } from "../candles/helpers.js";
import { roc } from "./roc.js";
import { sma } from "./sma.js";

export type KST = { line: number | Float64Array; signal: number | Float64Array };

export function kst(
  candles: IndicatorCandles,
  smaPeriod1: number = 10,
  smaPeriod2: number = 10,
  smaPeriod3: number = 10,
  smaPeriod4: number = 15,
  rocPeriod1: number = 10,
  rocPeriod2: number = 15,
  rocPeriod3: number = 20,
  rocPeriod4: number = 30,
  signalPeriod: number = 9,
  sourceType: string = "close",
  sequential: boolean = false,
): KST {
  const source = isCandles1D(candles)
    ? candles
    : getCandleSource(sliceCandles(candles, sequential), sourceType);
  const aroc1 = sma(roc(source, rocPeriod1, sourceType, true) as Float64Array, smaPeriod1, "close", true) as Float64Array;
  const aroc2 = sma(roc(source, rocPeriod2, sourceType, true) as Float64Array, smaPeriod2, "close", true) as Float64Array;
  const aroc3 = sma(roc(source, rocPeriod3, sourceType, true) as Float64Array, smaPeriod3, "close", true) as Float64Array;
  const aroc4 = sma(roc(source, rocPeriod4, sourceType, true) as Float64Array, smaPeriod4, "close", true) as Float64Array;
  const alignedLen = aroc4.length;
  const off1 = aroc1.length - alignedLen;
  const off2 = aroc2.length - alignedLen;
  const off3 = aroc3.length - alignedLen;
  const line = new Float64Array(alignedLen);
  for (let i = 0; i < alignedLen; i += 1) {
    line[i] = aroc1[off1 + i]! + 2 * aroc2[off2 + i]! + 3 * aroc3[off3 + i]! + 4 * aroc4[i]!;
  }
  const signal = sma(line, signalPeriod, "close", true) as Float64Array;
  if (sequential) {
    return { line, signal };
  }
  const li = line.length - 1;
  return { line: line[li]!, signal: signal[li]! };
}
