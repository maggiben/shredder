import type { Candle } from "./candle.js";
import type { PortfolioState } from "./portfolio.js";

/** Snapshot of computed indicators for the evaluation bar (deterministic inputs). */
export interface IndicatorSet {
  readonly smaShort?: number;
  readonly smaLong?: number;
  readonly smaShortPrev?: number;
  readonly smaLongPrev?: number;
  readonly rsi?: number;
  readonly macd?: {
    readonly line: number;
    readonly signal: number;
    readonly histogram: number;
  };
  readonly macdPrev?: {
    readonly line: number;
    readonly signal: number;
    readonly histogram: number;
  };
  readonly bollinger?: {
    readonly upper: number;
    readonly middle: number;
    readonly lower: number;
  };
  readonly adx?: number;
}

export interface StrategyInput {
  readonly symbol: string;
  readonly candles: readonly Candle[];
  readonly indicators: IndicatorSet;
  readonly portfolio: PortfolioState;
}

export type StrategyAction = "BUY" | "SELL" | "HOLD";

export interface StrategySignal {
  readonly action: StrategyAction;
  /** 0..1 confidence for downstream aggregation */
  readonly confidence: number;
  readonly reason: string;
}
