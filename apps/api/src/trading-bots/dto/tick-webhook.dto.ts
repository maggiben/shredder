import { IsObject, IsString } from "class-validator";

export class TickWebhookDto {
  @IsString()
  botId!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
