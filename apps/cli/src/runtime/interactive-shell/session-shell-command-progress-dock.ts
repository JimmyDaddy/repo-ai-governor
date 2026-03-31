import { CLI_COMMAND_NAMES, type CliCommandName } from '../../constants/cli-command.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import { ReactCliCommandProgressController } from '../../react-cli/index.js';
import type {
  CliCommandProgressEvent,
  CliCommandProgressPanelViewModel,
  CliCommandProgressSink,
  CliGovernanceCommandExecutionOptions,
} from '../../types/index.js';

interface CliSessionShellCommandProgressDockOptions {
  argv: string[];
  previewCommandLine: string;
  themePreset?: CliReactThemePreset;
  translate: (key: string, interpolation?: Record<string, string>) => string;
  relayProgressSink?: CliCommandProgressSink;
  abortSignal?: AbortSignal;
  onPanelUpdate: (panel: CliCommandProgressPanelViewModel | undefined) => void;
  onRenderRequested: () => void;
  scheduleTick?: (callback: () => void, intervalMs: number) => NodeJS.Timeout;
  clearScheduledTick?: (handle: NodeJS.Timeout) => void;
}

const COMMAND_PROGRESS_TICK_INTERVAL_MS = 1000;

/**
 * Owns session-shell running-progress docking by reusing the shared React CLI progress controller.
 *
 * Why this exists:
 * the session shell should stay the only foreground renderer owner while still consuming the same
 * transport-neutral progress events used by the direct command-running shell.
 */
export class CliSessionShellCommandProgressDock {
  private readonly commandName: CliCommandName | null;
  private readonly controller: ReactCliCommandProgressController | null;
  private activeTickHandle: NodeJS.Timeout | null = null;

  public constructor(private readonly options: CliSessionShellCommandProgressDockOptions) {
    this.commandName = this.resolveCommandName(options.argv[0]);
    this.controller = this.commandName
      ? new ReactCliCommandProgressController({
          commandName: this.commandName,
          initialTitle: `[session-shell:${this.commandName}] ${options.previewCommandLine}`,
          initialSubtitle: options.previewCommandLine,
          themePreset: options.themePreset,
          translate: options.translate,
        })
      : null;
    this.options.scheduleTick ??= (callback, intervalMs) => setInterval(callback, intervalMs);
    this.options.clearScheduledTick ??= (handle) => clearInterval(handle);
  }

  /**
   * Seeds the running-progress dock before the nested command emits its first transport event.
   * @returns Nothing.
   */
  public seedRunningState(): void {
    if (!this.commandName || !this.controller) {
      return;
    }

    this.commitLocalProgress({
      commandName: this.commandName,
      runState: 'running',
    });
  }

  /**
   * Starts one timer-driven refresh lifecycle for elapsed/heartbeat updates.
   * @returns Nothing.
   */
  public startTicking(): void {
    if (!this.controller || this.activeTickHandle) {
      return;
    }

    this.activeTickHandle =
      this.options.scheduleTick?.(() => {
        this.commitLocalSnapshot();
      }, COMMAND_PROGRESS_TICK_INTERVAL_MS) ?? null;
  }

  /**
   * Stops the active timer-driven refresh lifecycle.
   * @returns Nothing.
   */
  public stopTicking(): void {
    if (!this.activeTickHandle) {
      return;
    }

    this.options.clearScheduledTick?.(this.activeTickHandle);
    this.activeTickHandle = null;
  }

  /**
   * Creates execution options that fan out nested progress events to both the session-shell dock
   * and any upstream relay sink.
   * @returns Nested command execution options for `runCli(...)`.
   */
  public createExecutionOptions(): CliGovernanceCommandExecutionOptions | undefined {
    const hasProgressSink =
      this.controller !== null || this.options.relayProgressSink !== undefined;
    if (!hasProgressSink && !this.options.abortSignal) {
      return undefined;
    }

    return {
      ...(hasProgressSink
        ? {
            progressSink: {
              publish: (event: CliCommandProgressEvent) => {
                this.publish(event);
              },
            },
          }
        : {}),
      ...(this.options.abortSignal
        ? {
            abortSignal: this.options.abortSignal,
          }
        : {}),
    };
  }

  /**
   * Clears the current dock panel after the nested command returns control to the shell.
   * @returns Nothing.
   */
  public clear(): void {
    this.stopTicking();
    this.options.onPanelUpdate(undefined);
  }

  private publish(event: CliCommandProgressEvent): void {
    this.options.relayProgressSink?.publish(event);
    if (!this.controller) {
      return;
    }

    if (event.runState && event.runState !== 'running') {
      this.stopTicking();
    }
    this.commitLocalProgress(event);
  }

  private commitLocalProgress(event: CliCommandProgressEvent): void {
    const snapshot = this.controller?.apply(event);
    this.options.onPanelUpdate(snapshot?.commandProgressPanel);
    this.options.onRenderRequested();
  }

  private commitLocalSnapshot(): void {
    const snapshot = this.controller?.refresh();
    this.options.onPanelUpdate(snapshot?.commandProgressPanel);
    this.options.onRenderRequested();
  }

  private resolveCommandName(rawCommandName: string | undefined): CliCommandName | null {
    if (!rawCommandName) {
      return null;
    }

    return CLI_COMMAND_NAMES.includes(rawCommandName as CliCommandName)
      ? (rawCommandName as CliCommandName)
      : null;
  }
}
