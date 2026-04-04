import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stringify } from 'yaml';

import {
  ConfigLoader,
  type GovernorConfig,
  GovernorSchemaVersion,
  UpgradeConfirmationDecision,
  type UpgradeSchemaDiffResult,
  UpgradeSchemaDiffService,
} from '@repo-ai-governor/config';
import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CliCommandResultCheckId,
  CliConfirmationItemsDetailField,
  CliMigrationSuggestionDetailField,
  CliUpgradeApplyReadinessDetailField,
  CliUpgradeReceiptDetailField,
  CliUpgradeSchemaDiffDetailField,
} from '../constants/cli-command-result-check.constant.js';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../constants/cli-interactive-shell.constant.js';
import { DEFAULT_CLI_REACT_THEME_PRESET } from '../constants/cli-react-theme.constant.js';
import {
  CLI_UPGRADE_ACTION_ORDER,
  CLI_UPGRADE_ACTION_VALUES,
  CLI_UPGRADE_CONFIRMATION_DECISION_VALUES,
  CliUpgradeAction,
  CliUpgradeApplyReadiness,
  CliUpgradeApplyStatus,
  CliUpgradeArtifactId,
  CliUpgradeConfirmationDecision,
  CliUpgradeRollbackSourceType,
  CliUpgradeRollbackStatus,
  CliUpgradeVerifyStatus,
} from '../constants/cli-upgrade.constant.js';
import {
  ReactCliCommandDescriptorCatalog,
  ReactCliCommandViewModelBuilder,
  type ReactCliViewModel,
} from '../react-cli/index.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliInteractionPrompt,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

interface CliUpgradeCommandDependencies {
  descriptorCatalog?: ReactCliCommandDescriptorCatalog;
  viewModelBuilder?: ReactCliCommandViewModelBuilder;
}

interface CliUpgradePreviewArtifactPayload {
  upgradeId: string;
  generatedAt: string;
  workspace: {
    workspaceId: string;
    workspaceRoot: string;
    workspaceMode: string;
  };
  sourceConfigPath: string;
  autoMigratedConfigPath: string;
  rollbackReference: {
    rollbackSnapshotPath: string;
    restoreCommand: string;
    reason: string;
  };
  analysis: UpgradeSchemaDiffResult;
  preview: {
    applyReadiness: CliUpgradeApplyReadiness;
    confirmationRequirement: UpgradeConfirmationDecision;
    suggestionCount: number;
    confirmationCount: number;
    blockingConfirmationCount: number;
  };
}

interface CliUpgradeAutoMigratedConfigArtifactPayload {
  upgradeId: string;
  generatedAt: string;
  sourceConfigPath: string;
  sourceVersion: string;
  targetVersion: GovernorSchemaVersion;
  autoMigratedConfig: GovernorConfig;
}

interface CliUpgradeVerifyArtifactPayload {
  verifyId: string;
  applyId?: string;
  rollbackId?: string;
  sourceUpgradeId?: string | null;
  sourceApplyId?: string | null;
  status: CliUpgradeVerifyStatus;
  verifiedAt: string;
  configPath: string;
  schemaVersion: string;
  targetVersion?: string;
  error?: string | null;
}

interface CliUpgradeApplyReceiptArtifactPayload {
  applyId: string;
  sourceUpgradeId: string;
  sourceConfigPath: string;
  reportPath: string;
  autoMigratedConfigPath: string;
  rollbackSnapshotPath: string;
  confirmationDecision: CliUpgradeConfirmationDecision | null;
  status: CliUpgradeApplyStatus;
  appliedAt: string;
  sourceVersion: string;
  targetVersion: string;
  verifyReceiptPath?: string | null;
  rollbackReceiptPath?: string | null;
}

interface CliUpgradeRollbackReceiptArtifactPayload {
  rollbackId: string;
  sourceArtifactPath: string;
  sourceType: CliUpgradeRollbackSourceType;
  sourceApplyId?: string | null;
  sourceUpgradeId?: string | null;
  sourceConfigPath: string;
  restoredConfigPath: string;
  rollbackSnapshotPath: string;
  status: CliUpgradeRollbackStatus;
  rolledBackAt: string;
  verifyReceiptPath?: string | null;
}

interface CliUpgradeSummaryViewModelOptions {
  checks: CliCommandResultCheck[];
  message: string;
  statusMessage: string;
  fieldValues: Record<string, string>;
  summaryLines: string[];
  interactionPrompts: CliInteractionPrompt[];
}

/**
 * Owns `upgrade` command execution outside the runtime facade.
 */
export class CliUpgradeCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.UPGRADE;

  private readonly descriptorCatalog: ReactCliCommandDescriptorCatalog;
  private readonly viewModelBuilder: ReactCliCommandViewModelBuilder;

  public constructor(dependencies: CliUpgradeCommandDependencies = {}) {
    this.descriptorCatalog =
      dependencies.descriptorCatalog ?? new ReactCliCommandDescriptorCatalog();
    this.viewModelBuilder = dependencies.viewModelBuilder ?? new ReactCliCommandViewModelBuilder();
  }

  public async execute(context: CliCommandExecutorContext) {
    const action = this.resolveAction(context);
    switch (action) {
      case CliUpgradeAction.APPLY:
        return await this.executeApply(context);
      case CliUpgradeAction.ROLLBACK:
        return await this.executeRollback(context);
      default:
        return await this.executePreview(context);
    }
  }

  private async executePreview(context: CliCommandExecutorContext) {
    this.assertConfigFileExists(context);

    const configLoader = new ConfigLoader();
    const upgradeSchemaDiffService = new UpgradeSchemaDiffService();
    const sourceConfig = configLoader.loadFromFile(context.options.workspace.configPath);
    const targetVersion = this.resolveTargetVersion(context);
    const upgradeDiffResult = upgradeSchemaDiffService.analyze({
      sourceConfig,
      targetVersion,
    });
    const suggestionCount = upgradeDiffResult.suggestions.length;
    const confirmationCount = upgradeDiffResult.confirmationItems.length;
    const blockingConfirmationCount = upgradeDiffResult.confirmationItems.filter(
      (item) => item.blocking,
    ).length;
    const upgradeId = `upgrade-${Date.now()}`;
    const reportPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${upgradeId}.report.json`,
    );
    const autoMigratedConfigPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${upgradeId}.auto-migrated-config.json`,
    );
    const rollbackSnapshotPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${upgradeId}.rollback-snapshot.yaml`,
    );
    const rawConfigContent = await readFile(context.options.workspace.configPath, 'utf8');
    const applyReadiness = this.resolveApplyReadiness(upgradeDiffResult, true);
    await context.artifactWriter.writeTextArtifact(rollbackSnapshotPath, rawConfigContent);
    await context.artifactWriter.writeJsonArtifact(autoMigratedConfigPath, {
      upgradeId,
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      sourceConfigPath: context.options.workspace.configPath,
      sourceVersion: upgradeDiffResult.sourceVersion,
      targetVersion: upgradeDiffResult.targetVersion,
      autoMigratedConfig: upgradeDiffResult.autoMigratedConfig,
    } satisfies CliUpgradeAutoMigratedConfigArtifactPayload);
    await context.artifactWriter.writeJsonArtifact(reportPath, {
      upgradeId,
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      sourceConfigPath: context.options.workspace.configPath,
      autoMigratedConfigPath,
      rollbackReference: {
        rollbackSnapshotPath,
        restoreCommand: `cp ${rollbackSnapshotPath} ${context.options.workspace.configPath}`,
        reason: this.translateKey(context, 'cli.commandMessages.upgrade.rollbackReferenceReason'),
      },
      analysis: upgradeDiffResult,
      preview: {
        applyReadiness,
        confirmationRequirement: upgradeDiffResult.confirmationDecision,
        suggestionCount,
        confirmationCount,
        blockingConfirmationCount,
      },
    } satisfies CliUpgradePreviewArtifactPayload);

    const message = this.translateKey(context, 'cli.commandMessages.upgrade.previewCompleted', {
      readiness: applyReadiness,
      reportPath,
    });
    const checks = this.buildPreviewChecks(
      upgradeDiffResult,
      applyReadiness,
      suggestionCount,
      confirmationCount,
      blockingConfirmationCount,
      rollbackSnapshotPath,
    );
    const nextActions = [
      this.translateKey(context, 'cli.commandMessages.upgrade.inspectReport', {
        reportPath,
        autoMigratedConfigPath,
      }),
      ...(confirmationCount > 0
        ? [this.translateKey(context, 'cli.commandMessages.upgrade.confirmItems')]
        : []),
      this.translateKey(context, 'cli.commandMessages.upgrade.applyWithReport', {
        command: this.buildApplyCommand(reportPath, confirmationCount > 0),
      }),
      this.translateKey(context, 'cli.commandMessages.upgrade.keepRollback', {
        rollbackSnapshotPath,
      }),
    ];
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'upgrade-planner',
          stage: ExecutionProgressStage.REPORT,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: this.translateKey(context, 'cli.commandMessages.upgrade.artifactsGenerated'),
          detail: reportPath,
          backlink: {
            artifactPath: reportPath,
          },
        },
        {
          roleId: 'operator',
          stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
          status: this.resolveReadinessProgressStatus(applyReadiness),
          category:
            applyReadiness === CliUpgradeApplyReadiness.NEEDS_CONFIRMATION
              ? ExecutionInteractionCategory.HUMAN_CONFIRMATION
              : ExecutionInteractionCategory.NONE,
          summary: this.translateKey(context, 'cli.commandMessages.upgrade.previewReadiness', {
            readiness: applyReadiness,
          }),
          detail: `confirmation_items=${confirmationCount}`,
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title: this.translateKey(context, 'cli.commandMessages.upgrade.reviewUpgradeArtifacts'),
          action: nextActions[0] ?? reportPath,
          blocking: false,
        },
        ...(confirmationCount > 0
          ? [
              {
                category: ExecutionInteractionCategory.HUMAN_CONFIRMATION,
                stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
                title: this.translateKey(
                  context,
                  'cli.commandMessages.upgrade.confirmUpgradeChanges',
                ),
                action:
                  nextActions[1] ??
                  this.translateKey(context, 'cli.commandMessages.upgrade.confirmItems'),
                blocking: true,
              },
            ]
          : []),
        {
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title: this.translateKey(context, 'cli.commandMessages.upgrade.runControlledApply'),
          action: nextActions[confirmationCount > 0 ? 2 : 1] ?? this.buildApplyCommand(reportPath),
          blocking: false,
        },
        {
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title: this.translateKey(context, 'cli.commandMessages.upgrade.retainRollbackSnapshot'),
          action: nextActions[nextActions.length - 1] ?? rollbackSnapshotPath,
          blocking: false,
        },
      ],
      layeredLogs: {
        summary: [
          `source_version=${upgradeDiffResult.sourceVersion}`,
          `target_version=${upgradeDiffResult.targetVersion}`,
          `confirmation_decision=${upgradeDiffResult.confirmationDecision}`,
          `apply_readiness=${applyReadiness}`,
        ],
        detailed: [
          `diff_count=${upgradeDiffResult.diffs.length}`,
          `suggestion_count=${suggestionCount}`,
          `confirmation_count=${confirmationCount}`,
          `rollback_snapshot=${rollbackSnapshotPath}`,
          `apply_command=${this.buildApplyCommand(reportPath, confirmationCount > 0)}`,
        ],
      },
    });

    return {
      message,
      reactCliViewModel: this.buildReactCliViewModel(context, {
        checks,
        message,
        statusMessage:
          applyReadiness === CliUpgradeApplyReadiness.NEEDS_CONFIRMATION
            ? this.translateKey(context, 'cli.reactShell.upgrade.status.manualConfirmation', {
                count: String(blockingConfirmationCount || confirmationCount),
              })
            : applyReadiness === CliUpgradeApplyReadiness.BLOCKED
              ? this.translateKey(context, 'cli.reactShell.upgrade.status.applyBlocked')
              : this.translateKey(context, 'cli.reactShell.upgrade.status.previewReady', {
                  targetVersion: upgradeDiffResult.targetVersion,
                }),
        fieldValues: {
          workspaceRoot: context.options.workspace.workspaceRoot,
          sourceVersion: upgradeDiffResult.sourceVersion,
          targetVersion: upgradeDiffResult.targetVersion,
          confirmationDecision: upgradeDiffResult.confirmationDecision,
        },
        summaryLines: [
          message,
          this.translateKey(context, 'cli.reactShell.upgrade.summary.reportPath', {
            path: reportPath,
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.autoMigratedConfigPath', {
            path: autoMigratedConfigPath,
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.rollbackSnapshotPath', {
            path: rollbackSnapshotPath,
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.counts', {
            suggestions: String(suggestionCount),
            confirmations: String(confirmationCount),
            blocking: String(blockingConfirmationCount),
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.applyReadiness', {
            readiness: applyReadiness,
          }),
        ],
        interactionPrompts: [
          {
            category: ExecutionInteractionCategory.NONE,
            stage: ExecutionProgressStage.REPORT,
            title: this.translateKey(context, 'cli.commandMessages.upgrade.reviewUpgradeArtifacts'),
            action: nextActions[0] ?? reportPath,
            blocking: false,
          },
          ...(confirmationCount > 0
            ? [
                {
                  category: ExecutionInteractionCategory.HUMAN_CONFIRMATION,
                  stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
                  title: this.translateKey(
                    context,
                    'cli.commandMessages.upgrade.confirmUpgradeChanges',
                  ),
                  action: nextActions[1] ?? '',
                  blocking: true,
                },
              ]
            : []),
          {
            category: ExecutionInteractionCategory.NONE,
            stage: ExecutionProgressStage.REPORT,
            title: this.translateKey(context, 'cli.commandMessages.upgrade.runControlledApply'),
            action:
              nextActions[confirmationCount > 0 ? 2 : 1] ?? this.buildApplyCommand(reportPath),
            blocking: false,
          },
        ],
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SCHEMA_UPGRADE_ANALYZE,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts: [
          {
            id: CliUpgradeArtifactId.REPORT,
            path: reportPath,
          },
          {
            id: CliUpgradeArtifactId.AUTO_MIGRATED_CONFIG,
            path: autoMigratedConfigPath,
          },
          {
            id: CliUpgradeArtifactId.ROLLBACK_SNAPSHOT,
            path: rollbackSnapshotPath,
          },
        ],
        experience,
        details: {
          action: CliUpgradeAction.PREVIEW,
          source_version: upgradeDiffResult.sourceVersion,
          target_version: upgradeDiffResult.targetVersion,
          confirmation_decision: upgradeDiffResult.confirmationDecision,
          apply_readiness: applyReadiness,
          diff_count: upgradeDiffResult.diffs.length,
          suggestion_count: suggestionCount,
          confirmation_count: confirmationCount,
          blocking_confirmation_count: blockingConfirmationCount,
          report_path: reportPath,
          auto_migrated_config_path: autoMigratedConfigPath,
          rollback_snapshot_path: rollbackSnapshotPath,
        } as Record<string, string | number | boolean | null>,
      },
    };
  }

  private async executeApply(context: CliCommandExecutorContext) {
    this.assertConfigFileExists(context);

    const reportPath = this.resolveRequiredArtifactPath(context, CliUpgradeAction.APPLY);
    const reportPayload = await this.readUpgradeReportArtifact(context, reportPath);
    this.assertReportMatchesWorkspace(context, reportPayload);
    const autoMigratedConfigPayload = await this.readAutoMigratedConfigArtifact(
      context,
      reportPayload.autoMigratedConfigPath,
    );
    const rollbackSnapshotPath = reportPayload.rollbackReference.rollbackSnapshotPath;
    this.assertArtifactExists(
      context,
      rollbackSnapshotPath,
      'cli.commandMessages.upgrade.missingRollbackSnapshot',
    );
    const currentConfigContent = await readFile(context.options.workspace.configPath, 'utf8');
    const rollbackSnapshotContent = await readFile(rollbackSnapshotPath, 'utf8');
    if (currentConfigContent !== rollbackSnapshotContent) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translateKey(context, 'cli.commandMessages.upgrade.applySourceDrift', {
          reportPath,
        }),
        {
          command: CliCommandName.UPGRADE,
          action: CliUpgradeAction.APPLY,
          reportPath,
          configPath: context.options.workspace.configPath,
        },
      );
    }

    const applyReadiness =
      reportPayload.preview?.applyReadiness ??
      this.resolveApplyReadiness(reportPayload.analysis, existsSync(rollbackSnapshotPath));
    if (applyReadiness === CliUpgradeApplyReadiness.BLOCKED) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translateKey(context, 'cli.commandMessages.upgrade.applyBlocked'),
        {
          command: CliCommandName.UPGRADE,
          action: CliUpgradeAction.APPLY,
          reportPath,
        },
      );
    }

    const confirmationDecision = this.resolveConfirmationDecision(context);
    if (reportPayload.analysis.confirmationItems.length > 0 && confirmationDecision === null) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translateKey(context, 'cli.commandMessages.upgrade.confirmationRequiredForApply'),
        {
          command: CliCommandName.UPGRADE,
          action: CliUpgradeAction.APPLY,
          option: '--confirm-upgrade',
          reportPath,
        },
      );
    }

    const applyId = `upgrade-apply-${Date.now()}`;
    const applyReceiptPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${applyId}.apply-receipt.json`,
    );
    const verifyReceiptPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${applyId}.verify.json`,
    );

    if (confirmationDecision === CliUpgradeConfirmationDecision.REJECT) {
      const rejectedReceipt: CliUpgradeApplyReceiptArtifactPayload = {
        applyId,
        sourceUpgradeId: reportPayload.upgradeId,
        sourceConfigPath: reportPayload.sourceConfigPath,
        reportPath,
        autoMigratedConfigPath: reportPayload.autoMigratedConfigPath,
        rollbackSnapshotPath,
        confirmationDecision,
        status: CliUpgradeApplyStatus.REJECTED,
        appliedAt: context.toRfc3339SecondsTimestamp(new Date()),
        sourceVersion: reportPayload.analysis.sourceVersion,
        targetVersion: reportPayload.analysis.targetVersion,
        verifyReceiptPath: null,
      };
      await context.artifactWriter.writeJsonArtifact(applyReceiptPath, rejectedReceipt);

      const checks: CliCommandResultCheck[] = [
        this.buildConfirmationItemsCheck(
          reportPayload.analysis,
          reportPayload.preview?.blockingConfirmationCount ??
            reportPayload.analysis.confirmationItems.filter((item) => item.blocking).length,
          CliGovernanceCheckStatus.WARN,
          confirmationDecision,
        ),
        {
          id: CliCommandResultCheckId.UPGRADE_APPLY_RECEIPT,
          status: CliGovernanceCheckStatus.WARN,
          detail: `${CliUpgradeReceiptDetailField.STATUS}=${CliUpgradeApplyStatus.REJECTED} ${CliUpgradeReceiptDetailField.PATH}=${applyReceiptPath}`,
        },
        {
          id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
          status: CliGovernanceCheckStatus.PASS,
          detail: rollbackSnapshotPath,
        },
      ];
      const message = this.translateKey(context, 'cli.commandMessages.upgrade.applyRejected', {
        applyReceiptPath,
      });
      const nextActions = [
        this.translateKey(context, 'cli.commandMessages.upgrade.inspectApplyReceipt', {
          applyReceiptPath,
        }),
        this.translateKey(context, 'cli.commandMessages.upgrade.applyWithReport', {
          command: this.buildApplyCommand(reportPath, true),
        }),
      ];

      return {
        message,
        reactCliViewModel: this.buildReactCliViewModel(context, {
          checks,
          message,
          statusMessage: this.translateKey(context, 'cli.reactShell.upgrade.status.applyRejected'),
          fieldValues: {
            workspaceRoot: context.options.workspace.workspaceRoot,
            sourceVersion: reportPayload.analysis.sourceVersion,
            targetVersion: reportPayload.analysis.targetVersion,
            confirmationDecision,
          },
          summaryLines: [
            message,
            this.translateKey(context, 'cli.reactShell.upgrade.summary.applyReceiptPath', {
              path: applyReceiptPath,
            }),
            this.translateKey(context, 'cli.reactShell.upgrade.summary.rollbackSnapshotPath', {
              path: rollbackSnapshotPath,
            }),
          ],
          interactionPrompts: [
            {
              category: ExecutionInteractionCategory.NONE,
              stage: ExecutionProgressStage.REPORT,
              title: this.translateKey(
                context,
                'cli.commandMessages.upgrade.inspectApplyReceiptTitle',
              ),
              action: nextActions[0] ?? applyReceiptPath,
              blocking: false,
            },
            {
              category: ExecutionInteractionCategory.NONE,
              stage: ExecutionProgressStage.REPORT,
              title: this.translateKey(context, 'cli.commandMessages.upgrade.runControlledApply'),
              action: nextActions[1] ?? this.buildApplyCommand(reportPath, true),
              blocking: false,
            },
          ],
        }),
        commandResult: {
          operation: CLI_RUNTIME_OPERATION.SCHEMA_UPGRADE_APPLY,
          summary: message,
          check_totals: context.calculateCheckTotals(checks),
          checks,
          artifacts: [
            {
              id: CliUpgradeArtifactId.APPLY_RECEIPT,
              path: applyReceiptPath,
            },
          ],
          experience: context.commandExperienceBuilder.buildExperiencePayload({
            roleProgress: [
              {
                roleId: 'operator',
                stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
                status: ExecutionProgressStatus.WARNING,
                category: ExecutionInteractionCategory.HUMAN_CONFIRMATION,
                summary: this.translateKey(
                  context,
                  'cli.commandMessages.upgrade.applyRejectedSummary',
                ),
                detail: applyReceiptPath,
                backlink: {
                  artifactPath: applyReceiptPath,
                },
              },
            ],
            interactionPrompts: [
              {
                category: ExecutionInteractionCategory.NONE,
                stage: ExecutionProgressStage.REPORT,
                title: this.translateKey(
                  context,
                  'cli.commandMessages.upgrade.inspectApplyReceiptTitle',
                ),
                action: nextActions[0] ?? applyReceiptPath,
                blocking: false,
              },
            ],
            layeredLogs: {
              summary: [
                `source_upgrade_id=${reportPayload.upgradeId}`,
                `apply_status=${CliUpgradeApplyStatus.REJECTED}`,
              ],
              detailed: [`apply_receipt=${applyReceiptPath}`],
            },
          }),
          details: {
            action: CliUpgradeAction.APPLY,
            apply_status: CliUpgradeApplyStatus.REJECTED,
            verify_status: null,
            confirmation_decision: confirmationDecision,
            source_upgrade_id: reportPayload.upgradeId,
            apply_receipt_path: applyReceiptPath,
            verify_receipt_path: null,
            report_path: reportPath,
            rollback_snapshot_path: rollbackSnapshotPath,
            rollback_receipt_path: null,
          } as Record<string, string | number | boolean | null>,
        },
      };
    }

    const configWritable = await context.canWritePath(context.options.workspace.configPath);
    if (!configWritable) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        this.translateKey(context, 'cli.commandMessages.upgrade.applyRequiresWriteAccess', {
          configPath: context.options.workspace.configPath,
        }),
        {
          configPath: context.options.workspace.configPath,
        },
      );
    }

    const candidateConfig = context.validateGovernorConfig(
      autoMigratedConfigPayload.autoMigratedConfig,
    );
    await context.artifactWriter.writeTextArtifact(
      context.options.workspace.configPath,
      `${stringify(candidateConfig).trimEnd()}\n`,
    );

    const verifyResult = await this.verifyWrittenConfig(
      context,
      verifyReceiptPath,
      applyId,
      reportPayload.upgradeId,
      reportPayload.analysis.targetVersion,
      rollbackSnapshotPath,
    );
    const applyStatus =
      verifyResult.status === CliUpgradeVerifyStatus.PASSED
        ? CliUpgradeApplyStatus.APPLIED
        : CliUpgradeApplyStatus.VERIFY_FAILED;
    const applyReceipt: CliUpgradeApplyReceiptArtifactPayload = {
      applyId,
      sourceUpgradeId: reportPayload.upgradeId,
      sourceConfigPath: reportPayload.sourceConfigPath,
      reportPath,
      autoMigratedConfigPath: reportPayload.autoMigratedConfigPath,
      rollbackSnapshotPath,
      confirmationDecision:
        confirmationDecision ?? (reportPayload.analysis.confirmationItems.length > 0 ? null : null),
      status: applyStatus,
      appliedAt: context.toRfc3339SecondsTimestamp(new Date()),
      sourceVersion: reportPayload.analysis.sourceVersion,
      targetVersion: reportPayload.analysis.targetVersion,
      verifyReceiptPath,
      ...(verifyResult.rollbackReceiptPath
        ? {
            rollbackReceiptPath: verifyResult.rollbackReceiptPath,
          }
        : {}),
    };
    await context.artifactWriter.writeJsonArtifact(applyReceiptPath, applyReceipt);

    const checks: CliCommandResultCheck[] = [
      this.buildConfirmationItemsCheck(
        reportPayload.analysis,
        reportPayload.preview?.blockingConfirmationCount ??
          reportPayload.analysis.confirmationItems.filter((item) => item.blocking).length,
        reportPayload.analysis.confirmationItems.length > 0
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.PASS,
        confirmationDecision ?? null,
      ),
      {
        id: CliCommandResultCheckId.UPGRADE_APPLY_RECEIPT,
        status:
          applyStatus === CliUpgradeApplyStatus.APPLIED
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: `${CliUpgradeReceiptDetailField.STATUS}=${applyStatus} ${CliUpgradeReceiptDetailField.PATH}=${applyReceiptPath}`,
      },
      {
        id: CliCommandResultCheckId.UPGRADE_VERIFY_RECEIPT,
        status:
          verifyResult.status === CliUpgradeVerifyStatus.PASSED
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.FAIL,
        detail: `${CliUpgradeReceiptDetailField.STATUS}=${verifyResult.status} ${CliUpgradeReceiptDetailField.PATH}=${verifyReceiptPath}`,
      },
      {
        id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
        status: CliGovernanceCheckStatus.PASS,
        detail: rollbackSnapshotPath,
      },
      ...(verifyResult.rollbackReceiptPath
        ? [
            {
              id: CliCommandResultCheckId.UPGRADE_ROLLBACK_RECEIPT,
              status: CliGovernanceCheckStatus.WARN,
              detail: `${CliUpgradeReceiptDetailField.STATUS}=${CliUpgradeRollbackStatus.ROLLED_BACK} ${CliUpgradeReceiptDetailField.PATH}=${verifyResult.rollbackReceiptPath}`,
            },
          ]
        : []),
    ];
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: CliUpgradeArtifactId.APPLY_RECEIPT,
        path: applyReceiptPath,
      },
      {
        id: CliUpgradeArtifactId.VERIFY_RECEIPT,
        path: verifyReceiptPath,
      },
      ...(verifyResult.rollbackReceiptPath
        ? [
            {
              id: CliUpgradeArtifactId.ROLLBACK_RECEIPT,
              path: verifyResult.rollbackReceiptPath,
            },
          ]
        : []),
    ];
    const message =
      applyStatus === CliUpgradeApplyStatus.APPLIED
        ? this.translateKey(context, 'cli.commandMessages.upgrade.applyCompleted', {
            applyReceiptPath,
            verifyReceiptPath,
          })
        : this.translateKey(context, 'cli.commandMessages.upgrade.verifyFailed', {
            verifyReceiptPath,
          });
    const nextActions = [
      this.translateKey(context, 'cli.commandMessages.upgrade.inspectApplyReceipt', {
        applyReceiptPath,
      }),
      this.translateKey(context, 'cli.commandMessages.upgrade.inspectVerifyReceipt', {
        verifyReceiptPath,
      }),
      ...(applyStatus === CliUpgradeApplyStatus.APPLIED
        ? [
            this.translateKey(context, 'cli.commandMessages.upgrade.rollbackWithReceipt', {
              command: this.buildRollbackCommand(applyReceiptPath),
            }),
          ]
        : verifyResult.rollbackReceiptPath
          ? [
              this.translateKey(context, 'cli.commandMessages.upgrade.inspectRollbackReceipt', {
                rollbackReceiptPath: verifyResult.rollbackReceiptPath,
              }),
            ]
          : []),
    ];

    return {
      message,
      reactCliViewModel: this.buildReactCliViewModel(context, {
        checks,
        message,
        statusMessage:
          applyStatus === CliUpgradeApplyStatus.APPLIED
            ? this.translateKey(context, 'cli.reactShell.upgrade.status.applyCompleted')
            : this.translateKey(context, 'cli.reactShell.upgrade.status.verifyFailed'),
        fieldValues: {
          workspaceRoot: context.options.workspace.workspaceRoot,
          sourceVersion: reportPayload.analysis.sourceVersion,
          targetVersion: reportPayload.analysis.targetVersion,
          confirmationDecision: confirmationDecision ?? UpgradeConfirmationDecision.ALLOW,
        },
        summaryLines: [
          message,
          this.translateKey(context, 'cli.reactShell.upgrade.summary.applyReceiptPath', {
            path: applyReceiptPath,
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.verifyReceiptPath', {
            path: verifyReceiptPath,
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.rollbackSnapshotPath', {
            path: rollbackSnapshotPath,
          }),
        ],
        interactionPrompts: nextActions.map((action, index) => ({
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title:
            index === 0
              ? this.translateKey(context, 'cli.commandMessages.upgrade.inspectApplyReceiptTitle')
              : index === 1
                ? this.translateKey(
                    context,
                    'cli.commandMessages.upgrade.inspectVerifyReceiptTitle',
                  )
                : this.translateKey(context, 'cli.commandMessages.upgrade.runRollback'),
          action,
          blocking: false,
        })),
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SCHEMA_UPGRADE_APPLY,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience: context.commandExperienceBuilder.buildExperiencePayload({
          roleProgress: [
            {
              roleId: 'operator',
              stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
              status: ExecutionProgressStatus.COMPLETED,
              category: ExecutionInteractionCategory.HUMAN_CONFIRMATION,
              summary: this.translateKey(
                context,
                'cli.commandMessages.upgrade.confirmationApplied',
              ),
              detail: confirmationDecision ?? UpgradeConfirmationDecision.ALLOW,
            },
            {
              roleId: 'upgrade-writer',
              stage: ExecutionProgressStage.REPORT,
              status:
                applyStatus === CliUpgradeApplyStatus.APPLIED
                  ? ExecutionProgressStatus.COMPLETED
                  : ExecutionProgressStatus.WARNING,
              category: ExecutionInteractionCategory.NONE,
              summary: this.translateKey(
                context,
                'cli.commandMessages.upgrade.applyResultSummary',
                {
                  status: applyStatus,
                },
              ),
              detail: applyReceiptPath,
              backlink: {
                artifactPath: applyReceiptPath,
              },
            },
            {
              roleId: 'upgrade-verifier',
              stage: ExecutionProgressStage.VERIFY,
              status:
                verifyResult.status === CliUpgradeVerifyStatus.PASSED
                  ? ExecutionProgressStatus.COMPLETED
                  : ExecutionProgressStatus.FAILED,
              category: ExecutionInteractionCategory.NONE,
              summary: this.translateKey(
                context,
                'cli.commandMessages.upgrade.verifyResultSummary',
                {
                  status: verifyResult.status,
                },
              ),
              detail: verifyReceiptPath,
              backlink: {
                artifactPath: verifyReceiptPath,
              },
            },
          ],
          interactionPrompts: nextActions.map((action, index) => ({
            category: ExecutionInteractionCategory.NONE,
            stage: ExecutionProgressStage.REPORT,
            title:
              index === 0
                ? this.translateKey(context, 'cli.commandMessages.upgrade.inspectApplyReceiptTitle')
                : index === 1
                  ? this.translateKey(
                      context,
                      'cli.commandMessages.upgrade.inspectVerifyReceiptTitle',
                    )
                  : this.translateKey(context, 'cli.commandMessages.upgrade.runRollback'),
            action,
            blocking: false,
          })),
          layeredLogs: {
            summary: [
              `source_upgrade_id=${reportPayload.upgradeId}`,
              `apply_status=${applyStatus}`,
              `verify_status=${verifyResult.status}`,
            ],
            detailed: [
              `apply_receipt=${applyReceiptPath}`,
              `verify_receipt=${verifyReceiptPath}`,
              `rollback_snapshot=${rollbackSnapshotPath}`,
              ...(verifyResult.rollbackReceiptPath
                ? [`rollback_receipt=${verifyResult.rollbackReceiptPath}`]
                : []),
            ],
          },
        }),
        details: {
          action: CliUpgradeAction.APPLY,
          source_upgrade_id: reportPayload.upgradeId,
          apply_status: applyStatus,
          verify_status: verifyResult.status,
          confirmation_decision: confirmationDecision ?? UpgradeConfirmationDecision.ALLOW,
          apply_receipt_path: applyReceiptPath,
          verify_receipt_path: verifyReceiptPath,
          rollback_snapshot_path: rollbackSnapshotPath,
          rollback_receipt_path: verifyResult.rollbackReceiptPath ?? null,
        } as Record<string, string | number | boolean | null>,
      },
    };
  }

  private async executeRollback(context: CliCommandExecutorContext) {
    this.assertConfigFileExists(context);

    const sourceArtifactPath = this.resolveRequiredArtifactPath(context, CliUpgradeAction.ROLLBACK);
    const rollbackSource = await this.resolveRollbackSource(context, sourceArtifactPath);
    const configWritable = await context.canWritePath(context.options.workspace.configPath);
    if (!configWritable) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        this.translateKey(context, 'cli.commandMessages.upgrade.rollbackRequiresWriteAccess', {
          configPath: context.options.workspace.configPath,
        }),
        {
          configPath: context.options.workspace.configPath,
        },
      );
    }

    const rollbackContent = await readFile(rollbackSource.rollbackSnapshotPath, 'utf8');
    await context.artifactWriter.writeTextArtifact(
      context.options.workspace.configPath,
      rollbackContent,
    );

    const rollbackId = `upgrade-rollback-${Date.now()}`;
    const rollbackReceiptPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${rollbackId}.rollback-receipt.json`,
    );
    const verifyReceiptPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${rollbackId}.verify.json`,
    );
    const verifyStatus = await this.verifyRollbackConfig(
      context,
      verifyReceiptPath,
      rollbackId,
      rollbackSource.sourceApplyId,
      rollbackSource.sourceUpgradeId,
    );
    const rollbackReceipt: CliUpgradeRollbackReceiptArtifactPayload = {
      rollbackId,
      sourceArtifactPath,
      sourceType: rollbackSource.sourceType,
      sourceApplyId: rollbackSource.sourceApplyId,
      sourceUpgradeId: rollbackSource.sourceUpgradeId,
      sourceConfigPath: rollbackSource.sourceConfigPath,
      restoredConfigPath: context.options.workspace.configPath,
      rollbackSnapshotPath: rollbackSource.rollbackSnapshotPath,
      status: CliUpgradeRollbackStatus.ROLLED_BACK,
      rolledBackAt: context.toRfc3339SecondsTimestamp(new Date()),
      verifyReceiptPath,
    };
    await context.artifactWriter.writeJsonArtifact(rollbackReceiptPath, rollbackReceipt);

    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
        status: CliGovernanceCheckStatus.PASS,
        detail: rollbackSource.rollbackSnapshotPath,
      },
      {
        id: CliCommandResultCheckId.UPGRADE_ROLLBACK_RECEIPT,
        status:
          verifyStatus === CliUpgradeVerifyStatus.PASSED
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.FAIL,
        detail: `${CliUpgradeReceiptDetailField.STATUS}=${CliUpgradeRollbackStatus.ROLLED_BACK} ${CliUpgradeReceiptDetailField.PATH}=${rollbackReceiptPath}`,
      },
      {
        id: CliCommandResultCheckId.UPGRADE_VERIFY_RECEIPT,
        status:
          verifyStatus === CliUpgradeVerifyStatus.PASSED
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.FAIL,
        detail: `${CliUpgradeReceiptDetailField.STATUS}=${verifyStatus} ${CliUpgradeReceiptDetailField.PATH}=${verifyReceiptPath}`,
      },
    ];
    const message = this.translateKey(context, 'cli.commandMessages.upgrade.rollbackCompleted', {
      rollbackReceiptPath,
    });
    const nextActions = [
      this.translateKey(context, 'cli.commandMessages.upgrade.inspectRollbackReceipt', {
        rollbackReceiptPath,
      }),
      this.translateKey(context, 'cli.commandMessages.upgrade.inspectVerifyReceipt', {
        verifyReceiptPath,
      }),
      this.translateKey(context, 'cli.commandMessages.upgrade.rerunPreviewAfterRollback'),
    ];

    return {
      message,
      reactCliViewModel: this.buildReactCliViewModel(context, {
        checks,
        message,
        statusMessage: this.translateKey(
          context,
          'cli.reactShell.upgrade.status.rollbackCompleted',
        ),
        fieldValues: {
          workspaceRoot: context.options.workspace.workspaceRoot,
          sourceVersion: rollbackSource.schemaVersion,
          targetVersion: rollbackSource.schemaVersion,
          confirmationDecision: rollbackSource.sourceType,
        },
        summaryLines: [
          message,
          this.translateKey(context, 'cli.reactShell.upgrade.summary.rollbackReceiptPath', {
            path: rollbackReceiptPath,
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.verifyReceiptPath', {
            path: verifyReceiptPath,
          }),
          this.translateKey(context, 'cli.reactShell.upgrade.summary.rollbackSnapshotPath', {
            path: rollbackSource.rollbackSnapshotPath,
          }),
        ],
        interactionPrompts: nextActions.map((action, index) => ({
          category: ExecutionInteractionCategory.NONE,
          stage: ExecutionProgressStage.REPORT,
          title:
            index === 0
              ? this.translateKey(
                  context,
                  'cli.commandMessages.upgrade.inspectRollbackReceiptTitle',
                )
              : index === 1
                ? this.translateKey(
                    context,
                    'cli.commandMessages.upgrade.inspectVerifyReceiptTitle',
                  )
                : this.translateKey(context, 'cli.commandMessages.upgrade.reviewUpgradeArtifacts'),
          action,
          blocking: false,
        })),
      }),
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SCHEMA_UPGRADE_ROLLBACK,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts: [
          {
            id: CliUpgradeArtifactId.ROLLBACK_RECEIPT,
            path: rollbackReceiptPath,
          },
          {
            id: CliUpgradeArtifactId.VERIFY_RECEIPT,
            path: verifyReceiptPath,
          },
        ],
        experience: context.commandExperienceBuilder.buildExperiencePayload({
          roleProgress: [
            {
              roleId: 'upgrade-rollback',
              stage: ExecutionProgressStage.REPORT,
              status: ExecutionProgressStatus.COMPLETED,
              category: ExecutionInteractionCategory.NONE,
              summary: this.translateKey(
                context,
                'cli.commandMessages.upgrade.rollbackResultSummary',
              ),
              detail: rollbackReceiptPath,
              backlink: {
                artifactPath: rollbackReceiptPath,
              },
            },
            {
              roleId: 'upgrade-verifier',
              stage: ExecutionProgressStage.VERIFY,
              status:
                verifyStatus === CliUpgradeVerifyStatus.PASSED
                  ? ExecutionProgressStatus.COMPLETED
                  : ExecutionProgressStatus.FAILED,
              category: ExecutionInteractionCategory.NONE,
              summary: this.translateKey(
                context,
                'cli.commandMessages.upgrade.verifyResultSummary',
                {
                  status: verifyStatus,
                },
              ),
              detail: verifyReceiptPath,
              backlink: {
                artifactPath: verifyReceiptPath,
              },
            },
          ],
          interactionPrompts: nextActions.map((action, index) => ({
            category: ExecutionInteractionCategory.NONE,
            stage: ExecutionProgressStage.REPORT,
            title:
              index === 0
                ? this.translateKey(
                    context,
                    'cli.commandMessages.upgrade.inspectRollbackReceiptTitle',
                  )
                : index === 1
                  ? this.translateKey(
                      context,
                      'cli.commandMessages.upgrade.inspectVerifyReceiptTitle',
                    )
                  : this.translateKey(
                      context,
                      'cli.commandMessages.upgrade.reviewUpgradeArtifacts',
                    ),
            action,
            blocking: false,
          })),
          layeredLogs: {
            summary: [
              `rollback_source_type=${rollbackSource.sourceType}`,
              `verify_status=${verifyStatus}`,
            ],
            detailed: [
              `rollback_snapshot=${rollbackSource.rollbackSnapshotPath}`,
              `rollback_receipt=${rollbackReceiptPath}`,
              `verify_receipt=${verifyReceiptPath}`,
            ],
          },
        }),
        details: {
          action: CliUpgradeAction.ROLLBACK,
          rollback_source_type: rollbackSource.sourceType,
          rollback_receipt_path: rollbackReceiptPath,
          verify_receipt_path: verifyReceiptPath,
          rollback_snapshot_path: rollbackSource.rollbackSnapshotPath,
          verify_status: verifyStatus,
        } as Record<string, string | number | boolean | null>,
      },
    };
  }

  private resolveAction(context: CliCommandExecutorContext): CliUpgradeAction {
    const rawAction = context.options.upgradeCommandOptions?.action?.trim().toLowerCase() ?? null;
    if (rawAction === null || rawAction.length === 0) {
      return CliUpgradeAction.PREVIEW;
    }

    if (CLI_UPGRADE_ACTION_VALUES.has(rawAction)) {
      return rawAction as CliUpgradeAction;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translateKey(context, 'cli.commandMessages.upgrade.invalidAction', {
        action: rawAction,
        supported: CLI_UPGRADE_ACTION_ORDER.join('|'),
      }),
      {
        command: CliCommandName.UPGRADE,
        action: rawAction,
      },
    );
  }

  private resolveTargetVersion(context: CliCommandExecutorContext): GovernorSchemaVersion {
    const rawTargetVersion =
      context.options.upgradeCommandOptions?.targetVersion?.trim() ?? GovernorSchemaVersion.V1_1;
    if (Object.values(GovernorSchemaVersion).includes(rawTargetVersion as GovernorSchemaVersion)) {
      return rawTargetVersion as GovernorSchemaVersion;
    }

    throw new RuntimeError(
      GovernorErrorCode.CONFIG_SCHEMA_VERSION_UNSUPPORTED,
      this.translateKey(context, 'cli.commandMessages.upgrade.unsupportedTargetVersion', {
        targetVersion: rawTargetVersion,
        supported: Object.values(GovernorSchemaVersion).join('|'),
      }),
      {
        targetVersion: rawTargetVersion,
      },
    );
  }

  private resolveConfirmationDecision(
    context: CliCommandExecutorContext,
  ): CliUpgradeConfirmationDecision | null {
    const rawDecision =
      context.options.upgradeCommandOptions?.confirmationDecision?.trim().toLowerCase() ?? null;
    if (rawDecision === null || rawDecision.length === 0) {
      return null;
    }

    if (CLI_UPGRADE_CONFIRMATION_DECISION_VALUES.has(rawDecision)) {
      return rawDecision as CliUpgradeConfirmationDecision;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translateKey(context, 'cli.commandMessages.upgrade.invalidConfirmationDecision', {
        decision: rawDecision,
      }),
      {
        command: CliCommandName.UPGRADE,
        option: '--confirm-upgrade',
        value: rawDecision,
      },
    );
  }

  private resolveApplyReadiness(
    upgradeDiffResult: UpgradeSchemaDiffResult,
    rollbackSnapshotAvailable: boolean,
  ): CliUpgradeApplyReadiness {
    if (!rollbackSnapshotAvailable) {
      return CliUpgradeApplyReadiness.BLOCKED;
    }

    if (upgradeDiffResult.confirmationDecision === UpgradeConfirmationDecision.BLOCK) {
      return CliUpgradeApplyReadiness.BLOCKED;
    }

    if (upgradeDiffResult.confirmationDecision === UpgradeConfirmationDecision.CONFIRM) {
      return CliUpgradeApplyReadiness.NEEDS_CONFIRMATION;
    }

    return CliUpgradeApplyReadiness.READY;
  }

  private buildPreviewChecks(
    upgradeDiffResult: UpgradeSchemaDiffResult,
    applyReadiness: CliUpgradeApplyReadiness,
    suggestionCount: number,
    confirmationCount: number,
    blockingConfirmationCount: number,
    rollbackSnapshotPath: string,
  ): CliCommandResultCheck[] {
    return [
      {
        id: CliCommandResultCheckId.UPGRADE_SCHEMA_DIFF,
        status:
          upgradeDiffResult.confirmationDecision === UpgradeConfirmationDecision.ALLOW
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: `${CliUpgradeSchemaDiffDetailField.DIFFS}=${upgradeDiffResult.diffs.length} ${CliUpgradeSchemaDiffDetailField.SOURCE}=${upgradeDiffResult.sourceVersion} ${CliUpgradeSchemaDiffDetailField.TARGET}=${upgradeDiffResult.targetVersion}`,
      },
      {
        id: CliCommandResultCheckId.MIGRATION_SUGGESTIONS,
        status: suggestionCount > 0 ? CliGovernanceCheckStatus.WARN : CliGovernanceCheckStatus.PASS,
        detail: `${CliMigrationSuggestionDetailField.COUNT}=${suggestionCount}`,
      },
      this.buildConfirmationItemsCheck(
        upgradeDiffResult,
        blockingConfirmationCount,
        confirmationCount > 0 ? CliGovernanceCheckStatus.WARN : CliGovernanceCheckStatus.PASS,
        null,
      ),
      {
        id: CliCommandResultCheckId.UPGRADE_APPLY_READINESS,
        status:
          applyReadiness === CliUpgradeApplyReadiness.READY
            ? CliGovernanceCheckStatus.PASS
            : applyReadiness === CliUpgradeApplyReadiness.NEEDS_CONFIRMATION
              ? CliGovernanceCheckStatus.WARN
              : CliGovernanceCheckStatus.FAIL,
        detail: `${CliUpgradeApplyReadinessDetailField.READINESS}=${applyReadiness} ${CliUpgradeApplyReadinessDetailField.DECISION}=${upgradeDiffResult.confirmationDecision} ${CliUpgradeApplyReadinessDetailField.COUNT}=${confirmationCount} ${CliUpgradeApplyReadinessDetailField.BLOCKING}=${blockingConfirmationCount}`,
      },
      {
        id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
        status: CliGovernanceCheckStatus.PASS,
        detail: rollbackSnapshotPath,
      },
    ];
  }

  private buildConfirmationItemsCheck(
    upgradeDiffResult: UpgradeSchemaDiffResult,
    blockingConfirmationCount: number,
    status: CliGovernanceCheckStatus,
    confirmationDecision: CliUpgradeConfirmationDecision | null,
  ): CliCommandResultCheck {
    return {
      id: CliCommandResultCheckId.CONFIRMATION_ITEMS,
      status,
      detail: `${CliConfirmationItemsDetailField.DECISION}=${confirmationDecision ?? upgradeDiffResult.confirmationDecision} ${CliConfirmationItemsDetailField.COUNT}=${upgradeDiffResult.confirmationItems.length} ${CliConfirmationItemsDetailField.BLOCKING}=${blockingConfirmationCount}`,
    };
  }

  private resolveReadinessProgressStatus(
    readiness: CliUpgradeApplyReadiness,
  ): ExecutionProgressStatus {
    if (readiness === CliUpgradeApplyReadiness.READY) {
      return ExecutionProgressStatus.COMPLETED;
    }

    if (readiness === CliUpgradeApplyReadiness.NEEDS_CONFIRMATION) {
      return ExecutionProgressStatus.WARNING;
    }

    return ExecutionProgressStatus.FAILED;
  }

  private assertConfigFileExists(context: CliCommandExecutorContext): void {
    if (existsSync(context.options.workspace.configPath)) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.CONFIG_FILE_READ_FAILED,
      this.translateKey(context, 'cli.commandMessages.upgrade.missingConfig', {
        configPath: context.options.workspace.configPath,
      }),
      {
        configPath: context.options.workspace.configPath,
      },
    );
  }

  private resolveRequiredArtifactPath(
    context: CliCommandExecutorContext,
    action: CliUpgradeAction,
  ): string {
    const rawArtifactPath = context.options.upgradeCommandOptions?.artifactPath?.trim() ?? null;
    if (rawArtifactPath && rawArtifactPath.length > 0) {
      return resolve(context.options.currentWorkingDirectory, rawArtifactPath);
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translateKey(context, 'cli.commandMessages.upgrade.missingArtifactPath', {
        action,
      }),
      {
        command: CliCommandName.UPGRADE,
        action,
      },
    );
  }

  private assertArtifactExists(
    context: CliCommandExecutorContext,
    artifactPath: string,
    translationKey: string,
  ): void {
    if (existsSync(artifactPath)) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.CONFIG_FILE_READ_FAILED,
      this.translateKey(context, translationKey, {
        artifactPath,
      }),
      {
        artifactPath,
      },
    );
  }

  private async readUpgradeReportArtifact(
    context: CliCommandExecutorContext,
    reportPath: string,
  ): Promise<CliUpgradePreviewArtifactPayload> {
    const payload = await context.artifactWriter.safeReadJson(reportPath);
    const autoMigratedConfigPath =
      payload && typeof payload.autoMigratedConfigPath === 'string'
        ? payload.autoMigratedConfigPath
        : null;
    const rollbackReference =
      payload?.rollbackReference &&
      typeof payload.rollbackReference === 'object' &&
      !Array.isArray(payload.rollbackReference) &&
      'rollbackSnapshotPath' in payload.rollbackReference &&
      typeof payload.rollbackReference.rollbackSnapshotPath === 'string'
        ? (payload.rollbackReference as { rollbackSnapshotPath: string }).rollbackSnapshotPath
        : null;
    if (
      !payload ||
      typeof payload.upgradeId !== 'string' ||
      typeof payload.sourceConfigPath !== 'string' ||
      !autoMigratedConfigPath ||
      !rollbackReference ||
      !payload.analysis ||
      typeof payload.analysis !== 'object'
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translateKey(context, 'cli.commandMessages.upgrade.invalidReportArtifact', {
          reportPath,
        }),
        {
          reportPath,
        },
      );
    }

    return payload as unknown as CliUpgradePreviewArtifactPayload;
  }

  private async readAutoMigratedConfigArtifact(
    context: CliCommandExecutorContext,
    artifactPath: string,
  ): Promise<CliUpgradeAutoMigratedConfigArtifactPayload> {
    const payload = await context.artifactWriter.safeReadJson(artifactPath);
    if (
      !payload ||
      typeof payload.upgradeId !== 'string' ||
      typeof payload.sourceConfigPath !== 'string' ||
      !payload.autoMigratedConfig ||
      typeof payload.autoMigratedConfig !== 'object' ||
      Array.isArray(payload.autoMigratedConfig)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.translateKey(
          context,
          'cli.commandMessages.upgrade.invalidAutoMigratedConfigArtifact',
          {
            artifactPath,
          },
        ),
        {
          artifactPath,
        },
      );
    }

    return payload as unknown as CliUpgradeAutoMigratedConfigArtifactPayload;
  }

  private assertReportMatchesWorkspace(
    context: CliCommandExecutorContext,
    reportPayload: CliUpgradePreviewArtifactPayload,
  ): void {
    if (reportPayload.sourceConfigPath === context.options.workspace.configPath) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translateKey(context, 'cli.commandMessages.upgrade.reportWorkspaceMismatch', {
        reportConfigPath: reportPayload.sourceConfigPath,
        workspaceConfigPath: context.options.workspace.configPath,
      }),
      {
        reportConfigPath: reportPayload.sourceConfigPath,
        workspaceConfigPath: context.options.workspace.configPath,
      },
    );
  }

  private async verifyWrittenConfig(
    context: CliCommandExecutorContext,
    verifyReceiptPath: string,
    applyId: string,
    sourceUpgradeId: string,
    targetVersion: string,
    rollbackSnapshotPath: string,
  ): Promise<{
    status: CliUpgradeVerifyStatus;
    rollbackReceiptPath?: string;
  }> {
    const configLoader = new ConfigLoader();
    try {
      const verifiedConfig = configLoader.loadFromFile(context.options.workspace.configPath);
      await context.artifactWriter.writeJsonArtifact(verifyReceiptPath, {
        verifyId: `verify-${applyId}`,
        applyId,
        sourceUpgradeId,
        status: CliUpgradeVerifyStatus.PASSED,
        verifiedAt: context.toRfc3339SecondsTimestamp(new Date()),
        configPath: context.options.workspace.configPath,
        schemaVersion: verifiedConfig.schemaVersion,
        targetVersion,
      } satisfies CliUpgradeVerifyArtifactPayload);
      return {
        status: CliUpgradeVerifyStatus.PASSED,
      };
    } catch (error) {
      const rollbackReceiptPath = await this.restoreRollbackSnapshotAfterVerifyFailure(
        context,
        applyId,
        sourceUpgradeId,
        rollbackSnapshotPath,
      );
      await context.artifactWriter.writeJsonArtifact(verifyReceiptPath, {
        verifyId: `verify-${applyId}`,
        applyId,
        sourceUpgradeId,
        status: CliUpgradeVerifyStatus.FAILED,
        verifiedAt: context.toRfc3339SecondsTimestamp(new Date()),
        configPath: context.options.workspace.configPath,
        schemaVersion: 'unknown',
        targetVersion,
        error: context.formatExecFailureDetail(error),
      } satisfies CliUpgradeVerifyArtifactPayload);
      return {
        status: CliUpgradeVerifyStatus.FAILED,
        rollbackReceiptPath,
      };
    }
  }

  private async restoreRollbackSnapshotAfterVerifyFailure(
    context: CliCommandExecutorContext,
    applyId: string,
    sourceUpgradeId: string,
    rollbackSnapshotPath: string,
  ): Promise<string> {
    const rollbackReceiptPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'upgrade',
      `${applyId}.auto-rollback-receipt.json`,
    );
    const rollbackContent = await readFile(rollbackSnapshotPath, 'utf8');
    await context.artifactWriter.writeTextArtifact(
      context.options.workspace.configPath,
      rollbackContent,
    );
    await context.artifactWriter.writeJsonArtifact(rollbackReceiptPath, {
      rollbackId: `auto-rollback-${applyId}`,
      sourceArtifactPath: rollbackSnapshotPath,
      sourceType: CliUpgradeRollbackSourceType.ROLLBACK_SNAPSHOT,
      sourceApplyId: applyId,
      sourceUpgradeId,
      sourceConfigPath: context.options.workspace.configPath,
      restoredConfigPath: context.options.workspace.configPath,
      rollbackSnapshotPath,
      status: CliUpgradeRollbackStatus.ROLLED_BACK,
      rolledBackAt: context.toRfc3339SecondsTimestamp(new Date()),
      verifyReceiptPath: null,
    } satisfies CliUpgradeRollbackReceiptArtifactPayload);
    return rollbackReceiptPath;
  }

  private async resolveRollbackSource(
    context: CliCommandExecutorContext,
    sourceArtifactPath: string,
  ): Promise<{
    sourceType: CliUpgradeRollbackSourceType;
    sourceApplyId: string | null;
    sourceUpgradeId: string | null;
    sourceConfigPath: string;
    rollbackSnapshotPath: string;
    schemaVersion: string;
  }> {
    const payload = await context.artifactWriter.safeReadJson(sourceArtifactPath);
    if (
      payload &&
      typeof payload.rollbackSnapshotPath === 'string' &&
      typeof payload.sourceConfigPath === 'string'
    ) {
      const schemaVersion = await this.readSchemaVersionFromSnapshot(
        payload.rollbackSnapshotPath,
        context,
      );
      return {
        sourceType: CliUpgradeRollbackSourceType.APPLY_RECEIPT,
        sourceApplyId: typeof payload.applyId === 'string' ? payload.applyId : null,
        sourceUpgradeId:
          typeof payload.sourceUpgradeId === 'string' ? payload.sourceUpgradeId : null,
        sourceConfigPath: payload.sourceConfigPath,
        rollbackSnapshotPath: payload.rollbackSnapshotPath,
        schemaVersion,
      };
    }

    this.assertArtifactExists(
      context,
      sourceArtifactPath,
      'cli.commandMessages.upgrade.missingRollbackSource',
    );
    const schemaVersion = await this.readSchemaVersionFromSnapshot(sourceArtifactPath, context);
    return {
      sourceType: CliUpgradeRollbackSourceType.ROLLBACK_SNAPSHOT,
      sourceApplyId: null,
      sourceUpgradeId: null,
      sourceConfigPath: context.options.workspace.configPath,
      rollbackSnapshotPath: sourceArtifactPath,
      schemaVersion,
    };
  }

  private async readSchemaVersionFromSnapshot(
    rollbackSnapshotPath: string,
    context: CliCommandExecutorContext,
  ): Promise<string> {
    try {
      const snapshotContent = await readFile(rollbackSnapshotPath, 'utf8');
      const matchedSchemaVersion = snapshotContent.match(/schemaVersion:\s*["']?([^"'\n]+)["']?/u);
      return matchedSchemaVersion?.[1] ?? context.translate('cli.reactShell.shared.notSet');
    } catch {
      return context.translate('cli.reactShell.shared.notSet');
    }
  }

  private async verifyRollbackConfig(
    context: CliCommandExecutorContext,
    verifyReceiptPath: string,
    rollbackId: string,
    sourceApplyId: string | null,
    sourceUpgradeId: string | null,
  ): Promise<CliUpgradeVerifyStatus> {
    const configLoader = new ConfigLoader();
    try {
      const restoredConfig = configLoader.loadFromFile(context.options.workspace.configPath);
      await context.artifactWriter.writeJsonArtifact(verifyReceiptPath, {
        verifyId: `verify-${rollbackId}`,
        rollbackId,
        sourceApplyId,
        sourceUpgradeId,
        status: CliUpgradeVerifyStatus.PASSED,
        verifiedAt: context.toRfc3339SecondsTimestamp(new Date()),
        configPath: context.options.workspace.configPath,
        schemaVersion: restoredConfig.schemaVersion,
      } satisfies CliUpgradeVerifyArtifactPayload);
      return CliUpgradeVerifyStatus.PASSED;
    } catch (error) {
      await context.artifactWriter.writeJsonArtifact(verifyReceiptPath, {
        verifyId: `verify-${rollbackId}`,
        rollbackId,
        sourceApplyId,
        sourceUpgradeId,
        status: CliUpgradeVerifyStatus.FAILED,
        verifiedAt: context.toRfc3339SecondsTimestamp(new Date()),
        configPath: context.options.workspace.configPath,
        schemaVersion: 'unknown',
        error: context.formatExecFailureDetail(error),
      } satisfies CliUpgradeVerifyArtifactPayload);
      return CliUpgradeVerifyStatus.FAILED;
    }
  }

  private buildApplyCommand(reportPath: string, confirmationRequired = false): string {
    return `repo-ai-governor upgrade apply ${reportPath}${confirmationRequired ? ' --confirm-upgrade approve' : ''}`;
  }

  private buildRollbackCommand(receiptPath: string): string {
    return `repo-ai-governor upgrade rollback ${receiptPath}`;
  }

  private buildReactCliViewModel(
    context: CliCommandExecutorContext,
    options: CliUpgradeSummaryViewModelOptions,
  ): ReactCliViewModel | undefined {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      return undefined;
    }

    const descriptor = this.descriptorCatalog
      .createRegistry({
        translate: context.translate,
      })
      .resolve(CliCommandName.UPGRADE);
    if (!descriptor) {
      return undefined;
    }

    const resolvedThemePreset = runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET;
    return this.viewModelBuilder.build({
      commandName: CliCommandName.UPGRADE,
      descriptor,
      subtitle: `ui=${runtimeDebugOptions.uiMode} theme=${resolvedThemePreset} stdout=${context.options.outputMode} workspace=${context.options.workspace.mode}`,
      inputTitle: this.translateKey(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translateKey(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translateKey(context, 'cli.reactShell.shared.attention'),
      footerShortcutsTitle: this.translateKey(context, 'cli.reactShell.shared.shortcuts'),
      themePreset: resolvedThemePreset,
      statusMessage: options.statusMessage,
      statusVariant: this.viewModelBuilder.resolveStatusVariantFromChecks(options.checks),
      fieldValues: options.fieldValues,
      summaryLines: options.summaryLines,
      checks: options.checks,
      interactionPrompts: options.interactionPrompts,
    });
  }

  /**
   * Resolves one localized string through i18n runtime.
   * @param context Command execution context.
   * @param key Translation key.
   * @param interpolation Optional translation variables.
   * @returns Localized string or the key when translation runtime is unavailable.
   */
  private translateKey(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate?.(key, interpolation) ?? key;
  }
}
