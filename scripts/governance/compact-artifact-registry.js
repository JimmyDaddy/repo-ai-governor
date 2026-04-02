#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
  ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  ARTIFACT_REGISTRY_SQLITE_PATH,
  parseDependentTasks,
  readArtifactRegistryCanonicalState,
  renderArtifactRegistryCsvViews,
  replaceArtifactRegistryCanonicalState,
} from './artifact-registry-canonical.js';
import { gateInfo, gatePass } from './gate-output.js';

const GATE_NAME = 'artifact-compact';

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
  if (!nextValue || nextValue.startsWith('--')) {
    throw new Error(`Flag "${flagName}" requires a value.`);
  }

  return nextValue.trim();
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
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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

export function compactArtifactRegistry(options = {}) {
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
  const inactiveDays = Number(options.inactiveDays ?? 7);
  const deprecationDays = Number(options.deprecationDays ?? 14);
  const dryRun = options.dryRun === true;
  const bootstrapFromCsv = options.bootstrapFromCsv === true;
  const today =
    options.today instanceof Date
      ? options.today
      : (parseDate(String(options.today ?? formatDate(new Date()))) ?? new Date());
  const emitGateOutput = options.emitGateOutput !== false;
  const writeOutputs = options.writeOutputs !== false;

  if (!Number.isFinite(inactiveDays) || inactiveDays < 0) {
    throw new Error(`Invalid inactiveDays value: ${inactiveDays}`);
  }

  if (!Number.isFinite(deprecationDays) || deprecationDays < 0) {
    throw new Error(`Invalid deprecationDays value: ${deprecationDays}`);
  }

  const canonicalState =
    options.mainRows && options.archiveRows
      ? {
          databaseFilePath,
          mainRows: options.mainRows,
          archiveRows: options.archiveRows,
          bootstrappedFromCsv: false,
        }
      : readArtifactRegistryCanonicalState({
          databaseFilePath,
          mainRegistryPath,
          archiveRegistryPath,
          bootstrapFromCsv,
        });
  const nextMainRows = [];
  const movedToArchiveRows = [];
  let markedDeprecatedCount = 0;

  for (const row of canonicalState.mainRows) {
    const dependentTasks = parseDependentTasks(row.dependent_tasks ?? '');
    const lastUpdatedDate = parseDate(row.last_updated_at ?? '') ?? today;
    const ageInDays = calculateDayDistance(lastUpdatedDate, today);
    const status = row.artifact_status;

    if (status === 'archived' || status === 'retired') {
      movedToArchiveRows.push({
        ...row,
        artifact_status: status,
        dependent_tasks: '',
        last_updated_at: formatDate(today),
      });
      continue;
    }

    if (status === 'deprecated' && ageInDays >= deprecationDays) {
      movedToArchiveRows.push({
        ...row,
        artifact_status: 'archived',
        dependent_tasks: '',
        last_updated_at: formatDate(today),
      });
      continue;
    }

    if (
      (status === 'active' || status === 'frozen') &&
      (dependentTasks.values.length === 0 || dependentTasks.hasTbdPlaceholder) &&
      ageInDays >= inactiveDays
    ) {
      nextMainRows.push({
        ...row,
        artifact_status: 'deprecated',
        dependent_tasks: '',
        last_updated_at: formatDate(today),
      });
      markedDeprecatedCount += 1;
      continue;
    }

    nextMainRows.push({
      ...row,
      dependent_tasks: dependentTasks.values.join('|'),
    });
  }

  const archiveRowById = new Map(
    canonicalState.archiveRows.map((row) => [`${row.artifact_id}@${row.artifact_version}`, row]),
  );
  for (const movedRow of movedToArchiveRows) {
    archiveRowById.set(`${movedRow.artifact_id}@${movedRow.artifact_version}`, movedRow);
  }

  const finalArchiveRows = Array.from(archiveRowById.values()).sort((left, right) => {
    const artifactIdOrder = left.artifact_id.localeCompare(right.artifact_id);
    if (artifactIdOrder !== 0) {
      return artifactIdOrder;
    }

    return right.artifact_version.localeCompare(left.artifact_version);
  });
  const finalMainRows = nextMainRows.sort((left, right) => {
    const artifactIdOrder = left.artifact_id.localeCompare(right.artifact_id);
    if (artifactIdOrder !== 0) {
      return artifactIdOrder;
    }

    return right.artifact_version.localeCompare(left.artifact_version);
  });

  const summary = {
    dryRun,
    databaseFilePath,
    bootstrappedFromCsv: canonicalState.bootstrappedFromCsv,
    inactiveDays,
    deprecationDays,
    mainRowsBefore: canonicalState.mainRows.length,
    mainRowsAfter: finalMainRows.length,
    archiveRowsBefore: canonicalState.archiveRows.length,
    archiveRowsAfter: finalArchiveRows.length,
    markedDeprecatedCount,
    movedToArchiveCount: movedToArchiveRows.length,
  };

  if (!dryRun && writeOutputs) {
    replaceArtifactRegistryCanonicalState({
      databaseFilePath,
      mainRows: finalMainRows,
      archiveRows: finalArchiveRows,
    });
    renderArtifactRegistryCsvViews({
      mainRows: finalMainRows,
      archiveRows: finalArchiveRows,
      mainRegistryPath,
      archiveRegistryPath,
      writeFiles: true,
    });
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
    mainRegistryPath,
    archiveRegistryPath,
    finalMainRows,
    finalArchiveRows,
    movedToArchiveRows,
    markedDeprecatedCount,
    bootstrappedFromCsv: canonicalState.bootstrappedFromCsv,
  };
}

function runCli() {
  const argv = process.argv.slice(2);
  compactArtifactRegistry({
    dryRun: argv.includes('--dry-run'),
    bootstrapFromCsv: argv.includes('--bootstrap-from-csv'),
    databaseFilePath: readFlagValue(argv, '--database') ?? ARTIFACT_REGISTRY_SQLITE_PATH,
    mainRegistryPath: readFlagValue(argv, '--main') ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
    archiveRegistryPath: readFlagValue(argv, '--archive') ?? ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
    inactiveDays: Number(readFlagValue(argv, '--inactive-days') ?? '7'),
    deprecationDays: Number(readFlagValue(argv, '--deprecation-days') ?? '14'),
    today: parseDate(readFlagValue(argv, '--today') ?? formatDate(new Date())) ?? new Date(),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
