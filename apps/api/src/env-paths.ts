import { join } from "path";

/**
 * Env files relative to compiled output (apps/api/dist). Later entries override earlier ones.
 */
export function apiEnvFilePaths(): string[] {
  const distDir = __dirname;
  return [
    join(distDir, "..", "..", "..", ".env"),
    join(distDir, "..", ".env"),
  ];
}
