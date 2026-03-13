import test from "node:test";
import assert from "node:assert/strict";
import {
  executeWorkflow,
  getWorkflowStageResult,
  selectWorkflowStages,
  WORKFLOW_EXECUTION_STATUS,
  WORKFLOW_STAGE_RESULT_STATUS
} from "../../src/workflow/governance-engine.js";
import { STANDARD_WORKFLOW_TEMPLATE } from "../../src/workflow/template-model.js";

test("selectWorkflowStages expands requested stages with dependencies in template order", () => {
  assert.deepEqual(selectWorkflowStages(STANDARD_WORKFLOW_TEMPLATE, ["self-check"]), [
    "plan",
    "breakdown",
    "implement",
    "self-check"
  ]);
});

test("executeWorkflow runs selected stages serially and merges stage outputs", async () => {
  const calls = [];
  const result = await executeWorkflow({
    template: STANDARD_WORKFLOW_TEMPLATE,
    targetStages: ["breakdown"],
    handlers: {
      plan: ({ stage, artifacts }) => {
        calls.push(stage.id);

        if (stage.id === "plan") {
          return {
            status: WORKFLOW_STAGE_RESULT_STATUS.passed,
            summary: "Plan generated.",
            outputs: {
              "plan.md": {
                exists: true
              }
            }
          };
        }

        assert.equal(artifacts["plan.md"]?.exists, true);
        return {
          status: WORKFLOW_STAGE_RESULT_STATUS.passed,
          summary: "Breakdown generated.",
          outputs: {
            "tasks/checklist.md": {
              exists: true
            }
          }
        };
      }
    }
  });

  assert.deepEqual(calls, ["plan", "breakdown"]);
  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.passed);
  assert.deepEqual(result.selectedStageIds, ["plan", "breakdown"]);
  assert.equal(getWorkflowStageResult(result, "plan")?.status, WORKFLOW_STAGE_RESULT_STATUS.passed);
  assert.equal(
    getWorkflowStageResult(result, "breakdown")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.passed
  );
  assert.equal(
    getWorkflowStageResult(result, "implement")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.skipped
  );
  assert.equal(result.artifacts["plan.md"]?.exists, true);
  assert.equal(result.artifacts["tasks/checklist.md"]?.exists, true);
  assert.equal(result.summary.passed, 2);
});

test("executeWorkflow stops later selected stages after a stage failure", async () => {
  const result = await executeWorkflow({
    template: STANDARD_WORKFLOW_TEMPLATE,
    targetStages: ["self-check"],
    handlers: {
      plan: ({ stage }) => {
        if (stage.id === "plan") {
          return {
            status: WORKFLOW_STAGE_RESULT_STATUS.passed,
            outputs: {
              "plan.md": true
            }
          };
        }

        return {
          status: WORKFLOW_STAGE_RESULT_STATUS.passed,
          outputs: {
            "tasks/checklist.md": true
          }
        };
      },
      implement: () => {
        throw new Error("Implement stage failed");
      },
      check: () => ({
        status: WORKFLOW_STAGE_RESULT_STATUS.passed
      })
    }
  });

  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.failed);
  assert.equal(result.failure?.stageId, "implement");
  assert.equal(
    getWorkflowStageResult(result, "implement")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.failed
  );
  assert.equal(
    getWorkflowStageResult(result, "self-check")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.blocked
  );
  assert.deepEqual(getWorkflowStageResult(result, "self-check")?.blockedBy, ["implement"]);
});

test("executeWorkflow can resolve the template from workflow config overrides", async () => {
  const result = await executeWorkflow({
    workflowConfig: {
      template: "standard",
      stages: [
        {
          id: "implement",
          required: false
        }
      ]
    },
    targetStages: ["implement"],
    handlers: {
      plan: ({ stage }) => {
        if (stage.id === "plan") {
          return {
            status: WORKFLOW_STAGE_RESULT_STATUS.passed,
            outputs: {
              "plan.md": true
            }
          };
        }

        return {
          status: WORKFLOW_STAGE_RESULT_STATUS.passed,
          outputs: {
            "tasks/checklist.md": true
          }
        };
      }
    }
  });

  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.passed);
  assert.equal(
    getWorkflowStageResult(result, "implement")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.skipped
  );
  assert.equal(
    getWorkflowStageResult(result, "implement")?.skippedReason,
    "handler-missing"
  );
});
