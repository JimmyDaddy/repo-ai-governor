import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';

import { compactNormativeLoadingManifest } from '../scripts/governance/compact-normative-loading-manifest.js';

const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CHECK_ARCHIVE_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'check-normative-loading-manifest-archive.js',
);
const COMPACT_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'compact-normative-loading-manifest.js',
);

function createManifestFixture(
  tempRoot: string,
  rootManifestContent: string,
  archiveManifestContent: string,
) {
  const normativeRoot = resolve(tempRoot, '.repo-ai-governor', 'normative_knowledge_sources');
  const archiveRoot = resolve(normativeRoot, 'archive');
  const rootManifestPath = resolve(normativeRoot, 'normative-loading-manifest.yaml');
  const archiveManifestPath = resolve(archiveRoot, 'normative-loading-manifest.archive.yaml');

  mkdirSync(archiveRoot, { recursive: true });
  writeFileSync(rootManifestPath, rootManifestContent, 'utf8');
  writeFileSync(archiveManifestPath, archiveManifestContent, 'utf8');

  return {
    rootManifestPath,
    archiveManifestPath,
  };
}

describe('normative-loading lifecycle governance', () => {
  it('fails archive integrity check when overdue deprecated backlog remains in root manifest', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-archive-check-'));

    try {
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents:
  - doc_id: root_doc
    path: .repo-ai-governor/normative_knowledge_sources/root-doc.md
    tier: L1
    status: deprecated
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-01
    deprecated_at: 2026-03-20
    notes: pending archive move
`,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents: []
`,
      );

      try {
        execFileSync(
          process.execPath,
          [
            CHECK_ARCHIVE_SCRIPT_PATH,
            '--mode',
            'block',
            '--root-manifest',
            rootManifestPath,
            '--archive-manifest',
            archiveManifestPath,
            '--today',
            '2026-04-11',
          ],
          {
            cwd: tempRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          'expected archive integrity check to fail',
        );
      } catch (error) {
        const stderr =
          error && typeof error === 'object' && 'stderr' in error ? String(error.stderr ?? '') : '';
        const stdout =
          error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
        const combinedOutput = `${stdout}\n${stderr}`;
        expect(combinedOutput).toContain('deprecated document exceeded 14 day grace window');
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('moves overdue deprecated entries into archive on apply', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-compact-'));

    try {
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents:
  - doc_id: root_doc
    path: .repo-ai-governor/normative_knowledge_sources/root-doc.md
    tier: L1
    status: deprecated
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-01
    deprecated_at: 2026-03-20
    notes: pending archive move
`,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents: []
`,
      );

      const result = compactNormativeLoadingManifest({
        dryRun: false,
        rootManifestPath,
        archiveManifestPath,
        today: '2026-04-11',
        emitGateOutput: false,
      });

      expect(result.summary.movedDocumentCount).toBe(1);

      const rootManifest = readFileSync(rootManifestPath, 'utf8');
      const archiveManifest = readFileSync(archiveManifestPath, 'utf8');

      expect(rootManifest).not.toContain('root_doc');
      expect(archiveManifest).toContain('root_doc');
      expect(archiveManifest).toContain('status: archived');
      expect(archiveManifest).not.toContain('deprecated_at');
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('moves root archived backlog into archive on apply', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-archived-cleanup-'));

    try {
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents:
  - doc_id: archived_doc
    path: .repo-ai-governor/normative_knowledge_sources/archive/legacy-doc.md
    tier: L3
    status: archived
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-01
    notes: leaked archived backlog
`,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents: []
`,
      );

      const result = compactNormativeLoadingManifest({
        dryRun: false,
        rootManifestPath,
        archiveManifestPath,
        today: '2026-04-11',
        emitGateOutput: false,
      });

      expect(result.summary.movedArchivedBacklogCount).toBe(1);

      const rootManifest = readFileSync(rootManifestPath, 'utf8');
      const archiveManifest = readFileSync(archiveManifestPath, 'utf8');

      expect(rootManifest).not.toContain('archived_doc');
      expect(archiveManifest).toContain('archived_doc');
      expect(archiveManifest).toContain('status: archived');
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('fails dry-run compaction when --today is invalid', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-invalid-today-dry-run-'));

    try {
      const rootManifestContent = `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents:
  - doc_id: root_doc
    path: .repo-ai-governor/normative_knowledge_sources/root-doc.md
    tier: L1
    status: deprecated
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-01
    deprecated_at: 2026-03-20
    notes: pending archive move
`;
      const archiveManifestContent = `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents: []
`;
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        rootManifestContent,
        archiveManifestContent,
      );

      try {
        execFileSync(
          process.execPath,
          [
            COMPACT_SCRIPT_PATH,
            '--root-manifest',
            rootManifestPath,
            '--archive-manifest',
            archiveManifestPath,
            '--today',
            'not-a-date',
          ],
          {
            cwd: tempRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'expected compaction dry-run to fail');
      } catch (error) {
        const stderr =
          error && typeof error === 'object' && 'stderr' in error ? String(error.stderr ?? '') : '';
        const stdout =
          error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
        const combinedOutput = `${stdout}\n${stderr}`;
        expect(combinedOutput).toContain(
          'Invalid --today value: "not-a-date". Expected YYYY-MM-DD.',
        );
      }

      expect(readFileSync(rootManifestPath, 'utf8')).toBe(rootManifestContent);
      expect(readFileSync(archiveManifestPath, 'utf8')).toBe(archiveManifestContent);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('fails apply compaction when --today is invalid and keeps manifests unchanged', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-invalid-today-apply-'));

    try {
      const rootManifestContent = `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents:
  - doc_id: root_doc
    path: .repo-ai-governor/normative_knowledge_sources/root-doc.md
    tier: L1
    status: deprecated
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-01
    deprecated_at: 2026-03-20
    notes: pending archive move
`;
      const archiveManifestContent = `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents: []
`;
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        rootManifestContent,
        archiveManifestContent,
      );

      try {
        execFileSync(
          process.execPath,
          [
            COMPACT_SCRIPT_PATH,
            '--apply',
            '--root-manifest',
            rootManifestPath,
            '--archive-manifest',
            archiveManifestPath,
            '--today',
            'not-a-date',
          ],
          {
            cwd: tempRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        throw new RuntimeError(GovernorErrorCode.UNKNOWN, 'expected compaction apply to fail');
      } catch (error) {
        const stderr =
          error && typeof error === 'object' && 'stderr' in error ? String(error.stderr ?? '') : '';
        const stdout =
          error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
        const combinedOutput = `${stdout}\n${stderr}`;
        expect(combinedOutput).toContain(
          'Invalid --today value: "not-a-date". Expected YYYY-MM-DD.',
        );
      }

      expect(readFileSync(rootManifestPath, 'utf8')).toBe(rootManifestContent);
      expect(readFileSync(archiveManifestPath, 'utf8')).toBe(archiveManifestContent);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
