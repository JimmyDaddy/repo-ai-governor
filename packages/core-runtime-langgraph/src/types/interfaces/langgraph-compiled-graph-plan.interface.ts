import type {
  ProcessCompilerIssue,
  ProcessIrNodeLimits,
  ProcessNodeType,
} from "@repo-ai-governor/core-process";
import type {
  LangGraphCheckpointerStateKey,
  LangGraphEdgeBehavior,
  LangGraphNodeBehavior,
  LangGraphReducedStateKey,
} from "../../constants/index.js";

export interface LangGraphCompiledGraphNode {
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  behavior: LangGraphNodeBehavior;
  routeKey: string;
  roleProfileId: string;
  inputSchemaRef: string;
  outputSchemaRef: string;
  retryPolicyRef: string;
  timeoutPolicyRef: string;
  budgetPolicyRef: string;
  incomingEdgeIds: string[];
  outgoingEdgeIds: string[];
  limits?: ProcessIrNodeLimits;
}

export interface LangGraphCompiledGraphEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  behavior: LangGraphEdgeBehavior;
  conditionKey?: string;
}

export interface LangGraphCompiledGraphPlan {
  processId: string;
  executionId: string;
  irVersion: string;
  entryNodeId: string;
  nodes: LangGraphCompiledGraphNode[];
  edges: LangGraphCompiledGraphEdge[];
  terminalNodeIds: string[];
  reducedStateKeys: LangGraphReducedStateKey[];
  checkpointerStateKeys: LangGraphCheckpointerStateKey[];
  compileWarnings: ProcessCompilerIssue[];
}
