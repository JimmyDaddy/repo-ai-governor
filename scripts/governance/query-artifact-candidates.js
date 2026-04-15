#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  ARTIFACT_REGISTRY_SQLITE_PATH,
  parseDependentTasks,
  readArtifactRegistryCanonicalState,
} from './artifact-registry-canonical.js';
import { gateInfo, gatePass, gateWarn } from './gate-output.js';

const GATE_NAME = 'artifact-candidates';
const DEFAULT_LIMIT = 8;
const CONSUMABLE_STATUSES = new Set(['active', 'frozen']);
const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'into',
  'task',
  'tasks',
  'sprint',
  'project',
  'baseline',
  'closeout',
  'followup',
  'follow',
  'handoff',
  'rollout',
  'input',
  'inputs',
  'constraints',
  'constraint',
  'governance',
  'implementation',
  'validate',
  'validation',
  'review',
  'decompose',
  'decomposition',
  'activate',
  'active',
  'planned',
  'completed',
  '任务',
  '实现',
  '治理',
  '输入',
  '约束',
  '产物',
  '后续',
  '项目',
  '迭代',
  '拆解',
  '执行',
  '计划',
]);

/**
 * Escapes one string for regex usage.
 * @param {string} value Raw string value.
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/**
 * Parses CLI arguments.
 * @param {string[]} argv Raw argv entries.
 * @returns {{
 *   databaseFilePath?: string;
 *   mainRegistryPath?: string;
 *   projectIds: string[];
 *   sprintIds: string[];
 *   terms: string[];
 *   taskTitles: string[];
 *   goals: string[];
 *   limit: number;
 *   json: boolean;
 *   help: boolean;
 * }}
 */
function parseArgs(argv) {
  const options = {
    projectIds: [],
    sprintIds: [],
    terms: [],
    taskTitles: [],
    goals: [],
    limit: DEFAULT_LIMIT,
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
      case '--database':
        options.databaseFilePath = nextValue;
        break;
      case '--main':
        options.mainRegistryPath = nextValue;
        break;
      case '--project':
        options.projectIds.push(nextValue);
        break;
      case '--sprint':
        options.sprintIds.push(nextValue);
        break;
      case '--term':
        options.terms.push(nextValue);
        break;
      case '--task-title':
        options.taskTitles.push(nextValue);
        break;
      case '--goal':
        options.goals.push(nextValue);
        break;
      case '--limit':
        options.limit = normalizeLimit(nextValue);
        break;
      default:
        throw new Error(`Unsupported option: ${argument}`);
    }

    index += 1;
  }

  return options;
}

/**
 * Normalizes query limit.
 * @param {string} value Raw CLI value.
 * @returns {number}
 */
function normalizeLimit(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid --limit value: ${value}`);
  }

  return parsed;
}

/**
 * Prints CLI help.
 */
function printHelp() {
  process.stdout.write(
    [
      'Usage: node ./scripts/governance/query-artifact-candidates.js [options]',
      '',
      'Resolve a small candidate set of consumable DA artifacts for task decomposition',
      'without manually opening the full artifact corpus in model context.',
      '',
      'Options:',
      '  --project <project-xxx>      Repeatable target project id',
      '  --sprint <sprint-xxx>        Repeatable target sprint id',
      '  --term <keyword>             Repeatable search term',
      '  --task-title <text>          Repeatable task title query',
      '  --goal <text>                Repeatable task goal query',
      '  --limit <n>                  Default: 8',
      '  --database <path>            Override canonical sqlite path',
      '  --main <path>                Override rendered main CSV path',
      '  --json                       Emit JSON instead of markdown summary',
    ].join('\n'),
  );
}

/**
 * Normalizes one string list into unique trimmed values.
 * @param {string[]} values Raw values.
 * @returns {string[]}
 */
function normalizeStringList(values) {
  return Array.from(
    new Set(values.map((value) => String(value ?? '').trim()).filter((value) => value.length > 0)),
  );
}

/**
 * Extracts search tokens from freeform phrases.
 * @param {string[]} values Raw phrases.
 * @returns {string[]}
 */
function extractSearchTokens(values) {
  const tokens = new Set();

  for (const value of values) {
    const normalizedValue = String(value ?? '')
      .trim()
      .toLowerCase();
    if (!normalizedValue) {
      continue;
    }

    const matchedTokens = normalizedValue.match(/[\p{Letter}\p{Number}-]+/gu) ?? [];
    for (const token of matchedTokens) {
      if (STOP_WORDS.has(token)) {
        continue;
      }

      const hasCjkCharacter = /[\p{Script=Han}]/u.test(token);
      if (!hasCjkCharacter && token.length < 4) {
        continue;
      }

      tokens.add(token);
    }
  }

  return Array.from(tokens);
}

/**
 * Counts non-overlapping lowercase occurrences of one token.
 * @param {string} haystack Lowercase haystack.
 * @param {string} needle Lowercase needle.
 * @returns {number}
 */
function countOccurrences(haystack, needle) {
  if (!needle) {
    return 0;
  }

  const pattern = new RegExp(escapeRegExp(needle), 'gu');
  return haystack.match(pattern)?.length ?? 0;
}

/**
 * Reads artifact file content when available.
 * @param {string} artifactPath Relative artifact path.
 * @returns {string}
 */
function readArtifactContent(artifactPath) {
  const absolutePath = resolve(process.cwd(), artifactPath);
  if (!existsSync(absolutePath)) {
    return '';
  }

  return readFileSync(absolutePath, 'utf8');
}

/**
 * Builds the normalized query payload.
 * @param {{
 *   projectIds: string[];
 *   sprintIds: string[];
 *   terms: string[];
 *   taskTitles: string[];
 *   goals: string[];
 *   limit: number;
 * }} options Raw options.
 * @returns {{
 *   projectIds: string[];
 *   sprintIds: string[];
 *   phrases: string[];
 *   tokens: string[];
 *   limit: number;
 * }}
 */
function buildQuery(options) {
  const projectIds = normalizeStringList(options.projectIds);
  const sprintIds = normalizeStringList(options.sprintIds);
  const phrases = normalizeStringList([
    ...options.terms,
    ...options.taskTitles,
    ...options.goals,
  ]).map((value) => value.toLowerCase());
  const tokens = extractSearchTokens([
    ...projectIds,
    ...sprintIds,
    ...options.terms,
    ...options.taskTitles,
    ...options.goals,
  ]);

  if (
    projectIds.length === 0 &&
    sprintIds.length === 0 &&
    phrases.length === 0 &&
    tokens.length === 0
  ) {
    throw new Error(
      'At least one selector is required. Use --project, --sprint, --term, --task-title, or --goal.',
    );
  }

  return {
    projectIds,
    sprintIds,
    phrases,
    tokens,
    limit: options.limit,
  };
}

/**
 * Scores one candidate artifact row.
 * @param {Record<string, string>} row Canonical artifact row.
 * @param {{
 *   projectIds: string[];
 *   sprintIds: string[];
 *   phrases: string[];
 *   tokens: string[];
 * }} query Normalized query.
 * @returns {{
 *   artifactId: string;
 *   artifactStatus: string;
 *   artifactType: string;
 *   artifactPath: string;
 *   producerTaskId: string;
 *   dependentTasks: string[];
 *   score: number;
 *   reasons: string[];
 * }}
 */
function scoreArtifactCandidate(row, query) {
  const reasons = [];
  const metadataText = [row.artifact_id, row.artifact_type, row.artifact_path, row.producer_task_id]
    .join(' ')
    .toLowerCase();
  const content = readArtifactContent(row.artifact_path).toLowerCase();
  let score = 0;

  for (const projectId of query.projectIds) {
    const projectIdLower = projectId.toLowerCase();
    if (content.includes(projectIdLower)) {
      score += 90;
      reasons.push(`content mentions ${projectId}`);
      continue;
    }

    if (metadataText.includes(projectIdLower)) {
      score += 45;
      reasons.push(`metadata mentions ${projectId}`);
    }
  }

  for (const sprintId of query.sprintIds) {
    const sprintIdLower = sprintId.toLowerCase();
    if (content.includes(sprintIdLower)) {
      score += 70;
      reasons.push(`content mentions ${sprintId}`);
      continue;
    }

    if (metadataText.includes(sprintIdLower)) {
      score += 35;
      reasons.push(`metadata mentions ${sprintId}`);
    }
  }

  for (const phrase of query.phrases) {
    if (content.includes(phrase)) {
      score += 40;
      reasons.push(`content matches "${phrase}"`);
      continue;
    }

    if (metadataText.includes(phrase)) {
      score += 20;
      reasons.push(`metadata matches "${phrase}"`);
    }
  }

  for (const token of query.tokens) {
    const metadataHits = countOccurrences(metadataText, token);
    if (metadataHits > 0) {
      score += Math.min(18, metadataHits * 6);
      reasons.push(`metadata token "${token}" x${metadataHits}`);
    }

    const contentHits = countOccurrences(content, token);
    if (contentHits > 0) {
      score += Math.min(30, contentHits * 6);
      reasons.push(`content token "${token}" x${contentHits}`);
    }
  }

  const dependentTasks = parseDependentTasks(row.dependent_tasks).values;
  if (dependentTasks.length > 0) {
    score += Math.min(12, dependentTasks.length * 3);
    reasons.push(`already consumed by ${dependentTasks.length} open task(s)`);
  }

  if (row.artifact_status === 'active') {
    score += 3;
  }

  return {
    artifactId: row.artifact_id,
    artifactStatus: row.artifact_status,
    artifactType: row.artifact_type,
    artifactPath: row.artifact_path,
    producerTaskId: row.producer_task_id,
    dependentTasks,
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 5),
  };
}

/**
 * Queries candidate artifacts for task decomposition.
 * @param {{
 *   databaseFilePath?: string;
 *   mainRegistryPath?: string;
 *   projectIds?: string[];
 *   sprintIds?: string[];
 *   terms?: string[];
 *   taskTitles?: string[];
 *   goals?: string[];
 *   limit?: number;
 * }} [options] Optional query overrides.
 * @returns {{
 *   query: {
 *     projectIds: string[];
 *     sprintIds: string[];
 *     phrases: string[];
 *     tokens: string[];
 *     limit: number;
 *   };
 *   candidates: Array<{
 *     artifactId: string;
 *     artifactStatus: string;
 *     artifactType: string;
 *     artifactPath: string;
 *     producerTaskId: string;
 *     dependentTasks: string[];
 *     score: number;
 *     reasons: string[];
 *   }>;
 *   databaseFilePath: string;
 *   mainRegistryPath: string;
 * }}
 */
export function queryArtifactCandidates(options = {}) {
  const query = buildQuery({
    projectIds: options.projectIds ?? [],
    sprintIds: options.sprintIds ?? [],
    terms: options.terms ?? [],
    taskTitles: options.taskTitles ?? [],
    goals: options.goals ?? [],
    limit: options.limit ?? DEFAULT_LIMIT,
  });
  const canonicalState = readArtifactRegistryCanonicalState({
    databaseFilePath: options.databaseFilePath ?? ARTIFACT_REGISTRY_SQLITE_PATH,
    mainRegistryPath: options.mainRegistryPath ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
  });
  const candidateRows = canonicalState.mainRows.filter((row) =>
    CONSUMABLE_STATUSES.has(row.artifact_status),
  );
  const candidates = candidateRows
    .map((row) => scoreArtifactCandidate(row, query))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.artifactId.localeCompare(right.artifactId);
    })
    .slice(0, query.limit);

  return {
    query,
    candidates,
    databaseFilePath: canonicalState.databaseFilePath,
    mainRegistryPath: resolve(
      process.cwd(),
      options.mainRegistryPath ?? ARTIFACT_REGISTRY_MAIN_VIEW_PATH,
    ),
  };
}

/**
 * Renders one markdown summary.
 * @param {ReturnType<typeof queryArtifactCandidates>} result Query result.
 * @returns {string}
 */
function renderMarkdown(result) {
  const queryParts = [
    result.query.projectIds.length > 0 ? `projects=${result.query.projectIds.join(', ')}` : null,
    result.query.sprintIds.length > 0 ? `sprints=${result.query.sprintIds.join(', ')}` : null,
    result.query.phrases.length > 0 ? `phrases=${result.query.phrases.join(' | ')}` : null,
    result.query.tokens.length > 0 ? `tokens=${result.query.tokens.join(', ')}` : null,
  ].filter(Boolean);

  const lines = [
    '# Artifact Candidate Query',
    '',
    `- Registry: \`${result.databaseFilePath}\``,
    `- Query: ${queryParts.length > 0 ? queryParts.join('; ') : 'none'}`,
    `- Candidate Count: ${result.candidates.length}`,
    '',
    '| artifact_id | status | score | producer_task_id | reasons | artifact_path |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  if (result.candidates.length === 0) {
    lines.push('| *(none)* |  |  |  |  |  |');
    return lines.join('\n');
  }

  for (const candidate of result.candidates) {
    lines.push(
      `| ${candidate.artifactId} | ${candidate.artifactStatus} | ${candidate.score} | ${candidate.producerTaskId} | ${candidate.reasons.join('<br>')} | ${candidate.artifactPath} |`,
    );
  }

  return lines.join('\n');
}

function runCli() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const result = queryArtifactCandidates(options);
  if (options.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          query: result.query,
          databaseFilePath: result.databaseFilePath,
          mainRegistryPath: result.mainRegistryPath,
          candidates: result.candidates,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  if (result.candidates.length === 0) {
    gateWarn(
      GATE_NAME,
      'No consumable artifact candidates matched the selectors. Narrow the task scope or add explicit handoff inputs.',
    );
  } else {
    gatePass(
      GATE_NAME,
      `resolved ${result.candidates.length} candidate artifact(s) from consumable registry rows.`,
    );
  }

  gateInfo(
    GATE_NAME,
    `query projects=${result.query.projectIds.length} sprints=${result.query.sprintIds.length} phrases=${result.query.phrases.length} tokens=${result.query.tokens.length}`,
  );

  process.stdout.write(`${renderMarkdown(result)}\n`);
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
