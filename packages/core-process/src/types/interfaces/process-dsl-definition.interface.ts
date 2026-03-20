import type { ProcessDslGlobals } from "../aliases/process-dsl-globals.type.js";
import type { ProcessDslEdge } from "./process-dsl-edge.interface.js";
import type { ProcessDslNode } from "./process-dsl-node.interface.js";

/**
 * Defines compiler input payload for process orchestration.
 */
export interface ProcessDslDefinition {
  processId: string;
  executionId: string;
  entryNodeId: string;
  nodes: ProcessDslNode[];
  edges: ProcessDslEdge[];
  globals?: ProcessDslGlobals;
}
