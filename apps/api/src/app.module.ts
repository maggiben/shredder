import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { apiEnvFilePaths } from "./env-paths";
import { AiSuggestModule } from "./ai-suggest/ai-suggest.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { ExchangesModule } from "./exchanges/exchanges.module";
import { OrdersModule } from "./orders/orders.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TradingStrategiesModule } from "./trading-strategies/trading-strategies.module";
import { TradesModule } from "./trades/trades.module";
import { MarketModule } from "./market/market.module";
import { TradingBotsModule } from "./trading-bots/trading-bots.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: apiEnvFilePaths(),
    }),
    ExchangesModule,
    BullModule.forRoot({
      connection: {
        host: process.env["REDIS_HOST"] ?? "127.0.0.1",
        port: parseInt(process.env["REDIS_PORT"] ?? "6379", 10),
      },
    }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    TradesModule,
    MarketModule,
    PortfolioModule,
    TradingStrategiesModule,
    AiSuggestModule,
    TradingBotsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
