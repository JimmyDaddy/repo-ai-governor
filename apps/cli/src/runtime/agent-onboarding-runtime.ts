import { DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS } from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig, GovernorConfig } from '@repo-ai-governor/config';
import {
  AdapterAvailability,
  AdapterSurface,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CLI_AGENT_ONBOARDING_SCHEMA_VERSION,
  CliAgentOnboardingPreset,
} from '../constants/cli-agent-onboarding.constant.js';
import type { CliGovernanceCheckStatus } from '../constants/cli-governance-runtime.constant.js';
import type { CliConnectRoleBindingOverride } from '../types/interfaces/cli-runtime-debug.interface.js';
import type { CliAdapterVerificationResolution } from '../types/interfaces/index.js';

const MINIMAL_ROLE_IDS = new Set(['planner', 'coder', 'reviewer']);
const CLI_EXEC_DEFAULT_REQUEST_TIMEOUT_MS = 30000;

/**
 * Owns connect/doctor/verify onboarding template shaping and report-friendly matrix payloads.
 */
export class CliAgentOnboardingRuntime {
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
    const candidateAdaptersConfig = this.buildCandidateAdaptersConfig({
      currentAdaptersConfig,
      presetId: options.presetId,
      selectedTools,
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

  public createOnboardingContractPayload(options: {
    commandName: 'connect' | 'doctor' | 'verify';
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
    diagnosticSummary: string;
  }) {
    return {
      schema_version: CLI_AGENT_ONBOARDING_SCHEMA_VERSION,
      command_name: options.commandName,
      preset_id: options.presetId ?? null,
      enabled_tools: [...options.enabledTools],
      tool_transport_matrix: this.createToolTransportMatrixPayload({
        enabledTools: options.enabledTools,
        adaptersConfig: options.adaptersConfig,
        verification: options.verification,
      }),
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
      verification_status: options.verificationStatus,
      diagnostic_summary: options.diagnosticSummary,
      next_action: options.nextActions[0] ?? null,
      next_actions: [...options.nextActions],
      execution_id: options.executionId,
      workspace_id: options.workspaceId,
    };
  }

  public createVerifyMatrixPayload(options: {
    executionId: string;
    verification: CliAdapterVerificationResolution;
    adaptersConfig: AdaptersConfig;
  }) {
    const configuredToolById = new Map(
      (options.adaptersConfig.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
    return {
      execution_id: options.executionId,
      summary: options.verification.overallStatus,
      tool_transport_matrix: this.createToolTransportMatrixPayload({
        enabledTools: (options.adaptersConfig.tools ?? []).map((tool) => tool.toolId),
        adaptersConfig: options.adaptersConfig,
        verification: options.verification,
      }),
      tool_matrix: options.verification.roleEvaluations.map((roleEvaluation) => ({
        tool: roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface,
        surface: roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface,
        role_profile_id: roleEvaluation.roleProfileId,
        availability_status: roleEvaluation.status,
        capability_support:
          roleEvaluation.unsupportedCapabilities.length > 0
            ? 'unsupported'
            : roleEvaluation.degradedCapabilities.length > 0
              ? 'degraded'
              : 'supported',
        capability_gap: [...roleEvaluation.unsupportedCapabilities],
        route_coverage: [
          roleEvaluation.primarySurface,
          ...(options.adaptersConfig.routing.roleBindings[roleEvaluation.roleId]
            ?.fallbackSurfaces ?? []),
        ],
        invoke_liveness_diagnostics: this.createInvokeLivenessDiagnosticsPayload({
          configuredTool: configuredToolById.get(
            roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface,
          ),
          healthCheck: roleEvaluation.healthCheck,
          unavailableReasons: roleEvaluation.unavailableReasons,
          failureAttributions: roleEvaluation.failureAttributions,
        }),
        next_action: options.verification.nextActions[0] ?? null,
      })),
      role_binding_matrix: options.verification.roleEvaluations.map((roleEvaluation) => ({
        role_profile_id: roleEvaluation.roleProfileId,
        primary_tool: roleEvaluation.primarySurface,
        fallback_tools: [
          ...(options.adaptersConfig.routing.roleBindings[roleEvaluation.roleId]
            ?.fallbackSurfaces ?? []),
        ],
        binding_status: roleEvaluation.status,
        invoke_liveness_diagnostics: this.createInvokeLivenessDiagnosticsPayload({
          configuredTool: configuredToolById.get(
            roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface,
          ),
          healthCheck: roleEvaluation.healthCheck,
          unavailableReasons: roleEvaluation.unavailableReasons,
          failureAttributions: roleEvaluation.failureAttributions,
        }),
      })),
    };
  }

  private createToolTransportMatrixPayload(options: {
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
      return {
        tool_id: toolId,
        enabled: configuredTool?.enabled ?? true,
        configured_availability: configuredTool?.availability ?? null,
        availability_status: verificationTool?.availabilityStatus ?? null,
        transport:
          configuredTool?.transport ?? verificationTool?.healthCheck?.transportKind ?? null,
        remote_api_candidate: configuredTool?.remoteApi
          ? {
              provider: configuredTool.remoteApi.provider,
              vendor_binding: configuredTool.remoteApi.vendorBinding ?? null,
              model: configuredTool.remoteApi.model,
              credential_env_var: configuredTool.remoteApi.credentialEnvVar ?? null,
              credential_ref: configuredTool.remoteApi.credentialRef ?? null,
              allow_provider_local_config:
                configuredTool.remoteApi.allowProviderLocalConfig ?? false,
              endpoint: configuredTool.remoteApi.endpoint ?? null,
              request_timeout_ms: configuredTool.remoteApi.requestTimeoutMs ?? null,
              max_retries: configuredTool.remoteApi.maxRetries ?? null,
              discovery_mode: 'read_only',
              mutation_scope: 'manual_only',
            }
          : null,
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
          configuredTool,
          healthCheck: verificationTool?.healthCheck,
          unavailableReasons: verificationTool?.unavailableReasons,
          failureAttributions: verificationTool?.failureAttributions,
        }),
      };
    });
  }

  private createInvokeLivenessDiagnosticsPayload(options: {
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number];
    healthCheck?: CliAdapterVerificationResolution['tools'][number]['healthCheck'];
    unavailableReasons?: string[];
    failureAttributions?: string[];
  }): Record<string, unknown> {
    const resolvedTransportKind = this.resolveToolTransportKind(
      options.configuredTool,
      options.healthCheck?.transportKind,
    );
    return {
      transport_kind: resolvedTransportKind,
      provider_kind:
        options.healthCheck?.providerKind ?? options.configuredTool?.remoteApi?.provider ?? null,
      vendor_binding_kind:
        options.healthCheck?.vendorBindingKind ??
        options.configuredTool?.remoteApi?.vendorBinding ??
        null,
      model:
        options.healthCheck?.model ??
        options.configuredTool?.remoteApi?.model ??
        options.configuredTool?.localModel?.model ??
        null,
      request_timeout_ms:
        options.configuredTool?.remoteApi?.requestTimeoutMs ??
        options.configuredTool?.localModel?.requestTimeoutMs ??
        (resolvedTransportKind === AdapterTransportKind.CLI_EXEC
          ? CLI_EXEC_DEFAULT_REQUEST_TIMEOUT_MS
          : null),
      max_retries:
        options.configuredTool?.remoteApi?.maxRetries ??
        options.configuredTool?.localModel?.maxRetries ??
        (resolvedTransportKind === AdapterTransportKind.CLI_EXEC
          ? DEFAULT_AGENT_CLI_EXEC_MAX_RETRY_ATTEMPTS
          : null),
      request_cancellation_mode: options.healthCheck?.requestCancellationMode ?? null,
      route_key: options.healthCheck?.routeKey ?? null,
      selected_entrypoint: options.healthCheck?.selectedEntrypoint ?? null,
      reason_codes: [...(options.healthCheck?.reasonCodes ?? [])],
      unavailable_reasons: [...(options.unavailableReasons ?? [])],
      failure_attributions: [...(options.failureAttributions ?? [])],
    };
  }

  private resolveToolTransportKind(
    configuredTool?: NonNullable<AdaptersConfig['tools']>[number],
    healthCheckTransportKind?: string | null,
  ): AdapterTransportKind | null {
    if (
      healthCheckTransportKind === AdapterTransportKind.BASELINE ||
      healthCheckTransportKind === AdapterTransportKind.CLI_EXEC ||
      healthCheckTransportKind === AdapterTransportKind.REMOTE_API
    ) {
      return healthCheckTransportKind;
    }

    if (!configuredTool) {
      return null;
    }

    if (configuredTool.transport) {
      return configuredTool.transport;
    }

    if (configuredTool.remoteApi) {
      return AdapterTransportKind.REMOTE_API;
    }

    if (configuredTool.localModel) {
      return AdapterTransportKind.BASELINE;
    }

    if (
      configuredTool.toolId === AdapterSurface.CODEX ||
      configuredTool.toolId === AdapterSurface.CLAUDE_CODE ||
      configuredTool.toolId === AdapterSurface.GITHUB_COPILOT
    ) {
      return AdapterTransportKind.CLI_EXEC;
    }

    if (configuredTool.toolId === AdapterSurface.OLLAMA) {
      return AdapterTransportKind.BASELINE;
    }

    return null;
  }

  private buildCandidateAdaptersConfig(options: {
    currentAdaptersConfig: AdaptersConfig;
    presetId: CliAgentOnboardingPreset;
    selectedTools: AdapterSurface[];
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

    const tools = options.selectedTools.map((toolId) => {
      const currentTool =
        options.currentAdaptersConfig.tools?.find((tool) => tool.toolId === toolId) ?? null;
      return {
        toolId,
        enabled: true,
        availability: currentTool?.availability ?? AdapterAvailability.AVAILABLE,
        ...(currentTool?.localModel ? { localModel: currentTool.localModel } : {}),
        ...(currentTool?.unavailableReasons
          ? { unavailableReasons: [...currentTool.unavailableReasons] }
          : {}),
      };
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
}
