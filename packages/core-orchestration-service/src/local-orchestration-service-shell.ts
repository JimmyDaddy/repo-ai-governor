import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

import type {
  LangGraphCheckpointer,
  LangGraphRecoveredExecution,
} from "@repo-ai-governor/core-runtime-langgraph";
import { LangGraphSqliteFsCheckpointer } from "@repo-ai-governor/core-runtime-langgraph/sqlite-fs-checkpointer";
import {
  OrchestrationExecutionStatus,
  type OrchestrationExecutionSummary,
  type OrchestrationListExecutionsFilter,
  type OrchestrationListExecutionsRequest,
  type OrchestrationListExecutionsResponse,
  type OrchestrationRecoverExecutionRequest,
  type OrchestrationRecoverExecutionResponse,
  type OrchestrationServiceClient,
  type OrchestrationServiceEvent,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceTransportKind,
  type OrchestrationStartExecutionRequest,
  type OrchestrationStartExecutionResponse,
  type OrchestrationSubmitHitlDecisionRequest,
  type OrchestrationSubmitHitlDecisionResponse,
  type OrchestrationSubscribeExecutionRequest,
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
  private readonly executionRecordsDirectory: string;
  private readonly nowProvider: () => Date;
  private readonly eventStreamTokenProvider: (executionId: string) => string;
  private readonly eventIdProvider: (executionId: string, sequence: number) => string;
  private readonly executionIdProvider: () => string;
  private readonly executionSessionIdProvider: (executionId: string) => string;
  private readonly serviceHostKind: OrchestrationServiceHostKind;
  private readonly serviceTransportKind: OrchestrationServiceTransportKind;
  private executionRecordsLoadedPromise: Promise<void> | null = null;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceShellDependencies & {
      workspaceRoot: string;
    },
  ) {
    this.executionRecordsDirectory = this.resolveExecutionRecordsDirectory(
      dependencies.workspaceRoot,
    );
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
    this.eventStreamTokenProvider =
      dependencies.eventStreamTokenProvider ?? ((executionId) => `stream-${executionId}`);
    this.eventIdProvider =
      dependencies.eventIdProvider ??
      ((executionId, sequence) => `${executionId}-event-${String(sequence)}`);
    this.executionIdProvider =
      dependencies.executionIdProvider ??
      (() => `orchestration-${randomUUID().replace(/-/gu, "")}`);
    this.executionSessionIdProvider =
      dependencies.executionSessionIdProvider ?? ((executionId) => `session-${executionId}`);
    this.serviceHostKind = dependencies.serviceHostKind ?? OrchestrationServiceHostKind.EMBEDDED;
    this.serviceTransportKind =
      dependencies.serviceTransportKind ?? OrchestrationServiceTransportKind.IN_PROCESS;
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
    await this.ensureExecutionRecordsLoaded();
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
        serviceHostKind: existingRecord.summary.serviceHostKind,
        serviceTransportKind: existingRecord.summary.serviceTransportKind,
        eventStreamToken: existingRecord.summary.eventStreamToken,
        latestEventSequence: existingRecord.summary.latestEventSequence ?? 0,
        nextCursor:
          existingRecord.summary.nextCursor ??
          this.createStreamCursor(existingRecord.summary.eventStreamToken, 0),
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
      serviceHostKind: this.serviceHostKind,
      serviceTransportKind: this.serviceTransportKind,
      status: OrchestrationExecutionStatus.ACCEPTED,
      checkpointCapable: true,
      recoveryCapable: false,
      acceptedAt,
      updatedAt: acceptedAt,
      pendingHitl: false,
      latestEventSequence: 0,
      nextCursor: this.createStreamCursor(eventStreamToken, 0),
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
    await this.persistExecutionRecord(record);
    await this.publishEvent({
      executionId,
      type: OrchestrationServiceEventType.EXECUTION_STARTED,
      status: OrchestrationExecutionStatus.RUNNING,
      message: `Accepted ${request.executionKind} execution from ${request.clientSurface}.`,
    });

    return {
      executionId: record.summary.executionId,
      executionSessionId: record.summary.executionSessionId,
      acceptedAt: record.summary.acceptedAt,
      status: record.summary.status,
      checkpointCapable: record.summary.checkpointCapable,
      serviceHostKind: record.summary.serviceHostKind,
      serviceTransportKind: record.summary.serviceTransportKind,
      eventStreamToken: record.summary.eventStreamToken,
      latestEventSequence: record.summary.latestEventSequence ?? 0,
      nextCursor:
        record.summary.nextCursor ?? this.createStreamCursor(record.summary.eventStreamToken, 0),
    };
  }

  public async getExecution(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    await this.ensureExecutionRecordsLoaded();
    const summary = this.executionRecords.get(executionId)?.summary;
    return summary ? this.cloneExecutionSummary(summary) : undefined;
  }

  public async listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse> {
    await this.ensureExecutionRecordsLoaded();
    const matchedExecutions = [...this.executionRecords.values()]
      .map((record) => record.summary)
      .filter((summary) => this.matchesExecutionFilter(summary, request?.filter))
      .sort((left, right) => right.acceptedAt.localeCompare(left.acceptedAt))
      .map((summary) => this.cloneExecutionSummary(summary));
    const executions =
      typeof request?.limit === "number"
        ? matchedExecutions.slice(0, Math.max(request.limit, 0))
        : matchedExecutions;

    return {
      executions,
      returnedCount: executions.length,
      totalMatchedCount: matchedExecutions.length,
    };
  }

  public async subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse> {
    await this.ensureExecutionRecordsLoaded();
    const { executionId, eventStreamToken, afterSequence } =
      this.resolveSubscriptionLookup(request);
    const record = executionId ? this.executionRecords.get(executionId) : undefined;
    if (!record) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        "Local orchestration execution stream was not found.",
        {
          executionId,
          eventStreamToken,
        },
      );
    }
    const filteredEvents = record.events.filter((event) =>
      afterSequence === undefined ? true : event.sequence > afterSequence,
    );
    const limitedEvents =
      typeof request.limit === "number"
        ? filteredEvents.slice(0, Math.max(request.limit, 0))
        : filteredEvents;
    const nextCursorSequence = limitedEvents.at(-1)?.sequence ?? afterSequence ?? 0;

    return {
      executionId: record.summary.executionId,
      eventStreamToken: record.summary.eventStreamToken,
      serviceHostKind: record.summary.serviceHostKind,
      serviceTransportKind: record.summary.serviceTransportKind,
      latestEventSequence: record.summary.latestEventSequence ?? 0,
      nextCursor: this.createStreamCursor(eventStreamToken, nextCursorSequence),
      events: limitedEvents.map((event) => ({ ...event })),
    };
  }

  public async submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse> {
    await this.ensureExecutionRecordsLoaded();
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
    if (!record.summary.pendingHitl) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_INVALID_STATUS,
        "Local orchestration execution is not currently waiting for a HITL decision.",
        {
          executionId: request.executionId,
          status: record.summary.status,
        },
      );
    }

    const nextStatus =
      request.resumeAction === "terminate"
        ? OrchestrationExecutionStatus.CANCELLED
        : request.resumeAction === "degrade"
          ? OrchestrationExecutionStatus.HITL_REQUIRED
          : OrchestrationExecutionStatus.RUNNING;
    const decisionReceiptArtifactPath =
      request.decisionReceiptArtifactPath ??
      (await this.persistHitlDecisionReceipt(record, request));
    await this.publishEvent({
      executionId: request.executionId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: nextStatus,
      artifactId: "hitl_decision_receipt",
      artifactPath: decisionReceiptArtifactPath,
      message: `Persisted HITL decision receipt for resumeAction=${request.resumeAction}.`,
    });
    record.summary = {
      ...record.summary,
      status: nextStatus,
      pendingHitl: nextStatus === OrchestrationExecutionStatus.HITL_REQUIRED,
      updatedAt: this.toTimestamp(),
    };
    await this.persistExecutionRecord(record);

    return {
      accepted: true,
      nextStatus,
      decisionReceiptArtifactPath,
      latestEventSequence: record.summary.latestEventSequence ?? 0,
      nextCursor:
        record.summary.nextCursor ?? this.createStreamCursor(record.summary.eventStreamToken, 0),
      executionSummary: this.cloneExecutionSummary(record.summary),
    };
  }

  public async recoverExecution(
    request: OrchestrationRecoverExecutionRequest,
  ): Promise<OrchestrationRecoverExecutionResponse> {
    await this.ensureExecutionRecordsLoaded();
    const record = this.getExecutionRecordOrThrow(request.executionId);
    if (this.isTerminalExecutionStatus(record.summary.status)) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_INVALID_STATUS,
        "Local orchestration execution is already in a terminal status and cannot be recovered.",
        {
          executionId: request.executionId,
          status: record.summary.status,
        },
      );
    }
    if (!record.summary.recoveryCapable) {
      return {
        recovered: false,
        recoveryCapable: false,
        checkpointSource: record.summary.checkpointSource,
        checkpointPath: record.summary.checkpointPath,
        nextStatus: record.summary.status,
        latestEventSequence: record.summary.latestEventSequence ?? 0,
        nextCursor:
          record.summary.nextCursor ?? this.createStreamCursor(record.summary.eventStreamToken, 0),
        executionSummary: this.cloneExecutionSummary(record.summary),
      };
    }
    const recoveredExecution = await this.checkpointer.recover(
      record.summary.executionId,
      record.summary.executionSessionId,
      record.summary.processId,
    );
    if (!recoveredExecution) {
      return {
        recovered: false,
        recoveryCapable: record.summary.recoveryCapable,
        checkpointSource: record.summary.checkpointSource,
        checkpointPath: record.summary.checkpointPath,
        nextStatus: record.summary.status,
        latestEventSequence: record.summary.latestEventSequence ?? 0,
        nextCursor:
          record.summary.nextCursor ?? this.createStreamCursor(record.summary.eventStreamToken, 0),
        executionSummary: this.cloneExecutionSummary(record.summary),
      };
    }

    this.applyRecoveredExecution(record, recoveredExecution);
    await this.persistExecutionRecord(record);
    return {
      recovered: true,
      recoveryCapable: record.summary.recoveryCapable,
      checkpointSource: recoveredExecution.checkpointSource,
      checkpointPath: recoveredExecution.checkpointPath,
      nextStatus: record.summary.status,
      latestEventSequence: record.summary.latestEventSequence ?? 0,
      nextCursor:
        record.summary.nextCursor ?? this.createStreamCursor(record.summary.eventStreamToken, 0),
      executionSummary: this.cloneExecutionSummary(record.summary),
      nextNodeIds: [...recoveredExecution.nextNodeIds],
    };
  }

  public async publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void> {
    await this.ensureExecutionRecordsLoaded();
    const record = this.getExecutionRecordOrThrow(request.executionId);
    const timestamp = this.toTimestamp();
    const sequence = (record.summary.latestEventSequence ?? 0) + 1;
    const event: OrchestrationServiceEvent = {
      eventId: this.eventIdProvider(record.summary.executionId, sequence),
      sequence,
      streamCursor: this.createStreamCursor(record.summary.eventStreamToken, sequence),
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
      ...(request.artifactPath ? { artifactPath: request.artifactPath } : {}),
    };
    record.events.push(event);
    record.summary = {
      ...record.summary,
      status: request.status,
      pendingHitl: request.status === OrchestrationExecutionStatus.HITL_REQUIRED,
      lastEventAt: timestamp,
      latestEventType: request.type,
      latestEventSequence: sequence,
      nextCursor: event.streamCursor,
      ...(request.stageId ? { currentStageId: request.stageId } : {}),
      ...(request.artifactId ? { latestArtifactId: request.artifactId } : {}),
      ...(request.artifactPath ? { latestArtifactPath: request.artifactPath } : {}),
      updatedAt: timestamp,
    };
    await this.persistExecutionRecord(record);
  }

  public async saveCheckpoint(
    request: LocalOrchestrationServiceSaveCheckpointRequest,
  ): Promise<LangGraphRecoveredExecution | undefined> {
    await this.ensureExecutionRecordsLoaded();
    const record = this.getExecutionRecordOrThrow(request.executionId);
    const checkpointEnvelope = await this.checkpointer.save(request);
    record.summary = {
      ...record.summary,
      checkpointSource: checkpointEnvelope.checkpointSource,
      checkpointPath: checkpointEnvelope.checkpointPath,
      recoveryCapable: true,
      updatedAt: this.toTimestamp(),
    };
    await this.publishEvent({
      executionId: request.executionId,
      type: OrchestrationServiceEventType.ARTIFACT_READY,
      status: record.summary.status,
      artifactId: "langgraph_checkpoint",
      artifactPath: checkpointEnvelope.checkpointPath,
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
    await this.persistExecutionRecord(record);

    return recoveredExecution;
  }

  private async ensureExecutionRecordsLoaded(): Promise<void> {
    if (!this.executionRecordsLoadedPromise) {
      this.executionRecordsLoadedPromise = this.loadPersistedExecutionRecords().catch((error) => {
        this.executionRecordsLoadedPromise = null;
        throw error;
      });
    }
    await this.executionRecordsLoadedPromise;
  }

  private async loadPersistedExecutionRecords(): Promise<void> {
    await mkdir(this.executionRecordsDirectory, { recursive: true });
    const entries = await readdir(this.executionRecordsDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }
      const filePath = resolve(this.executionRecordsDirectory, entry.name);
      const parsed = JSON.parse(await readFile(filePath, "utf8")) as
        | LocalOrchestrationExecutionRecord
        | undefined;
      const summary = parsed?.summary;
      if (
        !summary ||
        typeof summary.executionId !== "string" ||
        typeof summary.eventStreamToken !== "string" ||
        !Array.isArray(parsed.events)
      ) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
          "Persisted orchestration execution record is invalid.",
          {
            filePath,
          },
        );
      }
      this.executionRecords.set(summary.executionId, {
        summary: this.cloneExecutionSummary(summary),
        events: parsed.events.map((event) => ({ ...event })),
      });
      this.eventStreamIndex.set(summary.eventStreamToken, summary.executionId);
    }
  }

  private async persistExecutionRecord(record: LocalOrchestrationExecutionRecord): Promise<void> {
    await mkdir(this.executionRecordsDirectory, { recursive: true });
    await writeFile(
      this.resolveExecutionRecordPath(record.summary.executionId),
      `${JSON.stringify(
        {
          summary: this.cloneExecutionSummary(record.summary),
          events: record.events.map((event) => ({ ...event })),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
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
      recoveryCapable: true,
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

  private matchesExecutionFilter(
    summary: OrchestrationExecutionSummary,
    filter?: OrchestrationListExecutionsFilter,
  ): boolean {
    if (!filter) {
      return true;
    }

    if (filter.workspaceId && summary.workspaceId !== filter.workspaceId) {
      return false;
    }
    if (filter.status && summary.status !== filter.status) {
      return false;
    }
    if (filter.taskId && summary.taskId !== filter.taskId) {
      return false;
    }
    if (filter.projectId && summary.projectId !== filter.projectId) {
      return false;
    }
    if (filter.sprintId && summary.sprintId !== filter.sprintId) {
      return false;
    }

    return true;
  }

  private cloneExecutionSummary(
    summary: OrchestrationExecutionSummary,
  ): OrchestrationExecutionSummary {
    return {
      ...summary,
      ...(summary.recoveredNextNodeIds
        ? { recoveredNextNodeIds: [...summary.recoveredNextNodeIds] }
        : {}),
    };
  }

  private isTerminalExecutionStatus(status: OrchestrationExecutionStatus): boolean {
    return [
      OrchestrationExecutionStatus.COMPLETED,
      OrchestrationExecutionStatus.FAILED,
      OrchestrationExecutionStatus.CANCELLED,
    ].includes(status);
  }

  private resolveSubscriptionLookup(request: OrchestrationSubscribeExecutionRequest): {
    executionId: string;
    eventStreamToken: string;
    afterSequence?: number;
  } {
    const parsedCursor = request.cursor ? this.parseStreamCursor(request.cursor) : undefined;
    const cursorAfterSequence = request.afterSequence ?? parsedCursor?.sequence;
    const executionId =
      request.executionId ??
      (request.eventStreamToken
        ? this.eventStreamIndex.get(request.eventStreamToken)
        : undefined) ??
      (parsedCursor ? this.eventStreamIndex.get(parsedCursor.eventStreamToken) : undefined);
    const record = executionId ? this.executionRecords.get(executionId) : undefined;
    if (!record) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        "Local orchestration execution stream lookup failed.",
        {
          executionId: request.executionId,
          eventStreamToken: request.eventStreamToken,
          cursor: request.cursor,
        },
      );
    }

    if (request.eventStreamToken && request.eventStreamToken !== record.summary.eventStreamToken) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        "Local orchestration execution subscription request contains mismatched stream identity.",
        {
          executionId: record.summary.executionId,
          eventStreamToken: request.eventStreamToken,
          expectedEventStreamToken: record.summary.eventStreamToken,
        },
      );
    }
    if (parsedCursor && parsedCursor.eventStreamToken !== record.summary.eventStreamToken) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        "Local orchestration execution cursor does not match the resolved stream token.",
        {
          executionId: record.summary.executionId,
          cursor: request.cursor,
          expectedEventStreamToken: record.summary.eventStreamToken,
        },
      );
    }

    return {
      executionId: record.summary.executionId,
      eventStreamToken: record.summary.eventStreamToken,
      ...(cursorAfterSequence !== undefined ? { afterSequence: cursorAfterSequence } : {}),
    };
  }

  private parseStreamCursor(cursor: string): {
    eventStreamToken: string;
    sequence: number;
  } {
    try {
      const decoded = Buffer.from(cursor, "base64url").toString("utf8");
      const parsed = JSON.parse(decoded) as {
        eventStreamToken?: unknown;
        sequence?: unknown;
      };
      if (
        typeof parsed.eventStreamToken !== "string" ||
        typeof parsed.sequence !== "number" ||
        !Number.isInteger(parsed.sequence) ||
        parsed.sequence < 0
      ) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
          "Local orchestration execution cursor payload is invalid.",
          {
            cursor,
          },
        );
      }
      return {
        eventStreamToken: parsed.eventStreamToken,
        sequence: parsed.sequence,
      };
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        "Local orchestration execution cursor could not be parsed.",
        {
          cursor,
        },
      );
    }
  }

  private createStreamCursor(eventStreamToken: string, sequence: number): string {
    return Buffer.from(
      JSON.stringify({
        eventStreamToken,
        sequence,
      }),
      "utf8",
    ).toString("base64url");
  }

  private toTimestamp(): string {
    return this.nowProvider()
      .toISOString()
      .replace(/\.\d{3}Z$/u, "Z");
  }

  private resolveExecutionRecordsDirectory(workspaceRoot: string): string {
    const governanceRoot =
      basename(workspaceRoot) === ".repo-ai-governor"
        ? workspaceRoot
        : resolve(workspaceRoot, ".repo-ai-governor");
    return resolve(governanceRoot, "context", "runtime", "orchestration-service", "executions");
  }

  private resolveExecutionRecordPath(executionId: string): string {
    return resolve(this.executionRecordsDirectory, `${executionId}.json`);
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
