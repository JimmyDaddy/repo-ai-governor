#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import {
  ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
  ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  ARTIFACT_REGISTRY_SQLITE_PATH,
  compareRenderedArtifactRegistryViews,
  parseDependentTasks,
  readArtifactRegistryCanonicalState,
} from './artifact-registry-canonical.js';
import { gateFail, gateInfo, gatePass } from './gate-output.js';
import { readLatestTaskLedgerStatuses } from './task-ledger-projection.js';

const GATE_NAME = 'artifact-lifecycle';
const TASK_LEDGER_ROOT = '.repo-ai-governor/context/dev';
const TASK_CARD_ROOT = '.repo-ai-governor/context/dev';
const ALL_LIFECYCLE_STATUSES = new Set(['active', 'frozen', 'deprecated', 'archived', 'retired']);
const MAIN_REGISTRY_ALLOWED_STATUSES = new Set(['active', 'frozen', 'deprecated']);
const ARCHIVE_REGISTRY_ALLOWED_STATUSES = new Set(['archived', 'retired']);
const ACTIVE_REGISTRY_STATUSES = new Set(['active', 'frozen']);
const DEPENDS_ON_SECTION_HEADING_PATTERN = /^##\s*(?:\d+(?:\.\d+)*\.?\s*)?Depends On\s*$/u;
const CLOSED_TASK_STATUSES = new Set([
  'completed',
  'done',
  'closed',
  'cancelled',
  'canceled',
  'resolved',
  'retired',
  'archived',
]);
const MAX_DEPRECATED_DAYS = 14;
const MAX_UNREFERENCED_ACTIVE_DAYS = 7;

/**
 * Lists all task card files (`tasks/TK-*.md`) under one root.
 * @param {string} rootDirectory Absolute root directory.
 * @returns {string[]}
 */
function listTaskCardFiles(rootDirectory) {
  if (!existsSync(rootDirectory)) {
    return [];
  }

  const filePaths = [];

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
 * @param {string} content Task card content.
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

  const sectionContent = sectionLines.join('\n');
  const artifactMatches = sectionContent.match(/DA-\d+/gu) ?? [];
  return Array.from(new Set(artifactMatches)).sort((left, right) => left.localeCompare(right));
}

/**
 * Builds expected dependency index from open task cards.
 * @param {string[]} taskCardPaths Task card paths.
 * @param {Map<string, string>} latestTaskStatuses Latest task statuses.
 * @returns {Map<string, Set<string>>}
 */
function buildExpectedArtifactDependencyIndex(taskCardPaths, latestTaskStatuses) {
  const dependencyByArtifactId = new Map();

  for (const taskCardPath of taskCardPaths) {
    const taskId = readTaskIdFromCardPath(taskCardPath);
    if (!taskId) {
      continue;
    }

    const content = readFileSync(taskCardPath, 'utf8');
    const taskStatus = latestTaskStatuses.get(taskId) ?? readTaskStatusFromCard(content);
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
 * Parses YYYY-MM-DD to Date.
 * @param {string} rawDate Raw date string.
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
 * Calculates day distance.
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
 * @param {number} rowNumber Rendered row number.
 * @param {string} message Issue message.
 * @returns {string}
 */
function formatIssue(scope, rowNumber, message) {
  return `[${scope}] row ${rowNumber}: ${message}`;
}

/**
 * Compares two string arrays for exact equality.
 * @param {string[]} left Left array.
 * @param {string[]} right Right array.
 * @returns {boolean}
 */
function isSameStringArray(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

const databaseFilePath = resolve(process.cwd(), ARTIFACT_REGISTRY_SQLITE_PATH);
const mainRegistryPath = resolve(process.cwd(), ARTIFACT_REGISTRY_MAIN_VIEW_PATH);
const archiveRegistryPath = resolve(process.cwd(), ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH);
const taskLedgerRoot = resolve(process.cwd(), TASK_LEDGER_ROOT);
const taskCardRoot = resolve(process.cwd(), TASK_CARD_ROOT);
const latestTaskStatuses = readLatestTaskLedgerStatuses({
  taskLedgerRoot,
});
const taskCardPaths = listTaskCardFiles(taskCardRoot);
const expectedDependencyByArtifactId = buildExpectedArtifactDependencyIndex(
  taskCardPaths,
  latestTaskStatuses,
);
const todayDate = new Date();
const issues = [];

try {
  const canonicalState = readArtifactRegistryCanonicalState({
    databaseFilePath,
    mainRegistryPath,
    archiveRegistryPath,
  });
  const renderedViewDrift = compareRenderedArtifactRegistryViews({
    mainRows: canonicalState.mainRows,
    archiveRows: canonicalState.archiveRows,
    mainRegistryPath,
    archiveRegistryPath,
  });
  const mainRows = canonicalState.mainRows;
  const archiveRows = canonicalState.archiveRows;
  const seenArtifactIds = new Map();

  if (!renderedViewDrift.mainMatches) {
    issues.push(
      '[rendered-main] rendered CSV view drift detected. run node ./scripts/governance/render-artifact-registry-view.js',
    );
  }

  if (!renderedViewDrift.archiveMatches) {
    issues.push(
      '[rendered-archive] rendered CSV view drift detected. run node ./scripts/governance/render-artifact-registry-view.js',
    );
  }

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
            'main',
            row.__rowNumber,
            `dependent_tasks contains unknown task_id "${dependentTaskId}"`,
          ),
        );
        continue;
      }

      if (CLOSED_TASK_STATUSES.has(dependentTaskStatus)) {
        issues.push(
          formatIssue(
            'main',
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
            'main',
            row.__rowNumber,
            `dependent_tasks drift detected. expected="${expectedDependentTaskIds.join('|')}" actual="${actualDependentTaskIds.join('|')}". run reconcile-artifact-dependencies`,
          ),
        );
      }
    }

    if (
      (artifactStatus === 'deprecated' ||
        artifactStatus === 'archived' ||
        artifactStatus === 'retired') &&
      expectedDependentTaskIds.length > 0
    ) {
      issues.push(
        formatIssue(
          'main',
          row.__rowNumber,
          `non-consumable artifact status "${artifactStatus}" is still referenced by open tasks "${expectedDependentTaskIds.join('|')}"`,
        ),
      );
    }

    if (seenArtifactIds.has(artifactId)) {
      issues.push(
        formatIssue(
          'main',
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
          'main',
          row.__rowNumber,
          `invalid artifact_status "${artifactStatus}", expected one of ${Array.from(ALL_LIFECYCLE_STATUSES).join(', ')}`,
        ),
      );
      continue;
    }

    if (!MAIN_REGISTRY_ALLOWED_STATUSES.has(artifactStatus)) {
      issues.push(
        formatIssue(
          'main',
          row.__rowNumber,
          `artifact_status "${artifactStatus}" is not allowed in main registry, move it to archive registry`,
        ),
      );
    }

    if (!lastUpdatedDate) {
      issues.push(
        formatIssue(
          'main',
          row.__rowNumber,
          `invalid last_updated_at "${row.last_updated_at}", expected YYYY-MM-DD`,
        ),
      );
      continue;
    }

    const ageInDays = calculateDayDistance(lastUpdatedDate, todayDate);

    if (artifactStatus === 'active') {
      if (dependentTasks.hasTbdPlaceholder) {
        issues.push(
          formatIssue(
            'main',
            row.__rowNumber,
            'active artifact cannot keep dependent_tasks as "TBD"',
          ),
        );
      }

      if (dependentTasks.values.length === 0 && ageInDays > MAX_UNREFERENCED_ACTIVE_DAYS) {
        issues.push(
          formatIssue(
            'main',
            row.__rowNumber,
            `active artifact has no dependent tasks for ${ageInDays} days, transition to deprecated/archive to reduce context size`,
          ),
        );
      }
    }

    if (artifactStatus === 'deprecated') {
      if (dependentTasks.values.length > 0 || dependentTasks.hasTbdPlaceholder) {
        issues.push(
          formatIssue(
            'main',
            row.__rowNumber,
            'deprecated artifact must not keep dependent_tasks references',
          ),
        );
      }

      if (ageInDays > MAX_DEPRECATED_DAYS) {
        issues.push(
          formatIssue(
            'main',
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
          'archive',
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
          'archive',
          row.__rowNumber,
          `invalid artifact_status "${artifactStatus}", expected one of ${Array.from(ALL_LIFECYCLE_STATUSES).join(', ')}`,
        ),
      );
      continue;
    }

    if (!ARCHIVE_REGISTRY_ALLOWED_STATUSES.has(artifactStatus)) {
      issues.push(
        formatIssue(
          'archive',
          row.__rowNumber,
          `artifact_status "${artifactStatus}" is not allowed in archive registry`,
        ),
      );
    }

    if (dependentTasks.values.length > 0 || dependentTasks.hasTbdPlaceholder) {
      issues.push(
        formatIssue(
          'archive',
          row.__rowNumber,
          'archived/retired artifact must not keep dependent_tasks references',
        ),
      );
    }

    if (expectedDependentTaskIds.length > 0) {
      issues.push(
        formatIssue(
          'archive',
          row.__rowNumber,
          `archive artifact is still referenced by open tasks "${expectedDependentTaskIds.join('|')}"`,
        ),
      );
    }

    if (!lastUpdatedDate) {
      issues.push(
        formatIssue(
          'archive',
          row.__rowNumber,
          `invalid last_updated_at "${row.last_updated_at}", expected YYYY-MM-DD`,
        ),
      );
    }
  }

  if (canonicalState.bootstrappedFromCsv) {
    issues.push(
      `[canonical] canonical sqlite registry was bootstrapped from rendered CSV views at ${ARTIFACT_REGISTRY_SQLITE_PATH}; rebuild/migration must be explicit and read-only gates must fail closed`,
    );
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

gatePass(GATE_NAME, 'Artifact registry lifecycle is valid.');
