import type { ProcessNodeType } from '../../constants/compiler-ir.constant.js';
import type { ProcessDslGlobals } from '../aliases/process-dsl-globals.type.js';
import type { ProcessCompilerIssueSnapshot } from './process-compiler-issue.interface.js';

/**
 * Defines snake_case loop limits payload persisted in IR snapshot.
 */
export interface ProcessIrNodeLimitsSnapshot {
  max_cycles: number;
  max_wall_time_seconds: number;
}

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

/**
 * Defines snake_case edge payload persisted in IR snapshot.
 */
export interface ProcessIrEdgeSnapshot {
  from_node_id: string;
  to_node_id: string;
  condition_key?: string;
}

/**
 * Defines snake_case JSON contract persisted under `context/compiled-ir`.
 */
export interface ProcessCompiledIrSnapshot {
  ir_version: string;
  process_id: string;
  execution_id: string;
  compiled_at: string;
  entry_node_id: string;
  nodes: ProcessIrNodeSnapshot[];
  edges: ProcessIrEdgeSnapshot[];
  globals: ProcessDslGlobals;
  compile_warnings: ProcessCompilerIssueSnapshot[];
  compile_errors: ProcessCompilerIssueSnapshot[];
}
