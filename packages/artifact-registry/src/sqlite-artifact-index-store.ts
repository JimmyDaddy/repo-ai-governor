import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  ARCHIVE_ARTIFACT_REGISTRY_STATUSES,
  type ArtifactLifecycleStatus,
  MAIN_ARTIFACT_REGISTRY_STATUSES,
} from './constants/index.js';
import type {
  ArtifactIndexStore,
  ArtifactRegistryRecord,
  SqliteArtifactIndexStoreOptions,
} from './types/index.js';

interface SqliteArtifactRegistryRow {
  artifactId: string;
  artifactType: string;
  artifactPath: string;
  artifactVersion: string;
  artifactStatus: string;
  producerTaskId: string;
  producerExecutionId: string;
  registeredAt: string;
  lastUpdatedAt: string;
  dependentTasksJson: string;
}

const SQLITE_ARTIFACT_MAIN_TABLE_NAME = 'artifact_registry_main';
const SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME = 'artifact_registry_archive';

/**
 * Persists artifact registry truth into sqlite-backed main/archive tables.
 *
 * Why this exists:
 * TK-477 moves artifact registry durable truth away from hand-maintained CSV rows so
 * runtime and governance consumers can share one transactional machine-readable source.
 */
export class SqliteArtifactIndexStore implements ArtifactIndexStore {
  private readonly databaseFilePath: string;
  private readonly databaseConnection: DatabaseSync;

  public constructor(options: SqliteArtifactIndexStoreOptions) {
    this.databaseFilePath = resolve(options.databaseFilePath);
    mkdirSync(dirname(this.databaseFilePath), { recursive: true });
    this.databaseConnection = new DatabaseSync(this.databaseFilePath);
    this.initializeSchema();
  }

  /**
   * Lists all artifact rows across main/archive canonical tables.
   * @returns Registry rows.
   */
  public async list(): Promise<ArtifactRegistryRecord[]> {
    const rows = [
      ...this.readRowsFromTable(SQLITE_ARTIFACT_MAIN_TABLE_NAME),
      ...this.readRowsFromTable(SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME),
    ];

    return rows.sort((left, right) => this.compareArtifactRows(left, right));
  }

  /**
   * Lists rows from the main canonical registry table.
   * @returns Main-registry rows.
   */
  public async listMainRegistry(): Promise<ArtifactRegistryRecord[]> {
    return this.readRowsFromTable(SQLITE_ARTIFACT_MAIN_TABLE_NAME);
  }

  /**
   * Lists rows from the archive canonical registry table.
   * @returns Archive-registry rows.
   */
  public async listArchiveRegistry(): Promise<ArtifactRegistryRecord[]> {
    return this.readRowsFromTable(SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME);
  }

  /**
   * Upserts one record into the correct canonical scope and removes stale opposite-scope copies.
   * @param record Normalized record payload.
   * @returns Persisted record.
   */
  public async upsert(record: ArtifactRegistryRecord): Promise<ArtifactRegistryRecord> {
    const targetTableName = this.resolveTargetTableName(record.artifactStatus);
    const oppositeTableName =
      targetTableName === SQLITE_ARTIFACT_MAIN_TABLE_NAME
        ? SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME
        : SQLITE_ARTIFACT_MAIN_TABLE_NAME;
    const normalizedRecord = this.normalizeRecord(record);

    this.runInTransaction(() => {
      this.databaseConnection
        .prepare(
          `
            DELETE FROM ${oppositeTableName}
            WHERE artifact_id = ? AND artifact_version = ?
          `,
        )
        .run(normalizedRecord.artifactId, normalizedRecord.artifactVersion);

      this.databaseConnection
        .prepare(
          `
            INSERT INTO ${targetTableName} (
              artifact_id,
              artifact_type,
              artifact_path,
              artifact_version,
              artifact_status,
              producer_task_id,
              producer_execution_id,
              registered_at,
              last_updated_at,
              dependent_tasks_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(artifact_id, artifact_version) DO UPDATE SET
              artifact_type = excluded.artifact_type,
              artifact_path = excluded.artifact_path,
              artifact_status = excluded.artifact_status,
              producer_task_id = excluded.producer_task_id,
              producer_execution_id = excluded.producer_execution_id,
              registered_at = excluded.registered_at,
              last_updated_at = excluded.last_updated_at,
              dependent_tasks_json = excluded.dependent_tasks_json
          `,
        )
        .run(
          normalizedRecord.artifactId,
          normalizedRecord.artifactType,
          normalizedRecord.artifactPath,
          normalizedRecord.artifactVersion,
          normalizedRecord.artifactStatus,
          normalizedRecord.producerTaskId,
          normalizedRecord.producerExecutionId,
          normalizedRecord.registeredAt,
          normalizedRecord.lastUpdatedAt,
          JSON.stringify(normalizedRecord.dependentTasks),
        );
    });

    return normalizedRecord;
  }

  /**
   * Replaces both canonical scopes in one transaction.
   * @param options Replacement rows by canonical scope.
   * @returns Void.
   */
  public async replaceRegistryRows(options: {
    mainRecords: ArtifactRegistryRecord[];
    archiveRecords: ArtifactRegistryRecord[];
  }): Promise<void> {
    const normalizedMainRecords = options.mainRecords.map((record) => this.normalizeRecord(record));
    const normalizedArchiveRecords = options.archiveRecords.map((record) =>
      this.normalizeRecord(record),
    );

    this.runInTransaction(() => {
      this.databaseConnection.prepare(`DELETE FROM ${SQLITE_ARTIFACT_MAIN_TABLE_NAME}`).run();
      this.databaseConnection.prepare(`DELETE FROM ${SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME}`).run();

      const mainInsertStatement = this.databaseConnection.prepare(
        `
          INSERT INTO ${SQLITE_ARTIFACT_MAIN_TABLE_NAME} (
            artifact_id,
            artifact_type,
            artifact_path,
            artifact_version,
            artifact_status,
            producer_task_id,
            producer_execution_id,
            registered_at,
            last_updated_at,
            dependent_tasks_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );
      const archiveInsertStatement = this.databaseConnection.prepare(
        `
          INSERT INTO ${SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME} (
            artifact_id,
            artifact_type,
            artifact_path,
            artifact_version,
            artifact_status,
            producer_task_id,
            producer_execution_id,
            registered_at,
            last_updated_at,
            dependent_tasks_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );

      for (const record of normalizedMainRecords) {
        this.assertTableCompatibility(record.artifactStatus, SQLITE_ARTIFACT_MAIN_TABLE_NAME);
        mainInsertStatement.run(
          record.artifactId,
          record.artifactType,
          record.artifactPath,
          record.artifactVersion,
          record.artifactStatus,
          record.producerTaskId,
          record.producerExecutionId,
          record.registeredAt,
          record.lastUpdatedAt,
          JSON.stringify(record.dependentTasks),
        );
      }

      for (const record of normalizedArchiveRecords) {
        this.assertTableCompatibility(record.artifactStatus, SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME);
        archiveInsertStatement.run(
          record.artifactId,
          record.artifactType,
          record.artifactPath,
          record.artifactVersion,
          record.artifactStatus,
          record.producerTaskId,
          record.producerExecutionId,
          record.registeredAt,
          record.lastUpdatedAt,
          JSON.stringify(record.dependentTasks),
        );
      }
    });
  }

  /**
   * Closes the sqlite connection owned by this store.
   * @returns Void.
   */
  public async dispose(): Promise<void> {
    try {
      this.databaseConnection.close();
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'Failed to dispose sqlite artifact registry connection.',
        {
          databaseFilePath: this.databaseFilePath,
        },
        error,
      );
    }
  }

  /**
   * Initializes sqlite schema and WAL mode.
   * @returns Void.
   */
  private initializeSchema(): void {
    try {
      this.databaseConnection.exec('PRAGMA journal_mode = WAL;');
      this.databaseConnection.exec('PRAGMA foreign_keys = ON;');
      this.databaseConnection.exec(`
        CREATE TABLE IF NOT EXISTS ${SQLITE_ARTIFACT_MAIN_TABLE_NAME} (
          artifact_id TEXT NOT NULL,
          artifact_type TEXT NOT NULL,
          artifact_path TEXT NOT NULL,
          artifact_version TEXT NOT NULL,
          artifact_status TEXT NOT NULL CHECK (artifact_status IN ('active', 'frozen', 'deprecated')),
          producer_task_id TEXT NOT NULL,
          producer_execution_id TEXT NOT NULL,
          registered_at TEXT NOT NULL,
          last_updated_at TEXT NOT NULL,
          dependent_tasks_json TEXT NOT NULL DEFAULT '[]',
          PRIMARY KEY (artifact_id, artifact_version)
        );
      `);
      this.databaseConnection.exec(`
        CREATE TABLE IF NOT EXISTS ${SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME} (
          artifact_id TEXT NOT NULL,
          artifact_type TEXT NOT NULL,
          artifact_path TEXT NOT NULL,
          artifact_version TEXT NOT NULL,
          artifact_status TEXT NOT NULL CHECK (artifact_status IN ('archived', 'retired')),
          producer_task_id TEXT NOT NULL,
          producer_execution_id TEXT NOT NULL,
          registered_at TEXT NOT NULL,
          last_updated_at TEXT NOT NULL,
          dependent_tasks_json TEXT NOT NULL DEFAULT '[]',
          PRIMARY KEY (artifact_id, artifact_version)
        );
      `);
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'Failed to initialize sqlite artifact registry schema.',
        {
          databaseFilePath: this.databaseFilePath,
        },
        error,
      );
    }
  }

  /**
   * Reads one table into normalized artifact registry rows.
   * @param tableName Canonical table name.
   * @returns Registry rows.
   */
  private readRowsFromTable(tableName: string): ArtifactRegistryRecord[] {
    try {
      const rows = this.databaseConnection
        .prepare(
          `
            SELECT
              artifact_id AS artifactId,
              artifact_type AS artifactType,
              artifact_path AS artifactPath,
              artifact_version AS artifactVersion,
              artifact_status AS artifactStatus,
              producer_task_id AS producerTaskId,
              producer_execution_id AS producerExecutionId,
              registered_at AS registeredAt,
              last_updated_at AS lastUpdatedAt,
              dependent_tasks_json AS dependentTasksJson
            FROM ${tableName}
            ORDER BY artifact_id ASC, artifact_version DESC
          `,
        )
        .all() as unknown as SqliteArtifactRegistryRow[];

      return rows.map((row) => ({
        artifactId: row.artifactId,
        artifactType: row.artifactType,
        artifactPath: row.artifactPath,
        artifactVersion: row.artifactVersion,
        artifactStatus: row.artifactStatus as ArtifactLifecycleStatus,
        producerTaskId: row.producerTaskId,
        producerExecutionId: row.producerExecutionId,
        registeredAt: row.registeredAt,
        lastUpdatedAt: row.lastUpdatedAt,
        dependentTasks: this.parseDependentTasksJson(row.dependentTasksJson),
      }));
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'Failed to read sqlite artifact registry rows.',
        {
          databaseFilePath: this.databaseFilePath,
          tableName,
        },
        error,
      );
    }
  }

  /**
   * Normalizes one record into stable payload shape.
   * @param record Raw record.
   * @returns Normalized record.
   */
  private normalizeRecord(record: ArtifactRegistryRecord): ArtifactRegistryRecord {
    return {
      artifactId: record.artifactId.trim(),
      artifactType: record.artifactType.trim(),
      artifactPath: record.artifactPath.trim(),
      artifactVersion: record.artifactVersion.trim(),
      artifactStatus: record.artifactStatus,
      producerTaskId: record.producerTaskId.trim(),
      producerExecutionId: record.producerExecutionId.trim(),
      registeredAt: record.registeredAt.trim(),
      lastUpdatedAt: record.lastUpdatedAt.trim(),
      dependentTasks: Array.from(
        new Set(
          record.dependentTasks
            .map((dependentTaskId) => dependentTaskId.trim())
            .filter((dependentTaskId) => dependentTaskId.length > 0),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    };
  }

  /**
   * Resolves which canonical table owns one lifecycle status.
   * @param artifactStatus Lifecycle status.
   * @returns Canonical table name.
   */
  private resolveTargetTableName(artifactStatus: string): string {
    if (MAIN_ARTIFACT_REGISTRY_STATUSES.has(artifactStatus)) {
      return SQLITE_ARTIFACT_MAIN_TABLE_NAME;
    }

    if (ARCHIVE_ARTIFACT_REGISTRY_STATUSES.has(artifactStatus)) {
      return SQLITE_ARTIFACT_ARCHIVE_TABLE_NAME;
    }

    throw new RuntimeError(
      GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
      'Artifact lifecycle status does not map to a canonical sqlite registry scope.',
      {
        artifactStatus,
      },
    );
  }

  /**
   * Ensures the provided status is compatible with the destination canonical table.
   * @param artifactStatus Lifecycle status.
   * @param tableName Target table name.
   * @returns Void.
   */
  private assertTableCompatibility(artifactStatus: string, tableName: string): void {
    const targetTableName = this.resolveTargetTableName(artifactStatus);
    if (targetTableName !== tableName) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
        'Artifact lifecycle status does not match destination canonical registry table.',
        {
          artifactStatus,
          tableName,
        },
      );
    }
  }

  /**
   * Runs one mutating sequence in an immediate sqlite transaction.
   * @param operation Mutation callback.
   * @returns Void.
   */
  private runInTransaction(operation: () => void): void {
    try {
      this.databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');
      operation();
      this.databaseConnection.exec('COMMIT');
    } catch (error) {
      try {
        this.databaseConnection.exec('ROLLBACK');
      } catch {
        // Ignore rollback failures because the original error is more actionable.
      }

      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'Failed to mutate sqlite artifact registry state.',
        {
          databaseFilePath: this.databaseFilePath,
        },
        error,
      );
    }
  }

  /**
   * Parses dependent-task JSON cell into normalized task ids.
   * @param valueJson JSON string cell.
   * @returns Parsed dependent task ids.
   */
  private parseDependentTasksJson(valueJson: string): string[] {
    try {
      const parsedValue = JSON.parse(valueJson) as unknown;
      if (!Array.isArray(parsedValue)) {
        return [];
      }

      return parsedValue
        .filter((candidate): candidate is string => typeof candidate === 'string')
        .map((candidate) => candidate.trim())
        .filter((candidate) => candidate.length > 0)
        .sort((left, right) => left.localeCompare(right));
    } catch {
      return [];
    }
  }

  /**
   * Orders artifact rows deterministically by id and semantic version descending.
   * @param left Left row.
   * @param right Right row.
   * @returns Comparator result.
   */
  private compareArtifactRows(left: ArtifactRegistryRecord, right: ArtifactRegistryRecord): number {
    const idOrder = left.artifactId.localeCompare(right.artifactId);
    if (idOrder !== 0) {
      return idOrder;
    }

    return this.compareArtifactVersion(right.artifactVersion, left.artifactVersion);
  }

  /**
   * Compares two artifact versions using numeric segment order.
   * @param leftVersion Left version.
   * @param rightVersion Right version.
   * @returns Comparator result.
   */
  private compareArtifactVersion(leftVersion: string, rightVersion: string): number {
    const leftSegments = this.parseVersionSegments(leftVersion);
    const rightSegments = this.parseVersionSegments(rightVersion);

    for (let segmentIndex = 0; segmentIndex < 3; segmentIndex += 1) {
      const leftSegment = leftSegments[segmentIndex] ?? 0;
      const rightSegment = rightSegments[segmentIndex] ?? 0;
      if (leftSegment !== rightSegment) {
        return leftSegment - rightSegment;
      }
    }

    return 0;
  }

  /**
   * Parses semantic version segments from one artifact version.
   * @param artifactVersion Version string.
   * @returns Version segments.
   */
  private parseVersionSegments(artifactVersion: string): [number, number, number] {
    const sanitizedVersion = artifactVersion.trim().replace(/^v/u, '');
    const segments = sanitizedVersion.split('.').map((segment) => Number.parseInt(segment, 10));

    return [segments[0] ?? 0, segments[1] ?? 0, segments[2] ?? 0];
  }
}
