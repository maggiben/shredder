import type { Order, OrderResult } from "@shredder/core";

export interface BalanceAsset {
  readonly asset: string;
  readonly free: number;
  readonly locked: number;
}

export interface Balance {
  readonly assets: readonly BalanceAsset[];
}

export interface Exchange {
  getBalance(): Promise<Balance>;
  placeOrder(order: Order): Promise<OrderResult>;
}
