import { TradingBotStatus } from "@shredder/db";
import { describe, expect, it, vi } from "vitest";
import { TradingBotsService } from "./trading-bots.service";
import type { TradingBotTickPayload } from "./trading-bot-tick-payload";

function p2021TrailTableError(table: string) {
  return {
    code: "P2021",
    meta: {
      table,
    },
  };
}

describe("TradingBotsService", () => {
  it("returns empty trails when trail tables are missing", async () => {
    const prisma = {
      tradingBot: {
        findFirst: vi.fn().mockResolvedValue({
          id: "bot-1",
          userId: "user-1",
          name: "Bot",
          status: TradingBotStatus.STOPPED,
          config: {},
        }),
      },
      tradingBotCandle: {
        findMany: vi.fn().mockRejectedValue(p2021TrailTableError("public.trading_bot_candles")),
      },
      tradingBotPaperTrade: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new TradingBotsService(
      prisma,
      {
        get: vi.fn().mockReturnValue(undefined),
      } as any,
    );
    const result = await service.trailsForUser("user-1", "bot-1");

    expect(result).toEqual({ marketTrail: [], paperTrail: [] });
  });

  it("keeps tick updates alive when trail tables are missing", async () => {
    const prisma = {
      tradingBot: {
        findUnique: vi.fn().mockResolvedValue({ id: "bot-1" }),
        update: vi.fn().mockResolvedValue(undefined),
      },
      $transaction: vi
        .fn()
        .mockRejectedValue(p2021TrailTableError("public.trading_bot_paper_trades")),
    } as any;

    const service = new TradingBotsService(
      prisma,
      {
        get: vi.fn().mockReturnValue(undefined),
      } as any,
    );
    const payload: TradingBotTickPayload = {
      t: new Date().toISOString(),
      exchangeId: "binance",
      paperTrading: true,
      symbol: "BTCUSDT",
      candleCount: 0,
      aggregated: {},
      risk: {},
      marketDataProvider: "coingecko",
      candleInterval: "15m",
      candleLimit: 50,
      candles: [],
    };

    await expect(service.handleTickReport("bot-1", payload)).resolves.toBeUndefined();
    expect(prisma.tradingBot.update).toHaveBeenCalledTimes(1);
  });

  it("persists distinct candle OHLC values from tick payload", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      tradingBot: {
        update: vi.fn().mockResolvedValue(undefined),
      },
      tradingBotCandle: {
        createMany,
      },
      tradingBotPaperTrade: {
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      tradingBot: {
        findUnique: vi.fn().mockResolvedValue({ id: "bot-1" }),
      },
      $transaction: vi.fn(async (cb: (innerTx: typeof tx) => Promise<void>) => cb(tx)),
      tradingBotCandle: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      tradingBotPaperTrade: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new TradingBotsService(
      prisma,
      {
        get: vi.fn().mockReturnValue(undefined),
      } as any,
    );
    const payload: TradingBotTickPayload = {
      t: new Date().toISOString(),
      exchangeId: "binance",
      paperTrading: true,
      symbol: "BTCUSDT",
      candleCount: 1,
      aggregated: {},
      risk: {},
      marketDataProvider: "binance",
      candleInterval: "5m",
      candleLimit: 50,
      candles: [
        {
          timestamp: 1_774_567_140_000,
          open: 68_700.1,
          high: 68_820.8,
          low: 68_650.4,
          close: 68_790.5,
          volume: 1234.56,
        },
      ],
    };

    await expect(service.handleTickReport("bot-1", payload)).resolves.toBeUndefined();

    const args = createMany.mock.calls[0]?.[0];
    expect(args).toBeTruthy();
    expect(args.data).toHaveLength(1);
    expect(args.data[0].open.toString()).toBe("68700.1");
    expect(args.data[0].high.toString()).toBe("68820.8");
    expect(args.data[0].low.toString()).toBe("68650.4");
    expect(args.data[0].close.toString()).toBe("68790.5");
  });
});
