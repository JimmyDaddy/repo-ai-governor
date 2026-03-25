import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { GovernorErrorCode, RuntimeError, standardizeError } from "@repo-ai-governor/shared";
import {
  LANGGRAPH_SQLITE_FS_CHECKPOINTER_DATABASE_FILE_NAME,
  LANGGRAPH_SQLITE_FS_CHECKPOINTER_TABLE_NAME,
} from "./constants/index.js";
import { LangGraphCheckpointerBase } from "./langgraph-checkpointer.abstract.js";
import type {
  LangGraphCheckpointEnvelope,
  LangGraphRecoveredExecution,
  LangGraphSaveCheckpointOptions,
  LangGraphSqliteFsCheckpointerOptions,
} from "./types/index.js";

interface SqliteCheckpointRow {
  envelopeJson: string;
}

/**
 * Persists checkpoint envelopes into one sqlite database file under the workspace root.
 *
 * Why this exists:
 * sqlite-fs is the intended durable local baseline shared by CLI and future desktop
 * service hosts once file-backed smoke validation is complete.
 */
export class LangGraphSqliteFsCheckpointer extends LangGraphCheckpointerBase {
  private readonly databaseFilePath: string;
  private readonly tableName: string;
  private databaseConnection: DatabaseSync | null = null;

  public constructor(
    options: LangGraphSqliteFsCheckpointerOptions,
    nowProvider: () => Date = () => new Date(),
    checkpointIdProvider?: () => string,
  ) {
    super(nowProvider, checkpointIdProvider);
    this.databaseFilePath = resolve(
      options.rootDirectory,
      options.databaseFileName ?? LANGGRAPH_SQLITE_FS_CHECKPOINTER_DATABASE_FILE_NAME,
    );
    this.tableName = options.tableName ?? LANGGRAPH_SQLITE_FS_CHECKPOINTER_TABLE_NAME;
  }

  public async save(options: LangGraphSaveCheckpointOptions): Promise<LangGraphCheckpointEnvelope> {
    const checkpointPath = this.resolveCheckpointPath(
      options.plan.executionId,
      options.executionSessionId,
    );
    const checkpointEnvelope = this.createCheckpointEnvelope(options, "sqlite-fs", checkpointPath);

    try {
      await this.ensureDatabaseReady();
      this.getDatabase()
        .prepare(
          `
            INSERT INTO ${this.tableName}
            (execution_id, execution_session_id, process_id, checkpoint_source, checkpoint_path, envelope_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(execution_id, execution_session_id) DO UPDATE SET
              process_id = excluded.process_id,
              checkpoint_source = excluded.checkpoint_source,
              checkpoint_path = excluded.checkpoint_path,
              envelope_json = excluded.envelope_json,
              updated_at = excluded.updated_at
          `,
        )
        .run(
          checkpointEnvelope.executionId,
          checkpointEnvelope.executionSessionId,
          checkpointEnvelope.processId,
          checkpointEnvelope.checkpointSource,
          checkpointEnvelope.checkpointPath,
          JSON.stringify(checkpointEnvelope),
          checkpointEnvelope.updatedAt,
        );
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_WRITE_FAILED,
        "Failed to persist LangGraph checkpoint to sqlite-fs storage.",
        {
          databaseFilePath: this.databaseFilePath,
          executionId: options.plan.executionId,
          executionSessionId: options.executionSessionId,
          cause: standardizedError.message,
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
    try {
      await this.ensureDatabaseReady();
      const row = this.getDatabase()
        .prepare(
          `
            SELECT envelope_json AS envelopeJson
            FROM ${this.tableName}
            WHERE execution_id = ? AND execution_session_id = ?
            LIMIT 1
          `,
        )
        .get(executionId, executionSessionId) as SqliteCheckpointRow | undefined;

      if (!row) {
        return undefined;
      }

      const parsedContent = JSON.parse(row.envelopeJson) as LangGraphCheckpointEnvelope;
      this.assertCheckpointEnvelope(
        parsedContent,
        this.resolveCheckpointPath(executionId, executionSessionId),
        executionId,
        executionSessionId,
        expectedProcessId,
      );
      return parsedContent;
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }
      const standardizedError = standardizeError(error);

      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_READ_FAILED,
        "Failed to read LangGraph checkpoint from sqlite-fs storage.",
        {
          databaseFilePath: this.databaseFilePath,
          executionId,
          executionSessionId,
          cause: standardizedError.message,
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

  public async dispose(): Promise<void> {
    if (!this.databaseConnection) {
      return;
    }

    try {
      this.databaseConnection.close();
    } finally {
      this.databaseConnection = null;
    }
  }

  private async ensureDatabaseReady(): Promise<void> {
    await mkdir(dirname(this.databaseFilePath), { recursive: true });
    const database = this.getDatabase();
    database.exec(
      `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          execution_id TEXT NOT NULL,
          execution_session_id TEXT NOT NULL,
          process_id TEXT NOT NULL,
          checkpoint_source TEXT NOT NULL,
          checkpoint_path TEXT NOT NULL,
          envelope_json TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (execution_id, execution_session_id)
        )
      `,
    );
  }

  private getDatabase(): DatabaseSync {
    if (!this.databaseConnection) {
      this.databaseConnection = new DatabaseSync(this.databaseFilePath);
    }

    return this.databaseConnection;
  }

  private resolveCheckpointPath(executionId: string, executionSessionId: string): string {
    return `${this.databaseFilePath}#${executionId}/${executionSessionId}`;
  }
}
