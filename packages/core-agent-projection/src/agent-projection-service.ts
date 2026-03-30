import type { AdapterRoleBindingConfig } from '@repo-ai-governor/config';
import { GovernorErrorCode, RoleSource, RuntimeError } from '@repo-ai-governor/shared';
import type { AgentDescriptor, AgentProjectionInput } from './types/index.js';

const READ_ONLY_ROLE_IDS = new Set(['planner', 'architect', 'reviewer', 'verifier']);
const TEST_ROLE_IDS = new Set(['tester']);
const COMMIT_ROLE_IDS = new Set(['delivery']);
const PR_ROLE_IDS = new Set(['publisher']);

/**
 * Projects runtime role/routing facts into one stable agent descriptor view.
 */
export class AgentProjectionService {
  public project(input: AgentProjectionInput): AgentDescriptor {
    if (!input.roleId.trim()) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'AgentProjectionService requires one non-empty roleId.',
      );
    }

    if (!input.roleProfileId.trim()) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'AgentProjectionService requires one non-empty roleProfileId.',
      );
    }

    const roleBinding = input.adaptersConfig.routing.roleBindings[input.roleId];
    if (!roleBinding) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
        `Missing adapters.routing.roleBindings entry for role "${input.roleId}".`,
        {
          roleId: input.roleId,
          roleProfileId: input.roleProfileId,
          routeKey: input.routeKey,
        },
      );
    }

    return {
      agentId: this.createAgentId(input),
      agentRole: input.roleId,
      roleProfileId: input.roleProfileId,
      roleSource: this.resolveRoleSource(input),
      primarySurface: roleBinding.primarySurface,
      fallbackSurfaces: [...(roleBinding.fallbackSurfaces ?? [])],
      capabilities: [...input.requiredCapabilities],
      permissionLevel: this.resolvePermissionLevel(input.roleId),
      inputSchemaRef: input.inputSchemaRef ?? null,
      outputSchemaRef: input.outputSchemaRef ?? null,
      errorContractRef: input.errorContractRef ?? null,
      maxExecutionTimeSeconds: input.maxExecutionTimeSeconds ?? 300,
      stageTimeoutSeconds: input.stageTimeoutSeconds ?? input.maxExecutionTimeSeconds ?? 300,
      tokenBudget: input.tokenBudget ?? null,
      costBudget: input.costBudget ?? null,
      timeBudgetSeconds: input.timeBudgetSeconds ?? null,
      retryPolicyRef: input.retryPolicyRef ?? null,
      timeoutPolicyRef: input.timeoutPolicyRef ?? null,
      budgetPolicyRef: input.budgetPolicyRef ?? null,
      workspaceId: input.workspaceId,
      workspaceMode: input.workspaceMode,
      executionId: input.executionId ?? null,
      sessionId: input.sessionId ?? null,
      selectedBy: input.selectedBy ?? null,
      selectedSurface: input.selectedSurface ?? roleBinding.primarySurface,
      projectionStatus: input.projectionStatus ?? null,
      failureReasons: [...(input.failureReasons ?? [])],
      unsupportedCapabilities: [...(input.unsupportedCapabilities ?? [])],
      degradedCapabilities: [...(input.degradedCapabilities ?? [])],
    };
  }

  public projectMany(inputs: AgentProjectionInput[]): AgentDescriptor[] {
    return inputs.map((input) => this.project(input));
  }

  public resolveBindingOrThrow(
    adaptersConfig: AgentProjectionInput['adaptersConfig'],
    roleId: string,
  ): AdapterRoleBindingConfig {
    const binding = adaptersConfig.routing.roleBindings[roleId];
    if (!binding) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
        `Missing adapters.routing.roleBindings entry for role "${roleId}".`,
        { roleId },
      );
    }

    return binding;
  }

  private createAgentId(input: AgentProjectionInput): string {
    return [input.stageId.trim(), input.roleId.trim(), input.routeKey.trim()].join(':');
  }

  private resolveRoleSource(input: AgentProjectionInput): RoleSource {
    if (input.roleSource) {
      return input.roleSource;
    }

    return input.roleProfileId.endsWith('-default') ? RoleSource.DEFAULT : RoleSource.CUSTOM;
  }

  private resolvePermissionLevel(roleId: string): AgentDescriptor['permissionLevel'] {
    if (READ_ONLY_ROLE_IDS.has(roleId)) {
      return 'read';
    }

    if (TEST_ROLE_IDS.has(roleId)) {
      return 'test';
    }

    if (COMMIT_ROLE_IDS.has(roleId)) {
      return 'commit';
    }

    if (PR_ROLE_IDS.has(roleId)) {
      return 'pr';
    }

    return 'edit';
  }
}
