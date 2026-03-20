import type { RuntimeStageContext } from "../interfaces/runtime-stage-context.interface.js";

/**
 * Defines runtime stage handler callback signature.
 */
export type RuntimeStageHandler = (
  context: RuntimeStageContext,
) => Promise<Record<string, unknown> | undefined>;
