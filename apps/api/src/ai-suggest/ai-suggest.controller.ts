import { Body, Controller, Post, ServiceUnavailableException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SuggestDto } from "./dto/suggest.dto";

@Controller("ai")
@UseGuards(AuthGuard("jwt"))
export class AiSuggestController {
  @Post("suggest")
  async suggest(@Body() dto: SuggestDto): Promise<{ reply: string }> {
    const key = process.env["OPENAI_API_KEY"];
    if (!key) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is not configured");
    }
    const { createOpenAIClient, runSuggestOnlyAgentChat } = await import("@shredder/ai");
    const openai = createOpenAIClient(key);
    const reply = await runSuggestOnlyAgentChat(openai, dto.message);
    return { reply };
  }
}
