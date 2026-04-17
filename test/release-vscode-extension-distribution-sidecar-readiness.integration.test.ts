import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { OrchestrationServiceLifecycleStatus } from '@repo-ai-governor/orchestration-service-client';

import {
  assertReadySidecarSmoke,
  extractVsix,
  verifySymlinkPayload,
} from '../scripts/release/verify-vscode-extension-distribution.js';

describe('release vscode extension distribution sidecar readiness gate', () => {
  it('accepts ready lifecycle smokes', () => {
    expect(() =>
      assertReadySidecarSmoke('packaged root', {
        serviceLifecycle: OrchestrationServiceLifecycleStatus.READY,
        queueGeneratedAt: '2026-04-18T00:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it.each([
    OrchestrationServiceLifecycleStatus.STARTING,
    OrchestrationServiceLifecycleStatus.STOPPING,
    OrchestrationServiceLifecycleStatus.STOPPED,
  ])('rejects %s lifecycle results', (serviceLifecycle) => {
    expect(() =>
      assertReadySidecarSmoke('packaged root', {
        serviceLifecycle,
        queueGeneratedAt: '2026-04-18T00:00:00.000Z',
      }),
    ).toThrow(
      `packaged root sidecar smoke must report lifecycle "${OrchestrationServiceLifecycleStatus.READY}" before distribution verification can pass (received "${serviceLifecycle}")`,
    );
  });
});

describe('release vscode extension distribution extracted-VSIX guard', () => {
  it('extracts one VSIX and rejects disallowed symlink payload', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'repo-ai-governor-vsix-'));
    const sourceRoot = resolve(tempRoot, 'source');
    const extensionRoot = resolve(sourceRoot, 'extension');
    const nodeModulesRoot = resolve(extensionRoot, 'node_modules');
    const workingRoot = resolve(tempRoot, 'working');
    const vsixPath = resolve(tempRoot, 'fixture.vsix');

    try {
      mkdirSync(nodeModulesRoot, { recursive: true });
      writeFileSync(resolve(extensionRoot, 'package.json'), '{}\n', 'utf8');
      symlinkSync('../package.json', resolve(nodeModulesRoot, 'install-unsafe-link'));
      execFileSync('zip', ['-y', '-q', '-r', vsixPath, '.'], { cwd: sourceRoot });

      const extractedRoot = extractVsix(vsixPath, workingRoot);

      expect(existsSync(resolve(extractedRoot, 'package.json'))).toBe(true);
      expect(() => verifySymlinkPayload(extractedRoot)).toThrow('install-unsafe symlinks');
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
