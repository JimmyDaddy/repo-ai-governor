import {
  type ProcessCompiledIr,
  ProcessCompiler,
  type ProcessIrEdge,
  type ProcessIrNode,
  ProcessNodeType,
} from "@repo-ai-governor/core-process";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  LANGGRAPH_CHECKPOINTER_STATE_KEYS,
  LANGGRAPH_REDUCED_STATE_KEYS,
  type LangGraphEdgeBehavior,
  type LangGraphNodeBehavior,
} from "./constants/index.js";
import type {
  LangGraphCompiledGraphEdge,
  LangGraphCompiledGraphNode,
  LangGraphCompiledGraphPlan,
} from "./types/index.js";

export class CompiledIrGraphAdapter {
  constructor(private readonly processCompiler: ProcessCompiler = new ProcessCompiler()) {}

  public adapt(compiledIr: ProcessCompiledIr): LangGraphCompiledGraphPlan {
    this.processCompiler.assertIrVersionCompatibleOrThrow(compiledIr.irVersion);
    this.assertCompilableOrThrow(compiledIr);

    const nodeById = this.createNodeIndex(compiledIr.nodes);
    const entryNode = nodeById.get(compiledIr.entryNodeId);
    if (!entryNode) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_ENTRY_NODE_NOT_FOUND,
        `Entry node "${compiledIr.entryNodeId}" not found in compiled IR.`,
        {
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          entryNodeId: compiledIr.entryNodeId,
        },
      );
    }

    const edges = this.createGraphEdges(compiledIr.edges, nodeById);
    const incomingEdgeIdsByNodeId = new Map<string, string[]>();
    const outgoingEdgeIdsByNodeId = new Map<string, string[]>();

    for (const edge of edges) {
      const incoming = incomingEdgeIdsByNodeId.get(edge.toNodeId) ?? [];
      incoming.push(edge.edgeId);
      incomingEdgeIdsByNodeId.set(edge.toNodeId, incoming);

      const outgoing = outgoingEdgeIdsByNodeId.get(edge.fromNodeId) ?? [];
      outgoing.push(edge.edgeId);
      outgoingEdgeIdsByNodeId.set(edge.fromNodeId, outgoing);
    }

    const nodes = compiledIr.nodes.map((node) =>
      this.createGraphNode(
        node,
        incomingEdgeIdsByNodeId.get(node.nodeId) ?? [],
        outgoingEdgeIdsByNodeId.get(node.nodeId) ?? [],
      ),
    );

    return {
      processId: compiledIr.processId,
      executionId: compiledIr.executionId,
      irVersion: compiledIr.irVersion,
      entryNodeId: compiledIr.entryNodeId,
      nodes,
      edges,
      terminalNodeIds: nodes
        .filter((node) => node.outgoingEdgeIds.length === 0)
        .map((node) => node.nodeId),
      reducedStateKeys: [...LANGGRAPH_REDUCED_STATE_KEYS],
      checkpointerStateKeys: [...LANGGRAPH_CHECKPOINTER_STATE_KEYS],
      compileWarnings: [...compiledIr.compileWarnings],
    };
  }

  private assertCompilableOrThrow(compiledIr: ProcessCompiledIr): void {
    if (compiledIr.compileErrors.length === 0) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_IR_CONTAINS_COMPILE_ERRORS,
      "Compiled IR contains blocking compile errors and cannot be adapted into a LangGraph plan.",
      {
        processId: compiledIr.processId,
        executionId: compiledIr.executionId,
        compileErrorCount: compiledIr.compileErrors.length,
      },
    );
  }

  private createNodeIndex(nodes: ProcessIrNode[]): Map<string, ProcessIrNode> {
    return new Map(nodes.map((node) => [node.nodeId, node]));
  }

  private createGraphEdges(
    edges: ProcessIrEdge[],
    nodeById: Map<string, ProcessIrNode>,
  ): LangGraphCompiledGraphEdge[] {
    return edges.map((edge, index) => {
      const sourceNode = nodeById.get(edge.fromNodeId);
      if (!sourceNode) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_NODE_NOT_FOUND,
          `Source node "${edge.fromNodeId}" not found while building LangGraph edge plan.`,
          {
            fromNodeId: edge.fromNodeId,
            toNodeId: edge.toNodeId,
          },
        );
      }

      const targetNode = nodeById.get(edge.toNodeId);
      if (!targetNode) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_NODE_NOT_FOUND,
          `Target node "${edge.toNodeId}" not found while building LangGraph edge plan.`,
          {
            fromNodeId: edge.fromNodeId,
            toNodeId: edge.toNodeId,
          },
        );
      }

      return {
        edgeId: `${edge.fromNodeId}__${edge.toNodeId}__${index + 1}`,
        fromNodeId: edge.fromNodeId,
        toNodeId: targetNode.nodeId,
        behavior: this.resolveEdgeBehavior(sourceNode.nodeType, edge),
        ...(edge.conditionKey ? { conditionKey: edge.conditionKey } : {}),
      };
    });
  }

  private createGraphNode(
    node: ProcessIrNode,
    incomingEdgeIds: string[],
    outgoingEdgeIds: string[],
  ): LangGraphCompiledGraphNode {
    return {
      nodeId: node.nodeId,
      stageId: node.stageId,
      nodeType: node.nodeType,
      behavior: this.resolveNodeBehavior(node.nodeType),
      routeKey: node.routeKey,
      roleProfileId: node.roleProfileId,
      inputSchemaRef: node.inputSchemaRef,
      outputSchemaRef: node.outputSchemaRef,
      retryPolicyRef: node.retryPolicyRef,
      timeoutPolicyRef: node.timeoutPolicyRef,
      budgetPolicyRef: node.budgetPolicyRef,
      incomingEdgeIds,
      outgoingEdgeIds,
      ...(node.limits ? { limits: node.limits } : {}),
    };
  }

  private resolveNodeBehavior(nodeType: ProcessNodeType): LangGraphNodeBehavior {
    if (nodeType === ProcessNodeType.CONDITION) {
      return "branch";
    }

    if (nodeType === ProcessNodeType.PARALLEL) {
      return "fan_out";
    }

    if (nodeType === ProcessNodeType.LOOP) {
      return "loop";
    }

    return "invoke_stage";
  }

  private resolveEdgeBehavior(
    sourceNodeType: ProcessNodeType,
    edge: ProcessIrEdge,
  ): LangGraphEdgeBehavior {
    if (sourceNodeType === ProcessNodeType.CONDITION) {
      return "conditional";
    }

    if (sourceNodeType === ProcessNodeType.PARALLEL) {
      return "parallel";
    }

    if (sourceNodeType === ProcessNodeType.LOOP) {
      return edge.toNodeId === edge.fromNodeId ? "loop_continue" : "loop_exit";
    }

    return "direct";
  }
}
