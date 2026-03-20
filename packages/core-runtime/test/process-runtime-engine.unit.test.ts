import { ProcessCompiler, ProcessNodeType } from "@repo-ai-governor/core-process";
import { ProcessRuntimeEngine, RuntimeExecutionStatus, RuntimeStageStatus } from "../src/index.js";

describe("core-runtime unit", () => {
  it("executes one-stage compiled flow and returns succeeded status", async () => {
    const compiler = new ProcessCompiler();
    const engine = new ProcessRuntimeEngine(compiler);
    const compiledIr = compiler.compile({
      processId: "process-runtime-unit",
      executionId: "exec-runtime-unit",
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
      ],
      edges: [],
    });

    const result = await engine.execute(compiledIr, async () => ({ ok: true }));

    expect(result.status).toBe(RuntimeExecutionStatus.SUCCEEDED);
    expect(result.stageResults).toHaveLength(1);
    expect(result.stageResults[0]?.status).toBe(RuntimeStageStatus.SUCCEEDED);
  });
});
