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

  it("executes the minimal graph-first mainchain from compiled IR", async () => {
    const compiler = new ProcessCompiler();
    const backend = new LangGraphRuntimeBackend(undefined, () => new Date("2026-03-26T08:00:00Z"));
    const compiledIr = compiler.compile({
      processId: "langgraph-backend-execute-unit",
      executionId: "exec-langgraph-backend-execute-unit",
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

    const runtimeResult = await backend.execute(
      compiledIr,
      async (context) => ({
        echoedStageId: context.stageId,
      }),
      {
        nowProvider: () => new Date("2026-03-26T08:00:00Z"),
      },
    );

    expect(runtimeResult.status).toBe("succeeded");
    expect(runtimeResult.visitedNodeIds).toEqual(["node-entry", "node-tail"]);
    expect(runtimeResult.stageResults).toHaveLength(2);
    expect(runtimeResult.stageResults[0]?.status).toBe("succeeded");
    expect(runtimeResult.stageResults[0]?.output).toEqual({
      echoedStageId: "stage-entry",
    });
    expect(runtimeResult.stageResults[1]?.output).toEqual({
      echoedStageId: "stage-tail",
    });
  });

  it("executes one converging DAG join node only once after fan-out branches complete", async () => {
    const compiler = new ProcessCompiler();
    const backend = new LangGraphRuntimeBackend(undefined, () => new Date("2026-03-26T08:00:00Z"));
    const compiledIr = compiler.compile({
      processId: "langgraph-backend-join-unit",
      executionId: "exec-langgraph-backend-join-unit",
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
          nodeId: "node-parallel",
          stageId: "stage-parallel",
          nodeType: ProcessNodeType.PARALLEL,
          routeKey: "parallel",
          roleProfileId: "runtime-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
        {
          nodeId: "node-left",
          stageId: "stage-left",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "left",
          roleProfileId: "runtime-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
        {
          nodeId: "node-right",
          stageId: "stage-right",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "right",
          roleProfileId: "runtime-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
        {
          nodeId: "node-join",
          stageId: "stage-join",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "join",
          roleProfileId: "runtime-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
      ],
      edges: [
        { fromNodeId: "node-entry", toNodeId: "node-parallel" },
        { fromNodeId: "node-parallel", toNodeId: "node-left" },
        { fromNodeId: "node-parallel", toNodeId: "node-right" },
        { fromNodeId: "node-left", toNodeId: "node-join" },
        { fromNodeId: "node-right", toNodeId: "node-join" },
      ],
    });

    const visitedStageIds: string[] = [];
    const runtimeResult = await backend.execute(
      compiledIr,
      async (context) => {
        visitedStageIds.push(context.stageId);
        return {
          echoedStageId: context.stageId,
        };
      },
      {
        nowProvider: () => new Date("2026-03-26T08:00:00Z"),
      },
    );

    expect(runtimeResult.status).toBe("succeeded");
    expect(visitedStageIds).toEqual([
      "stage-entry",
      "stage-parallel",
      "stage-left",
      "stage-right",
      "stage-join",
    ]);
    expect(runtimeResult.visitedNodeIds.filter((nodeId) => nodeId === "node-join")).toHaveLength(1);
    expect(
      runtimeResult.stageResults.filter((result) => result.stageId === "stage-join"),
    ).toHaveLength(1);
  });
});
