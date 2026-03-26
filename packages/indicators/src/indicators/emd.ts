/**
 * Empirical Mode Decomposition by John F. Ehlers and Ric Way
 *
 * :param candles: np.ndarray
 * :param period: int - default: 20
 * :param delta: float - default: 0.5
 * :param fraction: float - default: 0.1
 * :param sequential: bool - default: False
 *
 * :return: EMD(upperband, middleband, lowerband)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { sma } from "./sma.js";

export type EMD = { upperband: number | Float64Array; middleband: number | Float64Array; lowerband: number | Float64Array };

function bpFast(price: Float64Array, period: number, delta: number): Float64Array {
  const beta = Math.cos((2 * Math.PI) / period);
  const gamma = 1 / Math.cos((4 * Math.PI * delta) / period);
  const alpha = gamma - Math.sqrt(gamma * gamma - 1);
  const bp = new Float64Array(price.length);
  for (let i = 0; i < price.length; i += 1) {
    const pm2 = i >= 2 ? price[i - 2]! : price[0]!;
    if (i > 2) {
      bp[i] =
        0.5 * (1 - alpha) * (price[i]! - price[i - 2]!) + beta * (1 + alpha) * bp[i - 1]! - alpha * bp[i - 2]!;
    } else {
      bp[i] = 0.5 * (1 - alpha) * (price[i]! - pm2);
    }
  }
  return bp;
}

function peakValleyFast(bp: Float64Array, _price: Float64Array): { peak: Float64Array; valley: Float64Array } {
  const peak = bp.slice();
  const valley = bp.slice();
  for (let i = 0; i < bp.length; i += 1) {
    if (i > 0) {
      peak[i] = peak[i - 1]!;
      valley[i] = valley[i - 1]!;
    }
    if (i > 2) {
      if (bp[i - 1]! > bp[i]! && bp[i - 1]! > bp[i - 2]!) {
        peak[i] = bp[i - 1]!;
      }
      if (bp[i - 1]! < bp[i]! && bp[i - 1]! < bp[i - 2]!) {
        valley[i] = bp[i - 1]!;
      }
    }
  }
  return { peak, valley };
}

export function emd(
  candles: OhlcvMatrix,
  period: number = 20,
  delta: number = 0.5,
  fraction: number = 0.1,
  sequential: boolean = false,
): EMD {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const price = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    price[i] = (high[i]! + low[i]!) / 2;
  }
  const bp = bpFast(price, period, delta);
  const mean = sma(bp, 2 * period, "close", true) as Float64Array;
  const { peak, valley } = peakValleyFast(bp, price);
  const avgPeakRaw = sma(peak, 50, "close", true) as Float64Array;
  const avgValleyRaw = sma(valley, 50, "close", true) as Float64Array;
  const avgPeak = new Float64Array(avgPeakRaw.length);
  const avgValley = new Float64Array(avgValleyRaw.length);
  for (let i = 0; i < avgPeak.length; i += 1) {
    avgPeak[i] = fraction * avgPeakRaw[i]!;
    avgValley[i] = fraction * avgValleyRaw[i]!;
  }
  if (sequential) {
    return { upperband: avgPeak, middleband: mean, lowerband: avgValley };
  }
  const li = price.length - 1;
  return { upperband: avgPeak[li]!, middleband: mean[li]!, lowerband: avgValley[li]! };
}
