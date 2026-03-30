import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import { SchemaValidator, WorkspaceMode } from '@repo-ai-governor/config';
import {
  CliReactThemePreset,
  DEFAULT_I18N_RUNTIME_CONFIG,
  ErrorOutputEnvironment,
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  I18nRuntime,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliConnectCommand } from '../../src/commands/connect-command.js';
import { CliAgentOnboardingPreset } from '../../src/constants/cli-agent-onboarding.constant.js';
import { CliConnectAction } from '../../src/constants/cli-connect.constant.js';
import {
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import { CliAgentOnboardingRuntime } from '../../src/runtime/agent-onboarding-runtime.js';
import { CliAgentProjectionRuntime } from '../../src/runtime/agent-projection-runtime.js';
import type { CliCommandExecutorContext } from '../../src/types/index.js';
import type { CliCommandProgressEvent } from '../../src/types/index.js';

describe('CliConnectCommand', () => {
  it('attaches a shared React shell view model when ui_mode=react', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'connect-command-'));
    const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');

    try {
      const progressEvents: CliCommandProgressEvent[] = [];
      const context = {
        options: {
          currentWorkingDirectory: tempRoot,
          configSource: 'file',
          config: {
            schemaVersion: '1.1',
            workspace: {
              mode: WorkspaceMode.REPO_LOCAL,
              migrationPolicy: 'copy_verify_switch_rollback',
            },
            i18n: {
              runtimeEngine: 'i18next',
              defaultLocale: 'en-US',
              fallbackLocale: 'zh-CN',
              supportedLocales: ['en-US', 'zh-CN'],
            },
            adapters: {
              roles: [
                {
                  roleId: 'planner',
                  roleProfileId: 'planner-default',
                  requiredCapabilities: ['structured_output'],
                  required: true,
                },
                {
                  roleId: 'coder',
                  roleProfileId: 'coder-default',
                  requiredCapabilities: ['tool_calling'],
                  required: true,
                },
                {
                  roleId: 'reviewer',
                  roleProfileId: 'reviewer-default',
                  requiredCapabilities: ['structured_output'],
                  required: true,
                },
              ],
              routing: {
                roleBindings: {
                  planner: {
                    primarySurface: 'codex',
                    fallbackSurfaces: ['claude-code'],
                  },
                  coder: {
                    primarySurface: 'codex',
                    fallbackSurfaces: ['github-copilot'],
                  },
                  reviewer: {
                    primarySurface: 'claude-code',
                    fallbackSurfaces: ['codex'],
                  },
                },
              },
              tools: [
                { toolId: 'codex', enabled: true, availability: 'available' },
                { toolId: 'claude-code', enabled: true, availability: 'available' },
                { toolId: 'github-copilot', enabled: true, availability: 'available' },
              ],
            },
          },
          adaptersConfig: {
            roles: [
              {
                roleId: 'planner',
                roleProfileId: 'planner-default',
                requiredCapabilities: ['structured_output'],
                required: true,
              },
              {
                roleId: 'coder',
                roleProfileId: 'coder-default',
                requiredCapabilities: ['tool_calling'],
                required: true,
              },
              {
                roleId: 'reviewer',
                roleProfileId: 'reviewer-default',
                requiredCapabilities: ['structured_output'],
                required: true,
              },
            ],
            routing: {
              roleBindings: {
                planner: {
                  primarySurface: 'codex',
                  fallbackSurfaces: ['claude-code'],
                },
                coder: {
                  primarySurface: 'codex',
                  fallbackSurfaces: ['github-copilot'],
                },
                reviewer: {
                  primarySurface: 'claude-code',
                  fallbackSurfaces: ['codex'],
                },
              },
            },
            tools: [
              { toolId: 'codex', enabled: true, availability: 'available' },
              { toolId: 'claude-code', enabled: true, availability: 'available' },
              { toolId: 'github-copilot', enabled: true, availability: 'available' },
            ],
          },
          workspace: {
            workspaceId: 'test-workspace',
            repositoryRoot: tempRoot,
            workspaceRoot,
            configPath: resolve(workspaceRoot, 'governor.yaml'),
            mode: WorkspaceMode.REPO_LOCAL,
            modeSource: 'runtime',
          },
          locale: 'en-US',
          outputMode: ErrorOutputEnvironment.PRETTY,
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
          safeReadJson: async (filePath: string) =>
            JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>,
        },
        onboardingRuntime: new CliAgentOnboardingRuntime(),
        agentProjectionRuntime: new CliAgentProjectionRuntime(),
        progressSink: {
          publish: (event: CliCommandProgressEvent) => {
            progressEvents.push(event);
          },
        },
        adapterDiagnosticsRuntime: {
          createAdapterVerificationArtifactPayload: (verification: unknown) => verification,
          createAdapterRoleProgressRows: () => [
            {
              roleId: 'planner',
              stage: ExecutionProgressStage.CONNECT,
              status: ExecutionProgressStatus.WARNING,
              category: ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
              summary: 'adapter verification requires attention',
            },
          ],
          createAdapterInteractionPrompts: () => [
            {
              category: ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
              stage: ExecutionProgressStage.CONNECT,
              title: 'Adapter route attention',
              action: 'Install the missing local command before the next connect run.',
              blocking: false,
            },
          ],
        },
        reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
        orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
        commandExperienceBuilder: {
          buildExperiencePayload: (payload: unknown) => payload,
        },
        executeRunCommand: async () => {
          throw new RuntimeError(
            GovernorErrorCode.UNKNOWN,
            'executeRunCommand is not used in connect-command tests.',
          );
        },
        calculateCheckTotals: (checks: Array<{ status: string }>) => ({
          pass: checks.filter((check) => check.status === 'pass').length,
          warn: checks.filter((check) => check.status === 'warn').length,
          fail: checks.filter((check) => check.status === 'fail').length,
        }),
        buildDefaultConfigContent: () => '',
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
          adapters: true,
          fix: false,
          presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
          requestedTools: [],
          overwrite: false,
          singleToolAllRoles: false,
          roleBindingOverrides: [],
          recordLedger: true,
          taskId: 'TK-309',
          restrictedNetwork: false,
          restrictedReason: null,
          allowLocalFallback: true,
          hitlDecision: null,
          hitlDecisionReason: null,
          hitlResumeAction: null,
          hitlDecidedBy: null,
          hitlConstraints: [],
        }),
        resolveExecutionStreamMetadata: async () => ({}),
        resolveAdapterVerification: async () => ({
          overallStatus: CliGovernanceCheckStatus.WARN,
          requiredRoleCount: 3,
          requiredRoleFailedCount: 0,
          degradedRoleCount: 1,
          fallbackRoleCount: 1,
          nextActions: ['Install missing local command.'],
          roleEvaluations: [
            {
              roleId: 'planner',
              roleProfileId: 'planner-default',
              primarySurface: 'codex',
              selectedSurface: 'codex',
              selectedBy: 'primary',
              status: CliGovernanceCheckStatus.PASS,
              unavailableReasons: [],
              degradedCapabilities: [],
              unsupportedCapabilities: [],
            },
            {
              roleId: 'coder',
              roleProfileId: 'coder-default',
              primarySurface: 'codex',
              selectedSurface: 'github-copilot',
              selectedBy: 'fallback',
              status: CliGovernanceCheckStatus.WARN,
              unavailableReasons: [],
              degradedCapabilities: [],
              unsupportedCapabilities: [],
            },
          ],
        }),
        resolveAdapterVerificationForConfig: async () =>
          ({
            overallStatus: CliGovernanceCheckStatus.WARN,
            requiredRoleCount: 3,
            requiredRoleFailedCount: 0,
            degradedRoleCount: 1,
            fallbackRoleCount: 1,
            nextActions: ['Install missing local command.'],
            roleEvaluations: [
              {
                roleId: 'planner',
                roleProfileId: 'planner-default',
                primarySurface: 'codex',
                selectedSurface: 'codex',
                selectedBy: 'primary',
                status: CliGovernanceCheckStatus.PASS,
                unavailableReasons: [],
                degradedCapabilities: [],
                unsupportedCapabilities: [],
              },
              {
                roleId: 'coder',
                roleProfileId: 'coder-default',
                primarySurface: 'codex',
                selectedSurface: 'github-copilot',
                selectedBy: 'fallback',
                status: CliGovernanceCheckStatus.WARN,
                unavailableReasons: [],
                degradedCapabilities: [],
                unsupportedCapabilities: [],
              },
            ],
          }) as Awaited<ReturnType<CliCommandExecutorContext['resolveAdapterVerification']>>,
        validateGovernorConfig: (candidate: unknown) =>
          new SchemaValidator().validateOrThrow(candidate),
        canWritePath: async () => true,
        translate: (key: string, interpolation?: Record<string, string>) =>
          i18nRuntime.t(key, interpolation),
        localizeText: (english: string) => english,
        runNodeScript: async () => ({
          stdout: '',
          stderr: '',
        }),
      } as unknown as CliCommandExecutorContext;

      const command = new CliConnectCommand();
      const result = await command.execute(context);
      const ledgerArtifactPath = String(
        result.commandResult.artifacts?.find(
          (artifact) => artifact.id === 'connect_ledger_backfill',
        )?.path,
      );
      const ledgerPayload = JSON.parse(await readFile(ledgerArtifactPath, 'utf8')) as {
        status?: string;
        taskId?: string;
      };

      expect(result.reactCliViewModel?.title).toContain('[react-shell:connect]');
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        `Workspace root: ${workspaceRoot}`,
      );
      expect(
        result.reactCliViewModel?.attentionSection?.lines.some((line) =>
          line.includes('Adapter Verification'),
        ),
      ).toBe(true);
      expect(
        result.reactCliViewModel?.helpSection?.lines.some((line) =>
          line.includes('Adapter route attention'),
        ),
      ).toBe(true);
      expect(result.reactCliViewModel?.agentProjectionPanel?.title).toBe('Agent projection');
      expect(result.reactCliViewModel?.agentProjectionPanel?.summaryBadges).toEqual([
        'fallback=1',
        'degraded=1',
        'blocked=0',
        'session=none',
      ]);
      expect(result.reactCliViewModel?.agentProjectionPanel?.rows[0]?.title).toBe(
        'coder -> github-copilot',
      );
      expect(result.reactCliViewModel?.agentProjectionPanel?.rows[0]?.detailLines).toContain(
        'profile=coder-default selected_by=fallback status=warn',
      );
      expect(progressEvents[0]?.runState).toBe('running');
      expect(progressEvents[0]?.row?.id).toBe('candidate-config');
      expect(progressEvents.some((event) => event.row?.id === 'adapter-verification')).toBe(true);
      expect(progressEvents.some((event) => event.row?.id === 'agent-projection')).toBe(true);
      expect(progressEvents.at(-1)?.runState).toBe('success');
      expect(progressEvents.at(-1)?.artifact?.id).toBe('diagnostics');
      expect(ledgerPayload.status).toBe(CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING);
      expect(ledgerPayload.taskId).toBe('TK-309');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('surfaces cancellation when connect receives an aborted signal', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'connect-command-cancel-'));
    const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');

    try {
      const progressEvents: CliCommandProgressEvent[] = [];
      const abortController = new AbortController();
      abortController.abort();
      const context = {
        options: {
          currentWorkingDirectory: tempRoot,
          configSource: 'default',
          config: {
            schemaVersion: '1.1',
            workspace: {
              mode: WorkspaceMode.REPO_LOCAL,
              migrationPolicy: 'copy_verify_switch_rollback',
            },
            i18n: {
              runtimeEngine: 'i18next',
              defaultLocale: 'en-US',
              fallbackLocale: 'zh-CN',
              supportedLocales: ['en-US', 'zh-CN'],
            },
            adapters: {
              roles: [],
              routing: {
                roleBindings: {},
              },
            },
          },
          adaptersConfig: {
            roles: [],
            routing: {
              roleBindings: {},
            },
          },
          workspace: {
            workspaceId: 'test-workspace',
            repositoryRoot: tempRoot,
            workspaceRoot,
            configPath: resolve(workspaceRoot, 'governor.yaml'),
            mode: WorkspaceMode.REPO_LOCAL,
            modeSource: 'runtime',
          },
          locale: 'en-US',
          outputMode: ErrorOutputEnvironment.PRETTY,
        },
        abortSignal: abortController.signal,
        progressSink: {
          publish: (event: CliCommandProgressEvent) => {
            progressEvents.push(event);
          },
        },
        artifactWriter: {
          writeTextArtifact: async () => undefined,
          writeJsonArtifact: async () => undefined,
          safeReadJson: async () => null,
        },
        onboardingRuntime: new CliAgentOnboardingRuntime(),
        agentProjectionRuntime: new CliAgentProjectionRuntime(),
        adapterDiagnosticsRuntime: {
          createAdapterVerificationArtifactPayload: (verification: unknown) => verification,
          createAdapterRoleProgressRows: () => [],
          createAdapterInteractionPrompts: () => [],
        },
        reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
        orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
        commandExperienceBuilder: {
          buildExperiencePayload: (payload: unknown) => payload,
        },
        executeRunCommand: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused');
        },
        calculateCheckTotals: () => ({
          pass: 0,
          warn: 0,
          fail: 0,
        }),
        buildDefaultConfigContent: () => '',
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
          adapters: true,
          fix: false,
          connectAction: CliConnectAction.GENERATE,
          connectCandidatePath: null,
          connectLatest: false,
          connectForce: false,
          connectRollbackEnabled: true,
          connectWriteMode: null,
          presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
          requestedTools: [],
          overwrite: false,
          singleToolAllRoles: false,
          roleBindingOverrides: [],
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
        resolveExecutionStreamMetadata: async () => ({}),
        resolveAdapterVerification: async () => ({
          overallStatus: CliGovernanceCheckStatus.PASS,
          requiredRoleCount: 0,
          requiredRoleFailedCount: 0,
          degradedRoleCount: 0,
          fallbackRoleCount: 0,
          nextActions: [],
          roleEvaluations: [],
        }),
        resolveAdapterVerificationForConfig: async () => ({
          overallStatus: CliGovernanceCheckStatus.PASS,
          requiredRoleCount: 0,
          requiredRoleFailedCount: 0,
          degradedRoleCount: 0,
          fallbackRoleCount: 0,
          nextActions: [],
          roleEvaluations: [],
        }),
        validateGovernorConfig: (candidate: unknown) =>
          new SchemaValidator().validateOrThrow(candidate),
        canWritePath: async () => true,
        translate: (key: string, interpolation?: Record<string, string>) =>
          i18nRuntime.t(key, interpolation),
        localizeText: (english: string) => english,
        runNodeScript: async () => ({
          stdout: '',
          stderr: '',
        }),
      } as unknown as CliCommandExecutorContext;

      const command = new CliConnectCommand();

      await expect(command.execute(context)).rejects.toMatchObject({
        code: GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      });
      expect(progressEvents[0]?.cancelCapability).toBe('supported');
      expect(progressEvents.at(-1)?.runState).toBe('cancelled');
      expect(progressEvents.at(-1)?.statusLine).toBe('Connect execution was cancelled.');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('passes the live command abort signal into adapter verification', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'connect-command-abort-signal-'));
    const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
    const abortController = new AbortController();
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');

    try {
      const resolveAdapterVerificationForConfig = vi.fn(
        async (_adaptersConfig: unknown, abortSignal?: AbortSignal) => {
          expect(abortSignal).toBe(abortController.signal);
          return {
            overallStatus: CliGovernanceCheckStatus.PASS,
            requiredRoleCount: 0,
            requiredRoleFailedCount: 0,
            degradedRoleCount: 0,
            fallbackRoleCount: 0,
            nextActions: [],
            roleEvaluations: [],
          };
        },
      );
      const context = {
        options: {
          currentWorkingDirectory: tempRoot,
          configSource: 'file',
          config: {
            schemaVersion: '1.1',
            workspace: {
              mode: WorkspaceMode.REPO_LOCAL,
              migrationPolicy: 'copy_verify_switch_rollback',
            },
            i18n: {
              runtimeEngine: 'i18next',
              defaultLocale: 'en-US',
              fallbackLocale: 'zh-CN',
              supportedLocales: ['en-US', 'zh-CN'],
            },
            adapters: {
              roles: [],
              routing: {
                roleBindings: {},
              },
              tools: [{ toolId: 'codex', enabled: true, availability: 'available' }],
            },
          },
          adaptersConfig: {
            roles: [],
            routing: {
              roleBindings: {},
            },
            tools: [{ toolId: 'codex', enabled: true, availability: 'available' }],
          },
          workspace: {
            workspaceId: 'test-workspace',
            repositoryRoot: tempRoot,
            workspaceRoot,
            configPath: resolve(workspaceRoot, 'governor.yaml'),
            mode: WorkspaceMode.REPO_LOCAL,
            modeSource: 'runtime',
          },
          locale: 'en-US',
          outputMode: ErrorOutputEnvironment.PRETTY,
        },
        abortSignal: abortController.signal,
        artifactWriter: {
          writeTextArtifact: async () => undefined,
          writeJsonArtifact: async () => undefined,
          safeReadJson: async () => null,
        },
        onboardingRuntime: new CliAgentOnboardingRuntime(),
        agentProjectionRuntime: new CliAgentProjectionRuntime(),
        progressSink: {
          publish: () => undefined,
        },
        adapterDiagnosticsRuntime: {
          createAdapterVerificationArtifactPayload: (verification: unknown) => verification,
          createAdapterRoleProgressRows: () => [],
          createAdapterInteractionPrompts: () => [],
        },
        reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
        orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
        commandExperienceBuilder: {
          buildExperiencePayload: (payload: unknown) => payload,
        },
        executeRunCommand: async () => {
          throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'unused');
        },
        calculateCheckTotals: () => ({
          pass: 0,
          warn: 0,
          fail: 0,
        }),
        buildDefaultConfigContent: () => '',
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
          adapters: true,
          fix: false,
          connectAction: CliConnectAction.GENERATE,
          connectCandidatePath: null,
          connectLatest: false,
          connectForce: false,
          connectRollbackEnabled: true,
          connectWriteMode: null,
          presetId: CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
          requestedTools: [],
          overwrite: false,
          singleToolAllRoles: false,
          roleBindingOverrides: [],
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
        resolveExecutionStreamMetadata: async () => ({}),
        resolveAdapterVerification: async () => ({
          overallStatus: CliGovernanceCheckStatus.PASS,
          requiredRoleCount: 0,
          requiredRoleFailedCount: 0,
          degradedRoleCount: 0,
          fallbackRoleCount: 0,
          nextActions: [],
          roleEvaluations: [],
        }),
        resolveAdapterVerificationForConfig,
        validateGovernorConfig: (candidate: unknown) =>
          new SchemaValidator().validateOrThrow(candidate),
        canWritePath: async () => true,
        translate: (key: string, interpolation?: Record<string, string>) =>
          i18nRuntime.t(key, interpolation),
        localizeText: (english: string) => english,
        runNodeScript: async () => ({
          stdout: '',
          stderr: '',
        }),
      } as unknown as CliCommandExecutorContext;

      const command = new CliConnectCommand();
      await command.execute(context);

      expect(resolveAdapterVerificationForConfig).toHaveBeenCalledTimes(1);
      expect(resolveAdapterVerificationForConfig.mock.calls[0]?.[1]).toBe(abortController.signal);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
