import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  IDE_SURFACE_REGISTRY,
  IDE_WRAPPER_SUPPORTED_SURFACES,
  IdeEntrySurface,
  IdeSurfaceDegradeMode,
} from "../constants/ide-command-wrapper.constant.js";
import type { IdeSurfaceContract } from "../types/interfaces/ide-command-wrapper.interface.js";

/**
 * Resolves IDE surface contracts from one centralized registry.
 *
 * Why this exists:
 * multi-entry IDE/agent wrappers need one source of truth for capability claims,
 * degrade semantics, and reserved environment policy so surfaces do not drift.
 */
export class IdeSurfaceRegistryRuntime {
  private readonly surfaceContractsById: ReadonlyMap<IdeEntrySurface, IdeSurfaceContract>;

  /**
   * Creates one runtime registry with optional surface overrides.
   * @param surfaceContracts Optional registry override for tests or future extensions.
   */
  public constructor(surfaceContracts: readonly IdeSurfaceContract[] = IDE_SURFACE_REGISTRY) {
    this.surfaceContractsById = this.createSurfaceContractsById(surfaceContracts);
  }

  /**
   * Resolves one concrete surface contract with deterministic generic fallback.
   * @param surface Optional requested entry surface.
   * @returns Cloned surface contract metadata for wrapper consumption.
   */
  public resolveSurfaceContract(surface?: IdeEntrySurface): IdeSurfaceContract {
    const resolvedSurface = surface ?? IdeEntrySurface.GENERIC_IDE;
    const surfaceContract = this.surfaceContractsById.get(resolvedSurface);
    if (!surfaceContract) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Unsupported IDE entry surface "${surface}".`,
        {
          surface,
          supportedSurfaces: [...IDE_WRAPPER_SUPPORTED_SURFACES],
          nextAction:
            "Retry with one of the supported surfaces or omit surface to use generic_ide.",
        },
      );
    }

    return this.cloneSurfaceContract(surfaceContract);
  }

  /**
   * Lists cloned registry entries for contract tests and diagnostics.
   * @returns One cloned list of surface contracts.
   */
  public listSurfaceContracts(): IdeSurfaceContract[] {
    return Array.from(this.surfaceContractsById.values(), (surfaceContract) =>
      this.cloneSurfaceContract(surfaceContract),
    );
  }

  /**
   * Builds a validated map keyed by surface id.
   * @param surfaceContracts Raw registry entries.
   * @returns Registry map keyed by `IdeEntrySurface`.
   */
  private createSurfaceContractsById(
    surfaceContracts: readonly IdeSurfaceContract[],
  ): ReadonlyMap<IdeEntrySurface, IdeSurfaceContract> {
    const surfaceContractsById = new Map<IdeEntrySurface, IdeSurfaceContract>();
    for (const surfaceContract of surfaceContracts) {
      if (surfaceContractsById.has(surfaceContract.surfaceId)) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `Duplicate IDE surface registry entry "${surfaceContract.surfaceId}".`,
          {
            surfaceId: surfaceContract.surfaceId,
          },
        );
      }

      if (
        surfaceContract.degradeMode === IdeSurfaceDegradeMode.FALLBACK_TO_GENERIC_IDE &&
        surfaceContract.degradeTargetSurface !== IdeEntrySurface.GENERIC_IDE
      ) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `Surface "${surfaceContract.surfaceId}" must degrade to generic_ide.`,
          {
            surfaceId: surfaceContract.surfaceId,
            degradeTargetSurface: surfaceContract.degradeTargetSurface,
          },
        );
      }

      surfaceContractsById.set(
        surfaceContract.surfaceId,
        this.cloneSurfaceContract(surfaceContract),
      );
    }

    if (!surfaceContractsById.has(IdeEntrySurface.GENERIC_IDE)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'IDE surface registry must declare one "generic_ide" fallback entry.',
      );
    }

    return surfaceContractsById;
  }

  /**
   * Clones a registry contract so callers cannot mutate shared registry state.
   * @param surfaceContract Raw contract.
   * @returns Cloned contract object.
   */
  private cloneSurfaceContract(surfaceContract: IdeSurfaceContract): IdeSurfaceContract {
    return {
      ...surfaceContract,
      capabilities: [...surfaceContract.capabilities],
      reservedEnvironmentKeys: [...surfaceContract.reservedEnvironmentKeys],
    };
  }
}
