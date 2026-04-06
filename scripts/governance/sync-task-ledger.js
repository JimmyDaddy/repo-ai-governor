#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  readProjectedTaskRowsForSource,
  replaceTaskLedgerCanonicalRowsForSource,
} from './task-ledger-projection.js';
const TASK_CARD_FILE_PATTERN = /^(?:TK|CR)-\d{3}.*\.md$/u;
const TASK_STATUS_TERMINAL = new Set([
  'completed',
  'done',
  'closed',
  'resolved',
  'archived',
  'retired',
]);
function parseArgs(argv) {
  /** @type {Record<string, string | boolean | null>} */
  const options = {
    workspaceRoot: null,
    tasksDir: null,
    taskId: null,
    executionId: null,
    status: null,
    result: null,
    verify: null,
    reviewDelta: null,
    checklistNote: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const nextValue = argv[index + 1];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (!argument.startsWith('--')) {
      continue;
    }

    if (typeof nextValue !== 'string' || nextValue.startsWith('--')) {
      throw new Error(`Option ${argument} requires one value.`);
    }

    switch (argument) {
      case '--workspace-root':
        options.workspaceRoot = nextValue;
        break;
      case '--tasks-dir':
        options.tasksDir = nextValue;
        break;
      case '--task-id':
        options.taskId = nextValue;
        break;
      case '--execution-id':
        options.executionId = nextValue;
        break;
      case '--status':
        options.status = nextValue;
        break;
      case '--result':
        options.result = nextValue;
        break;
      case '--verify':
        options.verify = nextValue;
        break;
      case '--review-delta':
        options.reviewDelta = nextValue;
        break;
      case '--checklist-note':
        options.checklistNote = nextValue;
        break;
      default:
        throw new Error(`Unsupported option: ${argument}`);
    }

    index += 1;
  }

  return options;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: node ./scripts/governance/sync-task-ledger.js [options]',
      '',
      'Options:',
      '  --workspace-root <path>   Workspace root that contains context/current-context.md',
      '  --tasks-dir <path>        Tasks directory that contains TK/CR/checklist/tasks.csv',
      '  --task-id <id>            Sync one specific task card and its derived ledgers',
      '  --execution-id <id>       Execution id used when appending one canonical csv row',
      '  --status <status>         Optional status override; must match task-card status',
      '  --result <text>           Optional result summary for appended csv row',
      '  --verify <text>           Optional verification summary for appended csv row',
      '  --review-delta <text>     Optional review delta summary for appended csv row',
      '  --checklist-note <text>   Optional checklist execution note appended under the task',
    ].join('\n'),
  );
}

function stripMarkdownWrappers(value) {
  return value.replace(/^`(.+)`$/u, '$1').replace(/^\[(.+)\]\(.+\)$/u, '$1');
}

function normalizeStatus(value) {
  return value.trim().toLowerCase().replace(/\s+/gu, '_').replace(/-/gu, '_');
}

function parseMetadataSection(content) {
  const metadata = new Map();

  for (const line of content.split(/\r?\n/u)) {
    if (line.startsWith('## ')) {
      break;
    }

    const metadataMatch = line.match(/^- ([^:]+):\s*(.+)$/u);
    if (!metadataMatch) {
      continue;
    }

    metadata.set(metadataMatch[1].trim(), metadataMatch[2].trim());
  }

  return metadata;
}

function readMetadataValue(metadata, key) {
  const rawValue = metadata.get(key) ?? '';
  return stripMarkdownWrappers(rawValue).trim();
}

function normalizeSectionHeading(headingText) {
  return headingText
    .replace(/^\d+(?:\.\d+)*\.?\s*/u, '')
    .trim()
    .toLowerCase();
}

function extractSection(content, headingText) {
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

function parseTaskGoal(content) {
  const goalSection = extractSection(content, '任务目标') || extractSection(content, 'Task Goal');
  const goalLines = goalSection
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*]\s+/u, '').replace(/^\d+\.\s+/u, ''));

  return stripMarkdownWrappers(goalLines.join(' ')).trim();
}

function parseTaskExecutionNotes(content) {
  const executionSection =
    extractSection(content, '执行记录') || extractSection(content, 'Execution Record');
  return executionSection
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/u.test(line) || /^[-*]\s+/u.test(line))
    .map((line) =>
      line
        .replace(/^\d+\.\s+/u, '')
        .replace(/^[-*]\s+/u, '')
        .trim(),
    )
    .filter((line) => line.length > 0);
}

function parseTaskCard(content, filePath) {
  const headingMatch = content.match(/^#\s*((?:TK|CR)-\d{3})\s+(.+?)\s*$/mu);
  if (!headingMatch) {
    return null;
  }

  const metadata = parseMetadataSection(content);
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
    executionNotes: parseTaskExecutionNotes(content),
  };
}

function parseTaskCards(tasksDirPath) {
  if (!existsSync(tasksDirPath)) {
    throw new Error(`Tasks directory not found: ${tasksDirPath}`);
  }

  const cards = new Map();
  const fileNames = readdirSync(tasksDirPath)
    .filter((fileName) => TASK_CARD_FILE_PATTERN.test(fileName))
    .sort();

  for (const fileName of fileNames) {
    const filePath = resolve(tasksDirPath, fileName);
    const content = readFileSync(filePath, 'utf8');
    const taskCard = parseTaskCard(content, filePath);
    if (!taskCard) {
      continue;
    }

    cards.set(taskCard.taskId, taskCard);
  }

  if (cards.size === 0) {
    throw new Error(`No canonical task cards found in: ${tasksDirPath}`);
  }

  return cards;
}

function parseChecklist(checklistPath) {
  const entries = new Map();
  const order = [];

  if (!existsSync(checklistPath)) {
    return { entries, order };
  }

  const lines = readFileSync(checklistPath, 'utf8').split(/\r?\n/u);
  let currentTaskId = null;

  for (const line of lines) {
    const taskLineMatch = line.match(/^- \[(x| )\] ((?:TK|CR)-\d{3}) (.+)$/iu);
    if (taskLineMatch) {
      currentTaskId = taskLineMatch[2];
      if (!entries.has(currentTaskId)) {
        order.push(currentTaskId);
      }
      entries.set(currentTaskId, {
        checked: taskLineMatch[1].toLowerCase() === 'x',
        title: taskLineMatch[3].trim(),
        detailLines: [],
      });
      continue;
    }

    if (!currentTaskId) {
      continue;
    }

    const currentEntry = entries.get(currentTaskId);
    if (!currentEntry) {
      continue;
    }

    if (/^ {2,}- /u.test(line)) {
      currentEntry.detailLines.push(line);
    }
  }

  return { entries, order };
}

function renderChecklist(taskCards, checklistState, options) {
  const taskIdsInOrder = [
    ...checklistState.order.filter((taskId) => taskCards.has(taskId)),
    ...Array.from(taskCards.keys())
      .filter((taskId) => !checklistState.entries.has(taskId))
      .sort(),
  ];

  const lines = ['# checklist', ''];

  for (const taskId of taskIdsInOrder) {
    const taskCard = taskCards.get(taskId);
    if (!taskCard) {
      continue;
    }

    const checked = TASK_STATUS_TERMINAL.has(taskCard.status);
    lines.push(`- [${checked ? 'x' : ' '}] ${taskId} ${taskCard.title}`);

    const detailLines = taskCard.executionNotes.map((note) => `  - ${note}`);

    if (options.taskId === taskId && options.checklistNote) {
      const normalizedChecklistNote = `  - ${options.checklistNote}`;
      if (!detailLines.includes(normalizedChecklistNote)) {
        detailLines.push(normalizedChecklistNote);
      }
    }

    for (const detailLine of detailLines) {
      lines.push(detailLine);
    }
  }

  lines.push('');
  return `${lines.join('\n')}`;
}

function buildLatestCsvRowMap(rows) {
  const latestRows = new Map();

  for (const row of rows) {
    const taskId = row.task_id;
    if (!taskId) {
      continue;
    }

    const current = latestRows.get(taskId);
    const score = `${row.recorded_at ?? ''}|${String(row.__rowNumber ?? 0).padStart(6, '0')}`;
    if (!current || score >= current.score) {
      latestRows.set(taskId, {
        row,
        score,
      });
    }
  }

  return new Map(Array.from(latestRows.entries()).map(([taskId, value]) => [taskId, value.row]));
}

function resolveTasksDirectory(options) {
  if (typeof options.tasksDir === 'string' && options.tasksDir.trim().length > 0) {
    return resolve(process.cwd(), options.tasksDir);
  }

  const workspaceRoot =
    typeof options.workspaceRoot === 'string' && options.workspaceRoot.trim().length > 0
      ? resolve(process.cwd(), options.workspaceRoot)
      : resolve(process.cwd(), '.repo-ai-governor');

  if (typeof options.taskId === 'string' && options.taskId.trim().length > 0) {
    const taskCardPath = findTaskCardPath(resolve(workspaceRoot, 'context', 'dev'), options.taskId);
    if (!taskCardPath) {
      throw new Error(
        `Task card not found for ${options.taskId} under ${workspaceRoot}/context/dev.`,
      );
    }

    return dirname(taskCardPath);
  }

  const currentContextPath = resolve(workspaceRoot, 'context', 'current-context.md');
  if (!existsSync(currentContextPath)) {
    throw new Error(`Current context file not found: ${currentContextPath}`);
  }

  const currentContextContent = readFileSync(currentContextPath, 'utf8');
  const activeStreamsSection = extractSection(currentContextContent, 'Active Streams');
  const primaryStreamLine = activeStreamsSection
    .split(/\r?\n/u)
    .find(
      (line) =>
        /^- `[^`]+`: /u.test(line) &&
        (line.startsWith('- `primary`:') || line.includes('role=`primary`')),
    );
  if (!primaryStreamLine) {
    throw new Error(`Primary active stream not found in: ${currentContextPath}`);
  }

  const tasksDirectoryPath = primaryStreamLine.match(/tasks=`([^`]+)`/u)?.[1];
  if (!tasksDirectoryPath) {
    throw new Error(`Primary stream tasks directory missing in: ${currentContextPath}`);
  }

  return resolve(process.cwd(), tasksDirectoryPath);
}

function findTaskCardPath(rootDirectory, taskId) {
  const pendingDirectories = [rootDirectory];

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();
    if (!currentDirectory || !existsSync(currentDirectory)) {
      continue;
    }

    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = resolve(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath);
        continue;
      }

      if (
        entry.isFile() &&
        (entry.name === `${taskId}.md` ||
          (entry.name.startsWith(`${taskId}-`) && entry.name.endsWith('.md')))
      ) {
        return entryPath;
      }
    }
  }

  return null;
}

function compareCanonicalRow(taskCard, latestRow) {
  if (!latestRow) {
    return false;
  }

  if ((latestRow.title ?? '').trim() !== taskCard.title) {
    return false;
  }
  if (normalizeStatus(latestRow.status ?? '') !== taskCard.status) {
    return false;
  }
  if ((latestRow.owner ?? '').trim() !== taskCard.owner) {
    return false;
  }
  if ((latestRow.priority ?? '').trim() !== taskCard.priority) {
    return false;
  }
  if ((latestRow.project ?? '').trim() !== taskCard.project) {
    return false;
  }
  if ((latestRow.sprint ?? '').trim() !== taskCard.sprint) {
    return false;
  }
  if ((latestRow.recorded_at ?? '').trim() !== taskCard.date) {
    return false;
  }

  return (latestRow.plan ?? '').trim() === taskCard.goal;
}

function buildCsvRow(taskCard, latestRow, options) {
  if (options.status && normalizeStatus(options.status) !== taskCard.status) {
    throw new Error(
      `Status override "${options.status}" does not match canonical task-card status "${taskCard.status}" for ${taskCard.taskId}.`,
    );
  }

  const generatedExecutionId =
    options.executionId &&
    typeof options.executionId === 'string' &&
    options.executionId.trim().length > 0
      ? options.executionId.trim()
      : `exec-sync-${Date.now()}-${taskCard.taskId.toLowerCase()}`;

  return {
    execution_id: generatedExecutionId,
    task_id: taskCard.taskId,
    title: taskCard.title,
    owner: taskCard.owner,
    priority: taskCard.priority,
    due_date: latestRow?.due_date?.trim() || taskCard.date,
    status: taskCard.status,
    project: taskCard.project,
    sprint: taskCard.sprint,
    plan: taskCard.goal,
    result:
      (typeof options.result === 'string' && options.result.trim().length > 0
        ? options.result
        : latestRow?.result) || '待执行',
    verify:
      (typeof options.verify === 'string' && options.verify.trim().length > 0
        ? options.verify
        : latestRow?.verify) || '待验证',
    review_delta:
      (typeof options.reviewDelta === 'string' && options.reviewDelta.trim().length > 0
        ? options.reviewDelta
        : latestRow?.review_delta) || '待执行',
    recorded_at: taskCard.date,
  };
}

function shouldAppendCsvRow(taskCard, latestRow, options) {
  if (!latestRow) {
    return true;
  }

  if (!compareCanonicalRow(taskCard, latestRow)) {
    return true;
  }

  if (typeof options.result === 'string' && options.result.trim().length > 0) {
    return (latestRow.result ?? '').trim() !== options.result.trim();
  }

  if (typeof options.verify === 'string' && options.verify.trim().length > 0) {
    return (latestRow.verify ?? '').trim() !== options.verify.trim();
  }

  if (typeof options.reviewDelta === 'string' && options.reviewDelta.trim().length > 0) {
    return (latestRow.review_delta ?? '').trim() !== options.reviewDelta.trim();
  }

  return false;
}

function syncTaskLedger(options) {
  const tasksDirPath = resolveTasksDirectory(options);
  const checklistPath = resolve(tasksDirPath, 'checklist.md');
  const csvPath = resolve(tasksDirPath, 'tasks.csv');
  const taskCards = parseTaskCards(tasksDirPath);

  if (options.taskId && !taskCards.has(options.taskId)) {
    throw new Error(`Task card ${options.taskId} not found in ${tasksDirPath}.`);
  }

  const checklistState = parseChecklist(checklistPath);
  const tasksCsvState = {
    rows: readProjectedTaskRowsForSource({
      taskCsvPath: csvPath,
    }),
  };
  const latestRows = buildLatestCsvRowMap(tasksCsvState.rows);
  const targetTaskIds = options.taskId ? [options.taskId] : Array.from(taskCards.keys()).sort();

  const appendedRows = [];
  for (const taskId of targetTaskIds) {
    const taskCard = taskCards.get(taskId);
    if (!taskCard) {
      continue;
    }

    const latestRow = latestRows.get(taskId);
    if (!shouldAppendCsvRow(taskCard, latestRow, options)) {
      continue;
    }

    const nextRow = buildCsvRow(taskCard, latestRow, options);
    tasksCsvState.rows.push({
      ...nextRow,
      __rowNumber: tasksCsvState.rows.length + 2,
    });
    appendedRows.push(nextRow);
  }

  const renderedChecklist = renderChecklist(taskCards, checklistState, options);

  writeFileSync(checklistPath, renderedChecklist, 'utf8');
  replaceTaskLedgerCanonicalRowsForSource({
    taskCsvPath: csvPath,
    rows: tasksCsvState.rows,
    writeRenderedView: true,
  });

  return {
    tasksDirPath,
    checklistPath,
    csvPath,
    appendedRowCount: appendedRows.length,
    appendedTaskIds: appendedRows.map((row) => row.task_id),
  };
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const syncResult = syncTaskLedger(options);
  process.stdout.write(`${JSON.stringify(syncResult, null, 2)}\n`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${errorMessage}\n`);
  process.exit(1);
}
