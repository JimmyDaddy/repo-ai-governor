import { RuntimeNowProvider } from './runtime-now-provider.abstract.js';

/**
 * Uses system wall clock for production runtime execution.
 */
export class DefaultRuntimeNowProvider extends RuntimeNowProvider {
  /**
   * Samples current system time.
   * @returns Current Date from the host environment.
   */
  public override now(): Date {
    return new Date();
  }
}
