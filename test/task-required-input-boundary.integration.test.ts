import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('task required input boundary gate', () => {
  it('fails when one task card keeps too many Required Inputs or too many direct DA inputs', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'task-required-inputs-'));
    const tasksDir = join(
      temporaryRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-999-demo',
      'sprint-001-demo',
      'tasks',
    );
    const taskFilePath = join(tasksDir, 'TK-001-boundary-check.md');
    const gateScriptPath = join(
      process.cwd(),
      'scripts',
      'governance',
      'check-task-required-inputs.js',
    );

    try {
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        taskFilePath,
        `${[
          '# TK-001 boundary check',
          '',
          '- Status: planned',
          '',
          '## 4. Required Inputs',
          '',
          '1. `.repo-ai-governor/context/current-context.md`',
          '2. `.repo-ai-governor/context/dev/project-998/tasks/DA-100-followup.md`',
          '3. `.repo-ai-governor/context/dev/project-998/tasks/DA-101-followup.md`',
          '4. `.repo-ai-governor/context/dev/project-998/tasks/DA-102-followup.md`',
          '5. `.repo-ai-governor/context/dev/project-998/tasks/DA-103-followup.md`',
          '6. `.repo-ai-governor/context/dev/project-998/project-998-completion-audit-summary.md`',
          '',
          '## 5. Traceback References',
          '',
          '1. `not-used`',
        ].join('\n')}\n`,
        'utf8',
      );

      expect(() =>
        execFileSync(
          process.execPath,
          [gateScriptPath, '--tasks-dir', tasksDir, '--task-id', 'TK-001'],
          {
            cwd: temporaryRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        ),
      ).toThrow(/required-input boundary issue/u);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('passes when decomposition keeps only first-hop inputs in Required Inputs', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'task-required-inputs-pass-'));
    const tasksDir = join(
      temporaryRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-999-demo',
      'sprint-001-demo',
      'tasks',
    );
    const taskFilePath = join(tasksDir, 'TK-002-boundary-check.md');
    const gateScriptPath = join(
      process.cwd(),
      'scripts',
      'governance',
      'check-task-required-inputs.js',
    );

    try {
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        taskFilePath,
        `${[
          '# TK-002 boundary check',
          '',
          '- Status: planned',
          '',
          '## 4. Required Inputs',
          '',
          '1. `.repo-ai-governor/context/current-context.md`',
          '2. `.repo-ai-governor/context/dev/project-998/tasks/DA-100-followup.md`',
          '3. `.repo-ai-governor/context/dev/project-998/tasks/DA-101-followup.md`',
          '4. `.repo-ai-governor/context/dev/project-999-demo/sprint-001-demo/plan.md`',
          '',
          '## 5. Traceback References',
          '',
          '1. `.repo-ai-governor/context/dev/project-998/project-998-completion-audit-summary.md`',
          '2. `.repo-ai-governor/context/dev/project-998/tasks/DA-102-overflow.md`',
        ].join('\n')}\n`,
        'utf8',
      );

      const output = execFileSync(
        process.execPath,
        [gateScriptPath, '--tasks-dir', tasksDir, '--task-id', 'TK-002'],
        {
          cwd: temporaryRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      expect(output).toContain('[gate:task-required-inputs]');
      expect(output).toContain('Checked 1 task card');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
