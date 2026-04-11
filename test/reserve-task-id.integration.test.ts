import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));
const RESERVE_TASK_ID_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'reserve-task-id.js',
);

describe('reserve-task-id.js', () => {
  it('uses workspace scope for TK reservations and persists later allocations in sqlite', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'reserve-task-id-workspace-'));
    const tasksDirPathA = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-100-demo',
      'sprint-001-demo',
      'tasks',
    );
    const tasksDirPathB = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-101-demo',
      'sprint-001-demo',
      'tasks',
    );

    try {
      await mkdir(tasksDirPathA, { recursive: true });
      await mkdir(tasksDirPathB, { recursive: true });
      await writeFile(
        resolve(tasksDirPathA, 'TK-101-demo-bootstrap.md'),
        '# TK-101 demo bootstrap\n',
        'utf8',
      );
      await writeFile(
        resolve(tasksDirPathB, 'TK-104-demo-follow-up.md'),
        '# TK-104 demo follow up\n',
        'utf8',
      );

      const firstReservation = await execFileAsync(
        process.execPath,
        [
          RESERVE_TASK_ID_SCRIPT_PATH,
          '--tasks-dir',
          tasksDirPathA,
          '--type',
          'TK',
          '--count',
          '2',
          '--reserved-by',
          'tester-a',
          '--reason',
          'parallel decomposition',
        ],
        {
          cwd: tempRoot,
        },
      );
      const firstResult = JSON.parse(firstReservation.stdout);
      expect(firstResult.scopeMode).toBe('workspace');
      expect(firstResult.reservedIds).toEqual(['TK-105', 'TK-106']);

      const secondReservation = await execFileAsync(
        process.execPath,
        [
          RESERVE_TASK_ID_SCRIPT_PATH,
          '--tasks-dir',
          tasksDirPathA,
          '--type',
          'TK',
          '--reserved-by',
          'tester-b',
        ],
        {
          cwd: tempRoot,
        },
      );
      const secondResult = JSON.parse(secondReservation.stdout);
      expect(secondResult.reservedIds).toEqual(['TK-107']);
      expect(secondResult.tasksDirPath).toBe(tasksDirPathA);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('uses tasks-dir scope for CR reservations so parallel sprints can keep local review numbering', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'reserve-task-id-cr-'));
    const tasksDirPathA = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-200-demo',
      'sprint-001-demo',
      'tasks',
    );
    const tasksDirPathB = resolve(
      tempRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-200-demo',
      'sprint-002-demo',
      'tasks',
    );

    try {
      await mkdir(tasksDirPathA, { recursive: true });
      await mkdir(tasksDirPathB, { recursive: true });
      await writeFile(
        resolve(tasksDirPathA, 'CR-001.md'),
        '# CR-001 local review round 1\n',
        'utf8',
      );
      await writeFile(
        resolve(tasksDirPathB, 'CR-001.md'),
        '# CR-001 other sprint round 1\n',
        'utf8',
      );
      await writeFile(
        resolve(tasksDirPathB, 'CR-002.md'),
        '# CR-002 other sprint round 2\n',
        'utf8',
      );

      const reservation = await execFileAsync(
        process.execPath,
        [
          RESERVE_TASK_ID_SCRIPT_PATH,
          '--tasks-dir',
          tasksDirPathA,
          '--type',
          'CR',
          '--count',
          '2',
          '--reserved-by',
          'reviewer-a',
        ],
        {
          cwd: tempRoot,
        },
      );
      const reservationResult = JSON.parse(reservation.stdout);
      expect(reservationResult.scopeMode).toBe('tasks-dir');
      expect(reservationResult.scopePath).toBe(tasksDirPathA);
      expect(reservationResult.reservedIds).toEqual(['CR-002', 'CR-003']);

      const databaseContent = await readFile(reservationResult.databaseFilePath, 'utf8');
      expect(databaseContent.length).toBeGreaterThan(0);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
