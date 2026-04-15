import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  MemoryStoreEngine,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  HostVerificationStatus,
  type AdoptionPackVerificationCheck,
} from '@repo-ai-governor/standards';
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
import { CliAdoptionPackRuntime } from '../runtime/adoption-pack-runtime.js';
import type {
  CliAdapterSecretBackendStatus,
  CliAdapterVerificationResolution,
  CliCommandProgressEvent,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliInteractionPrompt,
  CliRoleStageProgress,
} from '../types/index.js';
import type { CliCommandExecutorContext } from '../types/interfaces/cli-governance-runtime.interface.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

const DOCTOR_PROGRESS_STEPS_BASELINE_ONLY = 2;
const DOCTOR_PROGRESS_STEPS_WITH_ADAPTERS = 3;
const DOCTOR_PROGRESS_ROW_WORKSPACE_BASELINE = 'workspace-baseline';
const DOCTOR_PROGRESS_ROW_ADAPTER_VERIFICATION = 'adapter-verification';
const DOCTOR_PROGRESS_ROW_DIAGNOSTICS = 'doctor-diagnostics';

/**
 * Owns `doctor` command execution outside the runtime facade.
 */
export class CliDoctorCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.DOCTOR;

  public constructor(
    private readonly adoptionPackRuntimeFactory: (
      currentWorkingDirectory: string,
      localizeText: (english: string, chinese: string) => string,
    ) => CliAdoptionPackRuntime = (currentWorkingDirectory, localizeText) =>
      new CliAdoptionPackRuntime(currentWorkingDirectory, localizeText),
  ) {}

  public async execute(context: CliCommandExecutorContext) {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    const adoptionPackRuntime = this.adoptionPackRuntimeFactory(
      context.options.currentWorkingDirectory,
      context.localizeText,
    );
    const durableStorageDiagnosticsRuntime = await this.createDurableStorageDiagnosticsRuntime();
    const totalSteps = runtimeDebugOptions.adapters
      ? DOCTOR_PROGRESS_STEPS_WITH_ADAPTERS
      : DOCTOR_PROGRESS_STEPS_BASELINE_ONLY;
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
    let verificationMatrix: ReturnType<
      CliCommandExecutorContext['onboardingRuntime']['createVerifyMatrixPayload']
    > | null = null;
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

    this.emitProgress(context, {
      commandName: CliCommandName.DOCTOR,
      runState: 'running',
      statusLine: this.translate(context, 'cli.reactShell.progress.doctor.starting'),
      currentStepTitle: this.translate(context, 'cli.reactShell.progress.doctor.workspaceChecks'),
      totalSteps,
      completedSteps: 0,
      cancelCapability: context.abortSignal ? 'supported' : 'none',
      row: {
        id: DOCTOR_PROGRESS_ROW_WORKSPACE_BASELINE,
        title: this.translate(context, 'cli.reactShell.progress.doctor.workspaceChecks'),
        status: ExecutionProgressStatus.RUNNING,
        detail: context.options.workspace.workspaceRoot,
      },
    });
    this.throwIfAborted(context);

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
    const doctorStatus = this.resolveDoctorBaselineStatus({
      workspaceRootExists,
      configExists,
      workspaceWritable,
      memoryRootExists,
    });
    this.emitProgress(context, {
      commandName: CliCommandName.DOCTOR,
      statusLine: runtimeDebugOptions.adapters
        ? this.translate(context, 'cli.reactShell.progress.doctor.verifyingAdapters')
        : this.translate(context, 'cli.reactShell.progress.doctor.writingArtifacts'),
      currentStepTitle: runtimeDebugOptions.adapters
        ? this.translate(context, 'cli.reactShell.progress.doctor.verifyingAdapters')
        : this.translate(context, 'cli.reactShell.progress.doctor.writingArtifacts'),
      completedSteps: 1,
      row: {
        id: DOCTOR_PROGRESS_ROW_WORKSPACE_BASELINE,
        title: this.translate(context, 'cli.reactShell.progress.doctor.workspaceChecks'),
        status: doctorStatus,
        detail: `workspace=${workspaceRootExists ? 'ready' : 'missing'} config=${configExists ? 'ready' : 'missing'} memory=${memoryRootExists ? 'ready' : 'missing'}`,
      },
    });
    if (runtimeDebugOptions.adapters) {
      this.emitProgress(context, {
        commandName: CliCommandName.DOCTOR,
        row: {
          id: DOCTOR_PROGRESS_ROW_ADAPTER_VERIFICATION,
          title: this.translate(context, 'cli.reactShell.progress.doctor.verifyingAdapters'),
          status: ExecutionProgressStatus.RUNNING,
        },
      });
    }
    if (!runtimeDebugOptions.adapters) {
      this.emitProgress(context, {
        commandName: CliCommandName.DOCTOR,
        row: {
          id: DOCTOR_PROGRESS_ROW_DIAGNOSTICS,
          title: this.translate(context, 'cli.reactShell.progress.doctor.writingArtifacts'),
          status: ExecutionProgressStatus.RUNNING,
          detail: doctorDiagnosticsArtifactPath,
        },
      });
    }
    this.throwIfAborted(context);
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
      checks.push({
        id: 'secret_backend_default',
        status: this.resolveSecretBackendDefaultCheckStatus(adapterVerification),
        detail: this.formatSecretBackendDefaultCheckDetail(adapterVerification),
      });
      for (const backendStatus of this.resolveSecretBackendDiagnostics(adapterVerification)
        .backends) {
        checks.push({
          id: `secret_backend_${backendStatus.backendId}`,
          status: this.resolveSecretBackendCheckStatus(backendStatus),
          detail: this.formatSecretBackendCheckDetail(backendStatus),
        });
      }
      if (adapterVerification.nextActions.length > 0) {
        nextActions.push(...adapterVerification.nextActions);
      }
      this.emitProgress(context, {
        commandName: CliCommandName.DOCTOR,
        statusLine: this.translate(context, 'cli.reactShell.progress.doctor.writingArtifacts'),
        currentStepTitle: this.translate(
          context,
          'cli.reactShell.progress.doctor.writingArtifacts',
        ),
        completedSteps: 2,
        row: {
          id: DOCTOR_PROGRESS_ROW_ADAPTER_VERIFICATION,
          title: this.translate(context, 'cli.reactShell.progress.doctor.verifyingAdapters'),
          status: this.resolveProgressStatus(adapterVerification.overallStatus),
          detail: `status=${adapterVerification.overallStatus} fallback_roles=${adapterVerification.fallbackRoleCount} degraded_roles=${adapterVerification.degradedRoleCount}`,
        },
      });
      this.emitProgress(context, {
        commandName: CliCommandName.DOCTOR,
        row: {
          id: DOCTOR_PROGRESS_ROW_DIAGNOSTICS,
          title: this.translate(context, 'cli.reactShell.progress.doctor.writingArtifacts'),
          status: ExecutionProgressStatus.RUNNING,
          detail: doctorDiagnosticsArtifactPath,
        },
      });
      this.throwIfAborted(context);
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
    if (adapterVerificationSnapshot && adapterStatus !== null) {
      const readinessSafeLocalFixCount = runtimeDebugOptions.fix ? safeLocalFixCount : undefined;
      onboardingContract = context.onboardingRuntime.createOnboardingContractPayload({
        commandName: 'doctor',
        executionId: doctorId,
        workspaceId: context.options.workspace.workspaceId,
        verificationStatus: adapterStatus,
        nextActions,
        enabledTools: context.onboardingRuntime.resolveSelectedTools({
          requestedTools: runtimeDebugOptions.requestedTools,
          currentAdaptersConfig: context.options.adaptersConfig,
        }),
        adaptersConfig: context.options.adaptersConfig,
        verification: adapterVerificationSnapshot,
        dryRun: runtimeDebugOptions.dryRun,
        overwrite: runtimeDebugOptions.overwrite,
        singleToolAllRoles: runtimeDebugOptions.singleToolAllRoles,
        presetId: runtimeDebugOptions.presetId,
        repairScope: runtimeDebugOptions.fix ? 'safe_local' : 'manual_only',
        safeLocalFixCount: readinessSafeLocalFixCount,
      });
      verificationMatrix = context.onboardingRuntime.createVerifyMatrixPayload({
        commandName: 'doctor',
        executionId: doctorId,
        verification: adapterVerificationSnapshot,
        adaptersConfig: context.options.adaptersConfig,
        nextActions,
        safeLocalFixCount: readinessSafeLocalFixCount,
      });
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
    const durableStorageDiagnostics = await durableStorageDiagnosticsRuntime.inspect({
      workspaceRoot: context.options.workspace.workspaceRoot,
      memoryStoreRoot:
        context.options.memoryStoreRoot ??
        resolve(context.options.workspace.workspaceRoot, 'context', 'memory', 'sqlite'),
      configuredStoreEngine:
        context.options.memoryConfig?.storeEngine ?? MemoryStoreEngine.SQLITE_FS,
      memoryStoreProviderName: context.options.memoryStoreProviderName ?? 'sqlite-fs',
    });
    const adoptionReadinessChecks = await adoptionPackRuntime.collectDoctorReadinessChecks();
    checks.push(...adoptionReadinessChecks.map((check) => this.toDoctorCheck(check)));
    checks.push(...durableStorageDiagnosticsRuntime.createChecks(durableStorageDiagnostics));
    this.throwIfAborted(context);
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
      ...(verificationMatrix ? { verificationMatrix } : {}),
      ...(agentView ? { agentView } : {}),
      durableStorage: durableStorageDiagnostics,
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
    this.emitProgress(context, {
      commandName: CliCommandName.DOCTOR,
      runState: 'success',
      statusLine: this.translate(context, 'cli.reactShell.progress.doctor.completed'),
      currentStepTitle: undefined,
      completedSteps: totalSteps,
      row: {
        id: DOCTOR_PROGRESS_ROW_DIAGNOSTICS,
        title: this.translate(context, 'cli.reactShell.progress.doctor.writingArtifacts'),
        status: ExecutionProgressStatus.COMPLETED,
        detail: doctorDiagnosticsArtifactPath,
      },
      artifact: {
        id: DOCTOR_PROGRESS_ROW_DIAGNOSTICS,
        label: this.translate(context, 'cli.reactShell.progress.doctor.writingArtifacts'),
        path: doctorDiagnosticsArtifactPath,
      },
      logLine: `attach_mode=${attachMode} adapters=${runtimeDebugOptions.adapters}`,
    });

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
          `durable_storage=${durableStorageDiagnosticsRuntime.resolveOverallStatus(durableStorageDiagnostics)}`,
        ],
        detailed: [
          `workspace_root=${context.options.workspace.workspaceRoot}`,
          `memory_root=${context.options.memoryStoreRoot}`,
          `next_actions=${nextActions.length}`,
          `artifact_registry_state=${durableStorageDiagnostics.artifactRegistryCanonicalTruth.state}`,
          `task_ledger_canonical_truth_state=${durableStorageDiagnostics.taskLedgerCanonicalTruth.state}`,
        ],
      },
    });
    const message = `Doctor completed with attach_mode=${attachMode}.`;
    const secretBackendDiagnostics = adapterVerificationSnapshot
      ? this.resolveSecretBackendDiagnostics(adapterVerificationSnapshot)
      : null;
    const credentialReferences = adapterVerificationSnapshot?.credentialReferences ?? [];
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
          secret_backend_default: secretBackendDiagnostics?.defaultBackendId ?? null,
          secret_backend_selected: secretBackendDiagnostics?.selectedBackendId ?? null,
          secret_backend_available_count:
            secretBackendDiagnostics?.backends.filter((backendStatus) => backendStatus.available)
              .length ?? 0,
          unresolved_credential_ref_count: credentialReferences.filter(
            (credentialReference) => !credentialReference.resolved,
          ).length,
          durable_storage_status:
            durableStorageDiagnosticsRuntime.resolveOverallStatus(durableStorageDiagnostics),
          artifact_registry_status: durableStorageDiagnostics.artifactRegistryCanonicalTruth.status,
          task_ledger_canonical_truth_status:
            durableStorageDiagnostics.taskLedgerCanonicalTruth.status,
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

  /**
   * Lazily resolves durable-storage diagnostics so CLI help avoids eager sqlite warnings.
   * @returns Constructed durable-storage diagnostics runtime.
   */
  private async createDurableStorageDiagnosticsRuntime() {
    // dynamic-import-allowed: doctor only needs sqlite diagnostics during actual command execution.
    const { CliDurableStorageDiagnosticsRuntime } = await import(
      '../runtime/durable-storage-diagnostics-runtime.js'
    );
    return new CliDurableStorageDiagnosticsRuntime();
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

  private toDoctorCheck(check: AdoptionPackVerificationCheck): CliCommandResultCheck {
    return {
      id: check.checkId,
      status: this.toCliCheckStatus(check.status),
      detail: check.detail,
    };
  }

  private toCliCheckStatus(
    status: AdoptionPackVerificationCheck['status'],
  ): CliGovernanceCheckStatus {
    switch (status) {
      case HostVerificationStatus.PASS:
        return CliGovernanceCheckStatus.PASS;
      case HostVerificationStatus.WARN:
        return CliGovernanceCheckStatus.WARN;
      case HostVerificationStatus.FAIL:
        return CliGovernanceCheckStatus.FAIL;
    }

    const exhaustiveStatus: never = status;
    return exhaustiveStatus;
  }

  private resolveDoctorBaselineStatus(options: {
    workspaceRootExists: boolean;
    configExists: boolean;
    workspaceWritable: boolean;
    memoryRootExists: boolean;
  }): ExecutionProgressStatus {
    if (!options.workspaceRootExists || !options.configExists) {
      return ExecutionProgressStatus.FAILED;
    }

    if (options.workspaceWritable && options.memoryRootExists) {
      return ExecutionProgressStatus.COMPLETED;
    }

    return ExecutionProgressStatus.WARNING;
  }

  private resolveSecretBackendDefaultCheckStatus(
    verification: CliAdapterVerificationResolution,
  ): CliGovernanceCheckStatus {
    const secretBackends = this.resolveSecretBackendDiagnostics(verification);
    const defaultBackendId = secretBackends.defaultBackendId;
    if (!defaultBackendId) {
      return CliGovernanceCheckStatus.WARN;
    }

    const defaultBackendStatus = secretBackends.backends.find(
      (backendStatus) => backendStatus.backendId === defaultBackendId,
    );
    return this.resolveSecretBackendCheckStatus(defaultBackendStatus);
  }

  private resolveSecretBackendCheckStatus(
    backendStatus?: CliAdapterSecretBackendStatus,
  ): CliGovernanceCheckStatus {
    return backendStatus?.available && !backendStatus.warning?.trim().length
      ? CliGovernanceCheckStatus.PASS
      : CliGovernanceCheckStatus.WARN;
  }

  private formatSecretBackendDefaultCheckDetail(
    verification: CliAdapterVerificationResolution,
  ): string {
    const secretBackends = this.resolveSecretBackendDiagnostics(verification);
    const defaultBackendId = secretBackends.defaultBackendId;
    if (!defaultBackendId) {
      return secretBackends.selectedBackendId ?? 'none';
    }

    const defaultBackendStatus = secretBackends.backends.find(
      (backendStatus) => backendStatus.backendId === defaultBackendId,
    );
    if (!defaultBackendStatus) {
      return defaultBackendId;
    }

    return `${defaultBackendId}: ${this.formatSecretBackendCheckDetail(defaultBackendStatus)}`;
  }

  private formatSecretBackendCheckDetail(backendStatus: CliAdapterSecretBackendStatus): string {
    if (!backendStatus.warning?.trim().length) {
      return backendStatus.detail;
    }

    return `${backendStatus.detail}; warning=${backendStatus.warning}`;
  }

  private resolveSecretBackendDiagnostics(verification: CliAdapterVerificationResolution): {
    selectedBackendId: string | null;
    defaultBackendId: string | null;
    backends: CliAdapterSecretBackendStatus[];
  } {
    return {
      selectedBackendId: verification.secretBackends?.selectedBackendId ?? null,
      defaultBackendId: verification.secretBackends?.defaultBackendId ?? null,
      backends: verification.secretBackends?.backends ?? [],
    };
  }

  private throwIfAborted(
    context: Pick<CliCommandExecutorContext, 'abortSignal' | 'progressSink' | 'translate'>,
  ): void {
    if (!context.abortSignal?.aborted) {
      return;
    }

    this.emitProgress(context, {
      commandName: CliCommandName.DOCTOR,
      runState: 'cancelled',
      cancelCapability: 'cancel_requested',
      statusLine: this.translate(context, 'cli.reactShell.progress.doctor.cancelled'),
      currentStepTitle: undefined,
      logLine: this.translate(context, 'cli.reactShell.progress.doctor.cancelled'),
    });
    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
      this.translate(context, 'cli.reactShell.progress.doctor.cancelled'),
      {
        command: CliCommandName.DOCTOR,
      },
    );
  }
}
