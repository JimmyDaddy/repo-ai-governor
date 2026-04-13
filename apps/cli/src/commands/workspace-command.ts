import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  ConfigLoader,
  type GovernorConfig,
  type GovernorProfile,
  type ResolvedWorkspace,
  type WorkspaceConfig,
  type WorkspaceMigrationPlan,
  WorkspaceMigrationService,
  WorkspaceMigrationStep,
  WorkspaceMigrationStepStatus,
  WorkspaceMode,
  WorkspaceModeSource,
} from '@repo-ai-governor/config';
import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
  standardizeError,
} from '@repo-ai-governor/shared';
import { stringify } from 'yaml';
import {
  CliCommandResultCheckId,
  CliWorkspaceScratchCleanupDetailField,
  CliWorkspaceScratchCleanupStatus,
  CliWorkspaceTargetDetailField,
} from '../constants/cli-command-result-check.constant.js';
import { CLI_PROGRAM_NAME, CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../constants/cli-interactive-shell.constant.js';
import {
  CLI_REACT_THEME_PRESET_ORDER,
  type CliReactThemePreset,
  DEFAULT_CLI_REACT_THEME_PRESET,
} from '../constants/cli-react-theme.constant.js';
import { CliWorkspaceAction, CliWorkspaceThemeScope } from '../constants/cli-workspace.constant.js';
import {
  ReactCliCommandDescriptorCatalog,
  ReactCliCommandViewModelBuilder,
  ReactCliFieldKind,
  type ReactCliViewModel,
} from '../react-cli/index.js';
import { GlobalCliThemePreferenceService } from '../runtime/global-cli-theme-preference-service.js';
import { CliThemeSelectReactShellRunner } from '../runtime/interactive-shell/theme-select-react-shell-runner.js';
import type {
  CliCommandExecutorContext,
  CliCommandExperiencePayload,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliGovernanceCommandResult,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

const execFileAsync = promisify(execFile);
const WORKSPACE_BRANCH_SWITCH_ERROR_CODE = GovernorErrorCode.WORKSPACE_MIGRATION_SWITCH_FAILED;

interface CliWorkspaceCommandDependencies {
  configLoader?: Pick<ConfigLoader, 'loadFromFile'>;
  workspaceMigrationService?: Pick<WorkspaceMigrationService, 'plan' | 'execute' | 'rollback'>;
  descriptorCatalog?: ReactCliCommandDescriptorCatalog;
  viewModelBuilder?: ReactCliCommandViewModelBuilder;
  globalThemePreferenceService?: Pick<
    GlobalCliThemePreferenceService,
    'loadThemePreference' | 'renderMergedPreferenceContent' | 'resolvePreferencePath'
  >;
  themeSelectRunner?: Pick<CliThemeSelectReactShellRunner, 'run'>;
}

interface WorkspaceCutoverPersistence {
  repoLocalConfigPath: string;
  repoLocalConfigSnapshot: string | null;
}

/**
 * Owns adopter-facing workspace migration planning, execution, and rollback semantics.
 */
export class CliWorkspaceCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.WORKSPACE;

  private readonly configLoader: Pick<ConfigLoader, 'loadFromFile'>;
  private readonly workspaceMigrationService: Pick<
    WorkspaceMigrationService,
    'plan' | 'execute' | 'rollback'
  >;
  private readonly descriptorCatalog: ReactCliCommandDescriptorCatalog;
  private readonly viewModelBuilder: ReactCliCommandViewModelBuilder;
  private readonly globalThemePreferenceService: Pick<
    GlobalCliThemePreferenceService,
    'loadThemePreference' | 'renderMergedPreferenceContent' | 'resolvePreferencePath'
  >;
  private readonly themeSelectRunner: Pick<CliThemeSelectReactShellRunner, 'run'>;

  public constructor(dependencies: CliWorkspaceCommandDependencies = {}) {
    this.configLoader = dependencies.configLoader ?? new ConfigLoader();
    this.workspaceMigrationService =
      dependencies.workspaceMigrationService ?? new WorkspaceMigrationService();
    this.descriptorCatalog =
      dependencies.descriptorCatalog ?? new ReactCliCommandDescriptorCatalog();
    this.viewModelBuilder = dependencies.viewModelBuilder ?? new ReactCliCommandViewModelBuilder();
    this.globalThemePreferenceService =
      dependencies.globalThemePreferenceService ?? new GlobalCliThemePreferenceService();
    this.themeSelectRunner = dependencies.themeSelectRunner ?? new CliThemeSelectReactShellRunner();
  }

  public async execute(context: CliCommandExecutorContext): Promise<CliGovernanceCommandResult> {
    const action = this.resolveAction(context);

    if (action === CliWorkspaceAction.ROLLBACK) {
      return this.executeRollback(context);
    }

    if (action === CliWorkspaceAction.CLEAR_CONFIG) {
      return this.executeClearConfig(context);
    }

    if (action === CliWorkspaceAction.BRANCH_SWITCH) {
      return this.executeBranchSwitch(context);
    }

    if (
      action === CliWorkspaceAction.SET_UI_THEME &&
      this.resolveThemeScope(context) === CliWorkspaceThemeScope.GLOBAL
    ) {
      return this.executeSetUiTheme(context, null);
    }

    if (!existsSync(context.options.workspace.configPath)) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `workspace requires config file at ${context.options.workspace.configPath}; run \`init\` first.`,
        {
          configPath: context.options.workspace.configPath,
          command: CliCommandName.WORKSPACE,
        },
      );
    }

    const config = this.configLoader.loadFromFile(context.options.workspace.configPath);
    if (action === CliWorkspaceAction.SET_UI_THEME) {
      return this.executeSetUiTheme(context, config);
    }
    const targetWorkspace = this.resolveTargetWorkspace(context, action);
    const plan = this.workspaceMigrationService.plan({
      currentWorkingDirectory: context.options.currentWorkingDirectory,
      config,
      targetWorkspace,
    });
    const cutoverPersistence = await this.captureCutoverPersistence(plan);
    const planArtifactPath = this.buildWorkspaceArtifactPath(
      context.options.workspace.workspaceRoot,
      plan.migrationId,
      'plan',
    );

    await context.artifactWriter.writeJsonArtifact(
      planArtifactPath,
      this.createPlanArtifactPayload(
        context,
        action,
        config,
        targetWorkspace,
        plan,
        planArtifactPath,
        cutoverPersistence,
      ),
    );

    if (action === CliWorkspaceAction.DRY_RUN) {
      return this.createDryRunResult(context, plan, planArtifactPath);
    }

    return this.executeMigration(
      context,
      config,
      targetWorkspace,
      plan,
      planArtifactPath,
      cutoverPersistence,
    );
  }

  private resolveAction(context: CliCommandExecutorContext): CliWorkspaceAction {
    const rawAction =
      context.options.workspaceCommandOptions?.action?.trim() ?? CliWorkspaceAction.DRY_RUN;
    if (
      rawAction === CliWorkspaceAction.DRY_RUN ||
      rawAction === CliWorkspaceAction.EXECUTE ||
      rawAction === CliWorkspaceAction.ROLLBACK ||
      rawAction === CliWorkspaceAction.CLEAR_CONFIG ||
      rawAction === CliWorkspaceAction.BRANCH_SWITCH ||
      rawAction === CliWorkspaceAction.SET_UI_THEME
    ) {
      return rawAction;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'workspace requires --workspace-action dry-run|execute|rollback|clear-config|switch-branch|set-ui-theme.',
      {
        command: CliCommandName.WORKSPACE,
        action: rawAction,
      },
    );
  }

  private resolveTargetBranch(context: CliCommandExecutorContext): string {
    const targetBranch = context.options.workspaceCommandOptions?.actionValue?.trim() ?? '';
    if (!targetBranch) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchTargetRequired'),
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.BRANCH_SWITCH,
        },
      );
    }

    return targetBranch;
  }

  private async executeClearConfig(context: CliCommandExecutorContext) {
    const inspectedConfigPaths = this.resolveWorkspaceConfigPersistencePaths(context);
    const clearedConfigPaths: string[] = [];

    for (const configPath of inspectedConfigPaths) {
      if (!existsSync(configPath)) {
        continue;
      }

      try {
        await rm(configPath, { force: true });
        clearedConfigPaths.push(configPath);
      } catch (error) {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          `Failed to clear workspace config file at ${configPath}.`,
          {
            command: CliCommandName.WORKSPACE,
            action: CliWorkspaceAction.CLEAR_CONFIG,
            configPath,
          },
          error,
        );
      }
    }

    const clearedPathCount = clearedConfigPaths.length;
    const clearedAnyConfig = clearedPathCount > 0;
    const message = this.translate(
      context,
      clearedAnyConfig
        ? 'cli.reactShell.workspace.message.clearConfigCompleted'
        : 'cli.reactShell.workspace.message.clearConfigNoop',
      {
        count: String(clearedPathCount),
        paths: (clearedAnyConfig ? clearedConfigPaths : inspectedConfigPaths).join(', '),
      },
    );
    const statusMessage = this.translate(
      context,
      clearedAnyConfig
        ? 'cli.reactShell.workspace.status.clearConfigCompleted'
        : 'cli.reactShell.workspace.status.clearConfigNoop',
    );
    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.WORKSPACE_ACTION,
        status: clearedAnyConfig ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
        detail: 'action=clear_config',
      },
      {
        id: CliCommandResultCheckId.WORKSPACE_TARGET,
        status: CliGovernanceCheckStatus.PASS,
        detail: this.createWorkspaceTargetDetail(
          context.options.workspace.mode,
          context.options.workspace.workspaceRoot,
        ),
      },
    ];
    const nextActions = clearedAnyConfig
      ? [
          this.translate(context, 'cli.reactShell.workspace.nextActions.reRunInitAfterClear'),
          this.translate(context, 'cli.reactShell.workspace.nextActions.rerunWorkspaceAfterClear'),
        ]
      : [
          this.translate(
            context,
            'cli.reactShell.workspace.nextActions.inspectExpectedConfigPaths',
            {
              paths: inspectedConfigPaths.join(', '),
            },
          ),
        ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'workspace-config-clear',
          stage: ExecutionProgressStage.REPORT,
          status: clearedAnyConfig
            ? ExecutionProgressStatus.COMPLETED
            : ExecutionProgressStatus.WARNING,
          category: ExecutionInteractionCategory.NONE,
          summary: statusMessage,
          detail: [
            `cleared_path_count=${clearedPathCount}`,
            `inspected_path_count=${inspectedConfigPaths.length}`,
          ].join(' '),
        },
      ],
      interactionPrompts: nextActions.map((action) => ({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.REPORT,
        title: this.translate(context, 'cli.reactShell.workspace.nextStepTitle'),
        action,
        blocking: false,
      })),
      layeredLogs: {
        summary: [statusMessage],
        detailed: [
          `cleared_path_count=${clearedPathCount}`,
          `inspected_path_count=${inspectedConfigPaths.length}`,
          ...inspectedConfigPaths.map(
            (configPath, index) => `inspected_config_path_${index}=${configPath}`,
          ),
          ...clearedConfigPaths.map(
            (configPath, index) => `cleared_config_path_${index}=${configPath}`,
          ),
        ],
      },
    });

    return {
      message,
      reactCliViewModel: this.buildWorkspaceClearConfigViewModel(context, {
        message,
        statusMessage,
        checks,
        experience,
        inspectedConfigPaths,
        clearedConfigPaths,
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_CONFIG_CLEAR,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'clear_config',
          config_source: context.options.configSource,
          current_workspace_mode: context.options.workspace.mode,
          current_workspace_root: context.options.workspace.workspaceRoot,
          current_config_path: context.options.workspace.configPath,
          repository_root: context.options.workspace.repositoryRoot,
          inspected_config_paths: inspectedConfigPaths.join(' | '),
          cleared_config_paths: clearedConfigPaths.join(' | '),
          cleared_path_count: clearedPathCount,
          inspected_path_count: inspectedConfigPaths.length,
        },
      },
    };
  }

  private async executeBranchSwitch(
    context: CliCommandExecutorContext,
  ): Promise<CliGovernanceCommandResult> {
    const targetBranch = this.resolveTargetBranch(context);
    const repositoryRoot = resolve(context.options.workspace.repositoryRoot);
    const gitTopLevel = await this.readGitStdout(
      repositoryRoot,
      ['rev-parse', '--show-toplevel'],
      {
        command: CliCommandName.WORKSPACE,
        action: CliWorkspaceAction.BRANCH_SWITCH,
        repositoryRoot,
      },
      this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchRequiresGitRepo', {
        repositoryRoot,
      }),
    );
    await this.validateTargetBranch(context, gitTopLevel, targetBranch);
    const detachedHeadLabel = this.localizeText(context, 'detached HEAD', '游离 HEAD');
    const currentBranch = this.normalizeOptionalGitValue(
      await this.readGitStdout(
        gitTopLevel,
        ['branch', '--show-current'],
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.BRANCH_SWITCH,
          repositoryRoot: gitTopLevel,
        },
        this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchReadCurrentFailed', {
          repositoryRoot: gitTopLevel,
        }),
      ),
    );
    const switched = currentBranch !== targetBranch;
    const dirtyEntries = await this.listGitStatusEntries(context, gitTopLevel);
    if (switched && dirtyEntries.length > 0) {
      throw new RuntimeError(
        WORKSPACE_BRANCH_SWITCH_ERROR_CODE,
        this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchDirtyWorktree'),
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.BRANCH_SWITCH,
          repositoryRoot: gitTopLevel,
          targetBranch,
          dirtyEntryCount: dirtyEntries.length,
          dirtyEntries,
        },
      );
    }

    if (switched) {
      const branchExists = await this.checkLocalBranchExists(context, gitTopLevel, targetBranch);
      if (!branchExists) {
        throw new RuntimeError(
          WORKSPACE_BRANCH_SWITCH_ERROR_CODE,
          this.translate(
            context,
            'cli.reactShell.workspace.errors.branchSwitchMissingLocalBranch',
            {
              targetBranch,
            },
          ),
          {
            command: CliCommandName.WORKSPACE,
            action: CliWorkspaceAction.BRANCH_SWITCH,
            repositoryRoot: gitTopLevel,
            targetBranch,
            suggestedRecovery: `git fetch origin && git checkout -b ${targetBranch} --track origin/${targetBranch}`,
          },
        );
      }

      await this.switchBranchWithFallback(
        context,
        gitTopLevel,
        targetBranch,
        currentBranch,
        detachedHeadLabel,
      );
    }

    const resolvedCurrentBranch = await this.readGitStdout(
      gitTopLevel,
      ['branch', '--show-current'],
      {
        command: CliCommandName.WORKSPACE,
        action: CliWorkspaceAction.BRANCH_SWITCH,
        repositoryRoot: gitTopLevel,
        targetBranch,
      },
      this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchVerifyActiveFailed', {
        targetBranch,
      }),
    );
    if (resolvedCurrentBranch !== targetBranch) {
      throw new RuntimeError(
        WORKSPACE_BRANCH_SWITCH_ERROR_CODE,
        this.translate(
          context,
          'cli.reactShell.workspace.errors.branchSwitchUnexpectedActiveBranch',
          {
            targetBranch,
            currentBranch: resolvedCurrentBranch || detachedHeadLabel,
          },
        ),
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.BRANCH_SWITCH,
          repositoryRoot: gitTopLevel,
          targetBranch,
          currentBranch: resolvedCurrentBranch,
        },
      );
    }

    const artifactPath = this.buildWorkspaceBranchSwitchArtifactPath(
      context.options.workspace.workspaceRoot,
      `branch-switch-${this.createArtifactTimestamp(new Date())}-${this.sanitizeArtifactToken(targetBranch)}`,
    );
    await context.artifactWriter.writeJsonArtifact(artifactPath, {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      action: CliWorkspaceAction.BRANCH_SWITCH,
      repositoryRoot,
      gitTopLevel,
      previousBranch: currentBranch,
      currentBranch: resolvedCurrentBranch,
      targetBranch,
      switched,
      dirtyEntryCount: dirtyEntries.length,
    });

    const statusTranslationKey = switched
      ? 'cli.reactShell.workspace.status.branchSwitchCompleted'
      : 'cli.reactShell.workspace.status.branchSwitchNoop';
    const messageTranslationKey = switched
      ? 'cli.reactShell.workspace.message.branchSwitchCompleted'
      : 'cli.reactShell.workspace.message.branchSwitchNoop';
    const statusMessage = this.translate(context, statusTranslationKey, {
      targetBranch,
      currentBranch: currentBranch ?? detachedHeadLabel,
      repositoryRoot: gitTopLevel,
    });
    const message = this.translate(context, messageTranslationKey, {
      targetBranch,
      currentBranch: currentBranch ?? detachedHeadLabel,
      repositoryRoot: gitTopLevel,
      artifactPath,
    });
    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.WORKSPACE_ACTION,
        status: CliGovernanceCheckStatus.PASS,
        detail: `action=branch_switch target_branch=${targetBranch} switched=${String(switched)}`,
      },
      {
        id: CliCommandResultCheckId.WORKSPACE_TARGET,
        status: CliGovernanceCheckStatus.PASS,
        detail: this.createWorkspaceTargetDetail(context.options.workspace.mode, gitTopLevel),
      },
    ];
    const nextActions = [
      this.translate(context, 'cli.reactShell.workspace.nextActions.verifyActiveBranchStatus', {
        targetBranch,
      }),
      this.translate(context, 'cli.reactShell.workspace.nextActions.continueOnSwitchedBranch', {
        targetBranch,
      }),
    ];
    const experience = this.buildWorkspaceExperience(context, {
      blocking: false,
      summary: statusMessage,
      artifactPath,
      nextActions,
    });

    return {
      message,
      reactCliViewModel: this.buildWorkspaceBranchSwitchViewModel(context, {
        message,
        statusMessage,
        checks,
        experience,
        repositoryRoot: gitTopLevel,
        currentBranch,
        targetBranch,
        artifactPath,
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_BRANCH_SWITCH,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts: [
          {
            id: 'workspace_branch_switch_receipt',
            path: artifactPath,
          },
        ],
        experience,
        details: {
          action: 'branch_switch',
          repository_root: repositoryRoot,
          git_top_level: gitTopLevel,
          previous_branch: currentBranch ?? 'detached_head',
          current_branch: resolvedCurrentBranch,
          target_branch: targetBranch,
          switched,
          artifact_path: artifactPath,
        },
      },
    };
  }

  private async executeSetUiTheme(
    context: CliCommandExecutorContext,
    config: GovernorConfig | null,
  ): Promise<CliGovernanceCommandResult> {
    const themeScope = this.resolveThemeScope(context);
    const requestedUiTheme = await this.resolveRequestedUiTheme(context, config, themeScope);

    const persistedConfigPaths =
      themeScope === CliWorkspaceThemeScope.GLOBAL
        ? await this.persistGlobalUiThemePreference(context, requestedUiTheme)
        : await this.persistUiThemeConfig(context, config, requestedUiTheme);
    const persistedPathCount = persistedConfigPaths.length;
    const themeScopeLabel = this.resolveThemeScopeDisplayLabel(context, themeScope);
    const persistenceTarget = this.resolveThemePersistenceTargetLabel(
      context,
      themeScope,
      persistedConfigPaths,
    );
    const statusMessage = this.translate(
      context,
      'cli.reactShell.workspace.status.setThemeCompleted',
      {
        theme: requestedUiTheme,
        scope: themeScopeLabel,
        target: persistenceTarget,
      },
    );
    const message = this.translate(context, 'cli.reactShell.workspace.message.setThemeCompleted', {
      theme: requestedUiTheme,
      scope: themeScopeLabel,
      target: persistenceTarget,
      count: String(persistedPathCount),
      paths: persistedConfigPaths.join(', '),
    });
    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.WORKSPACE_ACTION,
        status: CliGovernanceCheckStatus.PASS,
        detail: `action=set_ui_theme theme=${requestedUiTheme} scope=${themeScope}`,
      },
      {
        id: CliCommandResultCheckId.WORKSPACE_TARGET,
        status: CliGovernanceCheckStatus.PASS,
        detail: this.createWorkspaceTargetDetail(
          context.options.workspace.mode,
          context.options.workspace.workspaceRoot,
        ),
      },
    ];
    const nextActions = [
      this.translate(context, 'cli.reactShell.workspace.nextActions.rerunPrettyAfterThemeChange', {
        theme: requestedUiTheme,
      }),
      this.translate(context, 'cli.reactShell.workspace.nextActions.useUiThemeFlagAsOverride'),
    ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'workspace-ui-theme-set',
          stage: ExecutionProgressStage.REPORT,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: statusMessage,
          detail: `theme=${requestedUiTheme} scope=${themeScope} persisted_path_count=${persistedPathCount}`,
        },
      ],
      interactionPrompts: nextActions.map((action) => ({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.REPORT,
        title: this.translate(context, 'cli.reactShell.workspace.nextStepTitle'),
        action,
        blocking: false,
      })),
      layeredLogs: {
        summary: [statusMessage],
        detailed: [
          `theme=${requestedUiTheme}`,
          `scope=${themeScope}`,
          `persisted_path_count=${persistedPathCount}`,
          ...persistedConfigPaths.map(
            (configPath, index) => `persisted_config_path_${index}=${configPath}`,
          ),
        ],
      },
    });

    return {
      message,
      reactCliViewModel: this.buildWorkspaceSetUiThemeViewModel(context, {
        message,
        statusMessage,
        checks,
        experience,
        themePreset: requestedUiTheme,
        themeScope,
        persistedConfigPaths,
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_UI_THEME_SET,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        experience,
        details: {
          action: 'set_ui_theme',
          config_source: context.options.configSource,
          current_workspace_mode: context.options.workspace.mode,
          current_workspace_root: context.options.workspace.workspaceRoot,
          current_config_path: context.options.workspace.configPath,
          repository_root: context.options.workspace.repositoryRoot,
          ui_theme: requestedUiTheme,
          theme_scope: themeScope,
          persisted_config_paths: persistedConfigPaths.join(' | '),
          persisted_path_count: persistedPathCount,
        },
      },
    };
  }

  private resolveThemeScope(context: CliCommandExecutorContext): CliWorkspaceThemeScope {
    const rawThemeScope =
      context.options.workspaceCommandOptions?.themeScope?.trim().toLowerCase() ??
      CliWorkspaceThemeScope.WORKSPACE;
    if (
      rawThemeScope === CliWorkspaceThemeScope.WORKSPACE ||
      rawThemeScope === CliWorkspaceThemeScope.GLOBAL
    ) {
      return rawThemeScope;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'workspace set-ui-theme requires --theme-scope workspace|global when the flag is present.',
      {
        command: CliCommandName.WORKSPACE,
        action: CliWorkspaceAction.SET_UI_THEME,
        option: '--theme-scope',
        value: rawThemeScope,
      },
    );
  }

  /**
   * Resolves the theme preset requested for `set-ui-theme`, falling back to the live selector.
   * @param context Command execution context.
   * @param config Active workspace config when the workspace scope is available.
   * @param themeScope Target persistence scope.
   * @returns One valid theme preset that should be persisted.
   */
  private async resolveRequestedUiTheme(
    context: CliCommandExecutorContext,
    config: GovernorConfig | null,
    themeScope: CliWorkspaceThemeScope,
  ): Promise<CliReactThemePreset> {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.requestedUiTheme) {
      return runtimeDebugOptions.requestedUiTheme;
    }

    if (runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.reactShell.themeSelector.nonInteractiveError', {
          themes: this.formatAvailableThemeList(),
        }),
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.SET_UI_THEME,
          option: '--ui-theme',
        },
      );
    }

    const currentTargetTheme = this.resolveCurrentTargetThemePreference(
      context,
      config,
      themeScope,
    );
    return await this.themeSelectRunner.run({
      locale: context.options.locale,
      outputMode: context.options.outputMode,
      uiTheme: runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
      currentTheme: currentTargetTheme,
      themeScope,
      translate: (key, interpolation) => this.translate(context, key, interpolation),
    });
  }

  /**
   * Resolves the currently persisted theme for the scope targeted by `set-ui-theme`.
   * @param context Command execution context.
   * @param config Active workspace config when loaded.
   * @param themeScope Target persistence scope.
   * @returns The current scope-specific theme preset, when one exists.
   */
  private resolveCurrentTargetThemePreference(
    context: CliCommandExecutorContext,
    config: GovernorConfig | null,
    themeScope: CliWorkspaceThemeScope,
  ): CliReactThemePreset | null {
    if (themeScope === CliWorkspaceThemeScope.GLOBAL) {
      return (
        this.globalThemePreferenceService.loadThemePreference({
          preferencePath: context.options.workspaceCommandOptions?.themePreferencePath ?? undefined,
        }) ?? null
      );
    }

    return config?.ui?.react?.theme ?? null;
  }

  /**
   * Formats the supported theme preset identifiers into one stable inline list.
   * @returns Pipe-delimited theme preset identifiers.
   */
  private formatAvailableThemeList(): string {
    return CLI_REACT_THEME_PRESET_ORDER.join('|');
  }

  /**
   * Resolves one localized display label for the theme persistence scope.
   * @param context Command execution context.
   * @param themeScope Target persistence scope.
   * @returns Human-readable scope label.
   */
  private resolveThemeScopeDisplayLabel(
    context: CliCommandExecutorContext,
    themeScope: CliWorkspaceThemeScope,
  ): string {
    return this.translate(context, `cli.reactShell.workspace.scope.${themeScope}`);
  }

  /**
   * Resolves one localized description for where the theme preference was persisted.
   * @param context Command execution context.
   * @param themeScope Target persistence scope.
   * @param persistedConfigPaths Concrete file paths written during the command.
   * @returns Human-readable persistence target label.
   */
  private resolveThemePersistenceTargetLabel(
    context: CliCommandExecutorContext,
    themeScope: CliWorkspaceThemeScope,
    persistedConfigPaths: string[],
  ): string {
    if (themeScope === CliWorkspaceThemeScope.GLOBAL) {
      return this.translate(context, 'cli.reactShell.workspace.persistenceTarget.globalUserConfig');
    }

    return persistedConfigPaths.length > 1
      ? this.translate(
          context,
          'cli.reactShell.workspace.persistenceTarget.workspaceAndRepoLocalSelectorConfig',
        )
      : this.translate(context, 'cli.reactShell.workspace.persistenceTarget.workspaceConfig');
  }

  private resolveTargetWorkspace(
    context: CliCommandExecutorContext,
    action: CliWorkspaceAction.DRY_RUN | CliWorkspaceAction.EXECUTE,
  ): WorkspaceConfig {
    const rawTargetMode = context.options.workspaceCommandOptions?.targetMode?.trim();
    if (!rawTargetMode) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `workspace ${action} requires --workspace-mode <repo_local|tool_managed>.`,
        {
          command: CliCommandName.WORKSPACE,
          action,
        },
      );
    }

    if (
      rawTargetMode !== WorkspaceMode.REPO_LOCAL &&
      rawTargetMode !== WorkspaceMode.TOOL_MANAGED
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Unsupported workspace mode "${rawTargetMode}".`,
        {
          command: CliCommandName.WORKSPACE,
          action,
          targetMode: rawTargetMode,
        },
      );
    }

    const rawTargetRoot = context.options.workspaceCommandOptions?.targetRoot?.trim() ?? null;
    const resolvedTargetRoot = rawTargetRoot
      ? this.resolveAbsolutePath(context.options.currentWorkingDirectory, rawTargetRoot)
      : null;
    return {
      mode: rawTargetMode,
      ...(rawTargetMode === WorkspaceMode.REPO_LOCAL
        ? {
            ...(resolvedTargetRoot
              ? {
                  repoLocalRoot: resolvedTargetRoot,
                }
              : {}),
          }
        : {
            ...(resolvedTargetRoot
              ? {
                  toolManagedRoot: resolvedTargetRoot,
                }
              : {}),
          }),
    };
  }

  private async executeMigration(
    context: CliCommandExecutorContext,
    config: GovernorConfig,
    targetWorkspace: WorkspaceConfig,
    plan: WorkspaceMigrationPlan,
    planArtifactPath: string,
    cutoverPersistence: WorkspaceCutoverPersistence,
  ) {
    const executionResult = await this.workspaceMigrationService.execute(plan);
    const sourceExecutionArtifactPath = this.buildWorkspaceArtifactPath(
      context.options.workspace.workspaceRoot,
      plan.migrationId,
      'execution',
    );

    if (!executionResult.success) {
      const failureSummaryPath = this.buildWorkspaceArtifactPath(
        context.options.workspace.workspaceRoot,
        plan.migrationId,
        'failure',
      );
      const failedStep = executionResult.steps.find(
        (step) => step.status === WorkspaceMigrationStepStatus.FAILED,
      );
      await context.artifactWriter.writeJsonArtifact(failureSummaryPath, {
        generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
        migrationId: plan.migrationId,
        planPath: planArtifactPath,
        executionPath: sourceExecutionArtifactPath,
        failedStep: failedStep?.step ?? null,
        rollbackStatus:
          executionResult.steps.find((step) => step.step === 'rollback')?.status ?? 'unknown',
        error: executionResult.error ?? null,
        steps: executionResult.steps,
      });

      throw new RuntimeError(
        executionResult.error?.code ?? GovernorErrorCode.WORKSPACE_MIGRATION_SWITCH_FAILED,
        `Workspace migration failed; inspect ${failureSummaryPath}.`,
        {
          reportPath: failureSummaryPath,
          migrationId: plan.migrationId,
          planPath: planArtifactPath,
          executionPath: sourceExecutionArtifactPath,
          failedStep: failedStep?.step ?? null,
        },
      );
    }

    try {
      await this.persistCutoverConfig(context, config, targetWorkspace, plan);
    } catch (error) {
      const rollbackResult = await this.workspaceMigrationService.rollback(plan);
      await this.restoreCutoverPersistence(context, cutoverPersistence);
      const normalizedError = standardizeError(error);
      const failureSummaryPath = this.buildWorkspaceArtifactPath(
        context.options.workspace.workspaceRoot,
        plan.migrationId,
        'failure',
      );

      await context.artifactWriter.writeJsonArtifact(sourceExecutionArtifactPath, {
        generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
        migrationId: plan.migrationId,
        success: false,
        planPath: planArtifactPath,
        rollbackCommand: `${CLI_PROGRAM_NAME} workspace --workspace-action rollback --workspace-plan ${planArtifactPath}`,
        execution: {
          ...executionResult,
          success: false,
          steps: [
            ...executionResult.steps,
            {
              step: WorkspaceMigrationStep.ROLLBACK,
              status: rollbackResult.status,
              message: rollbackResult.message,
            },
          ],
          error: normalizedError,
        },
      });
      await context.artifactWriter.writeJsonArtifact(failureSummaryPath, {
        generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
        migrationId: plan.migrationId,
        planPath: planArtifactPath,
        executionPath: sourceExecutionArtifactPath,
        failedStep: 'cutover_persistence',
        rollbackStatus: rollbackResult.status,
        error: normalizedError,
        steps: executionResult.steps,
      });

      throw new RuntimeError(
        GovernorErrorCode.WORKSPACE_MIGRATION_SWITCH_FAILED,
        `Workspace migration failed while persisting cutover state; inspect ${failureSummaryPath}.`,
        {
          reportPath: failureSummaryPath,
          migrationId: plan.migrationId,
          planPath: planArtifactPath,
          executionPath: sourceExecutionArtifactPath,
          failedStep: 'cutover_persistence',
        },
      );
    }

    const relocatedPlanArtifactPath = this.buildWorkspaceArtifactPath(
      plan.targetWorkspace.workspaceRoot,
      plan.migrationId,
      'plan',
    );
    await context.artifactWriter.writeJsonArtifact(
      relocatedPlanArtifactPath,
      this.createPlanArtifactPayload(
        context,
        CliWorkspaceAction.EXECUTE,
        config,
        targetWorkspace,
        plan,
        relocatedPlanArtifactPath,
        cutoverPersistence,
      ),
    );
    if (relocatedPlanArtifactPath !== planArtifactPath) {
      await rm(planArtifactPath, { force: true });
    }

    const executionArtifactPath = this.buildWorkspaceArtifactPath(
      plan.targetWorkspace.workspaceRoot,
      plan.migrationId,
      'execution',
    );
    await context.artifactWriter.writeJsonArtifact(executionArtifactPath, {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      migrationId: plan.migrationId,
      success: executionResult.success,
      planPath: relocatedPlanArtifactPath,
      rollbackCommand: `${CLI_PROGRAM_NAME} workspace --workspace-action rollback --workspace-plan ${relocatedPlanArtifactPath}`,
      execution: executionResult,
    });

    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.WORKSPACE_ACTION,
        status: CliGovernanceCheckStatus.PASS,
        detail: `action=${CliWorkspaceAction.EXECUTE}`,
      },
      {
        id: CliCommandResultCheckId.WORKSPACE_TARGET,
        status: CliGovernanceCheckStatus.PASS,
        detail: this.createWorkspaceTargetDetail(
          plan.targetWorkspace.mode,
          plan.targetWorkspace.workspaceRoot,
        ),
      },
      ...executionResult.steps.map((step) => ({
        id: `workspace_step_${step.step}`,
        status:
          step.status === WorkspaceMigrationStepStatus.SUCCEEDED
            ? CliGovernanceCheckStatus.PASS
            : step.status === WorkspaceMigrationStepStatus.SKIPPED
              ? CliGovernanceCheckStatus.WARN
              : CliGovernanceCheckStatus.FAIL,
        detail: step.message,
      })),
      {
        id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
        status: CliGovernanceCheckStatus.PASS,
        detail: relocatedPlanArtifactPath,
      },
    ];
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: 'workspace_migration_plan',
        path: relocatedPlanArtifactPath,
      },
      {
        id: 'workspace_migration_execution',
        path: executionArtifactPath,
      },
    ];
    const message = this.translate(context, 'cli.reactShell.workspace.message.executeCompleted', {
      planPath: relocatedPlanArtifactPath,
    });
    const experience = this.buildWorkspaceExperience(context, {
      blocking: false,
      summary: this.translate(context, 'cli.reactShell.workspace.status.executionCompleted'),
      artifactPath: executionArtifactPath,
      nextActions: [
        this.translate(context, 'cli.reactShell.workspace.nextActions.keepPlanRollback', {
          planPath: relocatedPlanArtifactPath,
        }),
        this.translate(context, 'cli.reactShell.workspace.nextActions.rerunDoctorBeforeAdopt', {
          workspaceRoot: plan.targetWorkspace.workspaceRoot,
        }),
      ],
    });

    return {
      message,
      reactCliViewModel: this.buildReactCliViewModel(context, {
        action: CliWorkspaceAction.EXECUTE,
        message,
        checks,
        experience,
        plan,
        primaryArtifactPath: executionArtifactPath,
        planArtifactPath: relocatedPlanArtifactPath,
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_MIGRATION_EXECUTE,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          action: CliWorkspaceAction.EXECUTE,
          migration_id: plan.migrationId,
          source_workspace_mode: plan.sourceWorkspace.mode,
          target_workspace_mode: plan.targetWorkspace.mode,
          source_workspace_root: plan.sourceWorkspace.workspaceRoot,
          target_workspace_root: plan.targetWorkspace.workspaceRoot,
          artifact_workspace_root: plan.targetWorkspace.workspaceRoot,
          plan_path: relocatedPlanArtifactPath,
          execution_path: executionArtifactPath,
          step_count: executionResult.steps.length,
        },
      },
    };
  }

  private async executeRollback(context: CliCommandExecutorContext) {
    const rawPlanPath = context.options.workspaceCommandOptions?.planPath?.trim();
    if (!rawPlanPath) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `workspace ${CliWorkspaceAction.ROLLBACK} requires --workspace-plan <path>.`,
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.ROLLBACK,
        },
      );
    }

    const planArtifactPath = this.resolveAbsolutePath(
      context.options.currentWorkingDirectory,
      rawPlanPath,
    );
    const planArtifactPayload = await context.artifactWriter.safeReadJson(planArtifactPath);
    if (!planArtifactPayload) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `Unable to read workspace migration plan artifact at ${planArtifactPath}.`,
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.ROLLBACK,
          planPath: planArtifactPath,
        },
      );
    }

    const plan = this.parseWorkspaceMigrationPlan(planArtifactPayload, planArtifactPath);
    const cutoverPersistence = this.parseCutoverPersistence(planArtifactPayload, planArtifactPath);
    const rollbackResult = await this.workspaceMigrationService.rollback(plan);
    const rollbackArtifactPath = this.buildWorkspaceArtifactPath(
      plan.sourceWorkspace.workspaceRoot,
      plan.migrationId,
      'rollback',
    );
    let selectorRestoreError: RuntimeError | null = null;
    try {
      await this.restoreCutoverPersistence(context, cutoverPersistence);
    } catch (error) {
      selectorRestoreError = new RuntimeError(
        GovernorErrorCode.WORKSPACE_MIGRATION_ROLLBACK_FAILED,
        `Workspace rollback failed while restoring selector state from ${planArtifactPath}.`,
        {
          reportPath: rollbackArtifactPath,
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.ROLLBACK,
          planPath: planArtifactPath,
        },
        error,
      );
    }
    await context.artifactWriter.writeJsonArtifact(rollbackArtifactPath, {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      migrationId: plan.migrationId,
      planPath: planArtifactPath,
      rollback: rollbackResult,
      selectorRestore:
        selectorRestoreError === null
          ? {
              status: WorkspaceMigrationStepStatus.SUCCEEDED,
            }
          : {
              status: WorkspaceMigrationStepStatus.FAILED,
              error: standardizeError(selectorRestoreError),
            },
    });
    const scratchCleanupRoot = this.resolveMigrationScratchRoot(plan);
    const scratchCleanupStatus = existsSync(scratchCleanupRoot)
      ? CliWorkspaceScratchCleanupStatus.RETAINED
      : CliWorkspaceScratchCleanupStatus.REMOVED;

    if (
      rollbackResult.status === WorkspaceMigrationStepStatus.FAILED ||
      selectorRestoreError !== null
    ) {
      throw new RuntimeError(
        GovernorErrorCode.WORKSPACE_MIGRATION_ROLLBACK_FAILED,
        `Workspace rollback failed; inspect ${rollbackArtifactPath}.`,
        {
          reportPath: rollbackArtifactPath,
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.ROLLBACK,
          planPath: planArtifactPath,
        },
      );
    }

    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.WORKSPACE_ACTION,
        status: CliGovernanceCheckStatus.PASS,
        detail: `action=${CliWorkspaceAction.ROLLBACK}`,
      },
      {
        id: CliCommandResultCheckId.WORKSPACE_TARGET,
        status: CliGovernanceCheckStatus.PASS,
        detail: this.createWorkspaceTargetDetail(
          plan.targetWorkspace.mode,
          plan.targetWorkspace.workspaceRoot,
        ),
      },
      {
        id: 'workspace_step_rollback',
        status: CliGovernanceCheckStatus.PASS,
        detail: rollbackResult.message,
      },
      {
        id: CliCommandResultCheckId.WORKSPACE_SCRATCH_CLEANUP,
        status:
          scratchCleanupStatus === CliWorkspaceScratchCleanupStatus.REMOVED
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: this.createWorkspaceScratchCleanupDetail(scratchCleanupStatus, scratchCleanupRoot),
      },
    ];
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: 'workspace_migration_plan',
        path: planArtifactPath,
      },
      {
        id: 'workspace_migration_rollback',
        path: rollbackArtifactPath,
      },
    ];
    const message = this.translate(context, 'cli.reactShell.workspace.message.rollbackCompleted', {
      rollbackPath: rollbackArtifactPath,
    });
    const experience = this.buildWorkspaceExperience(context, {
      blocking: false,
      summary: this.translate(context, 'cli.reactShell.workspace.status.rollbackCompleted'),
      artifactPath: rollbackArtifactPath,
      nextActions: [
        this.translate(
          context,
          'cli.reactShell.workspace.nextActions.verifyRollbackTargetCleared',
          {
            workspaceRoot: plan.targetWorkspace.workspaceRoot,
          },
        ),
      ],
    });

    return {
      message,
      reactCliViewModel: this.buildReactCliViewModel(context, {
        action: CliWorkspaceAction.ROLLBACK,
        message,
        checks,
        experience,
        plan,
        primaryArtifactPath: rollbackArtifactPath,
        planArtifactPath,
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_MIGRATION_ROLLBACK,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          action: CliWorkspaceAction.ROLLBACK,
          migration_id: plan.migrationId,
          plan_path: planArtifactPath,
          rollback_path: rollbackArtifactPath,
          target_workspace_root: plan.targetWorkspace.workspaceRoot,
          artifact_workspace_root: plan.sourceWorkspace.workspaceRoot,
          scratch_cleanup_root: scratchCleanupRoot,
          scratch_cleanup_status: scratchCleanupStatus,
        },
      },
    };
  }

  private createDryRunResult(
    context: CliCommandExecutorContext,
    plan: WorkspaceMigrationPlan,
    planArtifactPath: string,
  ) {
    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.WORKSPACE_ACTION,
        status: CliGovernanceCheckStatus.PASS,
        detail: 'action=dry_run',
      },
      {
        id: CliCommandResultCheckId.WORKSPACE_TARGET,
        status: CliGovernanceCheckStatus.PASS,
        detail: this.createWorkspaceTargetDetail(
          plan.targetWorkspace.mode,
          plan.targetWorkspace.workspaceRoot,
        ),
      },
      {
        id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
        status: CliGovernanceCheckStatus.PASS,
        detail: planArtifactPath,
      },
    ];
    const message = this.translate(context, 'cli.reactShell.workspace.message.dryRunCompleted', {
      planPath: planArtifactPath,
    });
    const experience = this.buildWorkspaceExperience(context, {
      blocking: false,
      summary: this.translate(context, 'cli.reactShell.workspace.status.dryRunCompleted'),
      artifactPath: planArtifactPath,
      nextActions: [
        this.translate(context, 'cli.reactShell.workspace.nextActions.inspectPlanBeforeExecute', {
          planPath: planArtifactPath,
        }),
        this.translate(context, 'cli.reactShell.workspace.nextActions.useExecuteWhenReady'),
      ],
    });

    return {
      message,
      reactCliViewModel: this.buildReactCliViewModel(context, {
        action: CliWorkspaceAction.DRY_RUN,
        message,
        checks,
        experience,
        plan,
        primaryArtifactPath: planArtifactPath,
        planArtifactPath,
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_MIGRATION_PLAN,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts: [
          {
            id: 'workspace_migration_plan',
            path: planArtifactPath,
          },
        ],
        experience,
        details: {
          action: 'dry_run',
          migration_id: plan.migrationId,
          source_workspace_mode: plan.sourceWorkspace.mode,
          target_workspace_mode: plan.targetWorkspace.mode,
          source_workspace_root: plan.sourceWorkspace.workspaceRoot,
          target_workspace_root: plan.targetWorkspace.workspaceRoot,
          plan_path: planArtifactPath,
        },
      },
    };
  }

  private createPlanArtifactPayload(
    context: CliCommandExecutorContext,
    action: CliWorkspaceAction.DRY_RUN | CliWorkspaceAction.EXECUTE,
    config: GovernorConfig,
    targetWorkspace: WorkspaceConfig,
    plan: WorkspaceMigrationPlan,
    planArtifactPath: string,
    cutoverPersistence: WorkspaceCutoverPersistence,
  ) {
    return {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      action,
      sourceConfigPath: context.options.workspace.configPath,
      currentWorkspaceConfig: config.workspace,
      requestedTargetWorkspace: targetWorkspace,
      rollbackReference: {
        planPath: planArtifactPath,
        command: `${CLI_PROGRAM_NAME} workspace --workspace-action rollback --workspace-plan ${planArtifactPath}`,
      },
      cutoverPersistence,
      plan,
    };
  }

  private buildWorkspaceExperience(
    context: CliCommandExecutorContext,
    options: {
      blocking: boolean;
      summary: string;
      artifactPath: string;
      nextActions: string[];
    },
  ) {
    return context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'workspace-migrator',
          stage: ExecutionProgressStage.REPORT,
          status: options.blocking
            ? ExecutionProgressStatus.WARNING
            : ExecutionProgressStatus.COMPLETED,
          category: options.blocking
            ? ExecutionInteractionCategory.HUMAN_CONFIRMATION
            : ExecutionInteractionCategory.NONE,
          summary: options.summary,
          detail: options.artifactPath,
          backlink: {
            artifactPath: options.artifactPath,
          },
        },
      ],
      interactionPrompts: options.nextActions.map((action) => ({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.REPORT,
        title: this.translate(context, 'cli.reactShell.workspace.nextStepTitle'),
        action,
        blocking: false,
      })),
      layeredLogs: {
        summary: [options.summary],
        detailed: [`artifact_path=${options.artifactPath}`],
      },
    });
  }

  /**
   * Builds the shared React CLI summary view for `workspace` when React mode is active.
   * @param context Command execution context.
   * @param options Action-specific migration facts used to populate the shared shell.
   * @returns Shared shell view model or `undefined`.
   */
  private buildReactCliViewModel(
    context: CliCommandExecutorContext,
    options: {
      action: CliWorkspaceAction;
      message: string;
      checks: CliCommandResultCheck[];
      experience: CliCommandExperiencePayload;
      plan: WorkspaceMigrationPlan;
      primaryArtifactPath: string;
      planArtifactPath: string;
    },
  ): ReactCliViewModel | undefined {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      return undefined;
    }

    const descriptor = this.descriptorCatalog
      .createRegistry({
        translate: context.translate,
      })
      .resolve(CliCommandName.WORKSPACE);

    if (!descriptor) {
      return undefined;
    }

    const resolvedThemePreset = runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET;
    return this.viewModelBuilder.build({
      commandName: CliCommandName.WORKSPACE,
      descriptor,
      subtitle: `ui=${runtimeDebugOptions.uiMode} theme=${resolvedThemePreset} stdout=${context.options.outputMode} workspace=${context.options.workspace.mode}`,
      inputTitle: this.translate(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translate(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translate(context, 'cli.reactShell.shared.attention'),
      themePreset: resolvedThemePreset,
      statusMessage: options.experience.layeredLogs.summary[0],
      statusVariant: this.viewModelBuilder.resolveStatusVariantFromChecks(options.checks),
      fieldValues: {
        action: options.action,
        targetMode: options.plan.targetWorkspace.mode,
        targetRoot: options.plan.targetWorkspace.workspaceRoot,
        planPath: options.planArtifactPath,
      },
      summaryLines: [
        options.message,
        this.translate(context, 'cli.reactShell.workspace.summary.migrationId', {
          migrationId: options.plan.migrationId,
        }),
        this.translate(context, 'cli.reactShell.workspace.summary.primaryArtifact', {
          path: options.primaryArtifactPath,
        }),
      ],
      footerShortcutsTitle: this.translate(context, 'cli.reactShell.shared.shortcuts'),
      checks: options.checks,
      interactionPrompts: options.experience.interactionPrompts,
    });
  }

  private buildWorkspaceClearConfigViewModel(
    context: CliCommandExecutorContext,
    options: {
      message: string;
      statusMessage: string;
      checks: CliCommandResultCheck[];
      experience: CliCommandExperiencePayload;
      inspectedConfigPaths: string[];
      clearedConfigPaths: string[];
    },
  ): ReactCliViewModel | undefined {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      return undefined;
    }

    const baseDescriptor = this.descriptorCatalog
      .createRegistry({
        translate: context.translate,
      })
      .resolve(CliCommandName.WORKSPACE);

    if (!baseDescriptor) {
      return undefined;
    }

    const descriptor = {
      ...baseDescriptor,
      title: this.translate(context, 'cli.reactShell.workspace.clearConfigTitle'),
      fields: baseDescriptor.fields.map((field) => {
        if (field.fieldId === 'targetMode') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.currentMode'),
          };
        }

        if (field.fieldId === 'targetRoot') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.currentRoot'),
          };
        }

        if (field.fieldId === 'planPath') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.activeConfigPaths'),
          };
        }

        return field;
      }),
      helpLines: [
        this.translate(context, 'cli.reactShell.workspace.help.clearConfigRemovesSelectorState'),
        this.translate(context, 'cli.reactShell.workspace.help.clearConfigKeepsArtifacts'),
      ],
    };

    const resolvedThemePreset = runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET;
    return this.viewModelBuilder.build({
      commandName: CliCommandName.WORKSPACE,
      descriptor,
      subtitle: `ui=${runtimeDebugOptions.uiMode} theme=${resolvedThemePreset} stdout=${context.options.outputMode} workspace=${context.options.workspace.mode}`,
      inputTitle: this.translate(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translate(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translate(context, 'cli.reactShell.shared.attention'),
      themePreset: resolvedThemePreset,
      statusMessage: options.statusMessage,
      statusVariant: this.viewModelBuilder.resolveStatusVariantFromChecks(options.checks),
      fieldValues: {
        action: CliWorkspaceAction.CLEAR_CONFIG,
        targetMode: context.options.workspace.mode,
        targetRoot: context.options.workspace.workspaceRoot,
        planPath: options.inspectedConfigPaths.join(' | '),
      },
      summaryLines: [
        options.message,
        this.translate(context, 'cli.reactShell.workspace.summary.inspectedConfigPaths', {
          paths: options.inspectedConfigPaths.join(', '),
        }),
        ...(options.clearedConfigPaths.length > 0
          ? options.clearedConfigPaths.map((configPath) =>
              this.translate(context, 'cli.reactShell.workspace.summary.clearedConfigPath', {
                path: configPath,
              }),
            )
          : [this.translate(context, 'cli.reactShell.workspace.summary.noConfigRemoved')]),
      ],
      footerShortcutsTitle: this.translate(context, 'cli.reactShell.shared.shortcuts'),
      checks: options.checks,
      interactionPrompts: options.experience.interactionPrompts,
    });
  }

  private buildWorkspaceSetUiThemeViewModel(
    context: CliCommandExecutorContext,
    options: {
      message: string;
      statusMessage: string;
      checks: CliCommandResultCheck[];
      experience: CliCommandExperiencePayload;
      themePreset: CliReactThemePreset;
      themeScope: CliWorkspaceThemeScope;
      persistedConfigPaths: string[];
    },
  ): ReactCliViewModel | undefined {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      return undefined;
    }

    const baseDescriptor = this.descriptorCatalog
      .createRegistry({
        translate: context.translate,
      })
      .resolve(CliCommandName.WORKSPACE);

    if (!baseDescriptor) {
      return undefined;
    }

    const descriptor = {
      ...baseDescriptor,
      title: this.translate(context, 'cli.reactShell.workspace.setThemeTitle'),
      fields: baseDescriptor.fields.map((field) => {
        if (field.fieldId === 'targetMode') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.themeScope'),
          };
        }

        if (field.fieldId === 'targetRoot') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.currentRoot'),
          };
        }

        if (field.fieldId === 'planPath') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.themePreferencePaths'),
          };
        }

        return field;
      }),
      helpLines: [
        this.translate(context, 'cli.reactShell.workspace.help.setThemePersistsToConfig'),
        this.translate(context, 'cli.reactShell.workspace.help.setThemeFlagStillOverrides'),
      ],
    };

    return this.viewModelBuilder.build({
      commandName: CliCommandName.WORKSPACE,
      descriptor,
      subtitle: `ui=${runtimeDebugOptions.uiMode} theme=${options.themePreset} stdout=${context.options.outputMode} workspace=${context.options.workspace.mode}`,
      inputTitle: this.translate(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translate(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translate(context, 'cli.reactShell.shared.attention'),
      themePreset: options.themePreset,
      statusMessage: options.statusMessage,
      statusVariant: this.viewModelBuilder.resolveStatusVariantFromChecks(options.checks),
      fieldValues: {
        action: CliWorkspaceAction.SET_UI_THEME,
        targetMode: options.themeScope,
        targetRoot: context.options.workspace.workspaceRoot,
        planPath: options.persistedConfigPaths.join(' | '),
      },
      summaryLines: [
        options.message,
        this.translate(context, 'cli.reactShell.workspace.summary.appliedTheme', {
          theme: options.themePreset,
        }),
        this.translate(context, 'cli.reactShell.workspace.summary.appliedThemeScope', {
          scope: this.resolveThemeScopeDisplayLabel(context, options.themeScope),
        }),
        this.translate(context, 'cli.reactShell.workspace.summary.persistenceTarget', {
          target: this.resolveThemePersistenceTargetLabel(
            context,
            options.themeScope,
            options.persistedConfigPaths,
          ),
        }),
        this.translate(context, 'cli.reactShell.workspace.summary.persistedConfigPaths', {
          paths: options.persistedConfigPaths.join(', '),
        }),
      ],
      footerShortcutsTitle: this.translate(context, 'cli.reactShell.shared.shortcuts'),
      checks: options.checks,
      interactionPrompts: options.experience.interactionPrompts,
    });
  }

  private buildWorkspaceBranchSwitchViewModel(
    context: CliCommandExecutorContext,
    options: {
      message: string;
      statusMessage: string;
      checks: CliCommandResultCheck[];
      experience: CliCommandExperiencePayload;
      repositoryRoot: string;
      currentBranch: string | null;
      targetBranch: string;
      artifactPath: string;
    },
  ): ReactCliViewModel | undefined {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      return undefined;
    }

    const baseDescriptor = this.descriptorCatalog
      .createRegistry({
        translate: context.translate,
      })
      .resolve(CliCommandName.WORKSPACE);

    if (!baseDescriptor) {
      return undefined;
    }

    const descriptor = {
      ...baseDescriptor,
      title: this.translate(context, 'cli.reactShell.workspace.switchBranchTitle'),
      fields: baseDescriptor.fields.map((field) => {
        if (field.fieldId === 'action') {
          return {
            ...field,
            options: [
              ...(field.options ?? []),
              {
                label: this.translate(context, 'cli.reactShell.workspace.actions.branchSwitch'),
                value: CliWorkspaceAction.BRANCH_SWITCH,
              },
            ],
          };
        }

        if (field.fieldId === 'targetMode') {
          return {
            ...field,
            kind: ReactCliFieldKind.TEXT,
            label: this.translate(context, 'cli.reactShell.workspace.fields.targetBranch'),
            options: undefined,
          };
        }

        if (field.fieldId === 'targetRoot') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.repositoryRoot'),
          };
        }

        if (field.fieldId === 'planPath') {
          return {
            ...field,
            label: this.translate(context, 'cli.reactShell.workspace.fields.receiptPath'),
          };
        }

        return field;
      }),
      helpLines: [
        this.translate(context, 'cli.reactShell.workspace.help.branchSwitchRequiresCleanTree'),
        this.translate(context, 'cli.reactShell.workspace.help.branchSwitchLocalOnly'),
      ],
    };

    const resolvedThemePreset = runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET;
    return this.viewModelBuilder.build({
      commandName: CliCommandName.WORKSPACE,
      descriptor,
      subtitle: `ui=${runtimeDebugOptions.uiMode} theme=${resolvedThemePreset} stdout=${context.options.outputMode} workspace=${context.options.workspace.mode}`,
      inputTitle: this.translate(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translate(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translate(context, 'cli.reactShell.shared.attention'),
      themePreset: resolvedThemePreset,
      statusMessage: options.statusMessage,
      statusVariant: this.viewModelBuilder.resolveStatusVariantFromChecks(options.checks),
      fieldValues: {
        action: CliWorkspaceAction.BRANCH_SWITCH,
        targetMode: options.targetBranch,
        targetRoot: options.repositoryRoot,
        planPath: options.artifactPath,
      },
      summaryLines: [
        options.message,
        this.translate(context, 'cli.reactShell.workspace.summary.activeBranch', {
          branch: options.currentBranch ?? this.localizeText(context, 'detached HEAD', '游离 HEAD'),
        }),
        this.translate(context, 'cli.reactShell.workspace.summary.targetBranch', {
          branch: options.targetBranch,
        }),
        this.translate(context, 'cli.reactShell.workspace.summary.primaryArtifact', {
          path: options.artifactPath,
        }),
      ],
      footerShortcutsTitle: this.translate(context, 'cli.reactShell.shared.shortcuts'),
      checks: options.checks,
      interactionPrompts: options.experience.interactionPrompts,
    });
  }

  private async readGitStdout(
    repositoryRoot: string,
    args: string[],
    details: Record<string, string | null | undefined>,
    failureMessage: string,
  ): Promise<string> {
    const result = await this.runGitCommand(repositoryRoot, args, details, failureMessage);
    return result.stdout.trim();
  }

  private async runGitCommand(
    repositoryRoot: string,
    args: string[],
    details: Record<string, string | null | undefined>,
    failureMessage: string,
  ): Promise<{
    stdout: string;
    stderr: string;
  }> {
    try {
      const result = await execFileAsync('git', args, {
        cwd: repositoryRoot,
      });
      return {
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(WORKSPACE_BRANCH_SWITCH_ERROR_CODE, failureMessage, {
        ...details,
        args: args.join(' '),
        stderr: standardizedError.message,
      });
    }
  }

  private async switchBranchWithFallback(
    context: CliCommandExecutorContext,
    repositoryRoot: string,
    targetBranch: string,
    currentBranch: string | null,
    detachedHeadLabel: string,
  ): Promise<void> {
    const failureMessage = this.translate(
      context,
      'cli.reactShell.workspace.errors.branchSwitchSwitchFailed',
      {
        currentBranch: currentBranch ?? detachedHeadLabel,
        targetBranch,
      },
    );
    const commandDetails = {
      command: CliCommandName.WORKSPACE,
      action: CliWorkspaceAction.BRANCH_SWITCH,
      repositoryRoot,
      targetBranch,
      previousBranch: currentBranch,
    };

    try {
      await this.runGitCommand(
        repositoryRoot,
        ['switch', '--quiet', targetBranch],
        commandDetails,
        failureMessage,
      );
      return;
    } catch (error) {
      if (!this.isGitSwitchUnsupportedError(error)) {
        throw error;
      }
    }

    await this.runGitCommand(
      repositoryRoot,
      ['checkout', '--quiet', targetBranch],
      {
        ...commandDetails,
        gitFallbackCommand: 'checkout',
      },
      failureMessage,
    );
  }

  private isGitSwitchUnsupportedError(error: unknown): boolean {
    const standardizedError = standardizeError(error);
    const runtimeErrorStderr =
      error instanceof RuntimeError && typeof error.details?.stderr === 'string'
        ? error.details.stderr
        : null;
    const diagnosticText = `${runtimeErrorStderr ?? ''}\n${standardizedError.message}`;
    return /git:\s+'switch'\s+is not a git command|unknown subcommand.+switch|unknown option.+switch/iu.test(
      diagnosticText,
    );
  }

  private async validateTargetBranch(
    context: CliCommandExecutorContext,
    repositoryRoot: string,
    targetBranch: string,
  ): Promise<void> {
    try {
      await execFileAsync('git', ['check-ref-format', '--branch', targetBranch], {
        cwd: repositoryRoot,
      });
    } catch (error) {
      const standardizedError = standardizeError(error);
      if (this.readProcessExitCode(error) === 128) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchInvalidTarget', {
            targetBranch,
          }),
          {
            command: CliCommandName.WORKSPACE,
            action: CliWorkspaceAction.BRANCH_SWITCH,
            repositoryRoot,
            targetBranch,
            stderr: standardizedError.message,
          },
        );
      }

      throw new RuntimeError(
        WORKSPACE_BRANCH_SWITCH_ERROR_CODE,
        this.translate(
          context,
          'cli.reactShell.workspace.errors.branchSwitchValidateTargetFailed',
          {
            targetBranch,
          },
        ),
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.BRANCH_SWITCH,
          repositoryRoot,
          targetBranch,
          stderr: standardizedError.message,
        },
      );
    }
  }

  private async checkLocalBranchExists(
    context: CliCommandExecutorContext,
    repositoryRoot: string,
    targetBranch: string,
  ): Promise<boolean> {
    try {
      await execFileAsync(
        'git',
        ['show-ref', '--verify', '--quiet', `refs/heads/${targetBranch}`],
        {
          cwd: repositoryRoot,
        },
      );
      return true;
    } catch (error) {
      if (this.readProcessExitCode(error) === 1) {
        return false;
      }

      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        WORKSPACE_BRANCH_SWITCH_ERROR_CODE,
        this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchCheckLocalFailed', {
          targetBranch,
        }),
        {
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.BRANCH_SWITCH,
          repositoryRoot,
          targetBranch,
          stderr: standardizedError.message,
        },
      );
    }
  }

  private async listGitStatusEntries(
    context: CliCommandExecutorContext,
    repositoryRoot: string,
  ): Promise<string[]> {
    const stdout = await this.readGitStdout(
      repositoryRoot,
      ['status', '--porcelain'],
      {
        command: CliCommandName.WORKSPACE,
        action: CliWorkspaceAction.BRANCH_SWITCH,
        repositoryRoot,
      },
      this.translate(context, 'cli.reactShell.workspace.errors.branchSwitchInspectStatusFailed', {
        repositoryRoot,
      }),
    );

    return stdout
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);
  }

  private readProcessExitCode(error: unknown): number | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'number'
    ) {
      return (error as { code: number }).code;
    }

    return null;
  }

  private normalizeOptionalGitValue(value: string): string | null {
    return value.length > 0 ? value : null;
  }

  /**
   * Resolves one localized React-shell string through i18n runtime.
   * @param context Command execution context.
   * @param key Translation key.
   * @param interpolation Optional translation variables.
   * @returns Localized string or the key when translation runtime is unavailable.
   */
  private translate(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate?.(key, interpolation) ?? key;
  }

  /**
   * Resolves one inline bilingual string through the active localization bridge.
   * @param context Command execution context.
   * @param english English fallback copy.
   * @param chinese Simplified Chinese copy.
   * @returns Localized string when the bridge is available.
   */
  private localizeText(
    context: Pick<CliCommandExecutorContext, 'localizeText'>,
    english: string,
    chinese: string,
  ): string {
    return context.localizeText?.(english, chinese) ?? english;
  }

  /**
   * Encodes workspace target detail into one stable machine-readable string.
   * @param mode Target workspace mode.
   * @param root Target workspace root.
   * @returns Structured detail string.
   */
  private createWorkspaceTargetDetail(mode: string, root: string): string {
    return JSON.stringify({
      [CliWorkspaceTargetDetailField.MODE]: mode,
      [CliWorkspaceTargetDetailField.ROOT]: root,
    });
  }

  /**
   * Encodes scratch cleanup detail into one stable machine-readable string.
   * @param status Cleanup status.
   * @param root Scratch cleanup root.
   * @returns Structured detail string.
   */
  private createWorkspaceScratchCleanupDetail(
    status: CliWorkspaceScratchCleanupStatus,
    root: string,
  ): string {
    return JSON.stringify(
      status === CliWorkspaceScratchCleanupStatus.REMOVED
        ? {
            [CliWorkspaceScratchCleanupDetailField.ROOT_REMOVED]: root,
          }
        : {
            [CliWorkspaceScratchCleanupDetailField.ROOT_RETAINED]: root,
          },
    );
  }

  private parseWorkspaceMigrationPlan(
    payload: Record<string, unknown>,
    planArtifactPath: string,
  ): WorkspaceMigrationPlan {
    const rawPlan = this.readRecord(payload.plan, 'plan', planArtifactPath);
    return {
      migrationId: this.readString(rawPlan.migrationId, 'plan.migrationId', planArtifactPath),
      sourceWorkspace: this.parseResolvedWorkspace(
        rawPlan.sourceWorkspace,
        'plan.sourceWorkspace',
        planArtifactPath,
      ),
      targetWorkspace: this.parseResolvedWorkspace(
        rawPlan.targetWorkspace,
        'plan.targetWorkspace',
        planArtifactPath,
      ),
      stagingWorkspaceRoot: this.readString(
        rawPlan.stagingWorkspaceRoot,
        'plan.stagingWorkspaceRoot',
        planArtifactPath,
      ),
      backupWorkspaceRoot: this.readString(
        rawPlan.backupWorkspaceRoot,
        'plan.backupWorkspaceRoot',
        planArtifactPath,
      ),
      previousTargetBackupRoot: this.readString(
        rawPlan.previousTargetBackupRoot,
        'plan.previousTargetBackupRoot',
        planArtifactPath,
      ),
    };
  }

  private parseCutoverPersistence(
    payload: Record<string, unknown>,
    planArtifactPath: string,
  ): WorkspaceCutoverPersistence | null {
    const rawPersistence = payload.cutoverPersistence;
    if (rawPersistence === undefined) {
      return null;
    }

    const record = this.readRecord(rawPersistence, 'cutoverPersistence', planArtifactPath);
    const repoLocalConfigPath = this.readString(
      record.repoLocalConfigPath,
      'cutoverPersistence.repoLocalConfigPath',
      planArtifactPath,
    );
    const repoLocalConfigSnapshot =
      record.repoLocalConfigSnapshot === null
        ? null
        : this.readString(
            record.repoLocalConfigSnapshot,
            'cutoverPersistence.repoLocalConfigSnapshot',
            planArtifactPath,
          );

    return {
      repoLocalConfigPath,
      repoLocalConfigSnapshot,
    };
  }

  private parseResolvedWorkspace(
    value: unknown,
    fieldPath: string,
    planArtifactPath: string,
  ): ResolvedWorkspace {
    const record = this.readRecord(value, fieldPath, planArtifactPath);
    const mode = this.readString(record.mode, `${fieldPath}.mode`, planArtifactPath);
    const modeSource = this.readString(
      record.modeSource,
      `${fieldPath}.modeSource`,
      planArtifactPath,
    );
    if (mode !== WorkspaceMode.REPO_LOCAL && mode !== WorkspaceMode.TOOL_MANAGED) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
        `Invalid workspace mode "${mode}" in ${planArtifactPath}.`,
        {
          planPath: planArtifactPath,
          field: `${fieldPath}.mode`,
          mode,
        },
      );
    }
    if (
      modeSource !== WorkspaceModeSource.RUNTIME &&
      modeSource !== WorkspaceModeSource.CONFIG &&
      modeSource !== WorkspaceModeSource.DEFAULT
    ) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
        `Invalid workspace modeSource "${modeSource}" in ${planArtifactPath}.`,
        {
          planPath: planArtifactPath,
          field: `${fieldPath}.modeSource`,
          modeSource,
        },
      );
    }

    return {
      workspaceId: this.readString(
        record.workspaceId,
        `${fieldPath}.workspaceId`,
        planArtifactPath,
      ),
      mode,
      modeSource,
      repositoryRoot: this.readString(
        record.repositoryRoot,
        `${fieldPath}.repositoryRoot`,
        planArtifactPath,
      ),
      workspaceRoot: this.readString(
        record.workspaceRoot,
        `${fieldPath}.workspaceRoot`,
        planArtifactPath,
      ),
      configPath: this.readString(record.configPath, `${fieldPath}.configPath`, planArtifactPath),
    };
  }

  private readRecord(
    value: unknown,
    fieldPath: string,
    planArtifactPath: string,
  ): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    throw new RuntimeError(
      GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
      `Invalid workspace migration plan artifact at ${planArtifactPath}; ${fieldPath} must be an object.`,
      {
        planPath: planArtifactPath,
        field: fieldPath,
      },
    );
  }

  private readString(value: unknown, fieldPath: string, planArtifactPath: string): string {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    throw new RuntimeError(
      GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
      `Invalid workspace migration plan artifact at ${planArtifactPath}; ${fieldPath} must be a non-empty string.`,
      {
        planPath: planArtifactPath,
        field: fieldPath,
      },
    );
  }

  private resolveAbsolutePath(currentWorkingDirectory: string, pathValue: string): string {
    if (isAbsolute(pathValue)) {
      return resolve(pathValue);
    }

    return resolve(currentWorkingDirectory, pathValue);
  }

  private buildWorkspaceArtifactPath(
    workspaceRoot: string,
    migrationId: string,
    artifactType: 'plan' | 'execution' | 'failure' | 'rollback',
  ): string {
    return resolve(workspaceRoot, 'context', 'workspace', `${migrationId}.${artifactType}.json`);
  }

  private buildWorkspaceBranchSwitchArtifactPath(
    workspaceRoot: string,
    artifactId: string,
  ): string {
    return resolve(workspaceRoot, 'context', 'workspace', `${artifactId}.json`);
  }

  private createArtifactTimestamp(value: Date): string {
    return value.toISOString().replace(/[:.]/gu, '-');
  }

  private sanitizeArtifactToken(value: string): string {
    return value.replace(/[^A-Za-z0-9._-]/gu, '-');
  }

  private resolveMigrationScratchRoot(plan: WorkspaceMigrationPlan): string {
    return resolve(plan.stagingWorkspaceRoot, '..');
  }

  private resolveWorkspaceConfigPersistencePaths(context: CliCommandExecutorContext): string[] {
    const repoLocalConfigPath = this.resolveRepositoryLocalConfigPath(
      context.options.workspace.repositoryRoot,
    );
    return [...new Set([repoLocalConfigPath, context.options.workspace.configPath])];
  }

  private resolveRepositoryLocalConfigPath(repositoryRoot: string): string {
    return resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml');
  }

  private async captureCutoverPersistence(
    plan: WorkspaceMigrationPlan,
  ): Promise<WorkspaceCutoverPersistence> {
    const repoLocalConfigPath = this.resolveRepositoryLocalConfigPath(
      plan.sourceWorkspace.repositoryRoot,
    );
    return {
      repoLocalConfigPath,
      repoLocalConfigSnapshot: existsSync(repoLocalConfigPath)
        ? await readFile(repoLocalConfigPath, 'utf8')
        : null,
    };
  }

  private async persistUiThemeConfig(
    context: CliCommandExecutorContext,
    config: GovernorConfig | null,
    themePreset: CliReactThemePreset,
  ): Promise<string[]> {
    if (!config) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `workspace requires config file at ${context.options.workspace.configPath}; run \`init\` first.`,
        {
          configPath: context.options.workspace.configPath,
          command: CliCommandName.WORKSPACE,
          action: CliWorkspaceAction.SET_UI_THEME,
        },
      );
    }

    const persistedConfigContent = this.renderUiThemeConfig(
      config,
      context.options.profileId ?? null,
      themePreset,
    );
    const configPaths = this.resolveUiThemePersistencePaths(context);

    for (const configPath of configPaths) {
      await context.artifactWriter.writeTextArtifact(configPath, persistedConfigContent);
    }

    return configPaths;
  }

  private async persistGlobalUiThemePreference(
    context: CliCommandExecutorContext,
    themePreset: CliReactThemePreset,
  ): Promise<string[]> {
    const preferencePath =
      context.options.workspaceCommandOptions?.themePreferencePath?.trim() ||
      this.globalThemePreferenceService.resolvePreferencePath();
    await context.artifactWriter.writeTextArtifact(
      preferencePath,
      this.globalThemePreferenceService.renderMergedPreferenceContent({
        themePreset,
        environment: context.options.environment,
        preferencePath,
      }),
    );
    return [preferencePath];
  }

  private resolveUiThemePersistencePaths(context: CliCommandExecutorContext): string[] {
    const activeConfigPath = context.options.workspace.configPath;
    const repoLocalConfigPath = this.resolveRepositoryLocalConfigPath(
      context.options.workspace.repositoryRoot,
    );

    if (repoLocalConfigPath === activeConfigPath) {
      return [activeConfigPath];
    }

    return existsSync(repoLocalConfigPath)
      ? [activeConfigPath, repoLocalConfigPath]
      : [activeConfigPath];
  }

  private async persistCutoverConfig(
    context: CliCommandExecutorContext,
    config: GovernorConfig,
    targetWorkspace: WorkspaceConfig,
    plan: WorkspaceMigrationPlan,
  ): Promise<void> {
    const persistedConfigContent = this.renderWorkspaceCutoverConfig(
      config,
      targetWorkspace,
      context.options.profileId,
    );
    const repoLocalConfigPath = this.resolveRepositoryLocalConfigPath(
      plan.sourceWorkspace.repositoryRoot,
    );

    await context.artifactWriter.writeTextArtifact(
      plan.targetWorkspace.configPath,
      persistedConfigContent,
    );
    if (repoLocalConfigPath !== plan.targetWorkspace.configPath) {
      await context.artifactWriter.writeTextArtifact(repoLocalConfigPath, persistedConfigContent);
    }
  }

  private async restoreCutoverPersistence(
    context: CliCommandExecutorContext,
    cutoverPersistence: WorkspaceCutoverPersistence | null,
  ): Promise<void> {
    if (!cutoverPersistence) {
      return;
    }

    if (cutoverPersistence.repoLocalConfigSnapshot === null) {
      await rm(cutoverPersistence.repoLocalConfigPath, { force: true });
      return;
    }

    await context.artifactWriter.writeTextArtifact(
      cutoverPersistence.repoLocalConfigPath,
      cutoverPersistence.repoLocalConfigSnapshot,
    );
  }

  private renderWorkspaceCutoverConfig(
    config: GovernorConfig,
    targetWorkspace: WorkspaceConfig,
    selectedProfileId: string | null,
  ): string {
    const persistedWorkspace = this.buildWorkspaceShape(
      targetWorkspace,
      config.workspace.migrationPolicy,
    );
    const nextConfig: GovernorConfig = {
      ...config,
      workspace: persistedWorkspace,
    };
    const activeProfileId = selectedProfileId ?? null;
    const selectedProfile = activeProfileId ? nextConfig.profiles?.[activeProfileId] : undefined;
    if (activeProfileId && selectedProfile && nextConfig.profiles) {
      nextConfig.profiles = {
        ...nextConfig.profiles,
        [activeProfileId]: {
          ...selectedProfile,
          workspace: this.buildProfileWorkspaceShape(
            selectedProfile.workspace,
            targetWorkspace,
            persistedWorkspace.migrationPolicy,
          ),
        },
      };
    }

    return `${stringify(nextConfig).trimEnd()}\n`;
  }

  private renderUiThemeConfig(
    config: GovernorConfig,
    selectedProfileId: string | null,
    themePreset: CliReactThemePreset,
  ): string {
    const nextConfig: GovernorConfig = {
      ...config,
      ui: {
        ...(config.ui ?? {}),
        react: {
          ...(config.ui?.react ?? {}),
          theme: themePreset,
        },
      },
    };
    const activeProfileId = selectedProfileId ?? null;
    const selectedProfile = activeProfileId ? nextConfig.profiles?.[activeProfileId] : undefined;
    if (activeProfileId && selectedProfile && nextConfig.profiles) {
      nextConfig.profiles = {
        ...nextConfig.profiles,
        [activeProfileId]: {
          ...selectedProfile,
          ui: this.buildProfileUiShape(selectedProfile.ui, themePreset),
        },
      };
    }

    return `${stringify(nextConfig).trimEnd()}\n`;
  }

  private buildProfileWorkspaceShape(
    currentWorkspace: GovernorProfile['workspace'],
    targetWorkspace: WorkspaceConfig,
    fallbackMigrationPolicy: WorkspaceConfig['migrationPolicy'],
  ): GovernorProfile['workspace'] {
    return this.buildWorkspaceShape(
      targetWorkspace,
      currentWorkspace?.migrationPolicy ?? fallbackMigrationPolicy,
    );
  }

  private buildProfileUiShape(
    currentUi: GovernorProfile['ui'],
    themePreset: CliReactThemePreset,
  ): GovernorProfile['ui'] {
    return {
      ...(currentUi ?? {}),
      react: {
        ...(currentUi?.react ?? {}),
        theme: themePreset,
      },
    };
  }

  private buildWorkspaceShape(
    targetWorkspace: WorkspaceConfig,
    migrationPolicy: WorkspaceConfig['migrationPolicy'],
  ): WorkspaceConfig {
    return {
      mode: targetWorkspace.mode,
      ...(targetWorkspace.mode === WorkspaceMode.TOOL_MANAGED && targetWorkspace.toolManagedRoot
        ? {
            toolManagedRoot: targetWorkspace.toolManagedRoot,
          }
        : {}),
      ...(targetWorkspace.mode === WorkspaceMode.REPO_LOCAL && targetWorkspace.repoLocalRoot
        ? {
            repoLocalRoot: targetWorkspace.repoLocalRoot,
          }
        : {}),
      ...(migrationPolicy
        ? {
            migrationPolicy,
          }
        : {}),
    };
  }
}
