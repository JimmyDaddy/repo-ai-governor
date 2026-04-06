#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from './gate-output.js';
import { readLatestProjectedTaskRowsForSource } from './task-ledger-projection.js';

const GATE_NAME = 'sprint-plan-status-sync';
const DEV_CONTEXT_ROOT = '.repo-ai-governor/context/dev';
const SPRINT_STATUS_MAP = new Map([
  ['planned', 'planned'],
  ['todo', 'planned'],
  ['backlog', 'planned'],
  ['active', 'active'],
  ['in_progress', 'active'],
  ['in-progress', 'active'],
  ['completed', 'completed'],
  ['done', 'completed'],
  ['closed', 'completed'],
  ['resolved', 'completed'],
]);
const TASK_STATUS_COMPLETED = new Set([
  'completed',
  'done',
  'closed',
  'cancelled',
  'canceled',
  'resolved',
  'retired',
  'archived',
]);
const TASK_STATUS_IN_PROGRESS = new Set(['in_progress', 'in-progress', 'active', 'running']);
const TASK_STATUS_PLANNED = new Set(['planned', 'todo', 'backlog', 'pending']);

/**
 * Recursively lists all sprint directories under context/dev.
 * @param {string} rootDirectory Absolute root directory.
 * @returns {string[]}
 */
function collectSprintDirectories(rootDirectory) {
  /** @type {string[]} */
  const sprintDirectories = [];

  /**
   * Walks one directory tree.
   * @param {string} directoryPath Absolute directory path.
   */
  function walk(directoryPath) {
    const entries = readdirSync(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const absolutePath = resolve(directoryPath, entry.name);
      if (/^sprint-\d{3}/u.test(entry.name)) {
        sprintDirectories.push(absolutePath);
        continue;
      }

      walk(absolutePath);
    }
  }

  walk(rootDirectory);
  return sprintDirectories.sort();
}

/**
 * Reads tasks.csv and returns latest status by task id.
 * Why: one task can appear in multiple execution rows, and only the latest row is canonical.
 * @param {string} tasksCsvPath Absolute tasks.csv path.
 * @returns {Map<string, string>}
 */
function readLatestTaskStatuses(tasksCsvPath) {
  const latestRows = readLatestProjectedTaskRowsForSource({
    taskCsvPath: tasksCsvPath,
    taskLedgerRoot: DEV_CONTEXT_ROOT,
  });

  return new Map(
    Array.from(latestRows.entries()).map(([taskId, row]) => [
      taskId,
      normalizeTaskStatus(row.status),
    ]),
  );
}

/**
 * Reads checklist aggregate status for one sprint.
 * @param {string} checklistPath Absolute checklist path.
 * @returns {"planned" | "active" | "completed" | null}
 */
function readChecklistAggregateStatus(checklistPath) {
  if (!existsSync(checklistPath)) {
    return null;
  }

  const checklistContent = readFileSync(checklistPath, 'utf8');
  const entries = [];
  let currentEntry = null;

  for (const line of checklistContent.split(/\r?\n/u)) {
    const taskLineMatch = line.match(/^- \[(x| )\] ((?:TK|CR)-\d{3}) /iu);
    if (taskLineMatch) {
      currentEntry = {
        checked: taskLineMatch[1].toLowerCase() === 'x',
        hasInProgressRecord: false,
      };
      entries.push(currentEntry);
      continue;
    }

    if (!currentEntry) {
      continue;
    }

    const isExecutionRecord = /^ {2}- /u.test(line);
    if (!isExecutionRecord) {
      continue;
    }

    if (
      /`(?:in_progress|in-progress|active|running)`/iu.test(line) ||
      /状态切换为[^\n]*(?:in_progress|in-progress|active|running)/iu.test(line) ||
      /任务启动/u.test(line)
    ) {
      currentEntry.hasInProgressRecord = true;
    }
  }

  if (entries.length === 0) {
    return null;
  }

  if (entries.every((entry) => entry.checked)) {
    return 'completed';
  }

  if (entries.some((entry) => entry.checked)) {
    return 'active';
  }

  if (entries.some((entry) => entry.hasInProgressRecord)) {
    return 'active';
  }

  if (entries.every((entry) => !entry.checked)) {
    return 'planned';
  }

  return 'active';
}

/**
 * Reads sprint status from sprint plan metadata (`- Status: xxx`).
 * @param {string} sprintPlanPath Absolute sprint plan path.
 * @returns {"planned" | "active" | "completed"}
 */
function readSprintPlanStatus(sprintPlanPath) {
  if (!existsSync(sprintPlanPath)) {
    throw new Error(`sprint plan not found: ${sprintPlanPath}`);
  }

  const content = readFileSync(sprintPlanPath, 'utf8');
  const matched = content.match(/^- Status:\s*(.+)$/imu);
  if (!matched) {
    throw new Error(`missing "- Status:" metadata in sprint plan: ${sprintPlanPath}`);
  }

  return normalizeSprintStatus(matched[1]);
}

/**
 * Normalizes task row status values.
 * @param {string} status Raw task status.
 * @returns {string}
 */
function normalizeTaskStatus(status) {
  return status.trim().toLowerCase().replace(/\s+/gu, '_');
}

/**
 * Normalizes sprint plan status values to planned/active/completed.
 * @param {string} status Raw sprint status.
 * @returns {"planned" | "active" | "completed"}
 */
function normalizeSprintStatus(status) {
  const normalized = normalizeTaskStatus(status);
  const mapped = SPRINT_STATUS_MAP.get(normalized);
  if (!mapped) {
    throw new Error(
      `unsupported sprint status "${status}". Expected one of: planned, active, completed.`,
    );
  }

  return mapped;
}

/**
 * Derives expected sprint status from latest task statuses.
 * @param {string[]} statuses Latest task statuses in one sprint.
 * @returns {"planned" | "active" | "completed"}
 */
function deriveExpectedSprintStatus(statuses) {
  if (statuses.length === 0) {
    return 'planned';
  }

  if (statuses.every((status) => TASK_STATUS_COMPLETED.has(status))) {
    return 'completed';
  }

  if (statuses.every((status) => TASK_STATUS_PLANNED.has(status))) {
    return 'planned';
  }

  if (statuses.some((status) => TASK_STATUS_IN_PROGRESS.has(status))) {
    return 'active';
  }

  return 'active';
}

try {
  const devContextRoot = resolve(process.cwd(), DEV_CONTEXT_ROOT);
  if (!existsSync(devContextRoot)) {
    throw new Error(`Dev context root not found: ${devContextRoot}`);
  }

  const sprintDirectories = collectSprintDirectories(devContextRoot);
  if (sprintDirectories.length === 0) {
    throw new Error(`No sprint directories found under: ${devContextRoot}`);
  }

  const issues = [];

  for (const sprintDirectory of sprintDirectories) {
    const sprintPlanPath = resolve(sprintDirectory, 'plan.md');
    const tasksCsvPath = resolve(sprintDirectory, 'tasks/tasks.csv');
    const checklistPath = resolve(sprintDirectory, 'tasks/checklist.md');

    const sprintStatus = readSprintPlanStatus(sprintPlanPath);
    const latestTaskStatuses = Array.from(readLatestTaskStatuses(tasksCsvPath).values());
    const expectedStatusFromTasks = deriveExpectedSprintStatus(latestTaskStatuses);
    const checklistAggregateStatus = readChecklistAggregateStatus(checklistPath);
    const sprintLabel = sprintDirectory.replace(`${process.cwd()}/`, '');

    if (sprintStatus !== expectedStatusFromTasks) {
      issues.push(
        `${sprintLabel}: sprint plan status="${sprintStatus}" but latest tasks.csv indicates "${expectedStatusFromTasks}"`,
      );
    }

    if (checklistAggregateStatus && checklistAggregateStatus !== expectedStatusFromTasks) {
      issues.push(
        `${sprintLabel}: checklist aggregate status="${checklistAggregateStatus}" but latest tasks.csv indicates "${expectedStatusFromTasks}"`,
      );
    }
  }

  if (issues.length > 0) {
    gateFail(GATE_NAME, `Found ${issues.length} sprint status drift issue(s).`);
    for (const issue of issues) {
      gateInfo(GATE_NAME, `- ${issue}`);
    }
    process.exit(1);
  }

  gatePass(
    GATE_NAME,
    `Sprint plan status is synchronized across ${sprintDirectories.length} sprint(s).`,
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
