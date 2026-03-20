import type { RuntimeExecutionStatus } from "../../constants/runtime.constant.js";
import type { RuntimeExecutionInterruption } from "./runtime-execution-interruption.interface.js";
import type { RuntimeStageResult } from "./runtime-stage-result.interface.js";

/**
 * Describes one process runtime execution result.
 */
export interface RuntimeExecutionResult {
  processId: string;
  executionId: string;
  status: RuntimeExecutionStatus;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  visitedNodeIds: string[];
  stageResults: RuntimeStageResult[];
  interruption?: RuntimeExecutionInterruption;
}
