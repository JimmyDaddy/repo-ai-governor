import type { ProcessNodeType } from '../../constants/compiler-ir.constant.js';
import type { ProcessDslGlobals } from '../aliases/process-dsl-globals.type.js';
import type { ProcessCompilerIssue } from './process-compiler-issue.interface.js';

/**
 * Defines normalized Loop limits in compiled IR.
 */
export interface ProcessIrNodeLimits {
  maxCycles: number;
  maxWallTimeSeconds: number;
}

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

/**
 * Describes one normalized edge entry in compiled IR.
 */
export interface ProcessIrEdge {
  fromNodeId: string;
  toNodeId: string;
  conditionKey?: string;
}

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
