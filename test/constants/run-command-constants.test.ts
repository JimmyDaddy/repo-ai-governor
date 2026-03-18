import assert from "node:assert/strict";
import { test } from "vitest";
import { HIGH_RISK_PERMISSION_FIELD } from "../../src/constants/run-command.js";

test("run command high-risk mapping assigns ci workflow to dedicated permission field", () => {
  assert.equal(HIGH_RISK_PERMISSION_FIELD.ci_workflow_modification, "allowCiWorkflowEdit");
  assert.notEqual(
    HIGH_RISK_PERMISSION_FIELD.ci_workflow_modification,
    HIGH_RISK_PERMISSION_FIELD.infra_or_deploy,
  );
});
