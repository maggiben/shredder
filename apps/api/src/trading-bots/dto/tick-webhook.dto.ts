import { IsObject, IsString } from "class-validator";
import type { TradingBotTickPayload } from "../trading-bot-tick-payload";

export class TickWebhookDto {
  @IsString()
  botId!: string;

  @IsObject()
  payload!: TradingBotTickPayload;
}
