import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import {
  ErrorOutputEnvironment,
  GovernorErrorCode,
  Locale,
  RuntimeError,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { CliInitCommand } from '../../src/commands/init-command.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import type { CliInitReactShellRunner } from '../../src/runtime/interactive-shell/init-react-shell-runner.js';
import type { CliCommandExecutorContext } from '../../src/types/index.js';

async function createInitCommandFixture(): Promise<{
  tempRoot: string;
  workspaceRoot: string;
  configPath: string;
  buildContext: () => CliCommandExecutorContext;
}> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'init-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  const configPath = resolve(workspaceRoot, 'governor.yaml');

  return {
    tempRoot,
    workspaceRoot,
    configPath,
    buildContext: () =>
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
          locale: Locale.EN_US,
          outputMode: ErrorOutputEnvironment.PRETTY,
          isTty: true,
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
            '',
          ].join('\n'),
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
        resolveExecutionStreamMetadata: async () => ({}),
        resolveAdapterVerification: async () => ({
          allRequiredRolesSatisfied: true,
          requiredRoleEvaluations: [],
          optionalRoleEvaluations: [],
          tools: [],
        }),
        canWritePath: async () => true,
        localizeText: (english: string) => english,
        translate: (key: string) => key,
        adapterDiagnosticsRuntime: {} as CliCommandExecutorContext['adapterDiagnosticsRuntime'],
        runNodeScript: async () => ({
          stdout: '',
          stderr: '',
        }),
      }) as unknown as CliCommandExecutorContext,
  };
}

describe('CliInitCommand', () => {
  it('uses normalized input/stderr tty flags for the react shell path', async () => {
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
      const result = await command.execute(fixture.buildContext());
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
      expect(configContent).toContain(`mode: ${WorkspaceMode.REPO_LOCAL}`);
      expect(configContent).toContain(`defaultLocale: ${Locale.EN_US}`);
      expect(configContent).toContain(`fallbackLocale: ${Locale.ZH_CN}`);
      expect(manifestPayload.workspaceMode).toBe(WorkspaceMode.REPO_LOCAL);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
