import { ProcessCompiler, ProcessNodeType } from "../src/index.js";

describe("core-process unit", () => {
  it("compiles a minimal valid process definition", () => {
    const compiler = new ProcessCompiler();
    const compiledIr = compiler.compile({
      processId: "process-unit-001",
      executionId: "exec-unit-001",
      entryNodeId: "node-entry",
      nodes: [
        {
          nodeId: "node-entry",
          stageId: "stage-entry",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "entry",
          roleProfileId: "planner-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
      ],
      edges: [],
    });

    expect(compiledIr.compileErrors).toHaveLength(0);
    expect(compiler.isCompilable(compiledIr)).toBe(true);
  });
});
