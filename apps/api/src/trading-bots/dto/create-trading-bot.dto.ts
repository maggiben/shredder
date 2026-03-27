import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

const MARKET_PROVIDERS = ["demo", "coingecko", "binance"] as const;
const EXCHANGE_IDS = ["binance", "none"] as const;

export class CreateTradingBotDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1_000)
  @Max(3_600_000)
  tickMs?: number;

  @IsOptional()
  @IsString()
  candleInterval?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(2_000)
  candleLimit?: number;

  @IsOptional()
  @IsIn(MARKET_PROVIDERS)
  marketDataProvider?: (typeof MARKET_PROVIDERS)[number];

  @IsOptional()
  @IsIn(EXCHANGE_IDS)
  exchangeId?: (typeof EXCHANGE_IDS)[number];

  @IsOptional()
  @IsBoolean()
  paperTrading?: boolean;

  @IsOptional()
  @IsString()
  binanceBaseUrl?: string;

  @IsOptional()
  @IsBoolean()
  logStrategies?: boolean;

  @IsOptional()
  @IsBoolean()
  aiAnalyst?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.5)
  estimatedTakerFeeRate?: number;

  @IsOptional()
  @IsObject()
  extraEnv?: Record<string, string>;
}
