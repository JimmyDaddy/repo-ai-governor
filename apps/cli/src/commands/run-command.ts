import { CliCommandName } from '../constants/cli-command.constant.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns command-surface dispatch for `run` while preserving runtime orchestration inside the facade context.
 */
export class CliRunCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.RUN;

  public async execute(context: CliCommandExecutorContext) {
    return context.executeRunCommand();
  }
}
