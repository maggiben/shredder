import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BinanceAdapter, type Exchange } from "@shredder/exchanges";
import { BINANCE_EXCHANGE } from "./exchange.tokens";

@Global()
@Module({
  providers: [
    {
      provide: BINANCE_EXCHANGE,
      useFactory: (config: ConfigService): Exchange | null => {
        const apiKey = config.get<string>("BINANCE_API_KEY")?.trim();
        const apiSecret = config.get<string>("BINANCE_API_SECRET")?.trim();
        if (!apiKey || !apiSecret) {
          return null;
        }
        const baseUrl = config.get<string>("BINANCE_BASE_URL")?.trim();
        return new BinanceAdapter({
          apiKey,
          apiSecret,
          ...(baseUrl ? { baseUrl } : {}),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [BINANCE_EXCHANGE],
})
export class ExchangesModule {}
