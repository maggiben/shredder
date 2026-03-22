import { z } from "zod";

export const strategyIdSchema = z.enum([
  "ma-crossover",
  "rsi-reversion",
  "macd-momentum",
  "bollinger-mean-reversion",
  "adx-trend",
]);

export const shredderConfigSchema = z.object({
  portfolio: z.record(z.string(), z.number().min(0).max(1)),
  strategies: z.array(strategyIdSchema).min(1),
  risk: z
    .object({
      maxNotionalFractionPerTrade: z.number().min(0).max(1),
      maxDrawdownFraction: z.number().min(0).max(1),
      minEquity: z.number().optional(),
    })
    .strict(),
});

export type ShredderConfig = z.infer<typeof shredderConfigSchema>;

export function parseShredderConfig(raw: unknown): ShredderConfig {
  return shredderConfigSchema.parse(raw);
}
