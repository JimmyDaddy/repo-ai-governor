import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { GovernorErrorCode, standardizeError } from "@repo-ai-governor/shared";
import {
  PROCESS_IR_VERSION,
  ProcessCompiler,
  ProcessCompilerIssueCode,
  type ProcessDslDefinition,
  ProcessNodeType,
} from "../src/index.js";

/**
 * Creates a valid process DSL fixture for compiler smoke tests.
 * @returns Baseline process DSL payload.
 */
function createValidProcessDslFixture(): ProcessDslDefinition {
  return {
    processId: "process-stage2-baseline",
    executionId: "exec-001",
    entryNodeId: "node-planner",
    nodes: [
      {
        nodeId: "node-planner",
        stageId: "stage-01",
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: "planner",
        roleProfileId: "planner-default",
        inputSchemaRef: "schemas/stage-01-input.json",
        outputSchemaRef: "schemas/stage-01-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
      },
      {
        nodeId: "node-review-loop",
        stageId: "stage-02",
        nodeType: ProcessNodeType.LOOP,
        routeKey: "review-loop",
        roleProfileId: "reviewer-default",
        inputSchemaRef: "schemas/stage-02-input.json",
        outputSchemaRef: "schemas/stage-02-output.json",
        retryPolicyRef: "policy/retry-default",
        timeoutPolicyRef: "policy/timeout-default",
        budgetPolicyRef: "policy/budget-default",
        limits: {
          maxCycles: 3,
          maxWallTimeSeconds: 1800,
        },
      },
    ],
    edges: [
      {
        fromNodeId: "node-planner",
        toNodeId: "node-review-loop",
      },
    ],
    globals: {
      stage: "stage2",
    },
  };
}

describe("ProcessCompiler smoke", () => {
  it("compiles valid process DSL and persists IR snapshot to workspace context", () => {
    const compiler = new ProcessCompiler();
    const processDsl = createValidProcessDslFixture();
    const compiledIr = compiler.compile(processDsl);
    const workspaceRoot = mkdtempSync(resolve(tmpdir(), "repo-ai-governor-tk013-"));

    try {
      expect(compiledIr.irVersion).toBe(PROCESS_IR_VERSION);
      expect(compiledIr.compileErrors).toHaveLength(0);
      expect(compiler.isCompilable(compiledIr)).toBe(true);
      expect(compiledIr.compiledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u);

      const snapshotPath = compiler.persistCompiledIrSnapshot(workspaceRoot, compiledIr);
      expect(snapshotPath).toBe(join(workspaceRoot, "context", "compiled-ir", "exec-001.json"));

      const persistedSnapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
        execution_id: string;
        ir_version: string;
      };

      expect(persistedSnapshot.execution_id).toBe("exec-001");
      expect(persistedSnapshot.ir_version).toBe(PROCESS_IR_VERSION);
    } finally {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("reports compile errors when loop node misses required limits", () => {
    const compiler = new ProcessCompiler();
    const processDsl = createValidProcessDslFixture();

    processDsl.nodes[1] = {
      ...processDsl.nodes[1],
      limits: {
        maxCycles: 2,
      },
    };

    const compiledIr = compiler.compile(processDsl);
    const errorCodes = compiledIr.compileErrors.map((issue) => issue.errorCode);

    expect(errorCodes).toContain(ProcessCompilerIssueCode.LOOP_MAX_WALL_TIME_REQUIRED);
    expect(compiler.isCompilable(compiledIr)).toBe(false);
  });

  it("reports compile errors when node references are invalid", () => {
    const compiler = new ProcessCompiler();
    const processDsl = createValidProcessDslFixture();

    processDsl.nodes.push({
      ...processDsl.nodes[0],
      nodeId: "node-planner",
    });
    processDsl.edges.push({
      fromNodeId: "node-missing",
      toNodeId: "node-review-loop",
    });

    const compiledIr = compiler.compile(processDsl);
    const errorCodes = compiledIr.compileErrors.map((issue) => issue.errorCode);

    expect(errorCodes).toContain(ProcessCompilerIssueCode.NODE_ID_DUPLICATED);
    expect(errorCodes).toContain(ProcessCompilerIssueCode.EDGE_FROM_NODE_NOT_FOUND);
  });

  it("reports compile errors when nodeType is missing", () => {
    const compiler = new ProcessCompiler();
    const processDsl = createValidProcessDslFixture();

    processDsl.nodes[0] = {
      ...processDsl.nodes[0],
      nodeType: undefined,
    };

    const compiledIr = compiler.compile(processDsl);
    const errorCodes = compiledIr.compileErrors.map((issue) => issue.errorCode);

    expect(errorCodes).toContain(ProcessCompilerIssueCode.NODE_TYPE_REQUIRED);
  });

  it("throws standardized error when IR major version is unsupported", () => {
    const compiler = new ProcessCompiler();
    let observedErrorCode = GovernorErrorCode.UNKNOWN;

    try {
      compiler.assertIrVersionCompatibleOrThrow("2.0.0");
    } catch (error) {
      const standardizedError = standardizeError(error);
      observedErrorCode = standardizedError.code;
    }

    expect(observedErrorCode).toBe(GovernorErrorCode.PROCESS_COMPILER_IR_VERSION_UNSUPPORTED);
  });
});
