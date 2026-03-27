import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type {
  MemoryArchiveOptions,
  MemoryQueryRequest,
  MemoryRecord,
  MemorySnapshotOptions,
  MemorySnapshotRecord,
  MemoryStoreProvider,
} from '@repo-ai-governor/memory-store-adapter';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  SQLITE_FS_ARCHIVE_TABLE_NAME,
  SQLITE_FS_DATABASE_FILE_NAME,
  SQLITE_FS_RECORDS_TABLE_NAME,
  SQLITE_FS_SNAPSHOTS_DIRECTORY_NAME,
  SQLITE_FS_SNAPSHOTS_TABLE_NAME,
} from './constants/index.js';
import type { SqliteFsMemoryStoreProviderOptions } from './types/index.js';

interface SqliteMemoryRow {
  namespace: string;
  key: string;
  valueJson: string;
  tagsJson: string;
  updatedAt: string;
}

/**
 * Implements a sqlite+fs-backed memory provider baseline.
 *
 * Why this exists:
 * sqlite offers deterministic query and update semantics, while fs snapshot files
 * keep large payload replay files cheap to inspect and portable across environments.
 */
export class SqliteFsMemoryStoreProvider implements MemoryStoreProvider {
  private readonly rootDirectoryPath: string;
  private readonly databaseFilePath: string;
  private readonly snapshotsDirectoryPath: string;
  private databaseConnection: DatabaseSync | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor(options: SqliteFsMemoryStoreProviderOptions) {
    this.rootDirectoryPath = resolve(options.rootDirectory);
    this.databaseFilePath = resolve(
      this.rootDirectoryPath,
      options.databaseFileName ?? SQLITE_FS_DATABASE_FILE_NAME,
    );
    this.snapshotsDirectoryPath = resolve(
      this.rootDirectoryPath,
      options.snapshotsDirectoryName ?? SQLITE_FS_SNAPSHOTS_DIRECTORY_NAME,
    );
  }

  /**
   * Reads one memory record by namespace and key.
   * @param namespace Record namespace.
   * @param key Record key.
   * @returns Matching record, or undefined when absent.
   */
  public async read(namespace: string, key: string): Promise<MemoryRecord | undefined> {
    await this.ensureStorageInitialized();

    const row = this.getDatabase()
      .prepare(
        `
          SELECT namespace, key, value_json AS valueJson, tags_json AS tagsJson, updated_at AS updatedAt
          FROM ${SQLITE_FS_RECORDS_TABLE_NAME}
          WHERE namespace = ? AND key = ?
          LIMIT 1
        `,
      )
      .get(namespace, key) as SqliteMemoryRow | undefined;

    if (!row) {
      return undefined;
    }

    return this.toMemoryRecord(row);
  }

  /**
   * Upserts one memory record into sqlite records table.
   * @param record Normalized memory record.
   * @returns Void.
   */
  public async write(record: MemoryRecord): Promise<void> {
    await this.ensureStorageInitialized();

    this.getDatabase()
      .prepare(
        `
          INSERT INTO ${SQLITE_FS_RECORDS_TABLE_NAME} (namespace, key, value_json, tags_json, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(namespace, key) DO UPDATE SET
            value_json = excluded.value_json,
            tags_json = excluded.tags_json,
            updated_at = excluded.updated_at
        `,
      )
      .run(
        record.namespace,
        record.key,
        JSON.stringify(record.value),
        JSON.stringify(record.tags),
        record.updatedAt,
      );
  }

  /**
   * Queries records by namespace/key-prefix/tag filters.
   * @param request Query request.
   * @returns Matched records.
   */
  public async query(request: MemoryQueryRequest): Promise<MemoryRecord[]> {
    await this.ensureStorageInitialized();

    const conditions: string[] = [];
    const parameters: (string | number)[] = [];

    if (request.namespace) {
      conditions.push('namespace = ?');
      parameters.push(request.namespace);
    }

    if (request.keyPrefix) {
      conditions.push("key LIKE ? ESCAPE '\\\\'");
      parameters.push(this.toLikePrefixPattern(request.keyPrefix));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT namespace, key, value_json AS valueJson, tags_json AS tagsJson, updated_at AS updatedAt
      FROM ${SQLITE_FS_RECORDS_TABLE_NAME}
      ${whereClause}
      ORDER BY updated_at DESC
    `;

    const rows = this.getDatabase()
      .prepare(sql)
      .all(...parameters) as unknown as SqliteMemoryRow[];
    const matchedRecords = rows.map((row) => this.toMemoryRecord(row));
    const tagFilteredRecords = request.tag
      ? matchedRecords.filter((record) => record.tags.includes(request.tag as string))
      : matchedRecords;

    if (!request.limit || request.limit <= 0) {
      return tagFilteredRecords;
    }

    return tagFilteredRecords.slice(0, request.limit);
  }

  /**
   * Creates one snapshot payload file and snapshot metadata row.
   * @param options Snapshot options.
   * @returns Snapshot metadata.
   */
  public async snapshot(options: MemorySnapshotOptions = {}): Promise<MemorySnapshotRecord> {
    await this.ensureStorageInitialized();

    const allRecords = await this.query({});
    const snapshotRecords = this.selectSnapshotRecords(allRecords, options.recordKeys ?? []);
    const snapshotId = randomUUID();
    const createdAt = new Date().toISOString();
    const snapshotPath = resolve(this.snapshotsDirectoryPath, `${snapshotId}.json`);

    await mkdir(this.snapshotsDirectoryPath, { recursive: true });
    await writeFile(snapshotPath, JSON.stringify(snapshotRecords, null, 2), 'utf8');

    this.getDatabase()
      .prepare(
        `
          INSERT INTO ${SQLITE_FS_SNAPSHOTS_TABLE_NAME}
          (snapshot_id, created_at, reason, record_count, snapshot_path)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(snapshotId, createdAt, options.reason ?? '', snapshotRecords.length, snapshotPath);

    return {
      snapshotId,
      createdAt,
      ...(options.reason ? { reason: options.reason } : {}),
      recordCount: snapshotRecords.length,
      snapshotPath,
    };
  }

  /**
   * Archives matched records and returns archived count.
   * @param options Archive options.
   * @returns Archived record count.
   */
  public async archive(options: MemoryArchiveOptions = {}): Promise<number> {
    await this.ensureStorageInitialized();

    const allRecords = await this.query({
      ...(options.namespace ? { namespace: options.namespace } : {}),
    });
    const recordsToArchive = allRecords.filter((record) =>
      this.shouldArchiveRecord(record, options),
    );

    if (recordsToArchive.length === 0) {
      return 0;
    }

    const archivedAt = new Date().toISOString();
    const database = this.getDatabase();

    this.runInTransaction(() => {
      const archiveStatement = database.prepare(
        `
          INSERT INTO ${SQLITE_FS_ARCHIVE_TABLE_NAME}
          (namespace, key, value_json, tags_json, updated_at, archived_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      );
      const deleteStatement = database.prepare(
        `DELETE FROM ${SQLITE_FS_RECORDS_TABLE_NAME} WHERE namespace = ? AND key = ?`,
      );

      for (const record of recordsToArchive) {
        archiveStatement.run(
          record.namespace,
          record.key,
          JSON.stringify(record.value),
          JSON.stringify(record.tags),
          record.updatedAt,
          archivedAt,
        );
        deleteStatement.run(record.namespace, record.key);
      }
    });

    return recordsToArchive.length;
  }

  /**
   * Closes sqlite connection when provider owns open database handle.
   * @returns Void.
   */
  public async dispose(): Promise<void> {
    if (!this.databaseConnection) {
      return;
    }

    try {
      this.databaseConnection.close();
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_WRITE_FAILED,
        'Failed to dispose sqlite+fs memory provider connection.',
        {
          databaseFilePath: this.databaseFilePath,
        },
        error,
      );
    } finally {
      this.databaseConnection = null;
      this.initializationPromise = null;
    }
  }

  /**
   * Ensures sqlite database and snapshot directory exist exactly once.
   * @returns Void.
   */
  private async ensureStorageInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeStorage();
    }

    await this.initializationPromise;
  }

  /**
   * Initializes storage files, sqlite schema, and write-ahead logging mode.
   * @returns Void.
   */
  private async initializeStorage(): Promise<void> {
    if (this.databaseConnection) {
      return;
    }

    await mkdir(this.rootDirectoryPath, { recursive: true });
    await mkdir(this.snapshotsDirectoryPath, { recursive: true });

    const database = new DatabaseSync(this.databaseFilePath);
    database.exec('PRAGMA journal_mode = WAL;');
    database.exec(
      `
        CREATE TABLE IF NOT EXISTS ${SQLITE_FS_RECORDS_TABLE_NAME} (
          namespace TEXT NOT NULL,
          key TEXT NOT NULL,
          value_json TEXT NOT NULL,
          tags_json TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (namespace, key)
        );

        CREATE TABLE IF NOT EXISTS ${SQLITE_FS_SNAPSHOTS_TABLE_NAME} (
          snapshot_id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          reason TEXT,
          record_count INTEGER NOT NULL,
          snapshot_path TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ${SQLITE_FS_ARCHIVE_TABLE_NAME} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          namespace TEXT NOT NULL,
          key TEXT NOT NULL,
          value_json TEXT NOT NULL,
          tags_json TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          archived_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_memory_records_namespace_updated_at
        ON ${SQLITE_FS_RECORDS_TABLE_NAME}(namespace, updated_at);
      `,
    );

    this.databaseConnection = database;
  }

  /**
   * Returns initialized sqlite database connection.
   * @returns Database connection.
   */
  private getDatabase(): DatabaseSync {
    if (this.databaseConnection) {
      return this.databaseConnection;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_STORE_WRITE_FAILED,
      'Sqlite+fs memory provider database is not initialized.',
      {
        databaseFilePath: this.databaseFilePath,
      },
    );
  }

  /**
   * Runs mutating sqlite statements in one immediate transaction.
   * @param transactionBody Transaction body callback.
   * @returns Void.
   */
  private runInTransaction(transactionBody: () => void): void {
    const database = this.getDatabase();
    database.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
      transactionBody();
      database.exec('COMMIT;');
    } catch (error) {
      database.exec('ROLLBACK;');
      throw error;
    }
  }

  /**
   * Converts one sqlite row into normalized record payload.
   * @param row Sqlite row.
   * @returns Normalized record.
   */
  private toMemoryRecord(row: SqliteMemoryRow): MemoryRecord {
    const parsedValue = this.parseJsonCell<unknown>(row.valueJson, {
      namespace: row.namespace,
      key: row.key,
      field: 'value_json',
    });

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_READ_FAILED,
        'Memory record value_json must parse to an object.',
        {
          namespace: row.namespace,
          key: row.key,
          field: 'value_json',
        },
      );
    }

    const parsedTags = this.parseJsonCell<unknown>(row.tagsJson, {
      namespace: row.namespace,
      key: row.key,
      field: 'tags_json',
    });

    return {
      namespace: row.namespace,
      key: row.key,
      value: parsedValue as Record<string, unknown>,
      tags: Array.isArray(parsedTags)
        ? parsedTags.filter((tagValue): tagValue is string => typeof tagValue === 'string')
        : [],
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Parses one JSON sqlite cell with standardized diagnostics.
   * @param cellValue Raw JSON text.
   * @param context Diagnostic context.
   * @returns Parsed JSON payload.
   */
  private parseJsonCell<T>(
    cellValue: string,
    context: {
      namespace: string;
      key: string;
      field: string;
    },
  ): T {
    try {
      return JSON.parse(cellValue) as T;
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_STORE_READ_FAILED,
        'Failed to parse sqlite JSON cell in memory provider.',
        context,
        error,
      );
    }
  }

  /**
   * Builds one escaped LIKE prefix pattern from literal key prefix.
   * @param keyPrefix Literal key prefix.
   * @returns Escaped sqlite LIKE pattern.
   */
  private toLikePrefixPattern(keyPrefix: string): string {
    return `${keyPrefix.replace(/([\\%_])/gu, '\\$1')}%`;
  }

  /**
   * Selects snapshot records by optional namespace:key list.
   * @param records All current records.
   * @param recordKeys Snapshot target keys.
   * @returns Selected snapshot records.
   */
  private selectSnapshotRecords(records: MemoryRecord[], recordKeys: string[]): MemoryRecord[] {
    if (recordKeys.length === 0) {
      return records;
    }

    const selectedKeys = new Set(recordKeys);
    return records.filter((record) => selectedKeys.has(this.toScopedRecordKey(record)));
  }

  /**
   * Determines whether one record should be archived by options.
   * @param record Candidate record.
   * @param options Archive options.
   * @returns Whether archive condition matches.
   */
  private shouldArchiveRecord(record: MemoryRecord, options: MemoryArchiveOptions): boolean {
    if (options.namespace && record.namespace !== options.namespace) {
      return false;
    }

    if (
      options.keys &&
      options.keys.length > 0 &&
      !options.keys.includes(this.toScopedRecordKey(record))
    ) {
      return false;
    }

    if (!options.updatedBefore) {
      return true;
    }

    return this.isTimestampBefore(record.updatedAt, options.updatedBefore);
  }

  /**
   * Compares timestamps with parse-first and lexical fallback strategy.
   * @param leftTimestamp Candidate timestamp.
   * @param rightTimestamp Upper-bound timestamp.
   * @returns Whether left timestamp is before right timestamp.
   */
  private isTimestampBefore(leftTimestamp: string, rightTimestamp: string): boolean {
    const leftEpoch = Date.parse(leftTimestamp);
    const rightEpoch = Date.parse(rightTimestamp);

    if (Number.isNaN(leftEpoch) || Number.isNaN(rightEpoch)) {
      return leftTimestamp < rightTimestamp;
    }

    return leftEpoch < rightEpoch;
  }

  /**
   * Builds scoped record key for provider-level stable matching.
   * @param record Memory record.
   * @returns Scoped key in `namespace:key` format.
   */
  private toScopedRecordKey(record: MemoryRecord): string {
    return `${record.namespace}:${record.key}`;
  }
}
