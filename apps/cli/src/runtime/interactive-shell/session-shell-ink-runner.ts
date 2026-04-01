import { stderr, stdin } from 'node:process';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { Instance, RenderOptions } from 'ink';
import { ReactCliRunner } from '../../react-cli/index.js';
import type { ReactCliSessionShellInteractionHandlers } from '../../react-cli/views/session-shell-live-app.js';
import type { CliSessionShellInputAction, CliSessionShellViewModel } from '../../types/index.js';

/**
 * Owns the live Ink mount/rerender lifecycle for the session-shell baseline.
 *
 * Why this exists:
 * sprint-001 needs a concrete stderr-only mount seam before the runner itself can migrate away
 * from blocking readline input ownership.
 */
export class CliSessionShellInkRunner {
  private activeInstance: Instance | null = null;
  private pendingResolve: ((action: CliSessionShellInputAction | null) => void) | null = null;
  private pendingReject: ((error: RuntimeError) => void) | null = null;
  private queuedActions: Array<CliSessionShellInputAction | null> = [];
  private queuedInterrupt: RuntimeError | null = null;
  private clearViewportOnNextRender = false;
  private lastLayoutSignature: string | null = null;

  public constructor(
    private readonly reactCliRunner: ReactCliRunner = new ReactCliRunner(),
    private readonly renderOptions: RenderOptions = {
      stdin,
      stdout: stderr,
      stderr,
      exitOnCtrlC: false,
      patchConsole: false,
    },
  ) {}

  /**
   * Waits for the next foreground input action while keeping the live Ink tree in sync.
   * @param viewModel Latest session-shell presenter view model.
   * @returns Next action, or `null` when EOF closes the foreground shell.
   */
  public async readAction(
    viewModel: CliSessionShellViewModel,
  ): Promise<CliSessionShellInputAction | null> {
    this.render(viewModel);

    if (this.queuedInterrupt) {
      const queuedInterrupt = this.queuedInterrupt;
      this.queuedInterrupt = null;
      throw queuedInterrupt;
    }

    const queuedAction = this.queuedActions.shift();
    if (queuedAction !== undefined) {
      return queuedAction;
    }

    return await new Promise<CliSessionShellInputAction | null>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });
  }

  /**
   * Mounts or rerenders the live session-shell tree on stderr through Ink.
   * @param viewModel Latest session-shell presenter view model.
   * @returns Nothing.
   */
  public render(viewModel: CliSessionShellViewModel): void {
    const nextLayoutSignature = this.buildLayoutSignature(viewModel);

    if (this.activeInstance) {
      if (
        this.clearViewportOnNextRender ||
        (this.lastLayoutSignature !== null && nextLayoutSignature !== this.lastLayoutSignature)
      ) {
        this.activeInstance.clear();
        this.clearViewportOnNextRender = false;
      }
      this.reactCliRunner.rerenderLiveSessionShell(
        this.activeInstance,
        viewModel,
        this.createInteractionHandlers(),
      );
      this.lastLayoutSignature = nextLayoutSignature;
      return;
    }

    this.activeInstance = this.reactCliRunner.mountLiveSessionShell(
      viewModel,
      this.createInteractionHandlers(),
      this.renderOptions,
    );
    this.clearViewportOnNextRender = false;
    this.lastLayoutSignature = nextLayoutSignature;
  }

  /**
   * Requests one viewport clear before the next live rerender.
   * @returns Nothing.
   */
  public requestViewportClear(): void {
    this.clearViewportOnNextRender = true;
  }

  /**
   * Tears down the live Ink tree and restores the terminal surface.
   * @returns Nothing.
   */
  public close(): void {
    this.pendingResolve?.(null);
    this.pendingResolve = null;
    this.pendingReject = null;
    this.queuedActions = [];
    this.queuedInterrupt = null;
    this.clearViewportOnNextRender = false;
    this.lastLayoutSignature = null;

    if (!this.activeInstance) {
      return;
    }

    this.activeInstance.clear();
    this.activeInstance.unmount();
    this.activeInstance = null;
  }

  private createInteractionHandlers(): ReactCliSessionShellInteractionHandlers {
    return {
      onAction: (action) => {
        this.dispatchAction(action);
      },
      onInterrupt: () => {
        this.dispatchInterrupt();
      },
      onEndOfInput: () => {
        this.dispatchAction(null);
      },
    };
  }

  private dispatchAction(action: CliSessionShellInputAction | null): void {
    const pendingResolve = this.pendingResolve;
    this.pendingResolve = null;
    this.pendingReject = null;

    if (pendingResolve) {
      pendingResolve(action);
      return;
    }

    this.queuedActions.push(action);
  }

  private dispatchInterrupt(): void {
    const interruptError = new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      'session shell Ink input interrupted by SIGINT',
    );
    const pendingReject = this.pendingReject;
    this.pendingResolve = null;
    this.pendingReject = null;

    if (pendingReject) {
      pendingReject(interruptError);
      return;
    }

    this.queuedInterrupt = interruptError;
  }

  private buildLayoutSignature(viewModel: CliSessionShellViewModel): string {
    const slashSuggestionCount = viewModel.slashSuggestions.length;
    const promptBarLineCount = viewModel.promptBarLines.length;
    const previewOccupancy = viewModel.commandPreview === null ? 'none' : 'present';
    const commandProgressOccupancy = viewModel.commandProgressPanel ? 'present' : 'none';

    return [
      viewModel.shellMode,
      viewModel.inputMode,
      viewModel.handoffState,
      viewModel.slashPaletteVisible ? 'palette-open' : 'palette-closed',
      String(slashSuggestionCount),
      previewOccupancy,
      commandProgressOccupancy,
      String(promptBarLineCount),
    ].join('|');
  }
}
