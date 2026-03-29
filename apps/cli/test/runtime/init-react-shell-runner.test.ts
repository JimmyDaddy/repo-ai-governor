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
import { CliReactThemePreset } from '../../src/constants/cli-react-theme.constant.js';
import { CliInitReactShellRunner } from '../../src/runtime/interactive-shell/init-react-shell-runner.js';
import { CliInteractiveShellStderrRenderer } from '../../src/runtime/interactive-shell/interactive-shell-stderr-renderer.js';
import type {
  CliInteractiveShellConfirmPrompt,
  CliInteractiveShellPromptAdapter,
  CliInteractiveShellSelectPrompt,
  CliInteractiveShellStatusFrame,
} from '../../src/types/index.js';

interface CliInteractiveShellPromptRecord {
  selects: Array<{
    title: string;
    runState: string;
    validationErrors: Record<string, string>;
  }>;
  confirms: Array<{
    title: string;
    promptLabel: string;
    summaryLines: string[];
  }>;
  statuses: Array<{
    title: string;
    runState: string;
    lines: string[];
  }>;
}

function createPromptAdapter(options: {
  selectAnswers: string[];
  confirmAnswers: boolean[];
  record?: CliInteractiveShellPromptRecord;
}): CliInteractiveShellPromptAdapter {
  let selectAnswerIndex = 0;
  let confirmAnswerIndex = 0;

  return {
    async select(prompt: CliInteractiveShellSelectPrompt): Promise<string> {
      options.record?.selects.push({
        title: prompt.title,
        runState: prompt.session.runState,
        validationErrors: { ...prompt.session.validationErrors },
      });

      const answer = options.selectAnswers[selectAnswerIndex];
      selectAnswerIndex += 1;
      return answer ?? prompt.defaultValue;
    },
    async confirm(prompt: CliInteractiveShellConfirmPrompt): Promise<boolean> {
      options.record?.confirms.push({
        title: prompt.title,
        promptLabel: prompt.promptLabel,
        summaryLines: [...prompt.summaryLines],
      });

      const answer = options.confirmAnswers[confirmAnswerIndex];
      confirmAnswerIndex += 1;
      return answer ?? true;
    },
    renderStatus(frame: CliInteractiveShellStatusFrame): void {
      options.record?.statuses.push({
        title: frame.title,
        runState: frame.session.runState,
        lines: [...frame.lines],
      });
    },
    close(): void {
      return;
    },
  };
}

function createInterruptiblePromptAdapter(): CliInteractiveShellPromptAdapter {
  let rejectSelect: ((error: RuntimeError) => void) | null = null;

  return {
    async select(): Promise<string> {
      return await new Promise<string>((_resolve, reject) => {
        rejectSelect = reject;
      });
    },
    async confirm(): Promise<boolean> {
      return true;
    },
    renderStatus(): void {
      return;
    },
    close(): void {
      if (rejectSelect) {
        rejectSelect(
          new RuntimeError(GovernorErrorCode.PROCESS_RUNTIME_CANCELLED, 'prompt closed by test'),
        );
        rejectSelect = null;
      }
    },
  };
}

describe('CliInitReactShellRunner', () => {
  it('collects keyboard-selectable workspace defaults and renders only to stderr', async () => {
    const stderrBuffer: string[] = [];
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const promptRecord: CliInteractiveShellPromptRecord = {
      selects: [],
      confirms: [],
      statuses: [],
    };
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () =>
        createPromptAdapter({
          selectAnswers: [WorkspaceMode.REPO_LOCAL, DEFAULT_I18N_FALLBACK_LOCALE],
          confirmAnswers: [true],
          record: promptRecord,
        }),
    );

    const selection = await runner.run({
      locale: Locale.EN_US,
      outputMode: ErrorOutputEnvironment.PRETTY,
      uiTheme: CliReactThemePreset.CATPPUCCIN,
      translate: (key, interpolation) => i18nRuntime.t(key, interpolation),
    });

    expect(selection).toEqual({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      fallbackLocale: DEFAULT_I18N_LOCALE,
    });
    expect(promptRecord.selects).toHaveLength(2);
    expect(promptRecord.confirms).toHaveLength(1);
    expect(promptRecord.statuses).toEqual([
      {
        title: i18nRuntime.t('cli.initShell.submitTitle'),
        runState: 'submitting',
        lines: [i18nRuntime.t('cli.initShell.submittingDescriptor')],
      },
      {
        title: i18nRuntime.t('cli.initShell.submitTitle'),
        runState: 'success',
        lines: [i18nRuntime.t('cli.initShell.successMessage')],
      },
    ]);
    expect(promptRecord.confirms[0]?.summaryLines).toEqual([
      `workspaceMode=${WorkspaceMode.REPO_LOCAL}`,
      `defaultLocale=${DEFAULT_I18N_FALLBACK_LOCALE}`,
      `fallbackLocale=${DEFAULT_I18N_LOCALE}`,
    ]);
    expect(stderrBuffer.join('')).toContain('[react-shell:init]');
    expect(stderrBuffer.join('')).toContain('theme=catppuccin');
    expect(stderrBuffer.join('')).toContain('unmounted state=success');
  });

  it('re-prompts through the same select surface when adapter answers are invalid', async () => {
    const stderrBuffer: string[] = [];
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'zh-CN');
    const promptRecord: CliInteractiveShellPromptRecord = {
      selects: [],
      confirms: [],
      statuses: [],
    };
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () =>
        createPromptAdapter({
          selectAnswers: [
            'bogus',
            WorkspaceMode.TOOL_MANAGED,
            'invalid',
            DEFAULT_I18N_FALLBACK_LOCALE,
          ],
          confirmAnswers: [true],
          record: promptRecord,
        }),
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
    expect(promptRecord.selects).toHaveLength(4);
    expect(promptRecord.selects[1]).toMatchObject({
      title: i18nRuntime.t('cli.initShell.workspaceModeTitle'),
      runState: 'validating',
    });
    expect(promptRecord.selects[1]?.validationErrors).toEqual({
      workspaceMode: i18nRuntime.t('cli.initShell.workspaceModeValidation'),
    });
    expect(promptRecord.selects[3]).toMatchObject({
      title: i18nRuntime.t('cli.initShell.defaultLocaleTitle'),
      runState: 'validating',
    });
    expect(promptRecord.selects[3]?.validationErrors).toEqual({
      defaultLocale: i18nRuntime.t('cli.initShell.defaultLocaleValidation'),
    });
    expect(promptRecord.statuses).toHaveLength(2);
    expect(stderrBuffer.join('')).toContain('ui=react');
  });

  it('restarts the wizard from step 1 when confirmation is rejected', async () => {
    const stderrBuffer: string[] = [];
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
    const promptRecord: CliInteractiveShellPromptRecord = {
      selects: [],
      confirms: [],
      statuses: [],
    };
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () =>
        createPromptAdapter({
          selectAnswers: [
            WorkspaceMode.TOOL_MANAGED,
            DEFAULT_I18N_LOCALE,
            WorkspaceMode.REPO_LOCAL,
            DEFAULT_I18N_FALLBACK_LOCALE,
          ],
          confirmAnswers: [false, true],
          record: promptRecord,
        }),
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
    expect(promptRecord.selects).toHaveLength(4);
    expect(promptRecord.confirms).toHaveLength(2);
    expect(promptRecord.statuses[0]).toEqual({
      title: i18nRuntime.t('cli.initShell.confirmationTitle'),
      runState: 'confirming',
      lines: [i18nRuntime.t('cli.initShell.confirmationRestartMessage')],
    });
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
