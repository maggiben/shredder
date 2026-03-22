import { Module } from "@nestjs/common";
import { TradingStrategiesController } from "./trading-strategies.controller";

@Module({
  controllers: [TradingStrategiesController],
})
export class TradingStrategiesModule {}
