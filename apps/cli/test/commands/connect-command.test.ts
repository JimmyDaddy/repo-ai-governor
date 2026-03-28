import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import { WorkspaceMode } from '@repo-ai-governor/config';
import {
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
import {
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CliGovernanceCheckStatus,
} from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import type { CliCommandExecutorContext } from '../../src/types/index.js';

describe('CliConnectCommand', () => {
  it('attaches a shared React shell view model when ui_mode=react', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'connect-command-'));
    const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
    const i18nRuntime = new I18nRuntime();
    await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');

    try {
      const context = {
        options: {
          currentWorkingDirectory: tempRoot,
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
          uiMode: CliInteractiveUiMode.REACT,
          uiFallbackBehavior: null,
          inputTty: true,
          stderrTty: true,
          dryRun: false,
          trace: false,
          replayPath: null,
          adapters: true,
          fix: false,
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
        }),
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
      expect(ledgerPayload.status).toBe(CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING);
      expect(ledgerPayload.taskId).toBe('TK-309');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
