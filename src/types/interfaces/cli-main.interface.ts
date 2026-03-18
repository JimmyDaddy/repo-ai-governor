import type { Command } from "commander";
import type { WritableLike } from "./cli-ui.interface.js";

export interface CliIo {
  stdout?: WritableLike;
  stderr?: WritableLike;
}

export interface CliProgram extends Command {
  repoAiGovernorExitCode?: number;
}

export interface PackageJsonLike {
  description: string;
  version: string;
}
