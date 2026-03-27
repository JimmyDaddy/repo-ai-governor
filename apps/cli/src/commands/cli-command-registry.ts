import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { CliCommandName } from '../constants/cli-command.constant.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns extracted command-executor lookup so the facade can dispatch through a stable registry.
 */
export class CliCommandRegistry {
  private readonly executorByCommandName = new Map<CliCommandName, CliCommandExecutor>();

  public constructor(executors: readonly CliCommandExecutor[]) {
    for (const executor of executors) {
      if (this.executorByCommandName.has(executor.commandName)) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `Duplicate CLI command executor registration for "${executor.commandName}".`,
          {
            commandName: executor.commandName,
          },
        );
      }
      this.executorByCommandName.set(executor.commandName, executor);
    }
  }

  /**
   * Resolves one extracted command executor by command name.
   * @param commandName CLI command name.
   * @returns Matching executor when registry owns the command, otherwise null.
   */
  public resolve(commandName: CliCommandName): CliCommandExecutor | null {
    return this.executorByCommandName.get(commandName) ?? null;
  }
}
