import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import type {
  GovernorConfig,
  WorkspaceMigrationPlan,
  WorkspaceMigrationStepResult,
} from '@repo-ai-governor/config';
import {
  ConfigLoader,
  WorkspaceMigrationStep,
  WorkspaceMigrationStepStatus,
  WorkspaceMode,
  WorkspaceModeSource,
} from '@repo-ai-governor/config';
import {
  DEFAULT_I18N_RUNTIME_CONFIG,
  ErrorOutputEnvironment,
  GovernorErrorCode,
  I18nRuntime,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import { CliWorkspaceCommand } from '../../src/commands/workspace-command.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import type {
  CliCommandExecutorContext,
  CliWorkspaceCommandOptions,
} from '../../src/types/index.js';

interface WorkspaceCommandFixture {
  tempRoot: string;
  workspaceRoot: string;
  managedWorkspaceRoot: string;
  configPath: string;
  context: CliCommandExecutorContext;
}

async function createWorkspaceCommandFixture(
  workspaceCommandOptions: CliWorkspaceCommandOptions,
): Promise<WorkspaceCommandFixture> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'workspace-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  const managedWorkspaceRoot = resolve(tempRoot, 'managed-root');
  const configPath = resolve(workspaceRoot, 'governor.yaml');
  await mkdir(resolve(workspaceRoot, 'context', 'memory'), { recursive: true });
  await writeFile(
    configPath,
    [
      'schemaVersion: "1.1"',
      'workspace:',
      '  mode: repo_local',
      '  migrationPolicy: copy_verify_switch_rollback',
      'i18n:',
      '  runtimeEngine: i18next',
      '  defaultLocale: en-US',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - en-US',
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(resolve(workspaceRoot, 'context', 'state.txt'), 'repo-local-state\n', 'utf8');

  const artifactWriter = {
    writeTextArtifact: async (filePath: string, content: string) => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, 'utf8');
    },
    writeJsonArtifact: async (filePath: string, payload: unknown) => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    },
    safeReadJson: async (filePath: string) => {
      try {
        return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
  };
  const i18nRuntime = new I18nRuntime();
  await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');

  const context = {
    options: {
      currentWorkingDirectory: tempRoot,
      workspace: {
        workspaceId: 'test-workspace',
        mode: WorkspaceMode.REPO_LOCAL,
        modeSource: WorkspaceModeSource.RUNTIME,
        repositoryRoot: tempRoot,
        workspaceRoot,
        configPath,
      },
      locale: 'en-US',
      outputMode: 'plain',
      workspaceCommandOptions,
    },
    artifactWriter,
    reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
    orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
    commandExperienceBuilder: {
      buildExperiencePayload: (payload: unknown) => payload,
    },
    executeRunCommand: async () => {
      throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'executeRunCommand is not used.');
    },
    calculateCheckTotals: (checks: Array<{ status: string }>) => ({
      pass: checks.filter((check) => check.status === 'pass').length,
      warn: checks.filter((check) => check.status === 'warn').length,
      fail: checks.filter((check) => check.status === 'fail').length,
    }),
    buildDefaultConfigContent: () => '',
    toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, 'Z'),
    formatExecFailureDetail: (error: unknown) => standardizeError(error).message,
    resolveRuntimeDebugOptions: () => ({
      interactive: false,
      requestedUiMode: null,
      uiMode: CliInteractiveUiMode.NONE,
      uiFallbackBehavior: null,
      inputTty: false,
      stderrTty: false,
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
    translate: (key: string, interpolation?: Record<string, string>) =>
      i18nRuntime.t(key, interpolation),
    localizeText: (english: string) => english,
    adapterDiagnosticsRuntime: {} as CliCommandExecutorContext['adapterDiagnosticsRuntime'],
    runNodeScript: async () => ({
      stdout: '',
      stderr: '',
    }),
  } as unknown as CliCommandExecutorContext;

  return {
    tempRoot,
    workspaceRoot,
    managedWorkspaceRoot,
    configPath,
    context,
  };
}

describe('CliWorkspaceCommand', () => {
  it('generates a workspace migration dry-run plan artifact', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'dry-run',
      targetMode: WorkspaceMode.TOOL_MANAGED,
      targetRoot: null,
      planPath: null,
    });

    try {
      fixture.context.options.workspaceCommandOptions = {
        action: 'dry-run',
        targetMode: WorkspaceMode.TOOL_MANAGED,
        targetRoot: fixture.managedWorkspaceRoot,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      const result = await command.execute(fixture.context);
      const planPath = result.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'workspace_migration_plan',
      )?.path;

      expect(result.commandResult.operation).toBe('workspace_migration_plan');
      expect(result.commandResult.details?.action).toBe('dry_run');
      expect(typeof planPath).toBe('string');
      expect(existsSync(String(planPath))).toBe(true);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('attaches a shared React shell view model when ui_mode=react', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'dry-run',
      targetMode: WorkspaceMode.TOOL_MANAGED,
      targetRoot: null,
      planPath: null,
    });

    try {
      fixture.context.resolveRuntimeDebugOptions = () => ({
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
      });
      fixture.context.options.outputMode = ErrorOutputEnvironment.PRETTY;
      fixture.context.options.workspaceCommandOptions = {
        action: 'dry-run',
        targetMode: WorkspaceMode.TOOL_MANAGED,
        targetRoot: fixture.managedWorkspaceRoot,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      const result = await command.execute(fixture.context);

      expect(result.reactCliViewModel?.title).toContain('[react-shell:workspace]');
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain('Workspace action: dry-run');
      expect(
        result.reactCliViewModel?.sections[0]?.lines.some((line) =>
          line.includes(fixture.managedWorkspaceRoot),
        ),
      ).toBe(true);
      expect(
        result.reactCliViewModel?.helpSection?.lines.some((line) => line.includes('Inspect')),
      ).toBe(true);
      expect(result.reactCliViewModel?.footerShortcuts).toContain(
        '--workspace-action rollback restores prior state',
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('persists cutover state and restores it during explicit rollback', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'execute',
      targetMode: WorkspaceMode.TOOL_MANAGED,
      targetRoot: null,
      planPath: null,
    });

    try {
      fixture.context.options.workspaceCommandOptions = {
        action: 'execute',
        targetMode: WorkspaceMode.TOOL_MANAGED,
        targetRoot: fixture.managedWorkspaceRoot,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();
      const executeResult = await command.execute(fixture.context);
      const planPath = executeResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'workspace_migration_plan',
      )?.path;
      const executionPath = executeResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'workspace_migration_execution',
      )?.path;
      const targetWorkspaceRoot = String(
        executeResult.commandResult.details?.target_workspace_root,
      );
      const migrationId = String(executeResult.commandResult.details?.migration_id);
      const repoLocalConfigLoader = new ConfigLoader();

      expect(executeResult.commandResult.operation).toBe('workspace_migration_execute');
      expect(existsSync(targetWorkspaceRoot)).toBe(true);
      expect(typeof planPath).toBe('string');
      expect(typeof executionPath).toBe('string');
      expect(String(planPath)).toContain(targetWorkspaceRoot);
      expect(String(executionPath)).toContain(targetWorkspaceRoot);
      expect(existsSync(String(planPath))).toBe(true);
      expect(existsSync(String(executionPath))).toBe(true);
      expect(repoLocalConfigLoader.loadFromFile(fixture.configPath).workspace).toEqual({
        mode: WorkspaceMode.TOOL_MANAGED,
        toolManagedRoot: fixture.managedWorkspaceRoot,
        migrationPolicy: 'copy_verify_switch_rollback',
      });
      expect(
        repoLocalConfigLoader.loadFromFile(resolve(targetWorkspaceRoot, 'governor.yaml')).workspace,
      ).toEqual({
        mode: WorkspaceMode.TOOL_MANAGED,
        toolManagedRoot: fixture.managedWorkspaceRoot,
        migrationPolicy: 'copy_verify_switch_rollback',
      });

      fixture.context.options.workspace.workspaceRoot = targetWorkspaceRoot;
      fixture.context.options.workspace.configPath = resolve(targetWorkspaceRoot, 'governor.yaml');
      fixture.context.options.workspaceCommandOptions = {
        action: 'rollback',
        targetMode: null,
        targetRoot: null,
        planPath: String(planPath),
      };
      const rollbackResult = await command.execute(fixture.context);

      expect(rollbackResult.commandResult.operation).toBe('workspace_migration_rollback');
      expect(existsSync(targetWorkspaceRoot)).toBe(false);
      expect(existsSync(resolve(targetWorkspaceRoot, 'context', 'workspace'))).toBe(false);
      expect(
        (rollbackResult.commandResult.details as Record<string, unknown> | undefined)
          ?.scratch_cleanup_status,
      ).toBe('removed');
      expect(repoLocalConfigLoader.loadFromFile(fixture.configPath).workspace).toEqual({
        mode: WorkspaceMode.REPO_LOCAL,
        migrationPolicy: 'copy_verify_switch_rollback',
      });
      const rollbackArtifactPath = String(
        rollbackResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === 'workspace_migration_rollback',
        )?.path,
      );
      expect(rollbackArtifactPath).toContain(fixture.workspaceRoot);
      expect(
        existsSync(resolve(fixture.tempRoot, '.repo-ai-governor-migration', migrationId)),
      ).toBe(false);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('allows rollback to proceed from the persisted plan even when the current config path is missing', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'execute',
      targetMode: WorkspaceMode.TOOL_MANAGED,
      targetRoot: null,
      planPath: null,
    });

    try {
      fixture.context.options.workspaceCommandOptions = {
        action: 'execute',
        targetMode: WorkspaceMode.TOOL_MANAGED,
        targetRoot: fixture.managedWorkspaceRoot,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();
      const executeResult = await command.execute(fixture.context);
      const planPath = String(
        executeResult.commandResult.artifacts?.find(
          (artifact) => artifact.id === 'workspace_migration_plan',
        )?.path,
      );
      const targetWorkspaceRoot = String(
        executeResult.commandResult.details?.target_workspace_root,
      );

      fixture.context.options.workspace.workspaceRoot = targetWorkspaceRoot;
      fixture.context.options.workspace.configPath = resolve(
        fixture.tempRoot,
        'missing-governor.yaml',
      );
      fixture.context.options.workspaceCommandOptions = {
        action: 'rollback',
        targetMode: null,
        targetRoot: null,
        planPath,
      };

      const rollbackResult = await command.execute(fixture.context);

      expect(rollbackResult.commandResult.operation).toBe('workspace_migration_rollback');
      expect(existsSync(targetWorkspaceRoot)).toBe(false);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('writes a failure summary artifact when workspace execution fails', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'execute',
      targetMode: WorkspaceMode.REPO_LOCAL,
      targetRoot: resolve(process.cwd(), 'ignored'),
      planPath: null,
    });

    const plan: WorkspaceMigrationPlan = {
      migrationId: 'migration-failure',
      sourceWorkspace: {
        workspaceId: 'test-workspace',
        mode: WorkspaceMode.REPO_LOCAL,
        modeSource: WorkspaceModeSource.RUNTIME,
        repositoryRoot: fixture.tempRoot,
        workspaceRoot: fixture.workspaceRoot,
        configPath: fixture.configPath,
      },
      targetWorkspace: {
        workspaceId: 'test-workspace',
        mode: WorkspaceMode.REPO_LOCAL,
        modeSource: WorkspaceModeSource.RUNTIME,
        repositoryRoot: fixture.tempRoot,
        workspaceRoot: resolve(fixture.tempRoot, '.repo-ai-governor-target'),
        configPath: resolve(fixture.tempRoot, '.repo-ai-governor-target', 'governor.yaml'),
      },
      stagingWorkspaceRoot: resolve(fixture.tempRoot, '.repo-ai-governor-migration', 'staging'),
      backupWorkspaceRoot: resolve(fixture.tempRoot, '.repo-ai-governor-migration', 'backup'),
      previousTargetBackupRoot: resolve(
        fixture.tempRoot,
        '.repo-ai-governor-migration',
        'backup',
        'previous-target',
      ),
    };
    const steps: WorkspaceMigrationStepResult[] = [
      {
        step: WorkspaceMigrationStep.COPY,
        status: WorkspaceMigrationStepStatus.SUCCEEDED,
        message: 'copy completed',
      },
      {
        step: WorkspaceMigrationStep.VERIFY,
        status: WorkspaceMigrationStepStatus.FAILED,
        message: 'verify failed',
      },
      {
        step: WorkspaceMigrationStep.ROLLBACK,
        status: WorkspaceMigrationStepStatus.SUCCEEDED,
        message: 'rollback completed',
      },
    ];
    const command = new CliWorkspaceCommand({
      configLoader: {
        loadFromFile: () =>
          ({
            schemaVersion: '1.1',
            workspace: {
              mode: WorkspaceMode.REPO_LOCAL,
            },
            i18n: {
              runtimeEngine: 'i18next',
              defaultLocale: 'en-US',
              fallbackLocale: 'en-US',
              supportedLocales: ['en-US'],
            },
          }) as GovernorConfig,
      },
      workspaceMigrationService: {
        plan: () => plan,
        execute: async () => ({
          success: false,
          plan,
          steps,
          error: {
            code: GovernorErrorCode.WORKSPACE_MIGRATION_VERIFY_FAILED,
            message: 'verify failed',
          },
        }),
        rollback: async () => ({
          step: WorkspaceMigrationStep.ROLLBACK,
          status: WorkspaceMigrationStepStatus.SUCCEEDED,
          message: 'rollback completed',
        }),
      },
    });

    try {
      fixture.context.options.workspaceCommandOptions = {
        action: 'execute',
        targetMode: WorkspaceMode.REPO_LOCAL,
        targetRoot: resolve(fixture.tempRoot, '.repo-ai-governor-target'),
        planPath: null,
      };
      let caughtError: RuntimeError | null = null;
      try {
        await command.execute(fixture.context);
      } catch (error) {
        caughtError = error as RuntimeError;
      }

      expect(caughtError).toBeInstanceOf(RuntimeError);
      expect(caughtError?.code).toBe(GovernorErrorCode.WORKSPACE_MIGRATION_VERIFY_FAILED);
      const reportPath = String(caughtError?.details?.reportPath);
      expect(existsSync(reportPath)).toBe(true);
      const failureSummary = JSON.parse(await readFile(reportPath, 'utf8')) as {
        failedStep?: string;
        steps?: Array<{ step?: string; status?: string }>;
      };
      expect(failureSummary.failedStep).toBe('verify');
      expect(failureSummary.steps?.length).toBe(steps.length);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
