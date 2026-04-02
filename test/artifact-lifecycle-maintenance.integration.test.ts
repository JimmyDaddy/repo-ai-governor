import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { replaceArtifactRegistryCanonicalState } from '../scripts/governance/artifact-registry-canonical.js';

describe('artifact lifecycle maintenance automation', () => {
  it('reconciles dependency links and compacts lifecycle state in one batch', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-lifecycle-maintenance-'));
    const artifactRegistryRoot = join(
      temporaryRoot,
      '.repo-ai-governor',
      'context',
      'artifact-registry',
    );
    const archiveRoot = join(artifactRegistryRoot, 'archive');
    const sqliteRoot = join(artifactRegistryRoot, 'sqlite');
    const mainRegistryPath = join(artifactRegistryRoot, 'artifacts.csv');
    const archiveRegistryPath = join(archiveRoot, 'artifacts.archive.csv');
    const databaseFilePath = join(sqliteRoot, 'artifact-registry.sqlite');
    const summaryFilePath = join(sqliteRoot, 'artifact-lifecycle-summary.json');
    const scriptPath = join(
      process.cwd(),
      'scripts',
      'governance',
      'run-artifact-lifecycle-maintenance.js',
    );
    const taskRoot = join(
      temporaryRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-036-runtime-durable-storage-and-registry-cutover',
      'sprint-004-migration-verification-and-cutover-governance',
      'tasks',
    );
    const taskLedgerPath = join(taskRoot, 'tasks.csv');
    const taskCardPath = join(
      taskRoot,
      'TK-900-validate-artifact-lifecycle-maintenance-pipeline.md',
    );

    try {
      await mkdir(archiveRoot, { recursive: true });
      await mkdir(taskRoot, { recursive: true });
      await writeFile(
        taskLedgerPath,
        `${[
          'execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at',
          'exec-900,TK-900,Validate artifact lifecycle maintenance pipeline,AI-Agent,P0,,active,project-036-runtime-durable-storage-and-registry-cutover,sprint-004-migration-verification-and-cutover-governance,plan,ongoing,pending,none,2026-04-02T16:10:00Z',
        ].join('\n')}\n`,
        'utf8',
      );
      await writeFile(
        taskCardPath,
        `${[
          '# TK-900 validate artifact lifecycle maintenance pipeline',
          '',
          '- Status: active',
          '',
          '## 1. Depends On',
          '',
          '1. `DA-900`',
        ].join('\n')}\n`,
        'utf8',
      );

      replaceArtifactRegistryCanonicalState({
        databaseFilePath,
        mainRows: [
          {
            artifact_id: 'DA-900',
            artifact_type: 'task_output',
            artifact_path: '.repo-ai-governor/context/dev/project-036/tasks/TK-900.md',
            artifact_version: 'v1',
            artifact_status: 'active',
            producer_task_id: 'TK-900',
            producer_execution_id: 'exec-900',
            registered_at: '2026-04-01',
            last_updated_at: '2026-04-10',
            dependent_tasks: '',
          },
          {
            artifact_id: 'DA-901',
            artifact_type: 'task_output',
            artifact_path: '.repo-ai-governor/context/dev/project-036/tasks/TK-901.md',
            artifact_version: 'v1',
            artifact_status: 'active',
            producer_task_id: 'TK-901',
            producer_execution_id: 'exec-901',
            registered_at: '2026-04-01',
            last_updated_at: '2026-04-01',
            dependent_tasks: '',
          },
          {
            artifact_id: 'DA-902',
            artifact_type: 'task_output',
            artifact_path: '.repo-ai-governor/context/dev/project-036/tasks/TK-902.md',
            artifact_version: 'v1',
            artifact_status: 'deprecated',
            producer_task_id: 'TK-902',
            producer_execution_id: 'exec-902',
            registered_at: '2026-04-01',
            last_updated_at: '2026-04-01',
            dependent_tasks: '',
          },
        ],
        archiveRows: [],
      });

      const output = execFileSync(
        process.execPath,
        [
          scriptPath,
          '--database',
          databaseFilePath,
          '--main',
          mainRegistryPath,
          '--archive',
          archiveRegistryPath,
          '--inactive-days',
          '7',
          '--deprecation-days',
          '7',
          '--today',
          '2026-04-20',
          '--summary-file',
          summaryFilePath,
        ],
        {
          cwd: temporaryRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      const renderedMainCsv = await readFile(mainRegistryPath, 'utf8');
      const renderedArchiveCsv = await readFile(archiveRegistryPath, 'utf8');
      const summaryContent = JSON.parse(await readFile(summaryFilePath, 'utf8')) as {
        batchSummary?: {
          updatedRows?: number;
          markedDeprecatedCount?: number;
          movedToArchiveCount?: number;
        };
      };

      expect(output).toContain('[gate:artifact-lifecycle-maintenance]');
      expect(output).toContain('wrote maintenance summary');
      expect(renderedMainCsv).toContain('DA-900');
      expect(renderedMainCsv).toContain('TK-900');
      expect(renderedMainCsv).toContain('DA-901');
      expect(renderedMainCsv).toContain('deprecated');
      expect(renderedArchiveCsv).toContain('DA-902');
      expect(renderedArchiveCsv).toContain('archived');
      expect(summaryContent.batchSummary?.updatedRows).toBe(1);
      expect(summaryContent.batchSummary?.markedDeprecatedCount).toBe(1);
      expect(summaryContent.batchSummary?.movedToArchiveCount).toBe(1);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
