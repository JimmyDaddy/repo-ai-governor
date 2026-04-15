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
      '  --sprint <sprint-xxx-meaningful-name>',
      '  --sprint-goal <text>',
      '',
      'Optional options:',
      '  --workspace-root <path>      Workspace root (default: .repo-ai-governor)',
      '  --stage-mapping <text>       Project stage mapping',
      '  --phase-mapping <text>       Project phase mapping',
      '  --project-goal <text>        Repeatable project-level goals',
      '  --sprint-scope <text>        Repeatable sprint scope lines',
      '  --exit-criterion <text>      Repeatable sprint exit criteria',
      '  --sprint-note <text>         Repeatable sprint notes',
      '  --upstream <path-or-note>    Repeatable upstream inputs',
      '  --task "<title>|<priority>|<goal>|<depends_on>|<deliverable_type>"',
      '                              Repeatable TK seed item',
      '  --cr "<title>|<priority>|<goal>|<depends_on>|<deliverable_type>"',
      '                              Repeatable CR seed item',
      '  --task-input "<task-title-or-slug>|<required|traceback>|<value>"',
      '                              Repeatable task-card input assignment',
      '  --owner <name>               Default: AI-Agent',
      '  --date <YYYY-MM-DD>          Default: today',
      '  --project-status <status>    planned|active|completed',
      '  --sprint-status <status>     planned|active|completed',
    ].join('\n'),
  );
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

function parseWorkItemSpec(rawValue, kind) {
  const parts = String(rawValue ?? '')
    .split('|')
    .map((part) => part.trim());
  const title = parts[0] ?? '';
  const priority = normalizePriority(parts[1] || 'P1');
  const goal = parts[2] ?? '';
  const dependsOn = parts[3] ?? '';
  const deliverableType = parts[4] || (kind === 'CR' ? 'review' : 'implementation');

  if (!title) {
    throw new Error(`Missing title in ${kind} item: ${rawValue}`);
  }

  if (!goal) {
    throw new Error(`Missing goal in ${kind} item: ${rawValue}`);
  }

  return {
    kind,
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

function parseTaskInputSpec(rawValue) {
  const parts = String(rawValue ?? '')
    .split('|')
    .map((part) => part.trim());
  const selector = parts[0] ?? '';
  const inputType = (parts[1] ?? '').toLowerCase();
  const value = parts.slice(2).join('|').trim();

  if (!selector) {
    throw new Error(`Missing task selector in --task-input: ${rawValue}`);
  }

  if (inputType !== 'required' && inputType !== 'traceback') {
    throw new Error(
      `Invalid task-input type "${parts[1] ?? ''}" in --task-input: ${rawValue}. Expected required or traceback.`,
    );
  }

  if (!value) {
    throw new Error(`Missing task-input value in --task-input: ${rawValue}`);
  }

  return {
    selector,
    inputType,
    value,
  };
}

function buildSeedItems(options) {
  const tkItems = options.tasks.map((rawTask) => parseWorkItemSpec(rawTask, 'TK'));
  const crItems = options.crs.map((rawTask) => parseWorkItemSpec(rawTask, 'CR'));

  if (tkItems.length === 0) {
    tkItems.push(
      parseWorkItemSpec(
        'bootstrap execution scaffold|P1|创建标准 project/sprint/task 骨架并写入初始 plan/task ledger seed',
        'TK',
      ),
    );
  }

  return {
    tkItems,
    crItems,
  };
}

function applyTaskInputAssignments(items, rawAssignments) {
  const assignments = rawAssignments.map((rawAssignment) => parseTaskInputSpec(rawAssignment));

  return items.map((item) => {
    const itemSlug = slugify(item.title);
    const matchingAssignments = assignments.filter(
      (assignment) => assignment.selector === item.title || assignment.selector === itemSlug,
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
  sprint,
  stageMapping,
  phaseMapping,
  upstream,
  projectGoals,
  sprintGoal,
  sprintStatus,
  taskPackage,
  wbsRows,
  date,
  projectStatus,
}) {
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
      `围绕 ${sprint} 完成标准化 project/sprint/task 拆解与执行面落盘。`,
    ),
    '',
    '## 2. Sprint 细化',
    '',
    `## 2.1 ${sprint}`,
    '',
    `- Status: ${sprintStatus}`,
    `- Sprint Goal: ${sprintGoal}`,
    `- Task Package: ${taskPackage}`,
    '',
    '## 3. 任务拆解矩阵（WBS）',
    '',
    '| task_id | sprint | title | 目标产出类型 | depends_on | status |',
    '| --- | --- | --- | --- | --- | --- |',
    ...wbsRows.map(
      (row) =>
        `| ${row.taskId} | ${sprint} | ${row.title} | ${row.deliverableType} | ${row.dependsOn} | ${row.initialStatus} |`,
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
        'project/sprint plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。',
        '任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。',
        '在正式激活前已有明确的 task-ledger canonicalization 路径。',
      ],
      '待补充',
    ),
    '',
    '## 6. 里程碑记录',
    '',
    `1. ${date}：创建 ${project} / ${sprint} 标准执行流骨架。`,
    '',
    '## 7. 里程碑记录入口',
    '',
    '1. 待 closeout 后补齐 completion audit summary。',
    '',
  ].join('\n');
}

function renderSprintPlan({
  sprint,
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
    `# ${sprint} 计划`,
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

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const project = normalizeProjectId(options.project);
  const sprint = normalizeSprintId(options.sprint);
  const date = normalizeDate(options.date);
  const projectStatus = normalizeStatus(
    options.projectStatus,
    PROJECT_STATUS_PATTERN,
    'project status',
  );
  const sprintStatus = normalizeStatus(
    options.sprintStatus,
    SPRINT_STATUS_PATTERN,
    'sprint status',
  );

  if (!options.sprintGoal) {
    throw new Error('Missing required option: --sprint-goal');
  }

  const workspaceRootPath = resolve(process.cwd(), options.workspaceRoot);
  const projectDirPath = resolve(workspaceRootPath, 'context', 'dev', project);
  const sprintDirPath = resolve(projectDirPath, sprint);
  const tasksDirPath = resolve(sprintDirPath, 'tasks');
  const reviewDirPath = resolve(sprintDirPath, 'review');
  const projectPlanPath = resolve(projectDirPath, 'plan.md');
  const sprintPlanPath = resolve(sprintDirPath, 'plan.md');

  if (existsSync(projectDirPath) || existsSync(sprintDirPath)) {
    throw new Error(`Project or sprint path already exists: ${projectDirPath} / ${sprintDirPath}`);
  }

  mkdirSync(tasksDirPath, { recursive: true });
  mkdirSync(reviewDirPath, { recursive: true });

  const seedItems = buildSeedItems(options);
  const tkIds = reserveTaskIds({
    workspaceRoot: options.workspaceRoot,
    tasksDir: tasksDirPath,
    type: 'TK',
    count: seedItems.tkItems.length,
  });
  const crIds = reserveTaskIds({
    workspaceRoot: options.workspaceRoot,
    tasksDir: tasksDirPath,
    type: 'CR',
    count: seedItems.crItems.length,
  });

  const tkItems = finalizeDependencies(
    applyTaskInputAssignments(
      seedItems.tkItems.map((item, index) => ({
        ...item,
        taskId: tkIds[index],
      })),
      options.taskInputs,
    ),
    (index, items) => (index === 0 ? ['scaffold baseline'] : [items[index - 1].taskId]),
  );
  const crItems = finalizeDependencies(
    applyTaskInputAssignments(
      seedItems.crItems.map((item, index) => ({
        ...item,
        taskId: crIds[index],
      })),
      options.taskInputs,
    ),
    () => (tkItems.length > 0 ? tkItems.map((item) => item.taskId) : ['sprint execution surface']),
  );
  const allSeedItems = [...tkItems, ...crItems];

  const projectGoals =
    options.projectGoals.length > 0
      ? options.projectGoals
      : [
          `围绕 ${project} 建立标准化 execution surface。`,
          `完成 ${sprint} 的 project/sprint/task 拆解与模板落盘。`,
        ];
  const sprintScopes =
    options.sprintScopes.length > 0 ? options.sprintScopes : allSeedItems.map((item) => item.goal);
  const exitCriteria =
    options.exitCriteria.length > 0
      ? options.exitCriteria
      : [
          'project/sprint plan 已按标准模板落盘。',
          'canonical TK/CR task cards、checklist、tasks.csv 与 review scaffold 已创建。',
          '正式执行前的 task-ledger canonicalization 命令已明确。',
        ];
  const sprintNotes =
    options.sprintNotes.length > 0
      ? options.sprintNotes
      : [
          'bootstrap 阶段不预生成 code_review 生命周期文件。',
          '若用户只要求拆解，不自动修改 current-context.md。',
        ];

  writeFileSync(
    projectPlanPath,
    renderProjectPlan({
      project,
      sprint,
      stageMapping: options.stageMapping,
      phaseMapping: options.phaseMapping,
      upstream: options.upstream,
      projectGoals,
      sprintGoal: options.sprintGoal,
      sprintStatus,
      taskPackage: allSeedItems.map((item) => item.taskId).join('、'),
      wbsRows: allSeedItems,
      date,
      projectStatus,
    }),
    'utf8',
  );
  writeFileSync(
    sprintPlanPath,
    renderSprintPlan({
      sprint,
      project,
      upstream: options.upstream,
      sprintGoal: options.sprintGoal,
      sprintScopes,
      wbsRows: allSeedItems,
      exitCriteria,
      sprintNotes,
      date,
      sprintStatus,
    }),
    'utf8',
  );

  for (const item of allSeedItems) {
    const filePath = resolve(tasksDirPath, `${item.taskId}-${slugify(item.title)}.md`);
    writeFileSync(
      filePath,
      renderTaskCard({
        item,
        taskId: item.taskId,
        project,
        sprint,
        owner: options.owner,
        date,
        projectPlanPath,
        sprintPlanPath,
        tasksDirPath,
      }),
      'utf8',
    );
  }

  writeFileSync(resolve(tasksDirPath, 'checklist.md'), renderChecklist(allSeedItems, date), 'utf8');
  writeFileSync(
    resolve(tasksDirPath, 'tasks.csv'),
    renderTasksCsv(allSeedItems, project, sprint, options.owner, date),
    'utf8',
  );
  writeFileSync(resolve(reviewDirPath, '.gitkeep'), '', 'utf8');

  const suggestedNextSteps = [
    `node ./scripts/governance/sync-task-ledger.js --tasks-dir "${tasksDirPath}"`,
    `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "${tasksDirPath}" --task-id ${allSeedItems.map((item) => item.taskId).join(' --task-id ')}`,
    'node ./scripts/governance/check-task-ledger-sync.js',
    'node ./scripts/governance/check-sprint-plan-status-sync.js',
  ];
  if (crItems.length > 0) {
    suggestedNextSteps.push('node ./scripts/governance/check-code-review-status-sync.js');
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        projectDirPath,
        sprintDirPath,
        tasksDirPath,
        reviewDirPath,
        projectPlanPath,
        sprintPlanPath,
        taskIds: allSeedItems.map((item) => item.taskId),
        suggestedNextSteps,
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
