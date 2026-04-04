#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from './gate-output.js';
import {
  compareRenderedTaskLedgerCsvViews,
  readProjectedTaskRowsForSource,
} from './task-ledger-projection.js';

const GATE_NAME = 'task-ledger-sync';
const CURRENT_CONTEXT_PATH = '.repo-ai-governor/context/current-context.md';
const TASK_CARD_FILE_PATTERN = /^TK-\d{3}.*\.md$/;
const REQUIRED_TASK_METADATA_KEYS = ['Status', 'Date', 'Owner', 'Priority', 'Project', 'Sprint'];
const PLACEHOLDER_VALUES = new Set(['待执行', '待验证']);
const ACTIVE_STREAM_STATUSES = new Set(['active', 'in_progress', 'running']);

/**
 * Resolves the active stream document roots from the `## Active Streams` section in current context.
 * Why: ledger drift often happens when people edit one stream while writing another stream's CSV,
 * and completed streams should already be moved into the history index.
 * @returns {{
 *   streamDefinitions: Array<{streamKey: string, tasksDirPath: string, checklistPath: string, csvPath: string}>,
 *   invalidStreamEntries: string[],
 *   idleWithoutActiveStreams: boolean
 * }}
 */
function resolveActiveStreams() {
  const contextPath = resolve(process.cwd(), CURRENT_CONTEXT_PATH);

  if (!existsSync(contextPath)) {
    throw new Error(`Current context file not found: ${contextPath}`);
  }

  const contextContent = readFileSync(contextPath, 'utf8');
  const activeStreamsSection = extractMarkdownSection(contextContent, 'Active Streams');
  const primaryStreamSection = extractMarkdownSection(contextContent, 'Primary Stream');
  const streamDefinitions = [];
  const invalidStreamEntries = [];

  if (!activeStreamsSection.trim()) {
    throw new Error('`## Active Streams` section not found in current-context.');
  }

  for (const line of activeStreamsSection.split(/\r?\n/)) {
    const streamMatch = line.match(/^- `([^`]+)`: (.+)$/);
    if (!streamMatch) {
      continue;
    }

    const streamKey = streamMatch[1];
    const descriptor = streamMatch[2];
    const tasksDirPath = extractBacktickField(descriptor, 'tasks');
    const checklistPath = extractBacktickField(descriptor, 'checklist');
    const csvPath = extractBacktickField(descriptor, 'csv');
    const normalizedStatus = normalizeStreamStatus(extractBacktickField(descriptor, 'status'));

    if (!ACTIVE_STREAM_STATUSES.has(normalizedStatus)) {
      invalidStreamEntries.push(`${streamKey} (status=${normalizedStatus || 'missing'})`);
      continue;
    }

    if (!tasksDirPath || !checklistPath || !csvPath) {
      continue;
    }

    streamDefinitions.push({
      streamKey,
      tasksDirPath: resolve(process.cwd(), tasksDirPath),
      checklistPath: resolve(process.cwd(), checklistPath),
      csvPath: resolve(process.cwd(), csvPath),
    });
  }

  if (streamDefinitions.length === 0) {
    if (normalizePrimaryStatus(primaryStreamSection) === 'idle') {
      return {
        streamDefinitions,
        invalidStreamEntries,
        idleWithoutActiveStreams: true,
      };
    }

    throw new Error(
      'No active stream entry with `tasks/checklist/csv` paths was found under `## Active Streams` in current-context.',
    );
  }

  return {
    streamDefinitions,
    invalidStreamEntries,
    idleWithoutActiveStreams: false,
  };
}

/**
 * Extracts one markdown section body by semantic heading label.
 * @param {string} content Full markdown content.
 * @param {string} headingText Target heading label.
 * @returns {string}
 */
function extractMarkdownSection(content, headingText) {
  const normalizedHeadingText = normalizeSectionHeading(headingText);
  const headingPattern = /^##\s+([^\n]+)$/gmu;
  const headingMatches = Array.from(content.matchAll(headingPattern));

  for (let index = 0; index < headingMatches.length; index += 1) {
    const currentHeadingMatch = headingMatches[index];
    const rawHeadingText = currentHeadingMatch[1]?.trim() ?? '';
    const currentHeadingIndex = currentHeadingMatch.index;
    if (typeof currentHeadingIndex !== 'number') {
      continue;
    }

    if (normalizeSectionHeading(rawHeadingText) !== normalizedHeadingText) {
      continue;
    }

    const sectionStart = currentHeadingIndex + currentHeadingMatch[0].length;
    const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
    return content.slice(sectionStart, sectionEnd).trim();
  }

  return '';
}

/**
 * Normalizes one section heading so numbering drift does not break parsing.
 * @param {string} headingText Raw heading text.
 * @returns {string}
 */
function normalizeSectionHeading(headingText) {
  return headingText
    .replace(/^\d+(?:\.\d+)*\.?\s*/u, '')
    .trim()
    .toLowerCase();
}

/**
 * Normalizes one stream status from current-context.
 * @param {string | null} status Raw status value.
 * @returns {string}
 */
function normalizeStreamStatus(status) {
  return (status ?? '').trim().toLowerCase().replace(/\s+/gu, '_').replace(/-/gu, '_');
}

/**
 * Reads primary-stream status from current-context.
 * @param {string} primaryStreamSection Raw `## Primary Stream` section content.
 * @returns {string}
 */
function normalizePrimaryStatus(primaryStreamSection) {
  const primaryStatusMatch = primaryStreamSection.match(/^- Status:\s*(.+)$/imu);
  return normalizeStreamStatus(primaryStatusMatch?.[1] ?? '');
}

/**
 * Extracts one backtick-delimited field from stream descriptor line.
 * @param {string} descriptor Stream descriptor text in current-context.
 * @param {string} fieldName Field name to extract.
 * @returns {string | null}
 */
function extractBacktickField(descriptor, fieldName) {
  const fieldPattern = new RegExp(`${fieldName}=\\\`([^\\\`]+)\\\``);
  const fieldMatch = descriptor.match(fieldPattern);
  return fieldMatch ? fieldMatch[1] : null;
}

/**
 * Parses canonical task cards that are expected to mirror tasks.csv core fields.
 * @param {string} tasksDirPath Absolute tasks directory path.
 * @returns {Map<string, {
 *   taskId: string,
 *   title: string,
 *   status: string,
 *   date: string,
 *   owner: string,
 *   priority: string,
 *   project: string,
 *   sprint: string,
 *   goal: string,
 *   filePath: string
 * }>}
 */
function parseCanonicalTaskCards(tasksDirPath) {
  if (!existsSync(tasksDirPath)) {
    throw new Error(`Tasks directory not found: ${tasksDirPath}`);
  }

  const taskCards = new Map();
  const fileNames = readdirSync(tasksDirPath).filter((fileName) =>
    TASK_CARD_FILE_PATTERN.test(fileName),
  );

  for (const fileName of fileNames) {
    const filePath = resolve(tasksDirPath, fileName);
    const content = readFileSync(filePath, 'utf8');
    const card = parseCanonicalTaskCard(content, filePath);

    if (!card) {
      continue;
    }

    if (taskCards.has(card.taskId)) {
      const existingCard = taskCards.get(card.taskId);
      throw new Error(
        `Multiple canonical task cards found for ${card.taskId}: ${existingCard.filePath} and ${card.filePath}`,
      );
    }

    taskCards.set(card.taskId, card);
  }

  if (taskCards.size === 0) {
    throw new Error(`No canonical task cards found in: ${tasksDirPath}`);
  }

  return taskCards;
}

/**
 * Parses one markdown task card and returns canonical payload if metadata is complete.
 * @param {string} content Task markdown content.
 * @param {string} filePath Absolute file path.
 * @returns {null | {
 *   taskId: string,
 *   title: string,
 *   status: string,
 *   date: string,
 *   owner: string,
 *   priority: string,
 *   project: string,
 *   sprint: string,
 *   goal: string,
 *   filePath: string
 * }}
 */
function parseCanonicalTaskCard(content, filePath) {
  const headingMatch = content.match(/^#\s*(TK-\d{3})\s+(.+?)\s*$/m);
  if (!headingMatch) {
    return null;
  }

  const metadata = parseMetadataSection(content);
  const hasAllRequiredMetadata = REQUIRED_TASK_METADATA_KEYS.every((metadataKey) =>
    metadata.has(metadataKey),
  );
  if (!hasAllRequiredMetadata) {
    return null;
  }

  const goal = parseTaskGoal(content);
  if (!goal) {
    return null;
  }

  return {
    taskId: headingMatch[1].trim(),
    title: headingMatch[2].trim(),
    status: normalizeStatus(readMetadataValue(metadata, 'Status')),
    date: readMetadataValue(metadata, 'Date'),
    owner: readMetadataValue(metadata, 'Owner'),
    priority: readMetadataValue(metadata, 'Priority'),
    project: readMetadataValue(metadata, 'Project'),
    sprint: readMetadataValue(metadata, 'Sprint'),
    goal,
    filePath,
  };
}

/**
 * Parses top metadata block (`- Key: Value`) before first section heading.
 * @param {string} content Markdown content.
 * @returns {Map<string, string>}
 */
function parseMetadataSection(content) {
  const metadata = new Map();

  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith('## ')) {
      break;
    }

    const metadataMatch = line.match(/^- ([^:]+):\s*(.+)$/);
    if (!metadataMatch) {
      continue;
    }

    metadata.set(metadataMatch[1].trim(), metadataMatch[2].trim());
  }

  return metadata;
}

/**
 * Reads one metadata value and strips markdown wrappers.
 * @param {Map<string, string>} metadata Parsed metadata map.
 * @param {string} key Metadata key.
 * @returns {string}
 */
function readMetadataValue(metadata, key) {
  const rawValue = metadata.get(key) ?? '';
  return stripMarkdownWrappers(rawValue).trim();
}

/**
 * Extracts task goal section text.
 * @param {string} content Task markdown content.
 * @returns {string}
 */
function parseTaskGoal(content) {
  const goalSectionMatch = content.match(
    /##\s*1\.\s*(?:任务目标|目标|Task Goal)([\s\S]*?)(?:\n##\s|\n#\s|\s*$)/,
  );
  if (!goalSectionMatch) {
    return '';
  }

  const goalLines = goalSectionMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''));

  return stripMarkdownWrappers(goalLines.join(' ')).trim();
}

/**
 * Parses checklist rows (`- [x] TK-001 xxx`) for status/title alignment.
 * @param {string} checklistPath Absolute checklist path.
 * @returns {Map<string, {checked: boolean, title: string}>}
 */
function parseChecklist(checklistPath) {
  if (!existsSync(checklistPath)) {
    throw new Error(`checklist.md not found: ${checklistPath}`);
  }

  const checklistContent = readFileSync(checklistPath, 'utf8');
  const checklistMap = new Map();

  for (const line of checklistContent.split(/\r?\n/)) {
    const checklistMatch = line.match(/^- \[(x| )\] (TK-\d{3}) (.+)$/i);
    if (!checklistMatch) {
      continue;
    }

    checklistMap.set(checklistMatch[2], {
      checked: checklistMatch[1].toLowerCase() === 'x',
      title: checklistMatch[3].trim(),
    });
  }

  return checklistMap;
}

/**
 * Normalizes statuses to a fixed ledger vocabulary.
 * @param {string} status Raw status.
 * @returns {string}
 */
function normalizeStatus(status) {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, '-');

  if (normalized === 'done') {
    return 'completed';
  }

  if (normalized === 'in-progress' || normalized === 'in_progress' || normalized === 'active') {
    return 'in_progress';
  }

  return normalized.replace(/-/g, '_');
}

/**
 * Strips markdown wrappers to keep semantic comparison stable.
 * @param {string} value Raw markdown text.
 * @returns {string}
 */
function stripMarkdownWrappers(value) {
  return value.replace(/`/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, ' ');
}

/**
 * Normalizes free text for loose semantic matching.
 * @param {string} value Raw text.
 * @returns {string}
 */
function normalizeText(value) {
  return stripMarkdownWrappers(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the latest canonical row for a task where title matches the task card title.
 * @param {Array<Record<string, string> & {__rowNumber: number}>} rows CSV rows.
 * @param {string} taskId Task id.
 * @param {string} title Canonical title from task card.
 * @returns {(Record<string, string> & {__rowNumber: number}) | null}
 */
function findLatestCanonicalRow(rows, taskId, title) {
  const matchingRows = rows.filter(
    (row) => row.task_id === taskId && normalizeText(row.title ?? '') === normalizeText(title),
  );

  if (matchingRows.length === 0) {
    return null;
  }

  return matchingRows[matchingRows.length - 1];
}

/**
 * Builds mismatch records for one stream.
 * @param {string} streamKey Stream key.
 * @param {Map<string, ReturnType<typeof parseCanonicalTaskCard>>} taskCards Task card map.
 * @param {Map<string, {checked: boolean, title: string}>} checklistMap Checklist entries.
 * @param {Array<Record<string, string> & {__rowNumber: number}>} csvRows CSV rows.
 * @returns {string[]}
 */
function collectDriftIssues(streamKey, taskCards, checklistMap, csvRows) {
  const issues = [];

  for (const [taskId, taskCard] of taskCards.entries()) {
    const taskRows = csvRows.filter((row) => row.task_id === taskId);
    if (taskRows.length === 0) {
      issues.push(`[${streamKey}] ${taskId}: missing row in tasks.csv`);
      continue;
    }

    const canonicalRow = findLatestCanonicalRow(csvRows, taskId, taskCard.title);
    if (!canonicalRow) {
      const rowTitles = taskRows.map((row) => row.title).join(' | ');
      issues.push(
        `[${streamKey}] ${taskId}: title drift. task card title="${taskCard.title}", tasks.csv titles="${rowTitles}"`,
      );
      continue;
    }

    compareExactField(
      issues,
      streamKey,
      taskId,
      'owner',
      taskCard.owner,
      canonicalRow.owner,
      canonicalRow.__rowNumber,
    );
    compareExactField(
      issues,
      streamKey,
      taskId,
      'priority',
      taskCard.priority,
      canonicalRow.priority,
      canonicalRow.__rowNumber,
    );
    compareExactField(
      issues,
      streamKey,
      taskId,
      'project',
      taskCard.project,
      canonicalRow.project,
      canonicalRow.__rowNumber,
    );
    compareExactField(
      issues,
      streamKey,
      taskId,
      'sprint',
      taskCard.sprint,
      canonicalRow.sprint,
      canonicalRow.__rowNumber,
    );
    compareExactField(
      issues,
      streamKey,
      taskId,
      'recorded_at',
      taskCard.date,
      canonicalRow.recorded_at,
      canonicalRow.__rowNumber,
    );

    const cardStatus = normalizeStatus(taskCard.status);
    const csvStatus = normalizeStatus(canonicalRow.status ?? '');
    if (cardStatus !== csvStatus) {
      issues.push(
        `[${streamKey}] ${taskId}: status mismatch at tasks.csv#L${canonicalRow.__rowNumber}. task card="${cardStatus}", tasks.csv="${csvStatus}"`,
      );
    }

    if (!isPlanAligned(taskCard.goal, canonicalRow.plan ?? '')) {
      issues.push(
        `[${streamKey}] ${taskId}: plan mismatch at tasks.csv#L${canonicalRow.__rowNumber}. task goal and tasks.csv plan are not aligned`,
      );
    }

    const checklistItem = checklistMap.get(taskId);
    if (!checklistItem) {
      issues.push(`[${streamKey}] ${taskId}: missing checklist entry`);
      continue;
    }

    if (normalizeText(checklistItem.title) !== normalizeText(taskCard.title)) {
      issues.push(
        `[${streamKey}] ${taskId}: checklist title mismatch. checklist="${checklistItem.title}", task card="${taskCard.title}"`,
      );
    }

    if (checklistItem.checked && csvStatus !== 'completed') {
      issues.push(
        `[${streamKey}] ${taskId}: checklist is checked but tasks.csv status is "${csvStatus}" at line ${canonicalRow.__rowNumber}`,
      );
    }

    if (!checklistItem.checked && csvStatus === 'completed') {
      issues.push(
        `[${streamKey}] ${taskId}: checklist is unchecked but tasks.csv status is completed at line ${canonicalRow.__rowNumber}`,
      );
    }

    if (csvStatus === 'completed') {
      if (normalizeText(canonicalRow.owner ?? '') === 'tbd') {
        issues.push(
          `[${streamKey}] ${taskId}: completed row has owner=TBD at tasks.csv#L${canonicalRow.__rowNumber}`,
        );
      }

      if (PLACEHOLDER_VALUES.has((canonicalRow.result ?? '').trim())) {
        issues.push(
          `[${streamKey}] ${taskId}: completed row has placeholder result at tasks.csv#L${canonicalRow.__rowNumber}`,
        );
      }

      if (PLACEHOLDER_VALUES.has((canonicalRow.verify ?? '').trim())) {
        issues.push(
          `[${streamKey}] ${taskId}: completed row has placeholder verify at tasks.csv#L${canonicalRow.__rowNumber}`,
        );
      }

      if (PLACEHOLDER_VALUES.has((canonicalRow.review_delta ?? '').trim())) {
        issues.push(
          `[${streamKey}] ${taskId}: completed row has placeholder review_delta at tasks.csv#L${canonicalRow.__rowNumber}`,
        );
      }
    }
  }

  for (const [taskId] of checklistMap.entries()) {
    if (!taskCards.has(taskId)) {
      issues.push(`[${streamKey}] ${taskId}: checklist entry has no canonical task card`);
    }
  }

  return issues;
}

/**
 * Adds an exact-field mismatch when values are different.
 * @param {string[]} issues Issue collection.
 * @param {string} streamKey Stream key.
 * @param {string} taskId Task id.
 * @param {string} fieldName Field name.
 * @param {string} expected Expected value.
 * @param {string} actual Actual value.
 * @param {number} rowNumber CSV row number.
 */
function compareExactField(issues, streamKey, taskId, fieldName, expected, actual, rowNumber) {
  if (normalizeText(expected) === normalizeText(actual)) {
    return;
  }

  issues.push(
    `[${streamKey}] ${taskId}: ${fieldName} mismatch at tasks.csv#L${rowNumber}. task card="${expected}", tasks.csv="${actual}"`,
  );
}

/**
 * Checks whether tasks.csv plan still represents task goal.
 * @param {string} taskGoal Goal text from task card.
 * @param {string} csvPlan Plan text in tasks.csv.
 * @returns {boolean}
 */
function isPlanAligned(taskGoal, csvPlan) {
  const normalizedGoal = normalizeText(taskGoal);
  const normalizedPlan = normalizeText(csvPlan);

  if (!normalizedGoal || !normalizedPlan) {
    return false;
  }

  if (normalizedGoal === normalizedPlan) {
    return true;
  }

  if (normalizedGoal.includes(normalizedPlan) || normalizedPlan.includes(normalizedGoal)) {
    return true;
  }

  // Why: tasks.csv often keeps a condensed summary, so a soft similarity floor catches true drift
  // while still tolerating concise rephrasing.
  return calculateBigramDiceSimilarity(normalizedGoal, normalizedPlan) >= 0.33;
}

/**
 * Calculates Sørensen–Dice similarity based on character bigrams.
 * @param {string} left Left text.
 * @param {string} right Right text.
 * @returns {number}
 */
function calculateBigramDiceSimilarity(left, right) {
  if (left.length < 2 || right.length < 2) {
    return left === right ? 1 : 0;
  }

  const leftBigrams = buildBigrams(left);
  const rightBigrams = buildBigrams(right);
  const leftCounter = new Map();

  for (const bigram of leftBigrams) {
    leftCounter.set(bigram, (leftCounter.get(bigram) ?? 0) + 1);
  }

  let intersectionCount = 0;
  for (const bigram of rightBigrams) {
    const currentCount = leftCounter.get(bigram) ?? 0;
    if (currentCount === 0) {
      continue;
    }

    intersectionCount += 1;
    leftCounter.set(bigram, currentCount - 1);
  }

  return (2 * intersectionCount) / (leftBigrams.length + rightBigrams.length);
}

/**
 * Builds character bigrams.
 * @param {string} value Input text.
 * @returns {string[]}
 */
function buildBigrams(value) {
  const bigrams = [];
  for (let index = 0; index < value.length - 1; index += 1) {
    bigrams.push(value.slice(index, index + 2));
  }
  return bigrams;
}

try {
  const { streamDefinitions, invalidStreamEntries, idleWithoutActiveStreams } =
    resolveActiveStreams();
  const issues = invalidStreamEntries.map(
    (entry) => `current-context Active Streams contains non-active entry: ${entry}`,
  );

  if (idleWithoutActiveStreams && issues.length === 0) {
    gatePass(GATE_NAME, 'No active streams registered; current-context primary stream is idle.');
    process.exit(0);
  }

  for (const streamDefinition of streamDefinitions) {
    const taskCards = parseCanonicalTaskCards(streamDefinition.tasksDirPath);
    const checklistMap = parseChecklist(streamDefinition.checklistPath);
    const csvRows = readProjectedTaskRowsForSource({
      taskCsvPath: streamDefinition.csvPath,
      taskLedgerRoot: '.repo-ai-governor/context/dev',
    });
    const renderedViewComparison = compareRenderedTaskLedgerCsvViews({
      taskCsvPath: streamDefinition.csvPath,
      taskLedgerRoot: '.repo-ai-governor/context/dev',
    });
    const renderedView = renderedViewComparison.views[0] ?? null;

    if (!renderedView) {
      issues.push(`[${streamDefinition.streamKey}] missing canonical sqlite source for tasks.csv`);
    } else if (!renderedView.matches) {
      issues.push(
        `[${streamDefinition.streamKey}] rendered tasks.csv drifted from sqlite canonical truth`,
      );
    }

    issues.push(
      ...collectDriftIssues(streamDefinition.streamKey, taskCards, checklistMap, csvRows),
    );
  }

  if (issues.length > 0) {
    gateFail(GATE_NAME, `Found ${issues.length} ledger drift issue(s).`);
    for (const issue of issues) {
      gateInfo(GATE_NAME, `- ${issue}`);
    }
    process.exit(1);
  }

  gatePass(GATE_NAME, 'Task cards, checklist, and tasks.csv are synchronized.');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
