import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

let didLoad = false;

function findWorkspaceRoot(startDir: string): string | null {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Loads `.env` / `.env.local` from the monorepo root (directory containing `pnpm-workspace.yaml`),
 * then optionally `process.cwd()/.env` when that path differs. Later files override earlier ones
 * for keys they define. Does not override variables already set in the process environment.
 *
 * Call from app entrypoints before other imports that read `process.env`, or import
 * `@shredder/config/env-bootstrap` as the first import in the entry file.
 */
export function loadRootEnv(): void {
  if (didLoad) {
    return;
  }
  didLoad = true;

  const packageDir = __dirname;
  const root = findWorkspaceRoot(packageDir) ?? process.cwd();

  const envPath = join(root, ".env");
  const localPath = join(root, ".env.local");

  if (existsSync(envPath)) {
    config({ path: envPath });
  }
  if (existsSync(localPath)) {
    config({ path: localPath, override: true });
  }

  const cwdEnv = join(process.cwd(), ".env");
  if (existsSync(cwdEnv) && resolve(cwdEnv) !== resolve(envPath)) {
    config({ path: cwdEnv, override: true });
  }
}
