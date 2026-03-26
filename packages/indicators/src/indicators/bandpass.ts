/**
 * BandPass Filter
 *
 * :param candles: np.ndarray
 * :param period: int - default: 20
 * :param bandwidth: float - default: 0.3
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: BandPass(bp, bp_normalized, signal, trigger)
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { highPass1Fast } from "../np/ehlers.js";

export type BandPass = {
  bp: number | Float64Array;
  bp_normalized: number | Float64Array;
  signal: number | Float64Array;
  trigger: number | Float64Array;
};

function bpFast(source: Float64Array, hp: Float64Array, alpha: number, beta: number): { bp: Float64Array; peak: Float64Array } {
  const n = source.length;
  const bp = hp.slice();
  for (let i = 2; i < n; i += 1) {
    bp[i] =
      0.5 * (1 - alpha) * hp[i]! -
      (1 - alpha) * 0.5 * hp[i - 2]! +
      beta * (1 + alpha) * bp[i - 1]! -
      alpha * bp[i - 2]!;
  }
  const K = 0.991;
  const peak = bp.slice();
  for (let i = 0; i < n; i += 1) {
    if (i > 0) {
      peak[i] = peak[i - 1]! * K;
    }
    if (Math.abs(bp[i]!) > peak[i]!) {
      peak[i] = Math.abs(bp[i]!);
    }
  }
  return { bp, peak };
}

export function bandpass(
  candles: IndicatorCandles,
  period: number = 20,
  bandwidth: number = 0.3,
  sourceType: string = "close",
  sequential: boolean = false,
): BandPass {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const hp = highPass1Fast(source, (4 * period) / bandwidth);
  const beta = Math.cos((2 * Math.PI) / period);
  const gamma = Math.cos((2 * Math.PI * bandwidth) / period);
  const alpha = 1 / gamma - Math.sqrt(1 / gamma ** 2 - 1);
  const { bp, peak } = bpFast(source, hp, alpha, beta);
  const n = source.length;
  const bpNormalized = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    bpNormalized[i] = peak[i]! !== 0 ? bp[i]! / peak[i]! : Number.NaN;
  }
  const trigger = highPass1Fast(bpNormalized, period / bandwidth / 1.5);
  const signal = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const lt = bpNormalized[i]! < trigger[i]! ? 1 : 0;
    const gt = trigger[i]! < bpNormalized[i]! ? 1 : 0;
    signal[i] = lt - gt;
  }
  if (sequential) {
    return { bp, bp_normalized: bpNormalized, signal, trigger };
  }
  const li = n - 1;
  return {
    bp: bp[li]!,
    bp_normalized: bpNormalized[li]!,
    signal: signal[li]!,
    trigger: trigger[li]!,
  };
}
