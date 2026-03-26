export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";

export type OrderRow = {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: string;
  limitPrice?: string;
  status: string;
  clientOrderId?: string;
  exchangeOrderId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type TradeRow = {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: string;
  price: string;
  fee?: string; // quote fee, decimal string
  executedAt: string; // ISO
};

export type PortfolioPosition = {
  symbol: string;
  quantity: number;
};

export type RecentTrade = {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: string;
  price: string;
  fee?: string; // quote fee, decimal string
  executedAt: string; // ISO
};

export type PortfolioSnapshot = {
  positions: PortfolioPosition[];
  realizedCashFlowApprox: number;
  feesPaidQuote: number;
  tradeCount: number;
  recentTrades: RecentTrade[];
  // Optional exchange exposure if BINANCE keys are configured.
  exchangeBalances?: Array<{ asset: string; free: number; locked: number }>;
  exchangeBalancesError?: string;
};

export type StrategyRow = {
  id: string;
  deterministic: boolean;
  toolSurface: string;
};

