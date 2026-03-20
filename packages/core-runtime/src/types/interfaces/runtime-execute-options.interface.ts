import type { RuntimeNowProvider } from "../../providers/index.js";
import type { RuntimeStageInputMap } from "../aliases/index.js";
import type { RuntimeConditionResolver } from "./runtime-condition-resolver.interface.js";
import type { RuntimeLoopController } from "./runtime-loop-controller.interface.js";

/**
 * Describes runtime execution options for control-flow baseline.
 */
export interface RuntimeExecuteOptions {
  stageTimeoutMs?: number;
  flowTimeoutMs?: number;
  maxTransitions?: number;
  signal?: AbortSignal;
  stageInputs?: RuntimeStageInputMap;
  conditionResolver?: RuntimeConditionResolver;
  loopController?: RuntimeLoopController;
  nowProvider?: RuntimeNowProvider;
}
