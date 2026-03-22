import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export const BINANCE_KLINE_INTERVALS = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
] as const;

export type BinanceKlineInterval = (typeof BINANCE_KLINE_INTERVALS)[number];

export class KlinesQueryDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z0-9]{4,32}$/)
  symbol!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === "") {
      return "1h";
    }
    return typeof value === "string" ? value.trim() : value;
  })
  @IsIn([...BINANCE_KLINE_INTERVALS])
  interval!: BinanceKlineInterval;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === "") {
      return 240;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 240;
  })
  @IsInt()
  @Min(1)
  @Max(1000)
  limit!: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === "" ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  startTime?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === "" ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  endTime?: number;
}
