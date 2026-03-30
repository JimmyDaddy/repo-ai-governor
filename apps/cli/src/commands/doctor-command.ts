import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
} from '@repo-ai-governor/shared';
import {
  CLI_ADAPTER_TOOL_CHECK_ID_PREFIX,
  CliCommandResultCheckId,
} from '../constants/cli-command-result-check.constant.js';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_BASELINE_DOC_PATHS,
  CLI_DOCTOR_ATTACH_MODE,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from '../constants/cli-governance-runtime.constant.js';
import type {
  CliAdapterVerificationResolution,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliInteractionPrompt,
  CliRoleStageProgress,
} from '../types/index.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

/**
 * Owns `doctor` command execution outside the runtime facade.
 */
export class CliDoctorCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.DOCTOR;

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const checks: CliCommandResultCheck[] = [];
    const artifacts: CliCommandResultArtifact[] = [];
    const nextActions: string[] = [];
    let safeLocalFixCount = 0;
    let agentView:
      | ReturnType<CliCommandExecutorContext['agentProjectionRuntime']['createCliAgentView']>
      | undefined;
    let onboardingContract: ReturnType<
      CliCommandExecutorContext['onboardingRuntime']['createOnboardingContractPayload']
    > | null = null;

    let workspaceRootExists = existsSync(context.options.workspace.workspaceRoot);
    if (!workspaceRootExists && runtimeDebugOptions.fix) {
      await mkdir(context.options.workspace.workspaceRoot, { recursive: true });
      workspaceRootExists = true;
      safeLocalFixCount += 1;
    }
    checks.push({
      id: 'workspace_root_exists',
      status: workspaceRootExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.FAIL,
      detail: workspaceRootExists
        ? context.options.workspace.workspaceRoot
        : `missing=${context.options.workspace.workspaceRoot}`,
    });

    const workspaceWritable = await context.canWritePath(context.options.workspace.workspaceRoot);
    checks.push({
      id: 'workspace_write_access',
      status: workspaceWritable ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail: workspaceWritable ? 'writeable' : 'read_only_attach_mode_enabled',
    });
    const attachMode = workspaceWritable
      ? CLI_DOCTOR_ATTACH_MODE.READ_WRITE
      : CLI_DOCTOR_ATTACH_MODE.READ_ONLY;

    let configExists = existsSync(context.options.workspace.configPath);
    if (!configExists && runtimeDebugOptions.fix) {
      await context.artifactWriter.writeTextArtifact(
        context.options.workspace.configPath,
        context.buildDefaultConfigContent(),
      );
      configExists = true;
      safeLocalFixCount += 1;
    }
    checks.push({
      id: 'workspace_config_exists',
      status: configExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail: configExists ? context.options.workspace.configPath : 'missing; run `init` first',
    });

    const docs = CLI_BASELINE_DOC_PATHS.map((relativePath) => ({
      relativePath,
      exists: existsSync(resolve(context.options.currentWorkingDirectory, relativePath)),
    }));
    const missingDocCount = docs.filter((item) => !item.exists).length;
    checks.push({
      id: 'baseline_docs',
      status: missingDocCount === 0 ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail:
        missingDocCount === 0
          ? `all_found=${docs.length}`
          : `missing=${missingDocCount}/${docs.length}`,
    });

    let memoryRootExists = existsSync(context.options.memoryStoreRoot);
    if (!memoryRootExists && runtimeDebugOptions.fix) {
      await mkdir(context.options.memoryStoreRoot, { recursive: true });
      memoryRootExists = true;
      safeLocalFixCount += 1;
    }
    checks.push({
      id: 'memory_store_root',
      status: memoryRootExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail: memoryRootExists
        ? context.options.memoryStoreRoot
        : `missing=${context.options.memoryStoreRoot}`,
    });

    let adapterStatus: CliGovernanceCheckStatus | null = null;
    let adapterVerificationSnapshot: CliAdapterVerificationResolution | null = null;
    const doctorId = `doctor-${Date.now()}`;
    const doctorDiagnosticsArtifactPath = resolve(
      context.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'doctor',
      `${doctorId}.json`,
    );
    if (runtimeDebugOptions.adapters) {
      const adapterVerification = await context.resolveAdapterVerification(context.abortSignal);
      adapterVerificationSnapshot = adapterVerification;
      adapterStatus = adapterVerification.overallStatus;
      agentView = context.agentProjectionRuntime.createCliAgentView({
        descriptors: context.agentProjectionRuntime.createDescriptorsFromRoleEvaluations({
          adaptersConfig: context.options.adaptersConfig,
          verification: adapterVerification,
          workspace: context.options.workspace,
          executionId: doctorId,
        }),
      });
      checks.push({
        id: CliCommandResultCheckId.ADAPTER_VERIFICATION,
        status: adapterStatus,
        detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
      });
      for (const toolSnapshot of adapterVerification.tools) {
        checks.push({
          id: `${CLI_ADAPTER_TOOL_CHECK_ID_PREFIX}${toolSnapshot.toolId}`,
          status: context.adapterDiagnosticsRuntime.resolveToolProbeCheckStatus(toolSnapshot),
          detail: context.adapterDiagnosticsRuntime.resolveToolProbeCheckDetail(toolSnapshot),
        });
      }
      if (adapterVerification.nextActions.length > 0) {
        nextActions.push(...adapterVerification.nextActions);
      }
      onboardingContract = context.onboardingRuntime.createOnboardingContractPayload({
        commandName: 'doctor',
        executionId: doctorId,
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
        diagnosticSummary: `status=${adapterVerification.overallStatus} safe_local_fix=${safeLocalFixCount}`,
      });
    }

    if (runtimeDebugOptions.fix) {
      checks.push({
        id: 'safe_local_fix',
        status:
          safeLocalFixCount > 0 ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
        detail:
          safeLocalFixCount > 0 ? `applied=${safeLocalFixCount}` : 'no_safe_local_changes_applied',
      });
      nextActions.push(
        context.translate?.('cli.commandMessages.doctor.safeLocalFixHint') ??
          'safe_local fix only creates writable workspace/config/memory baseline paths; it never installs commands, logs in adapters, or pulls local models.',
      );
    }
    if (nextActions.length > 0) {
      checks.push({
        id: 'next_action_hint',
        status: CliGovernanceCheckStatus.WARN,
        detail: nextActions[0] ?? 'review adapter diagnostics for next action',
      });
    }
    if (agentView) {
      checks.push({
        id: 'agent_projection',
        status: CliGovernanceCheckStatus.PASS,
        detail: `descriptors=${agentView.descriptors.length} repair_scope=${runtimeDebugOptions.fix ? 'safe_local' : 'manual_only'}`,
      });
    }
    await context.artifactWriter.writeJsonArtifact(doctorDiagnosticsArtifactPath, {
      generatedAt: context.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: context.options.workspace.workspaceId,
        workspaceRoot: context.options.workspace.workspaceRoot,
        workspaceMode: context.options.workspace.mode,
      },
      attachMode,
      options: {
        adapters: runtimeDebugOptions.adapters,
        fix: runtimeDebugOptions.fix,
      },
      safeLocalBoundary: context.adapterDiagnosticsRuntime.createSafeLocalBoundaryArtifactPayload(
        runtimeDebugOptions.fix,
      ),
      ...(onboardingContract ? { onboardingContract } : {}),
      ...(agentView ? { agentView } : {}),
      checks,
      ...(adapterVerificationSnapshot
        ? {
            verification:
              context.adapterDiagnosticsRuntime.createAdapterVerificationArtifactPayload(
                adapterVerificationSnapshot,
              ),
          }
        : {}),
      nextActions,
    });
    artifacts.push({
      id: 'doctor_diagnostics',
      path: doctorDiagnosticsArtifactPath,
    });

    const doctorStatus =
      !workspaceRootExists || !configExists
        ? ExecutionProgressStatus.FAILED
        : workspaceWritable && memoryRootExists
          ? ExecutionProgressStatus.COMPLETED
          : ExecutionProgressStatus.WARNING;
    const roleProgress: CliRoleStageProgress[] = [
      {
        roleId: 'workspace',
        stage: ExecutionProgressStage.DOCTOR,
        status: doctorStatus,
        category:
          doctorStatus === ExecutionProgressStatus.FAILED
            ? ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION
            : ExecutionInteractionCategory.NONE,
        summary: `Attach mode resolved as ${attachMode}.`,
        detail: `workspace_root_exists=${workspaceRootExists} writable=${workspaceWritable} config_exists=${configExists} memory_root_exists=${memoryRootExists}`,
        backlink: {
          stageId: ExecutionProgressStage.DOCTOR,
          executionId: doctorId,
        },
      },
    ];
    if (adapterVerificationSnapshot) {
      roleProgress.push(
        ...context.adapterDiagnosticsRuntime.createAdapterRoleProgressRows({
          verification: adapterVerificationSnapshot,
          stage: ExecutionProgressStage.VERIFY,
          diagnosticsPath: doctorDiagnosticsArtifactPath,
          executionId: doctorId,
        }),
      );
    }
    const interactionPrompts: CliInteractionPrompt[] = [];
    if (attachMode === CLI_DOCTOR_ATTACH_MODE.READ_ONLY) {
      interactionPrompts.push({
        category: ExecutionInteractionCategory.PERMISSION_CONFIRMATION,
        stage: ExecutionProgressStage.DOCTOR,
        title: 'Workspace is read-only',
        action: 'Switch to writable attach mode if you need to create/update governance artifacts.',
        blocking: false,
      });
    }
    if (adapterVerificationSnapshot) {
      interactionPrompts.push(
        ...context.adapterDiagnosticsRuntime.createAdapterInteractionPrompts({
          verification: adapterVerificationSnapshot,
          stage: ExecutionProgressStage.VERIFY,
        }),
      );
    }
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress,
      interactionPrompts,
      layeredLogs: {
        summary: [
          `attach_mode=${attachMode}`,
          `adapter_probe=${runtimeDebugOptions.adapters}`,
          `safe_local_fix_applied=${safeLocalFixCount}`,
        ],
        detailed: [
          `workspace_root=${context.options.workspace.workspaceRoot}`,
          `memory_root=${context.options.memoryStoreRoot}`,
          `next_actions=${nextActions.length}`,
        ],
      },
    });
    const message = `Doctor completed with attach_mode=${attachMode}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ENV_DOCTOR,
        summary: message,
        attach_mode: attachMode,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        ...(artifacts.length > 0 ? { artifacts } : {}),
        experience,
        ...(agentView ? { agentView } : {}),
        details: {
          config_source: context.options.configSource,
          profile: context.options.profileId ?? 'none',
          memory_store_provider: context.options.memoryStoreProviderName,
          adapters_enabled: runtimeDebugOptions.adapters,
          safe_local_fix_applied: safeLocalFixCount,
          repair_scope: runtimeDebugOptions.fix ? 'safe_local' : 'manual_only',
          adapter_status: adapterStatus,
        },
      },
    };
  }
}
