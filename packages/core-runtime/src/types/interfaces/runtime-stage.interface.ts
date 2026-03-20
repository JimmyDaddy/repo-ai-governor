import type { ProcessNodeType } from "../../../../core-process/src/constants/index.js";
import type { GovernorErrorCode } from "../../../../shared/src/errors/index.js";
import type { RuntimeStageStatus } from "../../constants/runtime.constant.js";

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

/**
 * Describes one runtime stage execution result row.
 */
export interface RuntimeStageResult {
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  status: RuntimeStageStatus;
  attempt: number;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  output?: Record<string, unknown>;
  errorCode?: GovernorErrorCode;
  errorMessage?: string;
}
