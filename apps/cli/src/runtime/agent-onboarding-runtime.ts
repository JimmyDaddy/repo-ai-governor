import {
  AgentAvailabilityStatus,
  DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig, GovernorConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterCredentialSource,
  AdapterEndpointSource,
  AdapterProviderKind,
  type AdapterRemoteApiConfig,
  AdapterSurface,
  AdapterTransportKind,
  AdapterTransportSelectionSource,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../constants/cli-acp-host.constant.js';
import {
  CLI_AGENT_ONBOARDING_SCHEMA_VERSION,
  CliAgentOnboardingPreset,
} from '../constants/cli-agent-onboarding.constant.js';
import {
  CLI_CONNECT_SUPPORTED_TRANSPORTS_BY_SURFACE,
  CLI_CONNECT_TRANSPORT_AUTHORING_SURFACES,
} from '../constants/cli-connect.constant.js';
import { CliGovernanceCheckStatus } from '../constants/cli-governance-runtime.constant.js';
import type {
  CliConnectRemoteApiOverride,
  CliConnectRoleBindingOverride,
  CliConnectToolTransportOverride,
} from '../types/interfaces/cli-runtime-debug.interface.js';
import type { CliAdapterVerificationResolution } from '../types/interfaces/index.js';
import { CliAcpHostCompanionRuntime } from './cli-acp-host-companion-runtime.js';
import { CliLaunchDiagnosticsProjectionRuntime } from './cli-launch-diagnostics-projection-runtime.js';
import { CliRemoteApiAuthoringDefaultsService } from './cli-remote-api-authoring-defaults-service.js';

const MINIMAL_ROLE_IDS = new Set(['planner', 'coder', 'reviewer']);
const CLI_EXEC_DEFAULT_REQUEST_TIMEOUT_MS = 30000;

/**
 * Owns connect/doctor onboarding template shaping and report-friendly matrix payloads.
 */
export class CliAgentOnboardingRuntime {
  private readonly remoteApiAuthoringDefaultsService = new CliRemoteApiAuthoringDefaultsService();
  private readonly launchDiagnosticsProjectionRuntime = new CliLaunchDiagnosticsProjectionRuntime();
  private readonly acpHostCompanionRuntime = new CliAcpHostCompanionRuntime();

  public resolveSelectedTools(options: {
    requestedTools: AdapterSurface[];
    currentAdaptersConfig: AdaptersConfig;
  }): AdapterSurface[] {
    const requestedTools = options.requestedTools.filter(Boolean);
    if (requestedTools.length > 0) {
      return this.dedupeSurfaces(requestedTools);
    }

    const enabledTools = (options.currentAdaptersConfig.tools ?? [])
      .filter((tool) => tool.enabled !== false)
      .map((tool) => tool.toolId);
    if (enabledTools.length > 0) {
      return this.dedupeSurfaces(enabledTools);
    }

    return [AdapterSurface.CODEX, AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT];
  }

  public buildConnectCandidateConfig(options: {
    sourceConfig: GovernorConfig;
    presetId: CliAgentOnboardingPreset;
    requestedTools: AdapterSurface[];
    toolTransportOverrides: CliConnectToolTransportOverride[];
    remoteApiOverrides: CliConnectRemoteApiOverride[];
    localizeText?: (english: string, chinese: string) => string;
    overwrite: boolean;
    singleToolAllRoles: boolean;
    roleBindingOverrides: CliConnectRoleBindingOverride[];
  }): {
    candidateConfig: GovernorConfig;
    selectedTools: AdapterSurface[];
    candidateAdaptersConfig: AdaptersConfig;
  } {
    const sourceConfig = structuredClone(options.sourceConfig);
    const currentAdaptersConfig = sourceConfig.adapters;
    if (!currentAdaptersConfig) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        'connect requires adapters baseline in source config.',
      );
    }

    const selectedTools = this.resolveSelectedTools({
      requestedTools: options.requestedTools,
      currentAdaptersConfig,
    });
    this.assertSelectedToolsContainTransportOverrides({
      selectedTools,
      toolTransportOverrides: options.toolTransportOverrides,
      localizeText: options.localizeText,
    });
    this.assertSelectedToolsContainRemoteApiOverrides({
      selectedTools,
      remoteApiOverrides: options.remoteApiOverrides,
      localizeText: options.localizeText,
    });
    const candidateAdaptersConfig = this.buildCandidateAdaptersConfig({
      currentAdaptersConfig,
      presetId: options.presetId,
      selectedTools,
      toolTransportOverrides: options.toolTransportOverrides,
      remoteApiOverrides: options.remoteApiOverrides,
      localizeText: options.localizeText,
      overwrite: options.overwrite,
      singleToolAllRoles: options.singleToolAllRoles,
      roleBindingOverrides: options.roleBindingOverrides,
    });

    sourceConfig.adapters = candidateAdaptersConfig;
    return {
      candidateConfig: sourceConfig,
      selectedTools,
      candidateAdaptersConfig,
    };
  }

  /**
   * Builds the canonical onboarding payload, including onboarding-owned readiness composition.
   * @param options Onboarding command context and verification inputs.
   * @returns Stable onboarding payload for connect/doctor surfaces.
   */
  public createOnboardingContractPayload(options: {
    commandName: 'connect' | 'doctor';
    executionId: string;
    workspaceId: string;
    verificationStatus: CliGovernanceCheckStatus;
    nextActions: string[];
    enabledTools: AdapterSurface[];
    adaptersConfig: AdaptersConfig;
    verification?: CliAdapterVerificationResolution;
    dryRun: boolean;
    overwrite: boolean;
    singleToolAllRoles: boolean;
    presetId?: CliAgentOnboardingPreset | null;
    repairScope?: 'safe_local' | 'manual_only' | null;
    safeLocalFixCount?: number;
  }) {
    const enabledToolRows = this.createEnabledToolRowsPayload({
      enabledTools: options.enabledTools,
      adaptersConfig: options.adaptersConfig,
      verification: options.verification,
    });
    const readinessPayload = this.createReadinessCompositionPayload({
      commandName: options.commandName,
      verificationStatus: options.verificationStatus,
      verification: options.verification,
      nextActions: options.nextActions,
      safeLocalFixCount: options.safeLocalFixCount,
    });
    return {
      schema_version: CLI_AGENT_ONBOARDING_SCHEMA_VERSION,
      command_name: options.commandName,
      preset_id: options.presetId ?? null,
      enabled_tools: enabledToolRows,
      tool_transport_matrix: this.createToolTransportMatrixPayload(enabledToolRows),
      role_bindings: options.adaptersConfig.roles.map((role) => ({
        role_id: role.roleId,
        role_profile_id: role.roleProfileId,
        primary_surface:
          options.adaptersConfig.routing.roleBindings[role.roleId]?.primarySurface ?? null,
        fallback_surfaces: [
          ...(options.adaptersConfig.routing.roleBindings[role.roleId]?.fallbackSurfaces ?? []),
        ],
      })),
      dry_run: options.dryRun,
      overwrite: options.overwrite,
      single_tool_all_roles: options.singleToolAllRoles,
      repair_scope: options.repairScope ?? null,
      verification_status: readinessPayload.verification_status,
      diagnostic_summary: readinessPayload.diagnostic_summary,
      next_action: readinessPayload.next_action,
      next_actions: readinessPayload.next_actions,
      execution_id: options.executionId,
      workspace_id: options.workspaceId,
    };
  }

  /**
   * Builds the additive verify matrix companion, including readiness composition derived from
   * canonical onboarding/probe truth.
   * @param options Verify-matrix execution context.
   * @returns Stable verify-matrix payload.
   */
  public createVerifyMatrixPayload(options: {
    commandName?: 'connect' | 'doctor' | 'verify';
    executionId: string;
    verification: CliAdapterVerificationResolution;
    adaptersConfig: AdaptersConfig;
    nextActions?: string[];
    safeLocalFixCount?: number;
  }) {
    const configuredToolById = new Map(
      (options.adaptersConfig.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
    const verificationToolById = new Map(
      (options.verification.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
    const enabledToolRows = this.createEnabledToolRowsPayload({
      enabledTools: (options.adaptersConfig.tools ?? []).map((tool) => tool.toolId),
      adaptersConfig: options.adaptersConfig,
      verification: options.verification,
    });
    const readinessPayload = this.createReadinessCompositionPayload({
      commandName: options.commandName ?? 'verify',
      verificationStatus: options.verification.overallStatus,
      verification: options.verification,
      nextActions: options.nextActions ?? options.verification.nextActions,
      safeLocalFixCount: options.safeLocalFixCount,
    });
    return {
      execution_id: options.executionId,
      summary: options.verification.overallStatus,
      verification_status: readinessPayload.verification_status,
      diagnostic_summary: readinessPayload.diagnostic_summary,
      next_action: readinessPayload.next_action,
      next_actions: readinessPayload.next_actions,
      tool_transport_matrix: this.createToolTransportMatrixPayload(enabledToolRows),
      tool_matrix: (options.verification.roleEvaluations ?? []).map((roleEvaluation) => {
        const resolvedSurface = roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface;
        const verificationTool = verificationToolById.get(resolvedSurface);
        const toolHealthCheck = verificationTool?.healthCheck ?? roleEvaluation.healthCheck;
        const toolUnavailableReasons =
          verificationTool?.unavailableReasons ?? roleEvaluation.unavailableReasons;
        const toolFailureAttributions =
          verificationTool?.failureAttributions ?? roleEvaluation.failureAttributions;
        const resolvedTransportKind = this.resolveToolTransportKind(
          resolvedSurface,
          configuredToolById.get(resolvedSurface),
          toolHealthCheck?.transportKind,
        );
        const launchDiagnostics =
          this.launchDiagnosticsProjectionRuntime.createLaunchDiagnosticsPayload({
            transportKind: resolvedTransportKind,
            healthCheck: toolHealthCheck,
          });
        const acpHostCompanion = this.acpHostCompanionRuntime.createCompanionPayload({
          transportKind: resolvedTransportKind,
          healthCheck: toolHealthCheck,
        });

        return {
          tool: resolvedSurface,
          surface: resolvedSurface,
          role_profile_id: roleEvaluation.roleProfileId,
          availability_status:
            verificationTool?.availabilityStatus ??
            this.resolveFallbackAvailabilityStatus(roleEvaluation) ??
            null,
          binding_status: roleEvaluation.status,
          capability_support:
            (roleEvaluation.unsupportedCapabilities ?? []).length > 0
              ? 'unsupported'
              : (roleEvaluation.degradedCapabilities ?? []).length > 0
                ? 'degraded'
                : 'supported',
          selected_by: roleEvaluation.selectedBy,
          binding_unavailable_reasons: [...(roleEvaluation.unavailableReasons ?? [])],
          binding_failure_attributions: [...(roleEvaluation.failureAttributions ?? [])],
          capability_gap: [...(roleEvaluation.unsupportedCapabilities ?? [])],
          route_coverage: [
            roleEvaluation.primarySurface,
            ...(options.adaptersConfig.routing.roleBindings[roleEvaluation.roleId]
              ?.fallbackSurfaces ?? []),
          ],
          invoke_liveness_diagnostics: this.createInvokeLivenessDiagnosticsPayload({
            toolId: resolvedSurface,
            configuredTool: configuredToolById.get(resolvedSurface),
            healthCheck: toolHealthCheck,
            unavailableReasons: toolUnavailableReasons,
            failureAttributions: toolFailureAttributions,
          }),
          next_action: options.verification.nextActions[0] ?? null,
          ...(acpHostCompanion ? { acp_host_companion: acpHostCompanion } : {}),
          ...(launchDiagnostics ? { launch_diagnostics: launchDiagnostics } : {}),
        };
      }),
      role_binding_matrix: (options.verification.roleEvaluations ?? []).map((roleEvaluation) => {
        const resolvedSurface = roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface;
        const roleToolHealthCheck =
          verificationToolById.get(resolvedSurface)?.healthCheck ?? roleEvaluation.healthCheck;
        const launchDiagnostics =
          this.launchDiagnosticsProjectionRuntime.createLaunchDiagnosticsPayload({
            transportKind: this.resolveToolTransportKind(
              resolvedSurface,
              configuredToolById.get(resolvedSurface),
              roleToolHealthCheck?.transportKind,
            ),
            healthCheck: roleToolHealthCheck,
          });
        const acpHostCompanion = this.acpHostCompanionRuntime.createCompanionPayload({
          transportKind: this.resolveToolTransportKind(
            resolvedSurface,
            configuredToolById.get(resolvedSurface),
            roleToolHealthCheck?.transportKind,
          ),
          healthCheck: roleToolHealthCheck,
        });

        return {
          role_profile_id: roleEvaluation.roleProfileId,
          primary_tool: roleEvaluation.primarySurface,
          fallback_tools: [
            ...(options.adaptersConfig.routing.roleBindings[roleEvaluation.roleId]
              ?.fallbackSurfaces ?? []),
          ],
          binding_status: roleEvaluation.status,
          invoke_liveness_diagnostics: this.createInvokeLivenessDiagnosticsPayload({
            toolId: resolvedSurface,
            configuredTool: configuredToolById.get(resolvedSurface),
            healthCheck: roleEvaluation.healthCheck,
            unavailableReasons: roleEvaluation.unavailableReasons,
            failureAttributions: roleEvaluation.failureAttributions,
          }),
          ...(acpHostCompanion ? { acp_host_companion: acpHostCompanion } : {}),
          ...(launchDiagnostics ? { launch_diagnostics: launchDiagnostics } : {}),
        };
      }),
    };
  }

  private createReadinessCompositionPayload(options: {
    commandName: 'connect' | 'doctor' | 'verify';
    verificationStatus: CliGovernanceCheckStatus;
    verification?: CliAdapterVerificationResolution;
    nextActions: string[];
    safeLocalFixCount?: number;
  }): {
    verification_status: CliGovernanceCheckStatus;
    diagnostic_summary: string;
    next_action: string | null;
    next_actions: string[];
  } {
    const diagnosticSummarySegments = [`status=${options.verificationStatus}`];
    if (options.verification) {
      diagnosticSummarySegments.push(
        `required_failures=${options.verification.requiredRoleFailedCount}`,
        `fallback_roles=${options.verification.fallbackRoleCount}`,
        `degraded_roles=${options.verification.degradedRoleCount}`,
      );
      const acpRolloutSummary = this.createAcpRolloutSummary(options.verification);
      if (acpRolloutSummary) {
        diagnosticSummarySegments.push(
          `acp_runtime_ready=${acpRolloutSummary.runtimeServiceReadyCount}/${acpRolloutSummary.trackedToolCount}`,
          `acp_distribution_ready=${acpRolloutSummary.distributionReadyCount}/${acpRolloutSummary.trackedToolCount}`,
        );
      }
    }
    if (options.commandName === 'doctor' && options.safeLocalFixCount !== undefined) {
      diagnosticSummarySegments.push(`safe_local_fix=${options.safeLocalFixCount}`);
    }

    return {
      verification_status: options.verificationStatus,
      diagnostic_summary: diagnosticSummarySegments.join(' '),
      next_action: options.nextActions[0] ?? null,
      next_actions: [...options.nextActions],
    };
  }

  private createEnabledToolRowsPayload(options: {
    enabledTools: AdapterSurface[];
    adaptersConfig: AdaptersConfig;
    verification?: CliAdapterVerificationResolution;
  }): Array<Record<string, unknown>> {
    const configuredToolById = new Map(
      (options.adaptersConfig.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
    const verificationToolById = new Map(
      (options.verification?.tools ?? []).map((tool) => [tool.toolId, tool]),
    );

    return options.enabledTools.map((toolId) => {
      const configuredTool = configuredToolById.get(toolId);
      const verificationTool = verificationToolById.get(toolId);
      const transportSelectionSource = this.resolveTransportSelectionSource(configuredTool);
      const resolvedTransportKind = this.resolveToolTransportKind(
        toolId,
        configuredTool,
        verificationTool?.healthCheck?.transportKind,
      );
      const launchDiagnostics =
        this.launchDiagnosticsProjectionRuntime.createLaunchDiagnosticsPayload({
          transportKind: resolvedTransportKind,
          healthCheck: verificationTool?.healthCheck,
        });
      const acpHostCompanion = this.acpHostCompanionRuntime.createCompanionPayload({
        transportKind: resolvedTransportKind,
        healthCheck: verificationTool?.healthCheck,
      });
      return {
        tool_id: toolId,
        enabled: configuredTool?.enabled ?? true,
        configured_availability: configuredTool?.availability ?? null,
        availability_status: verificationTool?.availabilityStatus ?? null,
        transport_kind: resolvedTransportKind,
        provider_kind: this.resolveSelectedProviderKind({
          configuredTool,
          healthCheck: verificationTool?.healthCheck,
          resolvedTransportKind,
        }),
        vendor_binding_kind: this.resolveSelectedVendorBindingKind({
          toolId,
          configuredTool,
          healthCheck: verificationTool?.healthCheck,
          resolvedTransportKind,
        }),
        model: this.resolveSelectedModel({
          configuredTool,
          healthCheck: verificationTool?.healthCheck,
          resolvedTransportKind,
        }),
        credential_mode: this.resolveSelectedCredentialMode({
          configuredTool,
          healthCheck: verificationTool?.healthCheck,
          resolvedTransportKind,
        }),
        endpoint_source: this.resolveSelectedEndpointSource({
          configuredTool,
          healthCheck: verificationTool?.healthCheck,
          resolvedTransportKind,
        }),
        transport_selection_source: transportSelectionSource,
        transport_selection_locked:
          transportSelectionSource === AdapterTransportSelectionSource.CONFIG_EXPLICIT,
        configured_remote_api: this.createConfiguredRemoteApiPayload(toolId, configuredTool),
        probe_truth: verificationTool?.healthCheck
          ? {
              transport_kind: verificationTool.healthCheck.transportKind,
              provider_kind: verificationTool.healthCheck.providerKind,
              vendor_binding_kind: verificationTool.healthCheck.vendorBindingKind,
              model: verificationTool.healthCheck.model,
              credential_source: verificationTool.healthCheck.credentialSource,
              endpoint_source: verificationTool.healthCheck.endpointSource,
              request_cancellation_mode: verificationTool.healthCheck.requestCancellationMode,
              reason_codes: [...verificationTool.healthCheck.reasonCodes],
              install_status: verificationTool.healthCheck.installStatus,
              auth_status: verificationTool.healthCheck.authStatus,
              protocol_status: verificationTool.healthCheck.protocolStatus,
              semantic_status: verificationTool.healthCheck.semanticStatus,
              route_capability_status: verificationTool.healthCheck.routeCapabilityStatus,
            }
          : null,
        invoke_liveness_diagnostics: this.createInvokeLivenessDiagnosticsPayload({
          toolId,
          configuredTool,
          healthCheck: verificationTool?.healthCheck,
          unavailableReasons: verificationTool?.unavailableReasons,
          failureAttributions: verificationTool?.failureAttributions,
        }),
        ...(acpHostCompanion ? { acp_host_companion: acpHostCompanion } : {}),
        ...(launchDiagnostics ? { launch_diagnostics: launchDiagnostics } : {}),
      };
    });
  }

  private createToolTransportMatrixPayload(
    enabledToolRows: Array<Record<string, unknown>>,
  ): Array<Record<string, unknown>> {
    return enabledToolRows.map((row) => ({
      tool_id: row.tool_id,
      enabled: row.enabled,
      configured_availability: row.configured_availability,
      availability_status: row.availability_status,
      transport: row.transport_kind,
      transport_kind: row.transport_kind,
      provider_kind: row.provider_kind,
      vendor_binding_kind: row.vendor_binding_kind,
      model: row.model,
      credential_mode: row.credential_mode,
      endpoint_source: row.endpoint_source,
      transport_selection_source: row.transport_selection_source,
      transport_selection_locked: row.transport_selection_locked,
      configured_remote_api: row.configured_remote_api,
      remote_api_candidate: row.configured_remote_api,
      probe_truth: row.probe_truth,
      invoke_liveness_diagnostics: row.invoke_liveness_diagnostics,
      ...(row.acp_host_companion ? { acp_host_companion: row.acp_host_companion } : {}),
      ...(row.launch_diagnostics ? { launch_diagnostics: row.launch_diagnostics } : {}),
    }));
  }

  private createAcpRolloutSummary(verification: CliAdapterVerificationResolution): {
    trackedToolCount: number;
    runtimeServiceReadyCount: number;
    distributionReadyCount: number;
  } | null {
    const companions = verification.tools
      .map((tool) =>
        this.acpHostCompanionRuntime.createCompanionPayload({
          transportKind: tool.healthCheck?.transportKind,
          healthCheck: tool.healthCheck,
        }),
      )
      .filter((companion): companion is NonNullable<typeof companion> => companion !== null);
    if (companions.length === 0) {
      return null;
    }

    return {
      trackedToolCount: companions.length,
      runtimeServiceReadyCount: companions.filter(
        (companion) =>
          companion.hostReadinessStatus === CliAcpHostReadinessStatus.RUNTIME_SERVICE_READY,
      ).length,
      distributionReadyCount: companions.filter(
        (companion) =>
          companion.distributionBoundary ===
          CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_READY,
      ).length,
    };
  }

  private createInvokeLivenessDiagnosticsPayload(options: {
    toolId: AdapterSurface;
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number];
    healthCheck?: CliAdapterVerificationResolution['tools'][number]['healthCheck'];
    unavailableReasons?: string[];
    failureAttributions?: string[];
  }): Record<string, unknown> {
    const resolvedTransportKind = this.resolveToolTransportKind(
      options.toolId,
      options.configuredTool,
      options.healthCheck?.transportKind,
    );
    return {
      transport_kind: resolvedTransportKind,
      provider_kind: this.resolveSelectedProviderKind({
        configuredTool: options.configuredTool,
        healthCheck: options.healthCheck,
        resolvedTransportKind,
      }),
      vendor_binding_kind: this.resolveSelectedVendorBindingKind({
        toolId: options.toolId,
        configuredTool: options.configuredTool,
        healthCheck: options.healthCheck,
        resolvedTransportKind,
      }),
      model: this.resolveSelectedModel({
        configuredTool: options.configuredTool,
        healthCheck: options.healthCheck,
        resolvedTransportKind,
      }),
      request_timeout_ms:
        resolvedTransportKind === AdapterTransportKind.REMOTE_API
          ? (options.configuredTool?.remoteApi?.requestTimeoutMs ?? null)
          : resolvedTransportKind === AdapterTransportKind.BASELINE
            ? (options.configuredTool?.localModel?.requestTimeoutMs ?? null)
            : resolvedTransportKind === AdapterTransportKind.CLI_EXEC
              ? CLI_EXEC_DEFAULT_REQUEST_TIMEOUT_MS
              : null,
      max_retries:
        resolvedTransportKind === AdapterTransportKind.REMOTE_API
          ? (options.configuredTool?.remoteApi?.maxRetries ?? null)
          : resolvedTransportKind === AdapterTransportKind.BASELINE
            ? (options.configuredTool?.localModel?.maxRetries ?? null)
            : resolvedTransportKind === AdapterTransportKind.CLI_EXEC
              ? DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS
              : null,
      request_cancellation_mode: options.healthCheck?.requestCancellationMode ?? null,
      route_key: options.healthCheck?.routeKey ?? null,
      selected_entrypoint: options.healthCheck?.selectedEntrypoint ?? null,
      reason_codes: [...(options.healthCheck?.reasonCodes ?? [])],
      unavailable_reasons: [...(options.unavailableReasons ?? [])],
      failure_attributions: [...(options.failureAttributions ?? [])],
    };
  }

  private resolveFallbackAvailabilityStatus(
    roleEvaluation: CliAdapterVerificationResolution['roleEvaluations'][number],
  ): AgentAvailabilityStatus {
    if (
      roleEvaluation.status === CliGovernanceCheckStatus.FAIL ||
      roleEvaluation.selectedSurface === null
    ) {
      return AgentAvailabilityStatus.UNAVAILABLE;
    }

    if (roleEvaluation.status === CliGovernanceCheckStatus.WARN) {
      return AgentAvailabilityStatus.DEGRADED;
    }

    return AgentAvailabilityStatus.AVAILABLE;
  }

  private resolveToolTransportKind(
    toolId: AdapterSurface,
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number],
    healthCheckTransportKind?: string | null,
  ): AdapterTransportKind | null {
    if (
      healthCheckTransportKind === AdapterTransportKind.BASELINE ||
      healthCheckTransportKind === AdapterTransportKind.CLI_EXEC ||
      healthCheckTransportKind === AdapterTransportKind.ACP_EXEC ||
      healthCheckTransportKind === AdapterTransportKind.REMOTE_API
    ) {
      return healthCheckTransportKind;
    }

    if (configuredTool?.transport) {
      return configuredTool.transport;
    }

    if (configuredTool?.remoteApi) {
      return AdapterTransportKind.REMOTE_API;
    }

    if (configuredTool?.localModel) {
      return AdapterTransportKind.BASELINE;
    }

    if (
      toolId === AdapterSurface.CODEX ||
      toolId === AdapterSurface.CLAUDE_CODE ||
      toolId === AdapterSurface.GITHUB_COPILOT
    ) {
      return AdapterTransportKind.CLI_EXEC;
    }

    if (toolId === AdapterSurface.OLLAMA) {
      return AdapterTransportKind.BASELINE;
    }

    return null;
  }

  private resolveTransportSelectionSource(
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number],
  ): AdapterTransportSelectionSource {
    if (configuredTool?.transport) {
      return AdapterTransportSelectionSource.CONFIG_EXPLICIT;
    }
    if (configuredTool?.remoteApi) {
      return AdapterTransportSelectionSource.INFERRED_FROM_REMOTE_API;
    }
    return AdapterTransportSelectionSource.SURFACE_DEFAULT;
  }

  private resolveConfiguredCredentialMode(
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number],
  ): AdapterCredentialSource | null {
    if (!configuredTool?.remoteApi) {
      return null;
    }
    if (configuredTool.remoteApi.credentialRef) {
      return AdapterCredentialSource.CREDENTIAL_REF;
    }
    if (configuredTool.remoteApi.credentialEnvVar) {
      return AdapterCredentialSource.ENV_EXPLICIT;
    }
    if (configuredTool.remoteApi.allowProviderLocalConfig) {
      return AdapterCredentialSource.PROVIDER_LOCAL;
    }
    return AdapterCredentialSource.ENV_DEFAULT;
  }

  private resolveConfiguredEndpointSource(
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number],
  ): AdapterEndpointSource | null {
    if (!configuredTool?.remoteApi) {
      return null;
    }
    if (configuredTool.remoteApi.endpoint) {
      return AdapterEndpointSource.CONFIG_EXPLICIT;
    }
    if (configuredTool.remoteApi.allowProviderLocalConfig) {
      return AdapterEndpointSource.PROVIDER_LOCAL;
    }
    return AdapterEndpointSource.VENDOR_DEFAULT;
  }

  private resolveSelectedProviderKind(options: {
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number];
    healthCheck?: CliAdapterVerificationResolution['tools'][number]['healthCheck'];
    resolvedTransportKind: AdapterTransportKind | null;
  }): AdapterProviderKind | null {
    if (options.healthCheck?.providerKind) {
      return options.healthCheck.providerKind;
    }
    if (this.shouldExposeConfiguredRemoteApiSelection(options.resolvedTransportKind)) {
      return options.configuredTool?.remoteApi?.provider ?? null;
    }
    return null;
  }

  private resolveSelectedVendorBindingKind(options: {
    toolId: AdapterSurface;
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number];
    healthCheck?: CliAdapterVerificationResolution['tools'][number]['healthCheck'];
    resolvedTransportKind: AdapterTransportKind | null;
  }): AdapterVendorBindingKind | null {
    if (options.healthCheck?.vendorBindingKind) {
      return options.healthCheck.vendorBindingKind;
    }
    if (!this.shouldExposeConfiguredRemoteApiSelection(options.resolvedTransportKind)) {
      return null;
    }
    return this.resolveConfiguredVendorBindingKind(
      options.toolId,
      options.configuredTool?.remoteApi?.provider ?? null,
      options.configuredTool?.remoteApi?.vendorBinding ?? null,
    );
  }

  private resolveSelectedModel(options: {
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number];
    healthCheck?: CliAdapterVerificationResolution['tools'][number]['healthCheck'];
    resolvedTransportKind: AdapterTransportKind | null;
  }): string | null {
    if (options.healthCheck?.model) {
      return options.healthCheck.model;
    }
    if (this.shouldExposeConfiguredRemoteApiSelection(options.resolvedTransportKind)) {
      return options.configuredTool?.remoteApi?.model ?? null;
    }
    if (options.resolvedTransportKind === AdapterTransportKind.BASELINE) {
      return options.configuredTool?.localModel?.model ?? null;
    }
    return null;
  }

  private shouldExposeConfiguredRemoteApiSelection(
    resolvedTransportKind: AdapterTransportKind | null,
  ): boolean {
    return (
      resolvedTransportKind === AdapterTransportKind.REMOTE_API ||
      resolvedTransportKind === AdapterTransportKind.ACP_EXEC
    );
  }

  private resolveSelectedCredentialMode(options: {
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number];
    healthCheck?: CliAdapterVerificationResolution['tools'][number]['healthCheck'];
    resolvedTransportKind: AdapterTransportKind | null;
  }): AdapterCredentialSource | null {
    if (options.healthCheck?.credentialSource) {
      return options.healthCheck.credentialSource;
    }
    if (!this.shouldExposeConfiguredRemoteApiSelection(options.resolvedTransportKind)) {
      return null;
    }
    return this.resolveConfiguredCredentialMode(options.configuredTool);
  }

  private resolveSelectedEndpointSource(options: {
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number];
    healthCheck?: CliAdapterVerificationResolution['tools'][number]['healthCheck'];
    resolvedTransportKind: AdapterTransportKind | null;
  }): AdapterEndpointSource | null {
    if (options.healthCheck?.endpointSource) {
      return options.healthCheck.endpointSource;
    }
    if (!this.shouldExposeConfiguredRemoteApiSelection(options.resolvedTransportKind)) {
      return null;
    }
    return this.resolveConfiguredEndpointSource(options.configuredTool);
  }

  private createConfiguredRemoteApiPayload(
    toolId: AdapterSurface,
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number],
  ): Record<string, unknown> | null {
    if (!configuredTool?.remoteApi) {
      return null;
    }
    return {
      provider_kind: configuredTool.remoteApi.provider,
      vendor_binding_kind: this.resolveConfiguredVendorBindingKind(
        toolId,
        configuredTool.remoteApi.provider,
        configuredTool.remoteApi.vendorBinding ?? null,
      ),
      model: configuredTool.remoteApi.model,
      credential_mode: this.resolveConfiguredCredentialMode(configuredTool),
      credential_env_var: configuredTool.remoteApi.credentialEnvVar ?? null,
      credential_ref: configuredTool.remoteApi.credentialRef ?? null,
      allow_provider_local_config: configuredTool.remoteApi.allowProviderLocalConfig ?? false,
      endpoint: configuredTool.remoteApi.endpoint ?? null,
      endpoint_source: this.resolveConfiguredEndpointSource(configuredTool),
      request_timeout_ms: configuredTool.remoteApi.requestTimeoutMs ?? null,
      max_retries: configuredTool.remoteApi.maxRetries ?? null,
      discovery_mode: 'read_only',
      mutation_scope: 'manual_only',
    };
  }

  private resolveConfiguredVendorBindingKind(
    toolId: AdapterSurface,
    providerKind: AdapterProviderKind | null,
    vendorBindingKind: AdapterVendorBindingKind | null,
  ): AdapterVendorBindingKind | null {
    if (vendorBindingKind) {
      return vendorBindingKind;
    }
    if (toolId === AdapterSurface.CODEX || providerKind === AdapterProviderKind.OPENAI) {
      return AdapterVendorBindingKind.OPENAI_RESPONSES;
    }
    if (toolId === AdapterSurface.CLAUDE_CODE || providerKind === AdapterProviderKind.ANTHROPIC) {
      return AdapterVendorBindingKind.ANTHROPIC_MESSAGES;
    }
    if (providerKind === AdapterProviderKind.GITHUB_MODELS) {
      return AdapterVendorBindingKind.GITHUB_MODELS_INFERENCE;
    }
    return null;
  }

  private buildCandidateAdaptersConfig(options: {
    currentAdaptersConfig: AdaptersConfig;
    presetId: CliAgentOnboardingPreset;
    selectedTools: AdapterSurface[];
    toolTransportOverrides: CliConnectToolTransportOverride[];
    remoteApiOverrides: CliConnectRemoteApiOverride[];
    localizeText?: (english: string, chinese: string) => string;
    overwrite: boolean;
    singleToolAllRoles: boolean;
    roleBindingOverrides: CliConnectRoleBindingOverride[];
  }): AdaptersConfig {
    const baseRoles =
      options.presetId === CliAgentOnboardingPreset.SINGLE_TOOL_MINIMAL
        ? options.currentAdaptersConfig.roles.filter((role) => MINIMAL_ROLE_IDS.has(role.roleId))
        : options.currentAdaptersConfig.roles;
    const roles = baseRoles.map((role) => ({
      ...role,
      requiredCapabilities: [...role.requiredCapabilities],
    }));

    const roleBindings = Object.fromEntries(
      roles.map((role) => [
        role.roleId,
        this.resolveRoleBinding({
          roleId: role.roleId,
          currentBinding: options.currentAdaptersConfig.routing.roleBindings[role.roleId],
          presetId:
            options.singleToolAllRoles === true
              ? CliAgentOnboardingPreset.SINGLE_TOOL_ALL_ROLES
              : options.presetId,
          selectedTools: options.selectedTools,
          overrides: options.roleBindingOverrides,
        }),
      ]),
    );

    const toolTransportOverrideById = new Map(
      options.toolTransportOverrides.map((override) => [override.toolId, override.transport]),
    );
    const remoteApiOverrideById = new Map(
      options.remoteApiOverrides.map((override) => [override.toolId, override]),
    );
    const tools = options.selectedTools.map((toolId) => {
      const currentTool =
        options.currentAdaptersConfig.tools?.find((tool) => tool.toolId === toolId) ?? null;
      return this.buildCandidateToolConfig({
        toolId,
        currentTool,
        transportOverride: toolTransportOverrideById.get(toolId) ?? null,
        remoteApiOverride: remoteApiOverrideById.get(toolId) ?? null,
        localizeText: options.localizeText,
      });
    });

    const candidateConfig = {
      roles,
      routing: {
        roleBindings,
      },
      tools,
    } satisfies AdaptersConfig;

    if (options.presetId === CliAgentOnboardingPreset.SINGLE_TOOL_MINIMAL) {
      return candidateConfig;
    }

    if (options.overwrite) {
      return candidateConfig;
    }

    return this.mergeAdaptersConfig(options.currentAdaptersConfig, candidateConfig);
  }

  private buildCandidateToolConfig(options: {
    toolId: AdapterSurface;
    currentTool: NonNullable<AdaptersConfig['tools']>[number] | null;
    transportOverride: AdapterTransportKind | null;
    remoteApiOverride: CliConnectRemoteApiOverride | null;
    localizeText?: (english: string, chinese: string) => string;
  }): NonNullable<AdaptersConfig['tools']>[number] {
    if (options.transportOverride) {
      this.assertSupportedToolTransportOverride(options);
    }

    const candidateTransport = this.resolveCandidateToolTransport(options);
    const candidateRemoteApi = this.resolveCandidateToolRemoteApi(options);
    return {
      toolId: options.toolId,
      enabled: true,
      availability: options.currentTool?.availability ?? AdapterAvailability.AVAILABLE,
      ...(candidateTransport ? { transport: candidateTransport } : {}),
      ...(candidateRemoteApi ? { remoteApi: candidateRemoteApi } : {}),
      ...(options.currentTool?.localModel
        ? { localModel: { ...options.currentTool.localModel } }
        : {}),
      ...(options.currentTool?.unavailableReasons
        ? { unavailableReasons: [...options.currentTool.unavailableReasons] }
        : {}),
    };
  }

  private resolveCandidateToolTransport(options: {
    toolId: AdapterSurface;
    currentTool: NonNullable<AdaptersConfig['tools']>[number] | null;
    transportOverride: AdapterTransportKind | null;
    remoteApiOverride: CliConnectRemoteApiOverride | null;
  }): AdapterTransportKind | null {
    if (options.transportOverride) {
      return options.transportOverride;
    }
    if (options.currentTool?.transport) {
      return options.currentTool.transport;
    }
    if (CLI_CONNECT_TRANSPORT_AUTHORING_SURFACES.has(options.toolId)) {
      return options.currentTool?.remoteApi || options.remoteApiOverride
        ? AdapterTransportKind.REMOTE_API
        : AdapterTransportKind.CLI_EXEC;
    }
    return null;
  }

  private assertSupportedToolTransportOverride(options: {
    toolId: AdapterSurface;
    currentTool: NonNullable<AdaptersConfig['tools']>[number] | null;
    transportOverride: AdapterTransportKind | null;
    remoteApiOverride: CliConnectRemoteApiOverride | null;
    localizeText?: (english: string, chinese: string) => string;
  }): void {
    if (!options.transportOverride) {
      return;
    }
    const supportedTransports = CLI_CONNECT_SUPPORTED_TRANSPORTS_BY_SURFACE.get(options.toolId);
    if (!supportedTransports || !supportedTransports.has(options.transportOverride)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        this.localizeText(
          options.localizeText,
          `connect transport override does not support ${options.toolId}=${options.transportOverride}.`,
          `connect transport 覆盖不支持 ${options.toolId}=${options.transportOverride}。`,
        ),
        {
          toolId: options.toolId,
          transport: options.transportOverride,
        },
      );
    }

    if (
      options.transportOverride === AdapterTransportKind.REMOTE_API &&
      !options.currentTool?.remoteApi &&
      !options.remoteApiOverride
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        this.localizeText(
          options.localizeText,
          `connect requires existing remoteApi settings before selecting remote_api for ${options.toolId}.`,
          `connect 在为 ${options.toolId} 选择 remote_api 前，需要已有的 remoteApi 配置。`,
        ),
        {
          toolId: options.toolId,
          transport: options.transportOverride,
        },
      );
    }
  }

  private resolveCandidateToolRemoteApi(options: {
    toolId: AdapterSurface;
    currentTool: NonNullable<AdaptersConfig['tools']>[number] | null;
    transportOverride: AdapterTransportKind | null;
    remoteApiOverride: CliConnectRemoteApiOverride | null;
    localizeText?: (english: string, chinese: string) => string;
  }): AdapterRemoteApiConfig | null {
    const existingRemoteApi = options.currentTool?.remoteApi
      ? { ...options.currentTool.remoteApi }
      : null;
    const override = options.remoteApiOverride;
    if (!override) {
      return existingRemoteApi;
    }

    if (!CLI_CONNECT_TRANSPORT_AUTHORING_SURFACES.has(options.toolId)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        this.localizeText(
          options.localizeText,
          `connect remote_api authoring does not support ${options.toolId}.`,
          `connect remote_api 配置不支持 ${options.toolId}。`,
        ),
        {
          toolId: options.toolId,
        },
      );
    }

    const candidateModel = override.model ?? existingRemoteApi?.model ?? null;
    if (!candidateModel) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        this.localizeText(
          options.localizeText,
          `connect remote_api authoring requires --remote-api-model ${options.toolId}=<model> before ${options.toolId} can use remote_api.`,
          `connect remote_api 配置要求先提供 --remote-api-model ${options.toolId}=<model>，然后 ${options.toolId} 才能使用 remote_api。`,
        ),
        {
          toolId: options.toolId,
          option: '--remote-api-model',
        },
      );
    }

    const existingCredentialRef = existingRemoteApi?.credentialRef;
    const credentialEnvVar =
      override.credentialEnvVar ??
      existingRemoteApi?.credentialEnvVar ??
      (existingCredentialRef !== undefined
        ? undefined
        : this.remoteApiAuthoringDefaultsService.resolveCredentialEnvVarForTool(options.toolId));

    return {
      provider: this.remoteApiAuthoringDefaultsService.resolveProviderForTool(options.toolId),
      vendorBinding: this.remoteApiAuthoringDefaultsService.resolveVendorBindingForTool(
        options.toolId,
      ),
      model: candidateModel,
      ...(credentialEnvVar !== undefined ? { credentialEnvVar } : {}),
      ...(existingCredentialRef !== undefined ? { credentialRef: existingCredentialRef } : {}),
      ...(existingRemoteApi?.allowProviderLocalConfig !== undefined
        ? { allowProviderLocalConfig: existingRemoteApi.allowProviderLocalConfig }
        : {}),
      ...((override.endpoint ?? existingRemoteApi?.endpoint)
        ? { endpoint: override.endpoint ?? existingRemoteApi?.endpoint }
        : {}),
      ...(existingRemoteApi?.requestTimeoutMs !== undefined
        ? { requestTimeoutMs: existingRemoteApi.requestTimeoutMs }
        : {}),
      ...(existingRemoteApi?.maxRetries !== undefined
        ? { maxRetries: existingRemoteApi.maxRetries }
        : {}),
    };
  }

  private assertSelectedToolsContainTransportOverrides(options: {
    selectedTools: AdapterSurface[];
    toolTransportOverrides: CliConnectToolTransportOverride[];
    localizeText?: (english: string, chinese: string) => string;
  }): void {
    const selectedToolSet = new Set(options.selectedTools);
    for (const override of options.toolTransportOverrides) {
      if (selectedToolSet.has(override.toolId)) {
        continue;
      }
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        this.localizeText(
          options.localizeText,
          `connect transport override requires ${override.toolId} to already be included in the selected tool set.`,
          `connect transport 覆盖要求 ${override.toolId} 已经包含在当前选中的工具集合中。`,
        ),
        {
          toolId: override.toolId,
          transport: override.transport,
          selectedTools: options.selectedTools,
        },
      );
    }
  }

  private assertSelectedToolsContainRemoteApiOverrides(options: {
    selectedTools: AdapterSurface[];
    remoteApiOverrides: CliConnectRemoteApiOverride[];
    localizeText?: (english: string, chinese: string) => string;
  }): void {
    const selectedToolSet = new Set(options.selectedTools);
    for (const override of options.remoteApiOverrides) {
      if (selectedToolSet.has(override.toolId)) {
        continue;
      }
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        this.localizeText(
          options.localizeText,
          `connect remote_api authoring requires ${override.toolId} to already be included in the selected tool set.`,
          `connect remote_api 配置要求 ${override.toolId} 已经包含在当前选中的工具集合中。`,
        ),
        {
          toolId: override.toolId,
          selectedTools: options.selectedTools,
        },
      );
    }
  }

  private mergeAdaptersConfig(
    currentAdaptersConfig: AdaptersConfig,
    candidateConfig: AdaptersConfig,
  ): AdaptersConfig {
    const roleById = new Map(currentAdaptersConfig.roles.map((role) => [role.roleId, role]));
    for (const role of candidateConfig.roles) {
      roleById.set(role.roleId, role);
    }

    const toolById = new Map(
      (currentAdaptersConfig.tools ?? []).map((tool) => [tool.toolId, { ...tool }]),
    );
    for (const tool of candidateConfig.tools ?? []) {
      toolById.set(tool.toolId, {
        ...(toolById.get(tool.toolId) ?? {}),
        ...tool,
        ...(tool.unavailableReasons ? { unavailableReasons: [...tool.unavailableReasons] } : {}),
      });
    }

    return {
      roles: Array.from(roleById.values()).map((role) => ({
        ...role,
        requiredCapabilities: [...role.requiredCapabilities],
      })),
      routing: {
        roleBindings: {
          ...currentAdaptersConfig.routing.roleBindings,
          ...candidateConfig.routing.roleBindings,
        },
      },
      tools: Array.from(toolById.values()),
    };
  }

  private resolveRoleBinding(options: {
    roleId: string;
    currentBinding?: AdaptersConfig['routing']['roleBindings'][string];
    presetId: CliAgentOnboardingPreset;
    selectedTools: AdapterSurface[];
    overrides: CliConnectRoleBindingOverride[];
  }) {
    const override = options.overrides.find((candidate) => candidate.roleId === options.roleId);
    if (override) {
      return {
        primarySurface: override.primarySurface,
        ...(override.fallbackSurfaces.length > 0
          ? { fallbackSurfaces: [...override.fallbackSurfaces] }
          : {}),
      };
    }

    if (
      options.presetId === CliAgentOnboardingPreset.SINGLE_TOOL_ALL_ROLES ||
      options.presetId === CliAgentOnboardingPreset.SINGLE_TOOL_MINIMAL
    ) {
      const primarySurface = options.selectedTools[0] ?? AdapterSurface.CODEX;
      return {
        primarySurface,
        fallbackSurfaces: options.selectedTools.filter((tool) => tool !== primarySurface),
      };
    }

    if (options.presetId === CliAgentOnboardingPreset.RESTRICTED_NETWORK_SAFE) {
      const primarySurface =
        options.selectedTools.find((tool) => tool === AdapterSurface.OLLAMA) ??
        options.selectedTools[0] ??
        AdapterSurface.CODEX;
      return {
        primarySurface,
        fallbackSurfaces: options.selectedTools.filter((tool) => tool !== primarySurface),
      };
    }

    const orderedCandidates = this.dedupeSurfaces([
      ...(options.currentBinding ? [options.currentBinding.primarySurface] : []),
      ...(options.currentBinding?.fallbackSurfaces ?? []),
      ...options.selectedTools,
    ]).filter((tool) => options.selectedTools.includes(tool));
    const primarySurface = orderedCandidates[0] ?? options.selectedTools[0] ?? AdapterSurface.CODEX;

    return {
      primarySurface,
      fallbackSurfaces: orderedCandidates.filter((tool) => tool !== primarySurface),
    };
  }

  private dedupeSurfaces(surfaces: AdapterSurface[]): AdapterSurface[] {
    return Array.from(new Set(surfaces));
  }

  private localizeText(
    localizeText: ((english: string, chinese: string) => string) | undefined,
    english: string,
    chinese: string,
  ): string {
    return localizeText ? localizeText(english, chinese) : english;
  }
}
