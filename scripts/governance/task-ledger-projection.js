import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const TASK_LEDGER_ROOT = '.repo-ai-governor/context/dev';
export const TASK_LEDGER_CANONICAL_SQLITE_PATH =
  '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite';
export const TASK_LEDGER_LEGACY_PROJECTION_SQLITE_PATH =
  '.repo-ai-governor/context/dev/sqlite/task-ledger-projection.sqlite';
export const TASK_LEDGER_PROJECTION_SQLITE_PATH = TASK_LEDGER_CANONICAL_SQLITE_PATH;
export const TASK_LEDGER_REQUIRED_HEADERS = [
  'execution_id',
  'task_id',
  'title',
  'owner',
  'priority',
  'due_date',
  'status',
  'project',
  'sprint',
  'plan',
  'result',
  'verify',
  'review_delta',
  'recorded_at',
];

const CANONICAL_SOURCES_TABLE_NAME = 'task_ledger_sources';
const CANONICAL_ROWS_TABLE_NAME = 'task_ledger_rows';
const LEGACY_SOURCES_TABLE_NAME = 'task_ledger_projection_sources';
const LEGACY_ROWS_TABLE_NAME = 'task_ledger_projection_rows';
const CANONICAL_TASK_ID_INDEX_NAME = 'idx_task_ledger_task_id';
const CANONICAL_SOURCE_INDEX_NAME = 'idx_task_ledger_source';
const CANONICAL_PROJECT_SPRINT_INDEX_NAME = 'idx_task_ledger_project_sprint';
const LEGACY_TASK_ID_INDEX_NAME = 'idx_task_ledger_projection_task_id';
const LEGACY_SOURCE_INDEX_NAME = 'idx_task_ledger_projection_source';
const LEGACY_PROJECT_SPRINT_INDEX_NAME = 'idx_task_ledger_projection_project_sprint';
const SQLITE_LOCK_RETRY_LIMIT = 5;
const SQLITE_LOCK_RETRY_BASE_DELAY_MS = 50;

/**
 * Parses one task-ledger CSV line with quote support.
 * @param {string} line Raw CSV line.
 * @returns {string[]}
 */
export function parseTaskLedgerCsvLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
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
 * Collects all rendered task-ledger CSV views plus optional ad-hoc sources.
 * These files are compatibility/rendered views; sqlite is the canonical truth after bootstrap.
 * @param {{
 *   taskLedgerRoot?: string;
 *   extraTaskCsvPaths?: string[];
 * }} [options] Source discovery options.
 * @returns {Array<{ absolutePath: string, mtimeMs: number, size: number }>}
 */
export function collectTaskLedgerCsvSources(options = {}) {
  const taskLedgerRoot = resolve(process.cwd(), options.taskLedgerRoot ?? TASK_LEDGER_ROOT);
  const discoveredSources = new Set();

  if (existsSync(taskLedgerRoot)) {
    /**
     * Walks one directory tree and collects `tasks/tasks.csv` files.
     * @param {string} directoryPath Absolute directory path.
     */
    function walk(directoryPath) {
      const entries = readdirSync(directoryPath, { withFileTypes: true });
      for (const entry of entries) {
        const absolutePath = resolve(directoryPath, entry.name);
        if (entry.isDirectory()) {
          walk(absolutePath);
          continue;
        }

        if (entry.isFile() && entry.name === 'tasks.csv' && basename(directoryPath) === 'tasks') {
          discoveredSources.add(absolutePath);
        }
      }
    }

    walk(taskLedgerRoot);
  }

  for (const extraTaskCsvPath of options.extraTaskCsvPaths ?? []) {
    discoveredSources.add(resolve(process.cwd(), extraTaskCsvPath));
  }

  return Array.from(discoveredSources)
    .sort((left, right) => left.localeCompare(right))
    .map((absolutePath) => {
      if (!existsSync(absolutePath)) {
        throw new Error(`tasks.csv not found: ${absolutePath}`);
      }

      const fileStat = statSync(absolutePath);
      return {
        absolutePath,
        mtimeMs: Math.trunc(fileStat.mtimeMs),
        size: fileStat.size,
      };
    });
}

/**
 * Ensures sqlite canonical state exists and bootstraps missing sources from CSV views when needed.
 * Why: task-ledger sqlite now owns canonical truth, but existing repositories still need one-time
 * seeding from historical tasks.csv files during migration.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 *   bootstrapFromCsv?: boolean;
 * }} [options] Canonical-state options.
 * @returns {{ databaseFilePath: string, bootstrappedFromCsv: boolean, sourceCount: number, rowCount: number }}
 */
export function ensureTaskLedgerProjection(options = {}) {
  return runWithSqliteLockRetry(() => {
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_CANONICAL_SQLITE_PATH,
    );
    const csvSources = collectTaskLedgerCsvSources({
      taskLedgerRoot: options.taskLedgerRoot,
      extraTaskCsvPaths: options.extraTaskCsvPaths,
    });
    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      const summary = ensureCanonicalStateInternal(databaseConnection, {
        csvSources,
        bootstrapFromCsv: options.bootstrapFromCsv !== false,
      });

      return {
        databaseFilePath,
        bootstrappedFromCsv: summary.bootstrappedFromCsv,
        rebuilt: summary.bootstrappedFromCsv,
        sourceCount: summary.sourceCount,
        rowCount: summary.rowCount,
      };
    } finally {
      databaseConnection.close();
    }
  });
}

/**
 * Reads canonical sqlite state grouped by source path.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 *   bootstrapFromCsv?: boolean;
 * }} [options] Read options.
 * @returns {{
 *   databaseFilePath: string;
 *   bootstrappedFromCsv: boolean;
 *   sources: Array<{
 *     sourcePath: string;
 *     sourceMtimeMs: number;
 *     sourceSize: number;
 *     rowCount: number;
 *     syncedAt: string;
 *     rows: Array<Record<string, string> & { __rowNumber: number }>;
 *   }>;
 * }}
 */
export function readTaskLedgerCanonicalState(options = {}) {
  return runWithSqliteLockRetry(() => {
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_CANONICAL_SQLITE_PATH,
    );
    const summary = ensureTaskLedgerProjection(options);
    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      const sourceRows = readCanonicalSourceMetadata(databaseConnection);
      return {
        databaseFilePath,
        bootstrappedFromCsv: summary.bootstrappedFromCsv,
        sources: sourceRows.map((sourceRow) => ({
          sourcePath: sourceRow.sourcePath,
          sourceMtimeMs: sourceRow.sourceMtimeMs,
          sourceSize: sourceRow.sourceSize,
          rowCount: sourceRow.rowCount,
          syncedAt: sourceRow.syncedAt,
          rows: readCanonicalRowsForSourceInternal(databaseConnection, sourceRow.sourcePath),
        })),
      };
    } finally {
      databaseConnection.close();
    }
  });
}

/**
 * Replaces one canonical source inside sqlite and optionally re-renders its CSV view.
 * @param {{
 *   taskCsvPath: string;
 *   rows: Array<Record<string, string> & { __rowNumber?: number }>;
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   bootstrapFromCsv?: boolean;
 *   writeRenderedView?: boolean;
 * }} options Replacement payload.
 * @returns {{ databaseFilePath: string, taskCsvPath: string, rowCount: number }}
 */
export function replaceTaskLedgerCanonicalRowsForSource(options) {
  return runWithSqliteLockRetry(() => {
    const absoluteTaskCsvPath = resolve(process.cwd(), options.taskCsvPath);
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_CANONICAL_SQLITE_PATH,
    );

    ensureTaskLedgerProjection({
      taskLedgerRoot: options.taskLedgerRoot,
      databaseFilePath,
      extraTaskCsvPaths: existsSync(absoluteTaskCsvPath) ? [absoluteTaskCsvPath] : [],
      bootstrapFromCsv: options.bootstrapFromCsv !== false,
    });

    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      replaceCanonicalRowsForOneSourceInternal(
        databaseConnection,
        createSourcePayloadFromRows(absoluteTaskCsvPath, options.rows),
      );
    } finally {
      databaseConnection.close();
    }

    if (options.writeRenderedView !== false) {
      renderTaskLedgerCsvViews({
        databaseFilePath,
        taskCsvPath: absoluteTaskCsvPath,
        writeFiles: true,
      });
    }

    return {
      databaseFilePath,
      taskCsvPath: absoluteTaskCsvPath,
      rowCount: options.rows.length,
    };
  });
}

/**
 * Renders canonical sqlite rows into compatibility `tasks.csv` views.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   taskCsvPath?: string;
 *   extraTaskCsvPaths?: string[];
 *   bootstrapFromCsv?: boolean;
 *   writeFiles?: boolean;
 * }} [options] Render options.
 * @returns {{
 *   databaseFilePath: string;
 *   renderedSources: Array<{ sourcePath: string, rowCount: number, content: string }>;
 * }}
 */
export function renderTaskLedgerCsvViews(options = {}) {
  return runWithSqliteLockRetry(() => {
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_CANONICAL_SQLITE_PATH,
    );
    const absoluteTaskCsvPath = options.taskCsvPath
      ? resolve(process.cwd(), options.taskCsvPath)
      : null;

    ensureTaskLedgerProjection({
      taskLedgerRoot: options.taskLedgerRoot,
      databaseFilePath,
      extraTaskCsvPaths:
        absoluteTaskCsvPath && existsSync(absoluteTaskCsvPath)
          ? [absoluteTaskCsvPath]
          : options.extraTaskCsvPaths,
      bootstrapFromCsv: options.bootstrapFromCsv !== false,
    });

    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      const sourceMetadata = readCanonicalSourceMetadata(databaseConnection).filter((sourceRow) =>
        absoluteTaskCsvPath ? sourceRow.sourcePath === absoluteTaskCsvPath : true,
      );
      const renderedSources = [];

      for (const sourceRow of sourceMetadata) {
        const rows = readCanonicalRowsForSourceInternal(databaseConnection, sourceRow.sourcePath);
        const content = serializeTaskLedgerRows(rows);
        renderedSources.push({
          sourcePath: sourceRow.sourcePath,
          rowCount: rows.length,
          content,
        });
      }

      if (options.writeFiles !== false) {
        for (const renderedSource of renderedSources) {
          mkdirSync(dirname(renderedSource.sourcePath), { recursive: true });
          writeFileSync(renderedSource.sourcePath, renderedSource.content, 'utf8');
          const renderedFileStat = statSync(renderedSource.sourcePath);
          updateCanonicalSourceMetadata(
            databaseConnection,
            renderedSource.sourcePath,
            Math.trunc(renderedFileStat.mtimeMs),
            renderedFileStat.size,
            renderedSource.rowCount,
          );
        }
      }

      return {
        databaseFilePath,
        renderedSources,
      };
    } finally {
      databaseConnection.close();
    }
  });
}

/**
 * Compares rendered CSV views against canonical sqlite-rendered content.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   taskCsvPath?: string;
 *   extraTaskCsvPaths?: string[];
 *   bootstrapFromCsv?: boolean;
 * }} [options] Drift options.
 * @returns {{
 *   databaseFilePath: string;
 *   views: Array<{
 *     sourcePath: string;
 *     rowCount: number;
 *     matches: boolean;
 *     expectedContent: string;
 *     actualContent: string;
 *   }>;
 * }}
 */
export function compareRenderedTaskLedgerCsvViews(options = {}) {
  const renderSummary = renderTaskLedgerCsvViews({
    taskLedgerRoot: options.taskLedgerRoot,
    databaseFilePath: options.databaseFilePath,
    taskCsvPath: options.taskCsvPath,
    extraTaskCsvPaths: options.extraTaskCsvPaths,
    bootstrapFromCsv: options.bootstrapFromCsv,
    writeFiles: false,
  });

  return {
    databaseFilePath: renderSummary.databaseFilePath,
    views: renderSummary.renderedSources.map((renderedSource) => ({
      sourcePath: renderedSource.sourcePath,
      rowCount: renderedSource.rowCount,
      matches: readTextIfExists(renderedSource.sourcePath) === renderedSource.content,
      expectedContent: renderedSource.content,
      actualContent: readTextIfExists(renderedSource.sourcePath),
    })),
  };
}

/**
 * Reads latest canonical row per task id from sqlite truth.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 *   bootstrapFromCsv?: boolean;
 * }} [options] Read options.
 * @returns {Map<string, Record<string, string>>}
 */
export function readLatestProjectedTaskRows(options = {}) {
  return readLatestProjectedTaskRowsInternal(options);
}

/**
 * Reads latest canonical row per task id for one specific source.
 * @param {{
 *   taskCsvPath: string;
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   bootstrapFromCsv?: boolean;
 * }} options Source-specific read options.
 * @returns {Map<string, Record<string, string>>}
 */
export function readLatestProjectedTaskRowsForSource(options) {
  const taskRows = readProjectedTaskRowsForSource({
    taskCsvPath: options.taskCsvPath,
    taskLedgerRoot: options.taskLedgerRoot,
    databaseFilePath: options.databaseFilePath,
    bootstrapFromCsv: options.bootstrapFromCsv,
  });
  const latestRows = new Map();

  for (const row of taskRows) {
    latestRows.set(row.task_id, row);
  }

  return latestRows;
}

/**
 * Reads all canonical rows for one specific source in source order.
 * @param {{
 *   taskCsvPath: string;
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   bootstrapFromCsv?: boolean;
 * }} options Source-specific read options.
 * @returns {Array<Record<string, string> & { __rowNumber: number }>}
 */
export function readProjectedTaskRowsForSource(options) {
  return runWithSqliteLockRetry(() => {
    const absoluteTaskCsvPath = resolve(process.cwd(), options.taskCsvPath);
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_CANONICAL_SQLITE_PATH,
    );

    ensureTaskLedgerProjection({
      taskLedgerRoot: options.taskLedgerRoot,
      databaseFilePath,
      extraTaskCsvPaths: existsSync(absoluteTaskCsvPath) ? [absoluteTaskCsvPath] : [],
      bootstrapFromCsv: options.bootstrapFromCsv !== false,
    });

    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      return readCanonicalRowsForSourceInternal(databaseConnection, absoluteTaskCsvPath);
    } finally {
      databaseConnection.close();
    }
  });
}

/**
 * Reads latest normalized task statuses from canonical sqlite truth.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 *   bootstrapFromCsv?: boolean;
 * }} [options] Read options.
 * @returns {Map<string, string>}
 */
export function readLatestTaskLedgerStatuses(options = {}) {
  const latestRows = readLatestProjectedTaskRowsInternal(options);

  return new Map(
    Array.from(latestRows.entries()).map(([taskId, row]) => [taskId, row.status.toLowerCase()]),
  );
}

/**
 * Reads one rendered `tasks.csv` view into row objects.
 * @param {string} absolutePath Absolute source path.
 * @returns {Array<Record<string, string> & { __rowNumber: number }>}
 */
function readTaskLedgerCsvRows(absolutePath) {
  const csvLines = readFileSync(absolutePath, 'utf8')
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (csvLines.length === 0) {
    return [];
  }

  const headers = parseTaskLedgerCsvLine(csvLines[0]).map((cell) => cell.trim());
  for (const requiredHeader of TASK_LEDGER_REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`tasks.csv missing required column "${requiredHeader}": ${absolutePath}`);
    }
  }

  return csvLines.slice(1).map((line, index) => {
    const rowValues = parseTaskLedgerCsvLine(line);
    if (rowValues.length !== headers.length) {
      throw new Error(
        `CSV row column mismatch at ${absolutePath}:${index + 2}. Expected ${headers.length}, got ${rowValues.length}.`,
      );
    }

    const row = { __rowNumber: index + 2 };
    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      row[headers[headerIndex]] = String(rowValues[headerIndex] ?? '').trim();
    }
    return row;
  });
}

/**
 * Opens task-ledger sqlite database and initializes canonical schema.
 * @param {string} databaseFilePath Absolute sqlite file path.
 * @returns {DatabaseSync}
 */
function openTaskLedgerProjectionDatabase(databaseFilePath) {
  migrateLegacyTaskLedgerDatabaseFile(databaseFilePath);
  const databaseAlreadyExists = existsSync(databaseFilePath);
  mkdirSync(dirname(databaseFilePath), { recursive: true });
  const databaseConnection = new DatabaseSync(databaseFilePath);
  databaseConnection.exec('PRAGMA busy_timeout = 5000;');
  if (!databaseAlreadyExists) {
    databaseConnection.exec('PRAGMA journal_mode = WAL;');
  }
  ensureCanonicalTaskLedgerSchema(databaseConnection);

  return databaseConnection;
}

/**
 * Moves legacy default sqlite files to the canonical filename when callers request the new path.
 * @param {string} databaseFilePath Absolute canonical sqlite file path.
 * @returns {void}
 */
function migrateLegacyTaskLedgerDatabaseFile(databaseFilePath) {
  const canonicalFileName = basename(TASK_LEDGER_CANONICAL_SQLITE_PATH);
  if (basename(databaseFilePath) !== canonicalFileName) {
    return;
  }

  const legacyDatabaseFilePath = resolve(
    dirname(databaseFilePath),
    basename(TASK_LEDGER_LEGACY_PROJECTION_SQLITE_PATH),
  );
  if (existsSync(databaseFilePath) || !existsSync(legacyDatabaseFilePath)) {
    return;
  }

  mkdirSync(dirname(databaseFilePath), { recursive: true });
  renameSync(legacyDatabaseFilePath, databaseFilePath);

  for (const suffix of ['-wal', '-shm']) {
    const legacySidecarPath = `${legacyDatabaseFilePath}${suffix}`;
    const canonicalSidecarPath = `${databaseFilePath}${suffix}`;
    if (existsSync(legacySidecarPath) && !existsSync(canonicalSidecarPath)) {
      renameSync(legacySidecarPath, canonicalSidecarPath);
    }
  }
}

/**
 * Ensures canonical tables/indexes exist and folds any legacy table naming into the new schema.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @returns {void}
 */
function ensureCanonicalTaskLedgerSchema(databaseConnection) {
  databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    renameLegacyTableIfNeeded(
      databaseConnection,
      LEGACY_SOURCES_TABLE_NAME,
      CANONICAL_SOURCES_TABLE_NAME,
    );
    renameLegacyTableIfNeeded(
      databaseConnection,
      LEGACY_ROWS_TABLE_NAME,
      CANONICAL_ROWS_TABLE_NAME,
    );

    databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS ${CANONICAL_SOURCES_TABLE_NAME} (
        source_path TEXT PRIMARY KEY,
        source_mtime_ms INTEGER NOT NULL,
        source_size INTEGER NOT NULL,
        row_count INTEGER NOT NULL,
        synced_at TEXT NOT NULL
      );
    `);
    databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS ${CANONICAL_ROWS_TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_path TEXT NOT NULL,
        source_row_number INTEGER NOT NULL,
        execution_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        owner TEXT NOT NULL,
        priority TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL,
        project TEXT NOT NULL,
        sprint TEXT NOT NULL,
        plan TEXT NOT NULL,
        result TEXT NOT NULL,
        verify TEXT NOT NULL,
        review_delta TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        UNIQUE(source_path, source_row_number)
      );
    `);

    migrateResidualLegacyRows(databaseConnection);

    databaseConnection.exec(`DROP INDEX IF EXISTS ${LEGACY_TASK_ID_INDEX_NAME}`);
    databaseConnection.exec(`DROP INDEX IF EXISTS ${LEGACY_SOURCE_INDEX_NAME}`);
    databaseConnection.exec(`DROP INDEX IF EXISTS ${LEGACY_PROJECT_SPRINT_INDEX_NAME}`);

    databaseConnection.exec(`
      CREATE INDEX IF NOT EXISTS ${CANONICAL_TASK_ID_INDEX_NAME}
      ON ${CANONICAL_ROWS_TABLE_NAME}(task_id, source_row_number);
    `);
    databaseConnection.exec(`
      CREATE INDEX IF NOT EXISTS ${CANONICAL_SOURCE_INDEX_NAME}
      ON ${CANONICAL_ROWS_TABLE_NAME}(source_path, source_row_number);
    `);
    databaseConnection.exec(`
      CREATE INDEX IF NOT EXISTS ${CANONICAL_PROJECT_SPRINT_INDEX_NAME}
      ON ${CANONICAL_ROWS_TABLE_NAME}(project, sprint, source_row_number);
    `);

    databaseConnection.exec('COMMIT');
  } catch (error) {
    try {
      databaseConnection.exec('ROLLBACK');
    } catch {
      // Keep original failure visible.
    }

    throw error;
  }
}

/**
 * Renames one legacy sqlite table into its canonical name when the canonical table is absent.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {string} legacyTableName Legacy table name.
 * @param {string} canonicalTableName Canonical table name.
 * @returns {void}
 */
function renameLegacyTableIfNeeded(databaseConnection, legacyTableName, canonicalTableName) {
  if (
    sqliteTableExists(databaseConnection, legacyTableName) &&
    !sqliteTableExists(databaseConnection, canonicalTableName)
  ) {
    databaseConnection.exec(`ALTER TABLE ${legacyTableName} RENAME TO ${canonicalTableName}`);
  }
}

/**
 * Folds any residual legacy-named tables into canonical tables, then drops the legacy copies.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @returns {void}
 */
function migrateResidualLegacyRows(databaseConnection) {
  if (sqliteTableExists(databaseConnection, LEGACY_SOURCES_TABLE_NAME)) {
    databaseConnection.exec(`
      INSERT OR REPLACE INTO ${CANONICAL_SOURCES_TABLE_NAME} (
        source_path,
        source_mtime_ms,
        source_size,
        row_count,
        synced_at
      )
      SELECT
        source_path,
        source_mtime_ms,
        source_size,
        row_count,
        synced_at
      FROM ${LEGACY_SOURCES_TABLE_NAME};
    `);
    databaseConnection.exec(`DROP TABLE ${LEGACY_SOURCES_TABLE_NAME}`);
  }

  if (sqliteTableExists(databaseConnection, LEGACY_ROWS_TABLE_NAME)) {
    databaseConnection.exec(`
      INSERT OR REPLACE INTO ${CANONICAL_ROWS_TABLE_NAME} (
        source_path,
        source_row_number,
        execution_id,
        task_id,
        title,
        owner,
        priority,
        due_date,
        status,
        project,
        sprint,
        plan,
        result,
        verify,
        review_delta,
        recorded_at
      )
      SELECT
        source_path,
        source_row_number,
        execution_id,
        task_id,
        title,
        owner,
        priority,
        due_date,
        status,
        project,
        sprint,
        plan,
        result,
        verify,
        review_delta,
        recorded_at
      FROM ${LEGACY_ROWS_TABLE_NAME};
    `);
    databaseConnection.exec(`DROP TABLE ${LEGACY_ROWS_TABLE_NAME}`);
  }
}

/**
 * Checks whether one sqlite table currently exists.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {string} tableName Target table name.
 * @returns {boolean}
 */
function sqliteTableExists(databaseConnection, tableName) {
  const tableRecord = databaseConnection
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(tableName);
  return Boolean(tableRecord);
}

/**
 * Ensures sqlite canonical state is ready and optionally bootstraps from CSV views.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {{
 *   csvSources: Array<{ absolutePath: string, mtimeMs: number, size: number }>;
 *   bootstrapFromCsv: boolean;
 * }} options Canonical-state options.
 * @returns {{ bootstrappedFromCsv: boolean, sourceCount: number, rowCount: number }}
 */
function ensureCanonicalStateInternal(databaseConnection, options) {
  const csvSources = options.csvSources;
  const bootstrapFromCsv = options.bootstrapFromCsv === true;
  const canonicalSources = readCanonicalSourceMetadata(databaseConnection);
  const canonicalSourcePaths = new Set(canonicalSources.map((row) => row.sourcePath));
  const canonicalRowCount = countTableRows(databaseConnection, CANONICAL_ROWS_TABLE_NAME);
  let bootstrappedFromCsv = false;

  if (canonicalSources.length === 0 && canonicalRowCount === 0) {
    if (csvSources.length > 0) {
      if (!bootstrapFromCsv) {
        throw new Error(
          'Canonical task-ledger sqlite is empty while rendered tasks.csv views still contain data. Run an explicit bootstrap before using read-only governance consumers.',
        );
      }

      replaceTaskLedgerCanonicalRowsInternal(
        databaseConnection,
        csvSources.map((source) => buildSourcePayloadFromCsvSource(source)),
      );
      bootstrappedFromCsv = true;
    }
  } else if (bootstrapFromCsv) {
    const missingCsvSources = csvSources.filter(
      (source) => !canonicalSourcePaths.has(source.absolutePath),
    );
    if (missingCsvSources.length > 0) {
      appendTaskLedgerCanonicalSourcesInternal(
        databaseConnection,
        missingCsvSources.map((source) => buildSourcePayloadFromCsvSource(source)),
      );
      bootstrappedFromCsv = true;
    }
  }

  return {
    bootstrappedFromCsv,
    sourceCount: countTableRows(databaseConnection, CANONICAL_SOURCES_TABLE_NAME),
    rowCount: countTableRows(databaseConnection, CANONICAL_ROWS_TABLE_NAME),
  };
}

/**
 * Reads canonical source metadata rows.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @returns {Array<{ sourcePath: string, sourceMtimeMs: number, sourceSize: number, rowCount: number, syncedAt: string }>}
 */
function readCanonicalSourceMetadata(databaseConnection) {
  return databaseConnection
    .prepare(
      `
        SELECT
          source_path AS sourcePath,
          source_mtime_ms AS sourceMtimeMs,
          source_size AS sourceSize,
          row_count AS rowCount,
          synced_at AS syncedAt
        FROM ${CANONICAL_SOURCES_TABLE_NAME}
        ORDER BY source_path ASC
      `,
    )
    .all()
    .map((row) => ({
      sourcePath: String(row.sourcePath ?? ''),
      sourceMtimeMs: Number(row.sourceMtimeMs ?? 0),
      sourceSize: Number(row.sourceSize ?? 0),
      rowCount: Number(row.rowCount ?? 0),
      syncedAt: String(row.syncedAt ?? ''),
    }));
}

/**
 * Reads all canonical rows for one source.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {string} sourcePath Absolute source path.
 * @returns {Array<Record<string, string> & { __rowNumber: number }>}
 */
function readCanonicalRowsForSourceInternal(databaseConnection, sourcePath) {
  const rows = databaseConnection
    .prepare(
      `
        SELECT
          source_row_number,
          execution_id,
          task_id,
          title,
          owner,
          priority,
          due_date,
          status,
          project,
          sprint,
          plan,
          result,
          verify,
          review_delta,
          recorded_at
        FROM ${CANONICAL_ROWS_TABLE_NAME}
        WHERE source_path = ?
        ORDER BY source_row_number ASC
      `,
    )
    .all(sourcePath);

  return rows.map((row) => normalizeProjectedTaskRow(row));
}

/**
 * Replaces all canonical state rows in one transaction.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {Array<{
 *   sourcePath: string;
 *   sourceMtimeMs: number;
 *   sourceSize: number;
 *   rows: Array<Record<string, string> & { __rowNumber?: number }>;
 * }>} sourcePayloads Canonical replacement payload.
 * @returns {void}
 */
function replaceTaskLedgerCanonicalRowsInternal(databaseConnection, sourcePayloads) {
  databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    databaseConnection.prepare(`DELETE FROM ${CANONICAL_ROWS_TABLE_NAME}`).run();
    databaseConnection.prepare(`DELETE FROM ${CANONICAL_SOURCES_TABLE_NAME}`).run();
    insertCanonicalSourcePayloads(databaseConnection, sourcePayloads);
    databaseConnection.exec('COMMIT');
  } catch (error) {
    try {
      databaseConnection.exec('ROLLBACK');
    } catch {
      // Keep original failure visible.
    }

    throw error;
  }
}

/**
 * Appends missing canonical sources into sqlite without touching existing rows.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {Array<{
 *   sourcePath: string;
 *   sourceMtimeMs: number;
 *   sourceSize: number;
 *   rows: Array<Record<string, string> & { __rowNumber?: number }>;
 * }>} sourcePayloads Source payloads.
 * @returns {void}
 */
function appendTaskLedgerCanonicalSourcesInternal(databaseConnection, sourcePayloads) {
  if (sourcePayloads.length === 0) {
    return;
  }

  databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    insertCanonicalSourcePayloads(databaseConnection, sourcePayloads);
    databaseConnection.exec('COMMIT');
  } catch (error) {
    try {
      databaseConnection.exec('ROLLBACK');
    } catch {
      // Keep original failure visible.
    }

    throw error;
  }
}

/**
 * Replaces one canonical source row set inside sqlite.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {{
 *   sourcePath: string;
 *   sourceMtimeMs: number;
 *   sourceSize: number;
 *   rows: Array<Record<string, string> & { __rowNumber?: number }>;
 * }} sourcePayload Source payload.
 * @returns {void}
 */
function replaceCanonicalRowsForOneSourceInternal(databaseConnection, sourcePayload) {
  databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    databaseConnection
      .prepare(`DELETE FROM ${CANONICAL_ROWS_TABLE_NAME} WHERE source_path = ?`)
      .run(sourcePayload.sourcePath);
    databaseConnection
      .prepare(`DELETE FROM ${CANONICAL_SOURCES_TABLE_NAME} WHERE source_path = ?`)
      .run(sourcePayload.sourcePath);
    insertCanonicalSourcePayloads(databaseConnection, [sourcePayload]);
    databaseConnection.exec('COMMIT');
  } catch (error) {
    try {
      databaseConnection.exec('ROLLBACK');
    } catch {
      // Keep original failure visible.
    }

    throw error;
  }
}

/**
 * Inserts canonical source payloads into sqlite.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {Array<{
 *   sourcePath: string;
 *   sourceMtimeMs: number;
 *   sourceSize: number;
 *   rows: Array<Record<string, string> & { __rowNumber?: number }>;
 * }>} sourcePayloads Source payloads.
 * @returns {void}
 */
function insertCanonicalSourcePayloads(databaseConnection, sourcePayloads) {
  const synchronizedAt = new Date().toISOString();
  const sourceInsertStatement = databaseConnection.prepare(
    `
      INSERT OR REPLACE INTO ${CANONICAL_SOURCES_TABLE_NAME} (
        source_path,
        source_mtime_ms,
        source_size,
        row_count,
        synced_at
      ) VALUES (?, ?, ?, ?, ?)
    `,
  );
  const rowInsertStatement = databaseConnection.prepare(
    `
      INSERT OR REPLACE INTO ${CANONICAL_ROWS_TABLE_NAME} (
        source_path,
        source_row_number,
        execution_id,
        task_id,
        title,
        owner,
        priority,
        due_date,
        status,
        project,
        sprint,
        plan,
        result,
        verify,
        review_delta,
        recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  );

  for (const sourcePayload of sourcePayloads.sort((left, right) =>
    left.sourcePath.localeCompare(right.sourcePath),
  )) {
    sourceInsertStatement.run(
      sourcePayload.sourcePath,
      sourcePayload.sourceMtimeMs,
      sourcePayload.sourceSize,
      sourcePayload.rows.length,
      synchronizedAt,
    );

    sourcePayload.rows.forEach((row, index) => {
      const sourceRowNumber =
        typeof row.__rowNumber === 'number' && Number.isFinite(row.__rowNumber)
          ? row.__rowNumber
          : index + 2;
      rowInsertStatement.run(
        sourcePayload.sourcePath,
        sourceRowNumber,
        row.execution_id,
        row.task_id,
        row.title,
        row.owner,
        row.priority,
        row.due_date,
        row.status,
        row.project,
        row.sprint,
        row.plan,
        row.result,
        row.verify,
        row.review_delta,
        row.recorded_at,
      );
    });
  }
}

/**
 * Builds one source payload from existing CSV view.
 * @param {{ absolutePath: string, mtimeMs: number, size: number }} source CSV source metadata.
 * @returns {{
 *   sourcePath: string;
 *   sourceMtimeMs: number;
 *   sourceSize: number;
 *   rows: Array<Record<string, string> & { __rowNumber: number }>;
 * }}
 */
function buildSourcePayloadFromCsvSource(source) {
  return {
    sourcePath: source.absolutePath,
    sourceMtimeMs: source.mtimeMs,
    sourceSize: source.size,
    rows: readTaskLedgerCsvRows(source.absolutePath),
  };
}

/**
 * Builds one source payload from normalized row objects.
 * @param {string} sourcePath Absolute tasks.csv path.
 * @param {Array<Record<string, string> & { __rowNumber?: number }>} rows Source rows.
 * @returns {{
 *   sourcePath: string;
 *   sourceMtimeMs: number;
 *   sourceSize: number;
 *   rows: Array<Record<string, string> & { __rowNumber?: number }>;
 * }}
 */
function createSourcePayloadFromRows(sourcePath, rows) {
  const existingFileStat = existsSync(sourcePath) ? statSync(sourcePath) : null;
  return {
    sourcePath,
    sourceMtimeMs: existingFileStat ? Math.trunc(existingFileStat.mtimeMs) : 0,
    sourceSize: existingFileStat ? existingFileStat.size : 0,
    rows: rows.map((row) => ({
      ...normalizeTaskLedgerRow(row),
      __rowNumber: row.__rowNumber,
    })),
  };
}

/**
 * Updates canonical metadata for one rendered CSV view.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {string} sourcePath Absolute tasks.csv path.
 * @param {number} sourceMtimeMs Rendered file mtime.
 * @param {number} sourceSize Rendered file size.
 * @param {number} rowCount Canonical row count.
 * @returns {void}
 */
function updateCanonicalSourceMetadata(
  databaseConnection,
  sourcePath,
  sourceMtimeMs,
  sourceSize,
  rowCount,
) {
  databaseConnection
    .prepare(
      `
        UPDATE ${CANONICAL_SOURCES_TABLE_NAME}
        SET
          source_mtime_ms = ?,
          source_size = ?,
          row_count = ?,
          synced_at = ?
        WHERE source_path = ?
      `,
    )
    .run(sourceMtimeMs, sourceSize, rowCount, new Date().toISOString(), sourcePath);
}

/**
 * Serializes normalized rows into deterministic CSV view content.
 * @param {Array<Record<string, string>>} rows Canonical rows.
 * @returns {string}
 */
function serializeTaskLedgerRows(rows) {
  const renderedRows = [
    TASK_LEDGER_REQUIRED_HEADERS.join(','),
    ...rows.map((row) =>
      TASK_LEDGER_REQUIRED_HEADERS.map((header) => escapeCsvCell(row[header] ?? '')).join(','),
    ),
  ];
  renderedRows.push('');
  return renderedRows.join('\n');
}

/**
 * Escapes one CSV cell for deterministic serialization.
 * @param {string} value Raw CSV cell.
 * @returns {string}
 */
function escapeCsvCell(value) {
  const normalizedValue = String(value ?? '');
  if (!/[",\n]/u.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(/"/gu, '""')}"`;
}

/**
 * Reads latest canonical row per task id after ensuring sqlite truth is ready.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 *   bootstrapFromCsv?: boolean;
 * }} [options] Read options.
 * @returns {Map<string, Record<string, string>>}
 */
function readLatestProjectedTaskRowsInternal(options = {}) {
  return runWithSqliteLockRetry(() => {
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_CANONICAL_SQLITE_PATH,
    );

    ensureTaskLedgerProjection({
      taskLedgerRoot: options.taskLedgerRoot,
      databaseFilePath,
      extraTaskCsvPaths: options.extraTaskCsvPaths,
      bootstrapFromCsv: options.bootstrapFromCsv !== false,
    });

    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      const rows = databaseConnection
        .prepare(
          `
            SELECT
              source_row_number,
              execution_id,
              task_id,
              title,
              owner,
              priority,
              due_date,
              status,
              project,
              sprint,
              plan,
              result,
              verify,
              review_delta,
              recorded_at
            FROM ${CANONICAL_ROWS_TABLE_NAME}
            ORDER BY source_path ASC, source_row_number ASC
          `,
        )
        .all();

      const latestRows = new Map();
      let sequence = 0;

      for (const row of rows) {
        sequence += 1;
        const normalizedRow = normalizeProjectedTaskRow(row);
        const taskId = normalizedRow.task_id;
        const score = parseRecordedAtWeight(normalizedRow.recorded_at) * 1_000_000 + sequence;
        const current = latestRows.get(taskId);
        if (!current || score >= current.score) {
          latestRows.set(taskId, {
            row: normalizedRow,
            score,
          });
        }
      }

      return new Map(
        Array.from(latestRows.entries()).map(([taskId, value]) => [taskId, value.row]),
      );
    } finally {
      databaseConnection.close();
    }
  });
}

/**
 * Counts rows from one table.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {string} tableName Table name.
 * @returns {number}
 */
function countTableRows(databaseConnection, tableName) {
  const rowCountRecord = databaseConnection
    .prepare(`SELECT COUNT(*) AS total FROM ${tableName}`)
    .get();
  return Number(rowCountRecord?.total ?? 0);
}

/**
 * Retries sqlite work when a parallel governance process temporarily holds the database lock.
 * @template T
 * @param {() => T} operation Projection operation.
 * @returns {T}
 */
function runWithSqliteLockRetry(operation) {
  let attempt = 0;

  while (attempt <= SQLITE_LOCK_RETRY_LIMIT) {
    try {
      return operation();
    } catch (error) {
      if (!isSqliteLockError(error) || attempt === SQLITE_LOCK_RETRY_LIMIT) {
        throw error;
      }

      sleepMilliseconds(SQLITE_LOCK_RETRY_BASE_DELAY_MS * (attempt + 1));
      attempt += 1;
    }
  }

  throw new Error('Unreachable sqlite retry state.');
}

/**
 * Checks whether one error is a transient sqlite lock failure.
 * @param {unknown} error Unknown thrown value.
 * @returns {boolean}
 */
function isSqliteLockError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /database is locked|database table is locked|SQLITE_BUSY/iu.test(message);
}

/**
 * Performs a short blocking sleep for sync sqlite retry paths.
 * @param {number} milliseconds Sleep duration.
 * @returns {void}
 */
function sleepMilliseconds(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

/**
 * Reads one text file if present.
 * @param {string} filePath Absolute file path.
 * @returns {string}
 */
function readTextIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

/**
 * Normalizes one sqlite row back into task-ledger fields.
 * @param {Record<string, unknown>} row Raw sqlite row.
 * @returns {Record<string, string> & { __rowNumber: number }}
 */
function normalizeProjectedTaskRow(row) {
  return {
    __rowNumber: Number(row.source_row_number ?? 0),
    execution_id: String(row.execution_id ?? '').trim(),
    task_id: String(row.task_id ?? '').trim(),
    title: String(row.title ?? '').trim(),
    owner: String(row.owner ?? '').trim(),
    priority: String(row.priority ?? '').trim(),
    due_date: String(row.due_date ?? '').trim(),
    status: String(row.status ?? '').trim(),
    project: String(row.project ?? '').trim(),
    sprint: String(row.sprint ?? '').trim(),
    plan: String(row.plan ?? '').trim(),
    result: String(row.result ?? '').trim(),
    verify: String(row.verify ?? '').trim(),
    review_delta: String(row.review_delta ?? '').trim(),
    recorded_at: String(row.recorded_at ?? '').trim(),
  };
}

/**
 * Normalizes one row payload before sqlite insertion.
 * @param {Record<string, string>} row Raw row payload.
 * @returns {Record<string, string>}
 */
function normalizeTaskLedgerRow(row) {
  return {
    execution_id: String(row.execution_id ?? '').trim(),
    task_id: String(row.task_id ?? '').trim(),
    title: String(row.title ?? '').trim(),
    owner: String(row.owner ?? '').trim(),
    priority: String(row.priority ?? '').trim(),
    due_date: String(row.due_date ?? '').trim(),
    status: String(row.status ?? '').trim(),
    project: String(row.project ?? '').trim(),
    sprint: String(row.sprint ?? '').trim(),
    plan: String(row.plan ?? '').trim(),
    result: String(row.result ?? '').trim(),
    verify: String(row.verify ?? '').trim(),
    review_delta: String(row.review_delta ?? '').trim(),
    recorded_at: String(row.recorded_at ?? '').trim(),
  };
}

/**
 * Converts recorded_at into comparable weight.
 * @param {string} rawValue Raw timestamp.
 * @returns {number}
 */
function parseRecordedAtWeight(rawValue) {
  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }

  return parsedDate.getTime();
}
