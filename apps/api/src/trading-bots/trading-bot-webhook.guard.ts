import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";
import type { Request } from "express";

@Injectable()
export class TradingBotWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = (req.header("x-shredder-webhook-secret") ?? "").trim();
    const expected = (
      this.config.get<string>("TRADING_BOTS_WEBHOOK_SECRET")?.trim() ??
      "development-only-shredder-bots-webhook"
    ).trim();
    const a = Buffer.from(header, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) {
      throw new UnauthorizedException("Invalid webhook secret");
    }
    if (!timingSafeEqual(a, b)) {
      throw new UnauthorizedException("Invalid webhook secret");
    }
    return true;
  }
}
