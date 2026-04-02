import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const TASK_LEDGER_ROOT = '.repo-ai-governor/context/dev';
export const TASK_LEDGER_PROJECTION_SQLITE_PATH =
  '.repo-ai-governor/context/dev/sqlite/task-ledger-projection.sqlite';
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

const PROJECTION_SOURCES_TABLE_NAME = 'task_ledger_projection_sources';
const PROJECTION_ROWS_TABLE_NAME = 'task_ledger_projection_rows';
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
 * Collects all canonical task-ledger CSV sources plus optional ad-hoc sources.
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
 * Ensures sqlite projection is synchronized with canonical task-ledger CSV sources.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 * }} [options] Projection options.
 * @returns {{ databaseFilePath: string, rebuilt: boolean, sourceCount: number, rowCount: number }}
 */
export function ensureTaskLedgerProjection(options = {}) {
  return runWithSqliteLockRetry(() => {
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_PROJECTION_SQLITE_PATH,
    );
    const sources = collectTaskLedgerCsvSources({
      taskLedgerRoot: options.taskLedgerRoot,
      extraTaskCsvPaths: options.extraTaskCsvPaths,
    });
    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      const rebuildRequired = isProjectionRebuildRequired(databaseConnection, sources);
      if (rebuildRequired) {
        replaceTaskLedgerProjectionRows(databaseConnection, sources);
      }

      const rowCountRecord = databaseConnection
        .prepare(`SELECT COUNT(*) AS total FROM ${PROJECTION_ROWS_TABLE_NAME}`)
        .get();

      return {
        databaseFilePath,
        rebuilt: rebuildRequired,
        sourceCount: sources.length,
        rowCount: Number(rowCountRecord?.total ?? 0),
      };
    } finally {
      databaseConnection.close();
    }
  });
}

/**
 * Reads latest canonical row per task id from projection.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 * }} [options] Read options.
 * @returns {Map<string, Record<string, string>>}
 */
export function readLatestProjectedTaskRows(options = {}) {
  return readLatestProjectedTaskRowsInternal(options);
}

/**
 * Reads latest canonical row per task id for one specific tasks.csv source.
 * @param {{
 *   taskCsvPath: string;
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 * }} options Source-specific read options.
 * @returns {Map<string, Record<string, string>>}
 */
export function readLatestProjectedTaskRowsForSource(options) {
  const taskRows = readProjectedTaskRowsForSource({
    taskCsvPath: options.taskCsvPath,
    taskLedgerRoot: options.taskLedgerRoot,
    databaseFilePath: options.databaseFilePath,
  });
  const latestRows = new Map();

  for (const row of taskRows) {
    latestRows.set(row.task_id, row);
  }

  return latestRows;
}

/**
 * Reads all projected rows for one tasks.csv source in canonical source order.
 * @param {{
 *   taskCsvPath: string;
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 * }} options Source-specific read options.
 * @returns {Array<Record<string, string>>}
 */
export function readProjectedTaskRowsForSource(options) {
  return runWithSqliteLockRetry(() => {
    const absoluteTaskCsvPath = resolve(process.cwd(), options.taskCsvPath);
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_PROJECTION_SQLITE_PATH,
    );

    ensureTaskLedgerProjection({
      taskLedgerRoot: options.taskLedgerRoot,
      databaseFilePath,
      extraTaskCsvPaths: [absoluteTaskCsvPath],
    });

    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      const rows = databaseConnection
        .prepare(
          `
            SELECT
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
            FROM ${PROJECTION_ROWS_TABLE_NAME}
            WHERE source_path = ?
            ORDER BY source_row_number ASC
          `,
        )
        .all(absoluteTaskCsvPath);

      return rows.map((row) => normalizeProjectedTaskRow(row));
    } finally {
      databaseConnection.close();
    }
  });
}

/**
 * Reads latest normalized task statuses from projection.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
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
 * Reads and validates one canonical tasks.csv source.
 * @param {string} absolutePath Absolute source path.
 * @returns {Array<Record<string, string> & { __rowNumber: number }>}
 */
function readTaskLedgerCsvRows(absolutePath) {
  const csvLines = readFileSync(absolutePath, 'utf8')
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (csvLines.length < 2) {
    throw new Error(`tasks.csv has no task rows: ${absolutePath}`);
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
 * Opens projection sqlite database and initializes schema.
 * @param {string} databaseFilePath Absolute sqlite file path.
 * @returns {DatabaseSync}
 */
function openTaskLedgerProjectionDatabase(databaseFilePath) {
  const databaseAlreadyExists = existsSync(databaseFilePath);
  mkdirSync(dirname(databaseFilePath), { recursive: true });
  const databaseConnection = new DatabaseSync(databaseFilePath);
  databaseConnection.exec('PRAGMA busy_timeout = 5000;');
  if (!databaseAlreadyExists) {
    databaseConnection.exec('PRAGMA journal_mode = WAL;');
  }
  databaseConnection.exec(`
    CREATE TABLE IF NOT EXISTS ${PROJECTION_SOURCES_TABLE_NAME} (
      source_path TEXT PRIMARY KEY,
      source_mtime_ms INTEGER NOT NULL,
      source_size INTEGER NOT NULL,
      row_count INTEGER NOT NULL,
      synced_at TEXT NOT NULL
    );
  `);
  databaseConnection.exec(`
    CREATE TABLE IF NOT EXISTS ${PROJECTION_ROWS_TABLE_NAME} (
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
  databaseConnection.exec(`
    CREATE INDEX IF NOT EXISTS idx_task_ledger_projection_task_id
    ON ${PROJECTION_ROWS_TABLE_NAME}(task_id, source_row_number);
  `);
  databaseConnection.exec(`
    CREATE INDEX IF NOT EXISTS idx_task_ledger_projection_source
    ON ${PROJECTION_ROWS_TABLE_NAME}(source_path, source_row_number);
  `);
  databaseConnection.exec(`
    CREATE INDEX IF NOT EXISTS idx_task_ledger_projection_project_sprint
    ON ${PROJECTION_ROWS_TABLE_NAME}(project, sprint, source_row_number);
  `);

  return databaseConnection;
}

/**
 * Checks whether projection metadata still matches all canonical CSV sources.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {Array<{ absolutePath: string, mtimeMs: number, size: number }>} sources Canonical sources.
 * @returns {boolean}
 */
function isProjectionRebuildRequired(databaseConnection, sources) {
  const sourceRecords = databaseConnection
    .prepare(
      `
        SELECT source_path, source_mtime_ms, source_size
        FROM ${PROJECTION_SOURCES_TABLE_NAME}
        ORDER BY source_path ASC
      `,
    )
    .all();

  if (sourceRecords.length !== sources.length) {
    return true;
  }

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    const record = sourceRecords[index];

    if (
      record?.source_path !== source.absolutePath ||
      Number(record?.source_mtime_ms ?? -1) !== source.mtimeMs ||
      Number(record?.source_size ?? -1) !== source.size
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Replaces projection state from canonical CSV sources inside one transaction.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {Array<{ absolutePath: string, mtimeMs: number, size: number }>} sources Canonical sources.
 * @returns {void}
 */
function replaceTaskLedgerProjectionRows(databaseConnection, sources) {
  const synchronizedAt = new Date().toISOString();

  databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    databaseConnection.prepare(`DELETE FROM ${PROJECTION_ROWS_TABLE_NAME}`).run();
    databaseConnection.prepare(`DELETE FROM ${PROJECTION_SOURCES_TABLE_NAME}`).run();

    const sourceInsertStatement = databaseConnection.prepare(
      `
        INSERT INTO ${PROJECTION_SOURCES_TABLE_NAME} (
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
        INSERT INTO ${PROJECTION_ROWS_TABLE_NAME} (
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

    for (const source of sources) {
      const rows = readTaskLedgerCsvRows(source.absolutePath);
      sourceInsertStatement.run(
        source.absolutePath,
        source.mtimeMs,
        source.size,
        rows.length,
        synchronizedAt,
      );

      for (const row of rows) {
        rowInsertStatement.run(
          source.absolutePath,
          row.__rowNumber,
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
      }
    }

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
 * Reads latest canonical row per task id after ensuring projection is current.
 * @param {{
 *   taskLedgerRoot?: string;
 *   databaseFilePath?: string;
 *   extraTaskCsvPaths?: string[];
 * }} [options] Read options.
 * @returns {Map<string, Record<string, string>>}
 */
function readLatestProjectedTaskRowsInternal(options = {}) {
  return runWithSqliteLockRetry(() => {
    const databaseFilePath = resolve(
      process.cwd(),
      options.databaseFilePath ?? TASK_LEDGER_PROJECTION_SQLITE_PATH,
    );

    ensureTaskLedgerProjection({
      taskLedgerRoot: options.taskLedgerRoot,
      databaseFilePath,
      extraTaskCsvPaths: options.extraTaskCsvPaths,
    });

    const databaseConnection = openTaskLedgerProjectionDatabase(databaseFilePath);

    try {
      const rows = databaseConnection
        .prepare(
          `
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
            FROM ${PROJECTION_ROWS_TABLE_NAME}
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
 * Normalizes one projected sqlite row back into CSV-shaped fields.
 * @param {Record<string, unknown>} row Raw sqlite row.
 * @returns {Record<string, string>}
 */
function normalizeProjectedTaskRow(row) {
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
