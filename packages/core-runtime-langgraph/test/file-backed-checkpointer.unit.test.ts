import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ProcessCompiler, ProcessNodeType } from "@repo-ai-governor/core-process";
import { GovernorError, GovernorErrorCode, standardizeError } from "@repo-ai-governor/shared";
import { CompiledIrGraphAdapter, LangGraphFileCheckpointer } from "../src/index.js";

function createGraphPlan() {
  const compiler = new ProcessCompiler();
  const compiledIr = compiler.compile({
    processId: "process-langgraph-checkpoint-unit",
    executionId: "exec-langgraph-checkpoint-unit",
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

describe("core-runtime-langgraph file-backed checkpointer", () => {
  it("writes namespaced checkpoint payloads and recovers next-node state", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "langgraph-checkpointer-unit-"));
    const checkpointer = new LangGraphFileCheckpointer(
      {
        rootDirectory: temporaryRoot,
      },
      () => new Date("2026-03-25T09:00:00Z"),
      () => "checkpoint-unit-001",
    );

    try {
      const plan = createGraphPlan();
      const savedCheckpoint = await checkpointer.save({
        plan,
        executionSessionId: "session-unit-001",
        activeNodeIds: ["node-review"],
        visitedNodeIds: ["node-entry"],
        reducedState: {
          "execution.cursor": "node-review",
          "execution.visited_nodes": ["node-entry"],
          "execution.pending_interrupt": {
            kind: "hitl",
          },
        },
        artifactReferenceIds: ["DA-147"],
        taskReferenceId: "TK-149",
        pendingInterrupt: {
          kind: "hitl",
          recordedAt: "2026-03-25T09:00:00Z",
          reason: "awaiting reviewer decision",
        },
      });

      const savedFileContent = JSON.parse(
        await readFile(savedCheckpoint.checkpointPath, "utf8"),
      ) as { executionSessionId: string; taskReferenceId?: string };
      const recoveredExecution = await checkpointer.recover(
        plan.executionId,
        "session-unit-001",
        plan.processId,
      );

      expect(savedCheckpoint.checkpointPath).toContain("langgraph-checkpoints");
      expect(savedCheckpoint.executionSessionId).toBe("session-unit-001");
      expect(savedFileContent.taskReferenceId).toBe("TK-149");
      expect(recoveredExecution?.recovered).toBe(true);
      expect(recoveredExecution?.nextNodeIds).toEqual(["node-review"]);
      expect(recoveredExecution?.pendingInterrupt?.kind).toBe("hitl");
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when reduced state contains disallowed keys", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "langgraph-checkpointer-unit-"));
    const checkpointer = new LangGraphFileCheckpointer({
      rootDirectory: temporaryRoot,
    });

    try {
      const plan = createGraphPlan();
      let error = standardizeError(new GovernorError(GovernorErrorCode.UNKNOWN, "unreachable"));

      try {
        await checkpointer.save({
          plan,
          executionSessionId: "session-unit-002",
          activeNodeIds: ["node-entry"],
          visitedNodeIds: [],
          reducedState: {
            "execution.cursor": "node-entry",
            "current-context": "forbidden",
          } as never,
        });
      } catch (caughtError) {
        error = standardizeError(caughtError);
      }

      expect(error.code).toBe(GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when a persisted checkpoint envelope is tampered", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "langgraph-checkpointer-unit-"));
    const checkpointer = new LangGraphFileCheckpointer(
      {
        rootDirectory: temporaryRoot,
      },
      () => new Date("2026-03-25T09:00:00Z"),
      () => "checkpoint-unit-003",
    );

    try {
      const plan = createGraphPlan();
      const savedCheckpoint = await checkpointer.save({
        plan,
        executionSessionId: "session-unit-003",
        activeNodeIds: ["node-review"],
        visitedNodeIds: ["node-entry"],
        reducedState: {
          "execution.cursor": "node-review",
          "execution.visited_nodes": ["node-entry"],
        },
      });

      await writeFile(
        savedCheckpoint.checkpointPath,
        JSON.stringify(
          {
            ...savedCheckpoint,
            checkpointSource: "tampered",
            processId: "wrong-process",
            checkpointPath: "/tmp/fake.json",
            activeNodeIds: ["fake-node"],
            reducedState: {
              ...savedCheckpoint.reducedState,
              "current-context": "forbidden",
            },
          },
          null,
          2,
        ),
        "utf8",
      );

      let error = standardizeError(new GovernorError(GovernorErrorCode.UNKNOWN, "unreachable"));
      try {
        await checkpointer.recover(plan.executionId, "session-unit-003", plan.processId);
      } catch (caughtError) {
        error = standardizeError(caughtError);
      }

      expect(error.code).toBe(GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
