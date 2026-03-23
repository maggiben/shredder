import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { KlinesQueryDto } from "./dto/klines-query.dto";
import { SimulationBodyDto } from "./dto/simulation-body.dto";
import { MarketService } from "./market.service";

@Controller("market")
@UseGuards(AuthGuard("jwt"))
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get("klines")
  klines(@Query() query: KlinesQueryDto) {
    return this.market.getKlines({
      symbol: query.symbol,
      interval: query.interval,
      limit: query.limit,
      ...(query.startTime !== undefined ? { startTime: query.startTime } : {}),
      ...(query.endTime !== undefined ? { endTime: query.endTime } : {}),
    });
  }

  @Post("simulation")
  simulation(@Body() body: SimulationBodyDto) {
    return this.market.runSimulation(body);
  }
}
