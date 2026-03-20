/**
 * Provides clock samples used by runtime duration and timeout decisions.
 *
 * Why this exists:
 * class-based providers keep runtime time access extensible, so tests and
 * custom environments can plug deterministic or virtual clocks.
 */
export abstract class RuntimeNowProvider {
  /**
   * Samples one timestamp for runtime accounting.
   * @returns Current clock value as a Date instance.
   */
  public abstract now(): Date;
}
