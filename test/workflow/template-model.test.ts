import assert from "node:assert/strict";
import { test } from "vitest";
import {
  STANDARD_WORKFLOW_STAGE_SEQUENCE,
  STANDARD_WORKFLOW_TEMPLATE,
  listWorkflowStageIds,
  resolveWorkflowTemplate,
} from "../../src/workflow/template-model.js";

test("standard workflow template exposes the expected serial stage sequence", () => {
  assert.deepEqual(
    listWorkflowStageIds(STANDARD_WORKFLOW_TEMPLATE),
    STANDARD_WORKFLOW_STAGE_SEQUENCE,
  );
  assert.equal(STANDARD_WORKFLOW_TEMPLATE.execution.mode, "serial");
  assert.equal(STANDARD_WORKFLOW_TEMPLATE.stages.at(-1)?.id, "task-sync");
});

test("resolveWorkflowTemplate applies workflow config overrides onto the standard template", () => {
  const resolvedTemplate = resolveWorkflowTemplate({
    template: "standard",
    allowSkipStages: true,
    requireHumanApprovalFor: ["review"],
    stages: [
      {
        id: "implement",
        required: false,
        onFailure: "warn",
      },
    ],
  });

  assert.equal(resolvedTemplate.execution.allowSkipStages, true);
  assert.equal(resolvedTemplate.stages.find((stage) => stage.id === "implement")?.required, false);
  assert.equal(
    resolvedTemplate.stages.find((stage) => stage.id === "implement")?.onFailure,
    "warn",
  );
  assert.equal(
    resolvedTemplate.stages.find((stage) => stage.id === "review")?.requiresApproval,
    true,
  );
});

test("resolveWorkflowTemplate rejects unsupported template ids", () => {
  assert.throws(
    () => resolveWorkflowTemplate({ template: "custom" }),
    /Unsupported workflow template/,
  );
});
