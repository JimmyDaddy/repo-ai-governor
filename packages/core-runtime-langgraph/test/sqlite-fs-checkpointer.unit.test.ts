import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { ProcessCompiler, ProcessNodeType } from "@repo-ai-governor/core-process";
import { GovernorError, GovernorErrorCode, standardizeError } from "@repo-ai-governor/shared";
import {
  CompiledIrGraphAdapter,
  LANGGRAPH_SQLITE_FS_CHECKPOINTER_DATABASE_FILE_NAME,
} from "../src/index.js";
import { LangGraphSqliteFsCheckpointer } from "../src/sqlite-fs-checkpointer.js";

function createGraphPlan() {
  const compiler = new ProcessCompiler();
  const compiledIr = compiler.compile({
    processId: "process-langgraph-sqlite-checkpoint-unit",
    executionId: "exec-langgraph-sqlite-checkpoint-unit",
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

describe("core-runtime-langgraph sqlite-fs checkpointer", () => {
  it("writes checkpoint envelopes into sqlite-fs storage and recovers next-node state", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "langgraph-sqlite-checkpointer-unit-"));
    const checkpointer = new LangGraphSqliteFsCheckpointer(
      {
        rootDirectory: temporaryRoot,
      },
      () => new Date("2026-03-25T10:00:00Z"),
      () => "checkpoint-sqlite-001",
    );

    try {
      const plan = createGraphPlan();
      const savedCheckpoint = await checkpointer.save({
        plan,
        executionSessionId: "session-sqlite-001",
        activeNodeIds: ["node-review"],
        visitedNodeIds: ["node-entry"],
        reducedState: {
          "execution.cursor": "node-review",
          "execution.visited_nodes": ["node-entry"],
        },
        artifactReferenceIds: ["DA-150"],
        taskReferenceId: "TK-151",
      });
      const recoveredExecution = await checkpointer.recover(
        plan.executionId,
        "session-sqlite-001",
        plan.processId,
      );

      expect(savedCheckpoint.checkpointSource).toBe("sqlite-fs");
      expect(savedCheckpoint.checkpointPath).toContain("langgraph-checkpoints.sqlite#");
      expect(recoveredExecution?.recovered).toBe(true);
      expect(recoveredExecution?.nextNodeIds).toEqual(["node-review"]);
    } finally {
      await checkpointer.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when a sqlite-fs envelope is tampered or namespace mismatched", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "langgraph-sqlite-checkpointer-unit-"));
    const checkpointer = new LangGraphSqliteFsCheckpointer({
      rootDirectory: temporaryRoot,
    });

    try {
      const plan = createGraphPlan();
      await checkpointer.save({
        plan,
        executionSessionId: "session-sqlite-002",
        activeNodeIds: ["node-review"],
        visitedNodeIds: ["node-entry"],
        reducedState: {
          "execution.cursor": "node-review",
          "execution.visited_nodes": ["node-entry"],
        },
      });

      let error = standardizeError(new GovernorError(GovernorErrorCode.UNKNOWN, "unreachable"));
      try {
        await checkpointer.recover(plan.executionId, "session-sqlite-002", "wrong-process");
      } catch (caughtError) {
        error = standardizeError(caughtError);
      }

      expect(error.code).toBe(GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID);
    } finally {
      await checkpointer.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when a sqlite-fs envelope contains an unknown interrupt kind", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "langgraph-sqlite-checkpointer-unit-"));
    const checkpointer = new LangGraphSqliteFsCheckpointer({
      rootDirectory: temporaryRoot,
    });

    try {
      const plan = createGraphPlan();
      await checkpointer.save({
        plan,
        executionSessionId: "session-sqlite-003",
        activeNodeIds: ["node-review"],
        visitedNodeIds: ["node-entry"],
        reducedState: {
          "execution.cursor": "node-review",
          "execution.visited_nodes": ["node-entry"],
        },
        pendingInterrupt: {
          kind: "hitl",
          recordedAt: "2026-03-25T10:00:00Z",
        },
      });

      const database = new DatabaseSync(
        join(temporaryRoot, LANGGRAPH_SQLITE_FS_CHECKPOINTER_DATABASE_FILE_NAME),
      );
      database
        .prepare(
          `
            UPDATE langgraph_checkpoints
            SET envelope_json = json_set(envelope_json, '$.pendingInterrupt.kind', 'unexpected')
            WHERE execution_id = ? AND execution_session_id = ?
          `,
        )
        .run(plan.executionId, "session-sqlite-003");
      database.close();

      let error = standardizeError(new GovernorError(GovernorErrorCode.UNKNOWN, "unreachable"));
      try {
        await checkpointer.recover(plan.executionId, "session-sqlite-003", plan.processId);
      } catch (caughtError) {
        error = standardizeError(caughtError);
      }

      expect(error.code).toBe(GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID);
    } finally {
      await checkpointer.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
