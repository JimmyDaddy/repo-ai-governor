#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  ARTIFACT_REGISTRY_SQLITE_PATH,
  readArtifactRegistryCanonicalState,
  renderArtifactRegistryCsvViews,
  replaceArtifactRegistryCanonicalState,
} from './artifact-registry-canonical.js';
import { gateInfo, gatePass } from './gate-output.js';
import {
  ensureTaskLedgerProjection,
  readLatestTaskLedgerStatuses,
} from './task-ledger-projection.js';

const GATE_NAME = 'artifact-reconcile';
const TASK_LEDGER_ROOT = '.repo-ai-governor/context/dev';
const TASK_CARD_ROOT = '.repo-ai-governor/context/dev';
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
const ACTIVE_REGISTRY_STATUSES = new Set(['active', 'frozen']);

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
 * Builds artifact -> open dependent task ids map from task cards.
 * @param {string[]} taskCardPaths Task card markdown paths.
 * @param {Map<string, string>} latestTaskStatuses Latest task statuses.
 * @returns {{dependencyByArtifactId: Map<string, Set<string>>, openTaskCards: number, fallbackStatusCards: number}}
 */
function buildArtifactDependencyIndexFromTaskCards(taskCardPaths, latestTaskStatuses) {
  const dependencyByArtifactId = new Map();
  let openTaskCards = 0;
  let fallbackStatusCards = 0;

  for (const taskCardPath of taskCardPaths) {
    const taskId = readTaskIdFromCardPath(taskCardPath);
    if (!taskId) {
      continue;
    }

    const content = readFileSync(taskCardPath, 'utf8');
    const fromLedger = latestTaskStatuses.get(taskId);
    const fromCard = readTaskStatusFromCard(content);
    const taskStatus = fromLedger ?? fromCard;

    if (!taskStatus) {
      continue;
    }

    if (!fromLedger && fromCard) {
      fallbackStatusCards += 1;
    }

    if (CLOSED_TASK_STATUSES.has(taskStatus)) {
      continue;
    }

    const dependedArtifactIds = extractDependsOnArtifactIds(content);
    if (dependedArtifactIds.length === 0) {
      continue;
    }

    openTaskCards += 1;

    for (const artifactId of dependedArtifactIds) {
      const consumerTaskIds = dependencyByArtifactId.get(artifactId) ?? new Set();
      consumerTaskIds.add(taskId);
      dependencyByArtifactId.set(artifactId, consumerTaskIds);
    }
  }

  return {
    dependencyByArtifactId,
    openTaskCards,
    fallbackStatusCards,
  };
}

/**
 * Converts one date/timestamp string into comparable weight.
 * @param {string} rawValue Raw timestamp value.
 * @returns {number}
 */
function parseDateWeight(rawValue) {
  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }

  return parsedDate.getTime();
}

export function reconcileArtifactDependencies(options = {}) {
  const dryRun = options.dryRun === true;
  const bootstrapFromCsv = options.bootstrapFromCsv === true;
  const databaseFilePath = resolve(
    process.cwd(),
    options.databaseFilePath ?? ARTIFACT_REGISTRY_SQLITE_PATH,
  );
  const mainRegistryPath = resolve(
    process.cwd(),
    options.mainRegistryPath ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  );
  const taskLedgerRoot = resolve(process.cwd(), options.taskLedgerRoot ?? TASK_LEDGER_ROOT);
  const taskCardRoot = resolve(process.cwd(), options.taskCardRoot ?? TASK_CARD_ROOT);
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const emitGateOutput = options.emitGateOutput !== false;
  const writeOutputs = options.writeOutputs !== false;

  const canonicalState = readArtifactRegistryCanonicalState({
    databaseFilePath,
    mainRegistryPath,
    bootstrapFromCsv,
  });
  const taskLedgerProjectionSummary = ensureTaskLedgerProjection({
    taskLedgerRoot,
  });
  const latestTaskStatuses = readLatestTaskLedgerStatuses({
    taskLedgerRoot,
  });
  const taskCardPaths = listTaskCardFiles(taskCardRoot);
  const { dependencyByArtifactId, openTaskCards, fallbackStatusCards } =
    buildArtifactDependencyIndexFromTaskCards(taskCardPaths, latestTaskStatuses);

  const registryArtifactIds = new Set(canonicalState.mainRows.map((row) => row.artifact_id));
  const unresolvedArtifactIds = Array.from(dependencyByArtifactId.keys())
    .filter((artifactId) => !registryArtifactIds.has(artifactId))
    .sort((left, right) => left.localeCompare(right));

  let updatedRowCount = 0;
  let correctedDateInversionCount = 0;
  let activeArtifactWithDependentsCount = 0;
  let activeArtifactWithoutDependentsCount = 0;
  let totalResolvedDependencyLinks = 0;

  const nextMainRows = canonicalState.mainRows.map((row) => ({ ...row }));

  for (const row of nextMainRows) {
    let changed = false;

    if (parseDateWeight(row.last_updated_at ?? '') < parseDateWeight(row.registered_at ?? '')) {
      row.last_updated_at = today;
      correctedDateInversionCount += 1;
      changed = true;
    }

    const artifactStatus = row.artifact_status;
    const expectedDependentTasks = ACTIVE_REGISTRY_STATUSES.has(artifactStatus)
      ? Array.from(dependencyByArtifactId.get(row.artifact_id) ?? []).sort((left, right) =>
          left.localeCompare(right),
        )
      : [];

    if (ACTIVE_REGISTRY_STATUSES.has(artifactStatus)) {
      if (expectedDependentTasks.length > 0) {
        activeArtifactWithDependentsCount += 1;
        totalResolvedDependencyLinks += expectedDependentTasks.length;
      } else {
        activeArtifactWithoutDependentsCount += 1;
      }
    }

    const nextDependentTasks = expectedDependentTasks.join('|');
    if (nextDependentTasks !== String(row.dependent_tasks ?? '')) {
      row.dependent_tasks = nextDependentTasks;
      changed = true;
    }

    if (changed) {
      row.last_updated_at = today;
      updatedRowCount += 1;
    }
  }

  if (!dryRun && writeOutputs) {
    replaceArtifactRegistryCanonicalState({
      databaseFilePath,
      mainRows: nextMainRows,
      archiveRows: canonicalState.archiveRows,
    });
    renderArtifactRegistryCsvViews({
      mainRows: nextMainRows,
      archiveRows: canonicalState.archiveRows,
      writeFiles: true,
    });
  }

  const summary = {
    dryRun,
    databaseFilePath,
    bootstrappedFromCsv: canonicalState.bootstrappedFromCsv,
    taskCsvFiles: taskLedgerProjectionSummary.sourceCount,
    indexedTasks: latestTaskStatuses.size,
    taskCardFiles: taskCardPaths.length,
    openTaskCards,
    fallbackStatusCards,
    updatedRows: updatedRowCount,
    correctedDateInversionCount,
    activeArtifactWithDependentsCount,
    activeArtifactWithoutDependentsCount,
    totalResolvedDependencyLinks,
    unresolvedArtifactDependencyRefs: unresolvedArtifactIds.length,
  };

  if (emitGateOutput && unresolvedArtifactIds.length > 0) {
    gateInfo(
      GATE_NAME,
      `unresolved artifact refs in open task cards=${unresolvedArtifactIds.join(',')}`,
    );
  }

  if (emitGateOutput) {
    if (dryRun) {
      gateInfo(GATE_NAME, `dry-run summary=${JSON.stringify(summary)}`);
    } else {
      gatePass(GATE_NAME, `applied summary=${JSON.stringify(summary)}`);
    }
  }

  return {
    summary,
    databaseFilePath,
    taskLedgerProjectionSummary,
    latestTaskStatuses,
    taskCardPaths,
    unresolvedArtifactIds,
    nextMainRows,
    archiveRows: canonicalState.archiveRows,
    bootstrappedFromCsv: canonicalState.bootstrappedFromCsv,
  };
}

function runCli() {
  const argv = process.argv.slice(2);
  reconcileArtifactDependencies({
    dryRun: argv.includes('--dry-run'),
    bootstrapFromCsv: argv.includes('--bootstrap-from-csv'),
    ...(argv.includes('--database')
      ? {
          databaseFilePath: argv[argv.indexOf('--database') + 1] ?? ARTIFACT_REGISTRY_SQLITE_PATH,
        }
      : {}),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
