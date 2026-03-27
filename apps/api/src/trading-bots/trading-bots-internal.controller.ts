import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { TickWebhookDto } from "./dto/tick-webhook.dto";
import { TradingBotWebhookGuard } from "./trading-bot-webhook.guard";
import { TradingBotsService } from "./trading-bots.service";

@Controller("trading-bots/internal")
export class TradingBotsInternalController {
  constructor(private readonly bots: TradingBotsService) {}

  @Post("tick")
  @UseGuards(TradingBotWebhookGuard)
  async tick(@Body() body: TickWebhookDto) {
    await this.bots.handleTickReport(body.botId, body.payload);
    return { ok: true as const };
  }
}
