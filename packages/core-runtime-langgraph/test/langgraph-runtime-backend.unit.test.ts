import { ProcessCompiler, ProcessNodeType } from "@repo-ai-governor/core-process";
import { LangGraphRuntimeBackend } from "../src/index.js";

describe("core-runtime-langgraph backend skeleton", () => {
  it("prepares a graph execution envelope from compiled IR", () => {
    const compiler = new ProcessCompiler();
    const backend = new LangGraphRuntimeBackend();
    const compiledIr = compiler.compile({
      processId: "langgraph-backend-unit",
      executionId: "exec-langgraph-backend-unit",
      entryNodeId: "node-entry",
      nodes: [
        {
          nodeId: "node-entry",
          stageId: "stage-entry",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "entry",
          roleProfileId: "runtime-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
        {
          nodeId: "node-tail",
          stageId: "stage-tail",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "tail",
          roleProfileId: "runtime-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
      ],
      edges: [{ fromNodeId: "node-entry", toNodeId: "node-tail" }],
    });

    const preparedExecution = backend.prepare(compiledIr);

    expect(preparedExecution.initialNodeIds).toEqual(["node-entry"]);
    expect(preparedExecution.currentStatus).toBe("pending");
    expect(preparedExecution.supportedTerminalStatuses).not.toContain("pending");
    expect(preparedExecution.supportedInterruptKinds).toEqual(["hitl", "timeout", "cancelled"]);
    expect(preparedExecution.supportedTerminalStatuses).toContain("succeeded");
    expect(preparedExecution.lifecycleEvents[0]?.type).toBe("execution.ready");
    expect(preparedExecution.lifecycleEvents.some((event) => event.type === "graph.compiled")).toBe(
      true,
    );
    expect(
      preparedExecution.lifecycleEvents.some(
        (event) => event.type === "node.ready" && event.nodeId === "node-entry",
      ),
    ).toBe(true);
    expect(preparedExecution.lifecycleEvents.some((event) => event.type === "edge.ready")).toBe(
      true,
    );
  });
});
