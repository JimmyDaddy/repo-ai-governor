import { execFileSync } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { replaceArtifactRegistryCanonicalState } from '../scripts/governance/artifact-registry-canonical.js';

describe('artifact registry view renderer', () => {
  it('renders canonical registry data from an isolated temp workspace without mutating the repo', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-registry-view-'));
    const artifactRegistryRoot = join(
      temporaryRoot,
      '.repo-ai-governor',
      'context',
      'artifact-registry',
    );
    const archiveRoot = join(artifactRegistryRoot, 'archive');
    const databaseFilePath = join(artifactRegistryRoot, 'sqlite', 'artifact-registry.sqlite');
    const mainRegistryPath = join(artifactRegistryRoot, 'artifacts.csv');
    const archiveRegistryPath = join(archiveRoot, 'artifacts.archive.csv');

    try {
      replaceArtifactRegistryCanonicalState({
        databaseFilePath,
        mainRows: [
          {
            artifact_id: 'DA-057',
            artifact_type: 'main_registry',
            artifact_path:
              '.repo-ai-governor/context/dev/project-005-observability-and-artifacts/tasks/TK-057.md',
            artifact_version: 'v1',
            artifact_status: 'active',
            producer_task_id: 'TK-057',
            producer_execution_id: 'exec-20260402-057',
            registered_at: '2026-04-02',
            last_updated_at: '2026-04-02',
            dependent_tasks: 'TK-478',
          },
        ],
        archiveRows: [
          {
            artifact_id: 'DA-002',
            artifact_type: 'archive_registry',
            artifact_path: '.repo-ai-governor/context/dev/project-001-demo/tasks/TK-002.md',
            artifact_version: 'v1',
            artifact_status: 'archived',
            producer_task_id: 'TK-002',
            producer_execution_id: 'exec-20260402-002',
            registered_at: '2026-04-02',
            last_updated_at: '2026-04-02',
            dependent_tasks: '',
          },
        ],
      });

      const output = execFileSync(
        process.execPath,
        [
          './scripts/governance/render-artifact-registry-view.js',
          '--database',
          databaseFilePath,
          '--main',
          mainRegistryPath,
          '--archive',
          archiveRegistryPath,
          '--skip-write',
        ],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      expect(output).toContain('# Artifact Registry View');
      expect(output).toContain(databaseFilePath);
      expect(output).toContain(mainRegistryPath);
      expect(output).toContain(archiveRegistryPath);
      expect(output).toContain('CSV Views Updated: no (skip-write)');
      expect(output).toContain('## Main Registry');
      expect(output).toContain('## Archive Registry');
      expect(output).toContain('DA-057');
      expect(output).toContain('DA-002');

      await expect(access(mainRegistryPath)).rejects.toThrow();
      await expect(access(archiveRegistryPath)).rejects.toThrow();
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
