import type { IndicatorCandles, OhlcvMatrix } from "./types.js";
import { isCandles1D } from "./types.js";
import metadata from "./registry-metadata.json";

import { acosc } from "./indicators/acosc.js";
import { ad } from "./indicators/ad.js";
import { adosc } from "./indicators/adosc.js";
import { adx } from "./indicators/adx.js";
import { adxr } from "./indicators/adxr.js";
import { alligator } from "./indicators/alligator.js";
import { alma } from "./indicators/alma.js";
import { ao } from "./indicators/ao.js";
import { apo } from "./indicators/apo.js";
import { aroon } from "./indicators/aroon.js";
import { aroonosc } from "./indicators/aroonosc.js";
import { atr } from "./indicators/atr.js";
import { avgprice } from "./indicators/avgprice.js";
import { bandpass } from "./indicators/bandpass.js";
import { beta } from "./indicators/beta.js";
import { bollinger_bands } from "./indicators/bollinger_bands.js";
import { bollinger_bands_width } from "./indicators/bollinger_bands_width.js";
import { bop } from "./indicators/bop.js";
import { cc } from "./indicators/cc.js";
import { cci } from "./indicators/cci.js";
import { cfo } from "./indicators/cfo.js";
import { cg } from "./indicators/cg.js";
import { chande } from "./indicators/chande.js";
import { chop } from "./indicators/chop.js";
import { cksp } from "./indicators/cksp.js";
import { cmo } from "./indicators/cmo.js";
import { correl } from "./indicators/correl.js";
import { correlation_cycle } from "./indicators/correlation_cycle.js";
import { cwma } from "./indicators/cwma.js";
import { cvi } from "./indicators/cvi.js";
import { damiani_volatmeter } from "./indicators/damiani_volatmeter.js";
import { dec_osc } from "./indicators/dec_osc.js";
import { decycler } from "./indicators/decycler.js";
import { dema } from "./indicators/dema.js";
import { devstop } from "./indicators/devstop.js";
import { di } from "./indicators/di.js";
import { dm } from "./indicators/dm.js";
import { donchian } from "./indicators/donchian.js";
import { dpo } from "./indicators/dpo.js";
import { edcf } from "./indicators/edcf.js";
import { efi } from "./indicators/efi.js";
import { emd } from "./indicators/emd.js";
import { emv } from "./indicators/emv.js";
import { epma } from "./indicators/epma.js";
import { er } from "./indicators/er.js";
import { eri } from "./indicators/eri.js";
import { dti } from "./indicators/dti.js";
import { dx } from "./indicators/dx.js";
import { ema } from "./indicators/ema.js";
import { fisher } from "./indicators/fisher.js";
import { fosc } from "./indicators/fosc.js";
import { frama } from "./indicators/frama.js";
import { fwma } from "./indicators/fwma.js";
import { gauss } from "./indicators/gauss.js";
import { gatorosc } from "./indicators/gatorosc.js";
import { heikin_ashi_candles } from "./indicators/heikin_ashi_candles.js";
import { high_pass } from "./indicators/high_pass.js";
import { high_pass_2_pole } from "./indicators/high_pass_2_pole.js";
import { hma } from "./indicators/hma.js";
import { hull_suit } from "./indicators/hull_suit.js";
import { hurst_exponent } from "./indicators/hurst_exponent.js";
import { hwma } from "./indicators/hwma.js";
import { ichimoku_cloud } from "./indicators/ichimoku_cloud.js";
import { ichimoku_cloud_seq } from "./indicators/ichimoku_cloud_seq.js";
import { ift_rsi } from "./indicators/ift_rsi.js";
import { itrend } from "./indicators/itrend.js";
import { jma } from "./indicators/jma.js";
import { jsa } from "./indicators/jsa.js";
import { kama } from "./indicators/kama.js";
import { kaufmanstop } from "./indicators/kaufmanstop.js";
import { kdj } from "./indicators/kdj.js";
import { keltner } from "./indicators/keltner.js";
import { kst } from "./indicators/kst.js";
import { kurtosis } from "./indicators/kurtosis.js";
import { kvo } from "./indicators/kvo.js";
import { linearreg } from "./indicators/linearreg.js";
import { lrsi } from "./indicators/lrsi.js";
import { linearreg_angle } from "./indicators/linearreg_angle.js";
import { linearreg_intercept } from "./indicators/linearreg_intercept.js";
import { linearreg_slope } from "./indicators/linearreg_slope.js";
import { ma } from "./indicators/ma.js";
import { maaq } from "./indicators/maaq.js";
import { mab } from "./indicators/mab.js";
import { macd } from "./indicators/macd.js";
import { mama } from "./indicators/mama.js";
import { mass } from "./indicators/mass.js";
import { mcginley_dynamic } from "./indicators/mcginley_dynamic.js";
import { marketfi } from "./indicators/marketfi.js";
import { mean_ad } from "./indicators/mean_ad.js";
import { median_ad } from "./indicators/median_ad.js";
import { medprice } from "./indicators/medprice.js";
import { minmax } from "./indicators/minmax.js";
import { mfi } from "./indicators/mfi.js";
import { midpoint } from "./indicators/midpoint.js";
import { midprice } from "./indicators/midprice.js";
import { mom } from "./indicators/mom.js";
import { mwdx } from "./indicators/mwdx.js";
import { nma } from "./indicators/nma.js";
import { nvi } from "./indicators/nvi.js";
import { natr } from "./indicators/natr.js";
import { obv } from "./indicators/obv.js";
import { pfe } from "./indicators/pfe.js";
import { pivot } from "./indicators/pivot.js";
import { pma } from "./indicators/pma.js";
import { ppo } from "./indicators/ppo.js";
import { pvi } from "./indicators/pvi.js";
import { pwma } from "./indicators/pwma.js";
import { qstick } from "./indicators/qstick.js";
import { reflex } from "./indicators/reflex.js";
import { roofing } from "./indicators/roofing.js";
import { rsmk } from "./indicators/rsmk.js";
import { rsx } from "./indicators/rsx.js";
import { rvi } from "./indicators/rvi.js";
import { rma } from "./indicators/rma.js";
import { safezonestop } from "./indicators/safezonestop.js";
import { sar } from "./indicators/sar.js";
import { roc } from "./indicators/roc.js";
import { rocp } from "./indicators/rocp.js";
import { rocr } from "./indicators/rocr.js";
import { rocr100 } from "./indicators/rocr100.js";
import { rsi } from "./indicators/rsi.js";
import { sinwma } from "./indicators/sinwma.js";
import { skew } from "./indicators/skew.js";
import { sma } from "./indicators/sma.js";
import { smma } from "./indicators/smma.js";
import { squeeze_momentum } from "./indicators/squeeze_momentum.js";
import { sqwma } from "./indicators/sqwma.js";
import { srsi } from "./indicators/srsi.js";
import { srwma } from "./indicators/srwma.js";
import { stc } from "./indicators/stc.js";
import { stddev } from "./indicators/stddev.js";
import { stiffness } from "./indicators/stiffness.js";
import { stochastic } from "./indicators/stochastic.js";
import { stochf } from "./indicators/stochf.js";
import { supersmoother } from "./indicators/supersmoother.js";
import { supersmoother_3_pole } from "./indicators/supersmoother_3_pole.js";
import { supertrend } from "./indicators/supertrend.js";
import { support_resistance_with_break } from "./indicators/support_resistance_with_break.js";
import { swma } from "./indicators/swma.js";
import { t3 } from "./indicators/t3.js";
import { tema } from "./indicators/tema.js";
import { trendflex } from "./indicators/trendflex.js";
import { trange } from "./indicators/trange.js";
import { trix } from "./indicators/trix.js";
import { trima } from "./indicators/trima.js";
import { tsf } from "./indicators/tsf.js";
import { tsi } from "./indicators/tsi.js";
import { ttm_squeeze } from "./indicators/ttm_squeeze.js";
import { ttm_trend } from "./indicators/ttm_trend.js";
import { typprice } from "./indicators/typprice.js";
import { ui } from "./indicators/ui.js";
import { ultosc } from "./indicators/ultosc.js";
import { varIndicator as varianceIndicator } from "./indicators/var.js";
import { vidya } from "./indicators/vidya.js";
import { vi } from "./indicators/vi.js";
import { vlma } from "./indicators/vlma.js";
import { volume } from "./indicators/volume.js";
import { vosc } from "./indicators/vosc.js";
import { voss } from "./indicators/voss.js";
import { vpci } from "./indicators/vpci.js";
import { vpwma } from "./indicators/vpwma.js";
import { vwmacd } from "./indicators/vwmacd.js";
import { vpt } from "./indicators/vpt.js";
import { vwap } from "./indicators/vwap.js";
import { vwma } from "./indicators/vwma.js";
import { waddah_attr_explosion } from "./indicators/waddah_attr_explosion.js";
import { wad } from "./indicators/wad.js";
import { wclprice } from "./indicators/wclprice.js";
import { wilders } from "./indicators/wilders.js";
import { willr } from "./indicators/willr.js";
import { wma } from "./indicators/wma.js";
import { wt } from "./indicators/wt.js";
import { zlema } from "./indicators/zlema.js";
import { zscore } from "./indicators/zscore.js";

export type IndicatorId = keyof typeof metadata;

/**
 * One indicator parameter, aligned with JSDoc `@param {type} name - description`.
 */
export type IndicatorParamMeta = {
  name: string;
  default?: unknown;
  /** Text after the dash in `@param` (human-readable). */
  description?: string;
  /** Type hint string for docs, e.g. `OhlcvMatrix`, `number`. */
  type?: string;
};

/**
 * Static metadata for one indicator: summary line, parameters, optional `@returns` text.
 * Serialized in `registry-metadata.json`; regenerate with `scripts/extract_registry_metadata.py`.
 */
export type IndicatorMeta = {
  /** One-line summary (opening sentence of a JSDoc block). */
  description: string;
  params: IndicatorParamMeta[];
  /** Return description (`@returns`). */
  returns?: string;
};

export const INDICATOR_METADATA: Record<string, IndicatorMeta> = metadata as Record<string, IndicatorMeta>;

function boolSeq(p: Record<string, unknown>): boolean {
  return Boolean(p["sequential"]);
}

function num(p: Record<string, unknown>, key: string, fallback: number): number {
  const v = p[key];
  if (v === undefined || v === null) {
    return fallback;
  }
  return Number(v);
}

function str(
  p: Record<string, unknown>,
  snake: string,
  camel: string | undefined,
  fallback: string,
): string {
  const v = camel !== undefined ? p[snake] ?? p[camel] : p[snake];
  if (v === undefined || v === null) {
    return fallback;
  }
  return String(v);
}

function requireMatrix(candles: IndicatorCandles): OhlcvMatrix {
  if (isCandles1D(candles)) {
    throw new Error("This indicator requires an OHLCV candle matrix (2D), not a 1D series.");
  }
  return candles;
}

function requireParamMatrix(
  params: Record<string, unknown>,
  snake: string,
  camel: string | undefined = undefined,
): OhlcvMatrix {
  const v = camel !== undefined ? params[snake] ?? params[camel] : params[snake];
  if (v === undefined || v === null) {
    throw new Error(`Indicator param "${snake}" is required (OHLCV matrix).`);
  }
  return requireMatrix(v as IndicatorCandles);
}

function boolOr(p: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = p[key];
  if (v === undefined || v === null) {
    return fallback;
  }
  if (typeof v === "boolean") {
    return v;
  }
  if (v === 0 || v === "0" || v === "false") {
    return false;
  }
  if (v === 1 || v === "1" || v === "true") {
    return true;
  }
  return Boolean(v);
}

export function listIndicatorIds(): string[] {
  return Object.keys(INDICATOR_METADATA).sort();
}

/** Every id in `registry-metadata.json` has a TS implementation. */
export const IMPLEMENTED_INDICATOR_IDS: ReadonlySet<string> = new Set(listIndicatorIds());

export function isIndicatorImplemented(id: string): boolean {
  return IMPLEMENTED_INDICATOR_IDS.has(id);
}

export function computeIndicator(id: string, candles: IndicatorCandles, params: Record<string, unknown> = {}): unknown {
  if (!isIndicatorImplemented(id)) {
    throw new Error(
      `Indicator "${id}" is not implemented yet. Implemented: ${[...IMPLEMENTED_INDICATOR_IDS].sort().join(", ")}`,
    );
  }
  const sequential = boolSeq(params);
  const M = (): OhlcvMatrix => requireMatrix(candles);
  switch (id) {
    case "acosc":
      return acosc(M(), sequential);
    case "ad":
      return ad(M(), sequential);
    case "adosc":
      return adosc(M(), num(params, "fast_period", 3), num(params, "slow_period", 10), sequential);
    case "adx":
      return adx(candles, num(params, "period", 14), sequential);
    case "adxr":
      return adxr(M(), num(params, "period", 14), sequential);
    case "alligator":
      return alligator(candles, str(params, "source_type", "sourceType", "hl2"), sequential);
    case "alma":
      return alma(
        candles,
        num(params, "period", 9),
        num(params, "sigma", 6),
        num(params, "distribution_offset", 0.85),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "ao":
      return ao(M(), sequential);
    case "apo":
      return apo(
        candles,
        num(params, "fast_period", 12),
        num(params, "slow_period", 26),
        num(params, "matype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "aroon":
      return aroon(M(), num(params, "period", 14), sequential);
    case "aroonosc":
      return aroonosc(M(), num(params, "period", 14), sequential);
    case "atr":
      return atr(candles, num(params, "period", 14), sequential);
    case "avgprice":
      return avgprice(M(), sequential);
    case "bollinger_bands":
      return bollinger_bands(
        candles,
        num(params, "period", 20),
        num(params, "devup", 2),
        num(params, "devdn", 2),
        num(params, "matype", 0),
        num(params, "devtype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "bollinger_bands_width":
      return bollinger_bands_width(
        candles,
        num(params, "period", 20),
        num(params, "mult", 2),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "bop":
      return bop(M(), sequential);
    case "cci":
      return cci(M(), num(params, "period", 14), sequential);
    case "chande":
      return chande(
        candles,
        num(params, "period", 22),
        num(params, "mult", 3),
        str(params, "direction", undefined, "long"),
        sequential,
      );
    case "chop":
      return chop(
        candles,
        num(params, "period", 14),
        num(params, "scalar", 100),
        num(params, "drift", 1),
        sequential,
      );
    case "cvi":
      return cvi(candles, num(params, "period", 5), sequential);
    case "dema":
      return dema(candles, num(params, "period", 30), str(params, "source_type", "sourceType", "close"), sequential);
    case "di":
      return di(candles, num(params, "period", 14), sequential);
    case "dm":
      return dm(candles, num(params, "period", 14), sequential);
    case "donchian":
      return donchian(candles, num(params, "period", 20), sequential);
    case "dpo":
      return dpo(M(), num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "dti":
      return dti(M(), num(params, "r", 14), num(params, "s", 10), num(params, "u", 5), sequential);
    case "dx":
      return dx(M(), num(params, "di_length", 14), num(params, "adx_smoothing", 14), sequential);
    case "ema":
      return ema(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "fwma":
      return fwma(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "gatorosc":
      return gatorosc(M(), str(params, "source_type", "sourceType", "close"), sequential);
    case "hma":
      return hma(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "hwma":
      return hwma(
        candles,
        num(params, "na", 0.2),
        num(params, "nb", 0.1),
        num(params, "nc", 0.1),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "ichimoku_cloud":
      return ichimoku_cloud(
        M(),
        num(params, "conversion_line_period", 9),
        num(params, "base_line_period", 26),
        num(params, "lagging_line_period", 52),
        num(params, "displacement", 26),
      );
    case "jma":
      return jma(
        candles,
        num(params, "period", 7),
        num(params, "phase", 50),
        num(params, "power", 2),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "kama":
      return kama(
        candles,
        num(params, "period", 14),
        num(params, "fast_length", 2),
        num(params, "slow_length", 30),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "linearreg":
      return linearreg(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "linearreg_angle":
      return linearreg_angle(
        candles,
        num(params, "period", 14),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "linearreg_intercept":
      return linearreg_intercept(
        candles,
        num(params, "period", 14),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "linearreg_slope":
      return linearreg_slope(
        candles,
        num(params, "period", 14),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "ma":
      return ma(
        candles,
        num(params, "period", 30),
        num(params, "matype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "macd":
      return macd(
        candles,
        num(params, "fast_period", 12),
        num(params, "slow_period", 26),
        num(params, "signal_period", 9),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "marketfi":
      return marketfi(M(), sequential);
    case "mean_ad":
      return mean_ad(
        candles,
        num(params, "period", 5),
        str(params, "source_type", "sourceType", "hl2"),
        sequential,
      );
    case "median_ad":
      return median_ad(
        candles,
        num(params, "period", 5),
        str(params, "source_type", "sourceType", "hl2"),
        sequential,
      );
    case "medprice":
      return medprice(M(), sequential);
    case "mfi":
      return mfi(M(), num(params, "period", 14), sequential);
    case "midpoint":
      return midpoint(M(), num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "midprice":
      return midprice(M(), num(params, "period", 14), sequential);
    case "mom":
      return mom(candles, num(params, "period", 10), str(params, "source_type", "sourceType", "close"), sequential);
    case "mwdx":
      return mwdx(candles, num(params, "factor", 0.2), str(params, "source_type", "sourceType", "close"), sequential);
    case "natr":
      return natr(M(), num(params, "period", 14), sequential);
    case "obv":
      return obv(M(), sequential);
    case "pwma":
      return pwma(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "qstick":
      return qstick(M(), num(params, "period", 5), sequential);
    case "rma":
      return rma(candles, num(params, "length", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "roc":
      return roc(candles, num(params, "period", 10), str(params, "source_type", "sourceType", "close"), sequential);
    case "rocp":
      return rocp(candles, num(params, "period", 10), str(params, "source_type", "sourceType", "close"), sequential);
    case "rocr":
      return rocr(candles, num(params, "period", 10), str(params, "source_type", "sourceType", "close"), sequential);
    case "rocr100":
      return rocr100(candles, num(params, "period", 10), str(params, "source_type", "sourceType", "close"), sequential);
    case "rsi":
      return rsi(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "sinwma":
      return sinwma(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "sma":
      return sma(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "smma":
      return smma(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "srsi":
      return srsi(
        candles,
        num(params, "period", 14),
        num(params, "period_stoch", 14),
        num(params, "k", 3),
        num(params, "d", 3),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "stddev":
      return stddev(
        candles,
        num(params, "period", 5),
        num(params, "nbdev", 1),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "stochastic":
      return stochastic(
        candles,
        num(params, "fastk_period", 14),
        num(params, "slowk_period", 3),
        num(params, "slowk_matype", 0),
        num(params, "slowd_period", 3),
        num(params, "slowd_matype", 0),
        sequential,
      );
    case "stochf":
      return stochf(
        candles,
        num(params, "fastk_period", 5),
        num(params, "fastd_period", 3),
        num(params, "fastd_matype", 0),
        sequential,
      );
    case "swma":
      return swma(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "tema":
      return tema(candles, num(params, "period", 9), str(params, "source_type", "sourceType", "close"), sequential);
    case "trange":
      return trange(M(), sequential);
    case "trima":
      return trima(candles, num(params, "period", 30), str(params, "source_type", "sourceType", "close"), sequential);
    case "typprice":
      return typprice(M(), sequential);
    case "vi":
      return vi(candles, num(params, "period", 14), sequential);
    case "volume":
      return volume(M(), num(params, "period", 20), sequential);
    case "vpt":
      return vpt(M(), str(params, "source_type", "sourceType", "close"), sequential);
    case "vwap":
      return vwap(M(), str(params, "source_type", "sourceType", "hlc3"), str(params, "anchor", undefined, "D"), sequential);
    case "vwma":
      return vwma(
        candles,
        num(params, "period", 20),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "wclprice":
      return wclprice(M(), sequential);
    case "wilders":
      return wilders(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "willr":
      return willr(candles, num(params, "period", 14), sequential);
    case "wma":
      return wma(candles, num(params, "period", 30), str(params, "source_type", "sourceType", "close"), sequential);
    case "wt":
      return wt(
        M(),
        num(params, "wtchannellen", 9),
        num(params, "wtaveragelen", 12),
        num(params, "wtmalen", 3),
        num(params, "oblevel", 53),
        num(params, "oslevel", -53),
        str(params, "source_type", "sourceType", "hlc3"),
        sequential,
      );
    case "zlema":
      return zlema(candles, num(params, "period", 20), str(params, "source_type", "sourceType", "close"), sequential);
    case "bandpass":
      return bandpass(
        candles,
        num(params, "period", 20),
        num(params, "bandwidth", 0.3),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "beta":
      return beta(
        M(),
        requireParamMatrix(params, "benchmark_candles", "benchmarkCandles"),
        num(params, "period", 5),
        sequential,
      );
    case "cc":
      return cc(
        candles,
        num(params, "wma_period", 10),
        num(params, "roc_short_period", 11),
        num(params, "roc_long_period", 14),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "cfo":
      return cfo(
        candles,
        num(params, "period", 14),
        num(params, "scalar", 100),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "cg":
      return cg(candles, num(params, "period", 10), str(params, "source_type", "sourceType", "close"), sequential);
    case "cksp":
      return cksp(M(), num(params, "p", 10), num(params, "x", 1), num(params, "q", 9), sequential);
    case "cmo":
      return cmo(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "correl":
      return correl(M(), num(params, "period", 5), sequential);
    case "correlation_cycle":
      return correlation_cycle(
        candles,
        num(params, "period", 20),
        num(params, "threshold", 9),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "cwma":
      return cwma(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "damiani_volatmeter":
      return damiani_volatmeter(
        M(),
        num(params, "vis_atr", 13),
        num(params, "vis_std", 20),
        num(params, "sed_atr", 40),
        num(params, "sed_std", 100),
        num(params, "threshold", 1.4),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "dec_osc":
      return dec_osc(
        candles,
        num(params, "hp_period", 125),
        num(params, "k", 1),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "decycler":
      return decycler(candles, num(params, "hp_period", 125), str(params, "source_type", "sourceType", "close"), sequential);
    case "devstop":
      return devstop(
        M(),
        num(params, "period", 20),
        num(params, "mult", 0),
        num(params, "devtype", 0),
        str(params, "direction", undefined, "long"),
        sequential,
      );
    case "edcf":
      return edcf(candles, num(params, "period", 15), str(params, "source_type", "sourceType", "hl2"), sequential);
    case "efi":
      return efi(M(), num(params, "period", 13), str(params, "source_type", "sourceType", "close"), sequential);
    case "emd":
      return emd(M(), num(params, "period", 20), num(params, "delta", 0.5), num(params, "fraction", 0.1), sequential);
    case "emv":
      return emv(M(), num(params, "length", 14), num(params, "div", 10000), sequential);
    case "epma":
      return epma(
        candles,
        num(params, "period", 11),
        num(params, "offset", 4),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "er":
      return er(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "eri":
      return eri(
        M(),
        num(params, "period", 13),
        num(params, "matype", 1),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "fisher":
      return fisher(M(), num(params, "period", 9), sequential);
    case "fosc":
      return fosc(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "close"), sequential);
    case "frama":
      return frama(M(), num(params, "window", 10), num(params, "FC", 1), num(params, "SC", 300), sequential);
    case "gauss":
      return gauss(
        candles,
        num(params, "period", 14),
        num(params, "poles", 4),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "heikin_ashi_candles":
      return heikin_ashi_candles(M(), sequential);
    case "high_pass":
      return high_pass(candles, num(params, "period", 48), str(params, "source_type", "sourceType", "close"), sequential);
    case "high_pass_2_pole":
      return high_pass_2_pole(candles, num(params, "period", 48), str(params, "source_type", "sourceType", "close"), sequential);
    case "hull_suit":
      return hull_suit(
        candles,
        str(params, "mode_switch", "modeSwitch", "Hma"),
        num(params, "length", 55),
        num(params, "length_mult", 1),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "hurst_exponent":
      return hurst_exponent(
        candles,
        num(params, "min_chunksize", 8),
        num(params, "max_chunksize", 200),
        num(params, "num_chunksize", 5),
        num(params, "method", 1),
        str(params, "source_type", "sourceType", "close"),
      );
    case "ichimoku_cloud_seq":
      return ichimoku_cloud_seq(
        M(),
        num(params, "conversion_line_period", 9),
        num(params, "base_line_period", 26),
        num(params, "lagging_line_period", 52),
        num(params, "displacement", 26),
        sequential,
      );
    case "ift_rsi":
      return ift_rsi(
        candles,
        num(params, "rsi_period", 5),
        num(params, "wma_period", 9),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "itrend":
      return itrend(candles, num(params, "alpha", 0.07), str(params, "source_type", "sourceType", "hl2"), sequential);
    case "jsa":
      return jsa(candles, num(params, "period", 30), str(params, "source_type", "sourceType", "close"), sequential);
    case "kaufmanstop":
      return kaufmanstop(
        M(),
        num(params, "period", 22),
        num(params, "mult", 2),
        str(params, "direction", undefined, "long"),
        num(params, "matype", 0),
        sequential,
      );
    case "kdj":
      return kdj(
        M(),
        num(params, "fastk_period", 9),
        num(params, "slowk_period", 3),
        num(params, "slowk_matype", 0),
        num(params, "slowd_period", 3),
        num(params, "slowd_matype", 0),
        sequential,
      );
    case "keltner":
      return keltner(
        M(),
        num(params, "period", 20),
        num(params, "multiplier", 2),
        num(params, "matype", 1),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "kst":
      return kst(
        candles,
        num(params, "sma_period1", 10),
        num(params, "sma_period2", 10),
        num(params, "sma_period3", 10),
        num(params, "sma_period4", 15),
        num(params, "roc_period1", 10),
        num(params, "roc_period2", 15),
        num(params, "roc_period3", 20),
        num(params, "roc_period4", 30),
        num(params, "signal_period", 9),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "kurtosis":
      return kurtosis(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "hl2"), sequential);
    case "kvo":
      return kvo(M(), num(params, "short_period", 34), num(params, "long_period", 55), sequential);
    case "lrsi":
      return lrsi(M(), num(params, "alpha", 0.2), sequential);
    case "maaq":
      return maaq(
        candles,
        num(params, "period", 11),
        num(params, "fast_period", 2),
        num(params, "slow_period", 30),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "mab":
      return mab(
        M(),
        num(params, "fast_period", 10),
        num(params, "slow_period", 50),
        num(params, "devup", 1),
        num(params, "devdn", 1),
        num(params, "fast_matype", 0),
        num(params, "slow_matype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "mama":
      return mama(
        candles,
        num(params, "fastlimit", 0.5),
        num(params, "slowlimit", 0.05),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "mass":
      return mass(M(), num(params, "period", 5), sequential);
    case "mcginley_dynamic":
      return mcginley_dynamic(
        candles,
        num(params, "period", 10),
        num(params, "k", 0.6),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "minmax":
      return minmax(M(), num(params, "order", 3), sequential);
    case "nma":
      return nma(candles, num(params, "period", 40), str(params, "source_type", "sourceType", "close"), sequential);
    case "nvi":
      return nvi(M(), str(params, "source_type", "sourceType", "close"), sequential);
    case "pfe":
      return pfe(
        candles,
        num(params, "period", 10),
        num(params, "smoothing", 5),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "pivot":
      return pivot(M(), num(params, "mode", 0), sequential);
    case "pma":
      return pma(candles, str(params, "source_type", "sourceType", "hl2"), sequential);
    case "ppo":
      return ppo(
        candles,
        num(params, "fast_period", 12),
        num(params, "slow_period", 26),
        num(params, "matype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "pvi":
      return pvi(M(), str(params, "source_type", "sourceType", "close"), sequential);
    case "reflex":
      return reflex(candles, num(params, "period", 20), str(params, "source_type", "sourceType", "close"), sequential);
    case "roofing":
      return roofing(
        candles,
        num(params, "hp_period", 48),
        num(params, "lp_period", 10),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "rsmk":
      return rsmk(
        M(),
        requireParamMatrix(params, "candles_compare", "candlesCompare"),
        num(params, "lookback", 90),
        num(params, "period", 3),
        num(params, "signal_period", 20),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "rsx":
      return rsx(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "rvi":
      return rvi(
        candles,
        num(params, "period", 10),
        num(params, "ma_len", 14),
        num(params, "matype", 1),
        num(params, "devtype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "safezonestop":
      return safezonestop(
        candles,
        num(params, "period", 22),
        num(params, "mult", 2.5),
        num(params, "max_lookback", 3),
        str(params, "direction", undefined, "long"),
        sequential,
      );
    case "sar":
      return sar(candles, num(params, "acceleration", 0.02), num(params, "maximum", 0.2), sequential);
    case "skew":
      return skew(candles, num(params, "period", 5), str(params, "source_type", "sourceType", "hl2"), sequential);
    case "squeeze_momentum":
      return squeeze_momentum(
        M(),
        num(params, "length", 20),
        num(params, "mult", 2),
        num(params, "length_kc", 20),
        num(params, "mult_kc", 1.5),
        boolOr(params, "sequential", true),
      );
    case "sqwma":
      return sqwma(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "srwma":
      return srwma(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "stc":
      return stc(
        candles,
        num(params, "fast_period", 23),
        num(params, "slow_period", 50),
        num(params, "k_period", 10),
        num(params, "d1_period", 3),
        num(params, "d2_period", 3),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "stiffness":
      return stiffness(
        candles,
        num(params, "ma_length", 100),
        num(params, "stiff_length", 60),
        num(params, "stiff_smooth", 3),
        str(params, "source_type", "sourceType", "close"),
      );
    case "supersmoother":
      return supersmoother(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "supersmoother_3_pole":
      return supersmoother_3_pole(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "supertrend":
      return supertrend(candles, num(params, "period", 10), num(params, "factor", 3), sequential);
    case "support_resistance_with_break":
      return support_resistance_with_break(
        M(),
        num(params, "left_bars", 15),
        num(params, "right_bars", 15),
        num(params, "vol_threshold", 20),
      );
    case "t3":
      return t3(candles, num(params, "period", 5), num(params, "vfactor", 0), str(params, "source_type", "sourceType", "close"), sequential);
    case "trendflex":
      return trendflex(candles, num(params, "period", 20), str(params, "source_type", "sourceType", "close"), sequential);
    case "trix":
      return trix(candles, num(params, "period", 18), str(params, "source_type", "sourceType", "close"), sequential);
    case "tsf":
      return tsf(candles, num(params, "period", 14), str(params, "source_type", "sourceType", "close"), sequential);
    case "tsi":
      return tsi(
        candles,
        num(params, "long_period", 25),
        num(params, "short_period", 13),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "ttm_squeeze":
      return ttm_squeeze(M(), num(params, "length_ttms", 20), num(params, "bb_mult_ttms", 2), num(params, "kc_mult_low_ttms", 2));
    case "ttm_trend":
      return ttm_trend(M(), num(params, "period", 5), str(params, "source_type", "sourceType", "hl2"), sequential);
    case "ui":
      return ui(candles, num(params, "period", 14), num(params, "scalar", 100), str(params, "source_type", "sourceType", "close"), sequential);
    case "ultosc":
      return ultosc(
        M(),
        num(params, "timeperiod1", 7),
        num(params, "timeperiod2", 14),
        num(params, "timeperiod3", 28),
        sequential,
      );
    case "var":
      return varianceIndicator(
        candles,
        num(params, "period", 14),
        num(params, "nbdev", 1),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "vidya":
      return vidya(
        candles,
        num(params, "length", 9),
        boolOr(params, "fix_cmo", true),
        boolOr(params, "select", true),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "vlma":
      return vlma(
        candles,
        num(params, "min_period", 5),
        num(params, "max_period", 50),
        num(params, "matype", 0),
        num(params, "devtype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "vosc":
      return vosc(M(), num(params, "short_period", 2), num(params, "long_period", 5), sequential);
    case "voss":
      return voss(
        candles,
        num(params, "period", 20),
        num(params, "predict", 3),
        num(params, "bandwith", 0.25),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "vpci":
      return vpci(M(), num(params, "short_range", 5), num(params, "long_range", 25), sequential);
    case "vpwma":
      return vpwma(
        candles,
        num(params, "period", 14),
        num(params, "power", 0.382),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    case "vwmacd":
      return vwmacd(M(), num(params, "fast_period", 12), num(params, "slow_period", 26), num(params, "signal_period", 9), sequential);
    case "wad":
      return wad(M(), sequential);
    case "waddah_attr_explosion":
      return waddah_attr_explosion(
        candles,
        num(params, "sensitivity", 150),
        num(params, "fast_length", 20),
        num(params, "slow_length", 40),
        num(params, "channel_length", 20),
        num(params, "mult", 2),
        str(params, "source_type", "sourceType", "close"),
      );
    case "zscore":
      return zscore(
        candles,
        num(params, "period", 14),
        num(params, "matype", 0),
        num(params, "nbdev", 1),
        num(params, "devtype", 0),
        str(params, "source_type", "sourceType", "close"),
        sequential,
      );
    default:
      throw new Error(`Unhandled implemented id "${id}"`);
  }
}
