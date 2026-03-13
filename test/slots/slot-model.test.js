import test from "node:test";
import assert from "node:assert/strict";
import {
  compareSlotsByPriority,
  getSlotSource,
  listSlotTriggerTargets,
  OFFICIAL_SLOT_SKELETON,
  PROJECT_LOCAL_SLOT_SKELETON,
  SLOT_SOURCES,
  SLOT_TYPES
} from "../../src/slots/slot-model.js";

test("slot model exposes local and official slot skeletons", () => {
  assert.deepEqual(SLOT_SOURCES, ["project-local", "team-shared", "official"]);
  assert.ok(SLOT_TYPES.includes("security-compliance"));
  assert.equal(PROJECT_LOCAL_SLOT_SKELETON.meta.source, "project-local");
  assert.equal(OFFICIAL_SLOT_SKELETON.meta.source, "official");
});

test("slot model lists trigger targets across stages adapters and commands", () => {
  const targets = listSlotTriggerTargets({
    id: "docs-output",
    version: "1",
    kind: "governance-slot",
    meta: {
      name: {
        "zh-CN": "文档产出",
        "en-US": "Documentation Output"
      },
      source: "official",
      slotType: "documentation-output",
      owner: "platform"
    },
    trigger: {
      match: "all",
      when: {
        stages: ["plan"],
        adapters: ["codex"],
        commands: ["plan"]
      }
    }
  });

  assert.deepEqual(targets.stages, ["plan"]);
  assert.deepEqual(targets.adapters, ["codex"]);
  assert.deepEqual(targets.commands, ["plan"]);
});

test("slot model compares slots by priority and source can be queried", () => {
  const first = {
    ...structuredClone(PROJECT_LOCAL_SLOT_SKELETON),
    id: "a-slot",
    behavior: {
      ...PROJECT_LOCAL_SLOT_SKELETON.behavior,
      priority: 120
    }
  };
  const second = {
    ...structuredClone(OFFICIAL_SLOT_SKELETON),
    id: "b-slot",
    behavior: {
      ...OFFICIAL_SLOT_SKELETON.behavior,
      priority: 80
    }
  };

  assert.equal(getSlotSource(second), "official");
  assert.equal(compareSlotsByPriority(first, second) < 0, true);
});
