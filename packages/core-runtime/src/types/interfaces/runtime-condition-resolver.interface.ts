import type { RuntimeConditionContext } from "./runtime-condition-context.interface.js";

/**
 * Defines pluggable condition resolver used by condition nodes.
 */
export interface RuntimeConditionResolver {
  /**
   * Resolves the next condition key from stage output and outgoing edge candidates.
   * @param context Runtime condition context.
   * @returns Condition key for edge matching, or `undefined` to use default route.
   */
  resolveConditionKey(
    context: RuntimeConditionContext,
  ): Promise<string | undefined> | string | undefined;
}
