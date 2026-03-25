import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ProcessCompiler, ProcessNodeType } from "@repo-ai-governor/core-process";
import { CompiledIrGraphAdapter } from "@repo-ai-governor/core-runtime-langgraph";
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
} from "@repo-ai-governor/orchestration-service-client";
import { LocalOrchestrationServiceShell } from "../src/index.js";

function createGraphPlan() {
  const compiler = new ProcessCompiler();
  const compiledIr = compiler.compile({
    processId: "process-orchestration-shell-unit",
    executionId: "exec-orchestration-shell-unit",
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
      {
        nodeId: "node-review",
        stageId: "stage-review",
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: "review",
        roleProfileId: "reviewer-default",
        inputSchemaRef: "schemas/input.json",
        outputSchemaRef: "schemas/output.json",
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

  return new CompiledIrGraphAdapter().adapt(compiledIr);
}

describe("core-orchestration-service local shell", () => {
  it("tracks execution state, event stream, and sqlite-fs checkpoint recovery", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "local-orchestration-shell-unit-"));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => "exec-shell-001",
      executionSessionIdProvider: () => "session-shell-001",
    });

    try {
      const plan = createGraphPlan();
      const started = await orchestrationService.startExecution(
        {
          workspaceId: "workspace-unit",
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
          taskId: "TK-151",
          projectId: "project-014",
          sprintId: "sprint-002",
        },
        {
          executionId: plan.executionId,
          processId: plan.processId,
        },
      );
      await orchestrationService.publishEvent({
        executionId: plan.executionId,
        type: OrchestrationServiceEventType.STAGE_COMPLETED,
        status: OrchestrationExecutionStatus.RUNNING,
        stageId: "stage-entry",
        message: "Stage entry completed.",
      });
      const recovered = await orchestrationService.saveCheckpoint({
        executionId: plan.executionId,
        plan,
        executionSessionId: "session-shell-001",
        activeNodeIds: ["node-review"],
        visitedNodeIds: ["node-entry"],
        reducedState: {
          "execution.cursor": "node-review",
          "execution.visited_nodes": ["node-entry"],
        },
      });
      const subscription = await orchestrationService.subscribeExecution(started.eventStreamToken);
      const executionSummary = await orchestrationService.getExecution(plan.executionId);
      const recoveryResult = await orchestrationService.recoverExecution(plan.executionId);

      expect(started.status).toBe(OrchestrationExecutionStatus.RUNNING);
      expect(subscription.events.map((event) => event.type)).toEqual([
        OrchestrationServiceEventType.EXECUTION_STARTED,
        OrchestrationServiceEventType.STAGE_COMPLETED,
        OrchestrationServiceEventType.ARTIFACT_READY,
      ]);
      expect(executionSummary?.checkpointSource).toBe("sqlite-fs");
      expect(recovered?.checkpointSource).toBe("sqlite-fs");
      expect(recoveryResult.recovered).toBe(true);
      expect(recoveryResult.nextNodeIds).toEqual(["node-review"]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("persists a HITL decision receipt artifact and exposes the receipt path in the response", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "local-orchestration-shell-unit-"));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => "exec-shell-hitl-001",
      executionSessionIdProvider: () => "session-shell-hitl-001",
      nowProvider: () => new Date("2026-03-25T12:30:00Z"),
    });

    try {
      const started = await orchestrationService.startExecution(
        {
          workspaceId: "workspace-unit",
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
          taskId: "TK-151",
          projectId: "project-014",
          sprintId: "sprint-002",
        },
        {
          processId: "process-orchestration-shell-hitl",
        },
      );
      await orchestrationService.publishEvent({
        executionId: started.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: "Awaiting HITL decision.",
      });

      const decisionResult = await orchestrationService.submitHitlDecision({
        executionId: started.executionId,
        executionSessionId: started.executionSessionId,
        decision: "approve",
        resumeAction: "resume",
        actor: "reviewer",
        reason: "Approved for continuation.",
      });
      const subscription = await orchestrationService.subscribeExecution(started.eventStreamToken);
      const receiptPayload = JSON.parse(
        await readFile(decisionResult.decisionReceiptArtifactPath as string, "utf8"),
      ) as {
        executionId: string;
        decision: string;
        decidedBy: string;
      };

      expect(decisionResult.accepted).toBe(true);
      expect(decisionResult.decisionReceiptArtifactPath).toContain(
        "context/hitl/decisions/hitl-decision-",
      );
      expect(receiptPayload.executionId).toBe(started.executionId);
      expect(receiptPayload.decision).toBe("approve");
      expect(receiptPayload.decidedBy).toBe("reviewer");
      expect(subscription.events.map((event) => event.type)).toContain(
        OrchestrationServiceEventType.ARTIFACT_READY,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
