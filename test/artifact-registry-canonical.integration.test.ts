import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  readArtifactRegistryCanonicalState,
  renderArtifactRegistryCsvViews,
  replaceArtifactRegistryCanonicalState,
} from '../scripts/governance/artifact-registry-canonical.js';

describe('artifact registry canonical sqlite + rendered CSV integration', () => {
  it('requires explicit bootstrap before promoting rendered CSV views into sqlite truth', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-registry-canonical-'));
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

    await mkdir(archiveRoot, { recursive: true });

    try {
      await writeFile(
        mainRegistryPath,
        `${[
          'artifact_id,artifact_type,artifact_path,artifact_version,artifact_status,producer_task_id,producer_execution_id,registered_at,last_updated_at,dependent_tasks',
          'DA-200,sqlite_truth,.repo-ai-governor/context/dev/project-036/tasks/TK-477.md,v1,active,TK-477,exec-20260402-200,2026-04-02,2026-04-02,TK-478|TK-479',
        ].join('\n')}\n`,
        'utf8',
      );
      await writeFile(
        archiveRegistryPath,
        `${[
          'artifact_id,artifact_type,artifact_path,artifact_version,artifact_status,producer_task_id,producer_execution_id,registered_at,last_updated_at,dependent_tasks',
          'DA-201,sqlite_truth_archive,.repo-ai-governor/context/dev/project-036/tasks/TK-477.md,v1,archived,TK-477,exec-20260402-201,2026-04-02,2026-04-02,',
        ].join('\n')}\n`,
        'utf8',
      );

      expect(() =>
        readArtifactRegistryCanonicalState({
          databaseFilePath,
          mainRegistryPath,
          archiveRegistryPath,
        }),
      ).toThrow(/explicit rebuild with --bootstrap-from-csv/u);

      const canonicalState = readArtifactRegistryCanonicalState({
        databaseFilePath,
        mainRegistryPath,
        archiveRegistryPath,
        bootstrapFromCsv: true,
      });

      expect(canonicalState.bootstrappedFromCsv).toBe(true);
      expect(canonicalState.mainRows).toHaveLength(1);
      expect(canonicalState.mainRows[0]?.artifact_id).toBe('DA-200');
      expect(canonicalState.archiveRows).toHaveLength(1);
      expect(canonicalState.archiveRows[0]?.artifact_id).toBe('DA-201');
      const firstMainRow = canonicalState.mainRows[0];
      const { __rowNumber: _ignoredRowNumber, ...nextMainRow } = (firstMainRow ?? {}) as
        | (Record<string, string> & { __rowNumber?: number })
        | { __rowNumber?: number };

      replaceArtifactRegistryCanonicalState({
        databaseFilePath,
        mainRows: [
          {
            ...nextMainRow,
            dependent_tasks: 'TK-480',
            last_updated_at: '2026-04-03',
          },
        ],
        archiveRows: canonicalState.archiveRows,
      });

      const updatedState = readArtifactRegistryCanonicalState({
        databaseFilePath,
        mainRegistryPath,
        archiveRegistryPath,
      });
      renderArtifactRegistryCsvViews({
        mainRows: updatedState.mainRows,
        archiveRows: updatedState.archiveRows,
        mainRegistryPath,
        archiveRegistryPath,
        writeFiles: true,
      });

      const renderedMainCsv = await readFile(mainRegistryPath, 'utf8');
      const renderedArchiveCsv = await readFile(archiveRegistryPath, 'utf8');

      expect(renderedMainCsv).toContain('DA-200');
      expect(renderedMainCsv).toContain('TK-480');
      expect(renderedArchiveCsv).toContain('DA-201');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
