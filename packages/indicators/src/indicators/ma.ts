/**
 * MA — composite moving-average helper (multiple `matype` variants).
 *
 * :param candles: np.ndarray
 * :param period: int - default: 30
 * :param matype: int - default: 0
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 *
 * matype mapping matches indicators_to_be_ported/ma.py
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { vwma as vwmaOHLCV } from "../series/candles.js";
import { vwap as vwapOHLCV } from "../series/extra.js";
import { alma } from "./alma.js";
import { cwma } from "./cwma.js";
import { dema } from "./dema.js";
import { edcf } from "./edcf.js";
import { ema } from "./ema.js";
import { epma } from "./epma.js";
import { fwma } from "./fwma.js";
import { gauss } from "./gauss.js";
import { high_pass } from "./high_pass.js";
import { high_pass_2_pole } from "./high_pass_2_pole.js";
import { hma } from "./hma.js";
import { hwma } from "./hwma.js";
import { jma } from "./jma.js";
import { jsa } from "./jsa.js";
import { kama } from "./kama.js";
import { linearreg } from "./linearreg.js";
import { maaq } from "./maaq.js";
import { mwdx } from "./mwdx.js";
import { nma } from "./nma.js";
import { pwma } from "./pwma.js";
import { reflex } from "./reflex.js";
import { sinwma } from "./sinwma.js";
import { sma } from "./sma.js";
import { smma } from "./smma.js";
import { sqwma } from "./sqwma.js";
import { srwma } from "./srwma.js";
import { supersmoother } from "./supersmoother.js";
import { supersmoother_3_pole } from "./supersmoother_3_pole.js";
import { tema } from "./tema.js";
import { swma } from "./swma.js";
import { trendflex } from "./trendflex.js";
import { trima } from "./trima.js";
import { wilders } from "./wilders.js";
import { vpwma } from "./vpwma.js";
import { wma } from "./wma.js";

export function ma(
  candles: IndicatorCandles,
  period: number = 30,
  matype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  if (matype === 7 || matype === 8 || matype === 19) {
    throw new Error("Invalid matype value.");
  }
  const m: IndicatorCandles = isCandles1D(candles) ? candles : sliceCandles(candles, sequential);
  let seq: Float64Array;
  switch (matype) {
    case 0:
      seq = sma(m, period, sourceType, true) as Float64Array;
      break;
    case 1:
      seq = ema(m, period, sourceType, true) as Float64Array;
      break;
    case 2:
      seq = wma(m, period, sourceType, true) as Float64Array;
      break;
    case 3:
      seq = dema(m, period, sourceType, true) as Float64Array;
      break;
    case 4:
      seq = tema(m, period, sourceType, true) as Float64Array;
      break;
    case 5:
      seq = trima(m, period, sourceType, true) as Float64Array;
      break;
    case 6:
      seq = kama(m, period, 2, 30, sourceType, true) as Float64Array;
      break;
    case 9:
      seq = fwma(m, period, sourceType, true) as Float64Array;
      break;
    case 10:
      seq = hma(m, period, sourceType, true) as Float64Array;
      break;
    case 11:
      seq = linearreg(m, period, sourceType, true) as Float64Array;
      break;
    case 12:
      seq = wilders(m, period, sourceType, true) as Float64Array;
      break;
    case 13:
      seq = sinwma(m, period, sourceType, true) as Float64Array;
      break;
    case 14:
      seq = supersmoother(m, period, sourceType, true) as Float64Array;
      break;
    case 15:
      seq = supersmoother_3_pole(m, period, sourceType, true) as Float64Array;
      break;
    case 16:
      seq = gauss(m, period, 4, sourceType, true) as Float64Array;
      break;
    case 17:
      seq = high_pass(m, period, sourceType, true) as Float64Array;
      break;
    case 18:
      seq = high_pass_2_pole(m, period, sourceType, true) as Float64Array;
      break;
    case 20:
      seq = jma(m, period, 50, 2, sourceType, true) as Float64Array;
      break;
    case 21:
      seq = reflex(m, period, sourceType, true) as Float64Array;
      break;
    case 22:
      seq = trendflex(m, period, sourceType, true) as Float64Array;
      break;
    case 23:
      seq = smma(m, period, sourceType, true) as Float64Array;
      break;
    case 24: {
      if (isCandles1D(m)) {
        throw new Error("vwma only works with normal candles.");
      }
      seq = vwmaOHLCV(m as OhlcvMatrix, period);
      break;
    }
    case 25:
      seq = pwma(m, period, sourceType, true) as Float64Array;
      break;
    case 26:
      seq = swma(m, period, sourceType, true) as Float64Array;
      break;
    case 27:
      seq = alma(m, period, 6, 0.85, sourceType, true) as Float64Array;
      break;
    case 28:
      seq = hwma(m, 0.2, 0.1, 0.1, sourceType, true) as Float64Array;
      break;
    case 29: {
      if (isCandles1D(m)) {
        throw new Error("vwap only works with normal candles.");
      }
      seq = vwapOHLCV(m as OhlcvMatrix, sourceType, "D", true);
      break;
    }
    case 30:
      seq = nma(m, period, sourceType, true) as Float64Array;
      break;
    case 31:
      seq = edcf(m, period, sourceType, true) as Float64Array;
      break;
    case 32:
      seq = mwdx(m, 0.2, sourceType, true) as Float64Array;
      break;
    case 33:
      seq = maaq(m, period, 2, 30, sourceType, true) as Float64Array;
      break;
    case 34:
      seq = srwma(m, period, sourceType, true) as Float64Array;
      break;
    case 35:
      seq = sqwma(m, period, sourceType, true) as Float64Array;
      break;
    case 36:
      seq = vpwma(m, period, 0.382, sourceType, true) as Float64Array;
      break;
    case 37:
      seq = cwma(m, period, sourceType, true) as Float64Array;
      break;
    case 38:
      seq = jsa(m, period, sourceType, true) as Float64Array;
      break;
    case 39:
      seq = epma(m, period, 4, sourceType, true) as Float64Array;
      break;
    default:
      throw new Error(`@shredder/indicators: ma matype ${matype} is not implemented yet`);
  }
  return sequential ? seq : seq[seq.length - 1]!;
}
