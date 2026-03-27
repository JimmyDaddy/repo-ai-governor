import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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
  FS_CSV_ARCHIVE_FILE_NAME,
  FS_CSV_ARCHIVE_HEADER,
  FS_CSV_RECORDS_FILE_NAME,
  FS_CSV_RECORDS_HEADER,
  FS_CSV_SNAPSHOTS_DIRECTORY_NAME,
  FS_CSV_SNAPSHOTS_FILE_NAME,
  FS_CSV_SNAPSHOTS_HEADER,
} from './constants/index.js';
import type { FsCsvMemoryStoreProviderOptions } from './types/index.js';

interface SnapshotCsvRow {
  snapshotId: string;
  createdAt: string;
  reason: string;
  recordCount: number;
  snapshotPath: string;
}

interface ArchiveCsvRow {
  namespace: string;
  key: string;
  valueJson: string;
  tagsJson: string;
  updatedAt: string;
  archivedAt: string;
}

/**
 * Implements a file-system CSV-backed memory provider baseline.
 *
 * Why this exists:
 * Stage-2 baseline needs a deterministic local provider so runtime and session
 * features can run without introducing database dependencies too early.
 */
export class FsCsvMemoryStoreProvider implements MemoryStoreProvider {
  private readonly rootDirectoryPath: string;
  private readonly recordsFilePath: string;
  private readonly snapshotsFilePath: string;
  private readonly archiveFilePath: string;
  private readonly snapshotsDirectoryPath: string;
  private initializationPromise: Promise<void> | null = null;

  constructor(options: FsCsvMemoryStoreProviderOptions) {
    this.rootDirectoryPath = resolve(options.rootDirectory);
    this.recordsFilePath = resolve(
      this.rootDirectoryPath,
      options.recordsFileName ?? FS_CSV_RECORDS_FILE_NAME,
    );
    this.snapshotsFilePath = resolve(
      this.rootDirectoryPath,
      options.snapshotsFileName ?? FS_CSV_SNAPSHOTS_FILE_NAME,
    );
    this.archiveFilePath = resolve(
      this.rootDirectoryPath,
      options.archiveFileName ?? FS_CSV_ARCHIVE_FILE_NAME,
    );
    this.snapshotsDirectoryPath = resolve(
      this.rootDirectoryPath,
      options.snapshotsDirectoryName ?? FS_CSV_SNAPSHOTS_DIRECTORY_NAME,
    );
  }

  /**
   * Reads one memory record by namespace and key.
   * @param namespace Record namespace.
   * @param key Record key.
   * @returns Matching record, or undefined when absent.
   */
  public async read(namespace: string, key: string): Promise<MemoryRecord | undefined> {
    const records = await this.readRecords();
    return records.find((record) => record.namespace === namespace && record.key === key);
  }

  /**
   * Upserts one memory record into records CSV.
   * @param record Normalized memory record.
   * @returns Void.
   */
  public async write(record: MemoryRecord): Promise<void> {
    const records = await this.readRecords();
    const existingRecordIndex = records.findIndex(
      (currentRecord) =>
        currentRecord.namespace === record.namespace && currentRecord.key === record.key,
    );

    if (existingRecordIndex === -1) {
      records.push(record);
    } else {
      records[existingRecordIndex] = record;
    }

    await this.writeRecords(records);
  }

  /**
   * Queries records by namespace/key-prefix/tag filters.
   * @param request Query request.
   * @returns Matched records.
   */
  public async query(request: MemoryQueryRequest): Promise<MemoryRecord[]> {
    const records = await this.readRecords();
    const filteredRecords = records.filter((record) => this.isRecordMatched(record, request));

    if (!request.limit || request.limit <= 0) {
      return filteredRecords;
    }

    return filteredRecords.slice(0, request.limit);
  }

  /**
   * Creates snapshot payload and records snapshot metadata.
   * @param options Snapshot options.
   * @returns Snapshot metadata.
   */
  public async snapshot(options: MemorySnapshotOptions = {}): Promise<MemorySnapshotRecord> {
    const records = await this.readRecords();
    const snapshotRecords = this.selectSnapshotRecords(records, options.recordKeys ?? []);
    const snapshotId = randomUUID();
    const createdAt = new Date().toISOString();
    const snapshotPath = resolve(this.snapshotsDirectoryPath, `${snapshotId}.json`);

    await mkdir(this.snapshotsDirectoryPath, { recursive: true });
    await writeFile(snapshotPath, JSON.stringify(snapshotRecords, null, 2), 'utf8');

    const snapshotRows = await this.readSnapshotRows();
    snapshotRows.push({
      snapshotId,
      createdAt,
      reason: options.reason ?? '',
      recordCount: snapshotRecords.length,
      snapshotPath,
    });
    await this.writeSnapshotRows(snapshotRows);

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
    const records = await this.readRecords();
    const archivedAt = new Date().toISOString();

    const recordsToArchive = records.filter((record) => this.shouldArchiveRecord(record, options));
    if (recordsToArchive.length === 0) {
      return 0;
    }

    const activeRecords = records.filter((record) => !this.shouldArchiveRecord(record, options));
    await this.writeRecords(activeRecords);

    const archiveRows = await this.readArchiveRows();
    archiveRows.push(
      ...recordsToArchive.map((record) => ({
        namespace: record.namespace,
        key: record.key,
        valueJson: JSON.stringify(record.value),
        tagsJson: JSON.stringify(record.tags),
        updatedAt: record.updatedAt,
        archivedAt,
      })),
    );
    await this.writeArchiveRows(archiveRows);

    return recordsToArchive.length;
  }

  /**
   * Releases provider resources.
   * @returns Void.
   */
  public async dispose(): Promise<void> {
    // Why: fs-csv provider holds no persistent handles, but keeps contract parity with sqlite-fs.
  }

  /**
   * Reads all normalized records from records CSV.
   * @returns All stored records.
   */
  private async readRecords(): Promise<MemoryRecord[]> {
    await this.ensureStorageInitialized();
    const csvContent = await readFile(this.recordsFilePath, 'utf8');
    const csvLines = csvContent
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (csvLines.length <= 1) {
      return [];
    }

    return csvLines.slice(1).map((line, lineIndex) => {
      const rowValues = this.parseCsvLine(line);
      if (rowValues.length !== FS_CSV_RECORDS_HEADER.length) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_STORE_READ_FAILED,
          'Invalid memory-records.csv row width.',
          {
            lineNumber: lineIndex + 2,
            expected: FS_CSV_RECORDS_HEADER.length,
            actual: rowValues.length,
            filePath: this.recordsFilePath,
          },
        );
      }

      const parsedTags = this.parseJsonCell<string[]>(rowValues[3] ?? '[]');
      return {
        namespace: rowValues[0] ?? '',
        key: rowValues[1] ?? '',
        value: this.parseJsonCell<Record<string, unknown>>(rowValues[2] ?? '{}'),
        tags: Array.isArray(parsedTags) ? parsedTags : [],
        updatedAt: rowValues[4] ?? '',
      };
    });
  }

  /**
   * Writes normalized records back to records CSV.
   * @param records Records to persist.
   * @returns Void.
   */
  private async writeRecords(records: MemoryRecord[]): Promise<void> {
    await this.ensureStorageInitialized();
    const csvRows = [
      FS_CSV_RECORDS_HEADER.join(','),
      ...records.map((record) =>
        this.buildCsvLine([
          record.namespace,
          record.key,
          JSON.stringify(record.value),
          JSON.stringify(record.tags),
          record.updatedAt,
        ]),
      ),
    ];
    await writeFile(this.recordsFilePath, `${csvRows.join('\n')}\n`, 'utf8');
  }

  /**
   * Reads snapshot metadata rows from snapshots CSV.
   * @returns Parsed snapshot rows.
   */
  private async readSnapshotRows(): Promise<SnapshotCsvRow[]> {
    await this.ensureStorageInitialized();
    const csvContent = await readFile(this.snapshotsFilePath, 'utf8');
    const csvLines = csvContent
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (csvLines.length <= 1) {
      return [];
    }

    return csvLines.slice(1).map((line) => {
      const rowValues = this.parseCsvLine(line);
      return {
        snapshotId: rowValues[0] ?? '',
        createdAt: rowValues[1] ?? '',
        reason: rowValues[2] ?? '',
        recordCount: Number.parseInt(rowValues[3] ?? '0', 10) || 0,
        snapshotPath: rowValues[4] ?? '',
      };
    });
  }

  /**
   * Writes snapshot metadata rows to snapshots CSV.
   * @param rows Snapshot metadata rows.
   * @returns Void.
   */
  private async writeSnapshotRows(rows: SnapshotCsvRow[]): Promise<void> {
    const csvRows = [
      FS_CSV_SNAPSHOTS_HEADER.join(','),
      ...rows.map((row) =>
        this.buildCsvLine([
          row.snapshotId,
          row.createdAt,
          row.reason,
          String(row.recordCount),
          row.snapshotPath,
        ]),
      ),
    ];
    await writeFile(this.snapshotsFilePath, `${csvRows.join('\n')}\n`, 'utf8');
  }

  /**
   * Reads archive rows from archive CSV.
   * @returns Parsed archive rows.
   */
  private async readArchiveRows(): Promise<ArchiveCsvRow[]> {
    await this.ensureStorageInitialized();
    const csvContent = await readFile(this.archiveFilePath, 'utf8');
    const csvLines = csvContent
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (csvLines.length <= 1) {
      return [];
    }

    return csvLines.slice(1).map((line) => {
      const rowValues = this.parseCsvLine(line);
      return {
        namespace: rowValues[0] ?? '',
        key: rowValues[1] ?? '',
        valueJson: rowValues[2] ?? '{}',
        tagsJson: rowValues[3] ?? '[]',
        updatedAt: rowValues[4] ?? '',
        archivedAt: rowValues[5] ?? '',
      };
    });
  }

  /**
   * Writes archive rows into archive CSV.
   * @param rows Archive rows.
   * @returns Void.
   */
  private async writeArchiveRows(rows: ArchiveCsvRow[]): Promise<void> {
    const csvRows = [
      FS_CSV_ARCHIVE_HEADER.join(','),
      ...rows.map((row) =>
        this.buildCsvLine([
          row.namespace,
          row.key,
          row.valueJson,
          row.tagsJson,
          row.updatedAt,
          row.archivedAt,
        ]),
      ),
    ];
    await writeFile(this.archiveFilePath, `${csvRows.join('\n')}\n`, 'utf8');
  }

  /**
   * Ensures provider root directory and CSV files exist.
   * @returns Void.
   */
  private async ensureStorageInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeStorage();
    }

    await this.initializationPromise;
  }

  /**
   * Creates provider storage directories and CSV files.
   * @returns Void.
   */
  private async initializeStorage(): Promise<void> {
    await mkdir(this.rootDirectoryPath, { recursive: true });
    await mkdir(this.snapshotsDirectoryPath, { recursive: true });
    await this.ensureCsvFile(this.recordsFilePath, FS_CSV_RECORDS_HEADER);
    await this.ensureCsvFile(this.snapshotsFilePath, FS_CSV_SNAPSHOTS_HEADER);
    await this.ensureCsvFile(this.archiveFilePath, FS_CSV_ARCHIVE_HEADER);
  }

  /**
   * Ensures CSV file exists and starts with one header row.
   * @param filePath CSV file path.
   * @param headerColumns Header columns.
   * @returns Void.
   */
  private async ensureCsvFile(filePath: string, headerColumns: readonly string[]): Promise<void> {
    if (existsSync(filePath)) {
      return;
    }
    await writeFile(filePath, `${headerColumns.join(',')}\n`, 'utf8');
  }

  /**
   * Checks whether one record matches query filters.
   * @param record Candidate record.
   * @param request Query request.
   * @returns True when record matches all active filters.
   */
  private isRecordMatched(record: MemoryRecord, request: MemoryQueryRequest): boolean {
    if (request.namespace && record.namespace !== request.namespace) {
      return false;
    }

    if (request.keyPrefix && !record.key.startsWith(request.keyPrefix)) {
      return false;
    }

    if (request.tag && !record.tags.includes(request.tag)) {
      return false;
    }

    return true;
  }

  /**
   * Filters records for snapshot payload.
   * @param records Candidate records.
   * @param recordKeys Target keys.
   * @returns Records selected for snapshot.
   */
  private selectSnapshotRecords(records: MemoryRecord[], recordKeys: string[]): MemoryRecord[] {
    if (recordKeys.length === 0) {
      return records;
    }

    const keySet = new Set(recordKeys);
    return records.filter((record) => keySet.has(this.toScopedRecordKey(record)));
  }

  /**
   * Checks whether one record should be moved into archive.
   * @param record Candidate record.
   * @param options Archive options.
   * @returns True when record should be archived.
   */
  private shouldArchiveRecord(record: MemoryRecord, options: MemoryArchiveOptions): boolean {
    if (options.namespace && options.namespace !== record.namespace) {
      return false;
    }

    if (options.updatedBefore) {
      const updatedBeforeMs = Date.parse(options.updatedBefore);
      const updatedAtMs = Date.parse(record.updatedAt);
      if (
        Number.isNaN(updatedBeforeMs) ||
        Number.isNaN(updatedAtMs) ||
        updatedAtMs >= updatedBeforeMs
      ) {
        return false;
      }
    }

    if (!options.keys || options.keys.length === 0) {
      return true;
    }

    return options.keys.includes(this.toScopedRecordKey(record));
  }

  /**
   * Builds scoped record key for provider-level stable matching.
   * @param record Memory record.
   * @returns Scoped key in `namespace:key` format.
   */
  private toScopedRecordKey(record: MemoryRecord): string {
    return `${record.namespace}:${record.key}`;
  }

  /**
   * Parses one CSV row line with quote support.
   * @param line One CSV row line.
   * @returns Parsed cell values.
   */
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index] ?? '';
      const nextCharacter = line[index + 1] ?? '';

      if (character === '"') {
        if (inQuotes && nextCharacter === '"') {
          currentValue += '"';
          index += 1;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (character === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
        continue;
      }

      currentValue += character;
    }

    values.push(currentValue);
    return values;
  }

  /**
   * Builds one CSV row from cell values.
   * @param values Cell values.
   * @returns CSV row line.
   */
  private buildCsvLine(values: string[]): string {
    return values.map((value) => this.escapeCsvCell(value)).join(',');
  }

  /**
   * Escapes one CSV cell.
   * @param value Raw cell value.
   * @returns Escaped CSV cell.
   */
  private escapeCsvCell(value: string): string {
    const normalizedValue = value ?? '';
    const escapedValue = normalizedValue.replace(/"/gu, '""');
    const requiresQuotes =
      escapedValue.includes(',') ||
      escapedValue.includes('"') ||
      escapedValue.includes('\n') ||
      escapedValue.includes('\r');

    if (!requiresQuotes) {
      return escapedValue;
    }

    return `"${escapedValue}"`;
  }

  /**
   * Parses JSON cell content into typed payload.
   * @param jsonValue JSON source text.
   * @returns Parsed payload.
   */
  private parseJsonCell<T>(jsonValue: string): T {
    return JSON.parse(jsonValue) as T;
  }
}
