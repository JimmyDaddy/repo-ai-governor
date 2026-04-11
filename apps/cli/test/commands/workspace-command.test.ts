import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { vi } from 'vitest';

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
  WorkspaceResolver,
} from '@repo-ai-governor/config';
import {
  CliReactThemePreset,
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

const execFileAsync = promisify(execFile);

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
      'ui:',
      '  react:',
      `    theme: ${CliReactThemePreset.GOVERNOR}`,
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
      requestedUiTheme: null,
      uiMode: CliInteractiveUiMode.NONE,
      uiTheme: CliReactThemePreset.GOVERNOR,
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

async function initializeGitRepository(repositoryRoot: string): Promise<void> {
  await execFileAsync('git', ['init', '-b', 'main'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['config', 'commit.gpgSign', 'false'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['config', 'user.email', 'codex@example.com'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['config', 'user.name', 'Codex Test'], {
    cwd: repositoryRoot,
  });
  await writeFile(resolve(repositoryRoot, 'README.md'), '# workspace command fixture\n', 'utf8');
  await execFileAsync('git', ['add', '.'], {
    cwd: repositoryRoot,
  });
  await execFileAsync('git', ['commit', '--no-verify', '-m', 'chore: seed workspace fixture'], {
    cwd: repositoryRoot,
  });
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

  it('clears both the repo-local selector config and the active tool-managed workspace config', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'clear-config',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      const toolManagedConfigContent = [
        'schemaVersion: "1.1"',
        'workspace:',
        '  mode: tool_managed',
        `  toolManagedRoot: ${fixture.managedWorkspaceRoot}`,
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
      ].join('\n');
      await writeFile(fixture.configPath, toolManagedConfigContent, 'utf8');

      const workspaceResolver = new WorkspaceResolver();
      const resolvedWorkspace = workspaceResolver.resolve({
        currentWorkingDirectory: fixture.tempRoot,
        config: new ConfigLoader().loadFromFile(fixture.configPath),
      });
      await mkdir(resolvedWorkspace.workspaceRoot, { recursive: true });
      await writeFile(resolvedWorkspace.configPath, toolManagedConfigContent, 'utf8');

      fixture.context.options.workspace = resolvedWorkspace;
      fixture.context.options.workspaceCommandOptions = {
        action: 'clear-config',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };

      const command = new CliWorkspaceCommand();
      const result = await command.execute(fixture.context);
      const clearedConfigPaths = String(
        result.commandResult.details?.cleared_config_paths ?? '',
      ).split(' | ');

      expect(result.commandResult.operation).toBe('workspace_config_clear');
      expect(result.commandResult.details?.action).toBe('clear_config');
      expect(result.commandResult.details?.cleared_path_count).toBe(2);
      expect(clearedConfigPaths).toEqual(
        expect.arrayContaining([fixture.configPath, resolvedWorkspace.configPath]),
      );
      expect(existsSync(fixture.configPath)).toBe(false);
      expect(existsSync(resolvedWorkspace.configPath)).toBe(false);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('returns a warning summary when no current workspace config files are present', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'clear-config',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await rm(fixture.configPath, { force: true });
      fixture.context.options.workspaceCommandOptions = {
        action: 'clear-config',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };

      const command = new CliWorkspaceCommand();
      const result = await command.execute(fixture.context);

      expect(result.commandResult.operation).toBe('workspace_config_clear');
      expect(result.commandResult.check_totals?.warn).toBe(1);
      expect(result.commandResult.details?.cleared_path_count).toBe(0);
      expect(result.commandResult.details?.cleared_config_paths).toBe('');
      expect(result.message).toContain('No current workspace config file was found');
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('persists the requested React shell theme into selector and active workspace configs', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'set-ui-theme',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      const toolManagedConfigContent = [
        'schemaVersion: "1.1"',
        'workspace:',
        '  mode: tool_managed',
        `  toolManagedRoot: ${fixture.managedWorkspaceRoot}`,
        '  migrationPolicy: copy_verify_switch_rollback',
        'i18n:',
        '  runtimeEngine: i18next',
        '  defaultLocale: en-US',
        '  fallbackLocale: en-US',
        '  supportedLocales:',
        '    - en-US',
        'ui:',
        '  react:',
        `    theme: ${CliReactThemePreset.GOVERNOR}`,
        'memory:',
        '  storeEngine: fs_csv',
        '  storeRoot: context/memory',
        '',
      ].join('\n');
      await writeFile(fixture.configPath, toolManagedConfigContent, 'utf8');

      const workspaceResolver = new WorkspaceResolver();
      const resolvedWorkspace = workspaceResolver.resolve({
        currentWorkingDirectory: fixture.tempRoot,
        config: new ConfigLoader().loadFromFile(fixture.configPath),
      });
      await mkdir(resolvedWorkspace.workspaceRoot, { recursive: true });
      await writeFile(resolvedWorkspace.configPath, toolManagedConfigContent, 'utf8');

      fixture.context.options.workspace = resolvedWorkspace;
      fixture.context.options.workspaceCommandOptions = {
        action: 'set-ui-theme',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      fixture.context.resolveRuntimeDebugOptions = () => ({
        interactive: false,
        requestedUiMode: null,
        requestedUiTheme: CliReactThemePreset.CATPPUCCIN,
        uiMode: CliInteractiveUiMode.NONE,
        uiTheme: CliReactThemePreset.CATPPUCCIN,
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
      });

      const command = new CliWorkspaceCommand();
      const result = await command.execute(fixture.context);
      const repoLocalConfig = new ConfigLoader().loadFromFile(fixture.configPath);
      const activeWorkspaceConfig = new ConfigLoader().loadFromFile(resolvedWorkspace.configPath);

      expect(result.commandResult.operation).toBe('workspace_ui_theme_set');
      expect(result.commandResult.details?.action).toBe('set_ui_theme');
      expect(result.commandResult.details?.ui_theme).toBe(CliReactThemePreset.CATPPUCCIN);
      expect(result.commandResult.details?.persisted_path_count).toBe(2);
      expect(repoLocalConfig.ui?.react?.theme).toBe(CliReactThemePreset.CATPPUCCIN);
      expect(activeWorkspaceConfig.ui?.react?.theme).toBe(CliReactThemePreset.CATPPUCCIN);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('rejects set-ui-theme when no explicit --ui-theme override is provided', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'set-ui-theme',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      fixture.context.options.workspaceCommandOptions = {
        action: 'set-ui-theme',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };

      const command = new CliWorkspaceCommand();

      await expect(command.execute(fixture.context)).rejects.toMatchObject({
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        message: expect.stringContaining('governor|catppuccin|calm'),
      });
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('opens the React selector when set-ui-theme omits the preset in interactive pretty mode', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'set-ui-theme',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      fixture.context.options.outputMode = ErrorOutputEnvironment.PRETTY;
      fixture.context.options.workspaceCommandOptions = {
        action: 'set-ui-theme',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      fixture.context.resolveRuntimeDebugOptions = () => ({
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
      });
      const selectorRun = vi.fn().mockResolvedValue(CliReactThemePreset.CALM);
      const command = new CliWorkspaceCommand({
        themeSelectRunner: {
          run: selectorRun,
        },
      });

      const result = await command.execute(fixture.context);
      const updatedConfig = new ConfigLoader().loadFromFile(fixture.configPath);

      expect(selectorRun).toHaveBeenCalledWith(
        expect.objectContaining({
          themeScope: 'workspace',
          currentTheme: CliReactThemePreset.GOVERNOR,
          uiTheme: CliReactThemePreset.GOVERNOR,
          outputMode: ErrorOutputEnvironment.PRETTY,
        }),
      );
      expect(result.commandResult.details?.ui_theme).toBe(CliReactThemePreset.CALM);
      expect(updatedConfig.ui?.react?.theme).toBe(CliReactThemePreset.CALM);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('does not create a repo-local selector config when set-ui-theme runs from tool-managed mode without one', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'set-ui-theme',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      const toolManagedConfigContent = [
        'schemaVersion: "1.1"',
        'workspace:',
        '  mode: tool_managed',
        `  toolManagedRoot: ${fixture.managedWorkspaceRoot}`,
        '  migrationPolicy: copy_verify_switch_rollback',
        'i18n:',
        '  runtimeEngine: i18next',
        '  defaultLocale: en-US',
        '  fallbackLocale: en-US',
        '  supportedLocales:',
        '    - en-US',
        'ui:',
        '  react:',
        `    theme: ${CliReactThemePreset.GOVERNOR}`,
        'memory:',
        '  storeEngine: fs_csv',
        '  storeRoot: context/memory',
        '',
      ].join('\n');
      const toolManagedSeedConfigPath = resolve(fixture.tempRoot, 'tool-managed-seed.yaml');
      await writeFile(toolManagedSeedConfigPath, toolManagedConfigContent, 'utf8');

      const workspaceResolver = new WorkspaceResolver();
      const resolvedWorkspace = workspaceResolver.resolve({
        currentWorkingDirectory: fixture.tempRoot,
        config: new ConfigLoader().loadFromFile(toolManagedSeedConfigPath),
      });
      await mkdir(resolvedWorkspace.workspaceRoot, { recursive: true });
      await writeFile(resolvedWorkspace.configPath, toolManagedConfigContent, 'utf8');
      await rm(fixture.configPath, { force: true });

      fixture.context.options.workspace = resolvedWorkspace;
      fixture.context.options.workspaceCommandOptions = {
        action: 'set-ui-theme',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      fixture.context.resolveRuntimeDebugOptions = () => ({
        interactive: false,
        requestedUiMode: null,
        requestedUiTheme: CliReactThemePreset.CALM,
        uiMode: CliInteractiveUiMode.NONE,
        uiTheme: CliReactThemePreset.CALM,
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
      });

      const command = new CliWorkspaceCommand();
      const result = await command.execute(fixture.context);
      const activeWorkspaceConfig = new ConfigLoader().loadFromFile(resolvedWorkspace.configPath);

      expect(result.commandResult.operation).toBe('workspace_ui_theme_set');
      expect(result.commandResult.details?.persisted_path_count).toBe(1);
      expect(result.commandResult.details?.persisted_config_paths).toBe(
        resolvedWorkspace.configPath,
      );
      expect(activeWorkspaceConfig.ui?.react?.theme).toBe(CliReactThemePreset.CALM);
      expect(existsSync(fixture.configPath)).toBe(false);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('persists the requested React shell theme into the canonical user-config file when theme-scope=global', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'set-ui-theme',
      targetMode: null,
      targetRoot: null,
      planPath: null,
      themeScope: 'global',
    });

    try {
      const globalPreferencePath = resolve(
        fixture.tempRoot,
        'home',
        '.repo-ai-governor',
        'user-config.yaml',
      );
      await mkdir(dirname(globalPreferencePath), { recursive: true });
      await writeFile(
        globalPreferencePath,
        [
          'workspace:',
          '  mode_preference: tool_managed',
          'tools:',
          '  codex:',
          '    transport: remote_api',
          '    remoteApi:',
          '      model: gpt-5-user-default',
          '      credentialRef: secret://openai/api-key',
          '',
        ].join('\n'),
        'utf8',
      );
      await rm(fixture.configPath, { force: true });
      fixture.context.options.workspaceCommandOptions = {
        action: 'set-ui-theme',
        targetMode: null,
        targetRoot: null,
        planPath: null,
        themeScope: 'global',
        themePreferencePath: globalPreferencePath,
      };
      fixture.context.resolveRuntimeDebugOptions = () => ({
        interactive: false,
        requestedUiMode: null,
        requestedUiTheme: CliReactThemePreset.CALM,
        uiMode: CliInteractiveUiMode.NONE,
        uiTheme: CliReactThemePreset.CALM,
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
      });

      const command = new CliWorkspaceCommand();
      const result = await command.execute(fixture.context);
      const globalPreferenceContent = await readFile(globalPreferencePath, 'utf8');

      expect(result.commandResult.operation).toBe('workspace_ui_theme_set');
      expect(result.commandResult.details?.theme_scope).toBe('global');
      expect(result.commandResult.details?.persisted_path_count).toBe(1);
      expect(result.commandResult.details?.persisted_config_paths).toBe(globalPreferencePath);
      expect(globalPreferenceContent).toContain('theme: calm');
      expect(globalPreferenceContent).toContain('mode_preference: tool_managed');
      expect(globalPreferenceContent).toContain('model: gpt-5-user-default');
      expect(globalPreferenceContent).toContain('credentialRef: secret://openai/api-key');
      expect(existsSync(fixture.configPath)).toBe(false);
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

  it('switches to an existing local branch and writes a governed receipt artifact', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'switch-branch',
      actionValue: 'main',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await initializeGitRepository(fixture.tempRoot);
      await execFileAsync('git', ['switch', '-c', 'feature/testing'], {
        cwd: fixture.tempRoot,
      });
      fixture.context.options.workspaceCommandOptions = {
        action: 'switch-branch',
        actionValue: 'main',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      const result = await command.execute(fixture.context);
      const receiptPath = result.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'workspace_branch_switch_receipt',
      )?.path;
      const branchResult = await execFileAsync('git', ['branch', '--show-current'], {
        cwd: fixture.tempRoot,
      });

      expect(result.commandResult.operation).toBe('workspace_branch_switch');
      expect(result.commandResult.details?.target_branch).toBe('main');
      expect(result.commandResult.details?.current_branch).toBe('main');
      expect(result.commandResult.details?.switched).toBe(true);
      expect(branchResult.stdout.trim()).toBe('main');
      expect(typeof receiptPath).toBe('string');
      expect(existsSync(String(receiptPath))).toBe(true);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('accepts Git-valid branch names such as feature+foo when switching branches', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'switch-branch',
      actionValue: 'feature+foo',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await initializeGitRepository(fixture.tempRoot);
      await execFileAsync('git', ['switch', '-c', 'feature+foo'], {
        cwd: fixture.tempRoot,
      });
      await execFileAsync('git', ['switch', 'main'], {
        cwd: fixture.tempRoot,
      });
      fixture.context.options.workspaceCommandOptions = {
        action: 'switch-branch',
        actionValue: 'feature+foo',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      const result = await command.execute(fixture.context);
      const branchResult = await execFileAsync('git', ['branch', '--show-current'], {
        cwd: fixture.tempRoot,
      });

      expect(result.commandResult.operation).toBe('workspace_branch_switch');
      expect(result.commandResult.details?.target_branch).toBe('feature+foo');
      expect(result.commandResult.details?.current_branch).toBe('feature+foo');
      expect(result.commandResult.details?.switched).toBe(true);
      expect(branchResult.stdout.trim()).toBe('feature+foo');
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('falls back to git checkout when git switch is unavailable', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'switch-branch',
      actionValue: 'main',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await initializeGitRepository(fixture.tempRoot);
      await execFileAsync('git', ['switch', '-c', 'feature/testing'], {
        cwd: fixture.tempRoot,
      });
      fixture.context.options.workspaceCommandOptions = {
        action: 'switch-branch',
        actionValue: 'main',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();
      const originalRunGitCommand = (
        command as unknown as {
          runGitCommand: (
            repositoryRoot: string,
            args: string[],
            details: Record<string, string | null | undefined>,
            failureMessage: string,
          ) => Promise<{ stdout: string; stderr: string }>;
        }
      ).runGitCommand.bind(command);
      const runGitCommandSpy = vi.fn(
        async (
          repositoryRoot: string,
          args: string[],
          details: Record<string, string | null | undefined>,
          failureMessage: string,
        ) => {
          if (args[0] === 'switch' && args[1] === '--quiet') {
            throw new RuntimeError(
              GovernorErrorCode.WORKSPACE_MIGRATION_SWITCH_FAILED,
              failureMessage,
              {
                ...details,
                args: args.join(' '),
                stderr: "git: 'switch' is not a git command. See 'git --help'.",
              },
            );
          }

          return originalRunGitCommand(repositoryRoot, args, details, failureMessage);
        },
      );
      (
        command as unknown as {
          runGitCommand: typeof runGitCommandSpy;
        }
      ).runGitCommand = runGitCommandSpy;

      const result = await command.execute(fixture.context);
      const branchResult = await execFileAsync('git', ['branch', '--show-current'], {
        cwd: fixture.tempRoot,
      });

      expect(result.commandResult.operation).toBe('workspace_branch_switch');
      expect(result.commandResult.details?.target_branch).toBe('main');
      expect(result.commandResult.details?.current_branch).toBe('main');
      expect(result.commandResult.details?.switched).toBe(true);
      expect(branchResult.stdout.trim()).toBe('main');
      expect(
        runGitCommandSpy.mock.calls.some(
          ([, args, details]) =>
            Array.isArray(args) &&
            args[0] === 'checkout' &&
            args[1] === '--quiet' &&
            args[2] === 'main' &&
            details?.gitFallbackCommand === 'checkout' &&
            details?.targetBranch === 'main',
        ),
      ).toBe(true);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('renders a React shell summary for branch switching with branch-specific field labels', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'switch-branch',
      actionValue: 'main',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await initializeGitRepository(fixture.tempRoot);
      await execFileAsync('git', ['switch', '-c', 'feature/testing'], {
        cwd: fixture.tempRoot,
      });
      fixture.context.resolveRuntimeDebugOptions = () => ({
        interactive: false,
        requestedUiMode: CliInteractiveUiMode.REACT,
        requestedUiTheme: null,
        uiMode: CliInteractiveUiMode.REACT,
        uiTheme: CliReactThemePreset.GOVERNOR,
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
      });
      fixture.context.options.workspaceCommandOptions = {
        action: 'switch-branch',
        actionValue: 'main',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      const result = await command.execute(fixture.context);

      expect(result.reactCliViewModel?.title).toContain('Switch current git branch');
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        'Workspace action: switch-branch',
      );
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain('Target branch: main');
      expect(
        result.reactCliViewModel?.sections[0]?.lines.some((line) =>
          line.startsWith('Receipt path: '),
        ),
      ).toBe(true);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('localizes invalid branch-name errors when git rejects the target name', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'switch-branch',
      actionValue: 'bad..name',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await initializeGitRepository(fixture.tempRoot);
      const zhCnRuntime = new I18nRuntime();
      await zhCnRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'zh-CN');
      fixture.context.options.locale = 'zh-CN';
      fixture.context.translate = (key: string, interpolation?: Record<string, string>) =>
        zhCnRuntime.t(key, interpolation);
      fixture.context.localizeText = (_english: string, chinese: string) => chinese;
      fixture.context.options.workspaceCommandOptions = {
        action: 'switch-branch',
        actionValue: 'bad..name',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      await expect(command.execute(fixture.context)).rejects.toMatchObject({
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        message: expect.stringContaining('不是有效的 Git 分支名'),
      });
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('refuses to switch branches when the git worktree is dirty', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'switch-branch',
      actionValue: 'main',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await initializeGitRepository(fixture.tempRoot);
      await execFileAsync('git', ['switch', '-c', 'feature/testing'], {
        cwd: fixture.tempRoot,
      });
      await writeFile(resolve(fixture.tempRoot, 'README.md'), '# dirty fixture\n', 'utf8');
      fixture.context.options.workspaceCommandOptions = {
        action: 'switch-branch',
        actionValue: 'main',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      await expect(command.execute(fixture.context)).rejects.toMatchObject({
        code: GovernorErrorCode.WORKSPACE_MIGRATION_SWITCH_FAILED,
        message: expect.stringContaining(
          'refuses to switch branches while the worktree has uncommitted changes',
        ),
      });
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('allows a dirty worktree when switch-branch is a no-op on the current branch', async () => {
    const fixture = await createWorkspaceCommandFixture({
      action: 'switch-branch',
      actionValue: 'main',
      targetMode: null,
      targetRoot: null,
      planPath: null,
    });

    try {
      await initializeGitRepository(fixture.tempRoot);
      await writeFile(resolve(fixture.tempRoot, 'README.md'), '# still on main\n', 'utf8');
      fixture.context.options.workspaceCommandOptions = {
        action: 'switch-branch',
        actionValue: 'main',
        targetMode: null,
        targetRoot: null,
        planPath: null,
      };
      const command = new CliWorkspaceCommand();

      const result = await command.execute(fixture.context);
      const branchResult = await execFileAsync('git', ['branch', '--show-current'], {
        cwd: fixture.tempRoot,
      });

      expect(result.commandResult.operation).toBe('workspace_branch_switch');
      expect(result.commandResult.details?.target_branch).toBe('main');
      expect(result.commandResult.details?.current_branch).toBe('main');
      expect(result.commandResult.details?.switched).toBe(false);
      expect(branchResult.stdout.trim()).toBe('main');
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
