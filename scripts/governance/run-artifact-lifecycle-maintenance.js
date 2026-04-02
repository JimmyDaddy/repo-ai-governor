#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
  ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  ARTIFACT_REGISTRY_SQLITE_PATH,
  renderArtifactRegistryCsvViews,
  replaceArtifactRegistryCanonicalState,
} from './artifact-registry-canonical.js';
import { compactArtifactRegistry } from './compact-artifact-registry.js';
import { gateInfo, gatePass } from './gate-output.js';
import { reconcileArtifactDependencies } from './reconcile-artifact-dependencies.js';

const GATE_NAME = 'artifact-lifecycle-maintenance';

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

function writeSummaryFile(summaryFilePath, payload) {
  mkdirSync(dirname(summaryFilePath), { recursive: true });
  writeFileSync(summaryFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const bootstrapFromCsv = argv.includes('--bootstrap-from-csv');
const databaseFilePath = resolve(
  process.cwd(),
  readFlagValue(argv, '--database') ?? ARTIFACT_REGISTRY_SQLITE_PATH,
);
const mainRegistryPath = resolve(
  process.cwd(),
  readFlagValue(argv, '--main') ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
);
const archiveRegistryPath = resolve(
  process.cwd(),
  readFlagValue(argv, '--archive') ?? ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
);
const inactiveDays = Number(readFlagValue(argv, '--inactive-days') ?? '7');
const deprecationDays = Number(readFlagValue(argv, '--deprecation-days') ?? '14');
const today = readFlagValue(argv, '--today') ?? new Date().toISOString().slice(0, 10);
const summaryFilePath = readFlagValue(argv, '--summary-file');

const reconciliation = reconcileArtifactDependencies({
  dryRun,
  bootstrapFromCsv,
  databaseFilePath,
  mainRegistryPath,
  writeOutputs: false,
  emitGateOutput: false,
  today,
});
const compaction = compactArtifactRegistry({
  dryRun,
  bootstrapFromCsv,
  databaseFilePath,
  mainRegistryPath,
  archiveRegistryPath,
  inactiveDays,
  deprecationDays,
  today,
  mainRows: reconciliation.nextMainRows,
  archiveRows: reconciliation.archiveRows,
  writeOutputs: false,
  emitGateOutput: false,
});

if (!dryRun) {
  replaceArtifactRegistryCanonicalState({
    databaseFilePath,
    mainRows: compaction.finalMainRows,
    archiveRows: compaction.finalArchiveRows,
  });
  renderArtifactRegistryCsvViews({
    mainRows: compaction.finalMainRows,
    archiveRows: compaction.finalArchiveRows,
    mainRegistryPath,
    archiveRegistryPath,
    writeFiles: true,
  });
}

const batchSummary = {
  dryRun,
  databaseFilePath,
  mainRegistryPath,
  archiveRegistryPath,
  bootstrappedFromCsv: reconciliation.bootstrappedFromCsv || compaction.bootstrappedFromCsv,
  updatedRows: reconciliation.summary.updatedRows,
  unresolvedArtifactDependencyRefs: reconciliation.summary.unresolvedArtifactDependencyRefs,
  markedDeprecatedCount: compaction.summary.markedDeprecatedCount,
  movedToArchiveCount: compaction.summary.movedToArchiveCount,
  renderedCsvViewsRefreshed: !dryRun,
};

const summary = {
  dryRun,
  databaseFilePath,
  mainRegistryPath,
  archiveRegistryPath,
  bootstrappedFromCsv: batchSummary.bootstrappedFromCsv,
  batchSummary,
  reconcile: reconciliation.summary,
  compact: compaction.summary,
  unresolvedArtifactIds: reconciliation.unresolvedArtifactIds,
};

if (reconciliation.unresolvedArtifactIds.length > 0) {
  gateInfo(
    GATE_NAME,
    `unresolved artifact refs in open task cards=${reconciliation.unresolvedArtifactIds.join(',')}`,
  );
}

if (summaryFilePath) {
  writeSummaryFile(resolve(process.cwd(), summaryFilePath), summary);
  gateInfo(GATE_NAME, `wrote maintenance summary to ${resolve(process.cwd(), summaryFilePath)}`);
}

if (dryRun) {
  gateInfo(GATE_NAME, `dry-run summary=${JSON.stringify(summary)}`);
} else {
  gatePass(GATE_NAME, `applied summary=${JSON.stringify(summary)}`);
}
