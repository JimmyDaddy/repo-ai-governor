import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  LANGGRAPH_CHECKPOINT_SOURCES,
  LANGGRAPH_FILE_CHECKPOINTER_DIRECTORY_NAME,
  LANGGRAPH_FILE_CHECKPOINTER_FILE_NAME,
  LANGGRAPH_REDUCED_STATE_KEYS,
  LANGGRAPH_RUNTIME_INTERRUPT_KINDS,
  type LangGraphReducedStateKey,
} from "./constants/index.js";
import type {
  LangGraphCheckpointEnvelope,
  LangGraphFileCheckpointerOptions,
  LangGraphRecoveredExecution,
  LangGraphSaveCheckpointOptions,
} from "./types/index.js";

function formatRfc3339Seconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

export class LangGraphFileCheckpointer {
  constructor(
    private readonly options: LangGraphFileCheckpointerOptions,
    private readonly nowProvider: () => Date = () => new Date(),
    private readonly checkpointIdProvider: () => string = () => randomUUID(),
  ) {}

  public async save(options: LangGraphSaveCheckpointOptions): Promise<LangGraphCheckpointEnvelope> {
    this.assertReducedStateKeysAllowed(options.plan.reducedStateKeys, options.reducedState);

    const directoryPath = this.resolveCheckpointDirectoryPath(
      options.plan.executionId,
      options.executionSessionId,
    );
    const checkpointPath = resolve(directoryPath, LANGGRAPH_FILE_CHECKPOINTER_FILE_NAME);
    const timestamp = formatRfc3339Seconds(this.nowProvider());

    const checkpointEnvelope: LangGraphCheckpointEnvelope = {
      checkpointId: this.checkpointIdProvider(),
      checkpointSource: "file-backed",
      processId: options.plan.processId,
      executionId: options.plan.executionId,
      executionSessionId: options.executionSessionId,
      createdAt: timestamp,
      updatedAt: timestamp,
      checkpointPath,
      activeNodeIds: [...options.activeNodeIds],
      visitedNodeIds: [...options.visitedNodeIds],
      reducedState: { ...options.reducedState },
      artifactReferenceIds: [...(options.artifactReferenceIds ?? [])],
      ...(options.taskReferenceId ? { taskReferenceId: options.taskReferenceId } : {}),
      ...(options.pendingInterrupt ? { pendingInterrupt: options.pendingInterrupt } : {}),
    };

    try {
      await mkdir(directoryPath, { recursive: true });
      await writeFile(checkpointPath, JSON.stringify(checkpointEnvelope, null, 2), "utf8");
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_WRITE_FAILED,
        "Failed to persist LangGraph checkpoint to local file storage.",
        {
          checkpointPath,
          executionId: options.plan.executionId,
          executionSessionId: options.executionSessionId,
        },
      );
    }

    return checkpointEnvelope;
  }

  public async read(
    executionId: string,
    executionSessionId: string,
    expectedProcessId: string,
  ): Promise<LangGraphCheckpointEnvelope | undefined> {
    const checkpointPath = this.resolveCheckpointPath(executionId, executionSessionId);
    if (!existsSync(checkpointPath)) {
      return undefined;
    }

    try {
      const rawContent = await readFile(checkpointPath, "utf8");
      const parsedContent = JSON.parse(rawContent) as LangGraphCheckpointEnvelope;
      this.assertCheckpointEnvelope(
        parsedContent,
        checkpointPath,
        executionId,
        executionSessionId,
        expectedProcessId,
      );
      return parsedContent;
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_READ_FAILED,
        "Failed to read LangGraph checkpoint from local file storage.",
        {
          checkpointPath,
          executionId,
          executionSessionId,
        },
      );
    }
  }

  public async recover(
    executionId: string,
    executionSessionId: string,
    expectedProcessId: string,
  ): Promise<LangGraphRecoveredExecution | undefined> {
    const checkpointEnvelope = await this.read(executionId, executionSessionId, expectedProcessId);
    if (!checkpointEnvelope) {
      return undefined;
    }

    return {
      recovered: true,
      checkpointSource: checkpointEnvelope.checkpointSource,
      checkpointId: checkpointEnvelope.checkpointId,
      checkpointPath: checkpointEnvelope.checkpointPath,
      processId: checkpointEnvelope.processId,
      executionId: checkpointEnvelope.executionId,
      executionSessionId: checkpointEnvelope.executionSessionId,
      nextNodeIds: [...checkpointEnvelope.activeNodeIds],
      visitedNodeIds: [...checkpointEnvelope.visitedNodeIds],
      ...(checkpointEnvelope.pendingInterrupt
        ? { pendingInterrupt: checkpointEnvelope.pendingInterrupt }
        : {}),
      recoveredAt: formatRfc3339Seconds(this.nowProvider()),
    };
  }

  private resolveCheckpointDirectoryPath(executionId: string, executionSessionId: string): string {
    return resolve(
      this.options.rootDirectory,
      LANGGRAPH_FILE_CHECKPOINTER_DIRECTORY_NAME,
      executionId,
      executionSessionId,
    );
  }

  private resolveCheckpointPath(executionId: string, executionSessionId: string): string {
    return resolve(
      this.resolveCheckpointDirectoryPath(executionId, executionSessionId),
      LANGGRAPH_FILE_CHECKPOINTER_FILE_NAME,
    );
  }

  private assertReducedStateKeysAllowed(
    allowedKeys: readonly LangGraphReducedStateKey[],
    reducedState: Partial<Record<LangGraphReducedStateKey, unknown>>,
  ): void {
    const disallowedKeys = Object.keys(reducedState).filter(
      (key) => !allowedKeys.includes(key as LangGraphReducedStateKey),
    );
    if (disallowedKeys.length === 0) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
      "Checkpoint reduced state contains keys that are not allowed by the compiled graph plan.",
      {
        disallowedKeys,
        allowedKeys,
      },
    );
  }

  private assertCheckpointEnvelope(
    envelope: LangGraphCheckpointEnvelope,
    checkpointPath: string,
    expectedExecutionId: string,
    expectedExecutionSessionId: string,
    expectedProcessId: string,
  ): void {
    if (
      envelope.executionId !== expectedExecutionId ||
      envelope.executionSessionId !== expectedExecutionSessionId
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        "Checkpoint payload does not match the requested execution/session namespace.",
        {
          checkpointPath,
          expectedExecutionId,
          actualExecutionId: envelope.executionId,
          expectedExecutionSessionId,
          actualExecutionSessionId: envelope.executionSessionId,
        },
      );
    }

    if (envelope.processId !== expectedProcessId) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        "Checkpoint payload does not match the requested process id.",
        {
          checkpointPath,
          expectedProcessId,
          actualProcessId: envelope.processId,
        },
      );
    }

    if (!LANGGRAPH_CHECKPOINT_SOURCES.includes(envelope.checkpointSource)) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        "Checkpoint payload uses an unsupported checkpoint source.",
        {
          checkpointPath,
          checkpointSource: envelope.checkpointSource,
        },
      );
    }

    if (envelope.checkpointPath !== checkpointPath) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        "Checkpoint payload path does not match the resolved checkpoint path.",
        {
          checkpointPath,
          payloadCheckpointPath: envelope.checkpointPath,
        },
      );
    }

    this.assertStringArray(envelope.activeNodeIds, "activeNodeIds", checkpointPath);
    this.assertStringArray(envelope.visitedNodeIds, "visitedNodeIds", checkpointPath);
    this.assertReducedStateKeysAllowed(LANGGRAPH_REDUCED_STATE_KEYS, envelope.reducedState);
    this.assertPendingInterruptShape(envelope.pendingInterrupt, checkpointPath);
  }

  private assertStringArray(value: unknown, fieldName: string, checkpointPath: string): void {
    if (
      Array.isArray(value) &&
      value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
    ) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
      `Checkpoint payload field "${fieldName}" must be a string array.`,
      {
        checkpointPath,
        fieldName,
      },
    );
  }

  private assertPendingInterruptShape(
    pendingInterrupt: LangGraphCheckpointEnvelope["pendingInterrupt"],
    checkpointPath: string,
  ): void {
    if (!pendingInterrupt) {
      return;
    }

    if (
      LANGGRAPH_RUNTIME_INTERRUPT_KINDS.includes(pendingInterrupt.kind) &&
      typeof pendingInterrupt.recordedAt === "string" &&
      pendingInterrupt.recordedAt.trim().length > 0 &&
      (pendingInterrupt.reason === undefined || typeof pendingInterrupt.reason === "string") &&
      (pendingInterrupt.payload === undefined ||
        (pendingInterrupt.payload !== null && typeof pendingInterrupt.payload === "object"))
    ) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
      "Checkpoint payload pending interrupt shape is invalid.",
      {
        checkpointPath,
      },
    );
  }
}
