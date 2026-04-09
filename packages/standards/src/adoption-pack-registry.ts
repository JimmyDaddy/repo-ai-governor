import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import {
  listBuiltInAdoptionPackDefinitions,
  resolveBuiltInAdoptionPackDefinition,
} from './built-in-adoption-pack-catalog.js';
import {
  ADOPTION_PACK_MANAGED_ASSET_GROUP_VALUES,
  ADOPTION_PACK_REMOVE_POLICY_VALUES,
  ADOPTION_PACK_UPGRADE_POLICY_VALUES,
  ADOPTION_PACK_WORKSPACE_MODE_POLICY_VALUES,
  AdoptionPackSourceKind,
  DEFAULT_GLOBAL_ADOPTION_PACK_ROOT_SEGMENTS,
  DEFAULT_REPO_LOCAL_ADOPTION_PACK_ROOT_SEGMENTS,
} from './constants/adoption-pack.constant.js';
import {
  HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES,
  HOST_DISTRIBUTION_TARGET_VALUES,
} from './constants/host-distribution.constant.js';
import type {
  AdoptionPackManifest,
  AdoptionPackRegistryOptions,
  ResolvedAdoptionPackDefinition,
  ResolvedAdoptionPackManifest,
} from './types/index.js';
import { readRequiredString } from './utils/validation.util.js';

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
      const manifest = this.parseManifestDocument(
        await readFile(absolutePath, 'utf8'),
        sourceKind,
        absolutePath,
      );
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

  private parseManifestDocument(
    rawManifestContent: string,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
  ): AdoptionPackManifest {
    let parsedManifest: unknown;

    try {
      parsedManifest = JSON.parse(rawManifestContent);
    } catch (error) {
      this.throwManifestValidationError(
        'Failed to parse adoption-pack manifest JSON.',
        sourceKind,
        sourceRef,
        'manifest',
        error,
      );
    }

    if (!parsedManifest || typeof parsedManifest !== 'object' || Array.isArray(parsedManifest)) {
      this.throwManifestValidationError(
        'Adoption-pack manifest must be a plain object.',
        sourceKind,
        sourceRef,
        'manifest',
      );
    }

    const manifestRecord = parsedManifest as Record<string, unknown>;

    return {
      schemaVersion: this.readManifestRequiredString(
        manifestRecord.schemaVersion,
        'manifest.schemaVersion',
        sourceKind,
        sourceRef,
      ),
      packId: this.readManifestRequiredString(
        manifestRecord.packId,
        'manifest.packId',
        sourceKind,
        sourceRef,
      ),
      packVersion: this.readManifestRequiredString(
        manifestRecord.packVersion,
        'manifest.packVersion',
        sourceKind,
        sourceRef,
      ),
      status: this.readManifestRequiredString(
        manifestRecord.status,
        'manifest.status',
        sourceKind,
        sourceRef,
      ),
      ownerModule: this.readManifestRequiredString(
        manifestRecord.ownerModule,
        'manifest.ownerModule',
        sourceKind,
        sourceRef,
      ),
      sourceKind,
      sourceRef,
      profiles: this.readManifestProfileList(
        manifestRecord.profiles,
        'manifest.profiles',
        sourceKind,
        sourceRef,
      ),
      managedAssetGroups: this.readManifestEnumList(
        manifestRecord.managedAssetGroups,
        'manifest.managedAssetGroups',
        ADOPTION_PACK_MANAGED_ASSET_GROUP_VALUES,
        sourceKind,
        sourceRef,
      ) as AdoptionPackManifest['managedAssetGroups'],
      managedPaths: this.readManifestStringList(
        manifestRecord.managedPaths,
        'manifest.managedPaths',
        sourceKind,
        sourceRef,
      ),
      canonicalSourceRefs: this.readManifestStringList(
        manifestRecord.canonicalSourceRefs,
        'manifest.canonicalSourceRefs',
        sourceKind,
        sourceRef,
      ),
      sourcePackRefs: this.readManifestStringList(
        manifestRecord.sourcePackRefs,
        'manifest.sourcePackRefs',
        sourceKind,
        sourceRef,
      ),
      hostTargets: this.readManifestEnumList(
        manifestRecord.hostTargets,
        'manifest.hostTargets',
        HOST_DISTRIBUTION_TARGET_VALUES,
        sourceKind,
        sourceRef,
      ) as AdoptionPackManifest['hostTargets'],
      handoffBridge: this.readManifestEnumValue(
        manifestRecord.handoffBridge,
        'manifest.handoffBridge',
        HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES,
        sourceKind,
        sourceRef,
      ) as AdoptionPackManifest['handoffBridge'],
      verificationProfileRefs: this.readManifestStringList(
        manifestRecord.verificationProfileRefs,
        'manifest.verificationProfileRefs',
        sourceKind,
        sourceRef,
      ),
      upgradePolicy: this.readManifestEnumValue(
        manifestRecord.upgradePolicy,
        'manifest.upgradePolicy',
        ADOPTION_PACK_UPGRADE_POLICY_VALUES,
        sourceKind,
        sourceRef,
      ) as AdoptionPackManifest['upgradePolicy'],
      removePolicy: this.readManifestEnumValue(
        manifestRecord.removePolicy,
        'manifest.removePolicy',
        ADOPTION_PACK_REMOVE_POLICY_VALUES,
        sourceKind,
        sourceRef,
      ) as AdoptionPackManifest['removePolicy'],
      docsEntrypoints: this.readManifestStringList(
        manifestRecord.docsEntrypoints,
        'manifest.docsEntrypoints',
        sourceKind,
        sourceRef,
      ),
    };
  }

  private readManifestProfileList(
    value: unknown,
    fieldName: string,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
  ): AdoptionPackManifest['profiles'] {
    if (!Array.isArray(value)) {
      this.throwManifestValidationError(
        `Field "${fieldName}" must be an array.`,
        sourceKind,
        sourceRef,
        fieldName,
      );
    }

    return value.map((profile, index) =>
      this.readManifestProfile(profile, `${fieldName}[${index}]`, sourceKind, sourceRef),
    );
  }

  private readManifestProfile(
    value: unknown,
    fieldName: string,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
  ): AdoptionPackManifest['profiles'][number] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      this.throwManifestValidationError(
        `Field "${fieldName}" must be an object.`,
        sourceKind,
        sourceRef,
        fieldName,
      );
    }

    const profileRecord = value as Record<string, unknown>;

    return {
      profileId: this.readManifestRequiredString(
        profileRecord.profileId,
        `${fieldName}.profileId`,
        sourceKind,
        sourceRef,
      ),
      displayName: this.readManifestRequiredString(
        profileRecord.displayName,
        `${fieldName}.displayName`,
        sourceKind,
        sourceRef,
      ),
      workflowAssetIds: this.readManifestStringList(
        profileRecord.workflowAssetIds,
        `${fieldName}.workflowAssetIds`,
        sourceKind,
        sourceRef,
      ),
      commandEntrypoints: this.readManifestStringList(
        profileRecord.commandEntrypoints,
        `${fieldName}.commandEntrypoints`,
        sourceKind,
        sourceRef,
      ),
      guideEntrypoints: this.readManifestStringList(
        profileRecord.guideEntrypoints,
        `${fieldName}.guideEntrypoints`,
        sourceKind,
        sourceRef,
      ),
      standardsPackRefs: this.readManifestStringList(
        profileRecord.standardsPackRefs,
        `${fieldName}.standardsPackRefs`,
        sourceKind,
        sourceRef,
      ),
      hostTargets: this.readManifestEnumList(
        profileRecord.hostTargets,
        `${fieldName}.hostTargets`,
        HOST_DISTRIBUTION_TARGET_VALUES,
        sourceKind,
        sourceRef,
      ) as AdoptionPackManifest['profiles'][number]['hostTargets'],
      bootstrapActions: this.readManifestStringList(
        profileRecord.bootstrapActions,
        `${fieldName}.bootstrapActions`,
        sourceKind,
        sourceRef,
      ),
      workspaceModePolicy: this.readManifestEnumValue(
        profileRecord.workspaceModePolicy,
        `${fieldName}.workspaceModePolicy`,
        ADOPTION_PACK_WORKSPACE_MODE_POLICY_VALUES,
        sourceKind,
        sourceRef,
      ) as AdoptionPackManifest['profiles'][number]['workspaceModePolicy'],
    };
  }

  private readManifestStringList(
    value: unknown,
    fieldName: string,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
  ): string[] {
    if (!Array.isArray(value)) {
      this.throwManifestValidationError(
        `Field "${fieldName}" must be an array.`,
        sourceKind,
        sourceRef,
        fieldName,
      );
    }

    return value.map((entry, index) =>
      this.readManifestRequiredString(entry, `${fieldName}[${index}]`, sourceKind, sourceRef),
    );
  }

  private readManifestEnumList(
    value: unknown,
    fieldName: string,
    allowedValues: Set<string>,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
  ): string[] {
    const normalizedValues = this.readManifestStringList(value, fieldName, sourceKind, sourceRef);
    return normalizedValues.map((entry, index) =>
      this.readManifestEnumValue(
        entry,
        `${fieldName}[${index}]`,
        allowedValues,
        sourceKind,
        sourceRef,
      ),
    );
  }

  private readManifestEnumValue(
    value: unknown,
    fieldName: string,
    allowedValues: Set<string>,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
  ): string {
    const normalizedValue = this.readManifestRequiredString(
      value,
      fieldName,
      sourceKind,
      sourceRef,
    );
    if (!allowedValues.has(normalizedValue)) {
      this.throwManifestValidationError(
        `Field "${fieldName}" contains unsupported value.`,
        sourceKind,
        sourceRef,
        fieldName,
        undefined,
        {
          value: normalizedValue,
          allowedValues: Array.from(allowedValues),
        },
      );
    }

    return normalizedValue;
  }

  private readManifestRequiredString(
    value: unknown,
    fieldName: string,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
  ): string {
    try {
      return readRequiredString(value, fieldName, GovernorErrorCode.STANDARDS_PACK_INVALID);
    } catch (error) {
      this.throwManifestValidationError(
        standardizeError(error).message || `Field "${fieldName}" is invalid.`,
        sourceKind,
        sourceRef,
        fieldName,
        error,
      );
    }
  }

  private throwManifestValidationError(
    message: string,
    sourceKind: AdoptionPackSourceKind,
    sourceRef: string,
    fieldName: string,
    cause?: unknown,
    extraDetails?: Record<string, unknown>,
  ): never {
    throw new RuntimeError(
      GovernorErrorCode.STANDARDS_PACK_INVALID,
      message,
      {
        sourceKind,
        sourceRef,
        fieldName,
        ...extraDetails,
      },
      cause,
    );
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
