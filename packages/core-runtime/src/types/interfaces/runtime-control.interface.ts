import type { ProcessIrEdge } from "../../../../core-process/src/types/index.js";
import type { RuntimeNowProvider } from "../../providers/index.js";
import type { RuntimeStageInputMap } from "../aliases/index.js";

/**
 * Describes condition-routing context used by runtime condition resolver.
 */
export interface RuntimeConditionContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  outgoingEdges: ProcessIrEdge[];
  stageOutput: Record<string, unknown>;
}

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

/**
 * Describes runtime loop decision context.
 */
export interface RuntimeLoopContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  cycle: number;
  maxCycles: number;
  maxWallTimeSeconds: number;
  elapsedLoopMs: number;
  stageOutput: Record<string, unknown>;
}

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
