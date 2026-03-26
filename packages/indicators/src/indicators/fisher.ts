/**
 * The Fisher Transform helps identify price reversals.
 *
 * :param candles: np.ndarray
 * :param period: int - default: 9
 * :param sequential: bool - default: False
 *
 * :return: FisherTransform(fisher, signal)
 */
import type { OhlcvMatrix } from "../types.js";
import { sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export type FisherTransform = { fisher: number | Float64Array; signal: number | Float64Array };

function fisherTransform(high: Float64Array, low: Float64Array, period: number): { fisher: Float64Array; fisherSignal: Float64Array } {
  const length = high.length;
  const mid = new Float64Array(length);
  for (let i = 0; i < length; i += 1) {
    mid[i] = (high[i]! + low[i]!) / 2;
  }
  const fisher = new Float64Array(length);
  const fisherSignal = new Float64Array(length);
  let value1 = 0;
  for (let i = period; i < length; i += 1) {
    let maxH = mid[i - period + 1]!;
    let minL = mid[i - period + 1]!;
    for (let k = i - period + 2; k <= i; k += 1) {
      maxH = Math.max(maxH, mid[k]!);
      minL = Math.min(minL, mid[k]!);
    }
    let value0 = 0;
    if (maxH - minL === 0) {
      value0 = 0;
    } else {
      value0 = 0.33 * 2 * ((mid[i]! - minL) / (maxH - minL) - 0.5) + 0.67 * value1;
    }
    if (value0 > 0.99) {
      value0 = 0.999;
    } else if (value0 < -0.99) {
      value0 = -0.999;
    }
    fisher[i] = 0.5 * Math.log((1 + value0) / (1 - value0)) + 0.5 * fisher[i - 1]!;
    fisherSignal[i] = fisher[i - 1]!;
    value1 = value0;
  }
  return { fisher, fisherSignal };
}

export function fisher(candles: OhlcvMatrix, period: number = 9, sequential: boolean = false): FisherTransform {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const { fisher: fv, fisherSignal } = fisherTransform(high, low, period);
  if (sequential) {
    return { fisher: sameLength(m, fv), signal: sameLength(m, fisherSignal) };
  }
  const li = high.length - 1;
  return { fisher: fv[li]!, signal: fisherSignal[li]! };
}
