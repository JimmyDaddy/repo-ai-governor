import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CliCommandResultCheckId,
  CliPlanCommitReadinessDetailField,
  CliPlanLedgerProjectionDetailField,
  CliPlanReceiptDetailField,
  CliPlanTaskPackageDetailField,
} from '../constants/cli-command-result-check.constant.js';
import { CLI_PROGRAM_NAME, CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import {
  CLI_PLAN_ACTION_ORDER,
  CLI_PLAN_ACTION_VALUES,
  CLI_PLAN_CONFIRMATION_DECISION_VALUES,
  CliPlanAction,
  CliPlanArtifactId,
  CliPlanCommitReadiness,
  CliPlanCommitStatus,
  CliPlanConfirmationDecision,
  CliPlanLedgerProjectionMode,
  CliPlanTaskProjectionAction,
  CliPlanTaskStatusSeed,
} from '../constants/cli-plan.constant.js';
import type { CliCommandExecutorContext, CliCommandResultCheck } from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

const TASK_CARD_FILE_PATTERN = /^TK-(\d{3}).*\.md$/u;
const TASK_ID_PREFIX_PATTERN = /^`?(TK-\d{3})`?\s+(.+)$/u;
const DEFAULT_TASK_OWNER = 'AI-Agent';
const DEFAULT_TASK_PRIORITY = 'P0';

interface CliPlanPrimaryStream {
  currentContextPath: string;
  projectId: string | null;
  sprintId: string | null;
  projectPlanPath: string | null;
  tasksDirPath: string | null;
  checklistPath: string | null;
  csvPath: string | null;
  reviewPath: string | null;
  sprintPlanPath: string | null;
}

interface CliExistingTaskCard {
  taskId: string;
  title: string;
  normalizedTitle: string;
}

interface CliPlanPreviewTaskPackageItem {
  provisionalTaskId: string;
  title: string;
  owner: string;
  priority: string;
  dueDate: string;
  statusSeed: CliPlanTaskStatusSeed;
  implementationPlan: string[];
  verification: string[];
  dependsOn: string[];
  projectionAction: CliPlanTaskProjectionAction;
}

interface CliPlanPreviewState {
  planId: string;
  planSummary: string;
  sprintGoal: string;
  taskPackage: CliPlanPreviewTaskPackageItem[];
  exitCriteria: string[];
  risks: string[];
  assumptions: string[];
  ledgerProjectionPreview: {
    planMd: CliPlanLedgerProjectionMode;
    checklistMd: CliPlanLedgerProjectionMode;
    tasksCsv: CliPlanLedgerProjectionMode;
    tkFiles: CliPlanLedgerProjectionMode;
  };
  commitReadiness: CliPlanCommitReadiness;
  missingFields: string[];
  createCount: number;
  retainCount: number;
}

interface CliPlanPreviewArtifactPayload {
  planId: string;
  generatedAt: string;
  workspace: {
    workspaceId: string;
    workspaceRoot: string;
    workspaceMode: string;
  };
  targetStream: {
    currentContextPath: string | null;
    projectId: string | null;
    sprintId: string | null;
    projectPlanPath: string | null;
    sprintPlanPath: string | null;
    tasksDirPath: string | null;
    checklistPath: string | null;
    csvPath: string | null;
    reviewPath: string | null;
  };
  sourceFacts: {
    taskPackageSeedCount: number;
    existingTaskCount: number;
  };
  preview: CliPlanPreviewState;
  guidance: {
    commitCommand: string;
  };
}

interface CliPlanCommitReceiptArtifactPayload {
  planCommitId: string;
  sourcePlanId: string;
  sourcePreviewPath: string;
  status: CliPlanCommitStatus;
  committedAt: string;
  targetStream: {
    projectId: string | null;
    sprintId: string | null;
    sprintPlanPath: string | null;
    tasksDirPath: string | null;
    checklistPath: string | null;
    csvPath: string | null;
  };
  createdTaskIds: string[];
  retainedTaskIds: string[];
}

function resolveTaskLedgerSyncScriptPath(): string | null {
  const sourceFilePath = fileURLToPath(import.meta.url);
  const searchRoots = [process.cwd(), dirname(sourceFilePath)];

  for (const searchRoot of searchRoots) {
    let currentDirectory = searchRoot;
    for (let depth = 0; depth < 8; depth += 1) {
      const candidatePath = resolve(
        currentDirectory,
        'scripts',
        'governance',
        'sync-task-ledger.js',
      );
      if (existsSync(candidatePath)) {
        return candidatePath;
      }

      const parentDirectory = resolve(currentDirectory, '..');
      if (parentDirectory === currentDirectory) {
        break;
      }

      currentDirectory = parentDirectory;
    }
  }

  return null;
}

/**
 * Owns `plan` preview and confirmation-gated ledger commit execution.
 */
export class CliPlanCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.PLAN;

  public async execute(context: CliCommandExecutorContext) {
    const action = this.resolveAction(context);
    switch (action) {
      case CliPlanAction.COMMIT:
        return await this.executeCommit(context);
      default:
        return await this.executePreview(context);
    }
  }

  private async executePreview(context: CliCommandExecutorContext) {
    const planId = `plan-${Date.now()}`;
    const generatedAt = context.toRfc3339SecondsTimestamp(new Date());
    const stream = await this.resolvePrimaryStream(context);
    const sprintPlanContent = await this.readTextIfExists(stream?.sprintPlanPath ?? null);
    const taskPackageSeeds = this.parseListSection(sprintPlanContent, 'Task Package');
    const exitCriteria = this.parseListSection(sprintPlanContent, 'Exit Criteria');
    const sprintGoal =
      this.parseMetadataValue(sprintPlanContent, 'Sprint Goal') ??
      this.translate(context, 'cli.commandMessages.plan.defaultSprintGoal');
    const existingTaskCards = await this.readExistingTaskCards(stream?.tasksDirPath ?? null);
    const previewState = this.createPreviewState({
      planId,
      stream,
      sprintGoal,
      taskPackageSeeds,
      exitCriteria,
      existingTaskCards,
    });
    const previewPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'plan',
      `${planId}.preview.json`,
    );
    const previewArtifact = this.createPreviewArtifactPayload(
      context,
      stream,
      previewState,
      previewPath,
      generatedAt,
      taskPackageSeeds.length,
      existingTaskCards.length,
    );
    await context.artifactWriter.writeJsonArtifact(previewPath, previewArtifact);

    const checks = this.buildPreviewChecks(previewState);
    const nextActions = [
      this.translate(context, 'cli.commandMessages.plan.inspectPreview', {
        previewPath,
      }),
      previewState.commitReadiness === CliPlanCommitReadiness.READY
        ? this.translate(context, 'cli.commandMessages.plan.runCommit', {
            command: this.buildCommitCommand(previewPath),
          })
        : this.translate(context, 'cli.commandMessages.plan.reviewSprintPlan'),
    ];
    const messageKey =
      previewState.commitReadiness === CliPlanCommitReadiness.READY
        ? 'cli.commandMessages.plan.previewCompleted'
        : 'cli.commandMessages.plan.previewCompletedReadOnly';
    const message = this.translate(context, messageKey, {
      readiness: previewState.commitReadiness,
      previewPath,
    });
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'planner',
          stage: ExecutionProgressStage.REPORT,
          status:
            previewState.commitReadiness === CliPlanCommitReadiness.READY
              ? ExecutionProgressStatus.COMPLETED
              : ExecutionProgressStatus.WARNING,
          category:
            previewState.commitReadiness === CliPlanCommitReadiness.READY
              ? ExecutionInteractionCategory.HUMAN_CONFIRMATION
              : ExecutionInteractionCategory.NONE,
          summary: message,
          detail: previewPath,
          backlink: {
            artifactPath: previewPath,
          },
        },
      ],
      interactionPrompts: nextActions.map((action) => ({
        category:
          previewState.commitReadiness === CliPlanCommitReadiness.READY
            ? ExecutionInteractionCategory.HUMAN_CONFIRMATION
            : ExecutionInteractionCategory.NONE,
        stage:
          previewState.commitReadiness === CliPlanCommitReadiness.READY
            ? ExecutionProgressStage.HUMAN_CONFIRMATION
            : ExecutionProgressStage.REPORT,
        title: this.translate(context, 'cli.commandMessages.plan.nextStepTitle'),
        action,
        blocking: false,
      })),
      layeredLogs: {
        summary: [
          `plan_id=${planId}`,
          `commit_readiness=${previewState.commitReadiness}`,
          `task_package_total=${previewState.taskPackage.length}`,
        ],
        detailed: [
          `preview_path=${previewPath}`,
          ...(stream?.projectId ? [`project_id=${stream.projectId}`] : []),
          ...(stream?.sprintId ? [`sprint_id=${stream.sprintId}`] : []),
          ...(stream?.sprintPlanPath ? [`sprint_plan_path=${stream.sprintPlanPath}`] : []),
          ...(stream?.tasksDirPath ? [`tasks_dir=${stream.tasksDirPath}`] : []),
          `missing_fields=${previewState.missingFields.length}`,
        ],
      },
    });

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.PLAN_PREVIEW,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts: [
          {
            id: CliPlanArtifactId.PREVIEW,
            path: previewPath,
          },
        ],
        experience,
        details: {
          action: CliPlanAction.PREVIEW,
          plan_id: planId,
          target_project_id: stream?.projectId ?? null,
          target_sprint_id: stream?.sprintId ?? null,
          preview_path: previewPath,
          sprint_plan_path: stream?.sprintPlanPath ?? null,
          tasks_dir: stream?.tasksDirPath ?? null,
          commit_readiness: previewState.commitReadiness,
          task_package_total: previewState.taskPackage.length,
          task_package_create_count: previewState.createCount,
          task_package_retain_count: previewState.retainCount,
          missing_field_count: previewState.missingFields.length,
        },
      },
    };
  }

  private async executeCommit(context: CliCommandExecutorContext) {
    const previewPath = context.options.planCommandOptions?.artifactPath?.trim() ?? null;
    if (!previewPath) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.commandMessages.plan.missingArtifactPath'),
        {
          command: CliCommandName.PLAN,
          action: CliPlanAction.COMMIT,
        },
      );
    }

    const confirmationDecision = this.resolveConfirmationDecision(context);
    const previewPayload = await this.loadPreviewArtifact(context, previewPath);
    const previewState = previewPayload.preview;
    const targetStream = previewPayload.targetStream;
    const activeStream = await this.resolvePrimaryStream(context);

    if (!this.streamMatchesPreview(activeStream, targetStream)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.commandMessages.plan.commitTargetDrift'),
        {
          previewPath,
          activeProjectId: activeStream?.projectId,
          activeSprintId: activeStream?.sprintId,
        },
      );
    }

    const planCommitId = `plan-commit-${Date.now()}`;
    const committedAt = context.toRfc3339SecondsTimestamp(new Date());
    const receiptPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'plan',
      `${planCommitId}.commit-receipt.json`,
    );

    if (confirmationDecision === CliPlanConfirmationDecision.REJECT) {
      const receiptPayload = this.createCommitReceiptPayload({
        planCommitId,
        sourcePreviewPath: previewPath,
        previewPayload,
        committedAt,
        status: CliPlanCommitStatus.CANCELLED,
        createdTaskIds: [],
        retainedTaskIds: previewState.taskPackage.map((task) => task.provisionalTaskId),
      });
      await context.artifactWriter.writeJsonArtifact(receiptPath, receiptPayload);
      const checks = this.buildCommitChecks(
        previewState,
        receiptPath,
        CliPlanCommitStatus.CANCELLED,
        0,
        previewState.taskPackage.length,
      );
      const message = this.translate(context, 'cli.commandMessages.plan.commitRejected', {
        receiptPath,
      });

      return {
        message,
        commandResult: {
          operation: CLI_RUNTIME_OPERATION.PLAN_COMMIT,
          summary: message,
          check_totals: context.calculateCheckTotals(checks),
          checks,
          artifacts: [
            {
              id: CliPlanArtifactId.COMMIT_RECEIPT,
              path: receiptPath,
            },
          ],
          details: {
            action: CliPlanAction.COMMIT,
            commit_status: CliPlanCommitStatus.CANCELLED,
            source_preview_path: previewPath,
            receipt_path: receiptPath,
            created_task_count: 0,
            retained_task_count: previewState.taskPackage.length,
            sprint_plan_path: targetStream.sprintPlanPath ?? null,
            tasks_dir: targetStream.tasksDirPath ?? null,
          },
        },
      };
    }

    if (previewState.commitReadiness !== CliPlanCommitReadiness.READY) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.commandMessages.plan.commitPreviewNotReady', {
          previewPath,
          readiness: previewState.commitReadiness,
        }),
        {
          previewPath,
          readiness: previewState.commitReadiness,
          missingFields: previewState.missingFields,
        },
      );
    }

    if (!activeStream?.tasksDirPath || !activeStream.sprintPlanPath) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.commandMessages.plan.invalidPreviewArtifact', {
          previewPath,
        }),
      );
    }

    const existingTaskCards = await this.readExistingTaskCards(activeStream.tasksDirPath);
    const existingTaskIds = new Set(existingTaskCards.map((task) => task.taskId));
    const existingTaskTitles = new Map(
      existingTaskCards.map((task) => [task.normalizedTitle, task.taskId] as const),
    );
    const createdTaskIds: string[] = [];
    const retainedTaskIds: string[] = [];
    const finalTaskPackage = previewState.taskPackage.map((task) => {
      const normalizedTitle = this.normalizeTitle(task.title);
      const retainedTaskId = existingTaskIds.has(task.provisionalTaskId)
        ? task.provisionalTaskId
        : (existingTaskTitles.get(normalizedTitle) ?? null);
      if (task.projectionAction === CliPlanTaskProjectionAction.RETAIN_EXISTING || retainedTaskId) {
        retainedTaskIds.push(retainedTaskId ?? task.provisionalTaskId);
        return {
          ...task,
          provisionalTaskId: retainedTaskId ?? task.provisionalTaskId,
          projectionAction: CliPlanTaskProjectionAction.RETAIN_EXISTING,
        };
      }

      createdTaskIds.push(task.provisionalTaskId);
      return task;
    });

    for (const task of finalTaskPackage) {
      if (task.projectionAction !== CliPlanTaskProjectionAction.CREATE) {
        continue;
      }

      const taskFilePath = resolve(
        activeStream.tasksDirPath,
        `${task.provisionalTaskId}-${this.slugifyTitle(task.title)}.md`,
      );
      const taskCardContent = this.buildTaskCardContent(
        task,
        activeStream,
        previewState.sprintGoal,
        committedAt.slice(0, 10),
      );
      await context.artifactWriter.writeTextArtifact(taskFilePath, taskCardContent);
    }

    const sprintPlanContent =
      (await this.readTextIfExists(activeStream.sprintPlanPath)) ??
      this.buildSprintPlanSkeleton(activeStream, previewState.sprintGoal);
    const updatedSprintPlanContent = this.updateSprintPlan(
      sprintPlanContent,
      previewState,
      finalTaskPackage,
      committedAt.slice(0, 10),
    );
    await context.artifactWriter.writeTextArtifact(
      activeStream.sprintPlanPath,
      updatedSprintPlanContent,
    );
    await this.runTaskLedgerSync(context);

    const receiptPayload = this.createCommitReceiptPayload({
      planCommitId,
      sourcePreviewPath: previewPath,
      previewPayload,
      committedAt,
      status: CliPlanCommitStatus.COMMITTED,
      createdTaskIds,
      retainedTaskIds,
    });
    await context.artifactWriter.writeJsonArtifact(receiptPath, receiptPayload);

    const checks = this.buildCommitChecks(
      previewState,
      receiptPath,
      CliPlanCommitStatus.COMMITTED,
      createdTaskIds.length,
      retainedTaskIds.length,
    );
    const message = this.translate(context, 'cli.commandMessages.plan.commitCompleted', {
      receiptPath,
      createdCount: String(createdTaskIds.length),
      retainedCount: String(retainedTaskIds.length),
    });
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'planner',
          stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: message,
          detail: receiptPath,
          backlink: {
            artifactPath: receiptPath,
          },
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title: this.translate(context, 'cli.commandMessages.plan.nextStepTitle'),
          action: this.translate(context, 'cli.commandMessages.plan.inspectCommitReceipt', {
            receiptPath,
          }),
          blocking: false,
        },
      ],
      layeredLogs: {
        summary: [
          `plan_commit_id=${planCommitId}`,
          `created_task_count=${createdTaskIds.length}`,
          `retained_task_count=${retainedTaskIds.length}`,
        ],
        detailed: [
          `source_preview_path=${previewPath}`,
          `receipt_path=${receiptPath}`,
          `sprint_plan_path=${activeStream.sprintPlanPath}`,
          `tasks_dir=${activeStream.tasksDirPath}`,
        ],
      },
    });

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.PLAN_COMMIT,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts: [
          {
            id: CliPlanArtifactId.COMMIT_RECEIPT,
            path: receiptPath,
          },
        ],
        experience,
        details: {
          action: CliPlanAction.COMMIT,
          commit_status: CliPlanCommitStatus.COMMITTED,
          source_preview_path: previewPath,
          receipt_path: receiptPath,
          created_task_count: createdTaskIds.length,
          retained_task_count: retainedTaskIds.length,
          sprint_plan_path: activeStream.sprintPlanPath,
          tasks_dir: activeStream.tasksDirPath,
        },
      },
    };
  }

  private resolveAction(context: CliCommandExecutorContext): CliPlanAction {
    const rawAction = context.options.planCommandOptions?.action?.trim() ?? CliPlanAction.PREVIEW;
    if (CLI_PLAN_ACTION_VALUES.has(rawAction)) {
      return rawAction as CliPlanAction;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translate(context, 'cli.commandMessages.plan.invalidAction', {
        action: rawAction,
        supported: CLI_PLAN_ACTION_ORDER.join(', '),
      }),
      {
        action: rawAction,
      },
    );
  }

  private resolveConfirmationDecision(
    context: CliCommandExecutorContext,
  ): CliPlanConfirmationDecision {
    const decision = context.options.planCommandOptions?.confirmationDecision?.trim() ?? null;
    if (!decision) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.commandMessages.plan.commitRequiresConfirmationDecision'),
      );
    }

    if (CLI_PLAN_CONFIRMATION_DECISION_VALUES.has(decision)) {
      return decision as CliPlanConfirmationDecision;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translate(context, 'cli.commandMessages.plan.invalidConfirmationDecision', {
        decision,
      }),
      {
        decision,
      },
    );
  }

  private async resolvePrimaryStream(
    context: CliCommandExecutorContext,
  ): Promise<CliPlanPrimaryStream | null> {
    const currentContextPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'current-context.md',
    );
    if (!existsSync(currentContextPath)) {
      return null;
    }

    const currentContextContent = await readFile(currentContextPath, 'utf8');
    const activeStreamsSection = this.extractSection(currentContextContent, 'Active Streams');
    const primaryDescriptor = activeStreamsSection.match(/^- `primary`: (.+)$/mu)?.[1] ?? null;
    const primaryProjectId =
      currentContextContent.match(/^- Project:\s*`([^`]+)`/mu)?.[1]?.trim() ?? null;
    const primarySprintId =
      currentContextContent.match(/^- Sprint:\s*`([^`]+)`/mu)?.[1]?.trim() ?? null;

    if (!primaryDescriptor) {
      return {
        currentContextPath,
        projectId: primaryProjectId,
        sprintId: primarySprintId,
        projectPlanPath: null,
        tasksDirPath: null,
        checklistPath: null,
        csvPath: null,
        reviewPath: null,
        sprintPlanPath: null,
      };
    }

    const repositoryRoot = context.options.workspace.repositoryRoot;
    const tasksDirPath = this.resolveRepoRelativePath(
      repositoryRoot,
      this.extractBacktickField(primaryDescriptor, 'tasks'),
    );

    return {
      currentContextPath,
      projectId: this.extractBacktickField(primaryDescriptor, 'project') ?? primaryProjectId,
      sprintId: this.extractBacktickField(primaryDescriptor, 'sprint') ?? primarySprintId,
      projectPlanPath: this.resolveRepoRelativePath(
        repositoryRoot,
        this.extractBacktickField(primaryDescriptor, 'plan'),
      ),
      tasksDirPath,
      checklistPath: this.resolveRepoRelativePath(
        repositoryRoot,
        this.extractBacktickField(primaryDescriptor, 'checklist'),
      ),
      csvPath: this.resolveRepoRelativePath(
        repositoryRoot,
        this.extractBacktickField(primaryDescriptor, 'csv'),
      ),
      reviewPath: this.resolveRepoRelativePath(
        repositoryRoot,
        this.extractBacktickField(primaryDescriptor, 'review'),
      ),
      sprintPlanPath: tasksDirPath ? resolve(tasksDirPath, '..', 'plan.md') : null,
    };
  }

  private createPreviewState(options: {
    planId: string;
    stream: CliPlanPrimaryStream | null;
    sprintGoal: string;
    taskPackageSeeds: string[];
    exitCriteria: string[];
    existingTaskCards: CliExistingTaskCard[];
  }): CliPlanPreviewState {
    const taskPackage = this.resolveTaskPackage(
      options.taskPackageSeeds,
      options.existingTaskCards,
      options.sprintGoal,
    );
    const createCount = taskPackage.filter(
      (task) => task.projectionAction === CliPlanTaskProjectionAction.CREATE,
    ).length;
    const retainCount = taskPackage.length - createCount;
    const missingFields = this.resolveMissingFields(options.stream, options.taskPackageSeeds);
    const commitReadiness = this.resolveCommitReadiness(options.stream, missingFields);
    const risks = this.resolveRisks(
      commitReadiness,
      missingFields,
      createCount,
      taskPackage.length,
    );
    const assumptions = this.resolveAssumptions();

    return {
      planId: options.planId,
      planSummary: this.buildPlanSummary(
        options.stream,
        taskPackage.length,
        createCount,
        retainCount,
      ),
      sprintGoal: options.sprintGoal,
      taskPackage,
      exitCriteria:
        options.exitCriteria.length > 0
          ? options.exitCriteria
          : ['任务包已完成落账，且台账同步门禁保持通过。'],
      risks,
      assumptions,
      ledgerProjectionPreview: {
        planMd: CliPlanLedgerProjectionMode.UPDATE,
        checklistMd: CliPlanLedgerProjectionMode.APPEND,
        tasksCsv: CliPlanLedgerProjectionMode.APPEND,
        tkFiles: CliPlanLedgerProjectionMode.CREATE,
      },
      commitReadiness,
      missingFields,
      createCount,
      retainCount,
    };
  }

  private createPreviewArtifactPayload(
    context: CliCommandExecutorContext,
    stream: CliPlanPrimaryStream | null,
    previewState: CliPlanPreviewState,
    previewPath: string,
    generatedAt: string,
    taskPackageSeedCount: number,
    existingTaskCount: number,
  ): CliPlanPreviewArtifactPayload {
    return {
      planId: previewState.planId,
      generatedAt,
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      targetStream: {
        currentContextPath: stream?.currentContextPath ?? null,
        projectId: stream?.projectId ?? null,
        sprintId: stream?.sprintId ?? null,
        projectPlanPath: stream?.projectPlanPath ?? null,
        sprintPlanPath: stream?.sprintPlanPath ?? null,
        tasksDirPath: stream?.tasksDirPath ?? null,
        checklistPath: stream?.checklistPath ?? null,
        csvPath: stream?.csvPath ?? null,
        reviewPath: stream?.reviewPath ?? null,
      },
      sourceFacts: {
        taskPackageSeedCount,
        existingTaskCount,
      },
      preview: previewState,
      guidance: {
        commitCommand: this.buildCommitCommand(previewPath),
      },
    };
  }

  private async loadPreviewArtifact(
    context: CliCommandExecutorContext,
    previewPath: string,
  ): Promise<CliPlanPreviewArtifactPayload> {
    const payload = await context.artifactWriter.safeReadJson(previewPath);
    if (!payload) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translate(context, 'cli.commandMessages.plan.invalidPreviewArtifact', {
          previewPath,
        }),
      );
    }

    const preview = this.readRecordField(context, payload, 'preview', previewPath);
    const targetStream = this.readRecordField(context, payload, 'targetStream', previewPath);
    const taskPackage = this.readArrayField(context, preview, 'taskPackage', previewPath).map(
      (item) => this.normalizePreviewTaskItem(context, item, previewPath),
    );
    const planId = this.readStringField(context, payload, 'planId', previewPath);
    const createCount = taskPackage.filter(
      (task) => task.projectionAction === CliPlanTaskProjectionAction.CREATE,
    ).length;
    const retainCount = taskPackage.length - createCount;
    const guidance =
      payload.guidance && typeof payload.guidance === 'object' && !Array.isArray(payload.guidance)
        ? (payload.guidance as Record<string, unknown>)
        : null;
    const sourceFacts =
      payload.sourceFacts &&
      typeof payload.sourceFacts === 'object' &&
      !Array.isArray(payload.sourceFacts)
        ? (payload.sourceFacts as Record<string, unknown>)
        : null;
    const previewState: CliPlanPreviewState = {
      planId,
      planSummary: this.readStringField(context, preview, 'planSummary', previewPath),
      sprintGoal: this.readStringField(context, preview, 'sprintGoal', previewPath),
      taskPackage,
      exitCriteria: this.readStringArrayField(context, preview, 'exitCriteria', previewPath),
      risks: this.readStringArrayField(context, preview, 'risks', previewPath),
      assumptions: this.readStringArrayField(context, preview, 'assumptions', previewPath),
      ledgerProjectionPreview: {
        planMd: CliPlanLedgerProjectionMode.UPDATE,
        checklistMd: CliPlanLedgerProjectionMode.APPEND,
        tasksCsv: CliPlanLedgerProjectionMode.APPEND,
        tkFiles: CliPlanLedgerProjectionMode.CREATE,
      },
      commitReadiness: this.readStringField(
        context,
        preview,
        'commitReadiness',
        previewPath,
      ) as CliPlanCommitReadiness,
      missingFields: this.readStringArrayField(context, preview, 'missingFields', previewPath),
      createCount,
      retainCount,
    };

    return {
      planId,
      generatedAt: this.readStringField(context, payload, 'generatedAt', previewPath),
      workspace: {
        workspaceId: '',
        workspaceRoot: '',
        workspaceMode: '',
      },
      targetStream: {
        currentContextPath: this.readOptionalStringField(targetStream, 'currentContextPath'),
        projectId: this.readOptionalStringField(targetStream, 'projectId'),
        sprintId: this.readOptionalStringField(targetStream, 'sprintId'),
        projectPlanPath: this.readOptionalStringField(targetStream, 'projectPlanPath'),
        sprintPlanPath: this.readOptionalStringField(targetStream, 'sprintPlanPath'),
        tasksDirPath: this.readOptionalStringField(targetStream, 'tasksDirPath'),
        checklistPath: this.readOptionalStringField(targetStream, 'checklistPath'),
        csvPath: this.readOptionalStringField(targetStream, 'csvPath'),
        reviewPath: this.readOptionalStringField(targetStream, 'reviewPath'),
      },
      sourceFacts: {
        taskPackageSeedCount:
          typeof sourceFacts?.taskPackageSeedCount === 'number'
            ? sourceFacts.taskPackageSeedCount
            : 0,
        existingTaskCount:
          typeof sourceFacts?.existingTaskCount === 'number' ? sourceFacts.existingTaskCount : 0,
      },
      preview: previewState,
      guidance: {
        commitCommand: (guidance && this.readOptionalStringField(guidance, 'commitCommand')) ?? '',
      },
    };
  }

  private normalizePreviewTaskItem(
    context: CliCommandExecutorContext,
    item: unknown,
    previewPath: string,
  ): CliPlanPreviewTaskPackageItem {
    if (!item || typeof item !== 'object') {
      throw this.createInvalidPreviewArtifactError(context, previewPath);
    }

    const record = item as Record<string, unknown>;
    return {
      provisionalTaskId: this.readStringField(context, record, 'provisionalTaskId', previewPath),
      title: this.readStringField(context, record, 'title', previewPath),
      owner: this.readStringField(context, record, 'owner', previewPath),
      priority: this.readStringField(context, record, 'priority', previewPath),
      dueDate: this.readStringField(context, record, 'dueDate', previewPath),
      statusSeed: this.readStringField(
        context,
        record,
        'statusSeed',
        previewPath,
      ) as CliPlanTaskStatusSeed,
      implementationPlan: this.readStringArrayField(
        context,
        record,
        'implementationPlan',
        previewPath,
      ),
      verification: this.readStringArrayField(context, record, 'verification', previewPath),
      dependsOn: this.readStringArrayField(context, record, 'dependsOn', previewPath),
      projectionAction: this.readStringField(
        context,
        record,
        'projectionAction',
        previewPath,
      ) as CliPlanTaskProjectionAction,
    };
  }

  private createCommitReceiptPayload(options: {
    planCommitId: string;
    sourcePreviewPath: string;
    previewPayload: CliPlanPreviewArtifactPayload;
    committedAt: string;
    status: CliPlanCommitStatus;
    createdTaskIds: string[];
    retainedTaskIds: string[];
  }): CliPlanCommitReceiptArtifactPayload {
    return {
      planCommitId: options.planCommitId,
      sourcePlanId: options.previewPayload.planId,
      sourcePreviewPath: options.sourcePreviewPath,
      status: options.status,
      committedAt: options.committedAt,
      targetStream: {
        projectId: options.previewPayload.targetStream.projectId,
        sprintId: options.previewPayload.targetStream.sprintId,
        sprintPlanPath: options.previewPayload.targetStream.sprintPlanPath,
        tasksDirPath: options.previewPayload.targetStream.tasksDirPath,
        checklistPath: options.previewPayload.targetStream.checklistPath,
        csvPath: options.previewPayload.targetStream.csvPath,
      },
      createdTaskIds: options.createdTaskIds,
      retainedTaskIds: options.retainedTaskIds,
    };
  }

  private buildPreviewChecks(previewState: CliPlanPreviewState): CliCommandResultCheck[] {
    return [
      {
        id: CliCommandResultCheckId.PLAN_TASK_PACKAGE,
        status:
          previewState.taskPackage.length > 0
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: [
          `${CliPlanTaskPackageDetailField.TOTAL}=${previewState.taskPackage.length}`,
          `${CliPlanTaskPackageDetailField.CREATE}=${previewState.createCount}`,
          `${CliPlanTaskPackageDetailField.RETAIN}=${previewState.retainCount}`,
        ].join(' '),
      },
      {
        id: CliCommandResultCheckId.PLAN_COMMIT_READINESS,
        status:
          previewState.commitReadiness === CliPlanCommitReadiness.READY
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: [
          `${CliPlanCommitReadinessDetailField.READINESS}=${previewState.commitReadiness}`,
          `${CliPlanCommitReadinessDetailField.MISSING}=${previewState.missingFields.length}`,
        ].join(' '),
      },
      {
        id: CliCommandResultCheckId.PLAN_LEDGER_PROJECTION,
        status: CliGovernanceCheckStatus.PASS,
        detail: [
          `${CliPlanLedgerProjectionDetailField.PLAN_MD}=${CliPlanLedgerProjectionMode.UPDATE}`,
          `${CliPlanLedgerProjectionDetailField.CHECKLIST_MD}=${CliPlanLedgerProjectionMode.APPEND}`,
          `${CliPlanLedgerProjectionDetailField.TASKS_CSV}=${CliPlanLedgerProjectionMode.APPEND}`,
          `${CliPlanLedgerProjectionDetailField.TK_FILES}=${CliPlanLedgerProjectionMode.CREATE}`,
        ].join(' '),
      },
    ];
  }

  private buildCommitChecks(
    previewState: CliPlanPreviewState,
    receiptPath: string,
    status: CliPlanCommitStatus,
    createdCount: number,
    retainedCount: number,
  ): CliCommandResultCheck[] {
    return [
      ...this.buildPreviewChecks(previewState),
      {
        id: CliCommandResultCheckId.PLAN_COMMIT_RECEIPT,
        status: CliGovernanceCheckStatus.PASS,
        detail: [
          `${CliPlanReceiptDetailField.STATUS}=${status}`,
          `${CliPlanReceiptDetailField.CREATED}=${createdCount}`,
          `${CliPlanReceiptDetailField.RETAINED}=${retainedCount}`,
          `${CliPlanReceiptDetailField.PATH}=${receiptPath}`,
        ].join(' '),
      },
    ];
  }

  private resolveTaskPackage(
    taskPackageSeeds: string[],
    existingTaskCards: CliExistingTaskCard[],
    sprintGoal: string,
  ): CliPlanPreviewTaskPackageItem[] {
    const existingTaskIds = new Set(existingTaskCards.map((task) => task.taskId));
    const existingTitleMap = new Map(
      existingTaskCards.map((task) => [task.normalizedTitle, task.taskId] as const),
    );
    const usedTaskIds = new Set(existingTaskCards.map((task) => task.taskId));
    let nextTaskNumber = this.resolveMaxTaskNumber(existingTaskCards);
    const dueDate = this.resolveDateStamp(new Date());

    return taskPackageSeeds.map((seed) => {
      const parsedSeed = this.parseTaskSeed(seed);
      const normalizedTitle = this.normalizeTitle(parsedSeed.title);
      const retainedTaskId =
        (parsedSeed.explicitTaskId && existingTaskIds.has(parsedSeed.explicitTaskId)
          ? parsedSeed.explicitTaskId
          : null) ??
        existingTitleMap.get(normalizedTitle) ??
        null;
      if (retainedTaskId) {
        return this.createTaskPreviewItem({
          taskId: retainedTaskId,
          title: parsedSeed.title,
          sprintGoal,
          dueDate,
          projectionAction: CliPlanTaskProjectionAction.RETAIN_EXISTING,
        });
      }

      let taskId = parsedSeed.explicitTaskId;
      if (!taskId || usedTaskIds.has(taskId)) {
        nextTaskNumber += 1;
        while (usedTaskIds.has(this.formatTaskId(nextTaskNumber))) {
          nextTaskNumber += 1;
        }
        taskId = this.formatTaskId(nextTaskNumber);
      } else {
        nextTaskNumber = Math.max(nextTaskNumber, this.parseTaskNumber(taskId));
      }

      usedTaskIds.add(taskId);
      return this.createTaskPreviewItem({
        taskId,
        title: parsedSeed.title,
        sprintGoal,
        dueDate,
        projectionAction: CliPlanTaskProjectionAction.CREATE,
      });
    });
  }

  private createTaskPreviewItem(options: {
    taskId: string;
    title: string;
    sprintGoal: string;
    dueDate: string;
    projectionAction: CliPlanTaskProjectionAction;
  }): CliPlanPreviewTaskPackageItem {
    return {
      provisionalTaskId: options.taskId,
      title: options.title,
      owner: DEFAULT_TASK_OWNER,
      priority: DEFAULT_TASK_PRIORITY,
      dueDate: options.dueDate,
      statusSeed: CliPlanTaskStatusSeed.PLANNED,
      implementationPlan: [
        `将 ${options.title} 与 sprint goal 对齐：${options.sprintGoal}`,
        `完成 ${options.title} 的实现或方案落地，并记录关键执行证据。`,
        '在 canonical TK 就绪后再同步派生 checklist 与 tasks.csv。',
      ],
      verification: [
        `补齐 ${options.title} 的定向验证证据。`,
        '通过单写源链路同步 checklist 与 tasks.csv。',
      ],
      dependsOn: [],
      projectionAction: options.projectionAction,
    };
  }

  private buildTaskCardContent(
    task: CliPlanPreviewTaskPackageItem,
    stream: CliPlanPrimaryStream,
    sprintGoal: string,
    dateStamp: string,
  ): string {
    const taskCardLines = [
      `# ${task.provisionalTaskId} ${task.title}`,
      '',
      `- Status: ${CliPlanTaskStatusSeed.PLANNED}`,
      `- Date: ${dateStamp}`,
      `- Owner: ${task.owner}`,
      `- Priority: ${task.priority}`,
      `- Project: \`${stream.projectId ?? 'unknown-project'}\``,
      `- Sprint: \`${stream.sprintId ?? 'unknown-sprint'}\``,
      '',
      '## 1. 任务目标',
      '',
      `围绕 sprint goal“${sprintGoal}”完成 ${task.title}，并把执行证据沉淀回规范台账。`,
      '',
      '## 2. Depends On',
      '',
      '1. 当前 sprint plan 与 active stream 上下文',
      '',
      '## 3. 预期产物',
      '',
      `1. ${task.title} 的实现或结构化产出`,
      '2. 对应验证证据与执行记录',
      '',
      '## 4. Required Inputs',
      '',
      ...(stream.sprintPlanPath ? [`1. \`${stream.sprintPlanPath}\``] : ['1. 当前 sprint plan']),
      ...(stream.projectPlanPath ? [`2. \`${stream.projectPlanPath}\``] : []),
      `3. \`${stream.currentContextPath}\``,
      '',
      '## 5. Traceback References',
      '',
      '1. `context/plan/*.preview.json` 规划预览产物',
      '',
      '## 6. 实施计划',
      '',
      ...task.implementationPlan.map((line, index) => `${index + 1}. ${line}`),
      '',
      '## 7. Development Verification',
      '',
      ...task.verification.map((line, index) => `${index + 1}. ${line}`),
      '',
      '## 8. Delivery Verification',
      '',
      '1. 执行 `pnpm run build`（若当前变更窗口涉及代码改动）',
      '2. 运行与任务相关的定向验证并记录结果',
      '',
      '## 9. 执行记录',
      '',
      `1. ${dateStamp}：任务创建，状态初始化为 \`${CliPlanTaskStatusSeed.PLANNED}\`。`,
      '',
      '## 10. 产出',
      '',
      `1. 待执行：${task.title}`,
      '',
    ];

    return taskCardLines.join('\n');
  }

  private buildSprintPlanSkeleton(stream: CliPlanPrimaryStream, sprintGoal: string): string {
    return [
      `# ${stream.sprintId ?? 'sprint-plan'} 计划`,
      '',
      '- Status: active',
      `- Date: ${this.resolveDateStamp(new Date())}`,
      ...(stream.projectId ? [`- Project: \`${stream.projectId}\``] : []),
      `- Sprint Goal: ${sprintGoal}`,
      '',
    ].join('\n');
  }

  private updateSprintPlan(
    currentContent: string,
    previewState: CliPlanPreviewState,
    finalTaskPackage: CliPlanPreviewTaskPackageItem[],
    dateStamp: string,
  ): string {
    let nextContent = this.upsertMetadataLine(
      currentContent,
      'Sprint Goal',
      previewState.sprintGoal,
    );
    nextContent = this.upsertSection(
      nextContent,
      'Task Package',
      '## 1. Task Package',
      finalTaskPackage.map(
        (task, index) => `${index + 1}. \`${task.provisionalTaskId}\` ${task.title}`,
      ),
    );
    nextContent = this.upsertSection(
      nextContent,
      'Exit Criteria',
      '## 2. Exit Criteria',
      previewState.exitCriteria.map((item, index) => `${index + 1}. ${item}`),
    );
    nextContent = this.appendExecutionNote(
      nextContent,
      `${dateStamp}：通过 \`${previewState.planId}\` 生成的 preview 完成 task package 投影与 ledger commit。`,
    );
    return nextContent.endsWith('\n') ? nextContent : `${nextContent}\n`;
  }

  private async runTaskLedgerSync(context: CliCommandExecutorContext): Promise<void> {
    const syncScriptPath = resolveTaskLedgerSyncScriptPath();
    if (!syncScriptPath) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        this.translate(context, 'cli.commandMessages.plan.syncTaskLedgerUnavailable'),
      );
    }

    await context.runNodeScript(syncScriptPath, [
      '--workspace-root',
      context.options.workspace.workspaceRoot,
    ]);
  }

  private async readExistingTaskCards(tasksDirPath: string | null): Promise<CliExistingTaskCard[]> {
    if (!tasksDirPath || !existsSync(tasksDirPath)) {
      return [];
    }

    const fileNames = readdirSync(tasksDirPath)
      .filter((fileName) => TASK_CARD_FILE_PATTERN.test(fileName))
      .sort();
    const taskCards = await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = resolve(tasksDirPath, fileName);
        const content = await readFile(filePath, 'utf8');
        const taskId =
          fileName.match(TASK_CARD_FILE_PATTERN)?.[0]?.slice(0, 6) ?? fileName.slice(0, 6);
        const title = content.match(/^#\s*TK-\d{3}\s+(.+?)\s*$/mu)?.[1]?.trim() ?? fileName;
        return {
          taskId,
          title,
          normalizedTitle: this.normalizeTitle(title),
        };
      }),
    );

    return taskCards;
  }

  private resolveMissingFields(
    stream: CliPlanPrimaryStream | null,
    taskPackageSeeds: string[],
  ): string[] {
    const missingFields: string[] = [];
    if (!stream) {
      missingFields.push('active_primary_stream');
      return missingFields;
    }

    if (!stream.projectId) {
      missingFields.push('project_id');
    }
    if (!stream.sprintId) {
      missingFields.push('sprint_id');
    }
    if (!stream.tasksDirPath) {
      missingFields.push('tasks_dir');
    }
    if (!stream.sprintPlanPath || !existsSync(stream.sprintPlanPath)) {
      missingFields.push('sprint_plan');
    }
    if (taskPackageSeeds.length === 0) {
      missingFields.push('task_package');
    }

    return missingFields;
  }

  private resolveCommitReadiness(
    stream: CliPlanPrimaryStream | null,
    missingFields: string[],
  ): CliPlanCommitReadiness {
    if (!stream || missingFields.includes('active_primary_stream')) {
      return CliPlanCommitReadiness.PREVIEW_ONLY;
    }

    return missingFields.length === 0
      ? CliPlanCommitReadiness.READY
      : CliPlanCommitReadiness.NEEDS_USER_INPUT;
  }

  private resolveRisks(
    readiness: CliPlanCommitReadiness,
    missingFields: string[],
    createCount: number,
    totalCount: number,
  ): string[] {
    const risks = [];

    if (readiness === CliPlanCommitReadiness.PREVIEW_ONLY) {
      risks.push('缺少 active primary stream，因此当前 preview 不能直接提交到正式台账。');
    }
    if (missingFields.includes('sprint_plan')) {
      risks.push('目标 sprint plan 缺失，commit 无法同步 sprint scope。');
    }
    if (missingFields.includes('task_package')) {
      risks.push('Task Package 为空，无法生成新的 canonical TK。');
    }
    if (totalCount > 0 && createCount === 0) {
      risks.push('当前 task package 已全部映射到现有 TK；本次 commit 主要会做 plan reconcile。');
    }

    return risks.length > 0 ? risks : ['本次 preview 未发现新的阻断风险。'];
  }

  private resolveAssumptions(): string[] {
    return [
      `新任务默认 owner=${DEFAULT_TASK_OWNER}。`,
      `新任务默认 priority=${DEFAULT_TASK_PRIORITY}。`,
      '新任务默认状态为 `planned`，派生 checklist/tasks.csv 继续通过单写源同步器生成。',
    ];
  }

  private buildPlanSummary(
    stream: CliPlanPrimaryStream | null,
    totalCount: number,
    createCount: number,
    retainCount: number,
  ): string {
    const streamLabel =
      stream?.projectId && stream?.sprintId
        ? `${stream.projectId} / ${stream.sprintId}`
        : 'active workspace';
    return `为 ${streamLabel} 生成 ${totalCount} 条 task breakdown（create=${createCount}, retain=${retainCount}）。`;
  }

  private buildCommitCommand(previewPath: string): string {
    return `${CLI_PROGRAM_NAME} plan commit ${previewPath} --confirm-plan approve --output pretty`;
  }

  private streamMatchesPreview(
    stream: CliPlanPrimaryStream | null,
    targetStream: CliPlanPreviewArtifactPayload['targetStream'],
  ): boolean {
    if (!stream) {
      return false;
    }

    return (
      stream.projectId === targetStream.projectId &&
      stream.sprintId === targetStream.sprintId &&
      stream.tasksDirPath === targetStream.tasksDirPath &&
      stream.sprintPlanPath === targetStream.sprintPlanPath
    );
  }

  private readStringField(
    context: CliCommandExecutorContext,
    record: Record<string, unknown>,
    key: string,
    previewPath: string,
  ): string {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }

    throw this.createInvalidPreviewArtifactError(context, previewPath);
  }

  private readOptionalStringField(record: Record<string, unknown>, key: string): string | null {
    const value = record[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private readRecordField(
    context: CliCommandExecutorContext,
    record: Record<string, unknown>,
    key: string,
    previewPath: string,
  ): Record<string, unknown> {
    const value = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    throw this.createInvalidPreviewArtifactError(context, previewPath);
  }

  private readArrayField(
    context: CliCommandExecutorContext,
    record: Record<string, unknown>,
    key: string,
    previewPath: string,
  ): unknown[] {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }

    throw this.createInvalidPreviewArtifactError(context, previewPath);
  }

  private readStringArrayField(
    context: CliCommandExecutorContext,
    record: Record<string, unknown>,
    key: string,
    previewPath: string,
  ): string[] {
    const value = this.readArrayField(context, record, key, previewPath);
    if (value.every((item) => typeof item === 'string')) {
      return value as string[];
    }

    throw this.createInvalidPreviewArtifactError(context, previewPath);
  }

  private createInvalidPreviewArtifactError(
    context: CliCommandExecutorContext,
    previewPath: string,
  ): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translate(context, 'cli.commandMessages.plan.invalidPreviewArtifact', {
        previewPath,
      }),
      {
        previewPath,
      },
    );
  }

  private async readTextIfExists(filePath: string | null): Promise<string | null> {
    if (!filePath || !existsSync(filePath)) {
      return null;
    }

    return await readFile(filePath, 'utf8');
  }

  private parseListSection(content: string | null, headingText: string): string[] {
    if (!content) {
      return [];
    }

    return this.extractSection(content, headingText)
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => /^(\d+\.\s+|[-*]\s+)/u.test(line))
      .map((line) => line.replace(/^(\d+\.\s+|[-*]\s+)/u, '').trim())
      .filter((line) => line.length > 0);
  }

  private parseMetadataValue(content: string | null, key: string): string | null {
    if (!content) {
      return null;
    }

    return content.match(new RegExp(`^- ${key}:\\s*(.+)$`, 'mu'))?.[1]?.trim() ?? null;
  }

  private parseTaskSeed(seed: string): { explicitTaskId: string | null; title: string } {
    const trimmedSeed = seed.trim().replace(/^`(.+)`$/u, '$1');
    const explicitMatch = trimmedSeed.match(TASK_ID_PREFIX_PATTERN);
    if (explicitMatch) {
      return {
        explicitTaskId: explicitMatch[1],
        title: explicitMatch[2].trim(),
      };
    }

    return {
      explicitTaskId: null,
      title: trimmedSeed.replace(/^`(TK-\d{3})`\s+/u, '').trim(),
    };
  }

  private resolveMaxTaskNumber(existingTaskCards: CliExistingTaskCard[]): number {
    return existingTaskCards.reduce((maxValue, taskCard) => {
      return Math.max(maxValue, this.parseTaskNumber(taskCard.taskId));
    }, 0);
  }

  private parseTaskNumber(taskId: string): number {
    return Number(taskId.replace(/^TK-/u, '')) || 0;
  }

  private formatTaskId(taskNumber: number): string {
    return `TK-${String(taskNumber).padStart(3, '0')}`;
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[`'"“”‘’]/gu, '')
      .replace(/[^a-z0-9\u4e00-\u9fff]+/gu, ' ')
      .trim();
  }

  private slugifyTitle(title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-+|-+$/gu, '')
      .slice(0, 80);
    return slug.length > 0 ? slug : 'task';
  }

  private resolveDateStamp(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private extractSection(content: string, headingText: string): string {
    const normalizedHeadingText = this.normalizeHeadingText(headingText);
    const headingPattern = /^##\s+([^\n]+)$/gmu;
    const headingMatches = Array.from(content.matchAll(headingPattern));

    for (let index = 0; index < headingMatches.length; index += 1) {
      const currentHeadingMatch = headingMatches[index];
      const rawHeadingText = currentHeadingMatch[1]?.trim() ?? '';
      const currentHeadingIndex = currentHeadingMatch.index;
      if (typeof currentHeadingIndex !== 'number') {
        continue;
      }

      if (this.normalizeHeadingText(rawHeadingText) !== normalizedHeadingText) {
        continue;
      }

      const sectionStart = currentHeadingIndex + currentHeadingMatch[0].length;
      const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
      return content.slice(sectionStart, sectionEnd).trim();
    }

    return '';
  }

  private upsertSection(
    content: string,
    semanticHeading: string,
    headingLine: string,
    bodyLines: string[],
  ): string {
    const body = bodyLines.join('\n');
    const headingPattern = /^##\s+([^\n]+)$/gmu;
    const headingMatches = Array.from(content.matchAll(headingPattern));
    const normalizedHeading = this.normalizeHeadingText(semanticHeading);

    for (let index = 0; index < headingMatches.length; index += 1) {
      const currentHeadingMatch = headingMatches[index];
      const rawHeadingText = currentHeadingMatch[1]?.trim() ?? '';
      const currentHeadingIndex = currentHeadingMatch.index;
      if (typeof currentHeadingIndex !== 'number') {
        continue;
      }

      if (this.normalizeHeadingText(rawHeadingText) !== normalizedHeading) {
        continue;
      }

      const sectionStart = currentHeadingIndex;
      const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
      return [
        content.slice(0, sectionStart).trimEnd(),
        '',
        headingLine,
        '',
        body,
        '',
        content.slice(sectionEnd).trimStart(),
      ]
        .filter((part) => part.length > 0)
        .join('\n');
    }

    return [content.trimEnd(), '', headingLine, '', body, ''].join('\n');
  }

  private appendExecutionNote(content: string, note: string): string {
    const executionNotesSection = this.extractSection(content, 'Execution Notes');
    if (!executionNotesSection) {
      return [content.trimEnd(), '', '## 4. Execution Notes', '', `1. ${note}`, ''].join('\n');
    }

    const noteCount = executionNotesSection
      .split(/\r?\n/u)
      .filter((line) => /^\d+\.\s+/u.test(line.trim())).length;
    const nextBody = executionNotesSection
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);
    nextBody.push(`${noteCount + 1}. ${note}`);

    return this.upsertSection(content, 'Execution Notes', '## 4. Execution Notes', nextBody);
  }

  private upsertMetadataLine(content: string, key: string, value: string): string {
    const metadataPattern = new RegExp(`^- ${key}:\\s*.*$`, 'mu');
    if (metadataPattern.test(content)) {
      return content.replace(metadataPattern, `- ${key}: ${value}`);
    }

    const firstHeadingIndex = content.search(/^##\s+/mu);
    if (firstHeadingIndex === -1) {
      return `${content.trimEnd()}\n- ${key}: ${value}\n`;
    }

    return `${content.slice(0, firstHeadingIndex).trimEnd()}\n- ${key}: ${value}\n\n${content
      .slice(firstHeadingIndex)
      .trimStart()}`;
  }

  private normalizeHeadingText(headingText: string): string {
    return headingText
      .replace(/^\d+(?:\.\d+)*\.?\s*/u, '')
      .trim()
      .toLowerCase();
  }

  private extractBacktickField(descriptor: string, fieldName: string): string | null {
    const fieldPrefix = `${fieldName}=\``;
    const fieldStart = descriptor.indexOf(fieldPrefix);
    if (fieldStart < 0) {
      return null;
    }

    const valueStart = fieldStart + fieldPrefix.length;
    const valueEnd = descriptor.indexOf('`', valueStart);
    if (valueEnd < 0) {
      return null;
    }

    return descriptor.slice(valueStart, valueEnd);
  }

  private resolveRepoRelativePath(
    repositoryRoot: string,
    candidatePath: string | null,
  ): string | null {
    if (!candidatePath) {
      return null;
    }

    return resolve(repositoryRoot, candidatePath);
  }

  private translate(
    context: CliCommandExecutorContext,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate(key, interpolation);
  }
}
