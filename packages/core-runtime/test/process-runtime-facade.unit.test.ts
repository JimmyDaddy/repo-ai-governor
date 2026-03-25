import { ProcessCompiler, ProcessNodeType } from "@repo-ai-governor/core-process";
import { LangGraphRuntimeBackend } from "@repo-ai-governor/core-runtime-langgraph";
import { GovernorErrorCode, standardizeError } from "@repo-ai-governor/shared";
import {
  ProcessRuntimeFacade,
  ProcessRuntimeParityHarness,
  RuntimeExecutionStatus,
  RuntimeStageStatus,
} from "../src/index.js";

function createCompiledIr() {
  const compiler = new ProcessCompiler();

  return compiler.compile({
    processId: "process-runtime-facade-unit",
    executionId: "exec-runtime-facade-unit",
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
        nodeId: "node-review",
        stageId: "stage-review",
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: "review",
        roleProfileId: "reviewer-default",
        inputSchemaRef: "schemas/review-input.json",
        outputSchemaRef: "schemas/review-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
      },
    ],
    edges: [
      {
        fromNodeId: "node-entry",
        toNodeId: "node-review",
      },
    ],
  });
}

describe("ProcessRuntimeFacade", () => {
  it("selects langgraph by default and provisions legacy parity comparison", () => {
    const facade = new ProcessRuntimeFacade({
      langgraphRuntimeBackend: new LangGraphRuntimeBackend(),
      nowProvider: () => new Date("2026-03-25T08:00:00Z"),
    });

    const preparedExecution = facade.prepare(createCompiledIr(), {
      enableParityHarness: true,
    });

    expect(preparedExecution.selection.primaryBackend).toBe("langgraph");
    expect(preparedExecution.selection.comparisonBackend).toBe("legacy");
    expect(preparedExecution.selection.parityMode).toBe("comparison");
    expect(preparedExecution.primary.backend).toBe("langgraph");
    expect(preparedExecution.primary.initialNodeIds).toEqual(["node-entry"]);
    expect(preparedExecution.comparison?.backend).toBe("legacy");
    expect(preparedExecution.comparison?.supportedInterruptKinds).toEqual(["timeout", "cancelled"]);
  });

  it("fails closed when selected backend is unavailable", () => {
    const facade = new ProcessRuntimeFacade();
    let error: ReturnType<typeof standardizeError> | undefined;

    try {
      facade.prepare(createCompiledIr());
    } catch (caughtError) {
      error = standardizeError(caughtError);
    }

    expect(error?.code).toBe(GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE);
  });
});

describe("ProcessRuntimeParityHarness", () => {
  it("passes when formal outputs match after normalization", () => {
    const parityHarness = new ProcessRuntimeParityHarness();
    const preparedExecution = new ProcessRuntimeFacade({
      langgraphRuntimeBackend: new LangGraphRuntimeBackend(),
      nowProvider: () => new Date("2026-03-25T08:00:00Z"),
    }).prepare(createCompiledIr(), {
      enableParityHarness: true,
    });
    const candidatePreparedProfile = parityHarness.createPreparedProfileSnapshot(
      preparedExecution.primary,
    );

    const report = parityHarness.compare({
      baseline: {
        backend: "legacy",
        preparedProfile: {
          ...candidatePreparedProfile,
          initialNodeIds: [...candidatePreparedProfile.initialNodeIds].reverse(),
          supportedInterruptKinds: [...candidatePreparedProfile.supportedInterruptKinds].reverse(),
          supportedTerminalStatuses: [
            ...candidatePreparedProfile.supportedTerminalStatuses,
          ].reverse(),
        },
        artifactPaths: ["b.json", "a.json"],
        auditRecordIds: ["audit-2", "audit-1"],
        reviewState: "verified",
        hitlState: "not_requested",
        recoveryState: "not_started",
        execution: {
          status: RuntimeExecutionStatus.SUCCEEDED,
          visitedNodeIds: ["node-entry", "node-review"],
          stageResults: [
            { stageId: "stage-review", status: RuntimeStageStatus.SUCCEEDED },
            { stageId: "stage-entry", status: RuntimeStageStatus.SUCCEEDED },
          ],
        },
      },
      candidate: {
        backend: "langgraph",
        preparedProfile: candidatePreparedProfile,
        artifactPaths: ["a.json", "b.json"],
        auditRecordIds: ["audit-1", "audit-2"],
        reviewState: "verified",
        hitlState: "not_requested",
        recoveryState: "not_started",
        execution: {
          status: RuntimeExecutionStatus.SUCCEEDED,
          visitedNodeIds: ["node-entry", "node-review"],
          stageResults: [
            { stageId: "stage-entry", status: RuntimeStageStatus.SUCCEEDED },
            { stageId: "stage-review", status: RuntimeStageStatus.SUCCEEDED },
          ],
        },
      },
    });

    expect(report.pass).toBe(true);
    expect(report.blockingDiffs).toHaveLength(0);
  });

  it("reports blocking drifts for formal review and execution state mismatches", () => {
    const parityHarness = new ProcessRuntimeParityHarness();

    const report = parityHarness.compare({
      baseline: {
        backend: "legacy",
        reviewState: "resolved",
        execution: {
          status: RuntimeExecutionStatus.SUCCEEDED,
        },
      },
      candidate: {
        backend: "langgraph",
        reviewState: "verified",
        execution: {
          status: RuntimeExecutionStatus.FAILED,
        },
      },
    });

    expect(report.pass).toBe(false);
    expect(report.blockingDiffs).toHaveLength(2);
    expect(report.blockingDiffs.map((diff) => diff.field)).toEqual(
      expect.arrayContaining(["reviewState", "execution"]),
    );
  });

  it("reports blocking drifts for prepared execution profile mismatches", () => {
    const parityHarness = new ProcessRuntimeParityHarness();

    const report = parityHarness.compare({
      baseline: {
        backend: "legacy",
        preparedProfile: {
          entryNodeId: "node-entry",
          currentStatus: "pending",
          nodeCount: 2,
          edgeCount: 1,
          initialNodeIds: ["node-entry"],
          supportedInterruptKinds: ["cancelled", "timeout"],
          supportedTerminalStatuses: ["cancelled", "failed", "succeeded", "timeout"],
        },
      },
      candidate: {
        backend: "langgraph",
        preparedProfile: {
          entryNodeId: "node-entry",
          currentStatus: "pending",
          nodeCount: 3,
          edgeCount: 1,
          initialNodeIds: ["node-entry"],
          supportedInterruptKinds: ["hitl", "timeout", "cancelled"],
          supportedTerminalStatuses: ["succeeded", "failed", "interrupted", "cancelled"],
        },
      },
    });

    expect(report.pass).toBe(false);
    expect(report.blockingDiffs).toHaveLength(1);
    expect(report.blockingDiffs[0]?.field).toBe("preparedProfile");
  });
});
