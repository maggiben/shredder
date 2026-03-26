/*
 Relative Strength Xtra (rsx)

 :param candles: np.ndarray
 :param period: int - default: 14
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

export function rsx(
  candles: IndicatorCandles,
  period: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const n = source.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  let f0 = 0;
  let f8 = 0;
  let f18 = 0;
  let f20 = 0;
  let f28 = 0;
  let f30 = 0;
  let f38 = 0;
  let f40 = 0;
  let f48 = 0;
  let f50 = 0;
  let f58 = 0;
  let f60 = 0;
  let f68 = 0;
  let f70 = 0;
  let f78 = 0;
  let f80 = 0;
  let f88 = 0;
  let f90 = 0;
  let v14 = 0;
  let v20 = 0;

  for (let i = period; i < source.length; i += 1) {
    let f10 = 0;
    let v8 = 0;
    let vC = 0;
    let v10 = 0;
    let v18 = 0;
    let v1C = 0;
    if (f90 === 0) {
      f90 = 1.0;
      f0 = 0.0;
      f88 = period >= 6 ? period - 1.0 : 5.0;
      f8 = 100.0 * source[i]!;
      f18 = 3.0 / (period + 2.0);
      f20 = 1.0 - f18;
    } else {
      f90 = f88 <= f90 ? f88 + 1 : f90 + 1;
      f10 = f8;
      f8 = 100 * source[i]!;
      v8 = f8 - f10;
      f28 = f20 * f28 + f18 * v8;
      f30 = f18 * f28 + f20 * f30;
      vC = f28 * 1.5 - f30 * 0.5;
      f38 = f20 * f38 + f18 * vC;
      f40 = f18 * f38 + f20 * f40;
      v10 = f38 * 1.5 - f40 * 0.5;
      f48 = f20 * f48 + f18 * v10;
      f50 = f18 * f48 + f20 * f50;
      v14 = f48 * 1.5 - f50 * 0.5;
      f58 = f20 * f58 + f18 * Math.abs(v8);
      f60 = f18 * f58 + f20 * f60;
      v18 = f58 * 1.5 - f60 * 0.5;
      f68 = f20 * f68 + f18 * v18;
      f70 = f18 * f68 + f20 * f70;
      v1C = f68 * 1.5 - f70 * 0.5;
      f78 = f20 * f78 + f18 * v1C;
      f80 = f18 * f78 + f20 * f80;
      v20 = f78 * 1.5 - f80 * 0.5;
      if (f88 >= f90 && f8 !== f10) {
        f0 = 1.0;
      }
      if (f88 === f90 && f0 === 0.0) {
        f90 = 0.0;
      }
    }
    let v4: number;
    if (f88 < f90 && v20 > 0.0000000001) {
      v4 = (v14 / v20 + 1.0) * 50.0;
      v4 = Math.min(v4, 100.0);
      v4 = Math.max(v4, 0.0);
    } else {
      v4 = 50.0;
    }
    res[i] = v4;
  }
  return sequential ? res : res[res.length - 1]!;
}
