import type { PortfolioState } from "@shredder/core";

export function portfolioState(
  cash: number,
  qty: number,
  mark: number,
  symbol: string,
): PortfolioState {
  if (qty === 0) {
    return { cash, positions: [] };
  }
  return {
    cash,
    positions: [{ symbol, quantity: qty, averageEntryPrice: mark }],
    equity: cash + qty * mark,
  };
}
