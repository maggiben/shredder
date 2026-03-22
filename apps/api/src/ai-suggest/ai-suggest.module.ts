import { Module } from "@nestjs/common";
import { AiSuggestController } from "./ai-suggest.controller";

@Module({
  controllers: [AiSuggestController],
})
export class AiSuggestModule {}
