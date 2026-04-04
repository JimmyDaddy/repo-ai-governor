import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { MemoryStoreEngine, standardizeError } from '@repo-ai-governor/shared';
import { CliGovernanceCheckStatus } from '../constants/cli-governance-runtime.constant.js';
import type {
  CliArtifactRegistryCanonicalDiagnostics,
  CliArtifactRegistryRenderedViewDiagnostics,
  CliCommandResultCheck,
  CliDurableStorageDiagnosticsSnapshot,
  CliDurableStorageInspectionOptions,
  CliSessionDurableTruthDiagnostics,
  CliTaskLedgerCanonicalTruthDiagnostics,
} from '../types/index.js';

const ARTIFACT_REGISTRY_SQLITE_FILE_SEGMENTS = [
  'context',
  'artifact-registry',
  'sqlite',
  'artifact-registry.sqlite',
] as const;
const ARTIFACT_REGISTRY_MAIN_VIEW_SEGMENTS = [
  'context',
  'artifact-registry',
  'artifacts.csv',
] as const;
const ARTIFACT_REGISTRY_ARCHIVE_VIEW_SEGMENTS = [
  'context',
  'artifact-registry',
  'archive',
  'artifacts.archive.csv',
] as const;
const TASK_LEDGER_ROOT_SEGMENTS = ['context', 'dev'] as const;
const TASK_LEDGER_CANONICAL_TRUTH_FILE_SEGMENTS = [
  'context',
  'dev',
  'sqlite',
  'task-ledger.sqlite',
] as const;
const TASK_LEDGER_LEGACY_PROJECTION_FILE_SEGMENTS = [
  'context',
  'dev',
  'sqlite',
  'task-ledger-projection.sqlite',
] as const;
const TASK_LEDGER_CANONICAL_SOURCES_TABLE_NAME = 'task_ledger_sources';
const TASK_LEDGER_CANONICAL_ROWS_TABLE_NAME = 'task_ledger_rows';
const TASK_LEDGER_LEGACY_SOURCES_TABLE_NAME = 'task_ledger_projection_sources';
const TASK_LEDGER_LEGACY_ROWS_TABLE_NAME = 'task_ledger_projection_rows';
const ARTIFACT_REGISTRY_MAIN_TABLE_NAME = 'artifact_registry_main';
const ARTIFACT_REGISTRY_ARCHIVE_TABLE_NAME = 'artifact_registry_archive';
// literal-allowed: mirrors the sqlite-fs provider durable database filename contract.
const SQLITE_MEMORY_STORE_DATABASE_FILE_NAME = 'memory-store.sqlite';
const DURABLE_STORAGE_CHECK_IDS = {
  SESSION_DURABLE_TRUTH: 'session_durable_truth',
  ARTIFACT_REGISTRY_CANONICAL_TRUTH: 'artifact_registry_canonical_truth',
  ARTIFACT_REGISTRY_RENDERED_VIEWS: 'artifact_registry_rendered_views',
  TASK_LEDGER_CANONICAL_TRUTH: 'task_ledger_canonical_truth',
} as const;
const CSV_REGISTRY_HEADERS = [
  'artifact_id',
  'artifact_type',
  'artifact_path',
  'artifact_version',
  'artifact_status',
  'producer_task_id',
  'producer_execution_id',
  'registered_at',
  'last_updated_at',
  'dependent_tasks',
] as const;

interface TaskLedgerCsvSourceSummary {
  absolutePath: string;
  mtimeMs: number;
  size: number;
  rowCount: number;
}

interface TaskLedgerCanonicalSourceRow {
  sourcePath: string;
  sourceMtimeMs: number;
  sourceSize: number;
}

/**
 * Owns CLI-local durable-storage inspection so `doctor` and `verify` can surface
 * sqlite cutover health without duplicating sqlite/fs probing logic.
 */
export class CliDurableStorageDiagnosticsRuntime {
  /**
   * Collects one full durable-storage diagnostics snapshot for the active workspace.
   * @param options Workspace and memory-provider inspection inputs.
   * @returns Structured snapshot for command diagnostics and checks.
   */
  public async inspect(
    options: CliDurableStorageInspectionOptions,
  ): Promise<CliDurableStorageDiagnosticsSnapshot> {
    const artifactRegistryPaths = this.resolveArtifactRegistryPaths(options.workspaceRoot);
    const sessionDurableTruth = this.inspectSessionDurableTruth(options);
    const artifactRegistryCanonicalTruth =
      await this.inspectArtifactRegistryCanonicalTruth(artifactRegistryPaths);
    const artifactRegistryRenderedViews = this.inspectArtifactRegistryRenderedViews(
      artifactRegistryCanonicalTruth,
    );
    const taskLedgerCanonicalTruth = this.inspectTaskLedgerCanonicalTruth(options.workspaceRoot);

    return {
      sessionDurableTruth,
      artifactRegistryCanonicalTruth,
      artifactRegistryRenderedViews,
      taskLedgerCanonicalTruth,
    };
  }

  /**
   * Converts one durable-storage snapshot into normalized command checks.
   * @param snapshot Durable-storage snapshot.
   * @returns Flat command checks for doctor/verify outputs.
   */
  public createChecks(snapshot: CliDurableStorageDiagnosticsSnapshot): CliCommandResultCheck[] {
    return [
      {
        id: DURABLE_STORAGE_CHECK_IDS.SESSION_DURABLE_TRUTH,
        status: snapshot.sessionDurableTruth.status,
        detail: snapshot.sessionDurableTruth.detail,
      },
      {
        id: DURABLE_STORAGE_CHECK_IDS.ARTIFACT_REGISTRY_CANONICAL_TRUTH,
        status: snapshot.artifactRegistryCanonicalTruth.status,
        detail: snapshot.artifactRegistryCanonicalTruth.detail,
      },
      {
        id: DURABLE_STORAGE_CHECK_IDS.ARTIFACT_REGISTRY_RENDERED_VIEWS,
        status: snapshot.artifactRegistryRenderedViews.status,
        detail: snapshot.artifactRegistryRenderedViews.detail,
      },
      {
        id: DURABLE_STORAGE_CHECK_IDS.TASK_LEDGER_CANONICAL_TRUTH,
        status: snapshot.taskLedgerCanonicalTruth.status,
        detail: snapshot.taskLedgerCanonicalTruth.detail,
      },
    ];
  }

  /**
   * Collapses multiple durable-storage surfaces into one aggregate check status.
   * @param snapshot Durable-storage snapshot.
   * @returns Aggregate pass/warn/fail status.
   */
  public resolveOverallStatus(
    snapshot: CliDurableStorageDiagnosticsSnapshot,
  ): CliGovernanceCheckStatus {
    const statuses = [
      snapshot.sessionDurableTruth.status,
      snapshot.artifactRegistryCanonicalTruth.status,
      snapshot.artifactRegistryRenderedViews.status,
      snapshot.taskLedgerCanonicalTruth.status,
    ];

    if (statuses.includes(CliGovernanceCheckStatus.FAIL)) {
      return CliGovernanceCheckStatus.FAIL;
    }

    if (statuses.includes(CliGovernanceCheckStatus.WARN)) {
      return CliGovernanceCheckStatus.WARN;
    }

    return CliGovernanceCheckStatus.PASS;
  }

  /**
   * Resolves durable-storage check ids for command/tests that need stable references.
   * @returns Stable check id map.
   */
  public getCheckIds() {
    return DURABLE_STORAGE_CHECK_IDS;
  }

  /**
   * Inspects runtime session durable-truth selection and provider alignment.
   * @param options Inspection inputs.
   * @returns Session durable-truth diagnostics.
   */
  private inspectSessionDurableTruth(
    options: CliDurableStorageInspectionOptions,
  ): CliSessionDurableTruthDiagnostics {
    const sqliteDatabasePath = resolve(
      options.memoryStoreRoot,
      SQLITE_MEMORY_STORE_DATABASE_FILE_NAME,
    );
    const databaseFileExists = existsSync(sqliteDatabasePath);
    const providerLooksSqlite = /sqlite/iu.test(options.memoryStoreProviderName);
    const expectedStoreEngine = MemoryStoreEngine.SQLITE_FS;

    if (options.configuredStoreEngine === expectedStoreEngine && providerLooksSqlite) {
      return {
        status: CliGovernanceCheckStatus.PASS,
        state: databaseFileExists ? 'sqlite_fs_ready' : 'sqlite_fs_not_materialized',
        detail: [
          `state=${databaseFileExists ? 'sqlite_fs_ready' : 'sqlite_fs_not_materialized'}`,
          `expected_store_engine=${expectedStoreEngine}`,
          `configured_store_engine=${options.configuredStoreEngine}`,
          `provider=${options.memoryStoreProviderName}`,
          `database_present=${databaseFileExists}`,
          `database_path=${sqliteDatabasePath}`,
        ].join(' '),
        expectedStoreEngine,
        configuredStoreEngine: options.configuredStoreEngine,
        memoryStoreProviderName: options.memoryStoreProviderName,
        memoryStoreRoot: options.memoryStoreRoot,
        sqliteDatabasePath,
        databaseFileExists,
      };
    }

    return {
      status: CliGovernanceCheckStatus.WARN,
      state:
        options.configuredStoreEngine === expectedStoreEngine
          ? 'provider_override'
          : 'legacy_store_engine',
      detail: [
        `state=${options.configuredStoreEngine === expectedStoreEngine ? 'provider_override' : 'legacy_store_engine'}`,
        `expected_store_engine=${expectedStoreEngine}`,
        `configured_store_engine=${options.configuredStoreEngine}`,
        `provider=${options.memoryStoreProviderName}`,
        `database_present=${databaseFileExists}`,
        `database_path=${sqliteDatabasePath}`,
      ].join(' '),
      expectedStoreEngine,
      configuredStoreEngine: options.configuredStoreEngine,
      memoryStoreProviderName: options.memoryStoreProviderName,
      memoryStoreRoot: options.memoryStoreRoot,
      sqliteDatabasePath,
      databaseFileExists,
    };
  }

  /**
   * Inspects artifact-registry canonical sqlite truth without mutating rendered views.
   * @param paths Resolved canonical/view paths.
   * @returns Canonical truth diagnostics.
   */
  private async inspectArtifactRegistryCanonicalTruth(paths: {
    databaseFilePath: string;
    mainRegistryPath: string;
    archiveRegistryPath: string;
  }): Promise<CliArtifactRegistryCanonicalDiagnostics> {
    const databaseFileExists = existsSync(paths.databaseFilePath);
    const renderedMainContent = this.readTextIfExists(paths.mainRegistryPath);
    const renderedArchiveContent = this.readTextIfExists(paths.archiveRegistryPath);
    const renderedViewHasContent =
      renderedMainContent.length > 0 || renderedArchiveContent.length > 0;

    if (!databaseFileExists) {
      return {
        status: renderedViewHasContent
          ? CliGovernanceCheckStatus.FAIL
          : CliGovernanceCheckStatus.WARN,
        state: renderedViewHasContent ? 'missing_with_rendered_views' : 'uninitialized',
        detail: [
          `state=${renderedViewHasContent ? 'missing_with_rendered_views' : 'uninitialized'}`,
          'database_present=false',
          'main_rows=0',
          'archive_rows=0',
          `database_path=${paths.databaseFilePath}`,
        ].join(' '),
        databaseFilePath: paths.databaseFilePath,
        mainRegistryPath: paths.mainRegistryPath,
        archiveRegistryPath: paths.archiveRegistryPath,
        databaseFileExists: false,
        mainRowCount: 0,
        archiveRowCount: 0,
      };
    }

    const databaseConnection = this.openReadOnlySqliteDatabase(paths.databaseFilePath);

    try {
      const mainRows = this.readArtifactRegistryRows(
        databaseConnection,
        ARTIFACT_REGISTRY_MAIN_TABLE_NAME,
      );
      const archiveRows = this.readArtifactRegistryRows(
        databaseConnection,
        ARTIFACT_REGISTRY_ARCHIVE_TABLE_NAME,
      );
      const totalRowCount = mainRows.length + archiveRows.length;

      return {
        status: totalRowCount > 0 ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
        state: totalRowCount > 0 ? 'ready' : 'empty',
        detail: [
          `state=${totalRowCount > 0 ? 'ready' : 'empty'}`,
          'database_present=true',
          `main_rows=${mainRows.length}`,
          `archive_rows=${archiveRows.length}`,
          `database_path=${paths.databaseFilePath}`,
        ].join(' '),
        databaseFilePath: paths.databaseFilePath,
        mainRegistryPath: paths.mainRegistryPath,
        archiveRegistryPath: paths.archiveRegistryPath,
        databaseFileExists: true,
        mainRowCount: mainRows.length,
        archiveRowCount: archiveRows.length,
      };
    } catch (error) {
      return {
        status: CliGovernanceCheckStatus.FAIL,
        state: 'read_failed',
        detail: [
          'state=read_failed',
          `database_present=${databaseFileExists}`,
          `reason=${this.sanitizeInlineError(error)}`,
          `database_path=${paths.databaseFilePath}`,
        ].join(' '),
        databaseFilePath: paths.databaseFilePath,
        mainRegistryPath: paths.mainRegistryPath,
        archiveRegistryPath: paths.archiveRegistryPath,
        databaseFileExists,
        mainRowCount: 0,
        archiveRowCount: 0,
      };
    } finally {
      databaseConnection.close();
    }
  }

  /**
   * Inspects whether rendered artifact-registry CSV views still match canonical sqlite truth.
   * @param canonicalDiagnostics Canonical-truth diagnostics used to decide read strategy.
   * @returns Rendered-view diagnostics.
   */
  private inspectArtifactRegistryRenderedViews(
    canonicalDiagnostics: CliArtifactRegistryCanonicalDiagnostics,
  ): CliArtifactRegistryRenderedViewDiagnostics {
    if (!canonicalDiagnostics.databaseFileExists) {
      return {
        status:
          canonicalDiagnostics.status === CliGovernanceCheckStatus.FAIL
            ? CliGovernanceCheckStatus.FAIL
            : CliGovernanceCheckStatus.WARN,
        state:
          canonicalDiagnostics.status === CliGovernanceCheckStatus.FAIL
            ? 'orphaned_rendered_views'
            : 'uninitialized',
        detail: [
          `state=${canonicalDiagnostics.status === CliGovernanceCheckStatus.FAIL ? 'orphaned_rendered_views' : 'uninitialized'}`,
          'main_match=null',
          'archive_match=null',
          `main_registry_path=${canonicalDiagnostics.mainRegistryPath}`,
          `archive_registry_path=${canonicalDiagnostics.archiveRegistryPath}`,
        ].join(' '),
        mainRegistryPath: canonicalDiagnostics.mainRegistryPath,
        archiveRegistryPath: canonicalDiagnostics.archiveRegistryPath,
        mainMatches: null,
        archiveMatches: null,
      };
    }

    const databaseConnection = this.openReadOnlySqliteDatabase(
      canonicalDiagnostics.databaseFilePath,
    );

    try {
      const mainRows = this.readArtifactRegistryRows(
        databaseConnection,
        ARTIFACT_REGISTRY_MAIN_TABLE_NAME,
      );
      const archiveRows = this.readArtifactRegistryRows(
        databaseConnection,
        ARTIFACT_REGISTRY_ARCHIVE_TABLE_NAME,
      );
      const expectedMainContent = this.serializeArtifactRegistryRows(mainRows);
      const expectedArchiveContent = this.serializeArtifactRegistryRows(archiveRows);
      const actualMainContent = this.readTextIfExists(canonicalDiagnostics.mainRegistryPath);
      const actualArchiveContent = this.readTextIfExists(canonicalDiagnostics.archiveRegistryPath);
      const mainMatches = actualMainContent === expectedMainContent;
      const archiveMatches = actualArchiveContent === expectedArchiveContent;
      const registryHasRows = mainRows.length + archiveRows.length > 0;
      const renderedFilesMissing =
        actualMainContent.length === 0 && actualArchiveContent.length === 0 && !registryHasRows;

      if (mainMatches && archiveMatches) {
        return {
          status: CliGovernanceCheckStatus.PASS,
          state: 'in_sync',
          detail: [
            'state=in_sync',
            'main_match=true',
            'archive_match=true',
            `main_registry_path=${canonicalDiagnostics.mainRegistryPath}`,
            `archive_registry_path=${canonicalDiagnostics.archiveRegistryPath}`,
          ].join(' '),
          mainRegistryPath: canonicalDiagnostics.mainRegistryPath,
          archiveRegistryPath: canonicalDiagnostics.archiveRegistryPath,
          mainMatches: true,
          archiveMatches: true,
        };
      }

      return {
        status:
          renderedFilesMissing && !registryHasRows
            ? CliGovernanceCheckStatus.WARN
            : CliGovernanceCheckStatus.FAIL,
        state: renderedFilesMissing && !registryHasRows ? 'not_rendered' : 'drift',
        detail: [
          `state=${renderedFilesMissing && !registryHasRows ? 'not_rendered' : 'drift'}`,
          `main_match=${mainMatches}`,
          `archive_match=${archiveMatches}`,
          `main_registry_path=${canonicalDiagnostics.mainRegistryPath}`,
          `archive_registry_path=${canonicalDiagnostics.archiveRegistryPath}`,
        ].join(' '),
        mainRegistryPath: canonicalDiagnostics.mainRegistryPath,
        archiveRegistryPath: canonicalDiagnostics.archiveRegistryPath,
        mainMatches,
        archiveMatches,
      };
    } catch (error) {
      return {
        status: CliGovernanceCheckStatus.FAIL,
        state: 'read_failed',
        detail: [
          'state=read_failed',
          `reason=${this.sanitizeInlineError(error)}`,
          `main_registry_path=${canonicalDiagnostics.mainRegistryPath}`,
          `archive_registry_path=${canonicalDiagnostics.archiveRegistryPath}`,
        ].join(' '),
        mainRegistryPath: canonicalDiagnostics.mainRegistryPath,
        archiveRegistryPath: canonicalDiagnostics.archiveRegistryPath,
        mainMatches: null,
        archiveMatches: null,
      };
    } finally {
      databaseConnection.close();
    }
  }

  /**
   * Inspects task-ledger sqlite canonical truth state without mutating the workspace.
   * @param workspaceRoot Active CLI workspace root.
   * @returns Canonical truth diagnostics.
   */
  private inspectTaskLedgerCanonicalTruth(
    workspaceRoot: string,
  ): CliTaskLedgerCanonicalTruthDiagnostics {
    const taskLedgerRoot = resolve(workspaceRoot, ...TASK_LEDGER_ROOT_SEGMENTS);
    const canonicalDatabaseFilePath = resolve(
      workspaceRoot,
      ...TASK_LEDGER_CANONICAL_TRUTH_FILE_SEGMENTS,
    );
    const legacyDatabaseFilePath = resolve(
      workspaceRoot,
      ...TASK_LEDGER_LEGACY_PROJECTION_FILE_SEGMENTS,
    );
    const sources = this.collectTaskLedgerCsvSources(taskLedgerRoot);
    const sourceRowCount = sources.reduce((total, source) => total + source.rowCount, 0);
    const databaseFilePath = existsSync(canonicalDatabaseFilePath)
      ? canonicalDatabaseFilePath
      : legacyDatabaseFilePath;
    const databaseFileExists = existsSync(databaseFilePath);

    if (!databaseFileExists) {
      return {
        status: CliGovernanceCheckStatus.WARN,
        state: sources.length > 0 ? 'missing' : 'no_sources',
        detail: [
          `state=${sources.length > 0 ? 'missing' : 'no_sources'}`,
          'database_present=false',
          `source_count=${sources.length}`,
          `source_rows=${sourceRowCount}`,
          'canonical_source_count=0',
          'canonical_rows=0',
          `database_path=${canonicalDatabaseFilePath}`,
        ].join(' '),
        taskLedgerRoot,
        databaseFilePath: canonicalDatabaseFilePath,
        sourceCount: sources.length,
        sourceRowCount,
        canonicalSourceCount: 0,
        canonicalRowCount: 0,
        databaseFileExists: false,
      };
    }

    const databaseConnection = this.openReadOnlySqliteDatabase(databaseFilePath);

    try {
      const tableNames = this.resolveTaskLedgerTableNames(databaseConnection);
      const projectedSources = databaseConnection
        .prepare(
          `
            SELECT
              source_path AS sourcePath,
              source_mtime_ms AS sourceMtimeMs,
              source_size AS sourceSize
            FROM ${tableNames.sourcesTableName}
            ORDER BY source_path ASC
          `,
        )
        .all() as unknown as TaskLedgerCanonicalSourceRow[];
      const projectedRowCountRecord = databaseConnection
        .prepare(`SELECT COUNT(*) AS total FROM ${tableNames.rowsTableName}`)
        .get() as { total?: number } | undefined;
      const canonicalRowCount = Number(projectedRowCountRecord?.total ?? 0);
      const canonicalTruthMatchesSources = this.taskLedgerCanonicalTruthMatchesSources(
        sources,
        projectedSources,
      );
      const rowCountMatches = sourceRowCount === canonicalRowCount;
      const canonicalSourceCount = projectedSources.length;

      if (sources.length === 0 && canonicalSourceCount === 0 && canonicalRowCount === 0) {
        return {
          status: CliGovernanceCheckStatus.WARN,
          state: 'no_sources',
          detail: [
            'state=no_sources',
            'database_present=true',
            'source_count=0',
            'source_rows=0',
            'canonical_source_count=0',
            'canonical_rows=0',
            `database_path=${databaseFilePath}`,
          ].join(' '),
          taskLedgerRoot,
          databaseFilePath,
          sourceCount: 0,
          sourceRowCount: 0,
          canonicalSourceCount,
          canonicalRowCount,
          databaseFileExists: true,
        };
      }

      if (canonicalTruthMatchesSources && rowCountMatches) {
        return {
          status: CliGovernanceCheckStatus.PASS,
          state: 'in_sync',
          detail: [
            'state=in_sync',
            'database_present=true',
            `source_count=${sources.length}`,
            `source_rows=${sourceRowCount}`,
            `canonical_source_count=${canonicalSourceCount}`,
            `canonical_rows=${canonicalRowCount}`,
            `database_path=${databaseFilePath}`,
          ].join(' '),
          taskLedgerRoot,
          databaseFilePath,
          sourceCount: sources.length,
          sourceRowCount,
          canonicalSourceCount,
          canonicalRowCount,
          databaseFileExists: true,
        };
      }

      return {
        status: CliGovernanceCheckStatus.FAIL,
        state: 'stale',
        detail: [
          'state=stale',
          'database_present=true',
          `source_count=${sources.length}`,
          `source_rows=${sourceRowCount}`,
          `canonical_source_count=${canonicalSourceCount}`,
          `canonical_rows=${canonicalRowCount}`,
          `database_path=${databaseFilePath}`,
        ].join(' '),
        taskLedgerRoot,
        databaseFilePath,
        sourceCount: sources.length,
        sourceRowCount,
        canonicalSourceCount,
        canonicalRowCount,
        databaseFileExists: true,
      };
    } catch (error) {
      return {
        status: CliGovernanceCheckStatus.FAIL,
        state: 'read_failed',
        detail: [
          'state=read_failed',
          `reason=${this.sanitizeInlineError(error)}`,
          `source_count=${sources.length}`,
          `source_rows=${sourceRowCount}`,
          `database_path=${databaseFilePath}`,
        ].join(' '),
        taskLedgerRoot,
        databaseFilePath,
        sourceCount: sources.length,
        sourceRowCount,
        canonicalSourceCount: 0,
        canonicalRowCount: 0,
        databaseFileExists: true,
      };
    } finally {
      databaseConnection.close();
    }
  }

  /**
   * Resolves artifact-registry canonical/view paths from workspace root.
   * @param workspaceRoot Active CLI workspace root.
   * @returns Absolute canonical/view paths.
   */
  private resolveArtifactRegistryPaths(workspaceRoot: string): {
    databaseFilePath: string;
    mainRegistryPath: string;
    archiveRegistryPath: string;
  } {
    return {
      databaseFilePath: resolve(workspaceRoot, ...ARTIFACT_REGISTRY_SQLITE_FILE_SEGMENTS),
      mainRegistryPath: resolve(workspaceRoot, ...ARTIFACT_REGISTRY_MAIN_VIEW_SEGMENTS),
      archiveRegistryPath: resolve(workspaceRoot, ...ARTIFACT_REGISTRY_ARCHIVE_VIEW_SEGMENTS),
    };
  }

  /**
   * Reads artifact-registry rows directly from one canonical sqlite table.
   * @param databaseConnection Open sqlite connection.
   * @param tableName Canonical table name.
   * @returns Normalized rendered-view rows.
   */
  private readArtifactRegistryRows(
    databaseConnection: DatabaseSync,
    tableName: string,
  ): Array<Record<(typeof CSV_REGISTRY_HEADERS)[number], string>> {
    const rows = databaseConnection
      .prepare(
        `
          SELECT
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
          FROM ${tableName}
          ORDER BY artifact_id ASC, artifact_version DESC
        `,
      )
      .all() as Array<{
      artifact_id: string;
      artifact_type: string;
      artifact_path: string;
      artifact_version: string;
      artifact_status: string;
      producer_task_id: string;
      producer_execution_id: string;
      registered_at: string;
      last_updated_at: string;
      dependent_tasks_json: string;
    }>;

    return rows.map((row) => ({
      artifact_id: row.artifact_id,
      artifact_type: row.artifact_type,
      artifact_path: row.artifact_path,
      artifact_version: row.artifact_version,
      artifact_status: row.artifact_status,
      producer_task_id: row.producer_task_id,
      producer_execution_id: row.producer_execution_id,
      registered_at: row.registered_at,
      last_updated_at: row.last_updated_at,
      dependent_tasks: this.parseDependentTasksJson(row.dependent_tasks_json).join('|'),
    }));
  }

  /**
   * Serializes artifact-registry rows into deterministic CSV content.
   * @param rows Normalized registry rows.
   * @returns CSV content.
   */
  private serializeArtifactRegistryRows(
    rows: Array<Record<(typeof CSV_REGISTRY_HEADERS)[number], string>>,
  ): string {
    const headerLine = CSV_REGISTRY_HEADERS.join(',');
    const rowLines = rows.map((row) =>
      CSV_REGISTRY_HEADERS.map((header) => this.escapeCsvCell(row[header] ?? '')).join(','),
    );

    return `${[headerLine, ...rowLines].join('\n')}\n`;
  }

  /**
   * Parses dependent-task JSON cell into deterministic task ids.
   * @param dependentTasksJson Raw JSON cell.
   * @returns Sorted task ids.
   */
  private parseDependentTasksJson(dependentTasksJson: string): string[] {
    try {
      const parsedValue = JSON.parse(dependentTasksJson) as unknown;
      if (!Array.isArray(parsedValue)) {
        return [];
      }

      return Array.from(
        new Set(
          parsedValue
            .filter((candidate): candidate is string => typeof candidate === 'string')
            .map((candidate) => candidate.trim())
            .filter((candidate) => candidate.length > 0),
        ),
      ).sort((left, right) => left.localeCompare(right));
    } catch {
      return [];
    }
  }

  /**
   * Escapes one CSV cell while preserving deterministic rendered-view output.
   * @param value Raw CSV cell.
   * @returns Escaped cell.
   */
  private escapeCsvCell(value: string): string {
    if (/["\n,]/u.test(value)) {
      return `"${value.replace(/"/gu, '""')}"`;
    }

    return value;
  }

  /**
   * Collects canonical `tasks/tasks.csv` sources under the workspace dev root.
   * @param taskLedgerRoot Absolute task-ledger root.
   * @returns Sorted canonical source summaries.
   */
  private collectTaskLedgerCsvSources(taskLedgerRoot: string): TaskLedgerCsvSourceSummary[] {
    if (!existsSync(taskLedgerRoot)) {
      return [];
    }

    const discoveredSources = new Set<string>();

    const walk = (directoryPath: string) => {
      const entries = readdirSync(directoryPath, { withFileTypes: true });
      for (const entry of entries) {
        const absolutePath = resolve(directoryPath, entry.name);
        if (entry.isDirectory()) {
          walk(absolutePath);
          continue;
        }

        if (
          entry.isFile() &&
          entry.name === 'tasks.csv' &&
          basename(dirname(absolutePath)) === 'tasks'
        ) {
          discoveredSources.add(absolutePath);
        }
      }
    };

    walk(taskLedgerRoot);

    return Array.from(discoveredSources)
      .sort((left, right) => left.localeCompare(right))
      .map((absolutePath) => {
        const fileStat = statSync(absolutePath);
        return {
          absolutePath,
          mtimeMs: Math.trunc(fileStat.mtimeMs),
          size: fileStat.size,
          rowCount: this.countTaskLedgerRows(absolutePath),
        };
      });
  }

  /**
   * Counts canonical task-ledger rows for one `tasks.csv` file.
   * @param taskCsvPath Absolute tasks.csv path.
   * @returns Canonical row count excluding header.
   */
  private countTaskLedgerRows(taskCsvPath: string): number {
    const lines = readFileSync(taskCsvPath, 'utf8')
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0);

    return lines.length > 0 ? Math.max(lines.length - 1, 0) : 0;
  }

  /**
   * Compares rendered `tasks.csv` source metadata against canonical sqlite metadata rows.
   * @param sources Canonical source metadata.
   * @param canonicalSources Canonical sqlite metadata rows.
   * @returns Whether canonical sqlite metadata still matches rendered sources.
   */
  private taskLedgerCanonicalTruthMatchesSources(
    sources: TaskLedgerCsvSourceSummary[],
    canonicalSources: TaskLedgerCanonicalSourceRow[],
  ): boolean {
    if (sources.length !== canonicalSources.length) {
      return false;
    }

    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];
      const canonicalSource = canonicalSources[index];
      if (
        canonicalSource?.sourcePath !== source.absolutePath ||
        Number(canonicalSource?.sourceMtimeMs ?? -1) !== source.mtimeMs ||
        Number(canonicalSource?.sourceSize ?? -1) !== source.size
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resolves the available task-ledger table names, supporting legacy database schemas.
   * @param databaseConnection Open sqlite connection.
   * @returns {{ sourcesTableName: string; rowsTableName: string }}
   */
  private resolveTaskLedgerTableNames(databaseConnection: DatabaseSync): {
    sourcesTableName: string;
    rowsTableName: string;
  } {
    const canonicalTablesExist =
      this.sqliteTableExists(databaseConnection, TASK_LEDGER_CANONICAL_SOURCES_TABLE_NAME) &&
      this.sqliteTableExists(databaseConnection, TASK_LEDGER_CANONICAL_ROWS_TABLE_NAME);
    if (canonicalTablesExist) {
      return {
        sourcesTableName: TASK_LEDGER_CANONICAL_SOURCES_TABLE_NAME,
        rowsTableName: TASK_LEDGER_CANONICAL_ROWS_TABLE_NAME,
      };
    }

    return {
      sourcesTableName: TASK_LEDGER_LEGACY_SOURCES_TABLE_NAME,
      rowsTableName: TASK_LEDGER_LEGACY_ROWS_TABLE_NAME,
    };
  }

  /**
   * Checks whether one sqlite table exists before probing schema-specific diagnostics.
   * @param databaseConnection Open sqlite connection.
   * @param tableName Target table name.
   * @returns Whether the table exists.
   */
  private sqliteTableExists(databaseConnection: DatabaseSync, tableName: string): boolean {
    const tableRecord = databaseConnection
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
      .get(tableName) as { name?: string } | undefined;
    return typeof tableRecord?.name === 'string' && tableRecord.name.length > 0;
  }

  /**
   * Opens one sqlite database for read-only health inspection.
   * @param databaseFilePath Absolute sqlite file path.
   * @returns Open sqlite connection.
   */
  private openReadOnlySqliteDatabase(databaseFilePath: string): DatabaseSync {
    return new DatabaseSync(databaseFilePath, {
      readOnly: true,
      timeout: 5000,
    });
  }

  /**
   * Reads one text file if present.
   * @param filePath Absolute file path.
   * @returns File content or empty string when absent.
   */
  private readTextIfExists(filePath: string): string {
    return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  }

  /**
   * Converts an error into one single-line detail payload safe for structured command checks.
   * @param error Unknown failure.
   * @returns One inline-safe message.
   */
  private sanitizeInlineError(error: unknown): string {
    const rawMessage = standardizeError(error).message;
    return rawMessage.replace(/\s+/gu, '_').slice(0, 240);
  }
}
