import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { TradesService } from "./trades.service";

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller("trades")
@UseGuards(AuthGuard("jwt"))
export class TradesController {
  constructor(private readonly trades: TradesService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.trades.listForUser(req.user.userId);
  }
}
