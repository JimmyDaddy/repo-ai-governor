import test from "node:test";
import assert from "node:assert/strict";
import {
  compareSlotsByPriority,
  getSlotSource,
  listSlotTriggerTargets,
  listSlotScriptExtensions,
  OFFICIAL_SLOT_SKELETON,
  PROJECT_LOCAL_SLOT_SKELETON,
  SCRIPT_EXTENSION_GIT_POLICIES,
  SCRIPT_EXTENSION_HOOKS,
  SCRIPT_EXTENSION_NETWORK_POLICIES,
  SCRIPT_EXTENSION_RUNTIME_KINDS,
  SCRIPT_EXTENSION_SECRET_POLICIES,
  SLOT_SOURCES,
  SLOT_TYPES
} from "../../src/slots/slot-model.js";
import { ConfigurationValidationError } from "../../src/config/errors.js";

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

test("slot model exposes declarative script extension descriptors", () => {
  assert.deepEqual(SCRIPT_EXTENSION_HOOKS, ["before", "after"]);
  assert.ok(SCRIPT_EXTENSION_RUNTIME_KINDS.includes("command"));
  assert.ok(SCRIPT_EXTENSION_NETWORK_POLICIES.includes("forbid"));
  assert.ok(SCRIPT_EXTENSION_GIT_POLICIES.includes("read"));
  assert.ok(SCRIPT_EXTENSION_SECRET_POLICIES.includes("allow-inherited"));

  const extensions = listSlotScriptExtensions({
    id: "docs-output",
    version: "1",
    kind: "governance-slot",
    meta: {
      name: {
        "zh-CN": "文档产出",
        "en-US": "Documentation Output"
      },
      source: "project-local",
      slotType: "documentation-output",
      owner: "platform"
    },
    extensions: {
      scripts: [
        {
          id: "render-summary",
          hook: "before",
          runtime: {
            kind: "command",
            entry: "node ./scripts/render-summary.js"
          }
        }
      ]
    }
  });

  assert.equal(extensions[0].slotId, "docs-output");
  assert.equal(extensions[0].hook, "before");
  assert.equal(extensions[0].runtime.kind, "command");
  assert.equal(extensions[0].permissions.network, "forbid");
});

test("slot model rejects duplicate script extension ids", () => {
  assert.throws(
    () =>
      listSlotScriptExtensions({
        id: "docs-output",
        version: "1",
        kind: "governance-slot",
        extensions: {
          scripts: [
            {
              id: "render-summary",
              runtime: {
                kind: "command",
                entry: "node ./scripts/render-summary.js"
              }
            },
            {
              id: "render-summary",
              runtime: {
                kind: "command",
                entry: "node ./scripts/render-summary-2.js"
              }
            }
          ]
        }
      }),
    ConfigurationValidationError
  );
});
