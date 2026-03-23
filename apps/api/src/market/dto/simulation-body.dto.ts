import { Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min } from "class-validator";
import { BINANCE_KLINE_INTERVALS } from "./klines-query.dto";

export class SimulationBodyDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z0-9]{4,32}$/)
  symbol!: string;

  @IsIn([...BINANCE_KLINE_INTERVALS])
  interval!: (typeof BINANCE_KLINE_INTERVALS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  endTime?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1e-8)
  initialCash!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(1)
  deployFraction!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  warmupBars!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(1)
  maxNotionalFractionPerTrade!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(1)
  maxDrawdownFraction!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  strategyIds!: string[];
}
