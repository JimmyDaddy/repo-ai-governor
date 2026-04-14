import type { AdaptersConfig, ResolvedWorkspace } from '@repo-ai-governor/config';
import {
  type AgentDescriptor,
  type AgentDescriptorAcpHostCompanion,
  AgentProjectionService,
  type AgentSessionProjection,
} from '@repo-ai-governor/core-agent-projection';
import type { ProcessIrNode } from '@repo-ai-governor/core-process';
import {
  AdapterCapabilitySnapshotSource,
  AdapterProviderKind,
  AdapterSurface,
  AdapterTransportKind,
  AdapterVendorBindingKind,
} from '@repo-ai-governor/shared';
import {
  CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
  CliAcpHostDiagnosticCode,
  CliAcpHostDistributionBoundary,
  CliAcpHostReadinessStatus,
} from '../constants/cli-acp-host.constant.js';
import type { CliAdapterVerificationResolution } from '../types/interfaces/index.js';

/**
 * Adapts core agent projection services into CLI/report-friendly view payloads.
 */
export class CliAgentProjectionRuntime {
  public constructor(
    private readonly projectionService: AgentProjectionService = new AgentProjectionService(),
  ) {}

  public createDescriptorsFromRoleEvaluations(options: {
    adaptersConfig: AdaptersConfig;
    verification: CliAdapterVerificationResolution;
    workspace: Pick<ResolvedWorkspace, 'workspaceId' | 'mode'>;
    executionId?: string | null;
    sessionId?: string | null;
  }): AgentDescriptor[] {
    const roleById = new Map(options.adaptersConfig.roles.map((role) => [role.roleId, role]));
    return options.verification.roleEvaluations
      .map((roleEvaluation) => {
        const role = roleById.get(roleEvaluation.roleId);
        if (!role) {
          return null;
        }
        const referenceSurface = roleEvaluation.selectedSurface ?? roleEvaluation.primarySurface;
        const selectedToolConfig =
          (options.adaptersConfig.tools ?? []).find((tool) => tool.toolId === referenceSurface) ??
          null;
        const selectedTransport = this.resolveSelectedTransport(
          referenceSurface,
          selectedToolConfig,
          roleEvaluation.healthCheck?.transportKind ?? null,
        );

        return this.projectionService.project({
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          routeKey: role.roleId,
          stageId: role.roleId,
          adaptersConfig: options.adaptersConfig,
          requiredCapabilities: [...role.requiredCapabilities],
          workspaceId: options.workspace.workspaceId,
          workspaceMode: options.workspace.mode,
          executionId: options.executionId ?? null,
          sessionId: options.sessionId ?? null,
          selectedSurface: roleEvaluation.selectedSurface,
          selectedBy: roleEvaluation.selectedBy,
          projectionStatus: roleEvaluation.status,
          failureReasons: [...roleEvaluation.unavailableReasons],
          unsupportedCapabilities: [...roleEvaluation.unsupportedCapabilities],
          degradedCapabilities: [...roleEvaluation.degradedCapabilities],
          selectedTransport,
          selectedProviderKind: this.resolveSelectedProviderKind({
            selectedToolConfig,
            healthCheck: roleEvaluation.healthCheck,
            selectedTransport,
          }),
          selectedVendorBindingKind: this.resolveSelectedVendorBindingKind({
            selectedSurface: referenceSurface,
            selectedToolConfig,
            healthCheck: roleEvaluation.healthCheck,
            selectedTransport,
          }),
          selectedModel: this.resolveSelectedModel({
            selectedToolConfig,
            healthCheck: roleEvaluation.healthCheck,
            selectedTransport,
          }),
          capabilitySnapshotSource: this.resolveCapabilitySnapshotSource(
            referenceSurface,
            selectedToolConfig,
            roleEvaluation.healthCheck?.transportKind ?? null,
          ),
          acpHostCompanion: this.resolveAcpHostCompanion(
            selectedTransport,
            roleEvaluation.healthCheck,
          ),
        });
      })
      .filter((descriptor): descriptor is AgentDescriptor => descriptor !== null);
  }

  public createDescriptorsFromRoleIds(options: {
    roleIds: string[];
    adaptersConfig: AdaptersConfig;
    workspace: Pick<ResolvedWorkspace, 'workspaceId' | 'mode'>;
    executionId?: string | null;
    sessionId?: string | null;
    projectionStatus?: string | null;
  }): AgentDescriptor[] {
    const roleById = new Map(options.adaptersConfig.roles.map((role) => [role.roleId, role]));
    return options.roleIds
      .map((roleId) => {
        const role = roleById.get(roleId);
        if (!role) {
          return null;
        }

        return this.projectionService.project({
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          routeKey: role.roleId,
          stageId: role.roleId,
          adaptersConfig: options.adaptersConfig,
          requiredCapabilities: [...role.requiredCapabilities],
          workspaceId: options.workspace.workspaceId,
          workspaceMode: options.workspace.mode,
          executionId: options.executionId ?? null,
          sessionId: options.sessionId ?? null,
          projectionStatus: options.projectionStatus ?? null,
        });
      })
      .filter((descriptor): descriptor is AgentDescriptor => descriptor !== null);
  }

  public createDescriptorsFromProcessNodes(options: {
    nodes: ProcessIrNode[];
    adaptersConfig: AdaptersConfig;
    workspace: Pick<ResolvedWorkspace, 'workspaceId' | 'mode'>;
    executionId: string;
    sessionId: string;
  }): AgentDescriptor[] {
    const roleByProfileId = new Map(
      options.adaptersConfig.roles.map((role) => [role.roleProfileId, role]),
    );
    return options.nodes
      .map((node) => {
        const role = roleByProfileId.get(node.roleProfileId);
        if (!role) {
          return null;
        }

        return this.projectionService.project({
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          routeKey: node.routeKey,
          stageId: node.stageId,
          adaptersConfig: options.adaptersConfig,
          requiredCapabilities: [...role.requiredCapabilities],
          workspaceId: options.workspace.workspaceId,
          workspaceMode: options.workspace.mode,
          executionId: options.executionId,
          sessionId: options.sessionId,
          inputSchemaRef: node.inputSchemaRef,
          outputSchemaRef: node.outputSchemaRef,
          retryPolicyRef: node.retryPolicyRef,
          timeoutPolicyRef: node.timeoutPolicyRef,
          budgetPolicyRef: node.budgetPolicyRef,
          maxExecutionTimeSeconds: node.limits?.maxWallTimeSeconds ?? 300,
          stageTimeoutSeconds: node.limits?.maxWallTimeSeconds ?? 300,
          timeBudgetSeconds: node.limits?.maxWallTimeSeconds ?? null,
          projectionStatus: 'planned',
        });
      })
      .filter((descriptor): descriptor is AgentDescriptor => descriptor !== null);
  }

  public createCliAgentView(options: {
    descriptors: AgentDescriptor[];
    sessionProjection?: AgentSessionProjection | null;
  }) {
    return {
      descriptors: options.descriptors,
      sessionProjection: options.sessionProjection ?? null,
    };
  }

  private resolveSelectedTransport(
    selectedSurface: AdapterSurface | null,
    selectedToolConfig: NonNullable<AdaptersConfig['tools']>[number] | null,
    healthCheckTransportKind: string | null,
  ): AdapterTransportKind | null {
    if (
      healthCheckTransportKind === AdapterTransportKind.BASELINE ||
      healthCheckTransportKind === AdapterTransportKind.CLI_EXEC ||
      healthCheckTransportKind === AdapterTransportKind.ACP_EXEC ||
      healthCheckTransportKind === AdapterTransportKind.REMOTE_API
    ) {
      return healthCheckTransportKind;
    }
    if (selectedToolConfig?.transport) {
      return selectedToolConfig.transport;
    }
    if (selectedToolConfig?.remoteApi) {
      return AdapterTransportKind.REMOTE_API;
    }
    if (selectedToolConfig?.localModel) {
      return AdapterTransportKind.BASELINE;
    }
    if (selectedSurface === AdapterSurface.OLLAMA) {
      return AdapterTransportKind.BASELINE;
    }
    if (
      selectedSurface === AdapterSurface.CODEX ||
      selectedSurface === AdapterSurface.CLAUDE_CODE ||
      selectedSurface === AdapterSurface.GITHUB_COPILOT
    ) {
      return AdapterTransportKind.CLI_EXEC;
    }
    return null;
  }

  private resolveConfiguredVendorBindingKind(
    selectedSurface: AdapterSurface | null,
    providerKind: AdapterProviderKind | null,
    configuredVendorBindingKind: AdapterVendorBindingKind | null,
  ): AdapterVendorBindingKind | null {
    if (configuredVendorBindingKind) {
      return configuredVendorBindingKind;
    }
    if (selectedSurface === AdapterSurface.CODEX || providerKind === AdapterProviderKind.OPENAI) {
      return AdapterVendorBindingKind.OPENAI_RESPONSES;
    }
    if (
      selectedSurface === AdapterSurface.CLAUDE_CODE ||
      providerKind === AdapterProviderKind.ANTHROPIC
    ) {
      return AdapterVendorBindingKind.ANTHROPIC_MESSAGES;
    }
    if (providerKind === AdapterProviderKind.GITHUB_MODELS) {
      return AdapterVendorBindingKind.GITHUB_MODELS_INFERENCE;
    }
    return null;
  }

  private resolveSelectedProviderKind(options: {
    selectedToolConfig: NonNullable<AdaptersConfig['tools']>[number] | null;
    healthCheck: CliAdapterVerificationResolution['roleEvaluations'][number]['healthCheck'];
    selectedTransport: AdapterTransportKind | null;
  }): AdapterProviderKind | null {
    if (options.healthCheck?.providerKind) {
      return options.healthCheck.providerKind;
    }
    if (options.selectedTransport === AdapterTransportKind.REMOTE_API) {
      return options.selectedToolConfig?.remoteApi?.provider ?? null;
    }
    return null;
  }

  private resolveSelectedVendorBindingKind(options: {
    selectedSurface: AdapterSurface | null;
    selectedToolConfig: NonNullable<AdaptersConfig['tools']>[number] | null;
    healthCheck: CliAdapterVerificationResolution['roleEvaluations'][number]['healthCheck'];
    selectedTransport: AdapterTransportKind | null;
  }): AdapterVendorBindingKind | null {
    if (options.healthCheck?.vendorBindingKind) {
      return options.healthCheck.vendorBindingKind;
    }
    if (options.selectedTransport !== AdapterTransportKind.REMOTE_API) {
      return null;
    }
    return this.resolveConfiguredVendorBindingKind(
      options.selectedSurface,
      options.selectedToolConfig?.remoteApi?.provider ?? null,
      options.selectedToolConfig?.remoteApi?.vendorBinding ?? null,
    );
  }

  private resolveSelectedModel(options: {
    selectedToolConfig: NonNullable<AdaptersConfig['tools']>[number] | null;
    healthCheck: CliAdapterVerificationResolution['roleEvaluations'][number]['healthCheck'];
    selectedTransport: AdapterTransportKind | null;
  }): string | null {
    if (options.healthCheck?.model) {
      return options.healthCheck.model;
    }
    if (options.selectedTransport === AdapterTransportKind.REMOTE_API) {
      return options.selectedToolConfig?.remoteApi?.model ?? null;
    }
    if (options.selectedTransport === AdapterTransportKind.BASELINE) {
      return options.selectedToolConfig?.localModel?.model ?? null;
    }
    return null;
  }

  private resolveCapabilitySnapshotSource(
    selectedSurface: AdapterSurface | null,
    selectedToolConfig: NonNullable<AdaptersConfig['tools']>[number] | null,
    healthCheckTransportKind: string | null,
  ): AdapterCapabilitySnapshotSource | null {
    if (selectedSurface === null) {
      return null;
    }
    if (
      healthCheckTransportKind === AdapterTransportKind.BASELINE ||
      healthCheckTransportKind === AdapterTransportKind.CLI_EXEC ||
      healthCheckTransportKind === AdapterTransportKind.ACP_EXEC ||
      healthCheckTransportKind === AdapterTransportKind.REMOTE_API
    ) {
      return AdapterCapabilitySnapshotSource.HEALTH_CHECK;
    }
    if (selectedToolConfig) {
      return AdapterCapabilitySnapshotSource.CONFIG;
    }
    return selectedSurface ? AdapterCapabilitySnapshotSource.SURFACE_DEFAULT : null;
  }

  private resolveAcpHostCompanion(
    selectedTransport: AdapterTransportKind | null,
    healthCheck: CliAdapterVerificationResolution['roleEvaluations'][number]['healthCheck'],
  ): AgentDescriptorAcpHostCompanion | null {
    if (selectedTransport !== AdapterTransportKind.ACP_EXEC) {
      return null;
    }

    return {
      hostReadinessStatus:
        this.findHealthCheckDiagnosticDetail(
          healthCheck,
          CliAcpHostDiagnosticCode.HOST_READINESS_STATUS,
        ) ?? CliAcpHostReadinessStatus.BASELINE_ONLY,
      distributionBoundary:
        this.findHealthCheckDiagnosticDetail(
          healthCheck,
          CliAcpHostDiagnosticCode.DISTRIBUTION_BOUNDARY,
        ) ?? CliAcpHostDistributionBoundary.PACKAGED_DISTRIBUTION_PENDING,
      companionStateSummary:
        this.findHealthCheckDiagnosticDetail(
          healthCheck,
          CliAcpHostDiagnosticCode.COMPANION_STATE_SUMMARY,
        ) ?? CLI_ACP_HOST_COMPANION_STATE_SUMMARY,
    };
  }

  private findHealthCheckDiagnosticDetail(
    healthCheck: CliAdapterVerificationResolution['roleEvaluations'][number]['healthCheck'],
    code: CliAcpHostDiagnosticCode,
  ): string | null {
    const diagnostic = healthCheck?.diagnostics.find((candidate) => candidate.code === code);
    return typeof diagnostic?.detail === 'string' && diagnostic.detail.length > 0
      ? diagnostic.detail
      : null;
  }
}
