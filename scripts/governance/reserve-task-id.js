#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const TASK_TYPE_PATTERN = /^(TK|CR)$/u;
const TASK_CARD_FILE_PATTERN = /^(TK|CR)-(\d{3,}).*\.md$/u;
const ACTIVE_SCOPE_PATTERN = /^- `([^`]+)`: (.+)$/u;
const DEFAULT_WORKSPACE_ROOT = '.repo-ai-governor';
const DEFAULT_RESERVATION_REASON = 'parallel decomposition reservation';
const DEFAULT_RESERVED_BY = 'AI-Agent';
const SQLITE_LOCK_RETRY_LIMIT = 5;
const SQLITE_LOCK_RETRY_BASE_DELAY_MS = 50;

function parseArgs(argv) {
  /** @type {Record<string, string | boolean | null>} */
  const options = {
    workspaceRoot: null,
    tasksDir: null,
    type: 'TK',
    count: '1',
    scope: 'auto',
    reservedBy: DEFAULT_RESERVED_BY,
    reason: DEFAULT_RESERVATION_REASON,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const nextValue = argv[index + 1];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (!argument.startsWith('--')) {
      continue;
    }

    if (typeof nextValue !== 'string' || nextValue.startsWith('--')) {
      throw new Error(`Option ${argument} requires one value.`);
    }

    switch (argument) {
      case '--workspace-root':
        options.workspaceRoot = nextValue;
        break;
      case '--tasks-dir':
        options.tasksDir = nextValue;
        break;
      case '--type':
        options.type = nextValue;
        break;
      case '--count':
        options.count = nextValue;
        break;
      case '--scope':
        options.scope = nextValue;
        break;
      case '--reserved-by':
        options.reservedBy = nextValue;
        break;
      case '--reason':
        options.reason = nextValue;
        break;
      default:
        throw new Error(`Unsupported option: ${argument}`);
    }

    index += 1;
  }

  return options;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: node ./scripts/governance/reserve-task-id.js [options]',
      '',
      'Options:',
      '  --workspace-root <path>  Workspace root that contains context/current-context.md',
      '  --tasks-dir <path>       Target tasks directory; defaults to active primary stream tasks/',
      '  --type <TK|CR>           Task id prefix to reserve (default: TK)',
      '  --count <number>         Number of contiguous ids to reserve (default: 1)',
      '  --scope <auto|tasks-dir|workspace>',
      '                          Reservation scope; auto => TK uses workspace, CR uses tasks-dir',
      '  --reserved-by <name>     Reservation owner label (default: AI-Agent)',
      '  --reason <text>          Reservation reason for audit trail',
    ].join('\n'),
  );
}

function normalizeSectionHeading(headingText) {
  return headingText
    .replace(/^\d+(?:\.\d+)*\.?\s*/u, '')
    .trim()
    .toLowerCase();
}

function extractSection(content, headingText) {
  const normalizedHeadingText = normalizeSectionHeading(headingText);
  const headingPattern = /^##\s+([^\n]+)$/gmu;
  const headingMatches = Array.from(content.matchAll(headingPattern));

  for (let index = 0; index < headingMatches.length; index += 1) {
    const currentHeadingMatch = headingMatches[index];
    const rawHeadingText = currentHeadingMatch[1]?.trim() ?? '';
    const currentHeadingIndex = currentHeadingMatch.index;
    if (typeof currentHeadingIndex !== 'number') {
      continue;
    }

    if (normalizeSectionHeading(rawHeadingText) !== normalizedHeadingText) {
      continue;
    }

    const sectionStart = currentHeadingIndex + currentHeadingMatch[0].length;
    const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
    return content.slice(sectionStart, sectionEnd).trim();
  }

  return '';
}

function resolveWorkspaceRoot(options) {
  const workspaceRoot =
    typeof options.workspaceRoot === 'string' && options.workspaceRoot.trim().length > 0
      ? options.workspaceRoot
      : DEFAULT_WORKSPACE_ROOT;
  return resolve(process.cwd(), workspaceRoot);
}

function resolveTasksDirectory(options, workspaceRootPath) {
  if (typeof options.tasksDir === 'string' && options.tasksDir.trim().length > 0) {
    return resolve(process.cwd(), options.tasksDir);
  }

  const currentContextPath = resolve(workspaceRootPath, 'context', 'current-context.md');
  if (!existsSync(currentContextPath)) {
    throw new Error(`Current context file not found: ${currentContextPath}`);
  }

  const currentContextContent = readFileSync(currentContextPath, 'utf8');
  const activeStreamsSection = extractSection(currentContextContent, 'Active Streams');
  const primaryStreamLine = activeStreamsSection
    .split(/\r?\n/u)
    .find(
      (line) =>
        ACTIVE_SCOPE_PATTERN.test(line) &&
        (line.startsWith('- `primary`:') || line.includes('role=`primary`')),
    );

  if (!primaryStreamLine) {
    throw new Error(`Primary active stream not found in: ${currentContextPath}`);
  }

  const tasksDirectoryPath = primaryStreamLine.match(/tasks=`([^`]+)`/u)?.[1];
  if (!tasksDirectoryPath) {
    throw new Error(`Primary stream tasks directory missing in: ${currentContextPath}`);
  }

  return resolve(process.cwd(), tasksDirectoryPath);
}

function normalizeTaskType(value) {
  const normalizedTaskType = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!TASK_TYPE_PATTERN.test(normalizedTaskType)) {
    throw new Error(`Unsupported task type: ${value}`);
  }

  return normalizedTaskType;
}

function normalizeScope(value, taskType) {
  const normalizedScope = String(value ?? 'auto')
    .trim()
    .toLowerCase();

  if (normalizedScope === 'auto') {
    return taskType === 'CR' ? 'tasks-dir' : 'workspace';
  }

  if (normalizedScope !== 'tasks-dir' && normalizedScope !== 'workspace') {
    throw new Error(`Unsupported scope: ${value}`);
  }

  return normalizedScope;
}

function parseReservationCount(value) {
  const parsedCount = Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
    throw new Error(`Reservation count must be a positive integer. Received: ${value}`);
  }

  return parsedCount;
}

function resolveReservationScope(tasksDirPath, workspaceRootPath, scopeMode) {
  if (scopeMode === 'workspace') {
    const workspaceTasksRoot = resolve(workspaceRootPath, 'context', 'dev');
    return {
      scopeMode,
      scopePath: workspaceTasksRoot,
      scopeKey: `workspace:${workspaceTasksRoot}`,
    };
  }

  return {
    scopeMode,
    scopePath: tasksDirPath,
    scopeKey: `tasks-dir:${tasksDirPath}`,
  };
}

function collectExistingTaskNumbers(scopePath, taskType, scopeMode) {
  if (!existsSync(scopePath)) {
    return [];
  }

  const taskNumbers = [];

  if (scopeMode === 'tasks-dir') {
    for (const fileName of readdirSync(scopePath)) {
      const taskCardMatch = fileName.match(TASK_CARD_FILE_PATTERN);
      if (!taskCardMatch || taskCardMatch[1] !== taskType) {
        continue;
      }

      taskNumbers.push(Number.parseInt(taskCardMatch[2], 10));
    }

    return taskNumbers;
  }

  const pendingDirectories = [scopePath];

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();
    if (!currentDirectory || !existsSync(currentDirectory)) {
      continue;
    }

    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = resolve(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath);
        continue;
      }

      const taskCardMatch = entry.name.match(TASK_CARD_FILE_PATTERN);
      if (!taskCardMatch || taskCardMatch[1] !== taskType) {
        continue;
      }

      taskNumbers.push(Number.parseInt(taskCardMatch[2], 10));
    }
  }

  return taskNumbers;
}

function openReservationDatabase(databaseFilePath) {
  const databaseAlreadyExists = existsSync(databaseFilePath);
  mkdirSync(dirname(databaseFilePath), { recursive: true });
  const databaseConnection = new DatabaseSync(databaseFilePath);
  databaseConnection.exec('PRAGMA busy_timeout = 5000;');
  if (!databaseAlreadyExists) {
    databaseConnection.exec('PRAGMA journal_mode = WAL;');
  }

  return databaseConnection;
}

function ensureReservationSchema(databaseConnection) {
  databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS task_id_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope_key TEXT NOT NULL,
        scope_mode TEXT NOT NULL,
        scope_path TEXT NOT NULL,
        task_type TEXT NOT NULL,
        task_id TEXT NOT NULL,
        reserved_by TEXT NOT NULL,
        reason TEXT NOT NULL,
        reserved_at TEXT NOT NULL,
        UNIQUE(scope_key, task_type, task_id)
      );
    `);
    databaseConnection.exec(`
      CREATE INDEX IF NOT EXISTS idx_task_id_reservations_scope_type
      ON task_id_reservations(scope_key, task_type, id);
    `);
    databaseConnection.exec('COMMIT');
  } catch (error) {
    try {
      databaseConnection.exec('ROLLBACK');
    } catch {
      // Keep the original error visible to the caller.
    }

    throw error;
  }
}

function readReservedTaskNumbers(databaseConnection, scopeKey, taskType) {
  const rows = databaseConnection
    .prepare(
      `
        SELECT task_id
        FROM task_id_reservations
        WHERE scope_key = ? AND task_type = ?
        ORDER BY id ASC
      `,
    )
    .all(scopeKey, taskType);

  return rows
    .map((row) => String(row.task_id ?? '').match(/^([A-Z]+)-(\d{3,})$/u))
    .filter((match) => match && match[1] === taskType)
    .map((match) => Number.parseInt(match[2], 10));
}

function formatTaskId(taskType, taskNumber) {
  return `${taskType}-${String(taskNumber).padStart(3, '0')}`;
}

function reserveTaskIds(options) {
  return runWithSqliteLockRetry(() => {
    const workspaceRootPath = resolveWorkspaceRoot(options);
    const tasksDirPath = resolveTasksDirectory(options, workspaceRootPath);
    if (!existsSync(tasksDirPath)) {
      throw new Error(`Tasks directory not found: ${tasksDirPath}`);
    }

    const taskType = normalizeTaskType(options.type);
    const scopeMode = normalizeScope(options.scope, taskType);
    const reservationCount = parseReservationCount(options.count);
    const reservationScope = resolveReservationScope(tasksDirPath, workspaceRootPath, scopeMode);
    const databaseFilePath = resolve(
      workspaceRootPath,
      'context',
      'dev',
      'sqlite',
      'task-ledger.sqlite',
    );
    const databaseConnection = openReservationDatabase(databaseFilePath);

    try {
      ensureReservationSchema(databaseConnection);
      databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');

      try {
        const existingNumbers = collectExistingTaskNumbers(
          reservationScope.scopePath,
          taskType,
          reservationScope.scopeMode,
        );
        const reservedNumbers = readReservedTaskNumbers(
          databaseConnection,
          reservationScope.scopeKey,
          taskType,
        );
        const highestNumber = Math.max(0, ...existingNumbers, ...reservedNumbers);
        const reservedAt = new Date().toISOString();
        const reservedIds = [];

        for (let offset = 1; offset <= reservationCount; offset += 1) {
          const nextNumber = highestNumber + offset;
          const taskId = formatTaskId(taskType, nextNumber);
          databaseConnection
            .prepare(
              `
                INSERT INTO task_id_reservations (
                  scope_key,
                  scope_mode,
                  scope_path,
                  task_type,
                  task_id,
                  reserved_by,
                  reason,
                  reserved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `,
            )
            .run(
              reservationScope.scopeKey,
              reservationScope.scopeMode,
              reservationScope.scopePath,
              taskType,
              taskId,
              String(options.reservedBy ?? DEFAULT_RESERVED_BY),
              String(options.reason ?? DEFAULT_RESERVATION_REASON),
              reservedAt,
            );
          reservedIds.push(taskId);
        }

        databaseConnection.exec('COMMIT');

        return {
          databaseFilePath,
          tasksDirPath,
          scopeMode: reservationScope.scopeMode,
          scopePath: reservationScope.scopePath,
          taskType,
          reservedBy: String(options.reservedBy ?? DEFAULT_RESERVED_BY),
          reservationCount,
          reservedIds,
          reservedAt,
        };
      } catch (error) {
        try {
          databaseConnection.exec('ROLLBACK');
        } catch {
          // Keep the original error visible to the caller.
        }

        throw error;
      }
    } finally {
      databaseConnection.close();
    }
  });
}

function isSqliteLockError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /database is locked|database table is locked|SQLITE_BUSY/iu.test(message);
}

function sleepSync(milliseconds) {
  const startTime = Date.now();
  while (Date.now() - startTime < milliseconds) {
    // Busy wait is acceptable here because reservations run as a short-lived governance script.
  }
}

function runWithSqliteLockRetry(operation) {
  let attempt = 0;

  while (attempt <= SQLITE_LOCK_RETRY_LIMIT) {
    try {
      return operation();
    } catch (error) {
      if (!isSqliteLockError(error) || attempt === SQLITE_LOCK_RETRY_LIMIT) {
        throw error;
      }

      attempt += 1;
      sleepSync(SQLITE_LOCK_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error('Exceeded sqlite lock retry limit while reserving task ids.');
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const reserveResult = reserveTaskIds(options);
  process.stdout.write(`${JSON.stringify(reserveResult, null, 2)}\n`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${errorMessage}\n`);
  process.exit(1);
}
