import type { GovernorErrorCode } from "../../../../shared/src/errors/index.js";
import type {
  RuntimeExecutionStatus,
  RuntimeTimeoutScope,
} from "../../constants/runtime.constant.js";

/**
 * Describes structured interruption metadata for timeout/cancelled execution.
 */
export interface RuntimeExecutionInterruption {
  reason: RuntimeExecutionStatus.TIMEOUT | RuntimeExecutionStatus.CANCELLED;
  errorCode: GovernorErrorCode;
  message: string;
  timeoutScope?: RuntimeTimeoutScope;
}
