import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { CreateTradingBotDto } from "./dto/create-trading-bot.dto";
import { UpdateTradingBotDto } from "./dto/update-trading-bot.dto";
import { TradingBotsService } from "./trading-bots.service";

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller("trading-bots")
@UseGuards(AuthGuard("jwt"))
export class TradingBotsController {
  constructor(private readonly bots: TradingBotsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.bots.listForUser(req.user.userId);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateTradingBotDto) {
    return this.bots.createForUser(req.user.userId, dto);
  }

  @Get(":id/logs")
  logs(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.bots.logsForUser(req.user.userId, id);
  }

  @Get(":id/trails")
  trails(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.bots.trailsForUser(req.user.userId, id);
  }

  @Get(":id")
  getOne(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.bots.getForUser(req.user.userId, id);
  }

  @Patch(":id")
  update(@Req() req: AuthedRequest, @Param("id") id: string, @Body() dto: UpdateTradingBotDto) {
    return this.bots.updateForUser(req.user.userId, id, dto);
  }

  @Delete(":id")
  remove(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.bots.deleteForUser(req.user.userId, id);
  }

  @Post(":id/start")
  start(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.bots.startForUser(req.user.userId, id);
  }

  @Post(":id/stop")
  stop(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.bots.stopForUser(req.user.userId, id);
  }
}
