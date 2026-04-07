import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { AgentsProjector } from './agents-projector.js';
import {
  DEFAULT_AGENTS_PROJECTION_TARGET,
  DEFAULT_STANDARDS_FALLBACK_LOCALE,
  DEFAULT_STANDARDS_RENDER_LOCALE,
  StandardsPackSource,
  StandardsRenderTarget,
} from './constants/index.js';
import { RuleRenderer } from './rule-renderer.js';
import { StandardsPackRegistry } from './standards-pack-registry.js';
import type {
  AgentsProjectorProjectResult,
  RuleRendererRenderResult,
  StandardsPack,
  StandardsRuntimeConfig,
  StandardsRuntimeLoadInput,
  StandardsRuntimeLoadResult,
  StandardsRuntimeLoadedPack,
  StandardsRuntimePackSourceConfig,
  StandardsRuntimePackSourcesConfig,
  StandardsRuntimeProjectionTargetConfig,
  StandardsRuntimeRenderInput,
} from './types/index.js';

const DEFAULT_RENDER_TARGETS = [
  StandardsRenderTarget.HUMAN,
  StandardsRenderTarget.AI,
  StandardsRenderTarget.AGENTS,
] as const;

const PACK_LAYER_TO_SOURCE = {
  official: StandardsPackSource.OFFICIAL,
  team: StandardsPackSource.TEAM,
  repository: StandardsPackSource.REPOSITORY,
} satisfies Record<keyof StandardsRuntimePackSourcesConfig, StandardsPackSource>;

/**
 * Loads standards packs from runtime config and assembles registry/render/projection services.
 *
 * Why this exists:
 * standards should move from library-only helpers to one real runtime loading path driven by
 * governor config, while still preserving the official/team/repository layering contract.
 */
export class StandardsRuntimeLoader {
  /**
   * Loads runtime standards services from config-backed pack references.
   * @param input Base directory plus optional standards config.
   * @returns Loaded pack provenance and assembled registry/render/projection services.
   */
  public async load(input: StandardsRuntimeLoadInput): Promise<StandardsRuntimeLoadResult> {
    const standards = input.standards;
    const loadedPacks = await this.loadPackLayers(input.baseDirectory, standards);
    const registry = new StandardsPackRegistry({
      packs: loadedPacks.map((loadedPack) => loadedPack.pack),
    });
    const renderer = new RuleRenderer({
      registry,
      defaultLocale: standards?.defaultLocale ?? DEFAULT_STANDARDS_RENDER_LOCALE,
      fallbackLocale: standards?.fallbackLocale ?? DEFAULT_STANDARDS_FALLBACK_LOCALE,
    });
    const projectionTargets = this.resolveProjectionTargets(input.baseDirectory, standards);
    const projector = new AgentsProjector({
      renderer,
      defaultProjectionTarget: projectionTargets[0]?.targetFile ?? DEFAULT_AGENTS_PROJECTION_TARGET,
    });

    return {
      loadedPacks,
      renderTargets: standards?.renderTargets ?? [...DEFAULT_RENDER_TARGETS],
      projectionTargets,
      registry,
      renderer,
      projector,
    };
  }

  /**
   * Renders the targets declared by runtime config without persisting any files.
   * @param input Base directory, runtime config, and optional render overrides.
   * @returns Structured render results in configured target order.
   */
  public async renderConfiguredTargets(
    input: StandardsRuntimeRenderInput,
  ): Promise<RuleRendererRenderResult[]> {
    const runtime = await this.load(input);

    return runtime.renderTargets.map((target) =>
      runtime.renderer.render({
        target,
        locale: input.locale,
        scope: input.scope,
        interpolationByRuleId: input.interpolationByRuleId,
        interpolationBySemanticKey: input.interpolationBySemanticKey,
      }),
    );
  }

  /**
   * Projects configured `AGENTS.md`-style targets from one runtime standards config.
   * The returned payload is caller-owned; this helper does not write files automatically.
   * @param input Base directory plus optional standards config and render overrides.
   * @returns Projected target payloads in declaration order.
   */
  public async projectAgents(
    input: StandardsRuntimeRenderInput,
  ): Promise<AgentsProjectorProjectResult[]> {
    const runtime = await this.load(input);

    return runtime.projectionTargets.map((projectionTarget) =>
      runtime.projector.project({
        projectionTarget: projectionTarget.targetFile,
        locale: projectionTarget.locale ?? input.locale ?? input.standards?.defaultLocale,
        scope: input.scope,
        interpolationByRuleId: input.interpolationByRuleId,
        interpolationBySemanticKey: input.interpolationBySemanticKey,
      }),
    );
  }

  private async loadPackLayers(
    baseDirectory: string,
    standards: StandardsRuntimeConfig | undefined,
  ): Promise<StandardsRuntimeLoadedPack[]> {
    const packSources = standards?.packSources;
    const loadedPacks: StandardsRuntimeLoadedPack[] = [];

    for (const layer of Object.keys(PACK_LAYER_TO_SOURCE) as Array<
      keyof StandardsRuntimePackSourcesConfig
    >) {
      const sourceConfigs = packSources?.[layer] ?? [];
      for (const sourceConfig of sourceConfigs) {
        if (sourceConfig.enabled === false) {
          continue;
        }

        loadedPacks.push(await this.loadPackSource(baseDirectory, layer, sourceConfig));
      }
    }

    return loadedPacks;
  }

  private async loadPackSource(
    baseDirectory: string,
    layer: keyof StandardsRuntimePackSourcesConfig,
    sourceConfig: StandardsRuntimePackSourceConfig,
  ): Promise<StandardsRuntimeLoadedPack> {
    const moduleNamespace = await this.loadModule(baseDirectory, sourceConfig.module);
    const candidate = moduleNamespace[sourceConfig.exportName];
    if (!candidate || typeof candidate !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Standards runtime export "${sourceConfig.exportName}" is missing or invalid in "${sourceConfig.module}".`,
        {
          layer,
          module: sourceConfig.module,
          exportName: sourceConfig.exportName,
        },
      );
    }

    const pack = candidate as StandardsPack;
    const expectedSource = PACK_LAYER_TO_SOURCE[layer];
    if (pack.packSource !== expectedSource) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Standards pack "${pack.packId}" must declare packSource "${expectedSource}" when loaded through the "${layer}" layer.`,
        {
          layer,
          expectedSource,
          actualSource: pack.packSource,
          packId: pack.packId,
        },
      );
    }

    return {
      layer,
      module: sourceConfig.module,
      exportName: sourceConfig.exportName,
      pack,
    };
  }

  private resolveProjectionTargets(
    baseDirectory: string,
    standards: StandardsRuntimeConfig | undefined,
  ): StandardsRuntimeProjectionTargetConfig[] {
    const configuredTargets =
      standards?.projectionTargets && standards.projectionTargets.length > 0
        ? standards.projectionTargets
        : [
            {
              targetFile: DEFAULT_AGENTS_PROJECTION_TARGET,
              ...(standards?.defaultLocale
                ? {
                    locale: standards.defaultLocale,
                  }
                : {}),
            },
          ];

    return configuredTargets.map((projectionTarget) => ({
      ...projectionTarget,
      targetFile: resolve(baseDirectory, projectionTarget.targetFile),
    }));
  }

  private async loadModule(
    baseDirectory: string,
    moduleSpecifier: string,
  ): Promise<Record<string, unknown>> {
    if (moduleSpecifier.startsWith('file://')) {
      // dynamic-import-allowed: standards runtime loading resolves config-declared pack modules.
      return (await import(moduleSpecifier)) as Record<string, unknown>;
    }

    if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
      const resolvedModulePath = moduleSpecifier.startsWith('/')
        ? moduleSpecifier
        : resolve(baseDirectory, moduleSpecifier);
      // dynamic-import-allowed: standards runtime loading resolves config-declared pack modules.
      return (await import(pathToFileURL(resolvedModulePath).href)) as Record<string, unknown>;
    }

    // dynamic-import-allowed: standards runtime loading resolves config-declared pack modules.
    return (await import(moduleSpecifier)) as Record<string, unknown>;
  }
}
