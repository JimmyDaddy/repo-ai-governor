import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const ARTIFACT_REGISTRY_MAIN_VIEW_PATH =
  '.repo-ai-governor/context/artifact-registry/artifacts.csv';
export const ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH =
  '.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv';
export const ARTIFACT_REGISTRY_SQLITE_PATH =
  '.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite';
export const ARTIFACT_REGISTRY_REQUIRED_HEADERS = [
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
];

const MAIN_TABLE_NAME = 'artifact_registry_main';
const ARCHIVE_TABLE_NAME = 'artifact_registry_archive';
const MAIN_STATUSES = new Set(['active', 'frozen', 'deprecated']);
const ARCHIVE_STATUSES = new Set(['archived', 'retired']);

/**
 * Parses one CSV line with quote support.
 * @param {string} line Raw CSV line.
 * @returns {string[]}
 */
export function parseCsvLine(line) {
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
 * Escapes one CSV cell for deterministic serialization.
 * @param {string} value Raw cell value.
 * @returns {string}
 */
export function escapeCsvCell(value) {
  if (/["\n,]/u.test(value)) {
    return `"${value.replace(/"/gu, '""')}"`;
  }

  return value;
}

/**
 * Parses one dependent_tasks CSV cell.
 * @param {string} rawDependentTasks Raw dependent_tasks cell.
 * @returns {{ values: string[], hasTbdPlaceholder: boolean }}
 */
export function parseDependentTasks(rawDependentTasks) {
  const trimmedValue = rawDependentTasks.trim();
  if (!trimmedValue) {
    return { values: [], hasTbdPlaceholder: false };
  }

  if (trimmedValue.toUpperCase() === 'TBD') {
    return { values: [], hasTbdPlaceholder: true };
  }

  return {
    values: trimmedValue
      .split('|')
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    hasTbdPlaceholder: false,
  };
}

/**
 * Reads one registry CSV view.
 * @param {string} filePath Absolute CSV path.
 * @returns {Array<Record<string, string> & { __rowNumber: number }>}
 */
export function readRegistryCsvView(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf8');
  const lines = content
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((cell) => cell.trim());
  for (const requiredHeader of ARTIFACT_REGISTRY_REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`Registry file missing required header "${requiredHeader}": ${filePath}`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(
        `CSV row column count mismatch in ${filePath}. Expected ${headers.length}, got ${values.length}.`,
      );
    }

    const row = { __rowNumber: index + 2 };
    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      row[headers[headerIndex]] = values[headerIndex].trim();
    }
    return row;
  });
}

/**
 * Reads sqlite canonical rows and only bootstraps from CSV views when explicitly requested.
 * @param {{
 *   databaseFilePath?: string;
 *   mainRegistryPath?: string;
 *   archiveRegistryPath?: string;
 *   bootstrapFromCsv?: boolean;
 * }} [options] Optional storage overrides.
 * @returns {{
 *   databaseFilePath: string;
 *   mainRows: Array<Record<string, string> & { __rowNumber: number }>;
 *   archiveRows: Array<Record<string, string> & { __rowNumber: number }>;
 *   bootstrappedFromCsv: boolean;
 * }}
 */
export function readArtifactRegistryCanonicalState(options = {}) {
  const databaseFilePath = resolve(
    process.cwd(),
    options.databaseFilePath ?? ARTIFACT_REGISTRY_SQLITE_PATH,
  );
  const mainRegistryPath = resolve(
    process.cwd(),
    options.mainRegistryPath ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  );
  const archiveRegistryPath = resolve(
    process.cwd(),
    options.archiveRegistryPath ?? ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
  );
  const bootstrapFromCsv = options.bootstrapFromCsv === true;
  const renderedMainRows = readRegistryCsvView(mainRegistryPath);
  const renderedArchiveRows = readRegistryCsvView(archiveRegistryPath);
  const renderedRowsExist = renderedMainRows.length > 0 || renderedArchiveRows.length > 0;
  let bootstrappedFromCsv = false;

  if (!existsSync(databaseFilePath)) {
    if (!renderedRowsExist) {
      return {
        databaseFilePath,
        mainRows: [],
        archiveRows: [],
        bootstrappedFromCsv: false,
      };
    }

    if (!bootstrapFromCsv) {
      throw new Error(
        `Canonical sqlite registry not found at ${databaseFilePath} while rendered CSV views still contain data. Run an explicit rebuild with --bootstrap-from-csv before using read-only governance commands.`,
      );
    }

    replaceArtifactRegistryCanonicalState({
      databaseFilePath,
      mainRows: renderedMainRows,
      archiveRows: renderedArchiveRows,
    });
    bootstrappedFromCsv = true;
  }

  const databaseConnection = openArtifactRegistryDatabase(databaseFilePath);

  try {
    const canonicalRowCount =
      countTableRows(databaseConnection, MAIN_TABLE_NAME) +
      countTableRows(databaseConnection, ARCHIVE_TABLE_NAME);

    if (canonicalRowCount === 0) {
      if (renderedRowsExist) {
        if (!bootstrapFromCsv) {
          throw new Error(
            `Canonical sqlite registry at ${databaseFilePath} is empty while rendered CSV views still contain data. Run an explicit rebuild with --bootstrap-from-csv before using read-only governance commands.`,
          );
        }

        replaceCanonicalRegistryRowsInternal(databaseConnection, {
          mainRows: renderedMainRows,
          archiveRows: renderedArchiveRows,
        });
        bootstrappedFromCsv = true;
      }
    }

    return {
      databaseFilePath,
      mainRows: readCanonicalRowsFromTable(databaseConnection, MAIN_TABLE_NAME),
      archiveRows: readCanonicalRowsFromTable(databaseConnection, ARCHIVE_TABLE_NAME),
      bootstrappedFromCsv,
    };
  } finally {
    databaseConnection.close();
  }
}

/**
 * Replaces the sqlite canonical registry truth.
 * @param {{
 *   mainRows: Array<Record<string, string>>;
 *   archiveRows: Array<Record<string, string>>;
 *   databaseFilePath?: string;
 * }} options Replacement payload.
 */
export function replaceArtifactRegistryCanonicalState(options) {
  const databaseFilePath = resolve(
    process.cwd(),
    options.databaseFilePath ?? ARTIFACT_REGISTRY_SQLITE_PATH,
  );
  const databaseConnection = openArtifactRegistryDatabase(databaseFilePath);

  try {
    replaceCanonicalRegistryRowsInternal(databaseConnection, {
      mainRows: options.mainRows,
      archiveRows: options.archiveRows,
    });
  } finally {
    databaseConnection.close();
  }
}

/**
 * Renders canonical main/archive rows into compatibility CSV views.
 * @param {{
 *   mainRows: Array<Record<string, string>>;
 *   archiveRows: Array<Record<string, string>>;
 *   mainRegistryPath?: string;
 *   archiveRegistryPath?: string;
 *   writeFiles?: boolean;
 * }} options Render options.
 * @returns {{
 *   mainContent: string;
 *   archiveContent: string;
 *   mainRegistryPath: string;
 *   archiveRegistryPath: string;
 * }}
 */
export function renderArtifactRegistryCsvViews(options) {
  const mainRegistryPath = resolve(
    process.cwd(),
    options.mainRegistryPath ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  );
  const archiveRegistryPath = resolve(
    process.cwd(),
    options.archiveRegistryPath ?? ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
  );
  const mainContent = serializeRegistryRows(options.mainRows);
  const archiveContent = serializeRegistryRows(options.archiveRows);

  if (options.writeFiles !== false) {
    mkdirSync(dirname(mainRegistryPath), { recursive: true });
    mkdirSync(dirname(archiveRegistryPath), { recursive: true });
    writeFileSync(mainRegistryPath, mainContent, 'utf8');
    writeFileSync(archiveRegistryPath, archiveContent, 'utf8');
  }

  return {
    mainContent,
    archiveContent,
    mainRegistryPath,
    archiveRegistryPath,
  };
}

/**
 * Compares current CSV views against canonical sqlite-rendered content.
 * @param {{
 *   mainRows: Array<Record<string, string>>;
 *   archiveRows: Array<Record<string, string>>;
 *   mainRegistryPath?: string;
 *   archiveRegistryPath?: string;
 * }} options Drift options.
 * @returns {{
 *   mainMatches: boolean;
 *   archiveMatches: boolean;
 *   expectedMainContent: string;
 *   expectedArchiveContent: string;
 *   actualMainContent: string;
 *   actualArchiveContent: string;
 * }}
 */
export function compareRenderedArtifactRegistryViews(options) {
  const renderedViews = renderArtifactRegistryCsvViews({
    mainRows: options.mainRows,
    archiveRows: options.archiveRows,
    mainRegistryPath: options.mainRegistryPath,
    archiveRegistryPath: options.archiveRegistryPath,
    writeFiles: false,
  });
  const actualMainContent = readTextIfExists(renderedViews.mainRegistryPath);
  const actualArchiveContent = readTextIfExists(renderedViews.archiveRegistryPath);

  return {
    mainMatches: actualMainContent === renderedViews.mainContent,
    archiveMatches: actualArchiveContent === renderedViews.archiveContent,
    expectedMainContent: renderedViews.mainContent,
    expectedArchiveContent: renderedViews.archiveContent,
    actualMainContent,
    actualArchiveContent,
  };
}

/**
 * Opens and initializes the canonical sqlite registry.
 * @param {string} databaseFilePath Absolute sqlite path.
 * @returns {DatabaseSync}
 */
function openArtifactRegistryDatabase(databaseFilePath) {
  mkdirSync(dirname(databaseFilePath), { recursive: true });
  const databaseConnection = new DatabaseSync(databaseFilePath);
  databaseConnection.exec('PRAGMA journal_mode = WAL;');
  databaseConnection.exec(`
    CREATE TABLE IF NOT EXISTS ${MAIN_TABLE_NAME} (
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
  databaseConnection.exec(`
    CREATE TABLE IF NOT EXISTS ${ARCHIVE_TABLE_NAME} (
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

  return databaseConnection;
}

/**
 * Counts rows in one canonical registry table.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {string} tableName Canonical table name.
 * @returns {number}
 */
function countTableRows(databaseConnection, tableName) {
  const row = databaseConnection.prepare(`SELECT COUNT(*) AS total FROM ${tableName}`).get();

  return Number(row?.total ?? 0);
}

/**
 * Replaces canonical rows inside one transaction.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {{
 *   mainRows: Array<Record<string, string>>;
 *   archiveRows: Array<Record<string, string>>;
 * }} options Replacement rows.
 */
function replaceCanonicalRegistryRowsInternal(databaseConnection, options) {
  databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    databaseConnection.prepare(`DELETE FROM ${MAIN_TABLE_NAME}`).run();
    databaseConnection.prepare(`DELETE FROM ${ARCHIVE_TABLE_NAME}`).run();

    const mainInsertStatement = databaseConnection.prepare(`
      INSERT INTO ${MAIN_TABLE_NAME} (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const archiveInsertStatement = databaseConnection.prepare(`
      INSERT INTO ${ARCHIVE_TABLE_NAME} (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of options.mainRows.map((candidate) => normalizeRegistryRow(candidate))) {
      if (!MAIN_STATUSES.has(row.artifact_status)) {
        throw new Error(
          `Main canonical registry row "${row.artifact_id}" carries invalid status "${row.artifact_status}".`,
        );
      }

      mainInsertStatement.run(
        row.artifact_id,
        row.artifact_type,
        row.artifact_path,
        row.artifact_version,
        row.artifact_status,
        row.producer_task_id,
        row.producer_execution_id,
        row.registered_at,
        row.last_updated_at,
        JSON.stringify(parseDependentTasks(row.dependent_tasks).values),
      );
    }

    for (const row of options.archiveRows.map((candidate) => normalizeRegistryRow(candidate))) {
      if (!ARCHIVE_STATUSES.has(row.artifact_status)) {
        throw new Error(
          `Archive canonical registry row "${row.artifact_id}" carries invalid status "${row.artifact_status}".`,
        );
      }

      archiveInsertStatement.run(
        row.artifact_id,
        row.artifact_type,
        row.artifact_path,
        row.artifact_version,
        row.artifact_status,
        row.producer_task_id,
        row.producer_execution_id,
        row.registered_at,
        row.last_updated_at,
        JSON.stringify(parseDependentTasks(row.dependent_tasks).values),
      );
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
 * Reads one canonical table as CSV-shaped rows.
 * @param {DatabaseSync} databaseConnection Open sqlite connection.
 * @param {string} tableName Canonical table name.
 * @returns {Array<Record<string, string> & { __rowNumber: number }>}
 */
function readCanonicalRowsFromTable(databaseConnection, tableName) {
  const rows = databaseConnection
    .prepare(`
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
    `)
    .all();

  return rows.map((row, index) => ({
    artifact_id: String(row.artifact_id ?? ''),
    artifact_type: String(row.artifact_type ?? ''),
    artifact_path: String(row.artifact_path ?? ''),
    artifact_version: String(row.artifact_version ?? ''),
    artifact_status: String(row.artifact_status ?? ''),
    producer_task_id: String(row.producer_task_id ?? ''),
    producer_execution_id: String(row.producer_execution_id ?? ''),
    registered_at: String(row.registered_at ?? ''),
    last_updated_at: String(row.last_updated_at ?? ''),
    dependent_tasks: parseDependentTasksJsonCell(row.dependent_tasks_json).join('|'),
    __rowNumber: index + 2,
  }));
}

/**
 * Normalizes one CSV-shaped registry row.
 * @param {Record<string, string>} row Raw row payload.
 * @returns {Record<string, string>}
 */
function normalizeRegistryRow(row) {
  const normalizedRow = {};

  for (const header of ARTIFACT_REGISTRY_REQUIRED_HEADERS) {
    normalizedRow[header] = String(row[header] ?? '').trim();
  }

  return normalizedRow;
}

/**
 * Serializes one registry row set into CSV content.
 * @param {Array<Record<string, string>>} rows Registry rows.
 * @returns {string}
 */
function serializeRegistryRows(rows) {
  const lines = [
    ARTIFACT_REGISTRY_REQUIRED_HEADERS.join(','),
    ...rows.map((row) =>
      ARTIFACT_REGISTRY_REQUIRED_HEADERS.map((header) =>
        escapeCsvCell(String(row[header] ?? '')),
      ).join(','),
    ),
  ];

  return `${lines.join('\n')}\n`;
}

/**
 * Reads a file as utf8 text when present.
 * @param {string} filePath Absolute file path.
 * @returns {string}
 */
function readTextIfExists(filePath) {
  if (!existsSync(filePath)) {
    return '';
  }

  return readFileSync(filePath, 'utf8');
}

/**
 * Parses dependent-task JSON cell from sqlite.
 * @param {unknown} valueJson Raw sqlite JSON cell.
 * @returns {string[]}
 */
function parseDependentTasksJsonCell(valueJson) {
  try {
    const parsedValue = JSON.parse(String(valueJson ?? '[]'));
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((candidate) => typeof candidate === 'string')
      .map((candidate) => candidate.trim())
      .filter((candidate) => candidate.length > 0)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}
