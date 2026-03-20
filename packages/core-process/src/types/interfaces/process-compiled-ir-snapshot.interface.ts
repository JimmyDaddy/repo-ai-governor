import type { ProcessDslGlobals } from "../aliases/process-dsl-globals.type.js";
import type { ProcessCompilerIssueSnapshot } from "./process-compiler-issue-snapshot.interface.js";
import type { ProcessIrEdgeSnapshot } from "./process-ir-edge-snapshot.interface.js";
import type { ProcessIrNodeSnapshot } from "./process-ir-node-snapshot.interface.js";

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
