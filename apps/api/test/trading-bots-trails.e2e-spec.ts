import "reflect-metadata";
import { Controller, Get, INestApplication, Param, Req } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TradingBotStatus } from "@shredder/db";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TradingBotsService } from "../src/trading-bots/trading-bots.service";
import { PrismaService } from "../src/prisma/prisma.service";

function p2021TrailTableError(table: string) {
  return {
    code: "P2021",
    meta: {
      table,
    },
  };
}

describe("Trading bot trails endpoint (e2e)", () => {
  let app: INestApplication;
  let botsService: TradingBotsService;
  const prisma = {
    tradingBot: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
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
  };

  @Controller("trading-bots")
  class TestTradingBotsController {
    @Get(":id/trails")
    trails(@Req() req: { user?: { userId: string } }, @Param("id") id: string) {
      return botsService.trailsForUser(req.user?.userId ?? "", id);
    }
  }

  beforeEach(async () => {
    prisma.tradingBotCandle.findMany.mockReset();
    prisma.tradingBotPaperTrade.findMany.mockReset();
    prisma.tradingBotCandle.findMany.mockRejectedValue(p2021TrailTableError("public.trading_bot_candles"));
    prisma.tradingBotPaperTrade.findMany.mockResolvedValue([]);
    botsService = new TradingBotsService(prisma as never, {} as never);
    await botsService.onModuleInit();

    const moduleRef = await Test.createTestingModule({
      controllers: [TestTradingBotsController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
      (req as { user?: { userId: string; email: string } }).user = {
        userId: "user-1",
        email: "user@example.com",
      };
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 200 with empty trails instead of 500", async () => {
    await request(app.getHttpServer())
      .get("/trading-bots/bot-1/trails")
      .set("Authorization", "Bearer test-token")
      .expect(200)
      .expect({ marketTrail: [], paperTrail: [] });
  });

  it("returns persisted paper trail metrics for results calculations", async () => {
    prisma.tradingBotCandle.findMany.mockResolvedValue([
      {
        timestamp: BigInt(1_774_567_140_000),
        open: "68700.1",
        high: "68820.8",
        low: "68650.4",
        close: "68790.5",
        volume: "1234.56",
      },
    ]);
    prisma.tradingBotPaperTrade.findMany.mockResolvedValue([
      {
        kind: "buy",
        timestamp: BigInt(1_774_567_140_000),
        price: "68790.5",
        quantity: "0.14537",
        fee: "9.99",
        feeRate: "0.001",
        tradeValue: "9990",
        cashAfter: "0.01",
        positionQtyAfter: "0.14537",
        equityAfter: "9990.01",
      },
    ]);

    await request(app.getHttpServer())
      .get("/trading-bots/bot-1/trails")
      .set("Authorization", "Bearer test-token")
      .expect(200)
      .expect({
        marketTrail: [
          {
            timestamp: 1_774_567_140_000,
            open: 68700.1,
            high: 68820.8,
            low: 68650.4,
            close: 68790.5,
            volume: 1234.56,
          },
        ],
        paperTrail: [
          {
            kind: "buy",
            timestamp: 1_774_567_140_000,
            price: 68790.5,
            quantity: 0.14537,
            fee: 9.99,
            feeRate: 0.001,
            tradeValue: 9990,
            cashAfter: 0.01,
            positionQtyAfter: 0.14537,
            equityAfter: 9990.01,
          },
        ],
      });
  });
});
