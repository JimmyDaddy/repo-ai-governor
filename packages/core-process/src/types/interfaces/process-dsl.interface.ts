import type { ProcessNodeType } from "../../constants/compiler-ir.constant.js";
import type { ProcessDslGlobals } from "../aliases/process-dsl-globals.type.js";

/**
 * Defines Loop node guardrails declared by process DSL.
 */
export interface ProcessDslNodeLimits {
  maxCycles?: number;
  maxWallTimeSeconds?: number;
}

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

/**
 * Describes one directed edge between process nodes.
 */
export interface ProcessDslEdge {
  fromNodeId: string;
  toNodeId: string;
  conditionKey?: string;
}

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
