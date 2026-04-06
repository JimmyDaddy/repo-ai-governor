import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';

const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CHECK_SPRINT_PLAN_STATUS_SYNC_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'check-sprint-plan-status-sync.js',
);

describe('check-sprint-plan-status-sync.js', () => {
  it('treats CR checklist entries as tracked tasks when validating aggregate sprint status', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'sprint-plan-status-sync-'));
    const sprintRoot = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-100-demo',
      'sprint-001-demo',
    );
    const tasksRoot = resolve(sprintRoot, 'tasks');

    try {
      mkdirSync(tasksRoot, { recursive: true });
      writeFileSync(resolve(sprintRoot, 'plan.md'), '# Sprint Plan\n\n- Status: active\n', 'utf8');
      writeFileSync(
        resolve(tasksRoot, 'checklist.md'),
        `# checklist

- [x] CR-900 Demo Review Governance
`,
        'utf8',
      );
      writeFileSync(
        resolve(tasksRoot, 'tasks.csv'),
        `execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at
exec-1,CR-900,Demo Review Governance,AI-Agent,P1,2026-04-06,review_pending,project-100-demo,sprint-001-demo,让评审任务进入独立编号空间并等待复核。,待执行,待验证,待执行,2026-04-06
`,
        'utf8',
      );

      try {
        execFileSync(process.execPath, [CHECK_SPRINT_PLAN_STATUS_SYNC_SCRIPT_PATH], {
          cwd: tempRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          'Expected sprint-plan-status-sync to fail for mismatched CR checklist state.',
        );
      } catch (error) {
        const stderr =
          error && typeof error === 'object' && 'stderr' in error ? String(error.stderr ?? '') : '';
        const stdout =
          error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
        const combinedOutput = `${stdout}\n${stderr}`;
        expect(combinedOutput).toContain(
          '[gate:sprint-plan-status-sync] Found 1 sprint status drift issue(s).',
        );
        expect(combinedOutput).toContain(
          'checklist aggregate status="completed" but latest tasks.csv indicates "active"',
        );
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
