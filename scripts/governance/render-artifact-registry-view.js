#!/usr/bin/env node

import {
  ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH,
  ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  ARTIFACT_REGISTRY_SQLITE_PATH,
  readArtifactRegistryCanonicalState,
  renderArtifactRegistryCsvViews,
} from './artifact-registry-canonical.js';

/**
 * Reads one CLI flag value.
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
 * Builds count summary by lifecycle status.
 * @param {Array<Record<string, string>>} rows Registry rows.
 * @returns {string}
 */
function renderStatusSummary(rows) {
  const counts = new Map();

  for (const row of rows) {
    const status = row.artifact_status || 'unknown';
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([status, count]) => `${status}=${count}`)
    .join(', ');
}

/**
 * Renders one registry section as Markdown table.
 * @param {string} title Section title.
 * @param {Array<Record<string, string>>} rows Registry rows.
 * @returns {string}
 */
function renderRegistrySection(title, rows) {
  const lines = [`## ${title}`];

  if (rows.length === 0) {
    lines.push('', '_No rows._');
    return lines.join('\n');
  }

  lines.push('');
  lines.push(
    '| artifact_id | status | artifact_type | producer_task_id | dependent_tasks | artifact_path |',
  );
  lines.push('|---|---|---|---|---|---|');

  for (const row of rows) {
    const dependentTasks = row.dependent_tasks ? row.dependent_tasks : '*(none)*';
    lines.push(
      `| ${row.artifact_id} | ${row.artifact_status} | ${row.artifact_type} | ${row.producer_task_id} | ${dependentTasks} | ${row.artifact_path} |`,
    );
  }

  return lines.join('\n');
}

try {
  const argv = process.argv.slice(2);
  const writeFiles = !argv.includes('--skip-write');
  const bootstrapFromCsv = argv.includes('--bootstrap-from-csv');
  const databaseFilePath = readFlagValue(argv, '--database') ?? ARTIFACT_REGISTRY_SQLITE_PATH;
  const mainRegistryPath = readFlagValue(argv, '--main') ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH;
  const archiveRegistryPath =
    readFlagValue(argv, '--archive') ?? ARTIFACT_REGISTRY_ARCHIVE_VIEW_PATH;
  const canonicalState = readArtifactRegistryCanonicalState({
    databaseFilePath,
    mainRegistryPath,
    archiveRegistryPath,
    bootstrapFromCsv,
  });
  const mainRows = canonicalState.mainRows;
  const archiveRows = canonicalState.archiveRows;
  renderArtifactRegistryCsvViews({
    mainRows,
    archiveRows,
    mainRegistryPath,
    archiveRegistryPath,
    writeFiles,
  });
  const renderedAt = new Date().toISOString().slice(0, 10);

  const output = [
    '# Artifact Registry View',
    '',
    `- Generated At: ${renderedAt}`,
    `- Canonical Sqlite Registry: \`${databaseFilePath}\``,
    `- Main Registry View: \`${mainRegistryPath}\``,
    `- Archive Registry View: \`${archiveRegistryPath}\``,
    `- CSV Views Updated: ${writeFiles ? 'yes' : 'no (skip-write)'}`,
    `- Main Status Summary: ${renderStatusSummary(mainRows)}`,
    `- Archive Status Summary: ${renderStatusSummary(archiveRows)}`,
    `- Canonical Bootstrapped From CSV: ${canonicalState.bootstrappedFromCsv ? 'yes' : 'no'}`,
    '',
    renderRegistrySection('Main Registry', mainRows),
    '',
    renderRegistrySection('Archive Registry', archiveRows),
    '',
  ].join('\n');

  process.stdout.write(output);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
