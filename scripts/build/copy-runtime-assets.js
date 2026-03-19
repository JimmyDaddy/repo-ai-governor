#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const COMPILED_CLI_ENTRY_PATH = resolve(process.cwd(), "dist/bin/repo-ai-governor.js");

if (!existsSync(COMPILED_CLI_ENTRY_PATH)) {
  throw new Error(
    `Build output is incomplete: expected CLI entry at ${COMPILED_CLI_ENTRY_PATH}.`,
  );
}
