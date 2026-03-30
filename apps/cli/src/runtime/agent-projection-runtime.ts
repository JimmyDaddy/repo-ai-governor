import type { AdaptersConfig, ResolvedWorkspace } from '@repo-ai-governor/config';
import {
  type AgentDescriptor,
  AgentProjectionService,
  type AgentSessionProjection,
} from '@repo-ai-governor/core-agent-projection';
import type { ProcessIrNode } from '@repo-ai-governor/core-process';
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
}
