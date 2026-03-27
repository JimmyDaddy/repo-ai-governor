import type { GovernorErrorCode } from '@repo-ai-governor/shared';
import type {
  RuntimeExecutionStatus,
  RuntimeTimeoutScope,
} from '../../constants/runtime.constant.js';
import type { RuntimeStageResult } from './runtime-stage.interface.js';

/**
 * Describes structured interruption metadata for timeout/cancelled execution.
 */
export interface RuntimeExecutionInterruption {
  reason: RuntimeExecutionStatus.TIMEOUT | RuntimeExecutionStatus.CANCELLED;
  errorCode: GovernorErrorCode;
  message: string;
  timeoutScope?: RuntimeTimeoutScope;
}

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
