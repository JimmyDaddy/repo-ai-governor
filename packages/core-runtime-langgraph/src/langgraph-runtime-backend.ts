import type { ProcessCompiledIr } from "@repo-ai-governor/core-process";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { CompiledIrGraphAdapter } from "./compiled-ir-graph-adapter.js";
import {
  LANGGRAPH_RUNTIME_INTERRUPT_KINDS,
  LANGGRAPH_RUNTIME_TERMINAL_STATUSES,
  type LangGraphRuntimeExecutionStatus,
  type LangGraphRuntimeTerminalStatus,
} from "./constants/index.js";
import type { LangGraphPreparedExecution, LangGraphRuntimeLifecycleEvent } from "./types/index.js";

function formatRfc3339Seconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

export class LangGraphRuntimeBackend {
  constructor(
    private readonly compiledIrGraphAdapter: CompiledIrGraphAdapter = new CompiledIrGraphAdapter(),
    private readonly nowProvider: () => Date = () => new Date(),
  ) {}

  public prepare(compiledIr: ProcessCompiledIr): LangGraphPreparedExecution {
    const plan = this.compiledIrGraphAdapter.adapt(compiledIr);
    const entryNode = plan.nodes.find((node) => node.nodeId === plan.entryNodeId);
    if (!entryNode) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_ENTRY_NODE_NOT_FOUND,
        `Entry node "${plan.entryNodeId}" not found in LangGraph plan.`,
        {
          processId: plan.processId,
          executionId: plan.executionId,
          entryNodeId: plan.entryNodeId,
        },
      );
    }

    const currentStatus: LangGraphRuntimeExecutionStatus = "pending";
    const occurredAt = formatRfc3339Seconds(this.nowProvider());
    const lifecycleEvents: LangGraphRuntimeLifecycleEvent[] = [
      {
        type: "execution.ready",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        nodeId: plan.entryNodeId,
        message: "LangGraph backend skeleton prepared the execution envelope.",
      },
      {
        type: "graph.compiled",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        message: `Compiled IR was adapted into a graph plan with ${plan.nodes.length} node(s) and ${plan.edges.length} edge(s).`,
      },
      ...plan.nodes.map<LangGraphRuntimeLifecycleEvent>((node) => ({
        type: "node.ready",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        nodeId: node.nodeId,
        message: `Node "${node.nodeId}" is registered for graph scheduling.`,
      })),
      ...plan.edges.map<LangGraphRuntimeLifecycleEvent>((edge) => ({
        type: "edge.ready",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        edgeId: edge.edgeId,
        message: `Edge "${edge.edgeId}" is registered for graph routing.`,
      })),
    ];

    return {
      plan,
      initialNodeIds: [entryNode.nodeId],
      currentStatus,
      supportedInterruptKinds: [...LANGGRAPH_RUNTIME_INTERRUPT_KINDS],
      supportedTerminalStatuses: [...LANGGRAPH_RUNTIME_TERMINAL_STATUSES],
      lifecycleEvents,
    };
  }
}
