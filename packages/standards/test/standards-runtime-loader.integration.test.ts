import { resolve } from 'node:path';

import {
  DEFAULT_AGENTS_PROJECTION_TARGET,
  StandardsRenderTarget,
  StandardsRuntimeLoader,
} from '../src/index.js';

describe('StandardsRuntimeLoader', () => {
  it('loads layered pack modules and projects configured agents targets', async () => {
    const loader = new StandardsRuntimeLoader();
    const fixtureRoot = resolve(process.cwd(), 'packages/standards/test/fixtures/runtime-loader');

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
          repository: [
            {
              module: './repository-runtime-pack.fixture.ts',
              exportName: 'repositoryRuntimePackFixture',
            },
          ],
        },
        renderTargets: [StandardsRenderTarget.AGENTS],
        projectionTargets: [
          {
            targetFile: 'AGENTS.fixture.md',
            locale: 'en-US',
          },
        ],
        defaultLocale: 'en-US',
        fallbackLocale: 'zh-CN',
      },
    });

    const resolvedRules = runtime.registry.resolveRules();
    const projections = await loader.projectAgents({
      baseDirectory: fixtureRoot,
      standards: {
        packSources: {
          official: [
            {
              module: './official-runtime-pack.fixture.ts',
              exportName: 'officialRuntimePackFixture',
            },
          ],
          repository: [
            {
              module: './repository-runtime-pack.fixture.ts',
              exportName: 'repositoryRuntimePackFixture',
            },
          ],
        },
        projectionTargets: [
          {
            targetFile: 'AGENTS.fixture.md',
            locale: 'en-US',
          },
        ],
        defaultLocale: 'en-US',
      },
    });

    expect(runtime.loadedPacks).toHaveLength(2);
    expect(runtime.renderTargets).toEqual([StandardsRenderTarget.AGENTS]);
    expect(resolvedRules[0]?.sourcePackId).toBe('pack.repository.runtime-fixture');
    expect(projections[0]?.projectionTarget).toBe('AGENTS.fixture.md');
    expect(projections[0]?.projectedContent).toContain(
      'Repository runtime fixture requires review before merge.',
    );
  });

  it('falls back to the default AGENTS projection target when none is configured', async () => {
    const loader = new StandardsRuntimeLoader();
    const fixtureRoot = resolve(process.cwd(), 'packages/standards/test/fixtures/runtime-loader');

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

    expect(runtime.projectionTargets[0]?.targetFile).toBe(DEFAULT_AGENTS_PROJECTION_TARGET);
  });
});
