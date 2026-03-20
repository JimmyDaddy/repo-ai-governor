import type { RuntimeStageContext } from "../interfaces/runtime-stage.interface.js";

/**
 * Defines per-node stage input map keyed by node id.
 */
export type RuntimeStageInputMap = Record<string, Record<string, unknown>>;

/**
 * Defines runtime stage handler callback signature.
 */
export type RuntimeStageHandler = (
  context: RuntimeStageContext,
) => Promise<Record<string, unknown> | undefined>;
