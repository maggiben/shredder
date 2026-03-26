export type OrderSide = "BUY" | "SELL";

export type OrderType = "MARKET" | "LIMIT";

export type OrderStatus =
  | "NEW"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELED"
  | "REJECTED";

export interface Order {
  readonly id: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  /** Required when type is LIMIT */
  readonly limitPrice?: number;
  readonly clientOrderId?: string;
}

export interface OrderFillCommission {
  readonly asset: string;
  readonly amount: number;
}

export interface OrderResult {
  readonly orderId: string;
  readonly symbol: string;
  readonly status: OrderStatus;
  readonly filledQuantity: number;
  readonly averageFillPrice?: number;
  /** Total commission expressed in the pair's quote currency (approximate if paid in base or other asset). */
  readonly commissionQuote?: number;
  /** Raw per-fill commission amounts from the exchange. */
  readonly commissionDetails?: readonly OrderFillCommission[];
}
