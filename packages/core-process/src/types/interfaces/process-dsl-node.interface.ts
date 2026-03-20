import type { ProcessNodeType } from "../../constants/compiler-ir.constant.js";
import type { ProcessDslNodeLimits } from "./process-dsl-node-limits.interface.js";

/**
 * Describes one process node in DSL input payload.
 */
export interface ProcessDslNode {
  nodeId?: string;
  stageId?: string;
  nodeType?: ProcessNodeType;
  routeKey?: string;
  roleProfileId?: string;
  inputSchemaRef?: string;
  outputSchemaRef?: string;
  retryPolicyRef?: string;
  timeoutPolicyRef?: string;
  budgetPolicyRef?: string;
  limits?: ProcessDslNodeLimits;
}
