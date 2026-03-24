import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
  IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY,
  type IdeStandardsSourceId,
} from "../constants/ide-standards-source.constant.js";
import type {
  IdeResolvedStandardsSource,
  IdeStandardsSourceDescriptor,
} from "../types/interfaces/ide-command-wrapper.interface.js";

/**
 * Resolves stable standards source IDs into self-hosted file mappings for wrapper metadata.
 */
export class IdeStandardsSourceRuntime {
  private readonly standardsSourceRegistryById: ReadonlyMap<
    IdeStandardsSourceId,
    IdeStandardsSourceDescriptor
  >;

  /**
   * Creates one standards source resolver with optional registry override.
   * @param standardsSourceRegistry Optional source registry override.
   */
  public constructor(standardsSourceRegistry?: readonly IdeStandardsSourceDescriptor[]) {
    const sourceRegistry =
      standardsSourceRegistry ?? IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY;
    this.standardsSourceRegistryById = new Map(
      sourceRegistry.map((sourceDescriptor) => [sourceDescriptor.sourceId, sourceDescriptor]),
    );
  }

  /**
   * Returns the default ordered standards source ID baseline.
   * @returns Ordered source IDs consumed by IDE wrapper defaults.
   */
  public resolveDefaultSourceIds(): IdeStandardsSourceId[] {
    return [...IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS];
  }

  /**
   * Resolves ordered source IDs into self-hosted file mappings.
   * @param sourceIds Ordered source IDs injected by the wrapper.
   * @returns Resolved self-hosted source descriptors.
   */
  public resolveSources(sourceIds: readonly IdeStandardsSourceId[]): IdeResolvedStandardsSource[] {
    return sourceIds.map((sourceId) => {
      const sourceDescriptor = this.standardsSourceRegistryById.get(sourceId);
      if (!sourceDescriptor) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `Missing self-hosted standards source mapping for "${sourceId}".`,
          {
            sourceId,
          },
        );
      }

      return {
        sourceId,
        sourceKind: sourceDescriptor.sourceKind,
        resolvedPath: sourceDescriptor.defaultSelfHostedPath,
      };
    });
  }
}
