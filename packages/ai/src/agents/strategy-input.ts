import type { Candle, PortfolioState, StrategyInput } from "@shredder/core";

/** Builds OHLC candles from close-only series for deterministic strategy evaluation in tools. */
export function strategyInputFromCloses(
  symbol: string,
  closes: readonly number[],
  portfolio: PortfolioState,
): StrategyInput {
  const candles: Candle[] = closes.map((close, i) => ({
    timestamp: i * 60_000,
    open: close,
    high: close * 1.0005,
    low: close * 0.9995,
    close,
    volume: 1000,
  }));
  return {
    symbol,
    candles,
    indicators: {},
    portfolio,
  };
}
