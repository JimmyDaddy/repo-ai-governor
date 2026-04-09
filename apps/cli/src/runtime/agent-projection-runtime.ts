import type { AdaptersConfig, ResolvedWorkspace } from '@repo-ai-governor/config';
import {
  type AgentDescriptor,
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
        const selectedToolConfig =
          roleEvaluation.selectedSurface === null
            ? null
            : ((options.adaptersConfig.tools ?? []).find(
                (tool) => tool.toolId === roleEvaluation.selectedSurface,
              ) ?? null);

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
          selectedTransport: this.resolveSelectedTransport(
            roleEvaluation.selectedSurface,
            selectedToolConfig,
            roleEvaluation.healthCheck?.transportKind ?? null,
          ),
          selectedProviderKind:
            roleEvaluation.healthCheck?.providerKind ??
            selectedToolConfig?.remoteApi?.provider ??
            null,
          selectedVendorBindingKind:
            roleEvaluation.healthCheck?.vendorBindingKind ??
            this.resolveConfiguredVendorBindingKind(
              roleEvaluation.selectedSurface,
              selectedToolConfig?.remoteApi?.provider ?? null,
              selectedToolConfig?.remoteApi?.vendorBinding ?? null,
            ),
          selectedModel:
            roleEvaluation.healthCheck?.model ??
            selectedToolConfig?.remoteApi?.model ??
            selectedToolConfig?.localModel?.model ??
            null,
          capabilitySnapshotSource: this.resolveCapabilitySnapshotSource(
            roleEvaluation.selectedSurface,
            selectedToolConfig,
            roleEvaluation.healthCheck?.transportKind ?? null,
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
      healthCheckTransportKind === AdapterTransportKind.REMOTE_API
    ) {
      return AdapterCapabilitySnapshotSource.HEALTH_CHECK;
    }
    if (selectedToolConfig) {
      return AdapterCapabilitySnapshotSource.CONFIG;
    }
    return AdapterCapabilitySnapshotSource.SURFACE_DEFAULT;
  }
}
