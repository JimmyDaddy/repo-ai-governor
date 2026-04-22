import { basename } from 'node:path';

import {
  type OrchestrationArtifactPaneQueryRequest,
  type OrchestrationArtifactPaneQueryResponse,
  type OrchestrationExecutionBoardEntry,
  type OrchestrationExecutionBoardQueryRequest,
  type OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionStatus,
  type OrchestrationExecutionSummary,
  type OrchestrationHitlDecisionPacket,
  type OrchestrationHitlDecisionPacketQueryRequest,
  type OrchestrationHitlInboxEntry,
  type OrchestrationHitlInboxQueryRequest,
  type OrchestrationHitlInboxQueryResponse,
  type OrchestrationListExecutionsFilter,
  type OrchestrationListExecutionsRequest,
  type OrchestrationListExecutionsResponse,
  type OrchestrationListSessionsRequest,
  type OrchestrationListSessionsResponse,
  type OrchestrationRoleLaneStatusEntry,
  type OrchestrationRoleLaneStatusQueryRequest,
  type OrchestrationRoleLaneStatusQueryResponse,
  type OrchestrationServiceEvent,
  OrchestrationServiceEventType,
  type OrchestrationSessionContinuityQueryRequest,
  type OrchestrationSessionContinuitySnapshot,
  type OrchestrationSessionSummary,
  type OrchestrationWorkbenchBacklink,
  OrchestrationWorkbenchBacklinkKind,
} from '@repo-ai-governor/orchestration-service-client';
import {
  LOCAL_ORCHESTRATION_SERVICE_EXECUTION_BOARD_DEFAULT_LIMIT,
  LOCAL_ORCHESTRATION_SERVICE_HITL_INBOX_DEFAULT_LIMIT,
  LOCAL_ORCHESTRATION_SERVICE_ROLE_LANE_STATUS_DEFAULT_LIMIT,
  LOCAL_ORCHESTRATION_SERVICE_ROLE_LANE_WAITING_FOR_HITL_STATUS,
} from './constants/index.js';
import { LocalOrchestrationServiceGovernanceAffordanceBuilder } from './local-orchestration-service-governance-affordance-builder.js';
import { LocalOrchestrationServiceHitlDecisionStateFactory } from './local-orchestration-service-hitl-decision-state-factory.js';
import { LocalOrchestrationServiceReviewRoutingRuntime } from './local-orchestration-service-review-routing-runtime.js';
import type { LocalOrchestrationServiceHitlDecisionState } from './types/index.js';

interface LocalOrchestrationServiceGovernanceQueryRuntimeDependencies {
  workspaceRoot: string;
  listExecutions: (
    request?: OrchestrationListExecutionsRequest,
  ) => Promise<OrchestrationListExecutionsResponse>;
  listSessions?: (
    request?: OrchestrationListSessionsRequest,
  ) => Promise<OrchestrationListSessionsResponse>;
  getSession?: (sessionId: string) => Promise<OrchestrationSessionSummary | undefined>;
  queryArtifactPane?: (
    request?: OrchestrationArtifactPaneQueryRequest,
  ) => Promise<OrchestrationArtifactPaneQueryResponse>;
  readExecutionEvents?: (executionId: string) => Promise<OrchestrationServiceEvent[]>;
  readHitlDecisionState?: (
    executionId: string,
  ) => Promise<LocalOrchestrationServiceHitlDecisionState | undefined>;
  nowProvider?: () => Date;
}

interface LocalOrchestrationServiceResolvedReviewContext {
  latestReviewId?: string;
  latestReviewPath?: string;
  reviewPaths: string[];
}

/**
 * Builds service-owned governance read models for workbench consumers.
 *
 * Why this exists:
 * the VS Code workbench needs one orchestration-owned place to compose execution actions,
 * runtime-lane status, session continuity, and HITL decision packets without recreating a second
 * runtime state machine inside the extension host.
 */
export class LocalOrchestrationServiceGovernanceQueryRuntime {
  private readonly affordanceBuilder: LocalOrchestrationServiceGovernanceAffordanceBuilder;
  private readonly hitlDecisionStateFactory: LocalOrchestrationServiceHitlDecisionStateFactory;
  private readonly reviewRoutingRuntime: LocalOrchestrationServiceReviewRoutingRuntime;
  private readonly nowProvider: () => Date;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceGovernanceQueryRuntimeDependencies,
  ) {
    this.affordanceBuilder = new LocalOrchestrationServiceGovernanceAffordanceBuilder({
      workspaceRoot: dependencies.workspaceRoot,
    });
    this.hitlDecisionStateFactory = new LocalOrchestrationServiceHitlDecisionStateFactory();
    this.reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot: dependencies.workspaceRoot,
    });
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
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
        .map((execution) => this.buildExecutionBoardEntry(execution, matchedExecutions)),
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
      matchedExecutions
        .slice(0, limit)
        .map((execution) => this.buildHitlInboxEntry(execution, matchedExecutions)),
    );

    return {
      pendingDecisions,
      returnedCount: pendingDecisions.length,
      totalMatchedCount: matchedExecutions.length,
    };
  }

  /**
   * Queries direct-workbench role-lane status projections for the selected execution scope.
   * @param request Optional execution selector, filter, and limit.
   * @returns One service-owned role-lane payload.
   */
  public async queryRoleLaneStatus(
    request: OrchestrationRoleLaneStatusQueryRequest = {},
  ): Promise<OrchestrationRoleLaneStatusQueryResponse> {
    const matchedExecutions = await this.resolveScopedExecutions(
      request.executionId,
      request.filter,
    );
    const limit = this.normalizeLimit(
      request.limit,
      LOCAL_ORCHESTRATION_SERVICE_ROLE_LANE_STATUS_DEFAULT_LIMIT,
    );
    const lanes = await Promise.all(
      matchedExecutions
        .slice(0, limit)
        .map((execution) => this.buildRoleLaneStatusEntry(execution, matchedExecutions)),
    );

    return {
      generatedAt: this.nowProvider().toISOString(),
      lanes,
      returnedCount: lanes.length,
      totalMatchedCount: matchedExecutions.length,
    };
  }

  /**
   * Queries service-owned session continuity for the selected execution/session.
   * @param request Optional execution/session selector.
   * @returns Continuity snapshot or `undefined` when no matching session exists.
   */
  public async querySessionContinuity(
    request: OrchestrationSessionContinuityQueryRequest = {},
  ): Promise<OrchestrationSessionContinuitySnapshot | undefined> {
    const sessionId = await this.resolveSessionId(request);
    if (!sessionId) {
      return undefined;
    }
    if (!this.dependencies.getSession) {
      return {
        sessionId,
        degradedReason: this.localizeText(
          request.locale,
          'Local orchestration service does not expose session continuity.',
          '当前本地编排服务未暴露会话连续性投影。',
        ),
      };
    }

    try {
      const session = await this.dependencies.getSession(sessionId);
      if (!session) {
        return {
          sessionId,
          degradedReason: this.localizeText(
            request.locale,
            'Session continuity is unavailable.',
            '当前无法获取会话连续性。',
          ),
        };
      }

      return {
        sessionId: session.sessionId,
        sessionStatus: session.status,
        currentRouteId: session.currentRouteId,
        latestTurnId: session.latestTurnId,
        latestEventSequence: session.latestEventSequence,
        nextCursor: session.nextCursor,
        resumeSelector: this.resolveReadOnlyResumeSelector(request, session),
      };
    } catch {
      return {
        sessionId,
        degradedReason: this.localizeText(
          request.locale,
          'Session continuity query failed.',
          '会话连续性查询失败。',
        ),
      };
    }
  }

  /**
   * Queries one service-owned HITL decision packet for the selected execution/session.
   * @param request Optional execution/session selector.
   * @returns Decision packet or `undefined` when no execution can be resolved.
   */
  public async queryHitlDecisionPacket(
    request: OrchestrationHitlDecisionPacketQueryRequest = {},
  ): Promise<OrchestrationHitlDecisionPacket | undefined> {
    const execution = await this.resolveExecutionForPacket(request);
    if (!execution) {
      return undefined;
    }
    const hitlDecisionState = await this.resolveHitlDecisionState(execution);
    if (!hitlDecisionState) {
      return undefined;
    }

    const artifactPane = await this.queryArtifactPaneForExecution(execution);
    const resolvedReviewContext = await this.resolveReviewContext(execution, artifactPane);

    return {
      executionId: execution.executionId,
      executionSessionId: execution.executionSessionId,
      ...(execution.taskId
        ? {
            taskId: execution.taskId,
          }
        : {}),
      ...(resolvedReviewContext.latestReviewId
        ? {
            reviewId: resolvedReviewContext.latestReviewId,
          }
        : {}),
      riskFacts: hitlDecisionState.riskFacts.map((riskFact) => ({
        ...riskFact,
        evidence: [...riskFact.evidence],
      })),
      policyAction: hitlDecisionState.policyAction,
      ...(hitlDecisionState.slaDeadlineAt
        ? {
            slaDeadlineAt: hitlDecisionState.slaDeadlineAt,
          }
        : {}),
      defaultTimeoutAction: hitlDecisionState.defaultTimeoutAction,
      allowedDecisions: hitlDecisionState.allowedDecisions.map((decision) => ({
        ...decision,
      })),
      impactSummary: this.buildImpactSummary(
        execution,
        resolvedReviewContext.latestReviewPath,
        request.locale,
      ),
      backlinks: this.buildDecisionPacketBacklinks(
        execution,
        artifactPane,
        resolvedReviewContext.reviewPaths,
      ),
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

  private async resolveScopedExecutions(
    executionId: string | undefined,
    filter: OrchestrationListExecutionsFilter | undefined,
  ): Promise<OrchestrationExecutionSummary[]> {
    const matchedExecutions = await this.listMatchedExecutions(filter);
    if (!executionId) {
      return matchedExecutions;
    }

    const scopedExecutions = matchedExecutions.filter(
      (execution) => execution.executionId === executionId,
    );
    if (scopedExecutions.length > 0) {
      return scopedExecutions;
    }
    if (filter) {
      return [];
    }

    const fallbackExecution = await this.findExecutionById(executionId);
    return fallbackExecution ? [fallbackExecution] : [];
  }

  private async findExecutionById(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    const response = await this.dependencies.listExecutions();
    return response.executions.find((execution) => execution.executionId === executionId);
  }

  private async buildExecutionBoardEntry(
    execution: OrchestrationExecutionSummary,
    siblingExecutions: readonly OrchestrationExecutionSummary[],
  ): Promise<OrchestrationExecutionBoardEntry> {
    const reviewDocumentPath = await this.resolveExecutionReviewDocumentPath(
      execution,
      siblingExecutions,
    );
    const handoffTargets = await this.affordanceBuilder.buildHandoffTargets(execution, {
      reviewDocumentPath,
    });
    const hitlDecisionState = await this.resolveHitlDecisionState(execution);
    return {
      execution: this.cloneExecutionSummary(execution),
      actions: this.affordanceBuilder.buildActionAffordances(
        execution,
        handoffTargets,
        hitlDecisionState?.allowedDecisions,
      ),
      handoffTargets,
    };
  }

  private async buildHitlInboxEntry(
    execution: OrchestrationExecutionSummary,
    siblingExecutions: readonly OrchestrationExecutionSummary[],
  ): Promise<OrchestrationHitlInboxEntry> {
    const reviewDocumentPath = await this.resolveExecutionReviewDocumentPath(
      execution,
      siblingExecutions,
    );
    const handoffTargets = await this.affordanceBuilder.buildHandoffTargets(execution, {
      reviewDocumentPath,
    });
    const hitlDecisionState = await this.resolveHitlDecisionState(execution);
    return {
      execution: this.cloneExecutionSummary(execution),
      actions: this.affordanceBuilder.buildActionAffordances(
        execution,
        handoffTargets,
        hitlDecisionState?.allowedDecisions,
      ),
      handoffTargets,
    } satisfies OrchestrationHitlInboxEntry;
  }

  private async buildRoleLaneStatusEntry(
    execution: OrchestrationExecutionSummary,
    siblingExecutions: readonly OrchestrationExecutionSummary[],
  ): Promise<OrchestrationRoleLaneStatusEntry> {
    const artifactPane = await this.queryArtifactPaneForExecution(execution);
    const [latestLivenessSnapshot, resolvedReviewContext] = await Promise.all([
      this.readLatestLivenessSnapshot(execution.executionId),
      this.resolveReviewContext(execution, artifactPane, siblingExecutions),
    ]);
    const preferredLivenessStatus = latestLivenessSnapshot?.status ?? execution.livenessStatus;
    const preferredLivenessEventType =
      latestLivenessSnapshot?.latestEventType ?? execution.latestLivenessEventType;

    return {
      roleId:
        latestLivenessSnapshot?.roleId ??
        latestLivenessSnapshot?.routeKey ??
        execution.executionKind.toLowerCase(),
      executionId: execution.executionId,
      ...(execution.executionSessionId
        ? {
            sessionId: execution.executionSessionId,
          }
        : {}),
      ...(execution.currentStageId
        ? {
            currentStageId: execution.currentStageId,
          }
        : {}),
      status: this.resolveRoleLaneStatus(
        execution,
        preferredLivenessStatus,
        preferredLivenessEventType,
      ),
      ...(this.resolveRoleLaneLatestEventType(
        execution,
        preferredLivenessStatus,
        preferredLivenessEventType,
      )
        ? {
            latestEventType: this.resolveRoleLaneLatestEventType(
              execution,
              preferredLivenessStatus,
              preferredLivenessEventType,
            ),
          }
        : {}),
      updatedAt: execution.updatedAt,
      pendingHitl: execution.pendingHitl,
      artifactBacklinks: this.createBacklinks(
        OrchestrationWorkbenchBacklinkKind.ARTIFACT,
        execution.executionId,
        artifactPane?.evidenceBacklinks.artifactPaths ?? [],
      ),
      reviewBacklinks: this.createBacklinks(
        OrchestrationWorkbenchBacklinkKind.REVIEW,
        execution.executionId,
        resolvedReviewContext.reviewPaths,
      ),
    };
  }

  private resolveRoleLaneStatus(
    execution: OrchestrationExecutionSummary,
    preferredLivenessStatus: string | undefined,
    preferredLivenessEventType: string | undefined,
  ): string {
    if (
      this.shouldIgnoreStaleHitlLaneState(
        execution,
        preferredLivenessStatus,
        preferredLivenessEventType,
      )
    ) {
      return execution.status;
    }

    return preferredLivenessStatus ?? execution.status;
  }

  private resolveRoleLaneLatestEventType(
    execution: OrchestrationExecutionSummary,
    preferredLivenessStatus: string | undefined,
    preferredLivenessEventType: string | undefined,
  ): string | undefined {
    if (
      this.shouldIgnoreStaleHitlLaneState(
        execution,
        preferredLivenessStatus,
        preferredLivenessEventType,
      )
    ) {
      return execution.latestEventType;
    }

    return preferredLivenessEventType ?? execution.latestEventType;
  }

  private async resolveHitlDecisionState(
    execution: OrchestrationExecutionSummary,
  ): Promise<LocalOrchestrationServiceHitlDecisionState | undefined> {
    const persistedHitlDecisionState = await this.dependencies.readHitlDecisionState?.(
      execution.executionId,
    );
    if (persistedHitlDecisionState) {
      return persistedHitlDecisionState;
    }
    if (!execution.pendingHitl && execution.status !== OrchestrationExecutionStatus.HITL_REQUIRED) {
      return undefined;
    }

    const pendingOriginEvent = await this.readLatestHitlRequiredEvent(execution.executionId);
    if (!pendingOriginEvent) {
      return undefined;
    }

    return this.hitlDecisionStateFactory.buildPendingDecisionState({
      executionId: execution.executionId,
      taskId: execution.taskId,
      recordedAt: pendingOriginEvent.timestamp,
    });
  }

  private shouldIgnoreStaleHitlLaneState(
    execution: OrchestrationExecutionSummary,
    preferredLivenessStatus: string | undefined,
    preferredLivenessEventType: string | undefined,
  ): boolean {
    if (execution.pendingHitl || execution.status === OrchestrationExecutionStatus.HITL_REQUIRED) {
      return false;
    }

    return (
      preferredLivenessStatus === LOCAL_ORCHESTRATION_SERVICE_ROLE_LANE_WAITING_FOR_HITL_STATUS ||
      preferredLivenessEventType === OrchestrationServiceEventType.HITL_REQUIRED
    );
  }

  private async resolveSessionId(
    request: OrchestrationSessionContinuityQueryRequest,
  ): Promise<string | undefined> {
    if (request.sessionId) {
      return request.sessionId;
    }
    if (request.executionId) {
      const execution = await this.findExecutionById(request.executionId);
      return execution?.executionSessionId;
    }
    if (request.preferLatest && this.dependencies.listSessions) {
      const latestSessions = await this.dependencies.listSessions({
        limit: 1,
      });
      return latestSessions.sessions[0]?.sessionId;
    }

    return undefined;
  }

  private async resolveExecutionForPacket(
    request: OrchestrationHitlDecisionPacketQueryRequest,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    if (request.executionId) {
      return this.findExecutionById(request.executionId);
    }
    if (request.sessionId) {
      const response = await this.dependencies.listExecutions();
      return response.executions.find(
        (execution) => execution.executionSessionId === request.sessionId,
      );
    }
    if (request.preferLatest) {
      const latestHitlExecution = (await this.dependencies.listExecutions()).executions.find(
        (execution) => execution.pendingHitl,
      );
      return latestHitlExecution;
    }

    return undefined;
  }

  private async queryArtifactPaneForExecution(
    execution: OrchestrationExecutionSummary,
  ): Promise<OrchestrationArtifactPaneQueryResponse | undefined> {
    if (!this.dependencies.queryArtifactPane) {
      return undefined;
    }

    try {
      return await this.dependencies.queryArtifactPane({
        executionId: execution.executionId,
        sessionId: execution.executionSessionId,
      });
    } catch {
      return undefined;
    }
  }

  private async readLatestHitlRequiredEvent(
    executionId: string,
  ): Promise<OrchestrationServiceEvent | undefined> {
    if (!this.dependencies.readExecutionEvents) {
      return undefined;
    }

    const events = await this.dependencies.readExecutionEvents(executionId);
    return [...events]
      .reverse()
      .find((event) => event.type === OrchestrationServiceEventType.HITL_REQUIRED);
  }

  private async readLatestLivenessSnapshot(
    executionId: string,
  ): Promise<OrchestrationServiceEvent['livenessSnapshot'] | undefined> {
    if (!this.dependencies.readExecutionEvents) {
      return undefined;
    }

    const events = await this.dependencies.readExecutionEvents(executionId);
    for (const event of [...events].reverse()) {
      if (event.livenessSnapshot) {
        return event.livenessSnapshot;
      }
    }

    return undefined;
  }

  private buildImpactSummary(
    execution: OrchestrationExecutionSummary,
    reviewFilePath: string | undefined,
    locale: string | undefined,
  ): string {
    const scope =
      execution.taskId ?? execution.sprintId ?? execution.projectId ?? execution.workspaceRoot;
    if (reviewFilePath) {
      return this.localizeText(
        locale,
        `Execution ${execution.executionId} is waiting on one HITL decision for ${scope}. Review evidence remains anchored at ${reviewFilePath}.`,
        `执行 ${execution.executionId} 正在等待 ${scope} 的一条 HITL 决策，评审证据仍锚定在 ${reviewFilePath}。`,
      );
    }

    return this.localizeText(
      locale,
      `Execution ${execution.executionId} is waiting on one HITL decision for ${scope}.`,
      `执行 ${execution.executionId} 正在等待 ${scope} 的一条 HITL 决策。`,
    );
  }

  private buildDecisionPacketBacklinks(
    execution: OrchestrationExecutionSummary,
    artifactPane: OrchestrationArtifactPaneQueryResponse | undefined,
    reviewPaths: readonly string[],
  ): OrchestrationWorkbenchBacklink[] {
    const backlinks: OrchestrationWorkbenchBacklink[] = [
      {
        backlinkId: `${execution.executionId}:workspace`,
        backlinkKind: OrchestrationWorkbenchBacklinkKind.WORKSPACE,
        label: execution.workspaceRoot,
        target: execution.workspaceRoot,
      },
      {
        backlinkId: `${execution.executionId}:session`,
        backlinkKind: OrchestrationWorkbenchBacklinkKind.SESSION,
        label: execution.executionSessionId,
        target: execution.executionSessionId,
      },
    ];

    if (execution.taskId) {
      backlinks.push({
        backlinkId: `${execution.executionId}:task`,
        backlinkKind: OrchestrationWorkbenchBacklinkKind.TASK,
        label: execution.taskId,
        target: execution.taskId,
      });
    }
    for (const artifactBacklink of this.createBacklinks(
      OrchestrationWorkbenchBacklinkKind.ARTIFACT,
      execution.executionId,
      artifactPane?.evidenceBacklinks.artifactPaths ?? [],
    )) {
      backlinks.push(artifactBacklink);
    }
    for (const reviewBacklink of this.createBacklinks(
      OrchestrationWorkbenchBacklinkKind.REVIEW,
      execution.executionId,
      reviewPaths,
    )) {
      backlinks.push(reviewBacklink);
    }

    return backlinks;
  }

  private async resolveReviewContext(
    execution: OrchestrationExecutionSummary,
    artifactPane: OrchestrationArtifactPaneQueryResponse | undefined,
    siblingExecutions?: readonly OrchestrationExecutionSummary[],
  ): Promise<LocalOrchestrationServiceResolvedReviewContext> {
    const fallbackReviewPath =
      artifactPane?.policyTrace?.reviewDocumentPath ??
      (await this.resolveExecutionReviewDocumentPath(execution, siblingExecutions));
    const latestReviewPath =
      artifactPane?.reviewLifecycle.latestReviewFilePath ?? fallbackReviewPath;
    const latestReviewId =
      artifactPane?.reviewLifecycle.latestReviewId ??
      (latestReviewPath?.endsWith('.md') ? basename(latestReviewPath) : undefined);
    const reviewPaths = this.deduplicateDefinedStrings([
      ...(artifactPane?.evidenceBacklinks.reviewPaths ?? []),
      latestReviewPath,
    ]);

    return {
      ...(latestReviewId
        ? {
            latestReviewId,
          }
        : {}),
      ...(latestReviewPath
        ? {
            latestReviewPath,
          }
        : {}),
      reviewPaths,
    };
  }

  private async resolveExecutionReviewDocumentPath(
    execution: OrchestrationExecutionSummary,
    siblingExecutions?: readonly OrchestrationExecutionSummary[],
  ): Promise<string | undefined> {
    const resolvedSiblingExecutions =
      siblingExecutions && this.includesCompetingOwnershipPeer(execution, siblingExecutions)
        ? siblingExecutions
        : await this.listExecutionOwnershipPeers(execution);

    return this.reviewRoutingRuntime.resolveExecutionReviewDocumentPath(execution, {
      siblingExecutions: resolvedSiblingExecutions,
    });
  }

  private async listExecutionOwnershipPeers(
    execution: OrchestrationExecutionSummary,
  ): Promise<OrchestrationExecutionSummary[]> {
    const response = await this.dependencies.listExecutions();

    return response.executions.filter(
      (candidate) =>
        candidate.sprintId === execution.sprintId &&
        (!execution.projectId || candidate.projectId === execution.projectId),
    );
  }

  private includesCompetingOwnershipPeer(
    execution: OrchestrationExecutionSummary,
    siblingExecutions: readonly OrchestrationExecutionSummary[],
  ): boolean {
    return siblingExecutions.some(
      (candidate) =>
        candidate.executionId !== execution.executionId &&
        candidate.sprintId === execution.sprintId &&
        (!execution.projectId || candidate.projectId === execution.projectId),
    );
  }

  private createBacklinks(
    backlinkKind: OrchestrationWorkbenchBacklinkKind,
    executionId: string,
    targets: readonly string[],
  ): OrchestrationWorkbenchBacklink[] {
    return targets.map((target, index) => ({
      backlinkId: `${executionId}:${backlinkKind}:${String(index + 1)}`,
      backlinkKind,
      label: target,
      target,
    }));
  }

  private deduplicateDefinedStrings(candidates: Array<string | undefined>): string[] {
    return [...new Set(candidates.filter((candidate): candidate is string => Boolean(candidate)))];
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

  private resolveReadOnlyResumeSelector(
    request: OrchestrationSessionContinuityQueryRequest,
    session: OrchestrationSessionSummary,
  ): string {
    if (request.sessionId) {
      return request.sessionId;
    }
    if (request.preferLatest) {
      return 'latest';
    }

    return session.sessionId;
  }

  private normalizeLocale(locale?: string): string {
    return locale?.trim().length ? locale : 'en-US';
  }

  private localizeText(locale: string | undefined, english: string, chinese: string): string {
    return this.normalizeLocale(locale).toLowerCase().startsWith('zh') ? chinese : english;
  }
}
