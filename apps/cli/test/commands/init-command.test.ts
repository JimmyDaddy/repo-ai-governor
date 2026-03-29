import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { stderr } from 'node:process';

import {
  CliReactThemePreset,
  DEFAULT_I18N_RUNTIME_CONFIG,
  ErrorOutputEnvironment,
  GovernorErrorCode,
  I18nRuntime,
  Locale,
  RuntimeError,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { CliInitCommand } from '../../src/commands/init-command.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import type { CliInitReactShellRunner } from '../../src/runtime/interactive-shell/init-react-shell-runner.js';
import type {
  CliCommandExecutorContext,
  CliInitReactShellSelection,
} from '../../src/types/index.js';

type RuntimeDebugOptions = ReturnType<CliCommandExecutorContext['resolveRuntimeDebugOptions']>;

interface InitCommandFixtureOptions {
  runtimeDebugOptions?: Partial<RuntimeDebugOptions>;
  outputMode?: ErrorOutputEnvironment;
  isTty?: boolean;
  locale?: Locale;
}

type CliInitCommandCollectorStub = {
  collectInteractiveBootstrapSelection: (
    context: CliCommandExecutorContext,
  ) => Promise<CliInitReactShellSelection>;
};

async function createInitCommandFixture(): Promise<{
  tempRoot: string;
  workspaceRoot: string;
  configPath: string;
  buildContext: (options?: InitCommandFixtureOptions) => CliCommandExecutorContext;
}> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'init-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  const configPath = resolve(workspaceRoot, 'governor.yaml');
  const i18nRuntime = new I18nRuntime();
  await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');

  return {
    tempRoot,
    workspaceRoot,
    configPath,
    buildContext: (options: InitCommandFixtureOptions = {}) =>
      ({
        options: {
          workspace: {
            workspaceId: 'test-workspace',
            workspaceRoot,
            configPath,
            mode: WorkspaceMode.TOOL_MANAGED,
            modeSource: 'runtime',
          },
          configSource: 'default',
          profileId: null,
          locale: options.locale ?? Locale.EN_US,
          outputMode: options.outputMode ?? ErrorOutputEnvironment.PRETTY,
          isTty: options.isTty ?? true,
          memoryConfig: {
            storeEngine: 'fs_csv',
            storeRoot: 'context/memory',
          },
          memoryStoreRoot: resolve(workspaceRoot, 'context', 'memory'),
        },
        artifactWriter: {
          writeTextArtifact: async (filePath: string, content: string) => {
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, content, 'utf8');
          },
          writeJsonArtifact: async (filePath: string, payload: unknown) => {
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
          },
          safeReadJson: async () => null,
        },
        reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
        orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
        commandExperienceBuilder: {
          buildExperiencePayload: (payload: unknown) => payload,
        },
        executeRunCommand: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'executeRunCommand is not used in init-command tests.',
          );
        },
        calculateCheckTotals: (checks: Array<{ status: string }>) => ({
          pass: checks.filter((check) => check.status === 'pass').length,
          warn: checks.filter((check) => check.status === 'warn').length,
          fail: checks.filter((check) => check.status === 'fail').length,
        }),
        buildDefaultConfigContent: () =>
          [
            'schemaVersion: "1.1"',
            'workspace:',
            `  mode: ${WorkspaceMode.TOOL_MANAGED}`,
            '  migrationPolicy: copy_verify_switch_rollback',
            'i18n:',
            '  runtimeEngine: i18next',
            `  defaultLocale: ${Locale.ZH_CN}`,
            `  fallbackLocale: ${Locale.EN_US}`,
            '  supportedLocales:',
            `    - ${Locale.ZH_CN}`,
            `    - ${Locale.EN_US}`,
            'ui:',
            '  react:',
            `    theme: ${CliReactThemePreset.GOVERNOR}`,
            '',
          ].join('\n'),
        toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, 'Z'),
        formatExecFailureDetail: (error: unknown) => String(error),
        resolveRuntimeDebugOptions: () => ({
          interactive: true,
          requestedUiMode: CliInteractiveUiMode.REACT,
          requestedUiTheme: null,
          uiMode: CliInteractiveUiMode.REACT,
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
          ...(options.runtimeDebugOptions ?? {}),
        }),
        resolveExecutionStreamMetadata: async () => ({}),
        resolveAdapterVerification: async () => ({
          allRequiredRolesSatisfied: true,
          requiredRoleEvaluations: [],
          optionalRoleEvaluations: [],
          tools: [],
        }),
        canWritePath: async () => true,
        localizeText: (english: string) => english,
        translate: (key: string, interpolation?: Record<string, string>) =>
          i18nRuntime.t(key, interpolation),
        adapterDiagnosticsRuntime: {} as CliCommandExecutorContext['adapterDiagnosticsRuntime'],
        runNodeScript: async () => ({
          stdout: '',
          stderr: '',
        }),
      }) as unknown as CliCommandExecutorContext,
  };
}

describe('CliInitCommand', () => {
  it('defaults to react when no explicit ui mode is provided and init contract is interactive', async () => {
    const fixture = await createInitCommandFixture();
    const runnerInvocations = { count: 0 };
    const fakeReactRunner = {
      run: async () => {
        runnerInvocations.count += 1;
        return {
          workspaceMode: WorkspaceMode.REPO_LOCAL,
          defaultLocale: Locale.EN_US,
          fallbackLocale: Locale.ZH_CN,
        };
      },
    } as unknown as CliInitReactShellRunner;
    const command = new CliInitCommand(fakeReactRunner);

    try {
      const result = await command.execute(
        fixture.buildContext({
          runtimeDebugOptions: {
            requestedUiMode: null,
            uiMode: CliInteractiveUiMode.CLASSIC,
            uiFallbackBehavior: null,
          },
        }),
      );
      const configContent = await readFile(fixture.configPath, 'utf8');
      const manifestPayload = JSON.parse(
        await readFile(
          resolve(fixture.workspaceRoot, 'context', 'bootstrap', 'init-manifest.json'),
          'utf8',
        ),
      ) as {
        workspaceMode?: string;
      };

      expect(runnerInvocations.count).toBe(1);
      expect(result.commandResult.details?.ui_mode).toBe(CliInteractiveUiMode.REACT);
      expect(result.commandResult.details?.workspace_mode_source).toBe('interactive_bootstrap');
      expect(result.commandResult.details?.ui_fallback_behavior).toBeNull();
      expect(configContent).toContain(`mode: ${WorkspaceMode.REPO_LOCAL}`);
      expect(configContent).toContain(`defaultLocale: ${Locale.EN_US}`);
      expect(configContent).toContain(`fallbackLocale: ${Locale.ZH_CN}`);
      expect(manifestPayload.workspaceMode).toBe(WorkspaceMode.REPO_LOCAL);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps explicit classic routing on the classic bootstrap path', async () => {
    const fixture = await createInitCommandFixture();
    const runnerInvocations = { count: 0 };
    const fakeReactRunner = {
      run: async () => {
        runnerInvocations.count += 1;
        return {
          workspaceMode: WorkspaceMode.REPO_LOCAL,
          defaultLocale: Locale.EN_US,
          fallbackLocale: Locale.ZH_CN,
        };
      },
    } as unknown as CliInitReactShellRunner;
    const command = new CliInitCommand(fakeReactRunner);
    const commandWithCollector = command as unknown as CliInitCommandCollectorStub;
    const originalCollector = commandWithCollector.collectInteractiveBootstrapSelection;
    const collectMock = vi.fn(async () => ({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: Locale.EN_US,
      fallbackLocale: Locale.ZH_CN,
    }));
    commandWithCollector.collectInteractiveBootstrapSelection = collectMock;

    try {
      const result = await command.execute(
        fixture.buildContext({
          runtimeDebugOptions: {
            requestedUiMode: CliInteractiveUiMode.CLASSIC,
            uiMode: CliInteractiveUiMode.CLASSIC,
            uiFallbackBehavior: null,
          },
        }),
      );
      const configContent = await readFile(fixture.configPath, 'utf8');

      expect(runnerInvocations.count).toBe(0);
      expect(collectMock).toHaveBeenCalledTimes(1);
      expect(result.commandResult.details?.ui_mode).toBe(CliInteractiveUiMode.CLASSIC);
      expect(result.commandResult.details?.ui_fallback_behavior).toBeNull();
      expect(configContent).toContain(`mode: ${WorkspaceMode.REPO_LOCAL}`);
      expect(configContent).toContain(`defaultLocale: ${Locale.EN_US}`);
      expect(configContent).toContain(`fallbackLocale: ${Locale.ZH_CN}`);
    } finally {
      commandWithCollector.collectInteractiveBootstrapSelection = originalCollector;
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps ui_mode=none when init is explicitly disabled', async () => {
    const fixture = await createInitCommandFixture();
    const runnerInvocations = { count: 0 };
    const fakeReactRunner = {
      run: async () => {
        runnerInvocations.count += 1;
        return {
          workspaceMode: WorkspaceMode.REPO_LOCAL,
          defaultLocale: Locale.EN_US,
          fallbackLocale: Locale.ZH_CN,
        };
      },
    } as unknown as CliInitReactShellRunner;
    const command = new CliInitCommand(fakeReactRunner);

    try {
      const result = await command.execute(
        fixture.buildContext({
          runtimeDebugOptions: {
            requestedUiMode: CliInteractiveUiMode.NONE,
            uiMode: CliInteractiveUiMode.NONE,
            uiFallbackBehavior: null,
          },
        }),
      );
      const configContent = await readFile(fixture.configPath, 'utf8');
      const manifestPayload = JSON.parse(
        await readFile(
          resolve(fixture.workspaceRoot, 'context', 'bootstrap', 'init-manifest.json'),
          'utf8',
        ),
      ) as {
        workspaceMode?: string;
      };

      expect(runnerInvocations.count).toBe(0);
      expect(result.commandResult.details?.ui_mode).toBe(CliInteractiveUiMode.NONE);
      expect(result.commandResult.details?.workspace_mode_source).toBe('runtime');
      expect(configContent).toContain(`mode: ${WorkspaceMode.TOOL_MANAGED}`);
      expect(configContent).toContain(`defaultLocale: ${Locale.ZH_CN}`);
      expect(configContent).toContain(`fallbackLocale: ${Locale.EN_US}`);
      expect(manifestPayload.workspaceMode).toBe(WorkspaceMode.TOOL_MANAGED);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('rethrows PROCESS_RUNTIME_CANCELLED from the React shell without falling back to classic', async () => {
    const fixture = await createInitCommandFixture();
    const runnerInvocations = { count: 0 };
    const fakeReactRunner = {
      run: async () => {
        runnerInvocations.count += 1;
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
          'prompt cancelled by test',
        );
      },
    } as unknown as CliInitReactShellRunner;
    const command = new CliInitCommand(fakeReactRunner);
    const commandWithCollector = command as unknown as CliInitCommandCollectorStub;
    const originalCollector = commandWithCollector.collectInteractiveBootstrapSelection;
    const collectMock = vi.fn(async () => ({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: Locale.EN_US,
      fallbackLocale: Locale.ZH_CN,
    }));
    commandWithCollector.collectInteractiveBootstrapSelection = collectMock;

    try {
      await expect(
        command.execute(
          fixture.buildContext({
            runtimeDebugOptions: {
              requestedUiMode: null,
              uiMode: CliInteractiveUiMode.CLASSIC,
              uiFallbackBehavior: null,
            },
          }),
        ),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      });

      expect(runnerInvocations.count).toBe(1);
      expect(collectMock).not.toHaveBeenCalled();
    } finally {
      commandWithCollector.collectInteractiveBootstrapSelection = originalCollector;
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
  it('falls back to classic when react shell initialization fails', async () => {
    const fixture = await createInitCommandFixture();
    const runnerInvocations = { count: 0 };
    const fakeReactRunner = {
      run: async () => {
        runnerInvocations.count += 1;
        throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'boom');
      },
    } as unknown as CliInitReactShellRunner;
    const command = new CliInitCommand(fakeReactRunner);
    const commandWithCollector = command as unknown as CliInitCommandCollectorStub;
    const originalCollector = commandWithCollector.collectInteractiveBootstrapSelection;
    const collectMock = vi.fn(async () => ({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: Locale.EN_US,
      fallbackLocale: Locale.ZH_CN,
    }));
    commandWithCollector.collectInteractiveBootstrapSelection = collectMock;
    const stderrWriteSpy = vi.spyOn(stderr, 'write').mockImplementation(() => true);

    try {
      const result = await command.execute(
        fixture.buildContext({
          runtimeDebugOptions: {
            requestedUiMode: null,
            uiMode: CliInteractiveUiMode.CLASSIC,
            uiFallbackBehavior: null,
          },
        }),
      );
      const configContent = await readFile(fixture.configPath, 'utf8');

      expect(runnerInvocations.count).toBe(1);
      expect(collectMock).toHaveBeenCalledTimes(1);
      expect(result.commandResult.details?.ui_mode).toBe(CliInteractiveUiMode.CLASSIC);
      expect(result.commandResult.details?.ui_fallback_behavior).toBe('shell_init_failed');
      expect(result.commandResult.checks?.some((check) => check.status === 'warn')).toBe(true);
      expect(stderrWriteSpy.mock.calls.map(([value]) => String(value)).join('')).toContain(
        'React shell initialization failed; falling back to classic bootstrap.',
      );
      expect(stderrWriteSpy.mock.calls.map(([value]) => String(value)).join('')).toContain('boom');
      expect(configContent).toContain(`mode: ${WorkspaceMode.REPO_LOCAL}`);
      expect(configContent).toContain(`defaultLocale: ${Locale.EN_US}`);
      expect(configContent).toContain(`fallbackLocale: ${Locale.ZH_CN}`);
    } finally {
      commandWithCollector.collectInteractiveBootstrapSelection = originalCollector;
      stderrWriteSpy.mockRestore();
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
