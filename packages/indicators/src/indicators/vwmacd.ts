/**
 * VWMACD - Volume Weighted Moving Average Convergence/Divergence MACD
 *
 * :param candles: np.ndarray
 * :param fast_period: int - default: 12
 * :param slow_period: int - default: 26
 * :param signal_period: int - default: 9
 * :param sequential: bool - default: False
 *
 * :return: VWMACD(macd, signal, hist)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { vwma as vwmaCore } from "../series/candles.js";

export type VWMACD = { macd: number | Float64Array; signal: number | Float64Array; hist: number | Float64Array };

function dummyMatrixFromSeries(values: Float64Array): OhlcvMatrix {
  const rows: Float64Array[] = [];
  for (let i = 0; i < values.length; i += 1) {
    rows.push(Float64Array.from([0, 0, values[i]!, 0, 0, 1]));
  }
  return rows;
}

export function vwmacd(
  candles: OhlcvMatrix,
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
  sequential: boolean = false,
): VWMACD {
  const m = sliceCandles(candles, sequential);
  const fastWMA = vwmaCore(m, fastPeriod);
  const slowWMA = vwmaCore(m, slowPeriod);
  const macdVal = new Float64Array(fastWMA.length);
  for (let i = 0; i < fastWMA.length; i += 1) {
    macdVal[i] = fastWMA[i]! - slowWMA[i]!;
  }
  const sig = vwmaCore(dummyMatrixFromSeries(macdVal), signalPeriod);
  const hist = new Float64Array(macdVal.length);
  for (let i = 0; i < macdVal.length; i += 1) {
    hist[i] = macdVal[i]! - sig[i]!;
  }
  if (sequential) {
    return { macd: macdVal, signal: sig, hist };
  }
  const li = macdVal.length - 1;
  return { macd: macdVal[li]!, signal: sig[li]!, hist: hist[li]! };
}
