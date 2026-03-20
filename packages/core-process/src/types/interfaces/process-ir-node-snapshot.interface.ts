import type { ProcessNodeType } from "../../constants/compiler-ir.constant.js";
import type { ProcessIrNodeLimitsSnapshot } from "./process-ir-node-limits-snapshot.interface.js";

/**
 * Defines snake_case node payload persisted in IR snapshot.
 */
export interface ProcessIrNodeSnapshot {
  node_id: string;
  stage_id: string;
  node_type: ProcessNodeType;
  route_key: string;
  role_profile_id: string;
  input_schema_ref: string;
  output_schema_ref: string;
  retry_policy_ref: string;
  timeout_policy_ref: string;
  budget_policy_ref: string;
  limits?: ProcessIrNodeLimitsSnapshot;
}
