/**
 * STC - Schaff Trend Cycle (Oscillator)
 *
 * :param candles: np.ndarray
 * :param fast_period: int - default: 23
 * :param slow_period: int - default: 50
 * :param k_period: int - default: 10
 * :param d1_period: int - default: 3
 * :param d2_period: int - default: 3
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function emaSeries(series: Float64Array, period: number): Float64Array {
  const alpha = 2 / (period + 1);
  const out = new Float64Array(series.length);
  out[0] = series[0]!;
  for (let i = 1; i < series.length; i += 1) {
    out[i] = alpha * series[i]! + (1 - alpha) * out[i - 1]!;
  }
  return out;
}

function stochSeries(series: Float64Array, period: number): Float64Array {
  const result = new Float64Array(series.length);
  result.fill(Number.NaN);
  for (let i = 0; i < series.length; i += 1) {
    if (i < period - 1) {
      continue;
    }
    let low = series[i - period + 1]!;
    let high = series[i - period + 1]!;
    for (let k = i - period + 2; k <= i; k += 1) {
      low = Math.min(low, series[k]!);
      high = Math.max(high, series[k]!);
    }
    result[i] = high === low ? 0 : (100 * (series[i]! - low)) / (high - low);
  }
  return result;
}

export function stc(
  candles: IndicatorCandles,
  fastPeriod: number = 23,
  slowPeriod: number = 50,
  kPeriod: number = 10,
  d1Period: number = 3,
  d2Period: number = 3,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const emaFast = emaSeries(source, fastPeriod);
  const emaSlow = emaSeries(source, slowPeriod);
  const macd = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    macd[i] = emaFast[i]! - emaSlow[i]!;
  }
  let k = stochSeries(macd, kPeriod);
  k = Float64Array.from(k, (v) => (Number.isNaN(v) ? 0 : v));
  const dVal = emaSeries(k, d1Period);
  let kd = stochSeries(dVal, kPeriod);
  kd = Float64Array.from(kd, (v) => (Number.isNaN(v) ? 0 : v));
  let stcVal = emaSeries(kd, d2Period);
  stcVal = Float64Array.from(stcVal, (v) => Math.min(100, Math.max(0, v)));
  return sequential ? stcVal : stcVal[stcVal.length - 1]!;
}
