import {
  ProcessCompiler,
  type ProcessDslDefinition,
  ProcessNodeType,
} from "../packages/core-process/src/index.js";
import {
  ProcessRuntimeEngine,
  RuntimeExecutionStatus,
  RuntimeNowProvider,
  RuntimeStageStatus,
  RuntimeTimeoutScope,
} from "../packages/core-runtime/src/index.js";

/**
 * Creates a process DSL fixture that covers all control-flow node types.
 * @returns Process DSL fixture.
 */
function createRuntimeFlowFixture(): ProcessDslDefinition {
  return {
    processId: "process-runtime-flow",
    executionId: "exec-runtime-001",
    entryNodeId: "node-entry",
    nodes: [
      {
        nodeId: "node-entry",
        stageId: "stage-entry",
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: "entry",
        roleProfileId: "planner-default",
        inputSchemaRef: "schemas/entry-input.json",
        outputSchemaRef: "schemas/entry-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
      },
      {
        nodeId: "node-loop",
        stageId: "stage-loop",
        nodeType: ProcessNodeType.LOOP,
        routeKey: "loop",
        roleProfileId: "coder-default",
        inputSchemaRef: "schemas/loop-input.json",
        outputSchemaRef: "schemas/loop-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
        limits: {
          maxCycles: 3,
          maxWallTimeSeconds: 300,
        },
      },
      {
        nodeId: "node-condition",
        stageId: "stage-condition",
        nodeType: ProcessNodeType.CONDITION,
        routeKey: "condition",
        roleProfileId: "reviewer-default",
        inputSchemaRef: "schemas/condition-input.json",
        outputSchemaRef: "schemas/condition-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
      },
      {
        nodeId: "node-parallel",
        stageId: "stage-parallel",
        nodeType: ProcessNodeType.PARALLEL,
        routeKey: "parallel",
        roleProfileId: "tester-default",
        inputSchemaRef: "schemas/parallel-input.json",
        outputSchemaRef: "schemas/parallel-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
      },
      {
        nodeId: "node-parallel-a",
        stageId: "stage-parallel-a",
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: "parallel-a",
        roleProfileId: "tester-default",
        inputSchemaRef: "schemas/parallel-a-input.json",
        outputSchemaRef: "schemas/parallel-a-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
      },
      {
        nodeId: "node-parallel-b",
        stageId: "stage-parallel-b",
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: "parallel-b",
        roleProfileId: "tester-default",
        inputSchemaRef: "schemas/parallel-b-input.json",
        outputSchemaRef: "schemas/parallel-b-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
      },
    ],
    edges: [
      {
        fromNodeId: "node-entry",
        toNodeId: "node-loop",
      },
      {
        fromNodeId: "node-loop",
        toNodeId: "node-loop",
      },
      {
        fromNodeId: "node-loop",
        toNodeId: "node-condition",
      },
      {
        fromNodeId: "node-condition",
        toNodeId: "node-parallel",
        conditionKey: "parallel",
      },
      {
        fromNodeId: "node-condition",
        toNodeId: "node-parallel-a",
        conditionKey: "single",
      },
      {
        fromNodeId: "node-parallel",
        toNodeId: "node-parallel-a",
      },
      {
        fromNodeId: "node-parallel",
        toNodeId: "node-parallel-b",
      },
    ],
  };
}

/**
 * Uses a deterministic clock so runtime tests can assert time-driven behavior
 * without depending on host wall-clock jitter.
 */
class DeterministicRuntimeNowProvider extends RuntimeNowProvider {
  constructor(
    private currentMs: number,
    private readonly stepMs: number,
  ) {
    super();
  }

  public override now(): Date {
    const currentDate = new Date(this.currentMs);
    this.currentMs += this.stepMs;
    return currentDate;
  }
}

describe("ProcessRuntimeEngine smoke", () => {
  it("executes sequential/loop/condition/parallel control flow", async () => {
    const compiler = new ProcessCompiler();
    const engine = new ProcessRuntimeEngine(compiler);
    const compiledIr = compiler.compile(createRuntimeFlowFixture());
    const stageVisitCounter = new Map<string, number>();

    const result = await engine.execute(
      compiledIr,
      async ({ nodeId }) => {
        stageVisitCounter.set(nodeId, (stageVisitCounter.get(nodeId) ?? 0) + 1);
        return { nodeId };
      },
      {
        conditionResolver: {
          resolveConditionKey: () => "parallel",
        },
        loopController: {
          shouldContinue: ({ cycle }) => cycle < 2,
        },
      },
    );

    expect(result.status).toBe(RuntimeExecutionStatus.SUCCEEDED);
    expect(stageVisitCounter.get("node-entry")).toBe(1);
    expect(stageVisitCounter.get("node-loop")).toBe(2);
    expect(stageVisitCounter.get("node-condition")).toBe(1);
    expect(stageVisitCounter.get("node-parallel")).toBe(1);
    expect(stageVisitCounter.get("node-parallel-a")).toBe(1);
    expect(stageVisitCounter.get("node-parallel-b")).toBe(1);
  });

  it("returns timeout status when stage execution exceeds stage timeout", async () => {
    const compiler = new ProcessCompiler();
    const engine = new ProcessRuntimeEngine(compiler);
    const compiledIr = compiler.compile({
      processId: "process-runtime-timeout-stage",
      executionId: "exec-runtime-002",
      entryNodeId: "node-stage-timeout",
      nodes: [
        {
          nodeId: "node-stage-timeout",
          stageId: "stage-timeout",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "timeout",
          roleProfileId: "tester-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
      ],
      edges: [],
    });

    const result = await engine.execute(
      compiledIr,
      async () =>
        await new Promise<Record<string, unknown>>((resolvePromise) => {
          setTimeout(() => resolvePromise({ ok: true }), 50);
        }),
      {
        stageTimeoutMs: 5,
      },
    );

    expect(result.status).toBe(RuntimeExecutionStatus.TIMEOUT);
    expect(result.interruption?.timeoutScope).toBe(RuntimeTimeoutScope.STAGE);
    expect(result.stageResults[0]?.status).toBe(RuntimeStageStatus.TIMEOUT);
  });

  it("returns timeout status when flow execution exceeds flow timeout", async () => {
    const compiler = new ProcessCompiler();
    const engine = new ProcessRuntimeEngine(compiler);
    const compiledIr = compiler.compile({
      processId: "process-runtime-timeout-flow",
      executionId: "exec-runtime-003",
      entryNodeId: "node-loop-timeout",
      nodes: [
        {
          nodeId: "node-loop-timeout",
          stageId: "stage-loop-timeout",
          nodeType: ProcessNodeType.LOOP,
          routeKey: "loop-timeout",
          roleProfileId: "tester-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
          limits: {
            maxCycles: 500,
            maxWallTimeSeconds: 3600,
          },
        },
      ],
      edges: [
        {
          fromNodeId: "node-loop-timeout",
          toNodeId: "node-loop-timeout",
        },
      ],
    });

    const result = await engine.execute(
      compiledIr,
      async () => {
        await new Promise<void>((resolvePromise) => {
          setTimeout(() => resolvePromise(), 2);
        });
        return undefined;
      },
      {
        flowTimeoutMs: 5,
        loopController: {
          shouldContinue: () => true,
        },
      },
    );

    expect(result.status).toBe(RuntimeExecutionStatus.TIMEOUT);
    expect(result.interruption?.timeoutScope).toBe(RuntimeTimeoutScope.FLOW);
  });

  it("returns cancelled status when AbortSignal is already aborted", async () => {
    const compiler = new ProcessCompiler();
    const engine = new ProcessRuntimeEngine(compiler);
    const compiledIr = compiler.compile({
      processId: "process-runtime-cancelled",
      executionId: "exec-runtime-004",
      entryNodeId: "node-cancelled",
      nodes: [
        {
          nodeId: "node-cancelled",
          stageId: "stage-cancelled",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "cancelled",
          roleProfileId: "tester-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
      ],
      edges: [],
    });
    const abortController = new AbortController();
    abortController.abort();

    const result = await engine.execute(compiledIr, async () => undefined, {
      signal: abortController.signal,
    });

    expect(result.status).toBe(RuntimeExecutionStatus.CANCELLED);
    expect(result.stageResults).toHaveLength(0);
  });

  it("supports custom runtime now provider extensions", async () => {
    const compiler = new ProcessCompiler();
    const engine = new ProcessRuntimeEngine(compiler);
    const compiledIr = compiler.compile({
      processId: "process-runtime-clock-provider",
      executionId: "exec-runtime-005",
      entryNodeId: "node-clock-provider",
      nodes: [
        {
          nodeId: "node-clock-provider",
          stageId: "stage-clock-provider",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "clock-provider",
          roleProfileId: "tester-default",
          inputSchemaRef: "schemas/input.json",
          outputSchemaRef: "schemas/output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
      ],
      edges: [],
    });

    const result = await engine.execute(compiledIr, async () => undefined, {
      nowProvider: new DeterministicRuntimeNowProvider(Date.parse("2026-01-01T00:00:00.000Z"), 100),
    });

    expect(result.status).toBe(RuntimeExecutionStatus.SUCCEEDED);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.stageResults[0]?.durationMs).toBeGreaterThan(0);
  });
});
