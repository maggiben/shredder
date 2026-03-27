import { Module } from "@nestjs/common";
import { TradingBotWebhookGuard } from "./trading-bot-webhook.guard";
import { TradingBotsController } from "./trading-bots.controller";
import { TradingBotsInternalController } from "./trading-bots-internal.controller";
import { TradingBotsService } from "./trading-bots.service";

@Module({
  controllers: [TradingBotsController, TradingBotsInternalController],
  providers: [TradingBotsService, TradingBotWebhookGuard],
  exports: [TradingBotsService],
})
export class TradingBotsModule {}
