#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { gateInfo, gatePass } from "./gate-output.js";

const GATE_NAME = "artifact-compact";
const MAIN_REGISTRY_PATH = ".repo-ai-governor/context/artifact-registry/artifacts.csv";
const ARCHIVE_REGISTRY_PATH =
  ".repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv";
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
 * Escapes one CSV cell for safe serialization.
 * @param {string} value Raw cell value.
 * @returns {string}
 */
function escapeCsvCell(value) {
  if (/["\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Reads one registry file and returns rows.
 * @param {string} filePath Absolute file path.
 * @returns {Array<Record<string, string>>}
 */
function readRegistryRows(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headerCells = parseCsvLine(lines[0]).map((cell) => cell.trim());
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headerCells.includes(requiredHeader)) {
      throw new Error(`Registry file missing required column "${requiredHeader}": ${filePath}`);
    }
  }

  return lines.slice(1).map((line) => {
    const rowValues = parseCsvLine(line);
    if (rowValues.length !== headerCells.length) {
      throw new Error(
        `CSV row column count mismatch in ${filePath}. Expected ${headerCells.length}, got ${rowValues.length}.`,
      );
    }

    /** @type {Record<string, string>} */
    const row = {};
    for (let index = 0; index < headerCells.length; index += 1) {
      row[headerCells[index]] = rowValues[index].trim();
    }
    return row;
  });
}

/**
 * Writes rows to one registry file.
 * @param {string} filePath Absolute file path.
 * @param {Array<Record<string, string>>} rows CSV rows.
 */
function writeRegistryRows(filePath, rows) {
  const headerLine = REQUIRED_HEADERS.join(",");
  const bodyLines = rows.map((row) =>
    REQUIRED_HEADERS.map((header) => escapeCsvCell(row[header] ?? "")).join(","),
  );
  const content = [headerLine, ...bodyLines].join("\n");

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${content}\n`, "utf8");
}

/**
 * Parses one CLI flag value.
 * @param {string[]} argv Raw argv.
 * @param {string} flagName Flag name.
 * @returns {string | null}
 */
function readFlagValue(argv, flagName) {
  const flagIndex = argv.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }

  const nextValue = argv[flagIndex + 1];
  if (!nextValue || nextValue.startsWith("--")) {
    throw new Error(`Flag "${flagName}" requires a value.`);
  }

  return nextValue.trim();
}

/**
 * Parses dependent tasks from CSV cell.
 * @param {string} rawDependentTasks Raw value.
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
 * Converts YYYY-MM-DD to Date.
 * @param {string} rawDate Date value.
 * @returns {Date | null}
 */
function parseDate(rawDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return null;
  }

  const parsedDate = new Date(`${rawDate}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

/**
 * Formats Date to YYYY-MM-DD.
 * @param {Date} date Date object.
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates day distance.
 * @param {Date} fromDate Start date.
 * @param {Date} toDate End date.
 * @returns {number}
 */
function calculateDayDistance(fromDate, toDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay);
}

const argv = process.argv.slice(2);
const mainPath = resolve(process.cwd(), readFlagValue(argv, "--main") ?? MAIN_REGISTRY_PATH);
const archivePath = resolve(
  process.cwd(),
  readFlagValue(argv, "--archive") ?? ARCHIVE_REGISTRY_PATH,
);
const inactiveDays = Number(readFlagValue(argv, "--inactive-days") ?? "30");
const deprecationDays = Number(readFlagValue(argv, "--deprecation-days") ?? "14");
const dryRun = argv.includes("--dry-run");
const today = parseDate(readFlagValue(argv, "--today") ?? formatDate(new Date())) ?? new Date();

if (!Number.isFinite(inactiveDays) || inactiveDays < 0) {
  throw new Error(`Invalid --inactive-days value: ${inactiveDays}`);
}

if (!Number.isFinite(deprecationDays) || deprecationDays < 0) {
  throw new Error(`Invalid --deprecation-days value: ${deprecationDays}`);
}

const mainRows = readRegistryRows(mainPath);
const archiveRows = readRegistryRows(archivePath);
const nextMainRows = [];
const movedToArchiveRows = [];
let markedDeprecatedCount = 0;

for (const row of mainRows) {
  const dependentTasks = parseDependentTasks(row.dependent_tasks ?? "");
  const lastUpdatedDate = parseDate(row.last_updated_at ?? "") ?? today;
  const ageInDays = calculateDayDistance(lastUpdatedDate, today);
  const status = row.artifact_status;

  if (status === "archived" || status === "retired") {
    movedToArchiveRows.push({
      ...row,
      artifact_status: status,
      dependent_tasks: "",
      last_updated_at: formatDate(today),
    });
    continue;
  }

  if (status === "deprecated" && ageInDays >= deprecationDays) {
    movedToArchiveRows.push({
      ...row,
      artifact_status: "archived",
      dependent_tasks: "",
      last_updated_at: formatDate(today),
    });
    continue;
  }

  if (
    (status === "active" || status === "frozen") &&
    (dependentTasks.values.length === 0 || dependentTasks.hasTbdPlaceholder) &&
    ageInDays >= inactiveDays
  ) {
    nextMainRows.push({
      ...row,
      artifact_status: "deprecated",
      dependent_tasks: "",
      last_updated_at: formatDate(today),
    });
    markedDeprecatedCount += 1;
    continue;
  }

  nextMainRows.push(row);
}

const archiveRowById = new Map(archiveRows.map((row) => [row.artifact_id, row]));
for (const movedRow of movedToArchiveRows) {
  archiveRowById.set(movedRow.artifact_id, movedRow);
}

const finalArchiveRows = Array.from(archiveRowById.values()).sort((left, right) =>
  left.artifact_id.localeCompare(right.artifact_id),
);
const finalMainRows = nextMainRows.sort((left, right) =>
  left.artifact_id.localeCompare(right.artifact_id),
);

const summary = {
  dryRun,
  inactiveDays,
  deprecationDays,
  mainRowsBefore: mainRows.length,
  mainRowsAfter: finalMainRows.length,
  archiveRowsBefore: archiveRows.length,
  archiveRowsAfter: finalArchiveRows.length,
  markedDeprecatedCount,
  movedToArchiveCount: movedToArchiveRows.length,
};

if (!dryRun) {
  writeRegistryRows(mainPath, finalMainRows);
  writeRegistryRows(archivePath, finalArchiveRows);
}

if (dryRun) {
  gateInfo(GATE_NAME, `dry-run summary=${JSON.stringify(summary)}`);
} else {
  gatePass(GATE_NAME, `applied summary=${JSON.stringify(summary)}`);
}
