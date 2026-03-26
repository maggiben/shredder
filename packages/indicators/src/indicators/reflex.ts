/**
 * Reflex indicator by John F. Ehlers
 *
 * :param candles: np.ndarray
 * :param period: int - default: 20
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { superSmoother2Fast } from "../np/ehlers.js";

function reflexFast(ssf: Float64Array, period: number): Float64Array {
  const n = ssf.length;
  const rf = new Float64Array(n);
  const ms = new Float64Array(n);
  const sums = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    if (i >= period) {
      const slope = (ssf[i - period]! - ssf[i]!) / period;
      let mySum = 0;
      for (let t = 1; t <= period; t += 1) {
        mySum += ssf[i]! + t * slope - ssf[i - t]!;
      }
      mySum /= period;
      sums[i] = mySum;
      ms[i] = 0.04 * mySum * mySum + 0.96 * ms[i - 1]!;
      if (ms[i]! > 0) {
        rf[i] = mySum / Math.sqrt(ms[i]!);
      }
    }
  }
  return rf;
}

export function reflex(
  candles: IndicatorCandles,
  period: number = 20,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array | null {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const ssf = superSmoother2Fast(source, period / 2);
  const rf = reflexFast(ssf, period);
  if (sequential) {
    return rf;
  }
  const last = rf[rf.length - 1]!;
  return Number.isNaN(last) ? null : last;
}
