import type {
  OrchestrationExecutionBoardEntry,
  OrchestrationExecutionBoardQueryRequest,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationHitlInboxEntry,
  OrchestrationHitlInboxQueryRequest,
  OrchestrationHitlInboxQueryResponse,
  OrchestrationListExecutionsFilter,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
} from '@repo-ai-governor/orchestration-service-client';
import {
  LOCAL_ORCHESTRATION_SERVICE_EXECUTION_BOARD_DEFAULT_LIMIT,
  LOCAL_ORCHESTRATION_SERVICE_HITL_INBOX_DEFAULT_LIMIT,
} from './constants/index.js';
import { LocalOrchestrationServiceGovernanceAffordanceBuilder } from './local-orchestration-service-governance-affordance-builder.js';

interface LocalOrchestrationServiceGovernanceQueryRuntimeDependencies {
  workspaceRoot: string;
  listExecutions: (
    request?: OrchestrationListExecutionsRequest,
  ) => Promise<OrchestrationListExecutionsResponse>;
}

/**
 * Builds service-owned governance read models for execution board and HITL inbox consumers.
 *
 * Why this exists:
 * desktop and future IDE clients must consume one orchestration-owned read model for action and
 * handoff affordances instead of inferring execution state or filesystem paths in the renderer.
 */
export class LocalOrchestrationServiceGovernanceQueryRuntime {
  private readonly affordanceBuilder: LocalOrchestrationServiceGovernanceAffordanceBuilder;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceGovernanceQueryRuntimeDependencies,
  ) {
    this.affordanceBuilder = new LocalOrchestrationServiceGovernanceAffordanceBuilder({
      workspaceRoot: dependencies.workspaceRoot,
    });
  }

  /**
   * Queries the execution-board read model for governance surfaces.
   * @param request Optional execution filter and limit.
   * @returns One execution-board payload with service-owned actions and handoff targets.
   */
  public async queryExecutionBoard(
    request: OrchestrationExecutionBoardQueryRequest = {},
  ): Promise<OrchestrationExecutionBoardQueryResponse> {
    const matchedExecutions = await this.listMatchedExecutions(request.filter);
    const limit = this.normalizeLimit(
      request.limit,
      LOCAL_ORCHESTRATION_SERVICE_EXECUTION_BOARD_DEFAULT_LIMIT,
    );
    const executions = await Promise.all(
      matchedExecutions
        .slice(0, limit)
        .map((execution) => this.buildExecutionBoardEntry(execution)),
    );

    return {
      executions,
      returnedCount: executions.length,
      totalMatchedCount: matchedExecutions.length,
    };
  }

  /**
   * Queries the HITL inbox read model for governance surfaces.
   * @param request Optional execution filter and limit.
   * @returns One HITL inbox payload with decision affordances and handoff targets.
   */
  public async queryHitlInbox(
    request: OrchestrationHitlInboxQueryRequest = {},
  ): Promise<OrchestrationHitlInboxQueryResponse> {
    const matchedExecutions = (await this.listMatchedExecutions(request.filter)).filter(
      (execution) => execution.pendingHitl,
    );
    const limit = this.normalizeLimit(
      request.limit,
      LOCAL_ORCHESTRATION_SERVICE_HITL_INBOX_DEFAULT_LIMIT,
    );
    const pendingDecisions = await Promise.all(
      matchedExecutions.slice(0, limit).map((execution) => this.buildHitlInboxEntry(execution)),
    );

    return {
      pendingDecisions,
      returnedCount: pendingDecisions.length,
      totalMatchedCount: matchedExecutions.length,
    };
  }

  private async listMatchedExecutions(
    filter: OrchestrationListExecutionsFilter | undefined,
  ): Promise<OrchestrationExecutionSummary[]> {
    const response = await this.dependencies.listExecutions(
      filter
        ? {
            filter,
          }
        : undefined,
    );
    return response.executions;
  }

  private async buildExecutionBoardEntry(
    execution: OrchestrationExecutionSummary,
  ): Promise<OrchestrationExecutionBoardEntry> {
    const handoffTargets = await this.affordanceBuilder.buildHandoffTargets(execution);
    return {
      execution: this.cloneExecutionSummary(execution),
      actions: this.affordanceBuilder.buildActionAffordances(execution, handoffTargets),
      handoffTargets,
    };
  }

  private async buildHitlInboxEntry(
    execution: OrchestrationExecutionSummary,
  ): Promise<OrchestrationHitlInboxEntry> {
    const handoffTargets = await this.affordanceBuilder.buildHandoffTargets(execution);
    return {
      execution: this.cloneExecutionSummary(execution),
      actions: this.affordanceBuilder.buildActionAffordances(execution, handoffTargets),
      handoffTargets,
    } satisfies OrchestrationHitlInboxEntry;
  }

  private cloneExecutionSummary(
    execution: OrchestrationExecutionSummary,
  ): OrchestrationExecutionSummary {
    return {
      ...execution,
      ...(execution.memoryProvider
        ? {
            memoryProvider: {
              ...execution.memoryProvider,
            },
          }
        : {}),
      ...(execution.recoveredNextNodeIds
        ? {
            recoveredNextNodeIds: [...execution.recoveredNextNodeIds],
          }
        : {}),
    };
  }

  private normalizeLimit(candidate: number | undefined, defaultLimit: number): number {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
      return defaultLimit;
    }

    return Math.max(Math.trunc(candidate), 0);
  }
}
