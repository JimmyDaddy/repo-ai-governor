import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { readProjectedTaskRowsForSource } from '../scripts/governance/task-ledger-projection.js';

const execFileAsync = promisify(execFile);
const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SYNC_TASK_LEDGER_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'sync-task-ledger.js',
);

describe('sync-task-ledger.js', () => {
  it('refreshes checklist execution notes from canonical task cards while preserving extra runtime notes', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'sync-task-ledger-'));
    const tasksDirPath = resolve(tempRoot, 'tasks');
    const taskCardPath = resolve(
      tasksDirPath,
      'TK-130-ledger-single-source-residual-closure-and-auto-sync-generator.md',
    );
    const checklistPath = resolve(tasksDirPath, 'checklist.md');
    const csvPath = resolve(tasksDirPath, 'tasks.csv');
    const sqlitePath = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'sqlite',
      'task-ledger.sqlite',
    );

    try {
      await mkdir(tasksDirPath, { recursive: true });
      await writeFile(
        taskCardPath,
        `# TK-130 \`TK\` 单写源残余收口与自动同步生成器

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: \`project-012-execution-context-optimization\`
- Sprint: \`sprint-002-ledger-review-gate-and-memory-follow-up\`

## 1. 任务目标

完成 ledger sync 收口。

## 9. 执行记录

1. 2026-03-24：新 canonical 摘要。
2. 2026-03-24：第二条 canonical 摘要。
`,
        'utf8',
      );
      await writeFile(
        checklistPath,
        `# checklist

- [x] TK-130 \`TK\` 单写源残余收口与自动同步生成器
  - 2026-03-24：旧 checklist 摘要。
  - 2026-03-24：运行时附加备注。
`,
        'utf8',
      );
      await writeFile(
        csvPath,
        'execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at\n',
        'utf8',
      );

      await execFileAsync(
        process.execPath,
        [SYNC_TASK_LEDGER_SCRIPT_PATH, '--tasks-dir', tasksDirPath],
        {
          cwd: tempRoot,
        },
      );

      await execFileAsync(
        process.execPath,
        [
          SYNC_TASK_LEDGER_SCRIPT_PATH,
          '--tasks-dir',
          tasksDirPath,
          '--task-id',
          'TK-130',
          '--checklist-note',
          '2026-03-24：运行时附加备注。',
        ],
        {
          cwd: tempRoot,
        },
      );

      const checklistContent = await readFile(checklistPath, 'utf8');
      const csvContent = await readFile(csvPath, 'utf8');
      expect(checklistContent).toContain('2026-03-24：新 canonical 摘要。');
      expect(checklistContent).toContain('2026-03-24：第二条 canonical 摘要。');
      expect(checklistContent).toContain('2026-03-24：运行时附加备注。');
      expect(checklistContent).not.toContain('2026-03-24：旧 checklist 摘要。');
      expect(csvContent).toContain('TK-130');
      await expect(access(sqlitePath)).resolves.toBeUndefined();
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('syncs CR task cards into checklist and tasks.csv using resolved as terminal status', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'sync-task-ledger-cr-'));
    const tasksDirPath = resolve(tempRoot, 'tasks');
    const taskCardPath = resolve(tasksDirPath, 'CR-130-ledger-review-lifecycle-governance.md');
    const checklistPath = resolve(tasksDirPath, 'checklist.md');
    const csvPath = resolve(tasksDirPath, 'tasks.csv');

    try {
      await mkdir(tasksDirPath, { recursive: true });
      await writeFile(
        taskCardPath,
        `# CR-130 台账评审生命周期治理

- Status: resolved
- Date: 2026-04-06
- Owner: AI-Agent
- Priority: P1
- Project: \`project-051-priority-roadmap-promotion-and-decomposition\`
- Sprint: \`sprint-001-promotion-and-followup-decomposition\`

## 1. 任务目标

让评审任务进入独立的 \`CR\` 编号空间并完成收口。

## 9. 执行记录

1. 2026-04-06：评审任务创建并完成收口。
`,
        'utf8',
      );
      await writeFile(checklistPath, '# checklist\n', 'utf8');
      await writeFile(
        csvPath,
        'execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at\n',
        'utf8',
      );

      await execFileAsync(
        process.execPath,
        [SYNC_TASK_LEDGER_SCRIPT_PATH, '--tasks-dir', tasksDirPath],
        {
          cwd: tempRoot,
        },
      );

      const checklistContent = await readFile(checklistPath, 'utf8');
      const csvContent = await readFile(csvPath, 'utf8');

      expect(checklistContent).toContain('- [x] CR-130 台账评审生命周期治理');
      expect(checklistContent).toContain('2026-04-06：评审任务创建并完成收口。');
      expect(csvContent).toContain('CR-130');
      expect(csvContent).toContain(',resolved,');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('appends new rows after the highest projected row number instead of reusing gaps', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'sync-task-ledger-gap-'));
    const tasksDirPath = resolve(tempRoot, 'tasks');
    const checklistPath = resolve(tasksDirPath, 'checklist.md');
    const csvPath = resolve(tasksDirPath, 'tasks.csv');
    const crOneTaskCardPath = resolve(tasksDirPath, 'CR-201-first-clean-review.md');
    const crTwoTaskCardPath = resolve(tasksDirPath, 'CR-202-second-clean-review.md');
    const sqlitePath = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'sqlite',
      'task-ledger.sqlite',
    );

    try {
      await mkdir(tasksDirPath, { recursive: true });
      await writeFile(
        crOneTaskCardPath,
        `# CR-201 first clean review

- Status: resolved
- Date: 2026-05-14
- Owner: AI-Agent
- Priority: P1
- Project: \`project-123-empty-repo-self-host-adoption-rollout\`
- Sprint: \`sprint-002-ownership-and-generated-artifact-policy\`

## 1. 任务目标

完成第 1 轮 delegated review 收口。

## 9. 执行记录

1. 2026-05-14：第 1 轮 CR 已 resolved。
`,
        'utf8',
      );
      await writeFile(
        crTwoTaskCardPath,
        `# CR-202 second clean review

- Status: resolved
- Date: 2026-05-14
- Owner: AI-Agent
- Priority: P1
- Project: \`project-123-empty-repo-self-host-adoption-rollout\`
- Sprint: \`sprint-002-ownership-and-generated-artifact-policy\`

## 1. 任务目标

完成第 2 轮 delegated review 收口。

## 9. 执行记录

1. 2026-05-14：第 2 轮 CR 已 resolved。
`,
        'utf8',
      );
      await writeFile(
        checklistPath,
        `# checklist

- [x] CR-201 first clean review
  - 2026-05-14：第 1 轮 CR 已 resolved。
- [x] CR-202 second clean review
  - 2026-05-14：第 2 轮 CR 已 resolved。
`,
        'utf8',
      );
      await writeFile(
        csvPath,
        `${[
          'execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at',
          'seed-1,CR-201,first clean review,AI-Agent,P1,2026-05-14,resolved,project-123-empty-repo-self-host-adoption-rollout,sprint-002-ownership-and-generated-artifact-policy,完成第 1 轮 delegated review 收口。,Round 1 clean,pnpm run build,ready,2026-05-14',
        ].join('\n')}\n`,
        'utf8',
      );

      const sqliteRootPath = resolve(tempRoot, '.repo-ai-governor', 'context', 'dev', 'sqlite');
      await mkdir(sqliteRootPath, { recursive: true });
      const database = new DatabaseSync(sqlitePath);
      database.exec(`
        CREATE TABLE task_ledger_sources (
          source_path TEXT PRIMARY KEY,
          source_mtime_ms INTEGER NOT NULL,
          source_size INTEGER NOT NULL,
          row_count INTEGER NOT NULL,
          synced_at TEXT NOT NULL
        );
      `);
      database.exec(`
        CREATE TABLE task_ledger_rows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_path TEXT NOT NULL,
          source_row_number INTEGER NOT NULL,
          execution_id TEXT NOT NULL,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          owner TEXT NOT NULL,
          priority TEXT NOT NULL,
          due_date TEXT NOT NULL,
          status TEXT NOT NULL,
          project TEXT NOT NULL,
          sprint TEXT NOT NULL,
          plan TEXT NOT NULL,
          result TEXT NOT NULL,
          verify TEXT NOT NULL,
          review_delta TEXT NOT NULL,
          recorded_at TEXT NOT NULL,
          UNIQUE(source_path, source_row_number)
        );
      `);
      database
        .prepare(
          `
            INSERT INTO task_ledger_sources (
              source_path,
              source_mtime_ms,
              source_size,
              row_count,
              synced_at
            ) VALUES (?, ?, ?, ?, ?)
          `,
        )
        .run(csvPath, 0, 0, 3, '2026-05-14T00:00:00.000Z');
      const insertRow = database.prepare(
        `
          INSERT INTO task_ledger_rows (
            source_path,
            source_row_number,
            execution_id,
            task_id,
            title,
            owner,
            priority,
            due_date,
            status,
            project,
            sprint,
            plan,
            result,
            verify,
            review_delta,
            recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );
      insertRow.run(
        csvPath,
        2,
        'seed-1',
        'CR-201',
        'first clean review',
        'AI-Agent',
        'P1',
        '2026-05-14',
        'resolved',
        'project-123-empty-repo-self-host-adoption-rollout',
        'sprint-002-ownership-and-generated-artifact-policy',
        '完成第 1 轮 delegated review 收口。',
        'Round 1 clean',
        'pnpm run build',
        'ready',
        '2026-05-14',
      );
      insertRow.run(
        csvPath,
        4,
        'seed-gap',
        'CR-999',
        'placeholder row',
        'AI-Agent',
        'P1',
        '2026-05-14',
        'resolved',
        'project-123-empty-repo-self-host-adoption-rollout',
        'sprint-002-ownership-and-generated-artifact-policy',
        '占位行',
        'placeholder',
        'pnpm run build',
        'placeholder',
        '2026-05-14',
      );
      insertRow.run(
        csvPath,
        7,
        'seed-gap-2',
        'CR-998',
        'second placeholder row',
        'AI-Agent',
        'P1',
        '2026-05-14',
        'resolved',
        'project-123-empty-repo-self-host-adoption-rollout',
        'sprint-002-ownership-and-generated-artifact-policy',
        '第二个占位行',
        'placeholder',
        'pnpm run build',
        'placeholder',
        '2026-05-14',
      );
      database.close();

      await execFileAsync(
        process.execPath,
        [
          SYNC_TASK_LEDGER_SCRIPT_PATH,
          '--tasks-dir',
          tasksDirPath,
          '--task-id',
          'CR-201',
          '--result',
          'Round 1 clean after fixes.',
          '--verify',
          'pnpm run build',
          '--review-delta',
          'Ready for next round.',
        ],
        {
          cwd: tempRoot,
        },
      );
      await execFileAsync(
        process.execPath,
        [
          SYNC_TASK_LEDGER_SCRIPT_PATH,
          '--tasks-dir',
          tasksDirPath,
          '--task-id',
          'CR-202',
          '--result',
          'Round 2 clean after fixes.',
          '--verify',
          'pnpm run build',
          '--review-delta',
          'Sprint ready for closeout.',
        ],
        {
          cwd: tempRoot,
        },
      );

      const projectedRows = readProjectedTaskRowsForSource({
        taskCsvPath: csvPath,
        databaseFilePath: resolve(
          tempRoot,
          '.repo-ai-governor',
          'context',
          'dev',
          'sqlite',
          'task-ledger.sqlite',
        ),
        bootstrapFromCsv: false,
      });
      const appendedRoundOneRow = projectedRows.find(
        (row) => row.task_id === 'CR-201' && row.result === 'Round 1 clean after fixes.',
      );
      const appendedRoundTwoRow = projectedRows.find(
        (row) => row.task_id === 'CR-202' && row.result === 'Round 2 clean after fixes.',
      );

      expect(appendedRoundOneRow?.__rowNumber).toBe(8);
      expect(appendedRoundTwoRow?.__rowNumber).toBe(9);

      const csvContent = await readFile(csvPath, 'utf8');
      expect(csvContent).toContain('Round 1 clean after fixes.');
      expect(csvContent).toContain('Round 2 clean after fixes.');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
