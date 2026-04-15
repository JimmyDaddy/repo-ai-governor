#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { gateFail, gateInfo, gatePass } from './gate-output.js';

const GATE_NAME = 'task-required-inputs';
const DEFAULT_TASK_ROOT = '.repo-ai-governor/context/dev';
const DEFAULT_MAX_REQUIRED_INPUTS = 5;
const DEFAULT_MAX_ARTIFACT_INPUTS = 3;
const REQUIRED_INPUTS_SECTION_HEADING_PATTERN =
  /^##\s*(?:\d+(?:\.\d+)*\.?\s*)?Required Inputs\s*$/u;
const LEGACY_INPUT_REFERENCES_SECTION_HEADING_PATTERN =
  /^##\s*(?:\d+(?:\.\d+)*\.?\s*)?Input References\s*$/u;
const OVERRIDE_PATTERN = /required-input-limit-allowed\s*:\s*(.+)$/iu;

/**
 * Parses CLI arguments.
 * @param {string[]} argv Raw argv values.
 * @returns {{
 *   tasksRoot: string;
 *   taskIds: string[];
 *   maxRequiredInputs: number;
 *   maxArtifactInputs: number;
 *   json: boolean;
 *   help: boolean;
 * }}
 */
function parseArgs(argv) {
  const options = {
    tasksRoot: DEFAULT_TASK_ROOT,
    taskIds: [],
    maxRequiredInputs: DEFAULT_MAX_REQUIRED_INPUTS,
    maxArtifactInputs: DEFAULT_MAX_ARTIFACT_INPUTS,
    json: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (argument === '--json') {
      options.json = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!argument.startsWith('--')) {
      continue;
    }

    if (typeof nextValue !== 'string' || nextValue.startsWith('--')) {
      throw new Error(`Option ${argument} requires one value.`);
    }

    switch (argument) {
      case '--tasks-dir':
      case '--tasks-root':
        options.tasksRoot = nextValue;
        break;
      case '--task-id':
        options.taskIds.push(nextValue);
        break;
      case '--max-required-inputs':
        options.maxRequiredInputs = normalizePositiveInteger(nextValue, argument);
        break;
      case '--max-artifact-inputs':
        options.maxArtifactInputs = normalizePositiveInteger(nextValue, argument);
        break;
      default:
        throw new Error(`Unsupported option: ${argument}`);
    }

    index += 1;
  }

  return options;
}

/**
 * Prints CLI help.
 */
function printHelp() {
  process.stdout.write(
    [
      'Usage: node ./scripts/governance/check-task-required-inputs.js [options]',
      '',
      'Validates that task decomposition keeps Required Inputs narrow enough',
      'for lightweight execution entry instead of pulling every DA into context.',
      '',
      'Options:',
      '  --tasks-dir <path>             Scan one tasks dir or dev root (default: .repo-ai-governor/context/dev)',
      '  --task-id <TK-xxx|CR-xxx>      Repeatable task-id filter',
      '  --max-required-inputs <n>      Default: 5',
      '  --max-artifact-inputs <n>      Default: 3',
      '  --json                         Emit JSON summary',
    ].join('\n'),
  );
}

/**
 * Normalizes positive integer values.
 * @param {string} value Raw CLI value.
 * @param {string} label Option label.
 * @returns {number}
 */
function normalizePositiveInteger(value, label) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid value for ${label}: ${value}`);
  }

  return parsed;
}

/**
 * Lists task card files from one root.
 * @param {string} rootPath Root directory.
 * @returns {string[]}
 */
function listTaskCardFiles(rootPath) {
  if (!existsSync(rootPath)) {
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

      if (entry.isFile() && /^T[KC]-\d+.*\.md$/u.test(entry.name)) {
        filePaths.push(absolutePath);
      }
    }
  }

  walk(rootPath);
  return filePaths;
}

/**
 * Reads one task id from card path.
 * @param {string} taskCardPath Absolute task card path.
 * @returns {string | null}
 */
function readTaskIdFromCardPath(taskCardPath) {
  const matched = basename(taskCardPath).match(/^(T[KC]-\d+)/u);
  return matched ? matched[1] : null;
}

/**
 * Extracts numbered list items from one markdown section.
 * @param {string} content Markdown content.
 * @param {RegExp[]} headingPatterns Allowed heading patterns.
 * @returns {string[]}
 */
function extractSectionItems(content, headingPatterns) {
  const lines = content.split(/\r?\n/u);
  let sectionStartIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();
    if (headingPatterns.some((pattern) => pattern.test(trimmedLine))) {
      sectionStartIndex = index + 1;
      break;
    }
  }

  if (sectionStartIndex === -1) {
    return [];
  }

  const sectionLines = [];
  for (let index = sectionStartIndex; index < lines.length; index += 1) {
    if (/^##\s+/u.test(lines[index].trim())) {
      break;
    }
    sectionLines.push(lines[index]);
  }

  return (
    sectionLines
      .join('\n')
      .match(/^\d+\.\s+.+$/gmu)
      ?.map((line) => line.replace(/^\d+\.\s+/u, '').trim())
      .filter((line) => line.length > 0) ?? []
  );
}

/**
 * Evaluates task required-input boundaries.
 * @param {{
 *   tasksRoot?: string;
 *   taskIds?: string[];
 *   maxRequiredInputs?: number;
 *   maxArtifactInputs?: number;
 * }} [options] Optional overrides.
 * @returns {{
 *   checkedTaskCount: number;
 *   issues: string[];
 *   results: Array<{
 *     taskId: string;
 *     filePath: string;
 *     requiredInputCount: number;
 *     artifactInputCount: number;
 *     overrideReason: string | null;
 *   }>;
 * }}
 */
export function checkTaskRequiredInputs(options = {}) {
  const tasksRoot = resolve(process.cwd(), options.tasksRoot ?? DEFAULT_TASK_ROOT);
  const taskIdFilter = new Set(
    (options.taskIds ?? []).map((taskId) => taskId.trim()).filter(Boolean),
  );
  const maxRequiredInputs = options.maxRequiredInputs ?? DEFAULT_MAX_REQUIRED_INPUTS;
  const maxArtifactInputs = options.maxArtifactInputs ?? DEFAULT_MAX_ARTIFACT_INPUTS;
  const issues = [];
  const results = [];

  for (const taskCardPath of listTaskCardFiles(tasksRoot)) {
    const taskId = readTaskIdFromCardPath(taskCardPath);
    if (!taskId) {
      continue;
    }

    if (taskIdFilter.size > 0 && !taskIdFilter.has(taskId)) {
      continue;
    }

    const content = readFileSync(taskCardPath, 'utf8');
    const overrideReason = content.match(OVERRIDE_PATTERN)?.[1]?.trim() ?? null;
    const requiredInputs = extractSectionItems(content, [
      REQUIRED_INPUTS_SECTION_HEADING_PATTERN,
      LEGACY_INPUT_REFERENCES_SECTION_HEADING_PATTERN,
    ]);
    const artifactInputCount = requiredInputs.reduce((count, item) => {
      return count + (item.match(/DA-\d+/gu)?.length ?? 0);
    }, 0);

    results.push({
      taskId,
      filePath: taskCardPath,
      requiredInputCount: requiredInputs.length,
      artifactInputCount,
      overrideReason,
    });

    if (overrideReason) {
      continue;
    }

    if (requiredInputs.length > maxRequiredInputs) {
      issues.push(
        `${taskId} at ${taskCardPath} has ${requiredInputs.length} Required Inputs; max=${maxRequiredInputs}. Move excess items into Traceback References or activation-time follow-up.`,
      );
    }

    if (artifactInputCount > maxArtifactInputs) {
      issues.push(
        `${taskId} at ${taskCardPath} references ${artifactInputCount} DA inputs; max=${maxArtifactInputs}. Keep only first-hop DA inputs in Required Inputs and move the rest into Traceback References.`,
      );
    }
  }

  for (const taskId of taskIdFilter) {
    if (!results.some((result) => result.taskId === taskId)) {
      issues.push(`Requested task_id "${taskId}" was not found under ${tasksRoot}.`);
    }
  }

  return {
    checkedTaskCount: results.length,
    issues,
    results,
  };
}

function runCli() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const result = checkTaskRequiredInputs(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.issues.length > 0) {
      process.exit(1);
    }
    return;
  }

  if (result.issues.length > 0) {
    gateFail(GATE_NAME, `Found ${result.issues.length} required-input boundary issue(s).`);
    for (const issue of result.issues) {
      gateInfo(GATE_NAME, `- ${issue}`);
    }
    process.exit(1);
  }

  gatePass(
    GATE_NAME,
    `Checked ${result.checkedTaskCount} task card(s); Required Inputs stayed within lightweight entry limits.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${errorMessage}\n`);
    process.exit(1);
  }
}
