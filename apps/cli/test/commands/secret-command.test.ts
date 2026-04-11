import { PassThrough } from 'node:stream';

import {
  CliReactThemePreset,
  DEFAULT_I18N_RUNTIME_CONFIG,
  I18nRuntime,
} from '@repo-ai-governor/shared';
import { vi } from 'vitest';
import { CliSecretCommand } from '../../src/commands/secret-command.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import type { CliCommandExecutorContext } from '../../src/types/index.js';

async function createSecretCommandContext(): Promise<CliCommandExecutorContext> {
  const i18nRuntime = new I18nRuntime();
  await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');

  return {
    options: {
      locale: 'en-US',
      outputMode: 'plain',
      secretCommandOptions: {
        action: 'set',
        keyName: 'openai/api-key',
      },
    },
    commandExperienceBuilder: {
      buildExperiencePayload: (payload: unknown) => payload,
    },
    calculateCheckTotals: (checks: Array<{ status: string }>) => ({
      pass: checks.filter((check) => check.status === 'pass').length,
      warn: checks.filter((check) => check.status === 'warn').length,
      fail: checks.filter((check) => check.status === 'fail').length,
    }),
    resolveRuntimeDebugOptions: () => ({
      interactive: true,
      requestedUiMode: null,
      requestedUiTheme: null,
      uiMode: CliInteractiveUiMode.NONE,
      uiTheme: CliReactThemePreset.GOVERNOR,
      uiFallbackBehavior: null,
      inputTty: true,
      stderrTty: true,
      dryRun: false,
      trace: false,
      replayPath: null,
      adapters: false,
      fix: false,
      recordLedger: false,
      taskId: null,
      restrictedNetwork: false,
      restrictedReason: null,
      allowLocalFallback: true,
      hitlDecision: null,
      hitlDecisionReason: null,
      hitlResumeAction: null,
      hitlDecidedBy: null,
      hitlConstraints: [],
    }),
    translate: (key: string, interpolation?: Record<string, string>) =>
      i18nRuntime.t(key, interpolation),
    localizeText: (english: string) => english,
  } as unknown as CliCommandExecutorContext;
}

describe('CliSecretCommand', () => {
  it('uses the default no-echo prompt path without crashing interactive secret set', async () => {
    const context = await createSecretCommandContext();
    const promptInput = new PassThrough();
    const promptOutput = new PassThrough();
    const promptWrites: string[] = [];
    const setSecret = vi.fn(async () => ({
      keyName: 'openai/api-key',
      selector: 'secret://openai/api-key',
      backendId: 'unsafe-local-file',
      warning: null,
    }));

    promptOutput.on('data', (chunk) => {
      promptWrites.push(chunk.toString('utf8'));
    });
    Object.assign(promptInput, {
      isTTY: true,
      setRawMode: vi.fn(),
    });

    const command = new CliSecretCommand({
      secretService: {
        setLocalizeText: vi.fn(),
        setSecret,
      } as never,
      promptInput,
      promptOutput,
    });

    const execution = command.execute(context);
    queueMicrotask(() => {
      promptInput.end('  super-secret-value  \n');
    });
    const result = await execution;

    expect(setSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        keyName: 'openai/api-key',
        value: '  super-secret-value  ',
      }),
    );
    expect(promptWrites.join('')).toContain('Secret value: ');
    expect(result.commandResult.operation).toBe('secret_set');
  });

  it('preserves leading and trailing whitespace for stdin input while stripping one terminal newline', async () => {
    const context = await createSecretCommandContext();
    context.options.secretCommandOptions = {
      action: 'set',
      keyName: 'openai/api-key',
      stdin: true,
    };
    const setSecret = vi.fn(async () => ({
      keyName: 'openai/api-key',
      selector: 'secret://openai/api-key',
      backendId: 'unsafe-local-file',
      warning: null,
    }));
    const command = new CliSecretCommand({
      secretService: {
        setLocalizeText: vi.fn(),
        setSecret,
      } as never,
      stdinReader: async () => '  stdin-secret  \n',
    });

    await command.execute(context);

    expect(setSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        value: '  stdin-secret  ',
      }),
    );
  });
});
