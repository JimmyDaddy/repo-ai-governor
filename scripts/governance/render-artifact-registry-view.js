#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MAIN_REGISTRY_PATH = '.repo-ai-governor/context/artifact-registry/artifacts.csv';
const ARCHIVE_REGISTRY_PATH =
  '.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv';
const REQUIRED_HEADERS = [
  'artifact_id',
  'artifact_type',
  'artifact_path',
  'artifact_version',
  'artifact_status',
  'producer_task_id',
  'producer_execution_id',
  'registered_at',
  'last_updated_at',
  'dependent_tasks',
];

/**
 * Parses one CSV line with quote support.
 * @param {string} line Raw CSV line.
 * @returns {string[]}
 */
function parseCsvLine(line) {
  const values = [];
  let currentValue = '';
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

    if (character === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);
  return values;
}

/**
 * Reads one registry CSV file.
 * @param {string} relativeFilePath Relative CSV path.
 * @returns {Array<Record<string, string>>}
 */
function readRegistry(relativeFilePath) {
  const absoluteFilePath = resolve(process.cwd(), relativeFilePath);
  if (!existsSync(absoluteFilePath)) {
    throw new Error(`Registry file not found: ${relativeFilePath}`);
  }

  const lines = readFileSync(absoluteFilePath, 'utf8')
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error(`Registry file is empty: ${relativeFilePath}`);
  }

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(
        `Registry file missing required header "${requiredHeader}": ${relativeFilePath}`,
      );
    }
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(
        `CSV row column mismatch in ${relativeFilePath}. Expected ${headers.length}, got ${values.length}.`,
      );
    }

    /** @type {Record<string, string>} */
    const row = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = values[index].trim();
    }

    return row;
  });
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
  const mainRows = readRegistry(MAIN_REGISTRY_PATH);
  const archiveRows = readRegistry(ARCHIVE_REGISTRY_PATH);
  const renderedAt = new Date().toISOString().slice(0, 10);

  const output = [
    '# Artifact Registry View',
    '',
    `- Generated At: ${renderedAt}`,
    `- Main Registry: \`${MAIN_REGISTRY_PATH}\``,
    `- Archive Registry: \`${ARCHIVE_REGISTRY_PATH}\``,
    `- Main Status Summary: ${renderStatusSummary(mainRows)}`,
    `- Archive Status Summary: ${renderStatusSummary(archiveRows)}`,
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
