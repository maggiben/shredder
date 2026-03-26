import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IndicatorComputeBodyDto } from "./dto/indicator-compute-body.dto";
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

  @Get("indicators")
  indicatorsCatalog() {
    return this.market.listIndicatorsCatalog();
  }

  @Post("indicators/compute")
  indicatorsCompute(@Body() body: IndicatorComputeBodyDto) {
    return this.market.computeIndicatorFromMarket(body);
  }
}
