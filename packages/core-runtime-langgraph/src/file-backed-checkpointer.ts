import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  LANGGRAPH_FILE_CHECKPOINTER_DIRECTORY_NAME,
  LANGGRAPH_FILE_CHECKPOINTER_FILE_NAME,
} from "./constants/index.js";
import { LangGraphCheckpointerBase } from "./langgraph-checkpointer.abstract.js";
import type {
  LangGraphCheckpointEnvelope,
  LangGraphFileCheckpointerOptions,
  LangGraphRecoveredExecution,
  LangGraphSaveCheckpointOptions,
} from "./types/index.js";

/**
 * Persists one checkpoint envelope per execution/session namespace as JSON.
 *
 * Why this exists:
 * file-backed persistence is the simplest recovery medium for Phase 0 smoke
 * validation before checkpoint ownership moves to sqlite-fs and service shells.
 */
export class LangGraphFileCheckpointer extends LangGraphCheckpointerBase {
  constructor(
    private readonly options: LangGraphFileCheckpointerOptions,
    nowProvider: () => Date = () => new Date(),
    checkpointIdProvider?: () => string,
  ) {
    super(nowProvider, checkpointIdProvider);
  }

  public async save(options: LangGraphSaveCheckpointOptions): Promise<LangGraphCheckpointEnvelope> {
    const directoryPath = this.resolveCheckpointDirectoryPath(
      options.plan.executionId,
      options.executionSessionId,
    );
    const checkpointPath = resolve(directoryPath, LANGGRAPH_FILE_CHECKPOINTER_FILE_NAME);
    const checkpointEnvelope = this.createCheckpointEnvelope(
      options,
      "file-backed",
      checkpointPath,
    );

    try {
      await mkdir(directoryPath, { recursive: true });
      await writeFile(checkpointPath, JSON.stringify(checkpointEnvelope, null, 2), "utf8");
    } catch {
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

    return this.createRecoveredExecution(checkpointEnvelope);
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
}
