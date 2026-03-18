import assert from "node:assert/strict";
import { test } from "vitest";
import { buildSlotRuntime } from "../../src/slots/runtime.js";
import {
  WORKFLOW_EXECUTION_STATUS,
  WORKFLOW_STAGE_RESULT_STATUS,
  executeWorkflow,
  getWorkflowStageResult,
  selectWorkflowStages,
} from "../../src/workflow/governance-engine.js";
import { STANDARD_WORKFLOW_TEMPLATE } from "../../src/workflow/template-model.js";

type AnyRecord = Record<string, any>;

function createSlotDefinition(overrides: AnyRecord = {}): AnyRecord {
  return {
    id: overrides.id ?? "documentation-output",
    version: "1",
    kind: "governance-slot",
    meta: {
      name: overrides.meta?.name ?? {
        "zh-CN": "文档产出",
        "en-US": "Documentation Output",
      },
      source: overrides.meta?.source ?? "official",
      slotType: overrides.meta?.slotType ?? "documentation-output",
      owner: overrides.meta?.owner ?? "platform",
      tags: overrides.meta?.tags ?? [],
    },
    trigger: {
      match: overrides.trigger?.match ?? "all",
      when: {
        stages: overrides.trigger?.when?.stages ?? ["plan"],
        commands: overrides.trigger?.when?.commands ?? ["plan"],
        paths: overrides.trigger?.when?.paths ?? [],
        events: overrides.trigger?.when?.events ?? [],
        adapters: overrides.trigger?.when?.adapters ?? [],
      },
    },
    scope: {
      languages: overrides.scope?.languages ?? [],
      frameworks: overrides.scope?.frameworks ?? [],
      projects: overrides.scope?.projects ?? [],
      files: overrides.scope?.files ?? [],
      tags: overrides.scope?.tags ?? [],
    },
    behavior: {
      blockOnFailure: overrides.behavior?.blockOnFailure ?? false,
      priority: overrides.behavior?.priority ?? 160,
      requiresApproval: overrides.behavior?.requiresApproval ?? false,
      conflictPolicy: overrides.behavior?.conflictPolicy ?? "merge",
      dependsOn: overrides.behavior?.dependsOn ?? [],
      supersedes: overrides.behavior?.supersedes ?? [],
      inject: {
        ai: overrides.behavior?.inject?.ai ?? {},
        human: overrides.behavior?.inject?.human ?? {},
      },
    },
    checks: {
      before: overrides.checks?.before ?? [],
      after: overrides.checks?.after ?? [],
    },
    extensions: {
      scripts: overrides.extensions?.scripts ?? [],
    },
  };
}

test("selectWorkflowStages expands requested stages with dependencies in template order", () => {
  assert.deepEqual(selectWorkflowStages(STANDARD_WORKFLOW_TEMPLATE, ["self-check"]), [
    "plan",
    "breakdown",
    "implement",
    "self-check",
  ]);
});

test("executeWorkflow runs selected stages serially and merges stage outputs", async () => {
  const calls: string[] = [];
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
                exists: true,
              },
            },
          };
        }

        assert.equal((artifacts["plan.md"] as AnyRecord | undefined)?.exists, true);
        return {
          status: WORKFLOW_STAGE_RESULT_STATUS.passed,
          summary: "Breakdown generated.",
          outputs: {
            "tasks/checklist.md": {
              exists: true,
            },
          },
        };
      },
    },
  });

  assert.deepEqual(calls, ["plan", "breakdown"]);
  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.passed);
  assert.deepEqual(result.selectedStageIds, ["plan", "breakdown"]);
  assert.equal(getWorkflowStageResult(result, "plan")?.status, WORKFLOW_STAGE_RESULT_STATUS.passed);
  assert.equal(
    getWorkflowStageResult(result, "breakdown")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.passed,
  );
  assert.equal(
    getWorkflowStageResult(result, "implement")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.skipped,
  );
  assert.equal((result.artifacts["plan.md"] as AnyRecord | undefined)?.exists, true);
  assert.equal((result.artifacts["tasks/checklist.md"] as AnyRecord | undefined)?.exists, true);
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
              "plan.md": true,
            },
          };
        }

        return {
          status: WORKFLOW_STAGE_RESULT_STATUS.passed,
          outputs: {
            "tasks/checklist.md": true,
          },
        };
      },
      implement: () => {
        throw new Error("Implement stage failed");
      },
      check: () => ({
        status: WORKFLOW_STAGE_RESULT_STATUS.passed,
      }),
    },
  });

  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.failed);
  assert.equal(result.failure?.stageId, "implement");
  assert.equal(
    getWorkflowStageResult(result, "implement")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.failed,
  );
  assert.equal(
    getWorkflowStageResult(result, "self-check")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.blocked,
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
          required: false,
        },
      ],
    },
    targetStages: ["implement"],
    handlers: {
      plan: ({ stage }) => {
        if (stage.id === "plan") {
          return {
            status: WORKFLOW_STAGE_RESULT_STATUS.passed,
            outputs: {
              "plan.md": true,
            },
          };
        }

        return {
          status: WORKFLOW_STAGE_RESULT_STATUS.passed,
          outputs: {
            "tasks/checklist.md": true,
          },
        };
      },
    },
  });

  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.passed);
  assert.equal(
    getWorkflowStageResult(result, "implement")?.status,
    WORKFLOW_STAGE_RESULT_STATUS.skipped,
  );
  assert.equal(getWorkflowStageResult(result, "implement")?.skippedReason, "handler-missing");
});

test("executeWorkflow injects resolved slot context into stage handlers", async () => {
  const slotRuntime = buildSlotRuntime({
    config: {
      project: {
        language: "typescript",
      },
      execution: {
        currentProject: "mvp",
      },
      slots: {
        enabled: ["documentation-output"],
        disabled: [],
        conflictPolicy: "error",
      },
    },
    slotDefinitions: [
      {
        config: createSlotDefinition({
          id: "documentation-output",
          scope: {
            languages: ["typescript"],
            projects: ["mvp"],
            tags: ["documentation"],
          },
          behavior: {
            inject: {
              ai: {
                promptKey: "documentation-output-checklist",
              },
            },
          },
          checks: {
            before: ["明确输出文件"],
            after: [],
          },
        }) as any,
      },
    ],
  });

  const result = await executeWorkflow({
    template: STANDARD_WORKFLOW_TEMPLATE,
    targetStages: ["plan"],
    slotRuntime,
    metadata: {
      command: "plan",
      currentProject: "mvp",
      language: "typescript",
      tags: ["documentation"],
    },
    handlers: {
      plan: ({ slots, slotResolution }: any) => ({
        status: WORKFLOW_STAGE_RESULT_STATUS.passed,
        outputs: {
          slotIds: slots.map((slot: any) => slot.id),
        },
        details: {
          activeSlotCount: slotResolution.activeSlots.length,
        },
      }),
    },
  });

  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.passed);
  assert.deepEqual(getWorkflowStageResult(result, "plan")?.outputs.slotIds, [
    "documentation-output",
  ]);
  assert.equal(
    (
      (getWorkflowStageResult(result, "plan")?.details as AnyRecord | undefined)?.slots as
        | AnyRecord
        | undefined
    )?.activeSlots?.length,
    1,
  );
});

test("executeWorkflow fails the stage when slot conflicts are detected", async () => {
  const slotRuntime = buildSlotRuntime({
    config: {
      slots: {
        enabled: ["official-docs", "team-docs"],
        disabled: [],
        conflictPolicy: "error",
      },
    },
    slotDefinitions: [
      {
        config: createSlotDefinition({
          id: "official-docs",
          meta: {
            name: {
              "zh-CN": "官方文档",
              "en-US": "Official Docs",
            },
            source: "official",
            slotType: "documentation-output",
            owner: "platform",
            tags: [],
          },
          behavior: {
            conflictPolicy: "error",
          },
        }) as any,
      },
      {
        config: createSlotDefinition({
          id: "team-docs",
          meta: {
            name: {
              "zh-CN": "团队文档",
              "en-US": "Team Docs",
            },
            source: "team-shared",
            slotType: "documentation-output",
            owner: "platform",
            tags: [],
          },
          behavior: {
            conflictPolicy: "error",
          },
        }) as any,
      },
    ],
  });

  const result = await executeWorkflow({
    template: STANDARD_WORKFLOW_TEMPLATE,
    targetStages: ["plan"],
    slotRuntime,
    metadata: {
      command: "plan",
    },
    handlers: {
      plan: () => ({
        status: WORKFLOW_STAGE_RESULT_STATUS.passed,
      }),
    },
  });

  assert.equal(result.status, WORKFLOW_EXECUTION_STATUS.failed);
  assert.equal(result.failure?.stageId, "plan");
  assert.equal(getWorkflowStageResult(result, "plan")?.status, WORKFLOW_STAGE_RESULT_STATUS.failed);
  assert.equal(getWorkflowStageResult(result, "plan")?.error?.code, "slots.conflict");
});
