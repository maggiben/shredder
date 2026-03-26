import type { Order, OrderFillCommission, OrderResult, OrderStatus } from "@shredder/core";
import type { Balance, BalanceAsset, Exchange, TradeFeeRates } from "./exchange.js";
import { commissionQuoteFromBinanceFills } from "./binance-fills.js";
import { resolveBinanceSpotBaseUrl } from "./binance-defaults.js";
import { signQuery } from "./binance-signing.js";

export interface BinanceAdapterConfig {
  /**
   * Binance API key (HTTP header `X-MBX-APIKEY`). This package does **not** read credentials
   * from the environment; the app or worker that constructs `BinanceAdapter` should load a
   * secret store / env var (for example `BINANCE_API_KEY`) and pass the value here.
   */
  readonly apiKey: string;
  /** HMAC SHA256 secret for signing query strings. Never log this value. */
  readonly apiSecret: string;
  /**
   * REST base URL. When omitted, uses `resolveBinanceSpotBaseUrl()` (testnet by default;
   * override with `BINANCE_BASE_URL` or `BINANCE_USE_MAINNET`).
   */
  readonly baseUrl?: string;
  readonly recvWindow?: number;
}

interface BinanceAccountResponse {
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

interface BinanceOrderResponse {
  orderId: number;
  symbol: string;
  status: string;
  executedQty: string;
  cummulativeQuoteQty?: string;
  fills?: Array<{
    price: string;
    qty: string;
    commission?: string;
    commissionAsset?: string;
  }>;
}

export class BinanceAdapter implements Exchange {
  private readonly baseUrl: string;
  private readonly recvWindow: number;

  constructor(private readonly config: BinanceAdapterConfig) {
    this.baseUrl = resolveBinanceSpotBaseUrl(config.baseUrl);
    this.recvWindow = config.recvWindow ?? 5000;
  }

  async getBalance(): Promise<Balance> {
    const params = this.signedParams({});
    const url = `${this.baseUrl}/api/v3/account?${params}`;
    const res = await fetch(url, {
      headers: { "X-MBX-APIKEY": this.config.apiKey },
    });
    if (!res.ok) {
      throw new Error(`Binance getBalance failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as BinanceAccountResponse;
    const assets: BalanceAsset[] = data.balances.map((b) => ({
      asset: b.asset,
      free: Number(b.free),
      locked: Number(b.locked),
    }));
    return { assets };
  }

  async placeOrder(order: Order): Promise<OrderResult> {
    const side = order.side === "BUY" ? "BUY" : "SELL";
    const type = order.type === "MARKET" ? "MARKET" : "LIMIT";
    const body: Record<string, string> = {
      symbol: order.symbol.replace("/", "").toUpperCase(),
      side,
      type,
      quantity: String(order.quantity),
      newClientOrderId: order.clientOrderId ?? order.id,
    };
    if (type === "LIMIT") {
      if (order.limitPrice === undefined) {
        throw new Error("LIMIT order requires limitPrice");
      }
      body.timeInForce = "GTC";
      body.price = String(order.limitPrice);
    }
    const params = this.signedParams(body);
    const url = `${this.baseUrl}/api/v3/order`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-MBX-APIKEY": this.config.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) {
      throw new Error(`Binance placeOrder failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as BinanceOrderResponse;
    const averageFillPrice = averagePriceFromFills(data);
    const comm = commissionQuoteFromBinanceFills(order.symbol, data.fills);
    const commissionDetails: OrderFillCommission[] | undefined =
      comm.details.length > 0 ? comm.details.map((d) => ({ asset: d.asset, amount: d.amount })) : undefined;
    const result: OrderResult = {
      orderId: String(data.orderId),
      symbol: order.symbol,
      status: mapBinanceStatus(data.status),
      filledQuantity: Number(data.executedQty),
      ...(comm.totalQuote > 0 ? { commissionQuote: comm.totalQuote } : {}),
      ...(commissionDetails !== undefined ? { commissionDetails } : {}),
    };
    if (averageFillPrice !== undefined) {
      return { ...result, averageFillPrice };
    }
    return result;
  }

  /**
   * Resolves maker/taker fee **rates** (e.g. 0.001 = 0.1%) for a symbol.
   * Uses Spot `GET /api/v3/account/commission` so the same base URL works on testnet;
   * `/sapi/v1/asset/tradeFee` is not available on Spot Testnet (404).
   */
  async getTradeFee(symbol: string): Promise<TradeFeeRates> {
    const sym = symbol.replace("/", "").toUpperCase();
    const params = this.signedParams({ symbol: sym });
    const url = `${this.baseUrl}/api/v3/account/commission?${params}`;
    const res = await fetch(url, {
      headers: { "X-MBX-APIKEY": this.config.apiKey },
    });
    if (!res.ok) {
      throw new Error(`Binance getTradeFee failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      symbol: string;
      standardCommission?: { maker: string; taker: string };
    };
    const std = data.standardCommission;
    console.log("getTradeFee", JSON.stringify(data, null, 2));
    if (!std) {
      throw new Error("Binance getTradeFee: missing standardCommission");
    }
    return {
      symbol: data.symbol ?? sym,
      makerRate: Number(std.maker),
      takerRate: Number(std.taker),
    };
  }

  private signedParams(query: Record<string, string>): string {
    const timestamp = Date.now();
    const entries: [string, string][] = [
      ...Object.entries(query),
      ["timestamp", String(timestamp)],
      ["recvWindow", String(this.recvWindow)],
    ];
    const qs = new URLSearchParams(entries).toString();
    const signature = signQuery(this.config.apiSecret, qs);
    return `${qs}&signature=${signature}`;
  }
}

function mapBinanceStatus(status: string): OrderStatus {
  switch (status) {
    case "NEW":
      return "NEW";
    case "PARTIALLY_FILLED":
      return "PARTIALLY_FILLED";
    case "FILLED":
      return "FILLED";
    case "CANCELED":
    case "EXPIRED":
    case "EXPIRED_IN_MATCH":
      return "CANCELED";
    case "REJECTED":
      return "REJECTED";
    default:
      return "NEW";
  }
}

function averagePriceFromFills(data: BinanceOrderResponse): number | undefined {
  if (data.fills && data.fills.length > 0) {
    let qty = 0;
    let notional = 0;
    for (const f of data.fills) {
      const q = Number(f.qty);
      const p = Number(f.price);
      qty += q;
      notional += q * p;
    }
    if (qty > 0) {
      return notional / qty;
    }
  }
  const q = Number(data.executedQty);
  const quote = data.cummulativeQuoteQty;
  if (q > 0 && quote !== undefined) {
    return Number(quote) / q;
  }
  return undefined;
}
