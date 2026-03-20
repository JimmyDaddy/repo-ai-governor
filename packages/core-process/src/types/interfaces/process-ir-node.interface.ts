import type { ProcessNodeType } from "../../constants/compiler-ir.constant.js";
import type { ProcessIrNodeLimits } from "./process-ir-node-limits.interface.js";

/**
 * Describes one normalized node entry in compiled IR.
 */
export interface ProcessIrNode {
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  routeKey: string;
  roleProfileId: string;
  inputSchemaRef: string;
  outputSchemaRef: string;
  retryPolicyRef: string;
  timeoutPolicyRef: string;
  budgetPolicyRef: string;
  limits?: ProcessIrNodeLimits;
}
