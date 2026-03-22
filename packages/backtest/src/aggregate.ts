import type { StrategySignal } from "@shredder/core";

/** Majority vote weighted by confidence; ties favor HOLD. */
export function aggregateSignals(signals: readonly StrategySignal[]): StrategySignal {
  if (signals.length === 0) {
    return { action: "HOLD", confidence: 0, reason: "No strategies" };
  }
  let buy = 0;
  let sell = 0;
  let hold = 0;
  for (const s of signals) {
    if (s.action === "BUY") {
      buy += s.confidence;
    } else if (s.action === "SELL") {
      sell += s.confidence;
    } else {
      hold += s.confidence;
    }
  }
  if (buy > sell && buy > hold) {
    return {
      action: "BUY",
      confidence: Math.min(1, buy / signals.length),
      reason: `Aggregated BUY score ${buy.toFixed(3)}`,
    };
  }
  if (sell > buy && sell > hold) {
    return {
      action: "SELL",
      confidence: Math.min(1, sell / signals.length),
      reason: `Aggregated SELL score ${sell.toFixed(3)}`,
    };
  }
  const parts = `buy=${buy.toFixed(3)} sell=${sell.toFixed(3)} hold=${hold.toFixed(3)}`;
  if (buy === 0 && sell === 0 && hold === 0) {
    return {
      action: "HOLD",
      confidence: 0,
      reason: `No actionable scores (${parts}); strategies lack data or zero-confidence HOLD`,
    };
  }
  return {
    action: "HOLD",
    confidence: 0.3,
    reason: `No BUY/SELL majority vs HOLD (${parts})`,
  };
}
