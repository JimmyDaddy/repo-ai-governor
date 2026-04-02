import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ensureTaskLedgerProjection,
  readLatestProjectedTaskRows,
  readLatestProjectedTaskRowsForSource,
  readLatestTaskLedgerStatuses,
} from '../scripts/governance/task-ledger-projection.js';

describe('task ledger sqlite projection integration', () => {
  it('builds latest task read-model from canonical tasks.csv sources and refreshes after source changes', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'task-ledger-projection-'));
    const devRoot = join(temporaryRoot, '.repo-ai-governor', 'context', 'dev');
    const sprintOneTasksRoot = join(devRoot, 'project-100', 'sprint-001-demo', 'tasks');
    const sprintTwoTasksRoot = join(devRoot, 'project-101', 'sprint-002-demo', 'tasks');
    const sprintOneCsvPath = join(sprintOneTasksRoot, 'tasks.csv');
    const sprintTwoCsvPath = join(sprintTwoTasksRoot, 'tasks.csv');
    const projectionDatabasePath = join(devRoot, 'sqlite', 'task-ledger-projection.sqlite');

    try {
      await mkdir(sprintOneTasksRoot, { recursive: true });
      await mkdir(sprintTwoTasksRoot, { recursive: true });

      const headerLine =
        'execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at';
      await writeFile(
        sprintOneCsvPath,
        `${[
          headerLine,
          'exec-1,TK-900,Task one,AI-Agent,P0,2026-04-10,planned,project-100,sprint-001-demo,plan one,result one,verify one,review one,2026-04-02',
          'exec-2,TK-900,Task one,AI-Agent,P0,2026-04-10,active,project-100,sprint-001-demo,plan one,result two,verify two,review two,2026-04-03',
        ].join('\n')}\n`,
        'utf8',
      );
      await writeFile(
        sprintTwoCsvPath,
        `${[
          headerLine,
          'exec-3,TK-901,Task two,AI-Agent,P1,2026-04-12,completed,project-101,sprint-002-demo,plan two,result three,verify three,review three,2026-04-04',
        ].join('\n')}\n`,
        'utf8',
      );

      const projectionSummary = ensureTaskLedgerProjection({
        taskLedgerRoot: devRoot,
        databaseFilePath: projectionDatabasePath,
      });
      expect(projectionSummary.rebuilt).toBe(true);
      expect(projectionSummary.sourceCount).toBe(2);
      expect(projectionSummary.rowCount).toBe(3);

      const latestStatuses = readLatestTaskLedgerStatuses({
        taskLedgerRoot: devRoot,
        databaseFilePath: projectionDatabasePath,
      });
      expect(latestStatuses.get('TK-900')).toBe('active');
      expect(latestStatuses.get('TK-901')).toBe('completed');

      const sprintOneLatestRows = readLatestProjectedTaskRowsForSource({
        taskCsvPath: sprintOneCsvPath,
        taskLedgerRoot: devRoot,
        databaseFilePath: projectionDatabasePath,
      });
      expect(sprintOneLatestRows.get('TK-900')?.status).toBe('active');

      await writeFile(
        sprintOneCsvPath,
        `${[
          headerLine,
          'exec-1,TK-900,Task one,AI-Agent,P0,2026-04-10,planned,project-100,sprint-001-demo,plan one,result one,verify one,review one,2026-04-02',
          'exec-2,TK-900,Task one,AI-Agent,P0,2026-04-10,active,project-100,sprint-001-demo,plan one,result two,verify two,review two,2026-04-03',
          'exec-4,TK-900,Task one,AI-Agent,P0,2026-04-10,completed,project-100,sprint-001-demo,plan one,result four,verify four,review four,2026-04-05',
        ].join('\n')}\n`,
        'utf8',
      );

      const refreshedRows = readLatestProjectedTaskRows({
        taskLedgerRoot: devRoot,
        databaseFilePath: projectionDatabasePath,
      });
      expect(refreshedRows.get('TK-900')?.status).toBe('completed');
      expect(refreshedRows.get('TK-900')?.recorded_at).toBe('2026-04-05');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
