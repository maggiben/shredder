import { Inject, Injectable, Optional } from "@nestjs/common";
import type { Exchange } from "@shredder/exchanges";
import { BINANCE_EXCHANGE } from "../exchanges/exchange.tokens";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(BINANCE_EXCHANGE) private readonly exchange: Exchange | null,
  ) {}

  async snapshot(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { order: { userId } },
      orderBy: { executedAt: "asc" },
    });

    const qtyBySymbol = new Map<string, number>();
    let cashFlow = 0;
    for (const t of trades) {
      const q = Number(t.quantity);
      const px = Number(t.price);
      const signed = t.side === "BUY" ? q : -q;
      qtyBySymbol.set(t.symbol, (qtyBySymbol.get(t.symbol) ?? 0) + signed);
      if (t.side === "BUY") {
        cashFlow -= q * px;
      } else {
        cashFlow += q * px;
      }
    }

    const positions = [...qtyBySymbol.entries()]
      .filter(([, q]) => Math.abs(q) > 1e-12)
      .map(([symbol, quantity]) => ({ symbol, quantity }));

    const lastTrades = await this.prisma.trade.findMany({
      where: { order: { userId } },
      orderBy: { executedAt: "desc" },
      take: 25,
    });

    let exchangeBalances: Array<{ asset: string; free: number; locked: number }> | undefined;
    let exchangeBalancesError: string | undefined;
    if (this.exchange) {
      try {
        const bal = await this.exchange.getBalance();
        exchangeBalances = bal.assets
          .filter((a) => a.free > 1e-12 || a.locked > 1e-12)
          .map((a) => ({ asset: a.asset, free: a.free, locked: a.locked }));
      } catch (err: unknown) {
        exchangeBalancesError = err instanceof Error ? err.message : String(err);
      }
    }

    return {
      positions,
      realizedCashFlowApprox: cashFlow,
      tradeCount: trades.length,
      recentTrades: lastTrades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity.toString(),
        price: t.price.toString(),
        executedAt: t.executedAt.toISOString(),
      })),
      ...(exchangeBalances !== undefined ? { exchangeBalances } : {}),
      ...(exchangeBalancesError !== undefined ? { exchangeBalancesError } : {}),
    };
  }
}
