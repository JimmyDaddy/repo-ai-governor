#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import { gateInfo, gatePass } from "./gate-output.js";

const GATE_NAME = "artifact-reconcile";
const MAIN_REGISTRY_PATH = ".repo-ai-governor/context/artifact-registry/artifacts.csv";
const TASK_LEDGER_ROOT = ".repo-ai-governor/context/dev";
const REQUIRED_REGISTRY_HEADERS = [
  "artifact_id",
  "artifact_type",
  "artifact_path",
  "artifact_version",
  "artifact_status",
  "producer_task_id",
  "producer_execution_id",
  "registered_at",
  "last_updated_at",
  "dependent_tasks",
];
const REQUIRED_TASK_HEADERS = [
  "execution_id",
  "task_id",
  "title",
  "owner",
  "priority",
  "due_date",
  "status",
  "project",
  "sprint",
  "plan",
  "result",
  "verify",
  "review_delta",
  "recorded_at",
];
const CLOSED_TASK_STATUSES = new Set([
  "completed",
  "done",
  "closed",
  "cancelled",
  "canceled",
  "resolved",
  "retired",
  "archived",
]);

/**
 * Parses one CSV line with quote support.
 * @param {string} line CSV line.
 * @returns {string[]}
 */
function parseCsvLine(line) {
  const values = [];
  let currentValue = "";
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

    if (character === "," && !inQuotes) {
      values.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);
  return values;
}

/**
 * Escapes one CSV cell for safe serialization.
 * @param {string} value Raw cell value.
 * @returns {string}
 */
function escapeCsvCell(value) {
  if (/["\n,]/u.test(value)) {
    return `"${value.replace(/"/gu, '""')}"`;
  }

  return value;
}

/**
 * Reads one CSV file as row records.
 * @param {string} filePath Absolute file path.
 * @param {string[]} requiredHeaders Required CSV headers.
 * @returns {{headers: string[], rows: Array<Record<string, string>>}}
 */
function readCsv(filePath, requiredHeaders) {
  if (!existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const lines = readFileSync(filePath, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error(`CSV file is empty: ${filePath}`);
  }

  const headers = parseCsvLine(lines[0]).map((cell) => cell.trim());
  for (const requiredHeader of requiredHeaders) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`CSV file missing required header "${requiredHeader}": ${filePath}`);
    }
  }

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(
        `CSV row column count mismatch in ${filePath}. Expected ${headers.length}, got ${values.length}.`,
      );
    }

    /** @type {Record<string, string>} */
    const row = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = values[index].trim();
    }
    return row;
  });

  return { headers, rows };
}

/**
 * Writes CSV rows preserving header order.
 * @param {string} filePath Absolute output path.
 * @param {string[]} headers Header order.
 * @param {Array<Record<string, string>>} rows Row records.
 */
function writeCsv(filePath, headers, rows) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header] ?? "")).join(",")),
  ];
  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

/**
 * Parses dependent task list.
 * @param {string} rawDependentTasks Raw CSV cell value.
 * @returns {{values: string[], hasTbdPlaceholder: boolean}}
 */
function parseDependentTasks(rawDependentTasks) {
  const trimmedValue = rawDependentTasks.trim();
  if (!trimmedValue) {
    return { values: [], hasTbdPlaceholder: false };
  }

  if (trimmedValue.toUpperCase() === "TBD") {
    return { values: [], hasTbdPlaceholder: true };
  }

  return {
    values: trimmedValue
      .split("|")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    hasTbdPlaceholder: false,
  };
}

/**
 * Lists all task ledger files (`tasks/tasks.csv`) under one root.
 * @param {string} rootDirectory Absolute root directory.
 * @returns {string[]}
 */
function listTaskCsvFiles(rootDirectory) {
  if (!existsSync(rootDirectory)) {
    return [];
  }

  /** @type {string[]} */
  const filePaths = [];

  /**
   * Walks one directory recursively.
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

      if (entry.isFile() && entry.name === "tasks.csv" && basename(directoryPath) === "tasks") {
        filePaths.push(absolutePath);
      }
    }
  }

  walk(rootDirectory);
  return filePaths;
}

/**
 * Parses one YYYY-MM-DD date string.
 * @param {string} value Raw date value.
 * @returns {number}
 */
function parseDateWeight(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return 0;
  }

  const parsedDate = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsedDate)) {
    return 0;
  }

  return parsedDate;
}

/**
 * Formats Date to YYYY-MM-DD.
 * @param {Date} value Date object.
 * @returns {string}
 */
function formatDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Builds latest task-status index from all task ledgers.
 * @param {string[]} taskCsvPaths Task CSV file paths.
 * @returns {Map<string, { status: string; source: string }>}
 */
function buildLatestTaskStatusIndex(taskCsvPaths) {
  /** @type {Map<string, { status: string; source: string; score: number }>} */
  const latestByTaskId = new Map();
  let globalSequence = 0;

  for (const taskCsvPath of taskCsvPaths) {
    const { rows } = readCsv(taskCsvPath, REQUIRED_TASK_HEADERS);
    for (const row of rows) {
      globalSequence += 1;
      const taskId = row.task_id;
      const status = row.status.toLowerCase();
      const score = parseDateWeight(row.recorded_at) * 1_000_000 + globalSequence;
      const current = latestByTaskId.get(taskId);
      if (!current || score >= current.score) {
        latestByTaskId.set(taskId, {
          status,
          source: taskCsvPath,
          score,
        });
      }
    }
  }

  return new Map(
    Array.from(latestByTaskId.entries()).map(([taskId, value]) => [
      taskId,
      {
        status: value.status,
        source: value.source,
      },
    ]),
  );
}

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const mainRegistryPath = resolve(process.cwd(), MAIN_REGISTRY_PATH);
const taskLedgerRoot = resolve(process.cwd(), TASK_LEDGER_ROOT);
const today = formatDate(new Date());

const { headers, rows } = readCsv(mainRegistryPath, REQUIRED_REGISTRY_HEADERS);
const taskCsvPaths = listTaskCsvFiles(taskLedgerRoot);
const latestTaskStatuses = buildLatestTaskStatusIndex(taskCsvPaths);

let updatedRowCount = 0;
let removedClosedDependencyCount = 0;
let removedMissingDependencyCount = 0;
let clearedTbdPlaceholderCount = 0;
let correctedDateInversionCount = 0;

for (const row of rows) {
  const parsedDependentTasks = parseDependentTasks(row.dependent_tasks ?? "");
  let changed = false;

  if (parseDateWeight(row.last_updated_at ?? "") < parseDateWeight(row.registered_at ?? "")) {
    row.last_updated_at = today;
    correctedDateInversionCount += 1;
    changed = true;
  }

  if (parsedDependentTasks.hasTbdPlaceholder) {
    row.dependent_tasks = "";
    clearedTbdPlaceholderCount += 1;
    changed = true;
  }

  if (parsedDependentTasks.values.length > 0) {
    const retainedTaskIds = [];

    for (const taskId of parsedDependentTasks.values) {
      const latestTask = latestTaskStatuses.get(taskId);
      if (!latestTask) {
        removedMissingDependencyCount += 1;
        changed = true;
        continue;
      }

      if (CLOSED_TASK_STATUSES.has(latestTask.status)) {
        removedClosedDependencyCount += 1;
        changed = true;
        continue;
      }

      retainedTaskIds.push(taskId);
    }

    const nextDependentTasks = retainedTaskIds.join("|");
    if (nextDependentTasks !== (row.dependent_tasks ?? "")) {
      row.dependent_tasks = nextDependentTasks;
      changed = true;
    }
  }

  if (changed) {
    row.last_updated_at = today;
    updatedRowCount += 1;
  }
}

if (!dryRun) {
  writeCsv(mainRegistryPath, headers, rows);
}

const summary = {
  dryRun,
  taskCsvFiles: taskCsvPaths.length,
  indexedTasks: latestTaskStatuses.size,
  updatedRows: updatedRowCount,
  removedClosedDependencyCount,
  removedMissingDependencyCount,
  clearedTbdPlaceholderCount,
  correctedDateInversionCount,
};

if (dryRun) {
  gateInfo(GATE_NAME, `dry-run summary=${JSON.stringify(summary)}`);
} else {
  gatePass(GATE_NAME, `applied summary=${JSON.stringify(summary)}`);
}
