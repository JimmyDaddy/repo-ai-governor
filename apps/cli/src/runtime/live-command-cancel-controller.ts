import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { CliCommandName } from '../constants/cli-command.constant.js';
import type {
  CliCommandProgressSink,
  CliGovernanceCommandExecutionOptions,
} from '../types/index.js';

/**
 * Owns first/second Ctrl+C semantics for live command-shell execution.
 */
export class CliLiveCommandCancelController {
  private readonly abortController = new AbortController();
  private readonly forcedCancellationPromise: Promise<never>;
  private rejectForcedCancellation!: (error: RuntimeError) => void;
  private cancellationRequested = false;
  private forceCancellationTriggered = false;

  public constructor(
    private readonly options: {
      commandName: CliCommandName;
      progressSink: CliCommandProgressSink;
      translate: (key: string, interpolation?: Record<string, string>) => string;
    },
  ) {
    this.forcedCancellationPromise = new Promise<never>((_resolve, reject) => {
      this.rejectForcedCancellation = reject as (error: RuntimeError) => void;
    });
  }

  /**
   * Builds additive execution options consumed by long-running CLI commands.
   * @returns Execution options with progress sink + abort signal.
   */
  public createExecutionOptions(): CliGovernanceCommandExecutionOptions {
    return {
      progressSink: this.options.progressSink,
      abortSignal: this.abortController.signal,
    };
  }

  /**
   * Applies the current Ctrl+C policy.
   *
   * First Ctrl+C:
   * requests graceful cancellation through AbortController.
   *
   * Second Ctrl+C:
   * forces immediate command termination through a standardized cancellation error.
   */
  public handleSigint(): void {
    if (this.forceCancellationTriggered) {
      return;
    }

    if (!this.cancellationRequested) {
      this.cancellationRequested = true;
      this.abortController.abort();
      this.options.progressSink.publish({
        commandName: this.options.commandName,
        runState: 'running',
        cancelCapability: 'cancel_requested',
        statusLine: this.options.translate('cli.reactShell.progress.cancel.requested'),
        logLine: this.options.translate('cli.reactShell.progress.cancel.requested'),
      });
      return;
    }

    this.forceCancellationTriggered = true;
    const forcedMessage = this.options.translate('cli.reactShell.progress.cancel.forced');
    this.options.progressSink.publish({
      commandName: this.options.commandName,
      runState: 'cancelled',
      cancelCapability: 'cancel_requested',
      statusLine: forcedMessage,
      logLine: forcedMessage,
    });
    this.rejectForcedCancellation(
      new RuntimeError(GovernorErrorCode.PROCESS_RUNTIME_CANCELLED, forcedMessage, {
        commandName: this.options.commandName,
        forced: true,
      }),
    );
  }

  /**
   * Races command execution against a forced second-Ctrl+C termination.
   * @param executionPromise In-flight command execution promise.
   * @returns Command result or forced cancellation failure.
   */
  public async raceExecution<T>(executionPromise: Promise<T>): Promise<T> {
    return await Promise.race([executionPromise, this.forcedCancellationPromise]);
  }
}
