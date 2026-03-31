import { resolve } from 'node:path';

import {
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
import type {
  CliCommandProgressEvent,
  CliCommandResultArtifact,
  CliCommandResultCheck,
} from '../types/index.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

const VERIFY_PROGRESS_TOTAL_STEPS = 2;
const VERIFY_PROGRESS_ROW_ADAPTER_VERIFICATION = 'adapter-verification';
const VERIFY_PROGRESS_ROW_DIAGNOSTICS = 'verify-diagnostics';

/**
 * Owns `verify` command execution outside the runtime facade.
 */
export class CliVerifyCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.VERIFY;

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const verifyId = `verify-${Date.now()}`;
    const diagnosticsArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'verify',
      `${verifyId}.json`,
    );

    this.emitProgress(context, {
      commandName: CliCommandName.VERIFY,
      runState: 'running',
      statusLine: this.translate(context, 'cli.reactShell.progress.verify.starting'),
      currentStepTitle: this.translate(context, 'cli.reactShell.progress.verify.verifyingAdapters'),
      totalSteps: VERIFY_PROGRESS_TOTAL_STEPS,
      completedSteps: 0,
      cancelCapability: context.abortSignal ? 'supported' : 'none',
      row: {
        id: VERIFY_PROGRESS_ROW_ADAPTER_VERIFICATION,
        title: this.translate(context, 'cli.reactShell.progress.verify.verifyingAdapters'),
        status: ExecutionProgressStatus.RUNNING,
      },
    });
    this.throwIfAborted(context);

    const adapterVerification = await context.resolveAdapterVerification(context.abortSignal);
    this.throwIfAborted(context);
    const matrixPayload = context.onboardingRuntime.createVerifyMatrixPayload({
      executionId: verifyId,
      verification: adapterVerification,
      adaptersConfig: context.options.adaptersConfig,
    });
    const agentView = context.agentProjectionRuntime.createCliAgentView({
      descriptors: context.agentProjectionRuntime.createDescriptorsFromRoleEvaluations({
        adaptersConfig: context.options.adaptersConfig,
        verification: adapterVerification,
        workspace: context.options.workspace,
        executionId: verifyId,
      }),
    });
    const diagnosticsSummary = `status=${adapterVerification.overallStatus} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount}`;
    const onboardingContract = context.onboardingRuntime.createOnboardingContractPayload({
      commandName: 'verify',
      executionId: verifyId,
      workspaceId: context.options.workspace.workspaceId,
      verificationStatus: adapterVerification.overallStatus,
      nextActions: adapterVerification.nextActions,
      enabledTools: context.onboardingRuntime.resolveSelectedTools({
        requestedTools: runtimeDebugOptions.requestedTools,
        currentAdaptersConfig: context.options.adaptersConfig,
      }),
      adaptersConfig: context.options.adaptersConfig,
      dryRun: runtimeDebugOptions.dryRun,
      overwrite: runtimeDebugOptions.overwrite,
      singleToolAllRoles: runtimeDebugOptions.singleToolAllRoles,
      presetId: runtimeDebugOptions.presetId,
      repairScope: runtimeDebugOptions.fix ? 'safe_local' : 'manual_only',
      diagnosticSummary: diagnosticsSummary,
    });
    const checks: CliCommandResultCheck[] = [];

    if (!runtimeDebugOptions.adapters) {
      checks.push({
        id: 'adapters_flag',
        status: CliGovernanceCheckStatus.WARN,
        detail: '--adapters not set; verify still executed with adapters baseline by default',
      });
    }
    checks.push({
      id: CliCommandResultCheckId.ADAPTER_VERIFICATION,
      status: adapterVerification.overallStatus,
      detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
    });
    for (const roleEvaluation of adapterVerification.roleEvaluations) {
      checks.push({
        id: `role_${roleEvaluation.roleId}`,
        status: roleEvaluation.status,
        detail: context.adapterDiagnosticsRuntime.resolveRoleEvaluationDetail(roleEvaluation),
      });
    }
    checks.push({
      id: 'agent_projection',
      status: CliGovernanceCheckStatus.PASS,
      detail: `descriptors=${agentView.descriptors.length} execution_id=${verifyId}`,
    });
    this.emitProgress(context, {
      commandName: CliCommandName.VERIFY,
      statusLine: this.translate(context, 'cli.reactShell.progress.verify.writingArtifacts'),
      currentStepTitle: this.translate(context, 'cli.reactShell.progress.verify.writingArtifacts'),
      completedSteps: 1,
      row: {
        id: VERIFY_PROGRESS_ROW_ADAPTER_VERIFICATION,
        title: this.translate(context, 'cli.reactShell.progress.verify.verifyingAdapters'),
        status: this.resolveProgressStatus(adapterVerification.overallStatus),
        detail: `status=${adapterVerification.overallStatus} fallback_roles=${adapterVerification.fallbackRoleCount} degraded_roles=${adapterVerification.degradedRoleCount}`,
      },
    });
    this.emitProgress(context, {
      commandName: CliCommandName.VERIFY,
      row: {
        id: VERIFY_PROGRESS_ROW_DIAGNOSTICS,
        title: this.translate(context, 'cli.reactShell.progress.verify.writingArtifacts'),
        status: ExecutionProgressStatus.RUNNING,
        detail: diagnosticsArtifactPath,
      },
    });
    this.throwIfAborted(context);
    await context.artifactWriter.writeJsonArtifact(diagnosticsArtifactPath, {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      adapters: context.options.adaptersConfig,
      onboardingContract,
      matrix: matrixPayload,
      agentView,
      verification:
        context.adapterDiagnosticsRuntime.createAdapterVerificationArtifactPayload(
          adapterVerification,
        ),
      nextActions: adapterVerification.nextActions,
    });

    const artifacts: CliCommandResultArtifact[] = [
      {
        id: 'verify_diagnostics',
        path: diagnosticsArtifactPath,
      },
    ];
    const checkTotals = context.calculateCheckTotals(checks);
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: context.adapterDiagnosticsRuntime.createAdapterRoleProgressRows({
        verification: adapterVerification,
        stage: ExecutionProgressStage.VERIFY,
        diagnosticsPath: diagnosticsArtifactPath,
        executionId: verifyId,
      }),
      interactionPrompts: context.adapterDiagnosticsRuntime.createAdapterInteractionPrompts({
        verification: adapterVerification,
        stage: ExecutionProgressStage.VERIFY,
      }),
      layeredLogs: {
        summary: [
          `adapter_status=${adapterVerification.overallStatus}`,
          `required_roles=${adapterVerification.requiredRoleCount}`,
          `required_failures=${adapterVerification.requiredRoleFailedCount}`,
        ],
        detailed: [
          `fallback_roles=${adapterVerification.fallbackRoleCount}`,
          `degraded_roles=${adapterVerification.degradedRoleCount}`,
          `diagnostics_path=${diagnosticsArtifactPath}`,
        ],
      },
    });
    const message = `Verify completed with adapters_status=${adapterVerification.overallStatus}.`;

    if (adapterVerification.overallStatus === CliGovernanceCheckStatus.FAIL) {
      this.emitProgress(context, {
        commandName: CliCommandName.VERIFY,
        runState: 'failure',
        statusLine: this.translate(context, 'cli.reactShell.progress.verify.failed'),
        currentStepTitle: undefined,
        completedSteps: VERIFY_PROGRESS_TOTAL_STEPS,
        row: {
          id: VERIFY_PROGRESS_ROW_DIAGNOSTICS,
          title: this.translate(context, 'cli.reactShell.progress.verify.writingArtifacts'),
          status: ExecutionProgressStatus.COMPLETED,
          detail: diagnosticsArtifactPath,
        },
        artifact: {
          id: VERIFY_PROGRESS_ROW_DIAGNOSTICS,
          label: this.translate(context, 'cli.reactShell.progress.verify.writingArtifacts'),
          path: diagnosticsArtifactPath,
        },
        logLine: `adapter_status=${adapterVerification.overallStatus} required_failures=${adapterVerification.requiredRoleFailedCount}`,
      });
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
        `verify failed because required adapter roles are unavailable or capability gaps exist. diagnostics=${diagnosticsArtifactPath}`,
        {
          reportPath: diagnosticsArtifactPath,
          adapterStatus: adapterVerification.overallStatus,
          requiredRoleCount: adapterVerification.requiredRoleCount,
          requiredRoleFailedCount: adapterVerification.requiredRoleFailedCount,
          degradedRoleCount: adapterVerification.degradedRoleCount,
          fallbackRoleCount: adapterVerification.fallbackRoleCount,
          checkTotals,
        },
      );
    }

    this.emitProgress(context, {
      commandName: CliCommandName.VERIFY,
      runState: 'success',
      statusLine: this.translate(context, 'cli.reactShell.progress.verify.completed'),
      currentStepTitle: undefined,
      completedSteps: VERIFY_PROGRESS_TOTAL_STEPS,
      row: {
        id: VERIFY_PROGRESS_ROW_DIAGNOSTICS,
        title: this.translate(context, 'cli.reactShell.progress.verify.writingArtifacts'),
        status: ExecutionProgressStatus.COMPLETED,
        detail: diagnosticsArtifactPath,
      },
      artifact: {
        id: VERIFY_PROGRESS_ROW_DIAGNOSTICS,
        label: this.translate(context, 'cli.reactShell.progress.verify.writingArtifacts'),
        path: diagnosticsArtifactPath,
      },
      logLine: `adapter_status=${adapterVerification.overallStatus} required_failures=${adapterVerification.requiredRoleFailedCount}`,
    });

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_VERIFY,
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        experience,
        agentView,
        details: {
          adapters_status: adapterVerification.overallStatus,
          required_roles: adapterVerification.requiredRoleCount,
          required_role_failures: adapterVerification.requiredRoleFailedCount,
          degraded_roles: adapterVerification.degradedRoleCount,
          fallback_roles: adapterVerification.fallbackRoleCount,
          agent_descriptor_count: agentView.descriptors.length,
          diagnostics_path: diagnosticsArtifactPath,
        },
      },
    };
  }

  private translate(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate?.(key, interpolation) ?? key;
  }

  private emitProgress(
    context: Pick<CliCommandExecutorContext, 'progressSink'>,
    event: CliCommandProgressEvent,
  ): void {
    context.progressSink?.publish(event);
  }

  private resolveProgressStatus(status: CliGovernanceCheckStatus): ExecutionProgressStatus {
    if (status === CliGovernanceCheckStatus.PASS) {
      return ExecutionProgressStatus.COMPLETED;
    }

    if (status === CliGovernanceCheckStatus.WARN) {
      return ExecutionProgressStatus.WARNING;
    }

    return ExecutionProgressStatus.FAILED;
  }

  private throwIfAborted(
    context: Pick<CliCommandExecutorContext, 'abortSignal' | 'progressSink' | 'translate'>,
  ): void {
    if (!context.abortSignal?.aborted) {
      return;
    }

    this.emitProgress(context, {
      commandName: CliCommandName.VERIFY,
      runState: 'cancelled',
      cancelCapability: 'cancel_requested',
      statusLine: this.translate(context, 'cli.reactShell.progress.verify.cancelled'),
      currentStepTitle: undefined,
      logLine: this.translate(context, 'cli.reactShell.progress.verify.cancelled'),
    });
    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      this.translate(context, 'cli.reactShell.progress.verify.cancelled'),
      {
        command: CliCommandName.VERIFY,
      },
    );
  }
}
