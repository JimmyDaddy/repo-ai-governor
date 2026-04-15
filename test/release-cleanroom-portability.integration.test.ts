import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import {
  assertTrackedReceiptPayloadPathsExist,
  persistTrackedReceiptProvenance,
  sanitizeTrackedReceiptPayload,
} from '../scripts/release/verify-cleanroom-local-install.js';

describe('release clean-room portability helpers', () => {
  it('rewrites and snapshots repo-owned provenance paths that include spaces in the source root', () => {
    const sourceRoot = mkdtempSync(resolve(tmpdir(), 'repo ai governor cleanroom source '));
    const sourceWorkspaceRoot = resolve(sourceRoot, '.repo-ai-governor');
    const exportRoot = resolve(sourceWorkspaceRoot, 'generated', 'hosts', 'codex');
    const manifestPath = resolve(exportRoot, 'host-export.manifest.json');
    const stagedFilePath = resolve(exportRoot, 'AGENTS.md');
    const provenanceRoot = resolve(
      process.cwd(),
      '.repo-ai-governor',
      'generated',
      'acp',
      'test-cleanroom-space-provenance',
    );
    const receiptPayload = {
      exportManifestPath: manifestPath,
      checks: [
        {
          checkId: 'staged:AGENTS.md',
          inspectedPath: stagedFilePath,
        },
      ],
    };

    try {
      mkdirSync(exportRoot, { recursive: true });
      writeFileSync(stagedFilePath, '# AGENTS fixture\n', 'utf8');
      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            canonicalSourceRefs: [stagedFilePath],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const rewrites = persistTrackedReceiptProvenance({
        receiptPayload,
        provenanceRoot,
      });
      const sanitizedPayload = sanitizeTrackedReceiptPayload(receiptPayload, rewrites);
      const serializedPayload = JSON.stringify(sanitizedPayload);
      const expectedManifestPath =
        '.repo-ai-governor/generated/acp/test-cleanroom-space-provenance/generated/hosts/codex/host-export.manifest.json';
      const expectedStagedFilePath =
        '.repo-ai-governor/generated/acp/test-cleanroom-space-provenance/generated/hosts/codex/AGENTS.md';

      expect(serializedPayload).toContain(expectedManifestPath);
      expect(serializedPayload).toContain(expectedStagedFilePath);
      expect(serializedPayload).not.toContain(sourceRoot.replaceAll('\\', '/'));
      expect(existsSync(resolve(process.cwd(), expectedManifestPath))).toBe(true);
      expect(existsSync(resolve(process.cwd(), expectedStagedFilePath))).toBe(true);
      expect(() =>
        assertTrackedReceiptPayloadPathsExist(
          sanitizedPayload,
          resolve(provenanceRoot, 'path.host-verification.summary.json'),
        ),
      ).not.toThrow();
    } finally {
      rmSync(sourceRoot, { recursive: true, force: true });
      rmSync(provenanceRoot, { recursive: true, force: true });
    }
  });
});
