/**
 * Ulcer Index (UI)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param scalar: float - default: 100
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { slidingWindowView } from "../np/sliding.js";

export function ui(
  candles: IndicatorCandles,
  period: number = 14,
  scalar: number = 100,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const n = source.length;
  const highestClose = new Float64Array(n);
  highestClose.fill(Number.NaN);
  if (n >= period) {
    const wins = slidingWindowView(source, period);
    for (let i = 0; i < wins.length; i += 1) {
      let mx = wins[i]![0]!;
      for (let k = 1; k < period; k += 1) {
        mx = Math.max(mx, wins[i]![k]!);
      }
      highestClose[period - 1 + i] = mx;
    }
  }
  const downside = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const hc = highestClose[i]!;
    downside[i] = hc !== 0 && !Number.isNaN(hc) ? (scalar * (source[i]! - hc)) / hc : Number.NaN;
  }
  const d2 = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const d = downside[i]!;
    d2[i] = Number.isNaN(d) ? Number.NaN : d * d;
  }
  const rollingSum = new Float64Array(n);
  rollingSum.fill(Number.NaN);
  if (n >= period) {
    let s = 0;
    for (let i = 0; i < period; i += 1) {
      s += Number.isNaN(d2[i]!) ? 0 : d2[i]!;
    }
    rollingSum[period - 1] = s;
    for (let i = period; i < n; i += 1) {
      s += Number.isNaN(d2[i]!) ? 0 : d2[i]!;
      s -= Number.isNaN(d2[i - period]!) ? 0 : d2[i - period]!;
      rollingSum[i] = s;
    }
  }
  const res = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    res[i] = Number.isNaN(rollingSum[i]!) ? Number.NaN : Math.sqrt(rollingSum[i]! / period);
  }
  return sequential ? res : res[res.length - 1]!;
}
