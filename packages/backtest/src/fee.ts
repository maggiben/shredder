import type { BacktestParams } from "./engine.js";

/** Effective taker fee rate at a bar (fraction of quote notional per leg). */
export function effectiveTakerRate(params: BacktestParams, timestampMs: number): number {
  const resolved = params.fee?.resolveTakerFeeRate?.(timestampMs);
  if (resolved !== undefined) {
    return resolved;
  }
  return params.fee?.takerRate ?? 0;
}
