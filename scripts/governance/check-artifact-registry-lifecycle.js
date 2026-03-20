#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "./gate-output.js";

const GATE_NAME = "artifact-lifecycle";
const MAIN_REGISTRY_PATH = ".repo-ai-governor/context/artifact-registry/artifacts.csv";
const ARCHIVE_REGISTRY_PATH =
  ".repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv";
const TASK_LEDGER_ROOT = ".repo-ai-governor/context/dev";
const TASK_CARD_ROOT = ".repo-ai-governor/context/dev";
const REQUIRED_HEADERS = [
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
const ALL_LIFECYCLE_STATUSES = new Set(["active", "frozen", "deprecated", "archived", "retired"]);
const MAIN_REGISTRY_ALLOWED_STATUSES = new Set(["active", "frozen", "deprecated"]);
const ARCHIVE_REGISTRY_ALLOWED_STATUSES = new Set(["archived", "retired"]);
const ACTIVE_REGISTRY_STATUSES = new Set(["active", "frozen"]);
const DEPENDS_ON_SECTION_HEADING_PATTERN = /^##\s*(?:\d+(?:\.\d+)*\.?\s*)?Depends On\s*$/u;
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
const MAX_DEPRECATED_DAYS = 14;
const MAX_UNREFERENCED_ACTIVE_DAYS = 7;

/**
 * Parses one CSV line with quote support.
 * @param {string} line One CSV line.
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
 * Parses one artifact registry CSV file.
 * @param {string} filePath Absolute file path.
 * @param {string[]} requiredHeaders Required CSV headers.
 * @returns {Array<Record<string, string> & {__rowNumber: number}>}
 */
function parseRegistry(filePath, requiredHeaders = REQUIRED_HEADERS) {
  if (!existsSync(filePath)) {
    throw new Error(`Registry file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length < 1) {
    throw new Error(`Registry file is empty: ${filePath}`);
  }

  const headerCells = parseCsvLine(lines[0]).map((cell) => cell.trim());
  for (const requiredHeader of requiredHeaders) {
    if (!headerCells.includes(requiredHeader)) {
      throw new Error(`Registry file missing required column "${requiredHeader}": ${filePath}`);
    }
  }

  if (lines.length === 1) {
    return [];
  }

  return lines.slice(1).map((line, index) => {
    const rowValues = parseCsvLine(line);
    if (rowValues.length !== headerCells.length) {
      throw new Error(
        `CSV row column count mismatch at ${filePath}:${index + 2}. Expected ${headerCells.length}, got ${rowValues.length}.`,
      );
    }

    /** @type {Record<string, string> & {__rowNumber: number}} */
    const row = { __rowNumber: index + 2 };
    for (let headerIndex = 0; headerIndex < headerCells.length; headerIndex += 1) {
      row[headerCells[headerIndex]] = rowValues[headerIndex].trim();
    }
    return row;
  });
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
 * Lists all task card files (`tasks/TK-*.md`) under one root.
 * @param {string} rootDirectory Absolute root directory.
 * @returns {string[]}
 */
function listTaskCardFiles(rootDirectory) {
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

      if (entry.isFile() && /^TK-\d+.*\.md$/u.test(entry.name)) {
        filePaths.push(absolutePath);
      }
    }
  }

  walk(rootDirectory);
  return filePaths;
}

/**
 * Extracts task id from task card filename.
 * @param {string} taskCardPath Absolute task card path.
 * @returns {string | null}
 */
function readTaskIdFromCardPath(taskCardPath) {
  const matched = basename(taskCardPath).match(/^(TK-\d+)/u);
  return matched ? matched[1] : null;
}

/**
 * Extracts task status from task card front-matter lines.
 * @param {string} content Task card markdown content.
 * @returns {string | null}
 */
function readTaskStatusFromCard(content) {
  const matched = content.match(/^-\s*Status:\s*([a-z_\-]+)/imu);
  return matched ? matched[1].trim().toLowerCase() : null;
}

/**
 * Extracts artifact ids declared in `Depends On` section.
 * Why: heading numbering can drift (for example `2`, `2.1`, `10.2.1`) and should not break parsing.
 * @param {string} content Task card markdown content.
 * @returns {string[]}
 */
function extractDependsOnArtifactIds(content) {
  const lines = content.split(/\r?\n/u);
  let dependsOnStartIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (DEPENDS_ON_SECTION_HEADING_PATTERN.test(lines[index].trim())) {
      dependsOnStartIndex = index + 1;
      break;
    }
  }

  if (dependsOnStartIndex === -1) {
    return [];
  }

  const sectionLines = [];
  for (let index = dependsOnStartIndex; index < lines.length; index += 1) {
    if (/^##\s+/u.test(lines[index].trim())) {
      break;
    }
    sectionLines.push(lines[index]);
  }

  const sectionContent = sectionLines.join("\n");
  const artifactMatches = sectionContent.match(/DA-\d+/gu) ?? [];
  return Array.from(new Set(artifactMatches)).sort((left, right) => left.localeCompare(right));
}

/**
 * Converts YYYY-MM-DD to sortable numeric weight.
 * @param {string} rawValue Date string.
 * @returns {number}
 */
function parseDateWeight(rawValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return 0;
  }

  const parsedDate = Date.parse(`${rawValue}T00:00:00Z`);
  if (Number.isNaN(parsedDate)) {
    return 0;
  }

  return parsedDate;
}

/**
 * Reads latest status for each task id from all task ledger files.
 * @param {string[]} taskCsvPaths Task CSV paths.
 * @returns {Map<string, string>}
 */
function collectLatestTaskStatuses(taskCsvPaths) {
  /** @type {Map<string, {status: string; score: number}>} */
  const latestStatusByTaskId = new Map();
  let sequence = 0;

  for (const taskCsvPath of taskCsvPaths) {
    const taskRows = parseRegistry(taskCsvPath, REQUIRED_TASK_HEADERS);

    for (const row of taskRows) {
      sequence += 1;
      const taskId = row.task_id;
      const status = row.status.toLowerCase();
      const score = parseDateWeight(row.recorded_at) * 1_000_000 + sequence;
      const current = latestStatusByTaskId.get(taskId);
      if (!current || score >= current.score) {
        latestStatusByTaskId.set(taskId, { status, score });
      }
    }
  }

  return new Map(
    Array.from(latestStatusByTaskId.entries()).map(([taskId, value]) => [taskId, value.status]),
  );
}

/**
 * Builds artifact -> open dependent task ids map from task cards.
 * @param {string[]} taskCardPaths Task card markdown paths.
 * @param {Map<string, string>} latestTaskStatuses Latest task statuses from ledgers.
 * @returns {Map<string, Set<string>>}
 */
function buildExpectedArtifactDependencyIndex(taskCardPaths, latestTaskStatuses) {
  /** @type {Map<string, Set<string>>} */
  const dependencyByArtifactId = new Map();

  for (const taskCardPath of taskCardPaths) {
    const taskId = readTaskIdFromCardPath(taskCardPath);
    if (!taskId) {
      continue;
    }

    const content = readFileSync(taskCardPath, "utf8");
    const fromLedger = latestTaskStatuses.get(taskId);
    const fromCard = readTaskStatusFromCard(content);
    const taskStatus = fromLedger ?? fromCard;
    if (!taskStatus || CLOSED_TASK_STATUSES.has(taskStatus)) {
      continue;
    }

    const dependedArtifactIds = extractDependsOnArtifactIds(content);
    for (const artifactId of dependedArtifactIds) {
      const consumerTaskIds = dependencyByArtifactId.get(artifactId) ?? new Set();
      consumerTaskIds.add(taskId);
      dependencyByArtifactId.set(artifactId, consumerTaskIds);
    }
  }

  return dependencyByArtifactId;
}

/**
 * Checks whether two string arrays contain same values with same order.
 * @param {string[]} leftValues Left array.
 * @param {string[]} rightValues Right array.
 * @returns {boolean}
 */
function isSameStringArray(leftValues, rightValues) {
  if (leftValues.length !== rightValues.length) {
    return false;
  }

  for (let index = 0; index < leftValues.length; index += 1) {
    if (leftValues[index] !== rightValues[index]) {
      return false;
    }
  }

  return true;
}

/**
 * Parses dependent task list from one CSV cell.
 * @param {string} rawDependentTasks Raw CSV field.
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
 * Checks whether one value matches YYYY-MM-DD and converts to Date.
 * @param {string} rawValue Date string.
 * @returns {Date | null}
 */
function parseDate(rawValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return null;
  }

  const parsedDate = new Date(`${rawValue}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

/**
 * Calculates full day distance between two dates.
 * @param {Date} fromDate Start date.
 * @param {Date} toDate End date.
 * @returns {number}
 */
function calculateDayDistance(fromDate, toDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay);
}

/**
 * Formats one issue record.
 * @param {string} scope Scope label.
 * @param {number} rowNumber CSV row number.
 * @param {string} message Issue message.
 * @returns {string}
 */
function formatIssue(scope, rowNumber, message) {
  return `[${scope}] row ${rowNumber}: ${message}`;
}

const mainRegistryPath = resolve(process.cwd(), MAIN_REGISTRY_PATH);
const archiveRegistryPath = resolve(process.cwd(), ARCHIVE_REGISTRY_PATH);
const taskLedgerRoot = resolve(process.cwd(), TASK_LEDGER_ROOT);
const taskCardRoot = resolve(process.cwd(), TASK_CARD_ROOT);
const taskCsvPaths = listTaskCsvFiles(taskLedgerRoot);
const latestTaskStatuses = collectLatestTaskStatuses(taskCsvPaths);
const taskCardPaths = listTaskCardFiles(taskCardRoot);
const expectedDependencyByArtifactId = buildExpectedArtifactDependencyIndex(
  taskCardPaths,
  latestTaskStatuses,
);
const todayDate = new Date();
const issues = [];

try {
  const mainRows = parseRegistry(mainRegistryPath);
  const archiveRows = parseRegistry(archiveRegistryPath);
  const seenArtifactIds = new Map();

  for (const row of mainRows) {
    const artifactId = row.artifact_id;
    const artifactStatus = row.artifact_status;
    const dependentTasks = parseDependentTasks(row.dependent_tasks);
    const actualDependentTaskIds = Array.from(new Set(dependentTasks.values)).sort((left, right) =>
      left.localeCompare(right),
    );
    const expectedDependentTaskIds = Array.from(
      expectedDependencyByArtifactId.get(artifactId) ?? [],
    ).sort((left, right) => left.localeCompare(right));
    const lastUpdatedDate = parseDate(row.last_updated_at);

    for (const dependentTaskId of dependentTasks.values) {
      const dependentTaskStatus = latestTaskStatuses.get(dependentTaskId);
      if (!dependentTaskStatus) {
        issues.push(
          formatIssue(
            "main",
            row.__rowNumber,
            `dependent_tasks contains unknown task_id "${dependentTaskId}"`,
          ),
        );
        continue;
      }

      if (CLOSED_TASK_STATUSES.has(dependentTaskStatus)) {
        issues.push(
          formatIssue(
            "main",
            row.__rowNumber,
            `dependent_tasks contains closed task "${dependentTaskId}" with status "${dependentTaskStatus}", remove stale dependency`,
          ),
        );
      }
    }

    if (ACTIVE_REGISTRY_STATUSES.has(artifactStatus)) {
      if (!isSameStringArray(actualDependentTaskIds, expectedDependentTaskIds)) {
        issues.push(
          formatIssue(
            "main",
            row.__rowNumber,
            `dependent_tasks drift detected. expected="${expectedDependentTaskIds.join("|")}" actual="${actualDependentTaskIds.join("|")}". run reconcile-artifact-dependencies`,
          ),
        );
      }
    }

    if (
      (artifactStatus === "deprecated" ||
        artifactStatus === "archived" ||
        artifactStatus === "retired") &&
      expectedDependentTaskIds.length > 0
    ) {
      issues.push(
        formatIssue(
          "main",
          row.__rowNumber,
          `non-consumable artifact status "${artifactStatus}" is still referenced by open tasks "${expectedDependentTaskIds.join("|")}"`,
        ),
      );
    }

    if (seenArtifactIds.has(artifactId)) {
      issues.push(
        formatIssue(
          "main",
          row.__rowNumber,
          `duplicate artifact_id "${artifactId}" also found at ${seenArtifactIds.get(artifactId)}`,
        ),
      );
    } else {
      seenArtifactIds.set(artifactId, `main#L${row.__rowNumber}`);
    }

    if (!ALL_LIFECYCLE_STATUSES.has(artifactStatus)) {
      issues.push(
        formatIssue(
          "main",
          row.__rowNumber,
          `invalid artifact_status "${artifactStatus}", expected one of ${Array.from(ALL_LIFECYCLE_STATUSES).join(", ")}`,
        ),
      );
      continue;
    }

    if (!MAIN_REGISTRY_ALLOWED_STATUSES.has(artifactStatus)) {
      issues.push(
        formatIssue(
          "main",
          row.__rowNumber,
          `artifact_status "${artifactStatus}" is not allowed in main registry, move it to archive registry`,
        ),
      );
    }

    if (!lastUpdatedDate) {
      issues.push(
        formatIssue(
          "main",
          row.__rowNumber,
          `invalid last_updated_at "${row.last_updated_at}", expected YYYY-MM-DD`,
        ),
      );
      continue;
    }

    const ageInDays = calculateDayDistance(lastUpdatedDate, todayDate);

    if (artifactStatus === "active") {
      if (dependentTasks.hasTbdPlaceholder) {
        issues.push(
          formatIssue(
            "main",
            row.__rowNumber,
            'active artifact cannot keep dependent_tasks as "TBD"',
          ),
        );
      }

      if (dependentTasks.values.length === 0 && ageInDays > MAX_UNREFERENCED_ACTIVE_DAYS) {
        issues.push(
          formatIssue(
            "main",
            row.__rowNumber,
            `active artifact has no dependent tasks for ${ageInDays} days, transition to deprecated/archive to reduce context size`,
          ),
        );
      }
    }

    if (artifactStatus === "deprecated") {
      if (dependentTasks.values.length > 0 || dependentTasks.hasTbdPlaceholder) {
        issues.push(
          formatIssue(
            "main",
            row.__rowNumber,
            "deprecated artifact must not keep dependent_tasks references",
          ),
        );
      }

      if (ageInDays > MAX_DEPRECATED_DAYS) {
        issues.push(
          formatIssue(
            "main",
            row.__rowNumber,
            `deprecated artifact exceeded ${MAX_DEPRECATED_DAYS} days grace window, move to archive registry`,
          ),
        );
      }
    }
  }

  for (const row of archiveRows) {
    const artifactId = row.artifact_id;
    const artifactStatus = row.artifact_status;
    const dependentTasks = parseDependentTasks(row.dependent_tasks);
    const expectedDependentTaskIds = Array.from(
      expectedDependencyByArtifactId.get(artifactId) ?? [],
    ).sort((left, right) => left.localeCompare(right));
    const lastUpdatedDate = parseDate(row.last_updated_at);

    if (seenArtifactIds.has(artifactId)) {
      issues.push(
        formatIssue(
          "archive",
          row.__rowNumber,
          `duplicate artifact_id "${artifactId}" also found at ${seenArtifactIds.get(artifactId)}`,
        ),
      );
    } else {
      seenArtifactIds.set(artifactId, `archive#L${row.__rowNumber}`);
    }

    if (!ALL_LIFECYCLE_STATUSES.has(artifactStatus)) {
      issues.push(
        formatIssue(
          "archive",
          row.__rowNumber,
          `invalid artifact_status "${artifactStatus}", expected one of ${Array.from(ALL_LIFECYCLE_STATUSES).join(", ")}`,
        ),
      );
      continue;
    }

    if (!ARCHIVE_REGISTRY_ALLOWED_STATUSES.has(artifactStatus)) {
      issues.push(
        formatIssue(
          "archive",
          row.__rowNumber,
          `artifact_status "${artifactStatus}" is not allowed in archive registry`,
        ),
      );
    }

    if (dependentTasks.values.length > 0 || dependentTasks.hasTbdPlaceholder) {
      issues.push(
        formatIssue(
          "archive",
          row.__rowNumber,
          "archived/retired artifact must not keep dependent_tasks references",
        ),
      );
    }

    if (expectedDependentTaskIds.length > 0) {
      issues.push(
        formatIssue(
          "archive",
          row.__rowNumber,
          `archive artifact is still referenced by open tasks "${expectedDependentTaskIds.join("|")}"`,
        ),
      );
    }

    if (!lastUpdatedDate) {
      issues.push(
        formatIssue(
          "archive",
          row.__rowNumber,
          `invalid last_updated_at "${row.last_updated_at}", expected YYYY-MM-DD`,
        ),
      );
    }
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}

if (issues.length > 0) {
  gateFail(GATE_NAME, `Found ${issues.length} lifecycle governance issue(s).`);
  for (const issue of issues) {
    gateInfo(GATE_NAME, `- ${issue}`);
  }
  process.exit(1);
}

gatePass(GATE_NAME, "Artifact registry lifecycle is valid.");
