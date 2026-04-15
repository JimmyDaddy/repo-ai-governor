import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { GovernorErrorCode } from '@repo-ai-governor/shared';
import {
  ADOPTION_PACK_MANIFEST_SCHEMA_VERSION,
  AdoptionPackApplicabilityScope,
  AdoptionPackManagedAssetGroup,
  AdoptionPackParityClass,
  AdoptionPackReadinessGroup,
  AdoptionPackReadinessSink,
  AdoptionPackRegistry,
  AdoptionPackRemovePolicy,
  AdoptionPackSourceKind,
  AdoptionPackSourceMode,
  AdoptionPackSurfaceKind,
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
    const projectedWorkflowRecord = definition.workflowRecords.find(
      (record) => record.workflowId === 'workspace-scoped-cr-loop',
    );

    expect(projectedWorkflowRecord?.projectedSkillMarkdown).toContain('# Workspace Scoped CR Loop');
  });

  it('publishes built-in source-catalog metadata for parity and structure-instance split surfaces', async () => {
    const registry = new AdoptionPackRegistry();

    const definition = await registry.resolveDefinition(BUILT_IN_ADOPTION_PACK_ID);
    const workflowSurface = definition.sourceCatalogRecords.find(
      (record) => record.workflowId === 'workspace-scoped-cr-loop',
    );
    const currentContextSurface = definition.sourceCatalogRecords.find(
      (record) => record.relativePath === '.repo-ai-governor/context/current-context.md',
    );
    const governorConfigSurface = definition.sourceCatalogRecords.find(
      (record) => record.relativePath === '.repo-ai-governor/governor.yaml',
    );
    const codeStandardsSurface = definition.sourceCatalogRecords.find(
      (record) =>
        record.relativePath ===
        '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
    );
    const currentContextTemplate = definition.templateRecords.find(
      (record) => record.relativePath === '.repo-ai-governor/context/current-context.md',
    );
    const manifestTemplate = definition.templateRecords.find(
      (record) =>
        record.relativePath ===
        '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
    );

    expect(workflowSurface).toMatchObject({
      surfaceKind: AdoptionPackSurfaceKind.WORKFLOW_ASSET,
      parityClass: AdoptionPackParityClass.GENERATED_PROJECTION,
      sourceMode: AdoptionPackSourceMode.GENERATED_PROJECTION,
    });
    expect(currentContextSurface).toMatchObject({
      surfaceKind: AdoptionPackSurfaceKind.TEMPLATE_FILE,
      parityClass: AdoptionPackParityClass.EXACT_SYNC,
      sourceMode: AdoptionPackSourceMode.STRUCTURED_TEMPLATE_PROJECTION,
      structureSourceRef: '.repo-ai-governor/context/current-context.md',
      instanceSourceMode: AdoptionPackSourceMode.TEMPLATE_SEED,
      applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
    });
    expect(governorConfigSurface).toMatchObject({
      surfaceKind: AdoptionPackSurfaceKind.RUNTIME_BOOTSTRAP,
      parityClass: AdoptionPackParityClass.TEMPLATE_SEED,
      sourceMode: AdoptionPackSourceMode.TEMPLATE_SEED,
    });
    expect(codeStandardsSurface).toMatchObject({
      surfaceKind: AdoptionPackSurfaceKind.RUNTIME_BOOTSTRAP,
      parityClass: AdoptionPackParityClass.ADOPTER_OWNED_PLACEHOLDER,
      sourceMode: AdoptionPackSourceMode.ADOPTER_PLACEHOLDER,
      applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
      readinessGroup: AdoptionPackReadinessGroup.GOVERNANCE_RULES_READY,
    });
    expect(currentContextTemplate?.content).toContain('- Stream: `none`');
    expect(currentContextTemplate?.content).toContain(
      '- Plan: `.repo-ai-governor/context/dev/project-template/sprint-template/plan.md`',
    );
    expect(currentContextTemplate?.content).toContain('## Update Rules');
    expect(manifestTemplate?.content).toContain('doc_id: technical_solution_lifecycle_registry');
    expect(manifestTemplate?.content).toContain('doc_id: code_standards');
  });

  it('keeps readiness applicability scoped to self-host repo-local surfaces', async () => {
    const registry = new AdoptionPackRegistry();

    const definition = await registry.resolveDefinition(BUILT_IN_ADOPTION_PACK_ID);
    const readinessScopedSurfaces = definition.sourceCatalogRecords.filter(
      (record) => record.readinessGroup !== AdoptionPackReadinessGroup.NONE,
    );
    const governanceRulesMatrix = definition.readinessMatrixRecords.find(
      (record) => record.readinessGroup === AdoptionPackReadinessGroup.GOVERNANCE_RULES_READY,
    );

    expect(readinessScopedSurfaces.length).toBeGreaterThan(0);
    expect(
      readinessScopedSurfaces.every(
        (record) =>
          record.applicabilityScope === AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL &&
          record.profileIds.includes(BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE) &&
          !record.profileIds.includes(BUILT_IN_ADOPTION_PACK_PROFILE_IDS.ADOPTER_COMPLETE),
      ),
    ).toBe(true);
    expect(governanceRulesMatrix).toMatchObject({
      applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
      sinkIds: expect.arrayContaining([
        AdoptionPackReadinessSink.DOCTOR_DIAGNOSTICS,
        AdoptionPackReadinessSink.ADOPT_VERIFY,
        AdoptionPackReadinessSink.EXECUTION_PREFLIGHT,
      ]),
    });
    expect(governanceRulesMatrix?.surfaceIds).toEqual(
      expect.arrayContaining([
        'runtime_bootstrap:.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
        'runtime_bootstrap:.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md',
      ]),
    );
  });

  it('wraps invalid manifest JSON with source-aware runtime diagnostics', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'adoption-pack-registry-invalid-'));
    const repoLocalRoot = join(cwd, '.repo-ai-governor', 'adoption-packs');
    const manifestPath = join(repoLocalRoot, 'invalid.json');
    await mkdir(repoLocalRoot, { recursive: true });
    await writeFile(manifestPath, '{"packId":', 'utf8');

    const registry = new AdoptionPackRegistry({
      currentWorkingDirectory: cwd,
    });

    await expect(registry.list()).rejects.toMatchObject({
      code: GovernorErrorCode.STANDARDS_PACK_INVALID,
      details: expect.objectContaining({
        sourceKind: AdoptionPackSourceKind.REPO_LOCAL,
        sourceRef: manifestPath,
        fieldName: 'manifest',
      }),
    });
  });
});
