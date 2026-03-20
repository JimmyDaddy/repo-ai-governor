import type { RuntimeLoopContext } from "./runtime-loop-context.interface.js";

/**
 * Defines pluggable loop continuation controller.
 */
export interface RuntimeLoopController {
  /**
   * Decides whether one loop node should continue to the next cycle.
   * @param context Loop context with cycle counters and guardrails.
   * @returns True when runtime should continue looping.
   */
  shouldContinue(context: RuntimeLoopContext): Promise<boolean> | boolean;
}
