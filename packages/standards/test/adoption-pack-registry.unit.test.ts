import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ADOPTION_PACK_MANIFEST_SCHEMA_VERSION,
  AdoptionPackManagedAssetGroup,
  AdoptionPackRegistry,
  AdoptionPackRemovePolicy,
  AdoptionPackSourceKind,
  AdoptionPackUpgradePolicy,
  AdoptionPackWorkspaceModePolicy,
  BUILT_IN_ADOPTION_PACK_ID,
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS,
  HostDistributionHandoffBridge,
  HostDistributionTarget,
} from '../src/index.js';

describe('AdoptionPackRegistry', () => {
  it('lists the built-in adoption pack with installer support metadata', async () => {
    const registry = new AdoptionPackRegistry();

    const manifests = await registry.list();

    expect(manifests).toHaveLength(1);
    expect(manifests[0]?.packId).toBe(BUILT_IN_ADOPTION_PACK_ID);
    expect(manifests[0]?.resolvedSourceKind).toBe(AdoptionPackSourceKind.BUILT_IN);
    expect(manifests[0]?.installSupported).toBe(true);
  });

  it('prefers repo-local overrides while retaining built-in renderable assets', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'adoption-pack-registry-'));
    const repoLocalRoot = join(cwd, '.repo-ai-governor', 'adoption-packs');
    await mkdir(repoLocalRoot, { recursive: true });
    await writeFile(
      join(repoLocalRoot, 'override.json'),
      `${JSON.stringify(
        {
          schemaVersion: ADOPTION_PACK_MANIFEST_SCHEMA_VERSION,
          packId: BUILT_IN_ADOPTION_PACK_ID,
          packVersion: '9.9.9',
          status: 'active',
          ownerModule: 'test.override',
          sourceKind: AdoptionPackSourceKind.REPO_LOCAL,
          sourceRef: 'ignored-by-registry',
          profiles: [
            {
              profileId: BUILT_IN_ADOPTION_PACK_PROFILE_IDS.ADOPTER_COMPLETE,
              displayName: 'Override Adopter Complete',
              workflowAssetIds: ['workspace-scoped-cr-loop'],
              commandEntrypoints: ['adopt apply'],
              guideEntrypoints: ['docs/local-adoption-playbook.md'],
              standardsPackRefs: ['pack.override@9.9.9'],
              hostTargets: [HostDistributionTarget.CODEX_PROJECT_LOCAL],
              bootstrapActions: ['host_projection'],
              workspaceModePolicy: AdoptionPackWorkspaceModePolicy.TOOL_MANAGED_DEFAULT,
            },
          ],
          managedAssetGroups: [AdoptionPackManagedAssetGroup.SKILLS],
          managedPaths: ['.agents/**'],
          canonicalSourceRefs: ['override://canonical'],
          sourcePackRefs: ['pack.override@9.9.9'],
          hostTargets: [HostDistributionTarget.CODEX_PROJECT_LOCAL],
          handoffBridge: HostDistributionHandoffBridge.CLI_WRAPPER,
          verificationProfileRefs: ['adoption.verify'],
          upgradePolicy: AdoptionPackUpgradePolicy.MANAGED_ONLY,
          removePolicy: AdoptionPackRemovePolicy.MANAGED_ONLY,
          docsEntrypoints: ['README.md'],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const registry = new AdoptionPackRegistry({
      currentWorkingDirectory: cwd,
    });

    const definition = await registry.resolveDefinition(BUILT_IN_ADOPTION_PACK_ID);

    expect(definition.manifest.packVersion).toBe('9.9.9');
    expect(definition.manifest.resolvedSourceKind).toBe(AdoptionPackSourceKind.REPO_LOCAL);
    expect(definition.manifest.installSupported).toBe(true);
    expect(definition.workflowRecords.length).toBeGreaterThan(0);
    expect(definition.workflowRecords[0]?.projectedSkillMarkdown).toContain(
      '# Workspace Code Review Workflow',
    );
  });
});
