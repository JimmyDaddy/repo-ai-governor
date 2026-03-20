import type { ProcessNodeType } from "../../../../core-process/src/constants/index.js";

/**
 * Describes stage execution context passed to runtime stage handlers.
 */
export interface RuntimeStageContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  attempt: number;
  elapsedFlowMs: number;
  input: Record<string, unknown>;
}
