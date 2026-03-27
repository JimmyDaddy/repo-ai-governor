import { resolve } from 'node:path';

import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import { CliCommandName } from '../constants/cli-command.constant.js';
import { CliCommandResultCheckId } from '../constants/cli-command-result-check.constant.js';
import {
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import type { CliCommandResultArtifact, CliCommandResultCheck } from '../types/index.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns `connect` command execution outside the runtime facade.
 */
export class CliConnectCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.CONNECT;

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.recordLedger && !runtimeDebugOptions.taskId) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'connect --record-ledger requires --task-id <id>.',
        {
          command: CliCommandName.CONNECT,
          option: '--task-id',
        },
      );
    }

    const adapterVerification = await context.resolveAdapterVerification();
    const connectId = `connect-${Date.now()}`;
    const diagnosticsArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
      `${connectId}.json`,
    );

    await context.artifactWriter.writeJsonArtifact(diagnosticsArtifactPath, {
      connectId,
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      adapters: context.options.adaptersConfig,
      verification:
        context.adapterDiagnosticsRuntime.createAdapterVerificationArtifactPayload(
          adapterVerification,
        ),
      nextActions: adapterVerification.nextActions,
      behavior: {
        recordLedger: runtimeDebugOptions.recordLedger,
        taskId: runtimeDebugOptions.taskId,
      },
    });

    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.ADAPTER_VERIFICATION,
        status: adapterVerification.overallStatus,
        detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
      },
      {
        id: 'diagnostics_artifact',
        status: CliGovernanceCheckStatus.PASS,
        detail: diagnosticsArtifactPath,
      },
    ];
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: 'connect_diagnostics',
        path: diagnosticsArtifactPath,
      },
    ];

    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      const ledgerBackfillPath = resolve(
        context.options.workspace.workspaceRoot,
        'context',
        'ledger-backfill',
        'connect',
        `${connectId}.json`,
      );
      await context.artifactWriter.writeJsonArtifact(ledgerBackfillPath, {
        ledgerBackfillId: `ledger-backfill-${connectId}`,
        status: CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING,
        createdAt: context.toRfc3339SecondsTimestamp(new Date()),
        taskId: runtimeDebugOptions.taskId,
        connectId,
        diagnosticsArtifactPath,
        attribution: {
          chain: 'connect->doctor->verify',
          chainStep: 'connect',
        },
      });
      checks.push({
        id: 'ledger_backfill',
        status: CliGovernanceCheckStatus.PASS,
        detail: `task_id=${runtimeDebugOptions.taskId}`,
      });
      artifacts.push({
        id: 'connect_ledger_backfill',
        path: ledgerBackfillPath,
      });
    } else if (runtimeDebugOptions.taskId) {
      checks.push({
        id: 'ledger_backfill',
        status: CliGovernanceCheckStatus.WARN,
        detail: '--task-id ignored because --record-ledger is not set',
      });
    }

    const roleProgress = context.adapterDiagnosticsRuntime.createAdapterRoleProgressRows({
      verification: adapterVerification,
      stage: ExecutionProgressStage.CONNECT,
      diagnosticsPath: diagnosticsArtifactPath,
      executionId: connectId,
    });
    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      roleProgress.push({
        roleId: 'ledger-backfill',
        stage: ExecutionProgressStage.LEDGER_BACKFILL,
        status: ExecutionProgressStatus.WAITING,
        category: ExecutionInteractionCategory.NONE,
        summary: 'Ledger backfill artifact is ready for task-record consumption.',
        detail: `task_id=${runtimeDebugOptions.taskId}`,
        backlink: {
          executionId: connectId,
          stageId: ExecutionProgressStage.LEDGER_BACKFILL,
          artifactPath: diagnosticsArtifactPath,
        },
      });
    }
    const interactionPrompts = context.adapterDiagnosticsRuntime.createAdapterInteractionPrompts({
      verification: adapterVerification,
      stage: ExecutionProgressStage.CONNECT,
    });
    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      interactionPrompts.push({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.LEDGER_BACKFILL,
        title: context.localizeText('Consume ledger backfill', '处理台账回填产物'),
        action: context.localizeText(
          'Resolve context/ledger-backfill/connect artifact into tasks/checklist/tasks.csv.',
          '将 context/ledger-backfill/connect 产物回填到 tasks/checklist/tasks.csv。',
        ),
        blocking: false,
      });
    }
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress,
      interactionPrompts,
      layeredLogs: {
        summary: [
          `connect_id=${connectId}`,
          `adapter_status=${adapterVerification.overallStatus}`,
          `required_failures=${adapterVerification.requiredRoleFailedCount}`,
        ],
        detailed: [
          `diagnostics_path=${diagnosticsArtifactPath}`,
          `fallback_roles=${adapterVerification.fallbackRoleCount}`,
          `degraded_roles=${adapterVerification.degradedRoleCount}`,
          `record_ledger=${runtimeDebugOptions.recordLedger}`,
        ],
      },
    });
    const message = context.localizeText(
      `Connect completed with adapter_status=${adapterVerification.overallStatus}; diagnostics=${diagnosticsArtifactPath}.`,
      `连接已完成，adapter_status=${adapterVerification.overallStatus}；诊断文件=${diagnosticsArtifactPath}。`,
    );
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_CONNECT,
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          adapter_status: adapterVerification.overallStatus,
          required_roles: adapterVerification.requiredRoleCount,
          required_role_failures: adapterVerification.requiredRoleFailedCount,
          diagnostics_path: diagnosticsArtifactPath,
          record_ledger: runtimeDebugOptions.recordLedger,
          task_id: runtimeDebugOptions.taskId,
        },
      },
    };
  }
}
