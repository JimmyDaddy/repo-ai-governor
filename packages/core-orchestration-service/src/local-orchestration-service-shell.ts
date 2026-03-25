import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type {
  LangGraphCheckpointer,
  LangGraphRecoveredExecution,
} from "@repo-ai-governor/core-runtime-langgraph";
import { LangGraphSqliteFsCheckpointer } from "@repo-ai-governor/core-runtime-langgraph/sqlite-fs-checkpointer";
import {
  OrchestrationExecutionStatus,
  type OrchestrationExecutionSummary,
  type OrchestrationRecoverExecutionResponse,
  type OrchestrationServiceClient,
  type OrchestrationServiceEvent,
  OrchestrationServiceEventType,
  type OrchestrationStartExecutionRequest,
  type OrchestrationStartExecutionResponse,
  type OrchestrationSubmitHitlDecisionRequest,
  type OrchestrationSubmitHitlDecisionResponse,
  type OrchestrationSubscribeExecutionResponse,
} from "@repo-ai-governor/orchestration-service-client";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceShellDependencies,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from "./types/index.js";

interface LocalOrchestrationExecutionRecord {
  summary: OrchestrationExecutionSummary;
  events: OrchestrationServiceEvent[];
}

/**
 * Implements the in-process local orchestration service shell for Phase 0.
 *
 * Why this exists:
 * CLI must stop owning checkpoint and execution state directly so the same service
 * contract can later be reused by a desktop client or a separate local daemon host.
 */
export class LocalOrchestrationServiceShell implements OrchestrationServiceClient {
  private readonly executionRecords = new Map<string, LocalOrchestrationExecutionRecord>();
  private readonly eventStreamIndex = new Map<string, string>();
  private readonly checkpointer: LangGraphCheckpointer;
  private readonly nowProvider: () => Date;
  private readonly eventStreamTokenProvider: (executionId: string) => string;
  private readonly executionIdProvider: () => string;
  private readonly executionSessionIdProvider: (executionId: string) => string;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceShellDependencies & {
      workspaceRoot: string;
    },
  ) {
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
    this.eventStreamTokenProvider =
      dependencies.eventStreamTokenProvider ?? ((executionId) => `stream-${executionId}`);
    this.executionIdProvider =
      dependencies.executionIdProvider ??
      (() => `orchestration-${randomUUID().replace(/-/gu, "")}`);
    this.executionSessionIdProvider =
      dependencies.executionSessionIdProvider ?? ((executionId) => `session-${executionId}`);
    this.checkpointer =
      dependencies.checkpointer ??
      new LangGraphSqliteFsCheckpointer({
        rootDirectory: dependencies.workspaceRoot,
      });
  }

  public async startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse> {
    const executionId = runtimeContext?.executionId ?? this.executionIdProvider();
    const executionSessionId =
      runtimeContext?.executionSessionId ?? this.executionSessionIdProvider(executionId);
    const processId =
      runtimeContext?.processId ?? `orchestration-${request.executionKind.toLowerCase()}`;
    const existingRecord = this.executionRecords.get(executionId);
    if (existingRecord) {
      return {
        executionId: existingRecord.summary.executionId,
        executionSessionId: existingRecord.summary.executionSessionId,
        acceptedAt: existingRecord.summary.acceptedAt,
        status: existingRecord.summary.status,
        checkpointCapable: existingRecord.summary.checkpointCapable,
        eventStreamToken: existingRecord.summary.eventStreamToken,
      };
    }

    const acceptedAt = this.toTimestamp();
    const eventStreamToken = this.eventStreamTokenProvider(executionId);
    const summary: OrchestrationExecutionSummary = {
      executionId,
      executionSessionId,
      processId,
      workspaceId: request.workspaceId,
      workspaceRoot: request.workspaceRoot,
      executionKind: request.executionKind,
      clientSurface: request.clientSurface,
      eventStreamToken,
      status: OrchestrationExecutionStatus.ACCEPTED,
      checkpointCapable: true,
      acceptedAt,
      updatedAt: acceptedAt,
      ...(request.taskId ? { taskId: request.taskId } : {}),
      ...(request.projectId ? { projectId: request.projectId } : {}),
      ...(request.sprintId ? { sprintId: request.sprintId } : {}),
    };
    const record: LocalOrchestrationExecutionRecord = {
      summary,
      events: [],
    };
    this.executionRecords.set(executionId, record);
    this.eventStreamIndex.set(eventStreamToken, executionId);
    await this.publishEvent({
      executionId,
      type: OrchestrationServiceEventType.EXECUTION_STARTED,
      status: OrchestrationExecutionStatus.RUNNING,
      message: `Accepted ${request.executionKind} execution from ${request.clientSurface}.`,
    });

    return {
      executionId,
      executionSessionId,
      acceptedAt,
      status: OrchestrationExecutionStatus.RUNNING,
      checkpointCapable: true,
      eventStreamToken,
    };
  }

  public async getExecution(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    return this.executionRecords.get(executionId)?.summary;
  }

  public async subscribeExecution(
    executionIdOrEventStreamToken: string,
  ): Promise<OrchestrationSubscribeExecutionResponse> {
    const executionId = this.executionRecords.has(executionIdOrEventStreamToken)
      ? executionIdOrEventStreamToken
      : this.eventStreamIndex.get(executionIdOrEventStreamToken);
    const record = executionId ? this.executionRecords.get(executionId) : undefined;
    if (!record) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        "Local orchestration execution stream was not found.",
        {
          executionIdOrEventStreamToken,
        },
      );
    }

    return {
      executionId: record.summary.executionId,
      eventStreamToken: record.summary.eventStreamToken,
      events: record.events.map((event) => ({ ...event })),
    };
  }

  public async submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse> {
    const record = this.getExecutionRecordOrThrow(request.executionId);
    if (record.summary.executionSessionId !== request.executionSessionId) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        "Local orchestration execution session was not found.",
        {
          executionId: request.executionId,
          executionSessionId: request.executionSessionId,
        },
      );
    }

    const nextStatus =
      request.resumeAction === "terminate"
        ? OrchestrationExecutionStatus.CANCELLED
        : OrchestrationExecutionStatus.RUNNING;
    const decisionReceiptArtifactPath = await this.persistHitlDecisionReceipt(record, request);
    await this.publishEvent({
      executionId: request.executionId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: nextStatus,
      artifactId: "hitl_decision_receipt",
      message: `Persisted HITL decision receipt for resumeAction=${request.resumeAction}.`,
    });
    record.summary = {
      ...record.summary,
      status: nextStatus,
      pendingHitl: false,
      updatedAt: this.toTimestamp(),
    };

    return {
      accepted: true,
      nextStatus,
      decisionReceiptArtifactPath,
    };
  }

  public async recoverExecution(
    executionId: string,
  ): Promise<OrchestrationRecoverExecutionResponse> {
    const record = this.getExecutionRecordOrThrow(executionId);
    const recoveredExecution = await this.checkpointer.recover(
      record.summary.executionId,
      record.summary.executionSessionId,
      record.summary.processId,
    );
    if (!recoveredExecution) {
      return {
        recovered: false,
        nextStatus: record.summary.status,
      };
    }

    this.applyRecoveredExecution(record, recoveredExecution);
    return {
      recovered: true,
      checkpointSource: recoveredExecution.checkpointSource,
      checkpointPath: recoveredExecution.checkpointPath,
      nextStatus: record.summary.status,
      nextNodeIds: [...recoveredExecution.nextNodeIds],
    };
  }

  public async publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void> {
    const record = this.getExecutionRecordOrThrow(request.executionId);
    const timestamp = this.toTimestamp();
    const event: OrchestrationServiceEvent = {
      type: request.type,
      executionId: record.summary.executionId,
      executionSessionId: record.summary.executionSessionId,
      status: request.status,
      timestamp,
      taskId: record.summary.taskId,
      projectId: record.summary.projectId,
      sprintId: record.summary.sprintId,
      message: request.message,
      ...(request.stageId ? { stageId: request.stageId } : {}),
      ...(request.artifactId ? { artifactId: request.artifactId } : {}),
    };
    record.events.push(event);
    record.summary = {
      ...record.summary,
      status: request.status,
      pendingHitl: request.status === OrchestrationExecutionStatus.HITL_REQUIRED,
      updatedAt: timestamp,
    };
  }

  public async saveCheckpoint(
    request: LocalOrchestrationServiceSaveCheckpointRequest,
  ): Promise<LangGraphRecoveredExecution | undefined> {
    const record = this.getExecutionRecordOrThrow(request.executionId);
    const checkpointEnvelope = await this.checkpointer.save(request);
    record.summary = {
      ...record.summary,
      checkpointSource: checkpointEnvelope.checkpointSource,
      checkpointPath: checkpointEnvelope.checkpointPath,
      updatedAt: this.toTimestamp(),
    };
    await this.publishEvent({
      executionId: request.executionId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: record.summary.status,
      artifactId: "langgraph_checkpoint",
      message: `Persisted ${checkpointEnvelope.checkpointSource} checkpoint.`,
    });

    const recoveredExecution = await this.checkpointer.recover(
      checkpointEnvelope.executionId,
      checkpointEnvelope.executionSessionId,
      checkpointEnvelope.processId,
    );
    if (recoveredExecution) {
      this.applyRecoveredExecution(record, recoveredExecution);
    }

    return recoveredExecution;
  }

  private applyRecoveredExecution(
    record: LocalOrchestrationExecutionRecord,
    recoveredExecution: LangGraphRecoveredExecution,
  ): void {
    record.summary = {
      ...record.summary,
      checkpointSource: recoveredExecution.checkpointSource,
      checkpointPath: recoveredExecution.checkpointPath,
      recoveredNextNodeIds: [...recoveredExecution.nextNodeIds],
      status: recoveredExecution.pendingInterrupt
        ? OrchestrationExecutionStatus.INTERRUPTED
        : record.summary.status,
      pendingHitl: recoveredExecution.pendingInterrupt?.kind === "hitl",
      updatedAt: this.toTimestamp(),
    };
  }

  private getExecutionRecordOrThrow(executionId: string): LocalOrchestrationExecutionRecord {
    const record = this.executionRecords.get(executionId);
    if (record) {
      return record;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
      "Local orchestration execution was not found.",
      {
        executionId,
      },
    );
  }

  private toTimestamp(): string {
    return this.nowProvider()
      .toISOString()
      .replace(/\.\d{3}Z$/u, "Z");
  }

  private async persistHitlDecisionReceipt(
    record: LocalOrchestrationExecutionRecord,
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<string> {
    const recordedAt = this.toTimestamp();
    const decisionId = `hitl-decision-${record.summary.executionId}-${this.toFileSafeTimestamp(recordedAt)}`;
    const artifactPath = resolve(
      this.dependencies.workspaceRoot,
      "context",
      "hitl",
      "decisions",
      `${decisionId}.json`,
    );

    await mkdir(dirname(artifactPath), { recursive: true });
    await writeFile(
      artifactPath,
      `${JSON.stringify(
        {
          decisionId,
          executionId: record.summary.executionId,
          executionSessionId: record.summary.executionSessionId,
          decision: request.decision,
          resumeAction: request.resumeAction,
          decidedBy: request.actor,
          ...(request.reason ? { reason: request.reason } : {}),
          ...(request.constraints ? { constraints: request.constraints } : {}),
          ...(record.summary.taskId ? { taskId: record.summary.taskId } : {}),
          ...(record.summary.projectId ? { projectId: record.summary.projectId } : {}),
          ...(record.summary.sprintId ? { sprintId: record.summary.sprintId } : {}),
          recordedAt,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    return artifactPath;
  }

  private toFileSafeTimestamp(value: string): string {
    return value.replace(/[-:]/gu, "").replace(/T/gu, "-").replace(/Z$/u, "Z");
  }
}
