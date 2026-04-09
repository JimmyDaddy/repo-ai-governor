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
  AdapterSurface,
  AdapterTransportKind,
  AdapterTransportSelectionSource,
  AdapterVendorBindingKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CLI_AGENT_ONBOARDING_SCHEMA_VERSION,
  CliAgentOnboardingPreset,
} from '../constants/cli-agent-onboarding.constant.js';
import { CliGovernanceCheckStatus } from '../constants/cli-governance-runtime.constant.js';
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
    const enabledToolRows = this.createEnabledToolRowsPayload({
      enabledTools: options.enabledTools,
      adaptersConfig: options.adaptersConfig,
      verification: options.verification,
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
    const verificationToolById = new Map(
      options.verification.tools.map((tool) => [tool.toolId, tool]),
    );
    const enabledToolRows = this.createEnabledToolRowsPayload({
      enabledTools: (options.adaptersConfig.tools ?? []).map((tool) => tool.toolId),
      adaptersConfig: options.adaptersConfig,
      verification: options.verification,
    });
    return {
      execution_id: options.executionId,
      summary: options.verification.overallStatus,
      tool_transport_matrix: this.createToolTransportMatrixPayload(enabledToolRows),
      tool_matrix: options.verification.roleEvaluations.map((roleEvaluation) => {
        const resolvedSurface = roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface;
        const verificationTool = verificationToolById.get(resolvedSurface);
        const toolHealthCheck = verificationTool?.healthCheck ?? roleEvaluation.healthCheck;
        const toolUnavailableReasons =
          verificationTool?.unavailableReasons ?? roleEvaluation.unavailableReasons;
        const toolFailureAttributions =
          verificationTool?.failureAttributions ?? roleEvaluation.failureAttributions;

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
            roleEvaluation.unsupportedCapabilities.length > 0
              ? 'unsupported'
              : roleEvaluation.degradedCapabilities.length > 0
                ? 'degraded'
                : 'supported',
          selected_by: roleEvaluation.selectedBy,
          binding_unavailable_reasons: [...roleEvaluation.unavailableReasons],
          binding_failure_attributions: [...roleEvaluation.failureAttributions],
          capability_gap: [...roleEvaluation.unsupportedCapabilities],
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
        };
      }),
      role_binding_matrix: options.verification.roleEvaluations.map((roleEvaluation) => ({
        role_profile_id: roleEvaluation.roleProfileId,
        primary_tool: roleEvaluation.primarySurface,
        fallback_tools: [
          ...(options.adaptersConfig.routing.roleBindings[roleEvaluation.roleId]
            ?.fallbackSurfaces ?? []),
        ],
        binding_status: roleEvaluation.status,
        invoke_liveness_diagnostics: this.createInvokeLivenessDiagnosticsPayload({
          toolId: roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface,
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
      return {
        tool_id: toolId,
        enabled: configuredTool?.enabled ?? true,
        configured_availability: configuredTool?.availability ?? null,
        availability_status: verificationTool?.availabilityStatus ?? null,
        transport_kind: this.resolveToolTransportKind(
          toolId,
          configuredTool,
          verificationTool?.healthCheck?.transportKind,
        ),
        provider_kind:
          verificationTool?.healthCheck?.providerKind ??
          configuredTool?.remoteApi?.provider ??
          null,
        vendor_binding_kind:
          verificationTool?.healthCheck?.vendorBindingKind ??
          this.resolveConfiguredVendorBindingKind(
            toolId,
            configuredTool?.remoteApi?.provider ?? null,
            configuredTool?.remoteApi?.vendorBinding ?? null,
          ),
        model:
          verificationTool?.healthCheck?.model ??
          configuredTool?.remoteApi?.model ??
          configuredTool?.localModel?.model ??
          null,
        credential_mode: this.resolveConfiguredCredentialMode(configuredTool),
        endpoint_source: this.resolveConfiguredEndpointSource(configuredTool),
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
    }));
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
      provider_kind:
        options.healthCheck?.providerKind ?? options.configuredTool?.remoteApi?.provider ?? null,
      vendor_binding_kind:
        options.healthCheck?.vendorBindingKind ??
        this.resolveConfiguredVendorBindingKind(
          options.toolId,
          options.configuredTool?.remoteApi?.provider ?? null,
          options.configuredTool?.remoteApi?.vendorBinding ?? null,
        ) ??
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
        ...(currentTool?.transport ? { transport: currentTool.transport } : {}),
        ...(currentTool?.remoteApi ? { remoteApi: { ...currentTool.remoteApi } } : {}),
        ...(currentTool?.localModel ? { localModel: { ...currentTool.localModel } } : {}),
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
