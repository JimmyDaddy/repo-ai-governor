import {
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  DEFAULT_I18N_RUNTIME_CONFIG,
  ErrorOutputEnvironment,
  GovernorErrorCode,
  I18nRuntime,
  Locale,
  RuntimeError,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { CliInitReactShellRunner } from '../../src/runtime/interactive-shell/init-react-shell-runner.js';
import { CliInteractiveShellStderrRenderer } from '../../src/runtime/interactive-shell/interactive-shell-stderr-renderer.js';
import type { CliInteractiveShellPromptAdapter } from '../../src/types/index.js';

function createPromptAdapter(answers: string[]): CliInteractiveShellPromptAdapter {
  let answerIndex = 0;

  return {
    async question(): Promise<string> {
      const answer = answers[answerIndex];
      answerIndex += 1;
      return answer ?? '';
    },
    close(): void {
      return;
    },
  };
}

function createInterruptiblePromptAdapter(): CliInteractiveShellPromptAdapter {
  let rejectQuestion: ((error: RuntimeError) => void) | null = null;

  return {
    async question(): Promise<string> {
      return await new Promise<string>((_resolve, reject) => {
        rejectQuestion = reject;
      });
    },
    close(): void {
      if (rejectQuestion) {
        rejectQuestion(
          new RuntimeError(GovernorErrorCode.PROCESS_RUNTIME_CANCELLED, 'prompt closed by test'),
        );
        rejectQuestion = null;
      }
    },
  };
}

describe('CliInitReactShellRunner', () => {
  it('collects workspace mode, locale, confirmation, and renders only to stderr', async () => {
    const stderrBuffer: string[] = [];
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () => createPromptAdapter(['2', '2', 'y']),
    );

    const selection = await runner.run({
      locale: Locale.EN_US,
      outputMode: ErrorOutputEnvironment.PRETTY,
      translate: (key, interpolation) => i18nRuntime.t(key, interpolation),
    });

    expect(selection).toEqual({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      fallbackLocale: DEFAULT_I18N_LOCALE,
    });
    expect(stderrBuffer.join('')).toContain('[react-shell:init]');
    expect(stderrBuffer.join('')).toContain('unmounted state=success');
  });

  it('surfaces validation feedback before accepting corrected answers', async () => {
    const stderrBuffer: string[] = [];
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'zh-CN');
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () => createPromptAdapter(['9', '1', 'bogus', '2', '']),
    );

    const selection = await runner.run({
      locale: Locale.ZH_CN,
      outputMode: ErrorOutputEnvironment.PRETTY,
      translate: (key, interpolation) => i18nRuntime.t(key, interpolation),
    });

    expect(selection).toEqual({
      workspaceMode: WorkspaceMode.TOOL_MANAGED,
      defaultLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      fallbackLocale: DEFAULT_I18N_LOCALE,
    });
    expect(stderrBuffer.join('')).toContain('validation=');
    expect(stderrBuffer.join('')).toContain('ui=react');
  });

  it('restarts the wizard from step 1 when confirmation is rejected', async () => {
    const stderrBuffer: string[] = [];
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () => createPromptAdapter(['1', '1', 'n', '2', '2', 'y']),
    );

    const selection = await runner.run({
      locale: Locale.EN_US,
      outputMode: ErrorOutputEnvironment.PRETTY,
      translate: (key, interpolation) => i18nRuntime.t(key, interpolation),
    });

    expect(selection).toEqual({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      fallbackLocale: DEFAULT_I18N_LOCALE,
    });
    expect(stderrBuffer.join('')).toContain('Selection updated; returning to the first step.');
    expect(stderrBuffer.join('')).toContain('Step 1 of 3: Workspace mode');
  });

  it('cancels cleanly when SIGINT arrives during prompting', async () => {
    const stderrBuffer: string[] = [];
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () => createInterruptiblePromptAdapter(),
    );

    const runPromise = runner.run({
      locale: Locale.EN_US,
      outputMode: ErrorOutputEnvironment.PRETTY,
      translate: (key, interpolation) => i18nRuntime.t(key, interpolation),
    });

    setImmediate(() => {
      process.emit('SIGINT');
    });

    await expect(runPromise).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
    });
    expect(stderrBuffer.join('')).toContain('[react-shell:init]');
  });
});
