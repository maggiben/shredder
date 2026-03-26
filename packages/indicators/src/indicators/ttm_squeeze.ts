/*
 @author daviddtech
 credits: https://www.tradingview.com/script/Mh3EmxF5-TTM-Squeeze-DaviddTech/

 TTMSQUEEZE - TTMSqueeze

 :param candles: np.ndarray
 :param length_ttms: int - default: 20
 :param bb_mult_ttms: float - default: 2.0
 :param kc_mult_low_ttms: float - default: 2.0

 :return: TTMSqueeze(sqz_signal)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { bollinger_bands } from "./bollinger_bands.js";
import { sma } from "./sma.js";
import { trange } from "./trange.js";

export function ttm_squeeze(
  candles: IndicatorCandles,
  lengthTtms: number = 20,
  bbMultTtms: number = 2.0,
  kcMultLowTtms: number = 2.0,
): boolean {
  if (isCandles1D(candles)) {
    throw new Error("ttm_squeeze requires OHLCV candle matrix");
  }
  const m = candles as OhlcvMatrix;
  const bbData = bollinger_bands(m, lengthTtms, bbMultTtms, bbMultTtms, 0, 0, "close", false) as {
    upperband: number;
    middleband: number;
    lowerband: number;
  };
  const kcBasisTtms = sma(m, lengthTtms, "close", false) as number;
  const trSeq = trange(m, true) as Float64Array;
  const devkcTtms = sma(trSeq, lengthTtms, "close", false) as number;
  const noSqzTtms =
    bbData.lowerband < kcBasisTtms - devkcTtms * kcMultLowTtms ||
    bbData.upperband > kcBasisTtms + devkcTtms * kcMultLowTtms;
  return Boolean(noSqzTtms);
}
