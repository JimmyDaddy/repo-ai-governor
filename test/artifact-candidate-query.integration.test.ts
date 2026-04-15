import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { replaceArtifactRegistryCanonicalState } from '../scripts/governance/artifact-registry-canonical.js';

describe('artifact candidate query', () => {
  it('returns a small ranked consumable DA set without requiring manual corpus browsing', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-candidate-query-'));
    const artifactRegistryRoot = join(
      temporaryRoot,
      '.repo-ai-governor',
      'context',
      'artifact-registry',
    );
    const tasksRoot = join(
      temporaryRoot,
      '.repo-ai-governor',
      'context',
      'dev',
      'project-015-memory-provider-pluginization',
      'sprint-001-registry-and-plugin-resolution-baseline',
      'tasks',
    );
    const databaseFilePath = join(artifactRegistryRoot, 'sqlite', 'artifact-registry.sqlite');
    const mainRegistryPath = join(artifactRegistryRoot, 'artifacts.csv');
    const queryScriptPath = join(
      process.cwd(),
      'scripts',
      'governance',
      'query-artifact-candidates.js',
    );
    const relevantArtifactPath = join(
      tasksRoot,
      'DA-160-langgraph-runtime-productization-gap-register-and-project-016-handoff-baseline.md',
    );
    const irrelevantArtifactPath = join(tasksRoot, 'DA-161-unrelated-maintenance-baseline.md');

    try {
      await mkdir(tasksRoot, { recursive: true });
      await writeFile(
        relevantArtifactPath,
        `${[
          '# DA-160',
          '',
          '## 4. Project-016 Handoff Proposal',
          '',
          '建议新建 `project-016-langgraph-runtime-productization`，专门收口 residual gaps。',
          '',
          '## 6. Formal Required Inputs For Project-016',
          '',
          '1. 本产物 `DA-160`',
          '2. sidecar + ipc orchestration host baseline',
        ].join('\n')}\n`,
        'utf8',
      );
      await writeFile(
        irrelevantArtifactPath,
        `${['# DA-161', '', 'maintenance baseline for a different workstream'].join('\n')}\n`,
        'utf8',
      );

      replaceArtifactRegistryCanonicalState({
        databaseFilePath,
        mainRows: [
          {
            artifact_id: 'DA-160',
            artifact_type: 'langgraph_followup_handoff',
            artifact_path:
              '.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-001-registry-and-plugin-resolution-baseline/tasks/DA-160-langgraph-runtime-productization-gap-register-and-project-016-handoff-baseline.md',
            artifact_version: 'v1',
            artifact_status: 'active',
            producer_task_id: 'TK-160',
            producer_execution_id: 'exec-20260415-160',
            registered_at: '2026-04-15',
            last_updated_at: '2026-04-15',
            dependent_tasks: 'TK-161',
          },
          {
            artifact_id: 'DA-161',
            artifact_type: 'maintenance_baseline',
            artifact_path:
              '.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-001-registry-and-plugin-resolution-baseline/tasks/DA-161-unrelated-maintenance-baseline.md',
            artifact_version: 'v1',
            artifact_status: 'active',
            producer_task_id: 'TK-161',
            producer_execution_id: 'exec-20260415-161',
            registered_at: '2026-04-15',
            last_updated_at: '2026-04-15',
            dependent_tasks: '',
          },
        ],
        archiveRows: [],
      });

      const output = execFileSync(
        process.execPath,
        [
          queryScriptPath,
          '--database',
          databaseFilePath,
          '--main',
          mainRegistryPath,
          '--project',
          'project-016-langgraph-runtime-productization',
          '--task-title',
          'langgraph sidecar ipc rollout',
          '--goal',
          '完成 project-016 first-phase rollout',
          '--limit',
          '3',
          '--json',
        ],
        {
          cwd: temporaryRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      const parsedOutput = JSON.parse(output) as {
        candidates: Array<{
          artifactId: string;
          score: number;
          reasons: string[];
        }>;
      };

      expect(parsedOutput.candidates).toHaveLength(2);
      expect(parsedOutput.candidates[0]?.artifactId).toBe('DA-160');
      expect(parsedOutput.candidates[0]?.score).toBeGreaterThan(
        parsedOutput.candidates[1]?.score ?? 0,
      );
      expect(parsedOutput.candidates[0]?.reasons.join(' ')).toContain(
        'project-016-langgraph-runtime-productization',
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
