import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateOrderDto {
  @IsString()
  symbol!: string;

  @IsIn(["BUY", "SELL"])
  side!: string;

  @IsIn(["MARKET", "LIMIT"])
  type!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1e-12)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limitPrice?: number;

  @IsOptional()
  @IsString()
  clientOrderId?: string;
}
