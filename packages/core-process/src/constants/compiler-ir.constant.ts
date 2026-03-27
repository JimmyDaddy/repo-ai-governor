/**
 * Defines the current Compiler IR semantic version.
 *
 * Why this exists:
 * runtime compatibility checks should rely on one stable source instead of
 * duplicated version literals across compiler/runtime modules.
 */
export const PROCESS_IR_VERSION = '1.0.0';

/**
 * Defines the supported major IR version for runtime compatibility checks.
 */
export const PROCESS_IR_SUPPORTED_MAJOR_VERSION = 1;

/**
 * Defines the default `<workspace_root>` relative directory segments for IR snapshots.
 */
export const COMPILED_IR_ROOT_SEGMENTS = ['context', 'compiled-ir'] as const;

/**
 * Defines supported DSL/runtime node types for process orchestration.
 */
export enum ProcessNodeType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  LOOP = 'loop',
  CONDITION = 'condition',
}

/**
 * Defines compiler issue severity levels.
 */
export enum ProcessCompilerSeverity {
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Defines compiler issue codes for deterministic diagnostics.
 */
export enum ProcessCompilerIssueCode {
  PROCESS_ID_REQUIRED = 'PROCESS_ID_REQUIRED',
  EXECUTION_ID_REQUIRED = 'EXECUTION_ID_REQUIRED',
  ENTRY_NODE_ID_REQUIRED = 'ENTRY_NODE_ID_REQUIRED',
  NODES_REQUIRED = 'NODES_REQUIRED',
  ENTRY_NODE_NOT_FOUND = 'ENTRY_NODE_NOT_FOUND',
  NODE_ID_REQUIRED = 'NODE_ID_REQUIRED',
  NODE_ID_DUPLICATED = 'NODE_ID_DUPLICATED',
  NODE_TYPE_REQUIRED = 'NODE_TYPE_REQUIRED',
  NODE_TYPE_INVALID = 'NODE_TYPE_INVALID',
  STAGE_ID_REQUIRED = 'STAGE_ID_REQUIRED',
  ROUTE_KEY_REQUIRED = 'ROUTE_KEY_REQUIRED',
  ROLE_PROFILE_ID_REQUIRED = 'ROLE_PROFILE_ID_REQUIRED',
  INPUT_SCHEMA_REF_REQUIRED = 'INPUT_SCHEMA_REF_REQUIRED',
  OUTPUT_SCHEMA_REF_REQUIRED = 'OUTPUT_SCHEMA_REF_REQUIRED',
  RETRY_POLICY_REF_REQUIRED = 'RETRY_POLICY_REF_REQUIRED',
  TIMEOUT_POLICY_REF_REQUIRED = 'TIMEOUT_POLICY_REF_REQUIRED',
  BUDGET_POLICY_REF_REQUIRED = 'BUDGET_POLICY_REF_REQUIRED',
  LOOP_MAX_CYCLES_REQUIRED = 'LOOP_MAX_CYCLES_REQUIRED',
  LOOP_MAX_WALL_TIME_REQUIRED = 'LOOP_MAX_WALL_TIME_REQUIRED',
  LOOP_LIMITS_IGNORED = 'LOOP_LIMITS_IGNORED',
  EDGE_FROM_NODE_NOT_FOUND = 'EDGE_FROM_NODE_NOT_FOUND',
  EDGE_TO_NODE_NOT_FOUND = 'EDGE_TO_NODE_NOT_FOUND',
}
