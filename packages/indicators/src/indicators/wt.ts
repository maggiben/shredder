/**
 * Wavetrend indicator
 *
 * :param candles: np.ndarray
 * :param wtchannellen:  int - default: 9
 * :param wtaveragelen: int - default: 12
 * :param wtmalen: int - default: 3
 * :param oblevel: int - default: 53
 * :param oslevel: int - default: -53
 * :param source_type: str - default: "hlc3"
 * :param sequential: bool - default: False
 *
 * :return: Wavetrend
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { wt as wtCore } from "../series/extra.js";

export type WtResult = {
  wt1: number | Float64Array;
  wt2: number | Float64Array;
  wtCrossUp: number | Uint8Array;
  wtCrossDown: number | Uint8Array;
  wtOversold: number | Uint8Array;
  wtOverbought: number | Uint8Array;
  wtVwap: number | Float64Array;
};

export function wt(
  candles: OhlcvMatrix,
  wtchannellen: number = 9,
  wtaveragelen: number = 12,
  wtmalen: number = 3,
  oblevel: number = 53,
  oslevel: number = -53,
  source_type: string = "hlc3",
  sequential: boolean = false,
): WtResult {
  const m = sliceCandles(candles, sequential);
  const r = wtCore(m, wtchannellen, wtaveragelen, wtmalen, oblevel, oslevel, source_type);
  if (sequential) {
    return { ...r };
  }
  const li = m.length - 1;
  return {
    wt1: r.wt1[li]!,
    wt2: r.wt2[li]!,
    wtCrossUp: r.wtCrossUp[li]!,
    wtCrossDown: r.wtCrossDown[li]!,
    wtOversold: r.wtOversold[li]!,
    wtOverbought: r.wtOverbought[li]!,
    wtVwap: r.wtVwap[li]!,
  };
}
