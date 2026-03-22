import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { PortfolioService } from "./portfolio.service";

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller("portfolio")
@UseGuards(AuthGuard("jwt"))
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  get(@Req() req: AuthedRequest) {
    return this.portfolio.snapshot(req.user.userId);
  }
}
