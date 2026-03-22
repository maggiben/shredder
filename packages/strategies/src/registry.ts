import type { Strategy } from "./strategy.js";
import { AdxTrendStrategy } from "./adx-trend.js";
import { BollingerMeanReversionStrategy } from "./bollinger-mean-reversion.js";
import { MacdMomentumStrategy } from "./macd-momentum.js";
import { MovingAverageCrossoverStrategy } from "./moving-average-crossover.js";
import { RsiReversionStrategy } from "./rsi-reversion.js";

/** Default parameters per strategy id (tune via config later). */
export const defaultStrategyFactories: Record<string, () => Strategy> = {
  "ma-crossover": () => new MovingAverageCrossoverStrategy(5, 20),
  "rsi-reversion": () => new RsiReversionStrategy(14, 30, 70),
  "macd-momentum": () => new MacdMomentumStrategy(12, 26, 9),
  "bollinger-mean-reversion": () => new BollingerMeanReversionStrategy(20, 2),
  "adx-trend": () => new AdxTrendStrategy(14, 25),
};

export function createStrategyById(id: string): Strategy | undefined {
  const factory = defaultStrategyFactories[id];
  return factory ? factory() : undefined;
}

export function getDefaultStrategyRegistry(): Map<string, Strategy> {
  return new Map(
    Object.entries(defaultStrategyFactories).map(([key, factory]) => [key, factory()]),
  );
}

export function listRegisteredStrategyIds(): string[] {
  return Object.keys(defaultStrategyFactories);
}
