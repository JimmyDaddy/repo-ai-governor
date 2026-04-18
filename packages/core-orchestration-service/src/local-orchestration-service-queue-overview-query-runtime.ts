import {
  OrchestrationClientSurface,
  OrchestrationExecutionStatus,
  type OrchestrationExecutionSummary,
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceFollowUpSlaState,
  OrchestrationGovernanceNotificationStatus,
  type OrchestrationGovernanceParallelLaneEntry,
  type OrchestrationGovernanceQueueEntry,
  OrchestrationGovernanceQueueKind,
  type OrchestrationGovernanceWorkspaceSummary,
  type OrchestrationListExecutionsFilter,
  type OrchestrationListExecutionsRequest,
  type OrchestrationListExecutionsResponse,
  type OrchestrationQueueOverviewQueryRequest,
  type OrchestrationQueueOverviewQueryResponse,
  type OrchestrationWorkspaceOperationSnapshot,
} from '@repo-ai-governor/orchestration-service-client';
import {
  LOCAL_ORCHESTRATION_SERVICE_FOLLOW_UP_DUE_SOON_THRESHOLD_MINUTES,
  LOCAL_ORCHESTRATION_SERVICE_FOLLOW_UP_SLA_MINUTES,
  LOCAL_ORCHESTRATION_SERVICE_PARALLEL_LANE_DEFAULT_LIMIT,
  LOCAL_ORCHESTRATION_SERVICE_QUEUE_OVERVIEW_DEFAULT_LIMIT,
  LOCAL_ORCHESTRATION_SERVICE_WORKSPACE_SUMMARY_DEFAULT_LIMIT,
} from './constants/index.js';
import { LocalOrchestrationServiceGovernanceAffordanceBuilder } from './local-orchestration-service-governance-affordance-builder.js';
import { LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog } from './local-orchestration-service-governance-temporary-bridge-catalog.js';
import {
  type LocalOrchestrationServiceReviewDocumentDescriptor,
  LocalOrchestrationServiceReviewRoutingRuntime,
} from './local-orchestration-service-review-routing-runtime.js';

interface LocalOrchestrationServiceQueueOverviewQueryRuntimeDependencies {
  workspaceRoot: string;
  repositoryRoot?: string;
  listExecutions: (
    request?: OrchestrationListExecutionsRequest,
  ) => Promise<OrchestrationListExecutionsResponse>;
  getLatestWorkspaceOperationSnapshot?: () => OrchestrationWorkspaceOperationSnapshot | undefined;
  nowProvider?: () => Date;
}

interface FollowUpTimingSnapshot {
  followUpSlaState: OrchestrationGovernanceFollowUpSlaState;
  followUpDueAt?: string;
  pendingSince?: string;
  updatedAt?: string;
}

interface QueueOverviewAggregateEntry {
  workspaceId: string;
  workspaceRoot: string;
  followUpSlaState: OrchestrationGovernanceFollowUpSlaState;
  updatedAt?: string;
}

interface WorkspaceSummaryRecord {
  workspaceId: string;
  workspaceRoot: string;
  executions: OrchestrationExecutionSummary[];
  automationInboxCount: number;
  reviewQueueCount: number;
  overdueFollowUpCount: number;
  latestQueueUpdatedAt?: string;
}

const ACTIVE_EXECUTION_STATUSES = new Set<OrchestrationExecutionStatus>([
  OrchestrationExecutionStatus.ACCEPTED,
  OrchestrationExecutionStatus.RUNNING,
  OrchestrationExecutionStatus.HITL_REQUIRED,
  OrchestrationExecutionStatus.INTERRUPTED,
]);

const ATTENTION_EXECUTION_STATUSES = new Set<OrchestrationExecutionStatus>([
  OrchestrationExecutionStatus.HITL_REQUIRED,
  OrchestrationExecutionStatus.INTERRUPTED,
  OrchestrationExecutionStatus.FAILED,
]);

const OPEN_REVIEW_LIFECYCLE_STATUSES = new Set(['review_pending', 'verified']);

/**
 * Builds service-owned queue and multi-workspace overview read models for governance surfaces.
 *
 * Why this exists:
 * desktop command-center consumers need one orchestration-owned queue truth for automation
 * follow-up, review backlog, notification ownership, and parallel multi-workspace supervision.
 */
export class LocalOrchestrationServiceQueueOverviewQueryRuntime {
  private readonly affordanceBuilder: LocalOrchestrationServiceGovernanceAffordanceBuilder;
  private readonly temporaryBridgeCatalog: LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog;
  private readonly reviewRoutingRuntime: LocalOrchestrationServiceReviewRoutingRuntime;
  private readonly nowProvider: () => Date;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceQueueOverviewQueryRuntimeDependencies,
  ) {
    this.affordanceBuilder = new LocalOrchestrationServiceGovernanceAffordanceBuilder({
      workspaceRoot: dependencies.workspaceRoot,
    });
    this.temporaryBridgeCatalog = new LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog({
      workspaceRoot: dependencies.workspaceRoot,
      ...(dependencies.repositoryRoot
        ? {
            repositoryRoot: dependencies.repositoryRoot,
          }
        : {}),
    });
    this.reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot: dependencies.workspaceRoot,
    });
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
  }

  /**
   * Queries the governance queue and overview read model for desktop command-center consumers.
   * @param request Optional execution filter and collection limits.
   * @returns Queue/overview DTOs owned by the local orchestration service.
   */
  public async query(
    request: OrchestrationQueueOverviewQueryRequest = {},
  ): Promise<OrchestrationQueueOverviewQueryResponse> {
    const matchedExecutions = await this.listMatchedExecutions(request.filter);
    const reviewDocuments = (await this.reviewRoutingRuntime.listReviewDocuments()).filter(
      (review) => this.shouldIncludeReviewDocument(review),
    );
    const reviewExecutionMap = await this.buildReviewExecutionMap(matchedExecutions);
    const automationLimit = this.normalizeLimit(
      request.limit,
      LOCAL_ORCHESTRATION_SERVICE_QUEUE_OVERVIEW_DEFAULT_LIMIT,
    );
    const laneLimit = this.normalizeLimit(
      request.laneLimit,
      LOCAL_ORCHESTRATION_SERVICE_PARALLEL_LANE_DEFAULT_LIMIT,
    );
    const workspaceLimit = this.normalizeLimit(
      request.workspaceLimit,
      LOCAL_ORCHESTRATION_SERVICE_WORKSPACE_SUMMARY_DEFAULT_LIMIT,
    );

    const automationCandidates = matchedExecutions
      .filter((execution) => this.shouldIncludeAutomationQueueEntry(execution))
      .sort((left, right) => this.compareExecutionByRecency(left, right));
    const reviewCandidates = reviewDocuments.filter((review) =>
      this.matchesFilter(request.filter, review, reviewExecutionMap),
    );
    const automationAggregateEntries = automationCandidates.map((execution) =>
      this.buildAutomationQueueAggregateEntry(execution),
    );
    const reviewAggregateEntries = reviewCandidates.map((review) =>
      this.buildReviewQueueAggregateEntry(review, reviewExecutionMap.get(review.absolutePath)),
    );
    const automationInbox = await Promise.all(
      automationCandidates
        .slice(0, automationLimit)
        .map((execution) => this.buildAutomationQueueEntry(execution)),
    );

    const reviewQueue = await Promise.all(
      reviewCandidates
        .slice(0, automationLimit)
        .map((review) =>
          this.buildReviewQueueEntry(review, reviewExecutionMap.get(review.absolutePath)),
        ),
    );

    const parallelLanes = this.buildParallelLanes(matchedExecutions).slice(0, laneLimit);
    const fullWorkspaceSummary = this.buildWorkspaceSummary(
      matchedExecutions,
      automationAggregateEntries,
      reviewAggregateEntries,
    );
    const workspaceSummary = fullWorkspaceSummary.slice(0, workspaceLimit);
    const pendingItemCount = automationAggregateEntries.length + reviewAggregateEntries.length;
    const dueSoonItemCount =
      this.countQueueEntriesByFollowUpState(
        automationAggregateEntries,
        OrchestrationGovernanceFollowUpSlaState.DUE_SOON,
      ) +
      this.countQueueEntriesByFollowUpState(
        reviewAggregateEntries,
        OrchestrationGovernanceFollowUpSlaState.DUE_SOON,
      );
    const overdueItemCount =
      this.countQueueEntriesByFollowUpState(
        automationAggregateEntries,
        OrchestrationGovernanceFollowUpSlaState.OVERDUE,
      ) +
      this.countQueueEntriesByFollowUpState(
        reviewAggregateEntries,
        OrchestrationGovernanceFollowUpSlaState.OVERDUE,
      );
    const latestWorkspaceOperation = this.dependencies.getLatestWorkspaceOperationSnapshot?.();

    return {
      generatedAt: this.nowProvider().toISOString(),
      automationInbox,
      reviewQueue,
      parallelLanes,
      workspaceSummary,
      temporaryBridges: this.temporaryBridgeCatalog.list(),
      notificationOwnership: {
        ownerSurface: OrchestrationClientSurface.DESKTOP,
        pendingItemCount,
        dueSoonItemCount,
        overdueItemCount,
        activeWorkspaceCount: fullWorkspaceSummary.filter((entry) => entry.activeExecutionCount > 0)
          .length,
        defaultFollowUpSlaMinutes: LOCAL_ORCHESTRATION_SERVICE_FOLLOW_UP_SLA_MINUTES,
        notificationStatus: this.resolveNotificationStatus(overdueItemCount, pendingItemCount),
      },
      ...(latestWorkspaceOperation
        ? {
            latestWorkspaceOperation,
          }
        : {}),
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

  private async buildReviewExecutionMap(
    executions: OrchestrationExecutionSummary[],
  ): Promise<Map<string, OrchestrationExecutionSummary>> {
    const reviewExecutionMap = new Map<string, OrchestrationExecutionSummary>();
    const resolvedEntries = await Promise.all(
      executions.map(async (execution) => ({
        execution,
        reviewDocumentPath:
          await this.reviewRoutingRuntime.resolveExecutionReviewDocumentPath(execution),
      })),
    );

    for (const resolvedEntry of resolvedEntries) {
      if (!resolvedEntry.reviewDocumentPath) {
        continue;
      }
      if (!reviewExecutionMap.has(resolvedEntry.reviewDocumentPath)) {
        reviewExecutionMap.set(resolvedEntry.reviewDocumentPath, resolvedEntry.execution);
      }
    }

    return reviewExecutionMap;
  }

  private shouldIncludeAutomationQueueEntry(execution: OrchestrationExecutionSummary): boolean {
    const followUpTiming = this.resolveFollowUpTiming({
      pendingSince:
        execution.lastTransportActivityAt ??
        execution.lastSemanticProgressAt ??
        execution.lastEventAt ??
        execution.updatedAt,
      updatedAt: execution.updatedAt,
    });

    return (
      ATTENTION_EXECUTION_STATUSES.has(execution.status) ||
      Boolean(execution.pendingHitl) ||
      Boolean(execution.livenessSuspectReasonCode) ||
      followUpTiming.followUpSlaState !== OrchestrationGovernanceFollowUpSlaState.HEALTHY
    );
  }

  private shouldIncludeReviewDocument(
    review: LocalOrchestrationServiceReviewDocumentDescriptor,
  ): boolean {
    if (!review.lifecycleStatus) {
      return false;
    }

    return OPEN_REVIEW_LIFECYCLE_STATUSES.has(this.normalizeReviewLifecycleStatus(review));
  }

  private matchesFilter(
    filter: OrchestrationListExecutionsFilter | undefined,
    review: LocalOrchestrationServiceReviewDocumentDescriptor,
    reviewExecutionMap: Map<string, OrchestrationExecutionSummary>,
  ): boolean {
    if (!filter) {
      return true;
    }

    const matchedExecution = reviewExecutionMap.get(review.absolutePath);
    if (matchedExecution) {
      return this.executionMatchesFilter(matchedExecution, filter);
    }

    if (filter.taskId && !this.matchesFreeTextFact([review.fileName, review.task], filter.taskId)) {
      return false;
    }
    if (
      filter.projectId &&
      !this.matchesFreeTextFact([review.fileName, review.scope], filter.projectId)
    ) {
      return false;
    }
    if (
      filter.sprintId &&
      !this.matchesFreeTextFact([review.fileName, review.scope], filter.sprintId)
    ) {
      return false;
    }

    return !filter.workspaceId;
  }

  private executionMatchesFilter(
    execution: OrchestrationExecutionSummary,
    filter: OrchestrationListExecutionsFilter,
  ): boolean {
    if (filter.workspaceId && execution.workspaceId !== filter.workspaceId) {
      return false;
    }
    if (filter.status && execution.status !== filter.status) {
      return false;
    }
    if (filter.taskId && execution.taskId !== filter.taskId) {
      return false;
    }
    if (filter.projectId && execution.projectId !== filter.projectId) {
      return false;
    }
    if (filter.sprintId && execution.sprintId !== filter.sprintId) {
      return false;
    }

    return true;
  }

  private matchesFreeTextFact(values: Array<string | undefined>, fact: string): boolean {
    const normalizedFact = this.normalizeSearchText(fact);
    return values.some((value) => this.normalizeSearchText(value).includes(normalizedFact));
  }

  private normalizeSearchText(value: string | undefined): string {
    return (value ?? '')
      .replace(/[^a-z0-9]+/giu, ' ')
      .trim()
      .toLowerCase();
  }

  private async buildAutomationQueueEntry(
    execution: OrchestrationExecutionSummary,
  ): Promise<OrchestrationGovernanceQueueEntry> {
    const handoffTargets = await this.affordanceBuilder.buildHandoffTargets(execution);
    const followUpTiming = this.resolveFollowUpTiming({
      pendingSince:
        execution.lastTransportActivityAt ??
        execution.lastSemanticProgressAt ??
        execution.lastEventAt ??
        execution.updatedAt,
      updatedAt: execution.updatedAt,
    });
    const attentionLevel = this.resolveAutomationAttentionLevel(execution, followUpTiming);

    return {
      queueEntryId: `automation:${execution.executionId}`,
      queueKind: OrchestrationGovernanceQueueKind.AUTOMATION_INBOX,
      workspaceId: execution.workspaceId,
      workspaceRoot: execution.workspaceRoot,
      executionId: execution.executionId,
      executionKind: execution.executionKind,
      executionStatus: execution.status,
      ...(execution.taskId
        ? {
            taskId: execution.taskId,
          }
        : {}),
      ...(execution.projectId
        ? {
            projectId: execution.projectId,
          }
        : {}),
      ...(execution.sprintId
        ? {
            sprintId: execution.sprintId,
          }
        : {}),
      attentionLevel,
      notificationStatus: this.resolveEntryNotificationStatus(
        attentionLevel,
        followUpTiming.followUpSlaState,
      ),
      followUpSlaState: followUpTiming.followUpSlaState,
      ...(followUpTiming.followUpDueAt
        ? {
            followUpDueAt: followUpTiming.followUpDueAt,
          }
        : {}),
      ...(followUpTiming.pendingSince
        ? {
            pendingSince: followUpTiming.pendingSince,
          }
        : {}),
      ...(followUpTiming.updatedAt
        ? {
            updatedAt: followUpTiming.updatedAt,
          }
        : {}),
      actions: this.affordanceBuilder.buildActionAffordances(execution, handoffTargets),
      handoffTargets,
    };
  }

  private buildAutomationQueueAggregateEntry(
    execution: OrchestrationExecutionSummary,
  ): QueueOverviewAggregateEntry {
    const followUpTiming = this.resolveFollowUpTiming({
      pendingSince:
        execution.lastTransportActivityAt ??
        execution.lastSemanticProgressAt ??
        execution.lastEventAt ??
        execution.updatedAt,
      updatedAt: execution.updatedAt,
    });

    return {
      workspaceId: execution.workspaceId,
      workspaceRoot: execution.workspaceRoot,
      followUpSlaState: followUpTiming.followUpSlaState,
      ...(followUpTiming.updatedAt
        ? {
            updatedAt: followUpTiming.updatedAt,
          }
        : {}),
    };
  }

  private async buildReviewQueueEntry(
    review: LocalOrchestrationServiceReviewDocumentDescriptor,
    matchedExecution?: OrchestrationExecutionSummary,
  ): Promise<OrchestrationGovernanceQueueEntry> {
    const handoffTargets = matchedExecution
      ? await this.affordanceBuilder.buildHandoffTargets(matchedExecution)
      : [];
    const followUpTiming = this.resolveFollowUpTiming({
      pendingSince: review.updatedAt,
      updatedAt: review.updatedAt,
    });
    const attentionLevel =
      followUpTiming.followUpSlaState === OrchestrationGovernanceFollowUpSlaState.OVERDUE
        ? OrchestrationGovernanceAttentionLevel.CRITICAL
        : OrchestrationGovernanceAttentionLevel.WARNING;

    return {
      queueEntryId: `review:${review.fileName}`,
      queueKind: OrchestrationGovernanceQueueKind.REVIEW_QUEUE,
      workspaceId: matchedExecution?.workspaceId ?? 'governance-workspace',
      workspaceRoot: matchedExecution?.workspaceRoot ?? this.dependencies.workspaceRoot,
      ...(matchedExecution
        ? {
            executionId: matchedExecution.executionId,
            executionKind: matchedExecution.executionKind,
            executionStatus: matchedExecution.status,
          }
        : {}),
      ...(review.task
        ? {
            taskId: review.task,
          }
        : {}),
      ...(matchedExecution?.projectId
        ? {
            projectId: matchedExecution.projectId,
          }
        : {}),
      ...(matchedExecution?.sprintId
        ? {
            sprintId: matchedExecution.sprintId,
          }
        : {}),
      reviewId: review.fileName,
      reviewLifecycleStatus: this.normalizeReviewLifecycleStatus(review),
      reviewFilePath: review.absolutePath,
      attentionLevel,
      notificationStatus: this.resolveEntryNotificationStatus(
        attentionLevel,
        followUpTiming.followUpSlaState,
      ),
      followUpSlaState: followUpTiming.followUpSlaState,
      ...(followUpTiming.followUpDueAt
        ? {
            followUpDueAt: followUpTiming.followUpDueAt,
          }
        : {}),
      pendingSince: review.updatedAt,
      updatedAt: review.updatedAt,
      actions: matchedExecution
        ? this.affordanceBuilder.buildActionAffordances(matchedExecution, handoffTargets)
        : [],
      handoffTargets,
    };
  }

  private buildReviewQueueAggregateEntry(
    review: LocalOrchestrationServiceReviewDocumentDescriptor,
    matchedExecution?: OrchestrationExecutionSummary,
  ): QueueOverviewAggregateEntry {
    const followUpTiming = this.resolveFollowUpTiming({
      pendingSince: review.updatedAt,
      updatedAt: review.updatedAt,
    });

    return {
      workspaceId: matchedExecution?.workspaceId ?? 'governance-workspace',
      workspaceRoot: matchedExecution?.workspaceRoot ?? this.dependencies.workspaceRoot,
      followUpSlaState: followUpTiming.followUpSlaState,
      updatedAt: review.updatedAt,
    };
  }

  private buildParallelLanes(
    executions: OrchestrationExecutionSummary[],
  ): OrchestrationGovernanceParallelLaneEntry[] {
    const activeExecutions = executions
      .filter((execution) => ACTIVE_EXECUTION_STATUSES.has(execution.status))
      .sort((left, right) => this.compareExecutionByRecency(left, right));
    const laneMap = new Map<string, OrchestrationExecutionSummary[]>();

    for (const execution of activeExecutions) {
      const laneId = `${execution.workspaceId}:${execution.workspaceRoot}`;
      const existingExecutions = laneMap.get(laneId) ?? [];
      existingExecutions.push(execution);
      laneMap.set(laneId, existingExecutions);
    }

    return Array.from(laneMap.entries())
      .map(([laneId, laneExecutions]) => {
        const runningExecutionCount = laneExecutions.filter(
          (execution) => execution.status === OrchestrationExecutionStatus.RUNNING,
        ).length;
        const pendingHitlCount = laneExecutions.filter((execution) => execution.pendingHitl).length;
        const interruptedCount = laneExecutions.filter(
          (execution) => execution.status === OrchestrationExecutionStatus.INTERRUPTED,
        ).length;
        const attentionExecutionCount = laneExecutions.filter(
          (execution) =>
            execution.pendingHitl ||
            execution.status === OrchestrationExecutionStatus.INTERRUPTED ||
            Boolean(execution.livenessSuspectReasonCode),
        ).length;
        const latestExecution = laneExecutions[0];
        return {
          laneId,
          workspaceId: latestExecution?.workspaceId ?? 'unknown-workspace',
          workspaceRoot: latestExecution?.workspaceRoot ?? this.dependencies.workspaceRoot,
          activeExecutionIds: laneExecutions.map((execution) => execution.executionId),
          activeExecutionCount: laneExecutions.length,
          runningExecutionCount,
          pendingHitlCount,
          interruptedCount,
          attentionExecutionCount,
          attentionLevel:
            attentionExecutionCount > 0
              ? OrchestrationGovernanceAttentionLevel.WARNING
              : OrchestrationGovernanceAttentionLevel.INFO,
          ...(latestExecution
            ? {
                latestExecutionId: latestExecution.executionId,
                latestUpdatedAt: latestExecution.updatedAt,
              }
            : {}),
        } satisfies OrchestrationGovernanceParallelLaneEntry;
      })
      .sort(
        (left, right) =>
          right.activeExecutionCount - left.activeExecutionCount ||
          (right.latestUpdatedAt ?? '').localeCompare(left.latestUpdatedAt ?? ''),
      );
  }

  private buildWorkspaceSummary(
    executions: OrchestrationExecutionSummary[],
    automationInbox: QueueOverviewAggregateEntry[],
    reviewQueue: QueueOverviewAggregateEntry[],
  ): OrchestrationGovernanceWorkspaceSummary[] {
    const workspaceSummaryMap = new Map<string, WorkspaceSummaryRecord>();

    for (const execution of executions) {
      const workspaceRecord = this.getOrCreateWorkspaceSummaryRecord(
        workspaceSummaryMap,
        execution.workspaceId,
        execution.workspaceRoot,
      );
      workspaceRecord.executions.push(execution);
    }

    for (const automationEntry of automationInbox) {
      const workspaceRecord = this.getOrCreateWorkspaceSummaryRecord(
        workspaceSummaryMap,
        automationEntry.workspaceId,
        automationEntry.workspaceRoot,
      );
      workspaceRecord.automationInboxCount += 1;
      if (automationEntry.followUpSlaState === OrchestrationGovernanceFollowUpSlaState.OVERDUE) {
        workspaceRecord.overdueFollowUpCount += 1;
      }
      workspaceRecord.latestQueueUpdatedAt = this.selectLatestTimestamp(
        workspaceRecord.latestQueueUpdatedAt,
        automationEntry.updatedAt,
      );
    }

    for (const reviewEntry of reviewQueue) {
      const workspaceRecord = this.getOrCreateWorkspaceSummaryRecord(
        workspaceSummaryMap,
        reviewEntry.workspaceId,
        reviewEntry.workspaceRoot,
      );
      workspaceRecord.reviewQueueCount += 1;
      if (reviewEntry.followUpSlaState === OrchestrationGovernanceFollowUpSlaState.OVERDUE) {
        workspaceRecord.overdueFollowUpCount += 1;
      }
      workspaceRecord.latestQueueUpdatedAt = this.selectLatestTimestamp(
        workspaceRecord.latestQueueUpdatedAt,
        reviewEntry.updatedAt,
      );
    }

    return Array.from(workspaceSummaryMap.values())
      .map((workspaceRecord) => {
        const latestExecution = [...workspaceRecord.executions].sort((left, right) =>
          this.compareExecutionByRecency(left, right),
        )[0];
        const latestUpdatedAt = this.selectLatestTimestamp(
          latestExecution?.updatedAt ?? latestExecution?.acceptedAt,
          workspaceRecord.latestQueueUpdatedAt,
        );
        return {
          workspaceId: workspaceRecord.workspaceId,
          workspaceRoot: workspaceRecord.workspaceRoot,
          totalExecutionCount: workspaceRecord.executions.length,
          activeExecutionCount: workspaceRecord.executions.filter((execution) =>
            ACTIVE_EXECUTION_STATUSES.has(execution.status),
          ).length,
          pendingHitlCount: workspaceRecord.executions.filter((execution) => execution.pendingHitl)
            .length,
          automationInboxCount: workspaceRecord.automationInboxCount,
          reviewQueueCount: workspaceRecord.reviewQueueCount,
          overdueFollowUpCount: workspaceRecord.overdueFollowUpCount,
          attentionLevel:
            workspaceRecord.overdueFollowUpCount > 0
              ? OrchestrationGovernanceAttentionLevel.CRITICAL
              : workspaceRecord.automationInboxCount > 0 || workspaceRecord.reviewQueueCount > 0
                ? OrchestrationGovernanceAttentionLevel.WARNING
                : OrchestrationGovernanceAttentionLevel.INFO,
          ...(latestExecution
            ? {
                latestExecutionId: latestExecution.executionId,
              }
            : {}),
          ...(latestUpdatedAt
            ? {
                latestUpdatedAt,
              }
            : {}),
        } satisfies OrchestrationGovernanceWorkspaceSummary;
      })
      .sort(
        (left, right) =>
          right.activeExecutionCount - left.activeExecutionCount ||
          (right.latestUpdatedAt ?? '').localeCompare(left.latestUpdatedAt ?? ''),
      );
  }

  private getOrCreateWorkspaceSummaryRecord(
    workspaceSummaryMap: Map<string, WorkspaceSummaryRecord>,
    workspaceId: string,
    workspaceRoot: string,
  ): WorkspaceSummaryRecord {
    const workspaceKey = `${workspaceId}:${workspaceRoot}`;
    const existingRecord = workspaceSummaryMap.get(workspaceKey);
    if (existingRecord) {
      return existingRecord;
    }

    const nextRecord: WorkspaceSummaryRecord = {
      workspaceId,
      workspaceRoot,
      executions: [],
      automationInboxCount: 0,
      reviewQueueCount: 0,
      overdueFollowUpCount: 0,
    };
    workspaceSummaryMap.set(workspaceKey, nextRecord);
    return nextRecord;
  }

  private selectLatestTimestamp(
    left: string | undefined,
    right: string | undefined,
  ): string | undefined {
    if (!left) {
      return right;
    }
    if (!right) {
      return left;
    }

    return left.localeCompare(right) >= 0 ? left : right;
  }

  private countQueueEntriesByFollowUpState(
    entries: QueueOverviewAggregateEntry[],
    followUpSlaState: OrchestrationGovernanceFollowUpSlaState,
  ): number {
    return entries.filter((entry) => entry.followUpSlaState === followUpSlaState).length;
  }

  private resolveAutomationAttentionLevel(
    execution: OrchestrationExecutionSummary,
    followUpTiming: FollowUpTimingSnapshot,
  ): OrchestrationGovernanceAttentionLevel {
    if (
      execution.status === OrchestrationExecutionStatus.FAILED ||
      followUpTiming.followUpSlaState === OrchestrationGovernanceFollowUpSlaState.OVERDUE
    ) {
      return OrchestrationGovernanceAttentionLevel.CRITICAL;
    }

    if (
      execution.pendingHitl ||
      execution.status === OrchestrationExecutionStatus.INTERRUPTED ||
      Boolean(execution.livenessSuspectReasonCode) ||
      followUpTiming.followUpSlaState === OrchestrationGovernanceFollowUpSlaState.DUE_SOON
    ) {
      return OrchestrationGovernanceAttentionLevel.WARNING;
    }

    return OrchestrationGovernanceAttentionLevel.INFO;
  }

  private resolveFollowUpTiming(options: {
    pendingSince?: string;
    updatedAt?: string;
  }): FollowUpTimingSnapshot {
    const pendingSince = options.pendingSince ?? options.updatedAt;
    const updatedAt = options.updatedAt ?? pendingSince;
    const pendingTimestamp = pendingSince ? Date.parse(pendingSince) : Number.NaN;
    if (!Number.isFinite(pendingTimestamp)) {
      return {
        followUpSlaState: OrchestrationGovernanceFollowUpSlaState.HEALTHY,
        ...(pendingSince
          ? {
              pendingSince,
            }
          : {}),
        ...(updatedAt
          ? {
              updatedAt,
            }
          : {}),
      };
    }

    const nowTimestamp = this.nowProvider().getTime();
    const dueSoonTimestamp =
      pendingTimestamp +
      (LOCAL_ORCHESTRATION_SERVICE_FOLLOW_UP_SLA_MINUTES -
        LOCAL_ORCHESTRATION_SERVICE_FOLLOW_UP_DUE_SOON_THRESHOLD_MINUTES) *
        60 *
        1000;
    const overdueTimestamp =
      pendingTimestamp + LOCAL_ORCHESTRATION_SERVICE_FOLLOW_UP_SLA_MINUTES * 60 * 1000;
    let followUpSlaState = OrchestrationGovernanceFollowUpSlaState.HEALTHY;

    if (nowTimestamp >= overdueTimestamp) {
      followUpSlaState = OrchestrationGovernanceFollowUpSlaState.OVERDUE;
    } else if (nowTimestamp >= dueSoonTimestamp) {
      followUpSlaState = OrchestrationGovernanceFollowUpSlaState.DUE_SOON;
    }

    return {
      followUpSlaState,
      followUpDueAt: new Date(overdueTimestamp).toISOString(),
      ...(pendingSince
        ? {
            pendingSince,
          }
        : {}),
      ...(updatedAt
        ? {
            updatedAt,
          }
        : {}),
    };
  }

  private resolveNotificationStatus(
    overdueItemCount: number,
    pendingItemCount: number,
  ): OrchestrationGovernanceNotificationStatus {
    if (overdueItemCount > 0) {
      return OrchestrationGovernanceNotificationStatus.ESCALATION_RECOMMENDED;
    }
    if (pendingItemCount > 0) {
      return OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED;
    }
    return OrchestrationGovernanceNotificationStatus.IDLE;
  }

  private resolveEntryNotificationStatus(
    attentionLevel: OrchestrationGovernanceAttentionLevel,
    followUpSlaState: OrchestrationGovernanceFollowUpSlaState,
  ): OrchestrationGovernanceNotificationStatus {
    if (
      attentionLevel === OrchestrationGovernanceAttentionLevel.CRITICAL ||
      followUpSlaState === OrchestrationGovernanceFollowUpSlaState.OVERDUE
    ) {
      return OrchestrationGovernanceNotificationStatus.ESCALATION_RECOMMENDED;
    }

    return OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED;
  }

  private normalizeReviewLifecycleStatus(
    review: LocalOrchestrationServiceReviewDocumentDescriptor,
  ): string {
    return (review.lifecycleStatus ?? '').trim().toLowerCase().replace(/\s+/gu, '_');
  }

  private compareExecutionByRecency(
    left: OrchestrationExecutionSummary,
    right: OrchestrationExecutionSummary,
  ): number {
    return (right.updatedAt ?? right.acceptedAt).localeCompare(left.updatedAt ?? left.acceptedAt);
  }

  private normalizeLimit(candidate: number | undefined, defaultLimit: number): number {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
      return defaultLimit;
    }

    return Math.max(Math.trunc(candidate), 0);
  }
}
