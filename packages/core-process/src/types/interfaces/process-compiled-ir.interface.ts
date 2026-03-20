import type { ProcessDslGlobals } from "../aliases/process-dsl-globals.type.js";
import type { ProcessCompilerIssue } from "./process-compiler-issue.interface.js";
import type { ProcessIrEdge } from "./process-ir-edge.interface.js";
import type { ProcessIrNode } from "./process-ir-node.interface.js";

/**
 * Defines the Compiler IR v1 contract consumed by runtime.
 */
export interface ProcessCompiledIr {
  irVersion: string;
  processId: string;
  executionId: string;
  compiledAt: string;
  entryNodeId: string;
  nodes: ProcessIrNode[];
  edges: ProcessIrEdge[];
  globals: ProcessDslGlobals;
  compileWarnings: ProcessCompilerIssue[];
  compileErrors: ProcessCompilerIssue[];
}
