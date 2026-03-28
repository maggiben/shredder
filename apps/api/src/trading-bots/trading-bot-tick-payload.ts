export type TradingBotTickCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TradingBotTickPaperEvent = {
  kind: "buy" | "sell";
  timestamp: number;
  price: number;
  quantity: number;
  fee: number;
  feeRate: number;
  tradeValue: number;
  cashAfter: number;
  positionQtyAfter: number;
  equityAfter: number;
};

export type TradingBotTickPayload = {
  t: string;
  botId?: string;
  exchangeId: string;
  paperTrading: boolean;
  symbol: string;
  candleCount: number;
  aggregated: object;
  risk: object;
  marketDataProvider: string;
  candleInterval: string;
  candleLimit: number;
  candles: TradingBotTickCandle[];
  paperTradeEvent?: TradingBotTickPaperEvent;
  strategies?: Array<{ id: string; action: string; confidence: number; reason: string }>;
  ai?: { analyst?: string; skipped?: string };
  demoScenario?: string;
};
