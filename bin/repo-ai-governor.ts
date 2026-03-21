#!/usr/bin/env node

import { runCli } from "@repo-ai-governor/cli";
import { standardizeError } from "@repo-ai-governor/shared";

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
