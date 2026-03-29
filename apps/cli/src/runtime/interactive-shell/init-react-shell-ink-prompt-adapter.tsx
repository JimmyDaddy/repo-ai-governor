import { stderr, stdin } from 'node:process';
import { ThemeProvider, defaultTheme } from '@inkjs/ui';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { type Instance, type RenderOptions, render } from 'ink';
import type React from 'react';
import type {
  CliInteractiveShellConfirmPrompt,
  CliInteractiveShellPromptAdapter,
  CliInteractiveShellSelectPrompt,
} from '../../types/index.js';
import {
  CliInitReactShellConfirmPromptView,
  CliInitReactShellSelectPromptView,
} from './init-react-shell-live-prompt.js';

interface CliInteractiveShellActivePrompt {
  instance: Instance;
  reject: (error: RuntimeError) => void;
}

/**
 * Owns live Ink/@inkjs/ui prompt mounting for the `init` React shell.
 */
export class CliInitReactShellInkPromptAdapter implements CliInteractiveShellPromptAdapter {
  private activePrompt: CliInteractiveShellActivePrompt | null = null;

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
    return await this.mountPrompt((finish) => (
      <ThemeProvider theme={defaultTheme}>
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
    return await this.mountPrompt((finish) => (
      <ThemeProvider theme={defaultTheme}>
        <CliInitReactShellConfirmPromptView
          {...prompt}
          onConfirm={() => finish(true)}
          onCancel={() => finish(false)}
        />
      </ThemeProvider>
    ));
  }

  /**
   * Tears down the active prompt so SIGINT/finally cleanup can restore the terminal promptly.
   * @returns Nothing.
   */
  public close(): void {
    if (!this.activePrompt) {
      return;
    }

    const activePrompt = this.activePrompt;
    this.activePrompt = null;
    activePrompt.instance.clear();
    activePrompt.instance.unmount();
    activePrompt.reject(
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
    if (this.activePrompt) {
      this.close();
    }

    return await new Promise<Result>((resolve, reject) => {
      let settled = false;

      const finalize = (callback: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        const activePrompt = this.activePrompt;
        this.activePrompt = null;
        if (activePrompt) {
          activePrompt.instance.clear();
          activePrompt.instance.unmount();
        }
        callback();
      };

      const instance = render(
        renderPrompt((value) => finalize(() => resolve(value))),
        this.renderOptions,
      );
      this.activePrompt = {
        instance,
        reject: (error) => finalize(() => reject(error)),
      };
    });
  }
}
