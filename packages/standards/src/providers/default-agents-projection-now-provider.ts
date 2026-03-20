import { AgentsProjectionNowProvider } from "./agents-projection-now-provider.abstract.js";

/**
 * Uses system wall clock for standards projection runtime.
 */
export class DefaultAgentsProjectionNowProvider extends AgentsProjectionNowProvider {
  /**
   * Samples current system time.
   * @returns Current Date from host environment.
   */
  public override now(): Date {
    return new Date();
  }
}
