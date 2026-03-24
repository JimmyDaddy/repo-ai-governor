import type { CliCommandName } from "../constants/cli-command.constant.js";
import type { CliCommandExecutorContext, CliGovernanceCommandResult } from "../types/index.js";

/**
 * Defines one extracted command executor owned by the CLI package command surface layer.
 */
export interface CliCommandExecutor {
  commandName: CliCommandName;
  execute(context: CliCommandExecutorContext): Promise<CliGovernanceCommandResult>;
}
