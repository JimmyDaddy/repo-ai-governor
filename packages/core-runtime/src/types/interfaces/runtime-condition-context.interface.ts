import type { ProcessIrEdge } from "../../../../core-process/src/types/index.js";

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
