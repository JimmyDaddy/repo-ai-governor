import type {
  SessionMainCapabilityAvailabilityStatus,
  SessionMainCapabilityId,
} from '../aliases/index.js';

/**
 * Defines one dynamic availability overlay entry projected onto a governed capability.
 */
export interface SessionMainCapabilityAvailability {
  readonly capabilityId: SessionMainCapabilityId;
  readonly status: SessionMainCapabilityAvailabilityStatus;
  readonly reason?: string;
  readonly selectedSurface?: string;
  readonly selectedBy?: string;
  readonly requiresSetup?: boolean;
  readonly suggestedNextStep?: string;
}
