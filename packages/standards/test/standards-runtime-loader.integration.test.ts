import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  DEFAULT_AGENTS_PROJECTION_TARGET,
  StandardsRenderTarget,
  StandardsRuntimeLoader,
} from '../src/index.js';

describe('StandardsRuntimeLoader', () => {
  const fixtureRoot = resolve(process.cwd(), 'packages/standards/test/fixtures/runtime-loader');

  function createLayeredRuntimeConfig() {
    return {
      packSources: {
        official: [
          {
            module: './official-runtime-pack.fixture.ts',
            exportName: 'officialRuntimePackFixture',
          },
        ],
        team: [
          {
            module: './team-runtime-pack.fixture.ts',
            exportName: 'teamRuntimePackFixture',
          },
        ],
        repository: [
          {
            module: './repository-runtime-pack.fixture.ts',
            exportName: 'repositoryRuntimePackFixture',
          },
        ],
      },
      renderTargets: [StandardsRenderTarget.HUMAN, StandardsRenderTarget.AI],
      projectionTargets: [
        {
          targetFile: 'AGENTS.fixture.md',
          locale: 'en-US',
        },
      ],
      defaultLocale: 'en-US',
      fallbackLocale: 'zh-CN',
    };
  }

  it('loads layered pack modules, renders configured targets, and projects configured agents targets', async () => {
    const loader = new StandardsRuntimeLoader();
    const expectedProjectionTarget = resolve(fixtureRoot, 'AGENTS.fixture.md');

    const runtime = await loader.load({
      baseDirectory: fixtureRoot,
      standards: createLayeredRuntimeConfig(),
    });
    const resolvedRules = runtime.registry.resolveRules();
    const renderedTargets = await loader.renderConfiguredTargets({
      baseDirectory: fixtureRoot,
      standards: createLayeredRuntimeConfig(),
    });
    const projections = await loader.projectAgents({
      baseDirectory: fixtureRoot,
      standards: createLayeredRuntimeConfig(),
    });
    const humanRender = renderedTargets.find(
      (renderResult) => renderResult.target === StandardsRenderTarget.HUMAN,
    );
    const aiRender = renderedTargets.find(
      (renderResult) => renderResult.target === StandardsRenderTarget.AI,
    );

    expect(runtime.loadedPacks).toHaveLength(3);
    expect(runtime.loadedPacks.map((loadedPack) => loadedPack.layer)).toEqual([
      'official',
      'team',
      'repository',
    ]);
    expect(runtime.renderTargets).toEqual([StandardsRenderTarget.HUMAN, StandardsRenderTarget.AI]);
    expect(resolvedRules).toHaveLength(2);
    expect(resolvedRules.map((resolvedRule) => resolvedRule.sourcePackId)).toEqual(
      expect.arrayContaining(['pack.repository.runtime-fixture', 'pack.team.runtime-fixture']),
    );
    expect(runtime.projectionTargets[0]?.targetFile).toBe(expectedProjectionTarget);
    expect(renderedTargets.map((renderResult) => renderResult.target)).toEqual([
      StandardsRenderTarget.HUMAN,
      StandardsRenderTarget.AI,
    ]);
    expect(humanRender?.renderedRules.map((renderedRule) => renderedRule.text)).toEqual(
      expect.arrayContaining([
        'Repository runtime fixture requires review before merge.',
        'Team runtime fixture recommends a maintainer handoff note.',
      ]),
    );
    expect(aiRender?.renderedRules.map((renderedRule) => renderedRule.text)).toEqual(
      expect.arrayContaining([
        'Repository runtime fixture requires review before merge.',
        'Team runtime fixture recommends a maintainer handoff note.',
      ]),
    );
    expect(projections[0]?.projectionTarget).toBe(expectedProjectionTarget);
    expect(projections[0]?.projectedContent).toContain(
      'Repository runtime fixture requires review before merge.',
    );
    expect(projections[0]?.projectedContent).toContain(
      'Team runtime fixture recommends a maintainer handoff note.',
    );
  });

  it('returns projection payloads without auto-writing configured target files', async () => {
    const loader = new StandardsRuntimeLoader();
    const temporaryProjectionRoot = await mkdtemp(join(tmpdir(), 'runtime-loader-projection-'));
    const projectionTarget = join(temporaryProjectionRoot, 'AGENTS.generated.md');

    try {
      const projections = await loader.projectAgents({
        baseDirectory: fixtureRoot,
        standards: {
          ...createLayeredRuntimeConfig(),
          projectionTargets: [
            {
              targetFile: projectionTarget,
              locale: 'en-US',
            },
          ],
        },
      });

      expect(projections[0]?.projectionTarget).toBe(projectionTarget);
      expect(projections[0]?.projectedContent).toContain(
        'Repository runtime fixture requires review before merge.',
      );
      expect(existsSync(projectionTarget)).toBe(false);
    } finally {
      await rm(temporaryProjectionRoot, {
        recursive: true,
        force: true,
      });
    }
  });

  it('falls back to the default AGENTS projection target when none is configured', async () => {
    const loader = new StandardsRuntimeLoader();

    const runtime = await loader.load({
      baseDirectory: fixtureRoot,
      standards: {
        packSources: {
          official: [
            {
              module: './official-runtime-pack.fixture.ts',
              exportName: 'officialRuntimePackFixture',
            },
          ],
        },
      },
    });

    expect(runtime.projectionTargets[0]?.targetFile).toBe(
      resolve(fixtureRoot, DEFAULT_AGENTS_PROJECTION_TARGET),
    );
  });

  it('loads the first-wave official pack catalog from the repository examples module', async () => {
    const loader = new StandardsRuntimeLoader();
    const repositoryRoot = resolve(process.cwd());
    const temporaryProjectionRoot = await mkdtemp(join(tmpdir(), 'runtime-loader-official-pack-'));
    const projectionTarget = join(temporaryProjectionRoot, 'AGENTS.official.md');
    // The workspace test harness resolves the in-repo examples module here; published package-module
    // consumer paths are maintained by docs/release surfaces and should not be overstated as covered by this slice.
    const repositoryExamplesModule = './packages/standards/src/examples/index.ts';

    try {
      const runtime = await loader.load({
        baseDirectory: repositoryRoot,
        standards: {
          packSources: {
            official: [
              {
                module: repositoryExamplesModule,
                exportName: 'workflowReviewGovernancePack',
              },
              {
                module: repositoryExamplesModule,
                exportName: 'javascriptMinimalGovernancePack',
              },
              {
                module: repositoryExamplesModule,
                exportName: 'rustMinimalGovernancePack',
              },
            ],
          },
          renderTargets: [StandardsRenderTarget.HUMAN],
          projectionTargets: [
            {
              targetFile: projectionTarget,
              locale: 'en-US',
            },
          ],
          defaultLocale: 'en-US',
          fallbackLocale: 'zh-CN',
        },
      });
      const renderResults = await loader.renderConfiguredTargets({
        baseDirectory: repositoryRoot,
        standards: {
          packSources: {
            official: [
              {
                module: repositoryExamplesModule,
                exportName: 'workflowReviewGovernancePack',
              },
              {
                module: repositoryExamplesModule,
                exportName: 'javascriptMinimalGovernancePack',
              },
              {
                module: repositoryExamplesModule,
                exportName: 'rustMinimalGovernancePack',
              },
            ],
          },
          renderTargets: [StandardsRenderTarget.HUMAN],
          projectionTargets: [
            {
              targetFile: projectionTarget,
              locale: 'en-US',
            },
          ],
          defaultLocale: 'en-US',
          fallbackLocale: 'zh-CN',
        },
      });
      const projections = await loader.projectAgents({
        baseDirectory: repositoryRoot,
        standards: {
          packSources: {
            official: [
              {
                module: repositoryExamplesModule,
                exportName: 'workflowReviewGovernancePack',
              },
              {
                module: repositoryExamplesModule,
                exportName: 'javascriptMinimalGovernancePack',
              },
              {
                module: repositoryExamplesModule,
                exportName: 'rustMinimalGovernancePack',
              },
            ],
          },
          renderTargets: [StandardsRenderTarget.HUMAN],
          projectionTargets: [
            {
              targetFile: projectionTarget,
              locale: 'en-US',
            },
          ],
          defaultLocale: 'en-US',
          fallbackLocale: 'zh-CN',
        },
      });

      expect(runtime.loadedPacks.map((loadedPack) => loadedPack.pack.packId)).toEqual([
        'pack.official.workflow-review',
        'pack.official.javascript.minimal',
        'pack.official.rust.minimal',
      ]);
      expect(
        renderResults[0]?.renderedRules.map((renderedRule) => renderedRule.semanticKey),
      ).toEqual(
        expect.arrayContaining([
          'rule.workflow.review.cr-task-card',
          'rule.javascript.project.package-manifest',
          'rule.rust.format.cargo-fmt',
        ]),
      );
      expect(projections[0]?.projectedContent).toContain('review_pending -> verified -> resolved');
      expect(projections[0]?.projectedContent).toContain('package.json');
      expect(projections[0]?.projectedContent).toContain('cargo fmt --all --check');
      expect(existsSync(projectionTarget)).toBe(false);
    } finally {
      await rm(temporaryProjectionRoot, {
        recursive: true,
        force: true,
      });
    }
  });
});
