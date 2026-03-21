#!/usr/bin/env node

import { standardizeError } from "@repo-ai-governor/shared";
import { runCli } from "../apps/cli/src/main.js";

/**
 * Boots the CLI runtime from the executable entrypoint.
 * @returns Resolves once CLI exit code has been assigned to the process.
 */
async function bootstrapCli(): Promise<void> {
  process.exitCode = await runCli(process.argv);
}

void bootstrapCli().catch((error: unknown) => {
  const standardizedError = standardizeError(error);
  process.stderr.write(
    `CLI bootstrap failed [${standardizedError.code}]: ${standardizedError.message}\n`,
  );
  process.exitCode = 1;
});
