import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  listBuiltInAdoptionPackDefinitions,
  resolveBuiltInAdoptionPackDefinition,
} from './built-in-adoption-pack-catalog.js';
import {
  AdoptionPackSourceKind,
  DEFAULT_GLOBAL_ADOPTION_PACK_ROOT_SEGMENTS,
  DEFAULT_REPO_LOCAL_ADOPTION_PACK_ROOT_SEGMENTS,
} from './constants/adoption-pack.constant.js';
import type {
  AdoptionPackManifest,
  AdoptionPackRegistryOptions,
  ResolvedAdoptionPackDefinition,
  ResolvedAdoptionPackManifest,
} from './types/index.js';

interface AdoptionPackSourceDocument {
  manifest: AdoptionPackManifest;
  sourceKind: AdoptionPackSourceKind;
  sourceRef: string;
}

/**
 * Resolves layered adoption-pack manifests across built-in, global, and repo-local sources.
 *
 * Why this exists:
 * installer-layer source precedence and provenance must stay deterministic instead of letting
 * CLI/runtime callers guess filesystem conventions ad hoc.
 */
export class AdoptionPackRegistry {
  private readonly currentWorkingDirectory: string;
  private readonly globalPackRoot: string;
  private readonly repoLocalPackRoot: string;

  public constructor(options: AdoptionPackRegistryOptions = {}) {
    this.currentWorkingDirectory = options.currentWorkingDirectory ?? process.cwd();
    this.globalPackRoot =
      options.globalPackRoot ?? resolve(homedir(), ...DEFAULT_GLOBAL_ADOPTION_PACK_ROOT_SEGMENTS);
    this.repoLocalPackRoot =
      options.repoLocalPackRoot ??
      resolve(this.currentWorkingDirectory, ...DEFAULT_REPO_LOCAL_ADOPTION_PACK_ROOT_SEGMENTS);
  }

  /**
   * Lists the current pack manifest view after layered precedence is applied.
   * @returns Resolved manifests ordered by pack id.
   */
  public async list(): Promise<ResolvedAdoptionPackManifest[]> {
    const resolvedDefinitions = await this.listResolvedDefinitions();
    return resolvedDefinitions.map((definition) => definition.manifest);
  }

  /**
   * Resolves one pack definition with built-in renderable assets when available.
   * @param packId Pack id to resolve.
   * @returns Resolved definition with provenance and install-support metadata.
   */
  public async resolveDefinition(packId: string): Promise<ResolvedAdoptionPackDefinition> {
    const definition = (await this.listResolvedDefinitions()).find(
      (candidate) => candidate.manifest.packId === packId,
    );
    if (!definition) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Unknown adoption pack "${packId}".`,
        {
          packId,
        },
      );
    }

    return definition;
  }

  private async listResolvedDefinitions(): Promise<ResolvedAdoptionPackDefinition[]> {
    const sourceDocuments = await this.loadSourceDocuments();
    const byPackId = new Map<string, AdoptionPackSourceDocument>();

    for (const sourceDocument of sourceDocuments) {
      const existing = byPackId.get(sourceDocument.manifest.packId);
      if (
        !existing ||
        this.compareSourcePriority(sourceDocument.sourceKind, existing.sourceKind) > 0
      ) {
        byPackId.set(sourceDocument.manifest.packId, sourceDocument);
      }
    }

    return [...byPackId.values()]
      .sort((left, right) => left.manifest.packId.localeCompare(right.manifest.packId))
      .map((sourceDocument) => this.toResolvedDefinition(sourceDocument));
  }

  private async loadSourceDocuments(): Promise<AdoptionPackSourceDocument[]> {
    const builtInDefinitions = listBuiltInAdoptionPackDefinitions().map((definition) => ({
      manifest: {
        ...definition.manifest,
        sourceKind: AdoptionPackSourceKind.BUILT_IN,
        sourceRef: definition.manifest.sourceRef,
      },
      sourceKind: AdoptionPackSourceKind.BUILT_IN,
      sourceRef: definition.manifest.sourceRef,
    }));
    const globalDocuments = await this.loadManifestDocuments(
      this.globalPackRoot,
      AdoptionPackSourceKind.GLOBAL,
    );
    const repoLocalDocuments = await this.loadManifestDocuments(
      this.repoLocalPackRoot,
      AdoptionPackSourceKind.REPO_LOCAL,
    );

    return [...builtInDefinitions, ...globalDocuments, ...repoLocalDocuments];
  }

  private async loadManifestDocuments(
    root: string,
    sourceKind: AdoptionPackSourceKind,
  ): Promise<AdoptionPackSourceDocument[]> {
    if (!existsSync(root)) {
      return [];
    }

    const entries = await readdir(root, { withFileTypes: true });
    const fileEntries = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .sort((left, right) => left.name.localeCompare(right.name));
    const documents: AdoptionPackSourceDocument[] = [];

    for (const entry of fileEntries) {
      const absolutePath = resolve(root, entry.name);
      const manifest = JSON.parse(await readFile(absolutePath, 'utf8')) as AdoptionPackManifest;
      documents.push({
        manifest: {
          ...manifest,
          sourceKind,
          sourceRef: absolutePath,
        },
        sourceKind,
        sourceRef: absolutePath,
      });
    }

    return documents;
  }

  private toResolvedDefinition(
    sourceDocument: AdoptionPackSourceDocument,
  ): ResolvedAdoptionPackDefinition {
    const builtInDefinition = resolveBuiltInAdoptionPackDefinition(sourceDocument.manifest.packId);
    const mergedManifest: ResolvedAdoptionPackManifest = {
      ...(builtInDefinition?.manifest ?? {
        ...sourceDocument.manifest,
        resolvedSourceKind: sourceDocument.sourceKind,
        resolvedSourceRef: sourceDocument.sourceRef,
        resolutionOrder: [
          AdoptionPackSourceKind.REPO_LOCAL,
          AdoptionPackSourceKind.GLOBAL,
          AdoptionPackSourceKind.BUILT_IN,
        ],
        installSupported: false,
      }),
      ...sourceDocument.manifest,
      resolvedSourceKind: sourceDocument.sourceKind,
      resolvedSourceRef: sourceDocument.sourceRef,
      resolutionOrder: [
        AdoptionPackSourceKind.REPO_LOCAL,
        AdoptionPackSourceKind.GLOBAL,
        AdoptionPackSourceKind.BUILT_IN,
      ],
      installSupported: builtInDefinition !== null,
    };

    return {
      manifest: mergedManifest,
      workflowRecords: builtInDefinition?.workflowRecords.map((record) => ({ ...record })) ?? [],
      templateRecords: builtInDefinition?.templateRecords.map((record) => ({ ...record })) ?? [],
      capabilityCoverage: builtInDefinition ? { ...builtInDefinition.capabilityCoverage } : {},
    };
  }

  private compareSourcePriority(
    left: AdoptionPackSourceKind,
    right: AdoptionPackSourceKind,
  ): number {
    return this.resolveSourcePriority(left) - this.resolveSourcePriority(right);
  }

  private resolveSourcePriority(sourceKind: AdoptionPackSourceKind): number {
    switch (sourceKind) {
      case AdoptionPackSourceKind.REPO_LOCAL:
        return 3;
      case AdoptionPackSourceKind.GLOBAL:
        return 2;
      default:
        return 1;
    }
  }
}
