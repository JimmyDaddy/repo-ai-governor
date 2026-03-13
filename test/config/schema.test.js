import test from "node:test";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  CONFIG_SCHEMA_VERSION,
  SCHEMA_FILE_NAMES,
  loadSchemaBundle,
  resolveSchemaPath
} from "../../src/config/schema/index.js";

function createAjvWithBundle() {
  const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
    useDefaults: true
  });

  addFormats(ajv);

  const bundle = loadSchemaBundle();

  for (const schema of Object.values(bundle)) {
    ajv.addSchema(schema);
  }

  return { ajv, bundle };
}

test("schema bundle resolves all expected file paths", () => {
  assert.equal(CONFIG_SCHEMA_VERSION, "1");
  assert.deepEqual(Object.keys(SCHEMA_FILE_NAMES), ["shared", "governor", "workflowTemplate", "slot", "adapter"]);
  assert.match(resolveSchemaPath("governor"), /src\/config\/schema\/governor\.schema\.json$/);
  assert.match(resolveSchemaPath("workflowTemplate"), /src\/config\/schema\/workflow-template\.schema\.json$/);
  assert.match(resolveSchemaPath("slot"), /src\/config\/schema\/slot\.schema\.json$/);
  assert.match(resolveSchemaPath("adapter"), /src\/config\/schema\/adapter\.schema\.json$/);
});

test("governor schema validates minimal repository config and applies defaults", () => {
  const { ajv, bundle } = createAjvWithBundle();
  const validate = ajv.getSchema(bundle.governor.$id);

  assert.ok(validate, "governor schema should be compiled");

  const config = {
    schemaVersion: "1",
    project: {
      name: "repo-ai-governor"
    },
    execution: {
      currentProject: "mvp",
      currentSprint: "sprint-001"
    }
  };

  assert.equal(validate(config), true, JSON.stringify(validate.errors, null, 2));
  assert.equal(config.workflow.template, "standard");
  assert.equal(config.automation.mode, "assisted");
  assert.equal(config.reporting.outputDir, ".repo-ai-governor/reports");
  assert.equal(config.artifacts.reviewFiles.pending, "review_<slug>.md");
  assert.deepEqual(config.reporting.formats, ["summary", "markdown", "json"]);
});

test("governor schema rejects unsupported schema version and invalid sprint naming", () => {
  const { ajv, bundle } = createAjvWithBundle();
  const validate = ajv.getSchema(bundle.governor.$id);
  const config = {
    schemaVersion: "2",
    execution: {
      currentProject: "mvp",
      currentSprint: "iteration-001"
    }
  };

  assert.equal(validate(config), false);
  assert.ok(validate.errors?.some((error) => error.instancePath === "/schemaVersion"));
  assert.ok(validate.errors?.some((error) => error.instancePath === "/execution/currentSprint"));
});

test("slot schema validates slot configuration defaults", () => {
  const { ajv, bundle } = createAjvWithBundle();
  const validate = ajv.getSchema(bundle.slot.$id);
  const slotConfig = {
    id: "security-review",
    version: "1",
    kind: "governance-slot",
    meta: {
      name: {
        "zh-CN": "安全审查",
        "en-US": "Security Review"
      },
      owner: "platform"
    }
  };

  assert.equal(validate(slotConfig), true, JSON.stringify(validate.errors, null, 2));
  assert.equal(slotConfig.behavior.blockOnFailure, true);
  assert.equal(slotConfig.behavior.priority, 100);
  assert.deepEqual(slotConfig.trigger.when.stages, []);
});

test("workflow template schema validates the standard serial workflow shape", () => {
  const { ajv, bundle } = createAjvWithBundle();
  const validate = ajv.getSchema(bundle.workflowTemplate.$id);
  const workflowTemplate = {
    id: "standard",
    version: "1",
    kind: "workflow-template",
    meta: {
      name: {
        "zh-CN": "标准流程",
        "en-US": "Standard Workflow"
      }
    },
    execution: {
      mode: "serial"
    },
    stages: [
      {
        id: "plan",
        name: {
          "zh-CN": "方案",
          "en-US": "Plan"
        },
        executor: {
          kind: "command",
          ref: "plan",
          command: "plan"
        },
        outputs: [
          {
            kind: "artifact",
            ref: "plan.md"
          }
        ]
      },
      {
        id: "review-verify",
        name: {
          "zh-CN": "评审复核",
          "en-US": "Review Verify"
        },
        dependsOn: ["plan"],
        executor: {
          kind: "command",
          ref: "review-verify",
          command: "review-verify"
        },
        inputs: [
          {
            kind: "review-record",
            ref: "code-review/review_<slug>.md"
          }
        ],
        outputs: [
          {
            kind: "review-record",
            ref: "code-review/verified_review_<slug>.md"
          }
        ],
        gates: {
          exit: [
            {
              id: "review-verified",
              kind: "review-status",
              refs: ["code-review/verified_review_<slug>.md"],
              expectedStatus: "verified"
            }
          ]
        }
      }
    ]
  };

  assert.equal(validate(workflowTemplate), true, JSON.stringify(validate.errors, null, 2));
  assert.equal(workflowTemplate.execution.allowSkipStages, false);
  assert.equal(workflowTemplate.stages[0].required, true);
  assert.equal(workflowTemplate.stages[1].gates.exit[0].expectedStatus, "verified");
});

test("adapter schema validates mainstream adapter configuration", () => {
  const { ajv, bundle } = createAjvWithBundle();
  const validate = ajv.getSchema(bundle.adapter.$id);
  const adapterConfig = {
    id: "codex",
    version: "1",
    type: "ide-or-cli",
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true
    },
    injection: {
      mode: "file-and-template",
      sources: ["standards", "workflow", "slots"]
    },
    render: {
      locale: "zh-CN",
      views: ["ai"]
    },
    policy: {
      strictWorkflow: true
    }
  };

  assert.equal(validate(adapterConfig), true, JSON.stringify(validate.errors, null, 2));
  assert.equal(adapterConfig.enabled, true);
  assert.equal(adapterConfig.policy.nonInteractiveSafe, true);
});
