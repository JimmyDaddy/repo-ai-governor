import { existsSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

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
import { CliWorkspaceAction } from '../constants/cli-workspace.constant.js';
import {
  ReactCliCommandDescriptorCatalog,
  ReactCliCommandViewModelBuilder,
  type ReactCliViewModel,
} from '../react-cli/index.js';
import type {
  CliCommandExecutorContext,
  CliCommandExperiencePayload,
  CliCommandResultArtifact,
  CliCommandResultCheck,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

interface CliWorkspaceCommandDependencies {
  configLoader?: Pick<ConfigLoader, 'loadFromFile'>;
  workspaceMigrationService?: Pick<WorkspaceMigrationService, 'plan' | 'execute' | 'rollback'>;
  descriptorCatalog?: ReactCliCommandDescriptorCatalog;
  viewModelBuilder?: ReactCliCommandViewModelBuilder;
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

  public constructor(dependencies: CliWorkspaceCommandDependencies = {}) {
    this.configLoader = dependencies.configLoader ?? new ConfigLoader();
    this.workspaceMigrationService =
      dependencies.workspaceMigrationService ?? new WorkspaceMigrationService();
    this.descriptorCatalog =
      dependencies.descriptorCatalog ?? new ReactCliCommandDescriptorCatalog();
    this.viewModelBuilder = dependencies.viewModelBuilder ?? new ReactCliCommandViewModelBuilder();
  }

  public async execute(context: CliCommandExecutorContext) {
    const action = this.resolveAction(context);

    if (action === CliWorkspaceAction.ROLLBACK) {
      return this.executeRollback(context);
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
      rawAction === CliWorkspaceAction.ROLLBACK
    ) {
      return rawAction;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      'workspace requires --workspace-action dry-run|execute|rollback.',
      {
        command: CliCommandName.WORKSPACE,
        action: rawAction,
      },
    );
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

    return this.viewModelBuilder.build({
      commandName: CliCommandName.WORKSPACE,
      descriptor,
      subtitle: `ui=${runtimeDebugOptions.uiMode} stdout=${context.options.outputMode} workspace=${context.options.workspace.mode}`,
      inputTitle: this.translate(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translate(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translate(context, 'cli.reactShell.shared.attention'),
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

  private resolveMigrationScratchRoot(plan: WorkspaceMigrationPlan): string {
    return resolve(plan.stagingWorkspaceRoot, '..');
  }

  private async captureCutoverPersistence(
    plan: WorkspaceMigrationPlan,
  ): Promise<WorkspaceCutoverPersistence> {
    const repoLocalConfigPath = resolve(
      plan.sourceWorkspace.repositoryRoot,
      '.repo-ai-governor',
      'governor.yaml',
    );
    return {
      repoLocalConfigPath,
      repoLocalConfigSnapshot: existsSync(repoLocalConfigPath)
        ? await readFile(repoLocalConfigPath, 'utf8')
        : null,
    };
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
    const repoLocalConfigPath = resolve(
      plan.sourceWorkspace.repositoryRoot,
      '.repo-ai-governor',
      'governor.yaml',
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
