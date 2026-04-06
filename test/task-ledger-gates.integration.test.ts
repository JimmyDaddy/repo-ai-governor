import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CHECK_TASK_LEDGER_SYNC_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'check-task-ledger-sync.js',
);

describe('check-task-ledger-sync.js', () => {
  it('passes when current-context intentionally has no active stream and primary status is idle', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'task-ledger-gates-'));

    try {
      mkdirSync(resolve(tempRoot, '.repo-ai-governor', 'context'), { recursive: true });
      writeFileSync(
        resolve(tempRoot, '.repo-ai-governor', 'context', 'current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: idle
- Project: \`none\`
- Sprint: \`none\`

## Active Streams

- None currently registered.
`,
        'utf8',
      );

      const stdout = execFileSync(process.execPath, [CHECK_TASK_LEDGER_SYNC_SCRIPT_PATH], {
        cwd: tempRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      expect(stdout).toContain(
        '[gate:task-ledger-sync] No active streams registered; current-context primary stream is idle.',
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('passes when CR task cards are synchronized with checklist and tasks.csv', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'task-ledger-cr-gates-'));
    const tasksDirPath = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-100-demo',
      'sprint-001-demo',
      'tasks',
    );
    const reviewDirPath = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-100-demo',
      'sprint-001-demo',
      'review',
    );

    try {
      mkdirSync(tasksDirPath, { recursive: true });
      mkdirSync(reviewDirPath, { recursive: true });
      writeFileSync(
        resolve(tempRoot, '.repo-ai-governor', 'context', 'current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-100-demo\`
- Sprint: \`sprint-001-demo\`

## Active Streams

- \`active-1\`: role=\`primary\`, project=\`project-100-demo\`, sprint=\`sprint-001-demo\`, docs=\`.repo-ai-governor/context/dev/project-100-demo\`, plan=\`.repo-ai-governor/context/dev/project-100-demo/sprint-001-demo/plan.md\`, tasks=\`.repo-ai-governor/context/dev/project-100-demo/sprint-001-demo/tasks\`, checklist=\`.repo-ai-governor/context/dev/project-100-demo/sprint-001-demo/tasks/checklist.md\`, csv=\`.repo-ai-governor/context/dev/project-100-demo/sprint-001-demo/tasks/tasks.csv\`, review=\`.repo-ai-governor/context/dev/project-100-demo/sprint-001-demo/review\`, status=\`active\`
`,
        'utf8',
      );
      writeFileSync(
        resolve(
          tempRoot,
          '.repo-ai-governor',
          'context',
          'dev',
          'project-100-demo',
          'sprint-001-demo',
          'plan.md',
        ),
        '# Sprint Plan\n\n- Status: active\n',
        'utf8',
      );
      writeFileSync(
        resolve(tasksDirPath, 'CR-900-demo-review-governance.md'),
        `# CR-900 Demo Review Governance

- Status: resolved
- Date: 2026-04-06
- Owner: AI-Agent
- Priority: P1
- Project: \`project-100-demo\`
- Sprint: \`sprint-001-demo\`

## 1. 任务目标

让评审任务进入独立编号空间并完成收口。
`,
        'utf8',
      );
      writeFileSync(
        resolve(tasksDirPath, 'checklist.md'),
        `# checklist

- [x] CR-900 Demo Review Governance
`,
        'utf8',
      );
      writeFileSync(
        resolve(tasksDirPath, 'tasks.csv'),
        `execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at
exec-1,CR-900,Demo Review Governance,AI-Agent,P1,2026-04-06,resolved,project-100-demo,sprint-001-demo,让评审任务进入独立编号空间并完成收口。,已收口,gate 通过,无增量,2026-04-06
`,
        'utf8',
      );

      const stdout = execFileSync(process.execPath, [CHECK_TASK_LEDGER_SYNC_SCRIPT_PATH], {
        cwd: tempRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      expect(stdout).toContain(
        '[gate:task-ledger-sync] Task cards, checklist, and tasks.csv are synchronized.',
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
