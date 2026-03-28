import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  ConfigLoader,
  GovernorSchemaVersion,
  UpgradeSchemaDiffService,
} from '@repo-ai-governor/config';
import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliCommandResultCheckId } from '../constants/cli-command-result-check.constant.js';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import type { CliCommandExecutorContext } from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns `upgrade` command execution outside the runtime facade.
 */
export class CliUpgradeCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.UPGRADE;

  public async execute(context: CliCommandExecutorContext) {
    if (!existsSync(context.options.workspace.configPath)) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `upgrade requires config file at ${context.options.workspace.configPath}; run \`init\` first.`,
        {
          configPath: context.options.workspace.configPath,
        },
      );
    }

    const configLoader = new ConfigLoader();
    const upgradeSchemaDiffService = new UpgradeSchemaDiffService();
    const sourceConfig = configLoader.loadFromFile(context.options.workspace.configPath);
    const upgradeDiffResult = upgradeSchemaDiffService.analyze({
      sourceConfig,
      targetVersion: GovernorSchemaVersion.V1_1,
    });
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
    await context.artifactWriter.writeTextArtifact(rollbackSnapshotPath, rawConfigContent);
    await context.artifactWriter.writeJsonArtifact(autoMigratedConfigPath, {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      sourceConfigPath: context.options.workspace.configPath,
      targetVersion: upgradeDiffResult.targetVersion,
      autoMigratedConfig: upgradeDiffResult.autoMigratedConfig,
    });
    await context.artifactWriter.writeJsonArtifact(reportPath, {
      upgradeId,
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      sourceConfigPath: context.options.workspace.configPath,
      rollbackReference: {
        rollbackSnapshotPath,
        restoreCommand: `cp ${rollbackSnapshotPath} ${context.options.workspace.configPath}`,
        reason:
          'Analyze-only upgrade keeps the current config snapshot as the explicit rollback source.',
      },
      analysis: upgradeDiffResult,
    });

    const suggestionCount = upgradeDiffResult.suggestions.length;
    const confirmationCount = upgradeDiffResult.confirmationItems.length;
    const blockingConfirmationCount = upgradeDiffResult.confirmationItems.filter(
      (item) => item.blocking,
    ).length;
    const message = `Upgrade analysis completed with decision=${upgradeDiffResult.confirmationDecision}; report=${reportPath}.`;
    const checks = [
      {
        id: CliCommandResultCheckId.UPGRADE_SCHEMA_DIFF,
        status:
          upgradeDiffResult.confirmationDecision === 'allow'
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: `diffs=${upgradeDiffResult.diffs.length} source=${upgradeDiffResult.sourceVersion} target=${upgradeDiffResult.targetVersion}`,
      },
      {
        id: CliCommandResultCheckId.MIGRATION_SUGGESTIONS,
        status: suggestionCount > 0 ? CliGovernanceCheckStatus.WARN : CliGovernanceCheckStatus.PASS,
        detail: `count=${suggestionCount}`,
      },
      {
        id: CliCommandResultCheckId.CONFIRMATION_ITEMS,
        status:
          confirmationCount > 0 ? CliGovernanceCheckStatus.WARN : CliGovernanceCheckStatus.PASS,
        detail: `decision=${upgradeDiffResult.confirmationDecision} count=${confirmationCount} blocking=${blockingConfirmationCount}`,
      },
      {
        id: CliCommandResultCheckId.ROLLBACK_REFERENCE,
        status: CliGovernanceCheckStatus.PASS,
        detail: rollbackSnapshotPath,
      },
    ];
    const nextActions = [
      this.translateKey(context, 'cli.commandMessages.upgrade.inspectReport', {
        reportPath,
        autoMigratedConfigPath,
      }),
      ...(confirmationCount > 0
        ? [this.translateKey(context, 'cli.commandMessages.upgrade.confirmItems')]
        : []),
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
          status:
            confirmationCount > 0
              ? ExecutionProgressStatus.WARNING
              : ExecutionProgressStatus.COMPLETED,
          category:
            confirmationCount > 0
              ? ExecutionInteractionCategory.HUMAN_CONFIRMATION
              : ExecutionInteractionCategory.NONE,
          summary:
            confirmationCount > 0
              ? this.translateKey(context, 'cli.commandMessages.upgrade.manualConfirmationRequired')
              : this.translateKey(context, 'cli.commandMessages.upgrade.noManualConfirmation'),
          detail: `confirmation_items=${confirmationCount}`,
        },
      ],
      interactionPrompts: nextActions.map((action, index) => ({
        category:
          index === 1 && confirmationCount > 0
            ? ExecutionInteractionCategory.HUMAN_CONFIRMATION
            : ExecutionInteractionCategory.NONE,
        stage:
          index === 1 && confirmationCount > 0
            ? ExecutionProgressStage.HUMAN_CONFIRMATION
            : ExecutionProgressStage.REPORT,
        title:
          index === 0
            ? this.translateKey(context, 'cli.commandMessages.upgrade.reviewUpgradeArtifacts')
            : index === 1 && confirmationCount > 0
              ? this.translateKey(context, 'cli.commandMessages.upgrade.confirmUpgradeChanges')
              : this.translateKey(context, 'cli.commandMessages.upgrade.retainRollbackSnapshot'),
        action,
        blocking: index === 1 && confirmationCount > 0,
      })),
      layeredLogs: {
        summary: [
          `source_version=${upgradeDiffResult.sourceVersion}`,
          `target_version=${upgradeDiffResult.targetVersion}`,
          `confirmation_decision=${upgradeDiffResult.confirmationDecision}`,
        ],
        detailed: [
          `diff_count=${upgradeDiffResult.diffs.length}`,
          `suggestion_count=${suggestionCount}`,
          `confirmation_count=${confirmationCount}`,
          `rollback_snapshot=${rollbackSnapshotPath}`,
        ],
      },
    });
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SCHEMA_UPGRADE_ANALYZE,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts: [
          {
            id: 'upgrade_report',
            path: reportPath,
          },
          {
            id: 'upgrade_auto_migrated_config',
            path: autoMigratedConfigPath,
          },
          {
            id: 'upgrade_rollback_snapshot',
            path: rollbackSnapshotPath,
          },
        ],
        experience,
        details: {
          source_version: upgradeDiffResult.sourceVersion,
          target_version: upgradeDiffResult.targetVersion,
          confirmation_decision: upgradeDiffResult.confirmationDecision,
          diff_count: upgradeDiffResult.diffs.length,
          suggestion_count: suggestionCount,
          confirmation_count: confirmationCount,
          blocking_confirmation_count: blockingConfirmationCount,
          report_path: reportPath,
          auto_migrated_config_path: autoMigratedConfigPath,
          rollback_snapshot_path: rollbackSnapshotPath,
        },
      },
    };
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
