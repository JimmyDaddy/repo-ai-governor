import type { AgentsProjectionNowProviderContract } from "../types/index.js";

/**
 * Provides clock samples used by standards projection metadata.
 *
 * Why this exists:
 * projector metadata must include stable `projectedAt` timestamps, and a class-
 * based provider keeps clock access deterministic in tests and extensible later.
 */
export abstract class AgentsProjectionNowProvider implements AgentsProjectionNowProviderContract {
  /**
   * Samples one timestamp for projection metadata.
   * @returns Current clock value as a Date instance.
   */
  public abstract now(): Date;
}
