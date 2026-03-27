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

  @Controller("trading-bots")
  class TestTradingBotsController {
    @Get(":id/trails")
    trails(@Req() req: { user?: { userId: string } }, @Param("id") id: string) {
      return botsService.trailsForUser(req.user?.userId ?? "", id);
    }
  }

  beforeEach(async () => {
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

    botsService = new TradingBotsService(prisma as any, {} as any);
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
});
