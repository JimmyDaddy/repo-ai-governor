import {
  AgentAvailabilityStatus,
  type AgentLayeredHealthCheckResult,
} from '@repo-ai-governor/adapter-sdk';
import { ExecutionInteractionCategory, ExecutionProgressStatus } from '@repo-ai-governor/shared';
import type { ExecutionProgressStage } from '@repo-ai-governor/shared';
import { CliGovernanceCheckStatus } from '../constants/cli-governance-runtime.constant.js';
import type {
  CliAdapterRoleEvaluation,
  CliAdapterToolProbeSnapshot,
  CliAdapterVerificationResolution,
  CliInteractionPrompt,
  CliRoleStageProgress,
} from '../types/index.js';
import { CliLaunchDiagnosticsProjectionRuntime } from './cli-launch-diagnostics-projection-runtime.js';

/**
 * Owns CLI-local adapter diagnostics shaping so payload/progress/prompt builders stay outside the facade.
 */
export class CliAdapterDiagnosticsRuntime {
  private readonly launchDiagnosticsProjectionRuntime: CliLaunchDiagnosticsProjectionRuntime;

  public constructor(
    private readonly translate: (key: string, interpolation?: Record<string, string>) => string,
    private readonly createFailureAttributionSummary: (
      verification: CliAdapterVerificationResolution,
    ) => Record<string, number>,
    launchDiagnosticsProjectionRuntime = new CliLaunchDiagnosticsProjectionRuntime(),
  ) {
    this.launchDiagnosticsProjectionRuntime = launchDiagnosticsProjectionRuntime;
  }

  /**
   * Resolves adapter tool-level check status from one probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Check status used by doctor output.
   */
  public resolveToolProbeCheckStatus(
    snapshot: CliAdapterToolProbeSnapshot,
  ): CliGovernanceCheckStatus {
    if (!snapshot.enabled) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.DEGRADED) {
      return CliGovernanceCheckStatus.WARN;
    }
    return CliGovernanceCheckStatus.PASS;
  }

  /**
   * Resolves adapter tool-level human-readable detail text from one probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Human-readable detail text.
   */
  public resolveToolProbeCheckDetail(snapshot: CliAdapterToolProbeSnapshot): string {
    if (!snapshot.enabled) {
      return this.translate('cli.adapterDiagnostics.disabledByConfig');
    }

    const readableReasons =
      snapshot.unavailableReasons.length > 0
        ? this.humanizeToolUnavailableReasons(snapshot.unavailableReasons)
        : ['none'];
    const attributionLabel = this.translate('cli.adapterDiagnostics.attribution');
    const availabilityLabel = this.translate('cli.adapterDiagnostics.availability');
    const reasonsLabel = this.translate('cli.adapterDiagnostics.reasons');
    const livenessFootnote = this.formatHealthCheckDiagnosticFootnote(snapshot.healthCheck);
    return [
      `${availabilityLabel}=${snapshot.availabilityStatus} ${attributionLabel}=${snapshot.failureAttributions.join('|') || 'none'} ${reasonsLabel}=${readableReasons.join(' | ')}`,
      livenessFootnote,
    ]
      .filter((part) => part.length > 0)
      .join(' ');
  }

  /**
   * Defines explicit safe_local doctor-fix boundary for operator-facing diagnostics.
   * @param fixEnabled Whether `--fix` is enabled in the current doctor invocation.
   * @returns JSON-serializable safe_local boundary payload.
   */
  public createSafeLocalBoundaryArtifactPayload(fixEnabled: boolean): Record<string, unknown> {
    return {
      mode: 'safe_local_only',
      fixEnabled,
      allowedWrites: [
        'workspace_root_directory',
        'workspace_config_template',
        'memory_store_root_directory',
      ],
      blockedMutations: [
        'adapter_credentials',
        'adapter_login_state',
        'local_model_endpoint',
        'local_model_model_pull',
        'remote_provider_installation',
      ],
    };
  }

  /**
   * Converts adapter verification resolution into one JSON-serializable artifact payload.
   * @param verification Adapter verification resolution.
   * @returns Artifact payload.
   */
  public createAdapterVerificationArtifactPayload(
    verification: CliAdapterVerificationResolution,
  ): Record<string, unknown> {
    const toolSnapshotBySurface = new Map(verification.tools.map((tool) => [tool.toolId, tool]));

    return {
      overallStatus: verification.overallStatus,
      requiredRoleCount: verification.requiredRoleCount,
      requiredRoleFailedCount: verification.requiredRoleFailedCount,
      degradedRoleCount: verification.degradedRoleCount,
      fallbackRoleCount: verification.fallbackRoleCount,
      failureAttributionSummary: this.createFailureAttributionSummary(verification),
      nextActions: [...verification.nextActions],
      secretBackends: verification.secretBackends,
      credentialReferences: verification.credentialReferences,
      tools: verification.tools.map((tool) => {
        const launchDiagnostics =
          this.launchDiagnosticsProjectionRuntime.createLaunchDiagnosticsPayload({
            transportKind: tool.healthCheck?.transportKind ?? null,
            healthCheck: tool.healthCheck,
          });

        return {
          toolId: tool.toolId,
          enabled: tool.enabled,
          configuredAvailability: tool.configuredAvailability,
          availabilityStatus: tool.availabilityStatus,
          unavailableReasons: tool.unavailableReasons,
          healthCheck: tool.healthCheck,
          failureAttributions: tool.failureAttributions,
          capabilitySupportByCapability: Object.fromEntries(
            tool.capabilitySupportByCapability.entries(),
          ),
          ...(launchDiagnostics ? { launch_diagnostics: launchDiagnostics } : {}),
        };
      }),
      roles: verification.roleEvaluations.map((role) => {
        const resolvedSurface = role.selectedSurface ?? role.primarySurface;
        const roleToolHealthCheck =
          toolSnapshotBySurface.get(resolvedSurface)?.healthCheck ?? role.healthCheck;
        const launchDiagnostics =
          this.launchDiagnosticsProjectionRuntime.createLaunchDiagnosticsPayload({
            transportKind: roleToolHealthCheck?.transportKind ?? null,
            healthCheck: roleToolHealthCheck,
          });

        return {
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          required: role.required,
          primarySurface: role.primarySurface,
          selectedSurface: role.selectedSurface,
          selectedBy: role.selectedBy,
          unsupportedCapabilities: role.unsupportedCapabilities,
          degradedCapabilities: role.degradedCapabilities,
          unavailableReasons: role.unavailableReasons,
          healthCheck: role.healthCheck,
          failureAttributions: role.failureAttributions,
          status: role.status,
          ...(launchDiagnostics ? { launch_diagnostics: launchDiagnostics } : {}),
        };
      }),
    };
  }

  /**
   * Converts adapter role evaluations into role/stage progress rows.
   * @param options Stage context and adapter verification snapshot.
   * @returns Role progress rows for command experience output.
   */
  public createAdapterRoleProgressRows(options: {
    verification: CliAdapterVerificationResolution;
    stage: ExecutionProgressStage;
    diagnosticsPath: string;
    executionId: string;
  }): CliRoleStageProgress[] {
    return options.verification.roleEvaluations.map((roleEvaluation) => ({
      roleId: roleEvaluation.roleId,
      stage: options.stage,
      status: this.resolveProgressStatusFromCheck(roleEvaluation.status),
      category:
        roleEvaluation.status === CliGovernanceCheckStatus.FAIL
          ? ExecutionInteractionCategory.RUNTIME_FAILURE
          : ExecutionInteractionCategory.NONE,
      summary: `Role ${roleEvaluation.roleId} routed via ${roleEvaluation.selectedSurface ?? 'none'} (${roleEvaluation.selectedBy}).`,
      detail: this.formatRoleEvaluationDetail(roleEvaluation),
      backlink: {
        executionId: options.executionId,
        stageId: options.stage,
        artifactPath: options.diagnosticsPath,
      },
    }));
  }

  /**
   * Builds adapter follow-up prompts from verification diagnostics.
   * @param options Adapter verification context.
   * @returns Ordered interaction prompts.
   */
  public createAdapterInteractionPrompts(options: {
    verification: CliAdapterVerificationResolution;
    stage: ExecutionProgressStage;
  }): CliInteractionPrompt[] {
    return options.verification.nextActions.map((nextAction) => ({
      category:
        options.verification.overallStatus === CliGovernanceCheckStatus.FAIL
          ? ExecutionInteractionCategory.RUNTIME_FAILURE
          : ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
      stage: options.stage,
      title:
        options.verification.overallStatus === CliGovernanceCheckStatus.FAIL
          ? this.translate('cli.adapterDiagnostics.routeBlocked')
          : this.translate('cli.adapterDiagnostics.routeAttention'),
      action: nextAction,
      blocking: options.verification.overallStatus === CliGovernanceCheckStatus.FAIL,
    }));
  }

  /**
   * Resolves role-level detail text from one adapter role evaluation.
   * @param roleEvaluation One role evaluation row.
   * @returns Human-readable detail text.
   */
  public resolveRoleEvaluationDetail(roleEvaluation: CliAdapterRoleEvaluation): string {
    return this.formatRoleEvaluationDetail(roleEvaluation);
  }

  /**
   * Maps command check status to normalized progress status.
   * @param status Command check status.
   * @returns Progress status consumed by output experience payload.
   */
  private resolveProgressStatusFromCheck(
    status: CliGovernanceCheckStatus,
  ): ExecutionProgressStatus {
    if (status === CliGovernanceCheckStatus.PASS) {
      return ExecutionProgressStatus.COMPLETED;
    }
    if (status === CliGovernanceCheckStatus.WARN) {
      return ExecutionProgressStatus.WARNING;
    }
    return ExecutionProgressStatus.FAILED;
  }

  /**
   * Resolves role-level detail text from one adapter role evaluation.
   * @param roleEvaluation One role evaluation row.
   * @returns Human-readable detail text.
   */
  private formatRoleEvaluationDetail(roleEvaluation: CliAdapterRoleEvaluation): string {
    const unsupported =
      roleEvaluation.unsupportedCapabilities.length > 0
        ? roleEvaluation.unsupportedCapabilities.join('|')
        : 'none';
    const degraded =
      roleEvaluation.degradedCapabilities.length > 0
        ? roleEvaluation.degradedCapabilities.join('|')
        : 'none';
    const unavailableReasons =
      roleEvaluation.unavailableReasons.length > 0
        ? roleEvaluation.unavailableReasons.join('|')
        : 'none';
    const failureAttributions =
      roleEvaluation.failureAttributions.length > 0
        ? roleEvaluation.failureAttributions.join('|')
        : 'none';
    const livenessFootnote = this.formatHealthCheckDiagnosticFootnote(roleEvaluation.healthCheck);
    return [
      `required=${roleEvaluation.required} selected=${roleEvaluation.selectedSurface ?? 'none'} selected_by=${roleEvaluation.selectedBy} unsupported=${unsupported} degraded=${degraded} attribution=${failureAttributions} reasons=${unavailableReasons}`,
      livenessFootnote,
    ]
      .filter((part) => part.length > 0)
      .join(' ');
  }

  private formatHealthCheckDiagnosticFootnote(healthCheck?: AgentLayeredHealthCheckResult): string {
    if (!healthCheck) {
      return '';
    }

    const reasonCodes =
      healthCheck.reasonCodes.length > 0 ? healthCheck.reasonCodes.join('|') : 'none';
    return [
      healthCheck.transportKind ? `transport=${healthCheck.transportKind}` : '',
      healthCheck.providerKind ? `provider=${healthCheck.providerKind}` : '',
      healthCheck.vendorBindingKind ? `vendor_binding=${healthCheck.vendorBindingKind}` : '',
      healthCheck.model ? `model=${healthCheck.model}` : '',
      `cancel=${healthCheck.requestCancellationMode}`,
      `route=${healthCheck.routeKey}`,
      `reason_codes=${reasonCodes}`,
    ]
      .filter((part) => part.length > 0)
      .join(' ');
  }

  /**
   * Converts machine-readable unavailable reasons into human-friendly diagnostics text.
   * @param reasons Raw unavailable reasons.
   * @returns Human-friendly reason lines.
   */
  private humanizeToolUnavailableReasons(reasons: string[]): string[] {
    return reasons.map((reason) => this.humanizeToolUnavailableReason(reason));
  }

  /**
   * Converts one unavailable reason code into human-friendly diagnostics text.
   * @param reason Raw unavailable reason.
   * @returns Human-friendly reason line.
   */
  private humanizeToolUnavailableReason(reason: string): string {
    if (reason.startsWith('command_missing:')) {
      const [, surface, command] = reason.split(':', 3);
      return this.translate('cli.adapterDiagnostics.commandMissing', { surface, command });
    }

    if (reason.startsWith('command_probe_failed:')) {
      const [, surface, command, ...detailParts] = reason.split(':');
      const detail = detailParts.join(':');
      return this.translate('cli.adapterDiagnostics.commandProbeFailed', {
        surface,
        command,
        detail,
      });
    }

    if (reason.startsWith('probe_failed:')) {
      const [, ...detailParts] = reason.split(':');
      const detail = detailParts.join(':');
      return this.translate('cli.adapterDiagnostics.probeFailed', { detail });
    }

    if (reason.startsWith('credential_missing:')) {
      const [, surface] = reason.split(':', 2);
      return this.translate('cli.adapterDiagnostics.credentialMissing', { surface });
    }

    if (reason.startsWith('health_check_timeout:')) {
      const [, surface] = reason.split(':', 2);
      return this.translate('cli.adapterDiagnostics.healthCheckTimeout', { surface });
    }

    if (reason.startsWith('health_check_invalid_response:')) {
      const [, surface, ...detailParts] = reason.split(':');
      const detail = detailParts.join(':');
      return this.translate('cli.adapterDiagnostics.healthCheckInvalidResponse', {
        surface,
        detail,
      });
    }

    if (reason.startsWith('health_check_failed:')) {
      const [, surface, ...detailParts] = reason.split(':');
      const detail = detailParts.join(':');
      if (detail === 'rate_limited') {
        return this.translate('cli.adapterDiagnostics.healthCheckFailedRateLimited', { surface });
      }
      if (detail === 'quota_exhausted') {
        return this.translate('cli.adapterDiagnostics.healthCheckFailedQuotaExhausted', {
          surface,
        });
      }
      return this.translate('cli.adapterDiagnostics.healthCheckFailed', { surface, detail });
    }

    if (reason.startsWith('local_model_model_missing:')) {
      const [, surface, ...modelParts] = reason.split(':');
      const model = modelParts.join(':');
      return this.translate('cli.adapterDiagnostics.localModelModelMissing', { surface, model });
    }

    if (reason.startsWith('local_model_config_missing:')) {
      const [, surface, missingKeys] = reason.split(':', 3);
      return this.translate('cli.adapterDiagnostics.localModelConfigMissing', {
        surface,
        missingKeys,
      });
    }

    if (reason.startsWith('local_model_endpoint_unreachable:')) {
      const [, surface, encodedEndpoint, errorCode, ...messageParts] = reason.split(':');
      const endpoint = decodeURIComponent(encodedEndpoint ?? '');
      const message = messageParts.join(':');
      return this.translate('cli.adapterDiagnostics.localModelEndpointUnreachable', {
        surface,
        endpoint,
        errorCode,
        message,
      });
    }

    if (reason.startsWith('local_model_probe_invalid_response:')) {
      const [, surface, encodedEndpoint] = reason.split(':');
      const endpoint = decodeURIComponent(encodedEndpoint ?? '');
      return this.translate('cli.adapterDiagnostics.localModelProbeInvalidResponse', {
        surface,
        endpoint,
      });
    }

    if (reason.startsWith('disabled_by_config:')) {
      const [, surface] = reason.split(':', 2);
      return this.translate('cli.adapterDiagnostics.disabledByConfigForSurface', { surface });
    }

    return reason;
  }
}
