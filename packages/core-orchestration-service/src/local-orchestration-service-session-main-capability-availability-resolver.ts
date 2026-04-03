import {
  SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS,
  SESSION_MAIN_CAPABILITY_ID,
} from './constants/index.js';
import type { SessionMainCapabilityAvailability, SessionMainCapabilityId } from './types/index.js';

/**
 * Resolves dynamic capability availability overlays without re-owning projection truth.
 *
 * Why this exists:
 * the orchestration-owned explainer needs one normalizing layer that can merge static capability
 * semantics with optional runtime-exported availability facts, while keeping help/catalog truth
 * immutable and session-local readiness strictly additive.
 */
export class LocalOrchestrationServiceSessionMainCapabilityAvailabilityResolver {
  /**
   * Resolves one normalized availability overlay set for the requested capability ids.
   * @param capabilityIds Governed capability ids referenced by the current answer path.
   * @param options Optional runtime-exported availability facts and routing selection hints.
   * @returns Availability overlay entries in the same capability order.
   */
  public resolveAvailability(
    capabilityIds: readonly SessionMainCapabilityId[],
    options?: {
      runtimeAvailability?: readonly SessionMainCapabilityAvailability[];
      selectedSurface?: string;
      selectedBy?: string;
    },
  ): SessionMainCapabilityAvailability[] {
    const runtimeAvailabilityByCapabilityId = new Map(
      (options?.runtimeAvailability ?? []).map((availability) => [
        availability.capabilityId,
        this.cloneAvailability(availability),
      ]),
    );

    return capabilityIds.map((capabilityId) => {
      const runtimeAvailability = runtimeAvailabilityByCapabilityId.get(capabilityId);
      if (runtimeAvailability) {
        return runtimeAvailability;
      }

      return this.createFallbackAvailability(capabilityId, options);
    });
  }

  private createFallbackAvailability(
    capabilityId: SessionMainCapabilityId,
    options?:
      | {
          runtimeAvailability?: readonly SessionMainCapabilityAvailability[];
          selectedSurface?: string;
          selectedBy?: string;
        }
      | undefined,
  ): SessionMainCapabilityAvailability {
    const selectedSurface = this.readOptionalString(options?.selectedSurface);
    const selectedBy = this.readOptionalString(options?.selectedBy);

    if (capabilityId === SESSION_MAIN_CAPABILITY_ID.CONNECT) {
      return {
        capabilityId,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      };
    }

    return {
      capabilityId,
      status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      ...(selectedSurface ? { selectedSurface } : {}),
      ...(selectedBy ? { selectedBy } : {}),
    };
  }

  private cloneAvailability(
    availability: SessionMainCapabilityAvailability,
  ): SessionMainCapabilityAvailability {
    return {
      ...availability,
    };
  }

  private readOptionalString(candidate: string | undefined): string | undefined {
    return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : undefined;
  }
}
