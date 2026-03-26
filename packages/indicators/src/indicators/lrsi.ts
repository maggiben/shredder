/**
 * RSI Laguerre Filter
 *
 * :param candles: np.ndarray
 * :param alpha: float - default: 0.2
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function lrsi(candles: OhlcvMatrix, alpha: number = 0.2, sequential: boolean = false): number | Float64Array | null {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const n = high.length;
  const price = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    price[i] = (high[i]! + low[i]!) / 2;
  }
  const l0 = price.slice();
  const l1 = price.slice();
  const l2 = price.slice();
  const l3 = price.slice();
  const gamma = 1 - alpha;
  for (let i = 0; i < n; i += 1) {
    const p0 = i > 0 ? l0[i - 1]! : price[0]!;
    const p1 = i > 0 ? l1[i - 1]! : price[0]!;
    const p2 = i > 0 ? l2[i - 1]! : price[0]!;
    const p3 = i > 0 ? l3[i - 1]! : price[0]!;
    const l0m = i > 0 ? l0[i - 1]! : price[0]!;
    const l1m = i > 0 ? l1[i - 1]! : price[0]!;
    const l2m = i > 0 ? l2[i - 1]! : price[0]!;
    l0[i] = alpha * price[i]! + gamma * p0;
    l1[i] = -gamma * l0[i]! + l0m + gamma * p1;
    l2[i] = -gamma * l1[i]! + l1m + gamma * p2;
    l3[i] = -gamma * l2[i]! + l2m + gamma * p3;
  }
  const rsi = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    let cu = 0;
    let cd = 0;
    if (l0[i]! >= l1[i]!) {
      cu += l0[i]! - l1[i]!;
    } else {
      cd += l1[i]! - l0[i]!;
    }
    if (l1[i]! >= l2[i]!) {
      cu += l1[i]! - l2[i]!;
    } else {
      cd += l2[i]! - l1[i]!;
    }
    if (l2[i]! >= l3[i]!) {
      cu += l2[i]! - l3[i]!;
    } else {
      cd += l3[i]! - l2[i]!;
    }
    rsi[i] = cu + cd === 0 ? 0 : cu / (cu + cd);
  }
  if (sequential) {
    return rsi;
  }
  const last = rsi[rsi.length - 1]!;
  return Number.isNaN(last) ? null : last;
}
