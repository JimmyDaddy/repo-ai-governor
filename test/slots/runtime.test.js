import test from "node:test";
import assert from "node:assert/strict";
import {
  SLOT_SOURCES,
  SLOT_TYPES
} from "../../src/slots/slot-model.js";
import {
  SlotConflictError,
  buildSlotRuntime,
  resolveApplicableSlots
} from "../../src/slots/runtime.js";

function createSlotDefinition(overrides = {}) {
  return {
    id: overrides.id ?? "project-docs-slot",
    version: "1",
    kind: "governance-slot",
    meta: {
      name: {
        "zh-CN": "测试插槽",
        "en-US": "Test Slot"
      },
      source: overrides.meta?.source ?? "project-local",
      slotType: overrides.meta?.slotType ?? "documentation-output",
      owner: overrides.meta?.owner ?? "platform",
      tags: overrides.meta?.tags ?? []
    },
    trigger: {
      match: overrides.trigger?.match ?? "any",
      when: {
        paths: overrides.trigger?.when?.paths ?? [],
        stages: overrides.trigger?.when?.stages ?? ["plan"],
        events: overrides.trigger?.when?.events ?? [],
        adapters: overrides.trigger?.when?.adapters ?? [],
        commands: overrides.trigger?.when?.commands ?? ["plan"]
      }
    },
    scope: {
      languages: overrides.scope?.languages ?? [],
      frameworks: overrides.scope?.frameworks ?? [],
      projects: overrides.scope?.projects ?? [],
      files: overrides.scope?.files ?? [],
      tags: overrides.scope?.tags ?? []
    },
    behavior: {
      blockOnFailure: overrides.behavior?.blockOnFailure ?? true,
      priority: overrides.behavior?.priority ?? 100,
      requiresApproval: overrides.behavior?.requiresApproval ?? false,
      conflictPolicy: overrides.behavior?.conflictPolicy ?? "error",
      dependsOn: overrides.behavior?.dependsOn ?? [],
      supersedes: overrides.behavior?.supersedes ?? [],
      inject: {
        ai: overrides.behavior?.inject?.ai ?? {},
        human: overrides.behavior?.inject?.human ?? {}
      }
    },
    checks: {
      before: overrides.checks?.before ?? [],
      after: overrides.checks?.after ?? []
    }
  };
}

test("slot runtime matches enabled slots by stage command and tags", () => {
  assert.ok(SLOT_SOURCES.includes("official"));
  assert.ok(SLOT_TYPES.includes("documentation-output"));

  const slotRuntime = buildSlotRuntime({
    config: {
      project: {
        language: "typescript",
        framework: "node"
      },
      execution: {
        currentProject: "mvp"
      },
      slots: {
        enabled: ["project-docs-slot"],
        disabled: [],
        conflictPolicy: "error"
      }
    },
    slotDefinitions: [
      {
        config: createSlotDefinition({
          scope: {
            tags: ["documentation"],
            projects: ["mvp"],
            languages: ["typescript"]
          },
          behavior: {
            inject: {
              ai: {
                promptKey: "documentation-output-checklist"
              },
              human: {
                docSection: "Documentation Outputs"
              }
            },
            checks: undefined
          },
          checks: {
            before: ["明确输出文件"],
            after: ["记录产物路径"]
          }
        })
      }
    ]
  });

  const resolution = resolveApplicableSlots(slotRuntime, {
    stageId: "plan",
    commandId: "plan",
    project: "mvp",
    language: "typescript",
    tags: ["documentation"]
  });

  assert.deepEqual(resolution.activeSlots.map((slot) => slot.id), ["project-docs-slot"]);
  assert.deepEqual(resolution.injections.aiPromptKeys, ["documentation-output-checklist"]);
  assert.deepEqual(resolution.checks.before, ["明确输出文件"]);
});

test("slot runtime suppresses lower-priority conflicts when override policy is present", () => {
  const slotRuntime = buildSlotRuntime({
    config: {
      slots: {
        enabled: ["official-security", "project-security"],
        disabled: [],
        conflictPolicy: "error"
      }
    },
    slotDefinitions: [
      {
        config: createSlotDefinition({
          id: "official-security",
          meta: {
            source: "official",
            slotType: "security-compliance"
          },
          trigger: {
            when: {
              stages: ["review"],
              commands: ["review"]
            }
          },
          behavior: {
            priority: 180,
            conflictPolicy: "error"
          }
        })
      },
      {
        config: createSlotDefinition({
          id: "project-security",
          meta: {
            source: "project-local",
            slotType: "security-compliance"
          },
          trigger: {
            when: {
              stages: ["review"],
              commands: ["review"]
            }
          },
          behavior: {
            priority: 240,
            conflictPolicy: "override"
          }
        })
      }
    ]
  });

  const resolution = resolveApplicableSlots(slotRuntime, {
    stageId: "review",
    commandId: "review"
  });

  assert.deepEqual(resolution.activeSlots.map((slot) => slot.id), ["project-security"]);
  assert.equal(resolution.suppressedSlots[0]?.id, "official-security");
  assert.equal(resolution.suppressedSlots[0]?.reason, "conflict-override");
});

test("slot runtime blocks slots whose dependencies are not active", () => {
  const slotRuntime = buildSlotRuntime({
    config: {
      slots: {
        enabled: ["release-approval"],
        disabled: [],
        conflictPolicy: "error"
      }
    },
    slotDefinitions: [
      {
        config: createSlotDefinition({
          id: "release-approval",
          meta: {
            slotType: "release-approval"
          },
          trigger: {
            when: {
              stages: ["report"],
              commands: ["report"]
            }
          },
          behavior: {
            dependsOn: ["security-review"]
          }
        })
      }
    ]
  });

  const resolution = resolveApplicableSlots(slotRuntime, {
    stageId: "report",
    commandId: "report"
  });

  assert.deepEqual(resolution.activeSlots, []);
  assert.equal(resolution.blockedSlots[0]?.id, "release-approval");
  assert.deepEqual(resolution.blockedSlots[0]?.missingDependencies, ["security-review"]);
});

test("slot runtime throws an explainable error when conflicting slots cannot be merged", () => {
  const slotRuntime = buildSlotRuntime({
    config: {
      slots: {
        enabled: ["official-docs", "team-docs"],
        disabled: [],
        conflictPolicy: "error"
      }
    },
    slotDefinitions: [
      {
        config: createSlotDefinition({
          id: "official-docs",
          meta: {
            source: "official",
            slotType: "documentation-output"
          }
        })
      },
      {
        config: createSlotDefinition({
          id: "team-docs",
          meta: {
            source: "team-shared",
            slotType: "documentation-output"
          },
          behavior: {
            priority: 120,
            conflictPolicy: "error"
          }
        })
      }
    ]
  });

  assert.throws(
    () =>
      resolveApplicableSlots(slotRuntime, {
        stageId: "plan",
        commandId: "plan"
      }),
    (error) => {
      assert.ok(error instanceof SlotConflictError);
      assert.equal(error.details.conflictKey, "slot-type:documentation-output");
      assert.deepEqual(error.details.slotIds, ["team-docs", "official-docs"]);
      return true;
    }
  );
});
