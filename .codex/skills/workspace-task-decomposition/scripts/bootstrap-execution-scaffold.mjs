#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_WORKSPACE_ROOT = '.repo-ai-governor';
const DEFAULT_OWNER = 'AI-Agent';
const DEFAULT_DATE = new Date().toISOString().slice(0, 10);
const PROJECT_ID_PATTERN = /^project-\d{3,}(?:-[a-z0-9-]+)?$/u;
const SPRINT_ID_PATTERN = /^sprint-\d{3,}(?:-[a-z0-9-]+)?$/u;
const PRIORITY_PATTERN = /^P[0-3]$/u;
const PROJECT_STATUS_PATTERN = /^(planned|active|completed)$/u;
const SPRINT_STATUS_PATTERN = /^(planned|active|completed)$/u;

function parseArgs(argv) {
  const options = {
    workspaceRoot: DEFAULT_WORKSPACE_ROOT,
    project: null,
    sprint: null,
    stageMapping: '待补充',
    phaseMapping: '待补充',
    projectGoals: [],
    sprintGoal: null,
    sprintSpecs: [],
    sprintScopes: [],
    exitCriteria: [],
    sprintNotes: [],
    upstream: [],
    tasks: [],
    crs: [],
    taskInputs: [],
    owner: DEFAULT_OWNER,
    date: DEFAULT_DATE,
    projectStatus: 'planned',
    sprintStatus: 'planned',
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
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
      case '--workspace-root':
        options.workspaceRoot = nextValue;
        break;
      case '--project':
        options.project = nextValue;
        break;
      case '--sprint':
        options.sprint = nextValue;
        break;
      case '--stage-mapping':
        options.stageMapping = nextValue;
        break;
      case '--phase-mapping':
        options.phaseMapping = nextValue;
        break;
      case '--project-goal':
        options.projectGoals.push(nextValue);
        break;
      case '--sprint-goal':
        options.sprintGoal = nextValue;
        break;
      case '--sprint-spec':
        options.sprintSpecs.push(nextValue);
        break;
      case '--sprint-scope':
        options.sprintScopes.push(nextValue);
        break;
      case '--exit-criterion':
        options.exitCriteria.push(nextValue);
        break;
      case '--sprint-note':
        options.sprintNotes.push(nextValue);
        break;
      case '--upstream':
        options.upstream.push(nextValue);
        break;
      case '--task':
        options.tasks.push(nextValue);
        break;
      case '--cr':
        options.crs.push(nextValue);
        break;
      case '--task-input':
        options.taskInputs.push(nextValue);
        break;
      case '--owner':
        options.owner = nextValue;
        break;
      case '--date':
        options.date = nextValue;
        break;
      case '--project-status':
        options.projectStatus = nextValue;
        break;
      case '--sprint-status':
        options.sprintStatus = nextValue;
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
      'Usage: node ./.codex/skills/workspace-task-decomposition/scripts/bootstrap-execution-scaffold.mjs [options]',
      '',
      'Required options:',
      '  --project <project-xxx-meaningful-name>',
      '  Either:',
      '    --sprint <sprint-xxx-meaningful-name> --sprint-goal <text>',
      '  Or one or more:',
      '    --sprint-spec "<sprint-xxx>|<sprint-goal>|<planned|active|completed>"',
      '',
      'Optional options:',
      '  --workspace-root <path>      Workspace root (default: .repo-ai-governor)',
      '  --stage-mapping <text>       Project stage mapping',
      '  --phase-mapping <text>       Project phase mapping',
      '  --project-goal <text>        Repeatable project-level goals',
      '  --sprint-scope "<sprint-id>|<text>"',
      '                              Repeatable sprint scope lines; single-sprint "<text>" still works',
      '  --exit-criterion "<sprint-id>|<text>"',
      '                              Repeatable sprint exit criteria; single-sprint "<text>" still works',
      '  --sprint-note "<sprint-id>|<text>"',
      '                              Repeatable sprint notes; single-sprint "<text>" still works',
      '  --upstream <path-or-note>    Repeatable upstream inputs',
      '  --task "<sprint-id>|<title>|<priority>|<goal>|<depends_on>|<deliverable_type>"',
      '                              Repeatable TK seed item; single-sprint legacy form still works',
      '  --cr "<sprint-id>|<title>|<priority>|<goal>|<depends_on>|<deliverable_type>"',
      '                              Repeatable CR seed item; single-sprint legacy form still works',
      '  --task-input "<sprint-id>|<task-title-or-slug>|<required|traceback>|<value>"',
      '                              Repeatable task-card input assignment; single-sprint legacy form still works',
      '  --owner <name>               Default: AI-Agent',
      '  --date <YYYY-MM-DD>          Default: today',
      '  --project-status <status>    planned|active|completed',
      '  --sprint-status <status>     planned|active|completed',
    ].join('\n'),
  );
}

function splitSpecParts(rawValue) {
  return String(rawValue ?? '')
    .split('|')
    .map((part) => part.trim());
}

function normalizeDate(value) {
  const normalizedValue = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(normalizedValue)) {
    throw new Error(`Invalid date: ${value}`);
  }

  return normalizedValue;
}

function normalizeProjectId(value) {
  const normalizedValue = String(value ?? '').trim();
  if (!PROJECT_ID_PATTERN.test(normalizedValue)) {
    throw new Error(`Invalid project id: ${value}. Expected format project-xxx-meaningful-name.`);
  }

  return normalizedValue;
}

function normalizeSprintId(value) {
  const normalizedValue = String(value ?? '').trim();
  if (!SPRINT_ID_PATTERN.test(normalizedValue)) {
    throw new Error(`Invalid sprint id: ${value}. Expected format sprint-xxx-meaningful-name.`);
  }

  return normalizedValue;
}

function normalizeStatus(value, pattern, label) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!pattern.test(normalizedValue)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return normalizedValue;
}

function normalizePriority(value) {
  const normalizedValue = String(value ?? 'P1')
    .trim()
    .toUpperCase();
  if (!PRIORITY_PATTERN.test(normalizedValue)) {
    throw new Error(`Invalid priority: ${value}`);
  }

  return normalizedValue;
}

function parseSprintSpec(rawValue, defaultSprintStatus) {
  const parts = splitSpecParts(rawValue);
  const sprintId = normalizeSprintId(parts[0] ?? '');
  const sprintGoal = parts[1] ?? '';
  const sprintStatus = parts[2]
    ? normalizeStatus(parts[2], SPRINT_STATUS_PATTERN, 'sprint status')
    : defaultSprintStatus;

  if (!sprintGoal) {
    throw new Error(`Missing sprint goal in --sprint-spec: ${rawValue}`);
  }

  return {
    sprintId,
    sprintGoal,
    sprintStatus,
  };
}

function resolveSprintDefinitions(options) {
  const defaultSprintStatus = normalizeStatus(
    options.sprintStatus,
    SPRINT_STATUS_PATTERN,
    'sprint status',
  );

  if (options.sprintSpecs.length > 0) {
    if (options.sprint || options.sprintGoal) {
      throw new Error('Do not mix --sprint-spec with legacy --sprint/--sprint-goal options.');
    }

    const seenSprintIds = new Set();
    return options.sprintSpecs.map((rawSprintSpec) => {
      const sprintSpec = parseSprintSpec(rawSprintSpec, defaultSprintStatus);
      if (seenSprintIds.has(sprintSpec.sprintId)) {
        throw new Error(`Duplicate sprint id in --sprint-spec: ${sprintSpec.sprintId}`);
      }

      seenSprintIds.add(sprintSpec.sprintId);
      return sprintSpec;
    });
  }

  const sprintId = normalizeSprintId(options.sprint);
  if (!options.sprintGoal) {
    throw new Error('Missing required option: --sprint-goal');
  }

  return [
    {
      sprintId,
      sprintGoal: String(options.sprintGoal).trim(),
      sprintStatus: defaultSprintStatus,
    },
  ];
}

function parseWorkItemSpec(rawValue, kind, sprintIds, defaultSprintId) {
  const parts = splitSpecParts(rawValue);
  let sprintId = defaultSprintId;
  let offset = 0;

  if (parts.length >= 2 && sprintIds.has(parts[0])) {
    sprintId = parts[0];
    offset = 1;
  } else if (sprintIds.size > 1) {
    throw new Error(
      `Missing sprint selector in ${kind} item: ${rawValue}. Multi-sprint mode requires "<sprint-id>|<title>|<priority>|<goal>|...".`,
    );
  }

  const title = parts[offset] ?? '';
  const priority = normalizePriority(parts[offset + 1] || 'P1');
  const goal = parts[offset + 2] ?? '';
  const dependsOn = parts[offset + 3] ?? '';
  const deliverableType = parts[offset + 4] || (kind === 'CR' ? 'review' : 'implementation');

  if (!title) {
    throw new Error(`Missing title in ${kind} item: ${rawValue}`);
  }

  if (!goal) {
    throw new Error(`Missing goal in ${kind} item: ${rawValue}`);
  }

  return {
    kind,
    sprintId,
    title,
    priority,
    goal,
    dependsOn,
    deliverableType,
    initialStatus: kind === 'CR' ? 'review_pending' : 'planned',
    requiredInputs: [],
    tracebackReferences: [],
  };
}

function slugify(value) {
  const slug = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .replace(/-{2,}/gu, '-');

  return slug || 'task';
}

function renderMetadataList(label, items) {
  if (items.length === 0) {
    return `- ${label}: \`none\``;
  }

  return [`- ${label}:`, ...items.map((item) => `  - \`${item}\``)].join('\n');
}

function renderOrderedList(items, fallbackText) {
  const targetItems = items.length > 0 ? items : [fallbackText];
  return targetItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function csvEscape(value) {
  const serializedValue = String(value ?? '');
  if (!/[,"\n]/u.test(serializedValue)) {
    return serializedValue;
  }

  return `"${serializedValue.replace(/"/gu, '""')}"`;
}

function reserveTaskIds({ workspaceRoot, tasksDir, type, count }) {
  if (count === 0) {
    return [];
  }

  const commandOutput = execFileSync(
    'node',
    [
      resolve(process.cwd(), 'scripts', 'governance', 'reserve-task-id.js'),
      '--workspace-root',
      workspaceRoot,
      '--tasks-dir',
      tasksDir,
      '--type',
      type,
      '--count',
      String(count),
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );
  const parsedOutput = JSON.parse(commandOutput);
  return parsedOutput.reservedIds ?? [];
}

function parseTaskInputSpec(rawValue, sprintIds, defaultSprintId) {
  const parts = splitSpecParts(rawValue);
  let sprintId = defaultSprintId;
  let offset = 0;

  if (parts.length >= 4 && sprintIds.has(parts[0])) {
    sprintId = parts[0];
    offset = 1;
  } else if (sprintIds.size > 1) {
    throw new Error(
      `Missing sprint selector in --task-input: ${rawValue}. Multi-sprint mode requires "<sprint-id>|<task-title-or-slug>|<required|traceback>|<value>".`,
    );
  }

  const selector = parts[offset] ?? '';
  const inputType = (parts[offset + 1] ?? '').toLowerCase();
  const value = parts
    .slice(offset + 2)
    .join('|')
    .trim();

  if (!selector) {
    throw new Error(`Missing task selector in --task-input: ${rawValue}`);
  }

  if (inputType !== 'required' && inputType !== 'traceback') {
    throw new Error(
      `Invalid task-input type "${parts[offset + 1] ?? ''}" in --task-input: ${rawValue}. Expected required or traceback.`,
    );
  }

  if (!value) {
    throw new Error(`Missing task-input value in --task-input: ${rawValue}`);
  }

  return {
    sprintId,
    selector,
    inputType,
    value,
  };
}

function createDefaultTkItem(sprintDefinition, sprintIndex) {
  return {
    kind: 'TK',
    sprintId: sprintDefinition.sprintId,
    title: `bootstrap ${sprintDefinition.sprintId} scaffold`,
    priority: 'P1',
    goal:
      sprintIndex === 0
        ? '创建标准 project/sprint/task 骨架并写入初始 plan/task ledger seed'
        : `为 ${sprintDefinition.sprintId} 创建标准 sprint 执行骨架，便于后续按计划直接进入实施`,
    dependsOn: '',
    deliverableType: 'implementation',
    initialStatus: 'planned',
    requiredInputs: [],
    tracebackReferences: [],
  };
}

function buildSeedItems(options, sprintDefinitions) {
  const defaultSprintId = sprintDefinitions[0]?.sprintId ?? null;
  const sprintIds = new Set(sprintDefinitions.map((sprintDefinition) => sprintDefinition.sprintId));
  const tkItems = options.tasks.map((rawTask) =>
    parseWorkItemSpec(rawTask, 'TK', sprintIds, defaultSprintId),
  );
  const crItems = options.crs.map((rawTask) =>
    parseWorkItemSpec(rawTask, 'CR', sprintIds, defaultSprintId),
  );

  for (const [sprintIndex, sprintDefinition] of sprintDefinitions.entries()) {
    const hasTkItem = tkItems.some((item) => item.sprintId === sprintDefinition.sprintId);
    if (!hasTkItem) {
      tkItems.push(createDefaultTkItem(sprintDefinition, sprintIndex));
    }
  }

  return {
    tkItems,
    crItems,
  };
}

function applyTaskInputAssignments(items, assignments) {
  if (assignments.length === 0) {
    return items;
  }

  return items.map((item) => {
    const itemSlug = slugify(item.title);
    const matchingAssignments = assignments.filter(
      (assignment) =>
        assignment.sprintId === item.sprintId &&
        (assignment.selector === item.title || assignment.selector === itemSlug),
    );

    if (matchingAssignments.length === 0) {
      return item;
    }

    const requiredInputs = [];
    const tracebackReferences = [];
    for (const assignment of matchingAssignments) {
      if (assignment.inputType === 'required') {
        requiredInputs.push(assignment.value);
      } else {
        tracebackReferences.push(assignment.value);
      }
    }

    return {
      ...item,
      requiredInputs,
      tracebackReferences,
    };
  });
}

function finalizeDependencies(items, fallbackFactory) {
  return items.map((item, index) => {
    if (item.dependsOn) {
      return item;
    }

    const fallbackDependencies = fallbackFactory(index, items);
    return {
      ...item,
      dependsOn: fallbackDependencies.join('; '),
    };
  });
}

function parseScopedTextSpec(rawValue, sprintIds, label) {
  const parts = splitSpecParts(rawValue);
  if (parts.length >= 2 && sprintIds.has(parts[0])) {
    const text = parts.slice(1).join('|').trim();
    if (!text) {
      throw new Error(`Missing scoped text in ${label}: ${rawValue}`);
    }

    return {
      sprintId: parts[0],
      text,
    };
  }

  const text = String(rawValue ?? '').trim();
  if (!text) {
    throw new Error(`Missing text in ${label}: ${rawValue}`);
  }

  return {
    sprintId: null,
    text,
  };
}

function resolveScopedTexts(rawValues, sprintDefinitions, label) {
  const sprintIds = new Set(sprintDefinitions.map((sprintDefinition) => sprintDefinition.sprintId));
  return rawValues.map((rawValue) => parseScopedTextSpec(rawValue, sprintIds, label));
}

function selectScopedTexts(scopedTexts, sprintId) {
  const globalTexts = [];
  const targetedTexts = [];

  for (const scopedText of scopedTexts) {
    if (scopedText.sprintId === null) {
      globalTexts.push(scopedText.text);
      continue;
    }

    if (scopedText.sprintId === sprintId) {
      targetedTexts.push(scopedText.text);
    }
  }

  return [...globalTexts, ...targetedTexts];
}

function describeSprintSequence(sprintDefinitions) {
  return sprintDefinitions.map((sprintDefinition) => sprintDefinition.sprintId).join('、');
}

function renderTaskCard({
  item,
  taskId,
  project,
  sprint,
  owner,
  date,
  projectPlanPath,
  sprintPlanPath,
  tasksDirPath,
}) {
  const dependencies = item.dependsOn
    .split(';')
    .map((dependency) => dependency.trim())
    .filter((dependency) => dependency.length > 0);
  const requiredInputs = Array.from(
    new Set([
      ...item.requiredInputs,
      '.repo-ai-governor/context/current-context.md',
      sprintPlanPath,
    ]),
  );
  const tracebackReferences = Array.from(
    new Set([
      ...item.tracebackReferences,
      projectPlanPath,
      '.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md',
    ]),
  );
  const developmentVerification =
    item.kind === 'CR'
      ? [
          '待执行：按本轮 review boundary 补充定向验证命令。',
          'node ./scripts/governance/check-code-review-status-sync.js',
        ]
      : [
          '待执行：按任务范围补充 fast/targeted verification。',
          `node ./scripts/governance/sync-task-ledger.js --tasks-dir "${tasksDirPath}" --task-id ${taskId}`,
        ];
  const deliveryVerification = [
    `node ./scripts/governance/sync-task-ledger.js --tasks-dir "${tasksDirPath}" --task-id ${taskId}`,
    `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "${tasksDirPath}" --task-id ${taskId}`,
    'node ./scripts/governance/check-task-ledger-sync.js',
    'node ./scripts/governance/check-sprint-plan-status-sync.js',
  ];
  if (item.kind === 'CR') {
    deliveryVerification.push('node ./scripts/governance/check-code-review-status-sync.js');
  }
  const initialRecord =
    item.kind === 'CR'
      ? `${date}：任务创建，状态初始化为 \`review_pending\`。`
      : `${date}：任务创建，状态初始化为 \`planned\`。`;

  return [
    `# ${taskId} ${item.title}`,
    '',
    `- Status: ${item.initialStatus}`,
    `- Date: ${date}`,
    `- Owner: ${owner}`,
    `- Priority: ${item.priority}`,
    `- Project: \`${project}\``,
    `- Sprint: \`${sprint}\``,
    '',
    '## 1. 任务目标',
    '',
    item.goal,
    '',
    '## 2. Depends On',
    '',
    renderOrderedList(dependencies, 'scaffold baseline'),
    '',
    '## 3. 预期产物',
    '',
    renderOrderedList(
      [
        `${item.deliverableType} artifact for ${taskId}`,
        `task card update for ${taskId}`,
        'aligned checklist/tasks.csv ledger views',
      ],
      '待补充',
    ),
    '',
    '## 4. Required Inputs',
    '',
    renderOrderedList(requiredInputs, '待补充'),
    '',
    '## 5. Traceback References',
    '',
    renderOrderedList(tracebackReferences, '不适用'),
    '',
    '## 6. 实施计划',
    '',
    renderOrderedList(
      [
        '确认本任务边界、依赖与预期产物。',
        '按标准模板推进实现或治理动作。',
        '完成 ledger sync 与必要验证后更新产出。',
      ],
      '待补充',
    ),
    '',
    '## 7. Development Verification',
    '',
    renderOrderedList(developmentVerification, '待补充'),
    '',
    '## 8. Delivery Verification',
    '',
    renderOrderedList(deliveryVerification, '待补充'),
    '',
    '## 9. 执行记录',
    '',
    `1. ${initialRecord}`,
    '',
    '## 10. 产出',
    '',
    '1. 待执行后补齐',
    '2. 待执行后补齐',
    '',
  ].join('\n');
}

function renderChecklist(seedItems, date) {
  const lines = ['# checklist', ''];

  for (const item of seedItems) {
    const checked = item.initialStatus === 'completed' || item.initialStatus === 'resolved';
    lines.push(`- [${checked ? 'x' : ' '}] ${item.taskId} ${item.title}`);
    const initialStatusLabel =
      item.kind === 'CR'
        ? '`review_pending`'
        : item.initialStatus === 'planned'
          ? '`planned`'
          : `\`${item.initialStatus}\``;
    lines.push(`  - ${date}：任务创建，状态初始化为 ${initialStatusLabel}。`);
  }

  lines.push('');
  return lines.join('\n');
}

function renderTasksCsv(seedItems, project, sprint, owner, date) {
  const headers = [
    'execution_id',
    'task_id',
    'title',
    'owner',
    'priority',
    'due_date',
    'status',
    'project',
    'sprint',
    'plan',
    'result',
    'verify',
    'review_delta',
    'recorded_at',
  ];
  const rows = [headers.join(',')];

  for (const item of seedItems) {
    rows.push(
      [
        `seed-${date.replace(/-/gu, '')}-${item.taskId.toLowerCase()}`,
        item.taskId,
        item.title,
        owner,
        item.priority,
        date,
        item.initialStatus,
        project,
        sprint,
        item.goal,
        '待执行',
        '待验证',
        item.kind === 'CR' ? '待 review' : '待执行',
        date,
      ]
        .map(csvEscape)
        .join(','),
    );
  }

  rows.push('');
  return rows.join('\n');
}

function renderProjectPlan({
  project,
  stageMapping,
  phaseMapping,
  upstream,
  projectGoals,
  sprintDefinitions,
  wbsRows,
  date,
  projectStatus,
}) {
  const sprintSections = sprintDefinitions.flatMap((sprintDefinition, index) => [
    `## 2.${index + 1} ${sprintDefinition.sprintId}`,
    '',
    `- Status: ${sprintDefinition.sprintStatus}`,
    `- Sprint Goal: ${sprintDefinition.sprintGoal}`,
    `- Task Package: ${sprintDefinition.taskPackage}`,
    '',
  ]);

  return [
    `# ${project} 计划`,
    '',
    `- Status: ${projectStatus}`,
    `- Date: ${date}`,
    `- Stage Mapping: ${stageMapping}`,
    `- Phase Mapping: ${phaseMapping}`,
    renderMetadataList('Upstream', upstream),
    '',
    '## 1. 目标',
    '',
    renderOrderedList(
      projectGoals,
      `围绕 ${describeSprintSequence(sprintDefinitions)} 完成标准化 project/sprint/task 拆解与执行面落盘。`,
    ),
    '',
    '## 2. Sprint 细化',
    '',
    ...sprintSections,
    '## 3. 任务拆解矩阵（WBS）',
    '',
    '| task_id | sprint | title | 目标产出类型 | depends_on | status |',
    '| --- | --- | --- | --- | --- | --- |',
    ...wbsRows.map(
      (row) =>
        `| ${row.taskId} | ${row.sprintId} | ${row.title} | ${row.deliverableType} | ${row.dependsOn} | ${row.initialStatus} |`,
    ),
    '',
    '## 4. 依赖产物策略',
    '',
    renderOrderedList(
      [
        'task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。',
        'review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。',
        'closeout / completion audit summary 只在终态窗口创建并回链。',
      ],
      '待补充',
    ),
    '',
    `## 5. DoD（${project}）`,
    '',
    renderOrderedList(
      [
        `${sprintDefinitions.length} 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。`,
        '任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。',
        '在正式激活前已有明确的 task-ledger canonicalization 路径，且只需要按顺序激活执行面。',
      ],
      '待补充',
    ),
    '',
    '## 6. 里程碑记录',
    '',
    `1. ${date}：创建 ${project} 全量执行流骨架，覆盖 ${describeSprintSequence(sprintDefinitions)}。`,
    '',
    '## 7. 里程碑记录入口',
    '',
    '1. 待 closeout 后补齐 completion audit summary。',
    '',
  ].join('\n');
}

function renderSprintPlan({
  sprintId,
  project,
  upstream,
  sprintGoal,
  sprintScopes,
  wbsRows,
  exitCriteria,
  sprintNotes,
  date,
  sprintStatus,
}) {
  return [
    `# ${sprintId} 计划`,
    '',
    `- Status: ${sprintStatus}`,
    `- Date: ${date}`,
    `- Sprint Goal: ${sprintGoal}`,
    `- Project: \`${project}\``,
    renderMetadataList('Upstream', upstream),
    '',
    '## 1. Scope',
    '',
    renderOrderedList(sprintScopes, '完成本 sprint 的任务拆解、骨架落盘与后续执行前置准备。'),
    '',
    '## 2. 任务拆解矩阵（WBS）',
    '',
    '| task_id | title | depends_on | status |',
    '| --- | --- | --- | --- |',
    ...wbsRows.map(
      (row) => `| ${row.taskId} | ${row.title} | ${row.dependsOn} | ${row.initialStatus} |`,
    ),
    '',
    '## 3. Exit Criteria',
    '',
    renderOrderedList(
      exitCriteria,
      'project/sprint/task scaffold 已落盘，并且具备执行前的 ledger canonicalization 路径。',
    ),
    '',
    '## 4. Sprint Notes',
    '',
    renderOrderedList(
      sprintNotes,
      '在正式进入 active execution 前，执行 `node ./scripts/governance/sync-task-ledger.js --tasks-dir <...>` 完成 canonical sqlite 对齐。',
    ),
    '',
  ].join('\n');
}

function buildDefaultExitCriteria() {
  return [
    'project/sprint plan 已按标准模板落盘。',
    'canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。',
    '正式执行前的 task-ledger canonicalization 命令已明确。',
  ];
}

function buildDefaultSprintNotes(sprintRecords, sprintIndex) {
  return [
    'bootstrap 阶段不预生成 code_review 生命周期文件。',
    '若用户只要求拆解，不自动修改 current-context.md。',
    sprintIndex === 0
      ? '默认将该 sprint 作为首个 activation candidate，但只有在用户显式要求时才切为 active。'
      : `该 sprint 默认保持 planned，等待 ${sprintRecords[sprintIndex - 1].sprintId} handoff 或用户显式激活。`,
  ];
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const project = normalizeProjectId(options.project);
  const date = normalizeDate(options.date);
  const projectStatus = normalizeStatus(
    options.projectStatus,
    PROJECT_STATUS_PATTERN,
    'project status',
  );
  const sprintDefinitions = resolveSprintDefinitions(options);

  const workspaceRootPath = resolve(process.cwd(), options.workspaceRoot);
  const projectDirPath = resolve(workspaceRootPath, 'context', 'dev', project);
  const projectPlanPath = resolve(projectDirPath, 'plan.md');

  if (existsSync(projectDirPath)) {
    throw new Error(`Project path already exists: ${projectDirPath}`);
  }

  const sprintRecords = sprintDefinitions.map((sprintDefinition) => {
    const sprintDirPath = resolve(projectDirPath, sprintDefinition.sprintId);
    return {
      ...sprintDefinition,
      sprintDirPath,
      tasksDirPath: resolve(sprintDirPath, 'tasks'),
      reviewDirPath: resolve(sprintDirPath, 'review'),
      sprintPlanPath: resolve(sprintDirPath, 'plan.md'),
    };
  });

  for (const sprintRecord of sprintRecords) {
    if (existsSync(sprintRecord.sprintDirPath)) {
      throw new Error(`Sprint path already exists: ${sprintRecord.sprintDirPath}`);
    }
  }

  mkdirSync(projectDirPath, { recursive: true });
  for (const sprintRecord of sprintRecords) {
    mkdirSync(sprintRecord.tasksDirPath, { recursive: true });
    mkdirSync(sprintRecord.reviewDirPath, { recursive: true });
  }

  const seedItems = buildSeedItems(options, sprintDefinitions);
  const sprintIds = new Set(sprintDefinitions.map((sprintDefinition) => sprintDefinition.sprintId));
  const scopedSprintScopes = resolveScopedTexts(
    options.sprintScopes,
    sprintDefinitions,
    '--sprint-scope',
  );
  const scopedExitCriteria = resolveScopedTexts(
    options.exitCriteria,
    sprintDefinitions,
    '--exit-criterion',
  );
  const scopedSprintNotes = resolveScopedTexts(
    options.sprintNotes,
    sprintDefinitions,
    '--sprint-note',
  );
  const taskInputAssignments = options.taskInputs.map((rawAssignment) =>
    parseTaskInputSpec(rawAssignment, sprintIds, sprintDefinitions[0]?.sprintId ?? null),
  );

  const allSeedItems = [];

  for (const [sprintIndex, sprintRecord] of sprintRecords.entries()) {
    const rawTkItems = seedItems.tkItems.filter((item) => item.sprintId === sprintRecord.sprintId);
    const rawCrItems = seedItems.crItems.filter((item) => item.sprintId === sprintRecord.sprintId);
    const sprintTaskInputAssignments = taskInputAssignments.filter(
      (assignment) => assignment.sprintId === sprintRecord.sprintId,
    );

    const tkIds = reserveTaskIds({
      workspaceRoot: options.workspaceRoot,
      tasksDir: sprintRecord.tasksDirPath,
      type: 'TK',
      count: rawTkItems.length,
    });
    const crIds = reserveTaskIds({
      workspaceRoot: options.workspaceRoot,
      tasksDir: sprintRecord.tasksDirPath,
      type: 'CR',
      count: rawCrItems.length,
    });

    const tkItems = finalizeDependencies(
      applyTaskInputAssignments(
        rawTkItems.map((item, index) => ({
          ...item,
          taskId: tkIds[index],
        })),
        sprintTaskInputAssignments,
      ),
      (index, items) => {
        if (index > 0) {
          return [items[index - 1].taskId];
        }

        if (sprintIndex === 0) {
          return ['scaffold baseline'];
        }

        return [`${sprintRecords[sprintIndex - 1].sprintId} planned handoff`];
      },
    );
    const crItems = finalizeDependencies(
      applyTaskInputAssignments(
        rawCrItems.map((item, index) => ({
          ...item,
          taskId: crIds[index],
        })),
        sprintTaskInputAssignments,
      ),
      () =>
        tkItems.length > 0
          ? tkItems.map((item) => item.taskId)
          : [`${sprintRecord.sprintId} execution surface`],
    );
    const sprintSeedItems = [...tkItems, ...crItems];
    const scopedSprintScopeItems = selectScopedTexts(scopedSprintScopes, sprintRecord.sprintId);
    const scopedExitCriteriaItems = selectScopedTexts(scopedExitCriteria, sprintRecord.sprintId);
    const scopedSprintNoteItems = selectScopedTexts(scopedSprintNotes, sprintRecord.sprintId);

    sprintRecord.tkItems = tkItems;
    sprintRecord.crItems = crItems;
    sprintRecord.seedItems = sprintSeedItems;
    sprintRecord.taskPackage =
      sprintSeedItems.length > 0
        ? `\`${sprintSeedItems.map((item) => item.taskId).join('、')}\``
        : '`none`';
    sprintRecord.sprintScopes =
      scopedSprintScopeItems.length > 0
        ? scopedSprintScopeItems
        : sprintSeedItems.map((item) => item.goal);
    sprintRecord.exitCriteria =
      scopedExitCriteriaItems.length > 0 ? scopedExitCriteriaItems : buildDefaultExitCriteria();
    sprintRecord.sprintNotes =
      scopedSprintNoteItems.length > 0
        ? scopedSprintNoteItems
        : buildDefaultSprintNotes(sprintRecords, sprintIndex);

    allSeedItems.push(...sprintSeedItems);
  }

  const projectGoals =
    options.projectGoals.length > 0
      ? options.projectGoals
      : [
          `围绕 ${project} 建立标准化 execution surface。`,
          `完成 ${describeSprintSequence(sprintDefinitions)} 的 project/sprint/task 拆解与模板落盘。`,
        ];

  writeFileSync(
    projectPlanPath,
    renderProjectPlan({
      project,
      stageMapping: options.stageMapping,
      phaseMapping: options.phaseMapping,
      upstream: options.upstream,
      projectGoals,
      sprintDefinitions: sprintRecords,
      wbsRows: allSeedItems,
      date,
      projectStatus,
    }),
    'utf8',
  );

  for (const sprintRecord of sprintRecords) {
    writeFileSync(
      sprintRecord.sprintPlanPath,
      renderSprintPlan({
        sprintId: sprintRecord.sprintId,
        project,
        upstream: options.upstream,
        sprintGoal: sprintRecord.sprintGoal,
        sprintScopes: sprintRecord.sprintScopes,
        wbsRows: sprintRecord.seedItems,
        exitCriteria: sprintRecord.exitCriteria,
        sprintNotes: sprintRecord.sprintNotes,
        date,
        sprintStatus: sprintRecord.sprintStatus,
      }),
      'utf8',
    );

    for (const item of sprintRecord.seedItems) {
      const filePath = resolve(
        sprintRecord.tasksDirPath,
        `${item.taskId}-${slugify(item.title)}.md`,
      );
      writeFileSync(
        filePath,
        renderTaskCard({
          item,
          taskId: item.taskId,
          project,
          sprint: sprintRecord.sprintId,
          owner: options.owner,
          date,
          projectPlanPath,
          sprintPlanPath: sprintRecord.sprintPlanPath,
          tasksDirPath: sprintRecord.tasksDirPath,
        }),
        'utf8',
      );
    }

    writeFileSync(
      resolve(sprintRecord.tasksDirPath, 'checklist.md'),
      renderChecklist(sprintRecord.seedItems, date),
      'utf8',
    );
    writeFileSync(
      resolve(sprintRecord.tasksDirPath, 'tasks.csv'),
      renderTasksCsv(sprintRecord.seedItems, project, sprintRecord.sprintId, options.owner, date),
      'utf8',
    );
    writeFileSync(resolve(sprintRecord.reviewDirPath, '.gitkeep'), '', 'utf8');

    sprintRecord.suggestedNextSteps = [
      `node ./scripts/governance/sync-task-ledger.js --tasks-dir "${sprintRecord.tasksDirPath}"`,
      `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "${sprintRecord.tasksDirPath}" --task-id ${sprintRecord.seedItems.map((item) => item.taskId).join(' --task-id ')}`,
      'node ./scripts/governance/check-task-ledger-sync.js',
      'node ./scripts/governance/check-sprint-plan-status-sync.js',
    ];
    if (sprintRecord.crItems.length > 0) {
      sprintRecord.suggestedNextSteps.push(
        'node ./scripts/governance/check-code-review-status-sync.js',
      );
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        projectDirPath,
        projectPlanPath,
        sprintOutputs: sprintRecords.map((sprintRecord) => ({
          sprintId: sprintRecord.sprintId,
          sprintDirPath: sprintRecord.sprintDirPath,
          tasksDirPath: sprintRecord.tasksDirPath,
          reviewDirPath: sprintRecord.reviewDirPath,
          sprintPlanPath: sprintRecord.sprintPlanPath,
          taskIds: sprintRecord.seedItems.map((item) => item.taskId),
          suggestedNextSteps: sprintRecord.suggestedNextSteps,
        })),
        activationCandidate: sprintRecords[0]?.sprintId ?? null,
        plannedFollowUps: sprintRecords.slice(1).map((sprintRecord) => sprintRecord.sprintId),
      },
      null,
      2,
    )}\n`,
  );
}

try {
  main();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${errorMessage}\n`);
  process.exit(1);
}
