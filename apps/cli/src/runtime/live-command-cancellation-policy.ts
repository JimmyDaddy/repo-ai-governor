import { CliCommandName } from '../constants/cli-command.constant.js';

const LIVE_COMMAND_CANCELLATION_ENABLED_COMMANDS = new Set<CliCommandName>([
  CliCommandName.CONNECT,
  CliCommandName.DOCTOR,
]);

/**
 * Owns which CLI commands may expose two-stage Ctrl+C semantics in the React shell.
 */
export class CliLiveCommandCancellationPolicy {
  /**
   * Resolves whether one command currently supports live cancel-controller wiring.
   * @param commandName Command being executed in the React shell.
   * @returns True when the command propagates abort semantics end-to-end.
   */
  public supportsLiveCancellation(commandName: CliCommandName): boolean {
    return LIVE_COMMAND_CANCELLATION_ENABLED_COMMANDS.has(commandName);
  }
}
