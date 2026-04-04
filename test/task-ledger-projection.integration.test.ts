import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
  compareRenderedTaskLedgerCsvViews,
  ensureTaskLedgerProjection,
  readLatestProjectedTaskRows,
  readLatestProjectedTaskRowsForSource,
  readLatestTaskLedgerStatuses,
  replaceTaskLedgerCanonicalRowsForSource,
} from '../scripts/governance/task-ledger-projection.js';

describe('task ledger sqlite canonical truth integration', () => {
  it('bootstraps sqlite truth from rendered tasks.csv views and keeps sqlite canonical afterwards', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'task-ledger-projection-'));
    const devRoot = join(temporaryRoot, '.repo-ai-governor', 'context', 'dev');
    const sprintOneTasksRoot = join(devRoot, 'project-100', 'sprint-001-demo', 'tasks');
    const sprintTwoTasksRoot = join(devRoot, 'project-101', 'sprint-002-demo', 'tasks');
    const sprintOneCsvPath = join(sprintOneTasksRoot, 'tasks.csv');
    const sprintTwoCsvPath = join(sprintTwoTasksRoot, 'tasks.csv');
    const canonicalDatabasePath = join(devRoot, 'sqlite', 'task-ledger.sqlite');

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
        databaseFilePath: canonicalDatabasePath,
      });
      expect(projectionSummary.bootstrappedFromCsv).toBe(true);
      expect(projectionSummary.sourceCount).toBe(2);
      expect(projectionSummary.rowCount).toBe(3);

      const latestStatuses = readLatestTaskLedgerStatuses({
        taskLedgerRoot: devRoot,
        databaseFilePath: canonicalDatabasePath,
      });
      expect(latestStatuses.get('TK-900')).toBe('active');
      expect(latestStatuses.get('TK-901')).toBe('completed');

      const sprintOneLatestRows = readLatestProjectedTaskRowsForSource({
        taskCsvPath: sprintOneCsvPath,
        taskLedgerRoot: devRoot,
        databaseFilePath: canonicalDatabasePath,
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

      const unchangedRows = readLatestProjectedTaskRows({
        taskLedgerRoot: devRoot,
        databaseFilePath: canonicalDatabasePath,
      });
      expect(unchangedRows.get('TK-900')?.status).toBe('active');
      expect(unchangedRows.get('TK-900')?.recorded_at).toBe('2026-04-03');

      const renderedDrift = compareRenderedTaskLedgerCsvViews({
        databaseFilePath: canonicalDatabasePath,
        taskCsvPath: sprintOneCsvPath,
      });
      expect(renderedDrift.views[0]?.matches).toBe(false);

      replaceTaskLedgerCanonicalRowsForSource({
        taskCsvPath: sprintOneCsvPath,
        databaseFilePath: canonicalDatabasePath,
        rows: [
          {
            execution_id: 'exec-1',
            task_id: 'TK-900',
            title: 'Task one',
            owner: 'AI-Agent',
            priority: 'P0',
            due_date: '2026-04-10',
            status: 'planned',
            project: 'project-100',
            sprint: 'sprint-001-demo',
            plan: 'plan one',
            result: 'result one',
            verify: 'verify one',
            review_delta: 'review one',
            recorded_at: '2026-04-02',
          },
          {
            execution_id: 'exec-2',
            task_id: 'TK-900',
            title: 'Task one',
            owner: 'AI-Agent',
            priority: 'P0',
            due_date: '2026-04-10',
            status: 'active',
            project: 'project-100',
            sprint: 'sprint-001-demo',
            plan: 'plan one',
            result: 'result two',
            verify: 'verify two',
            review_delta: 'review two',
            recorded_at: '2026-04-03',
          },
          {
            execution_id: 'exec-4',
            task_id: 'TK-900',
            title: 'Task one',
            owner: 'AI-Agent',
            priority: 'P0',
            due_date: '2026-04-10',
            status: 'completed',
            project: 'project-100',
            sprint: 'sprint-001-demo',
            plan: 'plan one',
            result: 'result four',
            verify: 'verify four',
            review_delta: 'review four',
            recorded_at: '2026-04-05',
          },
        ],
        writeRenderedView: true,
      });

      const refreshedRows = readLatestProjectedTaskRows({
        taskLedgerRoot: devRoot,
        databaseFilePath: canonicalDatabasePath,
      });
      expect(refreshedRows.get('TK-900')?.status).toBe('completed');
      expect(refreshedRows.get('TK-900')?.recorded_at).toBe('2026-04-05');

      const refreshedDrift = compareRenderedTaskLedgerCsvViews({
        databaseFilePath: canonicalDatabasePath,
        taskCsvPath: sprintOneCsvPath,
      });
      expect(refreshedDrift.views[0]?.matches).toBe(true);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('migrates legacy task-ledger sqlite file and table names into canonical naming', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'task-ledger-projection-'));
    const devRoot = join(temporaryRoot, '.repo-ai-governor', 'context', 'dev');
    const sqliteRoot = join(devRoot, 'sqlite');
    const legacyDatabasePath = join(sqliteRoot, 'task-ledger-projection.sqlite');
    const canonicalDatabasePath = join(sqliteRoot, 'task-ledger.sqlite');
    const legacySourcePath = join(devRoot, 'project-legacy', 'sprint-legacy', 'tasks', 'tasks.csv');

    try {
      await mkdir(sqliteRoot, { recursive: true });
      const legacyDatabase = new DatabaseSync(legacyDatabasePath);
      legacyDatabase.exec(`
        CREATE TABLE task_ledger_projection_sources (
          source_path TEXT PRIMARY KEY,
          source_mtime_ms INTEGER NOT NULL,
          source_size INTEGER NOT NULL,
          row_count INTEGER NOT NULL,
          synced_at TEXT NOT NULL
        );
      `);
      legacyDatabase.exec(`
        CREATE TABLE task_ledger_projection_rows (
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
      legacyDatabase
        .prepare(
          `
            INSERT INTO task_ledger_projection_sources (
              source_path,
              source_mtime_ms,
              source_size,
              row_count,
              synced_at
            ) VALUES (?, ?, ?, ?, ?)
          `,
        )
        .run(legacySourcePath, 0, 0, 1, '2026-04-04T00:00:00.000Z');
      legacyDatabase
        .prepare(
          `
            INSERT INTO task_ledger_projection_rows (
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
        )
        .run(
          legacySourcePath,
          2,
          'exec-legacy',
          'TK-990',
          'Legacy task',
          'AI-Agent',
          'P0',
          '2026-04-10',
          'completed',
          'project-legacy',
          'sprint-legacy',
          'legacy plan',
          'legacy result',
          'legacy verify',
          'legacy review',
          '2026-04-04',
        );
      legacyDatabase.close();

      const latestStatuses = readLatestTaskLedgerStatuses({
        taskLedgerRoot: devRoot,
        databaseFilePath: canonicalDatabasePath,
        bootstrapFromCsv: false,
      });
      expect(latestStatuses.get('TK-990')).toBe('completed');

      await expect(access(canonicalDatabasePath)).resolves.toBeUndefined();
      await expect(access(legacyDatabasePath)).rejects.toBeDefined();

      const canonicalDatabase = new DatabaseSync(canonicalDatabasePath, {
        readOnly: true,
      });
      const tableNames = canonicalDatabase
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC`)
        .all() as Array<{ name: string }>;
      canonicalDatabase.close();

      expect(tableNames.map((row) => row.name)).toContain('task_ledger_sources');
      expect(tableNames.map((row) => row.name)).toContain('task_ledger_rows');
      expect(tableNames.map((row) => row.name)).not.toContain('task_ledger_projection_sources');
      expect(tableNames.map((row) => row.name)).not.toContain('task_ledger_projection_rows');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
