import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { ProcessCompiler, ProcessNodeType } from "@repo-ai-governor/core-process";
import { CompiledIrGraphAdapter } from "@repo-ai-governor/core-runtime-langgraph";
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from "@repo-ai-governor/orchestration-service-client";
import { LocalOrchestrationServiceSidecarClient } from "../src/index.js";

function createGraphPlan() {
  const compiler = new ProcessCompiler();
  const compiledIr = compiler.compile({
    processId: "process-sidecar-client-test",
    executionId: "exec-sidecar-client-test",
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

describe("LocalOrchestrationServiceSidecarClient", () => {
  it("runs a local sidecar host over Node IPC and preserves sidecar host descriptors", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "local-orchestration-sidecar-"));
    const client = new LocalOrchestrationServiceSidecarClient(temporaryRoot);

    try {
      const health = await client.getHealth();
      const plan = createGraphPlan();
      const started = await client.startExecution(
        {
          workspaceId: "workspace-sidecar",
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: "TK-164",
          projectId: "project-016",
          sprintId: "sprint-001",
        },
        {
          processId: plan.processId,
          executionId: plan.executionId,
          executionSessionId: "session-sidecar-001",
        },
      );
      await client.publishEvent({
        executionId: plan.executionId,
        type: OrchestrationServiceEventType.STAGE_COMPLETED,
        status: OrchestrationExecutionStatus.RUNNING,
        stageId: "stage-entry",
        message: "stage completed",
      });
      const recoveredExecution = await client.saveCheckpoint({
        executionId: plan.executionId,
        plan,
        executionSessionId: "session-sidecar-001",
        activeNodeIds: ["node-review"],
        visitedNodeIds: ["node-entry"],
        reducedState: {
          "execution.cursor": "node-review",
          "execution.visited_nodes": ["node-entry"],
        },
      });
      await client.publishEvent({
        executionId: plan.executionId,
        type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
        status: OrchestrationExecutionStatus.COMPLETED,
        message: "completed",
      });

      const summary = await client.getExecution(plan.executionId);
      const listed = await client.listExecutions({
        filter: {
          workspaceId: "workspace-sidecar",
        },
      });
      const subscription = await client.subscribeExecution({
        executionId: plan.executionId,
      });

      expect(health.lifecycleStatus).toBe(OrchestrationServiceLifecycleStatus.READY);
      expect(health.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(health.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(health.pid).toBeTypeOf("number");
      expect(started.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(started.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(recoveredExecution?.checkpointSource).toBe("sqlite-fs");
      expect(summary?.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(summary?.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(summary?.checkpointPath).toContain("langgraph-checkpoints.sqlite#");
      expect(listed.executions).toHaveLength(1);
      expect(subscription.events.map((event) => event.type)).toEqual([
        OrchestrationServiceEventType.EXECUTION_STARTED,
        OrchestrationServiceEventType.STAGE_COMPLETED,
        OrchestrationServiceEventType.ARTIFACT_READY,
        OrchestrationServiceEventType.EXECUTION_COMPLETED,
      ]);
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
