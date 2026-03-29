import { stderr, stdin } from 'node:process';
import { ThemeProvider } from '@inkjs/ui';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { type Instance, type RenderOptions, render } from 'ink';
import type React from 'react';
import { resolveReactCliTheme } from '../../react-cli/theme/react-cli-theme-registry.js';
import type {
  CliInteractiveShellConfirmPrompt,
  CliInteractiveShellPromptAdapter,
  CliInteractiveShellSelectPrompt,
  CliInteractiveShellStatusFrame,
} from '../../types/index.js';
import {
  CliInitReactShellConfirmPromptView,
  CliInitReactShellSelectPromptView,
  CliInitReactShellStatusView,
} from './init-react-shell-live-prompt.js';

/**
 * Owns live Ink/@inkjs/ui prompt mounting for the `init` React shell.
 */
export class CliInitReactShellInkPromptAdapter implements CliInteractiveShellPromptAdapter {
  private activeInstance: Instance | null = null;
  private activePromptReject: ((error: RuntimeError) => void) | null = null;

  public constructor(
    private readonly renderOptions: RenderOptions = {
      stdin,
      stdout: stderr,
      stderr,
      exitOnCtrlC: false,
      patchConsole: false,
    },
  ) {}

  /**
   * Mounts one keyboard-selectable prompt and resolves the chosen value.
   * @param prompt Prompt metadata and selectable options.
   * @returns Selected option value.
   */
  public async select(prompt: CliInteractiveShellSelectPrompt): Promise<string> {
    const themeDefinition = resolveReactCliTheme(prompt.session.uiTheme);

    return await this.mountPrompt((finish) => (
      <ThemeProvider theme={themeDefinition.inkTheme}>
        <CliInitReactShellSelectPromptView {...prompt} onSubmit={finish} />
      </ThemeProvider>
    ));
  }

  /**
   * Mounts one confirmation prompt and resolves the confirm/cancel decision.
   * @param prompt Prompt metadata and confirmation summary.
   * @returns `true` on confirm, otherwise `false`.
   */
  public async confirm(prompt: CliInteractiveShellConfirmPrompt): Promise<boolean> {
    const themeDefinition = resolveReactCliTheme(prompt.session.uiTheme);

    return await this.mountPrompt((finish) => (
      <ThemeProvider theme={themeDefinition.inkTheme}>
        <CliInitReactShellConfirmPromptView
          {...prompt}
          onConfirm={() => finish(true)}
          onCancel={() => finish(false)}
        />
      </ThemeProvider>
    ));
  }

  /**
   * Rerenders the active shell region with one non-interactive status frame.
   * @param frame Status-only frame shown while the shell submits or finalizes.
   * @returns Nothing.
   */
  public renderStatus(frame: CliInteractiveShellStatusFrame): void {
    const themeDefinition = resolveReactCliTheme(frame.session.uiTheme);

    this.renderNode(
      <ThemeProvider theme={themeDefinition.inkTheme}>
        <CliInitReactShellStatusView {...frame} />
      </ThemeProvider>,
    );
  }

  /**
   * Tears down the active prompt so SIGINT/finally cleanup can restore the terminal promptly.
   * @returns Nothing.
   */
  public close(): void {
    if (!this.activeInstance && !this.activePromptReject) {
      return;
    }

    const activePromptReject = this.activePromptReject;
    this.activePromptReject = null;
    if (this.activeInstance) {
      this.activeInstance.clear();
      this.activeInstance.unmount();
      this.activeInstance = null;
    }

    activePromptReject?.(
      new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'interactive shell prompt closed',
      ),
    );
  }

  /**
   * Mounts one live Ink prompt and resolves it when the component emits a terminal selection.
   * @param renderPrompt Factory that receives the completion callback.
   * @returns Resolved prompt result.
   */
  private async mountPrompt<Result>(
    renderPrompt: (finish: (value: Result) => void) => React.JSX.Element,
  ): Promise<Result> {
    return await new Promise<Result>((resolve, reject) => {
      let settled = false;

      const finalize = (callback: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        this.activePromptReject = null;
        callback();
      };

      this.activePromptReject = (error) => finalize(() => reject(error));
      this.renderNode(renderPrompt((value) => finalize(() => resolve(value))));
    });
  }

  /**
   * Mounts the live shell once and reuses the same Ink instance for subsequent rerenders.
   * @param node React tree representing the current shell state.
   * @returns Nothing.
   */
  private renderNode(node: React.JSX.Element): void {
    if (this.activeInstance) {
      this.activeInstance.rerender(node);
      return;
    }

    this.activeInstance = render(node, this.renderOptions);
  }
}
