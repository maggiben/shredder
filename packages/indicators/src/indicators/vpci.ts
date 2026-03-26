/**
 * VPCI - Volume Price Confirmation Indicator
 *
 * :param candles: np.ndarray
 * :param short_range: int - default: 5
 * :param long_range: int - default: 25
 * :param sequential: bool - default: False
 *
 * :return: VPCI(vpci, vpcis)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { sma } from "./sma.js";

export type VPCI = { vpci: number | Float64Array; vpcis: number | Float64Array };

export function vpci(
  candles: OhlcvMatrix,
  shortRange: number = 5,
  longRange: number = 25,
  sequential: boolean = false,
): VPCI {
  const m = sliceCandles(candles, sequential);
  const close = column(m, 2);
  const vol = column(m, 5);
  const cvLong = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    cvLong[i] = close[i]! * vol[i]!;
  }
  const smaCvL = sma(cvLong, longRange, "close", true) as Float64Array;
  const smaVL = sma(vol, longRange, "close", true) as Float64Array;
  const smaCL = sma(close, longRange, "close", true) as Float64Array;
  const vwmaLong = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    vwmaLong[i] = smaVL[i]! !== 0 ? smaCvL[i]! / smaVL[i]! : Number.NaN;
  }
  const VPC = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    VPC[i] = vwmaLong[i]! - smaCL[i]!;
  }
  const cvShort = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    cvShort[i] = close[i]! * vol[i]!;
  }
  const smaCvS = sma(cvShort, shortRange, "close", true) as Float64Array;
  const smaVS = sma(vol, shortRange, "close", true) as Float64Array;
  const smaCS = sma(close, shortRange, "close", true) as Float64Array;
  const vwmaShort = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    vwmaShort[i] = smaVS[i]! !== 0 ? smaCvS[i]! / smaVS[i]! : Number.NaN;
  }
  const VPR = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    VPR[i] = smaCS[i]! !== 0 ? vwmaShort[i]! / smaCS[i]! : Number.NaN;
  }
  const smaVS2 = sma(vol, shortRange, "close", true) as Float64Array;
  const smaVL2 = sma(vol, longRange, "close", true) as Float64Array;
  const VM = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    VM[i] = smaVL2[i]! !== 0 ? smaVS2[i]! / smaVL2[i]! : Number.NaN;
  }
  const VPCI_val = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    VPCI_val[i] = VPC[i]! * VPR[i]! * VM[i]!;
  }
  const vpcv = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    vpcv[i] = VPCI_val[i]! * vol[i]!;
  }
  const smaNum = sma(vpcv, shortRange, "close", true) as Float64Array;
  const VPCIS = new Float64Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    VPCIS[i] = smaVS[i]! !== 0 ? smaNum[i]! / smaVS[i]! : Number.NaN;
  }
  if (sequential) {
    return { vpci: VPCI_val, vpcis: VPCIS };
  }
  const li = close.length - 1;
  return { vpci: VPCI_val[li]!, vpcis: VPCIS[li]! };
}
