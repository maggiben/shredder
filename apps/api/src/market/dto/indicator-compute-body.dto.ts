import { Type } from "class-transformer";
import { IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, Min, MaxLength, MinLength } from "class-validator";
import { BINANCE_KLINE_INTERVALS } from "./klines-query.dto";

export class IndicatorComputeBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  indicatorId!: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  @Type(() => String)
  @IsString()
  @Matches(/^[A-Z0-9]{4,32}$/)
  symbol!: string;

  @IsIn([...BINANCE_KLINE_INTERVALS])
  interval!: (typeof BINANCE_KLINE_INTERVALS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(1000)
  limit?: number;

  /**
   * Optional time bounds (ms since epoch) for narrowing the output window.
   * When provided, the API will fetch extra warmup candles *before* `startTime`
   * (as available) to avoid leading NaNs/nulls in sequential results.
   */
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
}
