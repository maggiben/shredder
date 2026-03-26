import type { Order, OrderResult } from "@shredder/core";

export interface BalanceAsset {
  readonly asset: string;
  readonly free: number;
  readonly locked: number;
}

export interface Balance {
  readonly assets: readonly BalanceAsset[];
}

export interface TradeFeeRates {
  readonly symbol: string;
  /** Maker fee as a fraction of traded notional (e.g. 0.001 = 0.1%). */
  readonly makerRate: number;
  /** Taker fee as a fraction of traded notional. */
  readonly takerRate: number;
}

export interface Exchange {
  getBalance(): Promise<Balance>;
  placeOrder(order: Order): Promise<OrderResult>;
  /** Current maker/taker fee schedule for the symbol (rates may change over time; call when preparing a trade). */
  getTradeFee(symbol: string): Promise<TradeFeeRates>;
}
