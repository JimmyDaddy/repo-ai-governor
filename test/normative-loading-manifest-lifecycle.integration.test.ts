import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';

import { compactNormativeLoadingManifest } from '../scripts/governance/compact-normative-loading-manifest.js';

const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CHECK_ROOT_SCRIPT_PATH = resolve(
  REPOSITORY_ROOT_PATH,
  'scripts',
  'governance',
  'check-normative-loading-manifest.js',
);
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
  it('keeps the root manifest parser compatible when the archive sidecar is present', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-root-parser-compat-'));

    try {
      const normativeRoot = resolve(tempRoot, '.repo-ai-governor', 'normative_knowledge_sources');
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents:
  - doc_id: product_requirements
    path: .repo-ai-governor/normative_knowledge_sources/product-requirements.md
    tier: L1
    status: active
    default_load: false
    load_trigger:
      - all_tasks
    owner: product
    last_reviewed_at: 2026-04-11
  - doc_id: overall_technical_solution
    path: .repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md
    tier: L1
    status: active
    default_load: false
    load_trigger:
      - architecture_change
    owner: architecture
    last_reviewed_at: 2026-04-11
  - doc_id: architecture_and_repo_layering
    path: .repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md
    tier: L1
    status: active
    default_load: false
    load_trigger:
      - layering_boundary_change
    owner: architecture
    last_reviewed_at: 2026-04-11
  - doc_id: local_active_doc
    path: .repo-ai-governor/normative_knowledge_sources/local-active-doc.md
    tier: L1
    status: active
    default_load: false
    load_trigger:
      - manual
    owner: governance
    last_reviewed_at: 2026-04-11
`,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents:
  - doc_id: archived_doc
    path: .repo-ai-governor/normative_knowledge_sources/archive/legacy-doc.md
    tier: L3
    status: archived
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-11
    notes: archived sidecar entry
`,
      );

      writeFileSync(
        resolve(normativeRoot, 'local-active-doc.md'),
        '# Local Active Doc\n\n- Status: active\n',
        'utf8',
      );
      writeFileSync(
        resolve(normativeRoot, 'product-requirements.md'),
        '# Product Requirements\n\n- Status: active\n',
        'utf8',
      );
      writeFileSync(
        resolve(normativeRoot, 'repo-ai-governor-overall-technical-solution.md'),
        '# Overall Technical Solution\n\n- Status: active\n',
        'utf8',
      );
      writeFileSync(
        resolve(normativeRoot, 'repo-ai-governor-architecture-and-repo-layering.md'),
        '# Architecture And Repo Layering\n\n- Status: active\n',
        'utf8',
      );
      writeFileSync(
        resolve(normativeRoot, 'archive', 'legacy-doc.md'),
        '# Legacy Archived Doc\n\n- Status: archived\n',
        'utf8',
      );

      execFileSync(
        process.execPath,
        [
          CHECK_ROOT_SCRIPT_PATH,
          '--mode',
          'block',
          '--manifest',
          '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
          '--normative-root',
          '.repo-ai-governor/normative_knowledge_sources',
        ],
        {
          cwd: tempRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

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
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps archive integrity check compatible when absolute manifest paths are invoked from an external cwd', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-external-cwd-check-'));
    const externalCwd = mkdtempSync(resolve(tmpdir(), 'normative-loading-external-cwd-run-'));

    try {
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents: []
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
          cwd: externalCwd,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
    } finally {
      rmSync(externalCwd, { recursive: true, force: true });
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

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

  it('fails archive integrity check when deprecated entries are missing deprecated_at metadata', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-missing-deprecated-at-'));

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
    notes: missing deprecated_at
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
          'expected archive integrity check to fail on missing deprecated_at',
        );
      } catch (error) {
        const stderr =
          error && typeof error === 'object' && 'stderr' in error ? String(error.stderr ?? '') : '';
        const stdout =
          error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
        const combinedOutput = `${stdout}\n${stderr}`;
        expect(combinedOutput).toContain('deprecated document missing valid deprecated_at');
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('fails archive integrity check when root and archive manifests overlap on doc_id/path', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-root-archive-overlap-'));

    try {
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents:
  - doc_id: shared_doc
    path: .repo-ai-governor/normative_knowledge_sources/shared-doc.md
    tier: L1
    status: active
    default_load: false
    load_trigger:
      - all_tasks
    owner: governance
    last_reviewed_at: 2026-04-11
`,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents:
  - doc_id: shared_doc
    path: .repo-ai-governor/normative_knowledge_sources/shared-doc.md
    tier: L3
    status: archived
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-11
    notes: duplicate archive copy
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
          'expected archive integrity check to fail on root/archive overlap',
        );
      } catch (error) {
        const stderr =
          error && typeof error === 'object' && 'stderr' in error ? String(error.stderr ?? '') : '';
        const stdout =
          error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
        const combinedOutput = `${stdout}\n${stderr}`;
        expect(combinedOutput).toContain('root/archive duplicate doc_id detected: shared_doc');
        expect(combinedOutput).toContain(
          'root/archive duplicate path detected: .repo-ai-governor/normative_knowledge_sources/shared-doc.md',
        );
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('fails archive integrity check when archive entries violate status or metadata purity', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-archive-purity-'));

    try {
      const { rootManifestPath, archiveManifestPath } = createManifestFixture(
        tempRoot,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
documents: []
`,
        `schema_version: 1
generated_at: 2026-04-11
status: active
owner: governance
root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
archive_role: archived_catalog_sidecar
documents:
  - doc_id: archived_doc
    path: .repo-ai-governor/normative_knowledge_sources/archive/legacy-doc.md
    tier: L3
    status: deprecated
    default_load: false
    load_trigger:
      - historical_traceback
    owner: governance
    last_reviewed_at: 2026-04-11
    deprecated_at: 2026-04-01
    notes: invalid archive status
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
          'expected archive integrity check to fail on archive purity violations',
        );
      } catch (error) {
        const stderr =
          error && typeof error === 'object' && 'stderr' in error ? String(error.stderr ?? '') : '';
        const stdout =
          error && typeof error === 'object' && 'stdout' in error ? String(error.stdout ?? '') : '';
        const combinedOutput = `${stdout}\n${stderr}`;
        expect(combinedOutput).toContain(
          'archive manifest document must have status=archived: archived_doc',
        );
        expect(combinedOutput).toContain(
          'archive manifest document must not keep deprecated_at metadata: archived_doc',
        );
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

  it('keeps canonical root_manifest_path when compaction apply runs from an external cwd', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'normative-loading-external-cwd-apply-'));
    const externalCwd = mkdtempSync(resolve(tmpdir(), 'normative-loading-external-cwd-run-'));

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
          '2026-04-11',
        ],
        {
          cwd: externalCwd,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      const rootManifest = readFileSync(rootManifestPath, 'utf8');
      const archiveManifest = readFileSync(archiveManifestPath, 'utf8');

      expect(rootManifest).not.toContain('root_doc');
      expect(archiveManifest).toContain('root_doc');
      expect(archiveManifest).toContain(
        'root_manifest_path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
      );
      expect(archiveManifest).not.toContain('../');
    } finally {
      rmSync(externalCwd, { recursive: true, force: true });
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
