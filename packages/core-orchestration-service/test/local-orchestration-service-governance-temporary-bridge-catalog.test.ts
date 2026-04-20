import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { OrchestrationWorkspaceOperationKind } from '@repo-ai-governor/orchestration-service-client';
import { LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog } from '../src/local-orchestration-service-governance-temporary-bridge-catalog.js';

const temporaryRoots: string[] = [];

describe('LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog', () => {
  afterEach(async () => {
    const { rm } = await import('node:fs/promises');
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
  });

  it('projects typed workspace-operation metadata alongside preview bridges', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'local-orchestration-bridge-catalog-'));
    temporaryRoots.push(temporaryRoot);

    const repositoryRoot = join(temporaryRoot, 'repo');
    const workspaceRoot = join(repositoryRoot, '.repo-ai-governor');
    const upgradeDirectory = join(workspaceRoot, 'context', 'upgrade');
    mkdirSync(upgradeDirectory, { recursive: true });
    const reportPath = join(upgradeDirectory, 'upgrade-20260418.report.json');
    writeFileSync(reportPath, '{}', 'utf8');

    const bridges = new LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog({
      workspaceRoot,
      repositoryRoot,
    }).list();

    expect(bridges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bridgeId: 'temporary-bridge-host-verify',
          operationKind: OrchestrationWorkspaceOperationKind.HOST_VERIFY,
          operationArguments: {
            outputDir: join(workspaceRoot, 'generated', 'hosts', 'github-copilot'),
          },
        }),
        expect.objectContaining({
          bridgeId: 'temporary-bridge-host-pack',
          operationKind: OrchestrationWorkspaceOperationKind.HOST_PACK,
          operationArguments: {
            host: 'claude-code',
            mode: 'plugin-bundle',
            bundleDir: join(workspaceRoot, 'generated', 'bundles', 'claude'),
          },
        }),
        expect.objectContaining({
          bridgeId: 'temporary-bridge-upgrade',
          operationKind: OrchestrationWorkspaceOperationKind.UPGRADE_APPLY,
          operationArguments: {
            reportPath,
          },
        }),
      ]),
    );
  });
});
