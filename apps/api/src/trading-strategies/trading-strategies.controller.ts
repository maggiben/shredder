import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { listRegisteredStrategyIds } from "@shredder/strategies";

@Controller("strategies")
@UseGuards(AuthGuard("jwt"))
export class TradingStrategiesController {
  @Get()
  list() {
    return listRegisteredStrategyIds().map((id) => ({
      id,
      deterministic: true,
      toolSurface: "evaluate_strategy / aggregate_strategy_signals",
    }));
  }
}
