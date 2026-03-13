import { validateSchemaDocument } from "../config/schema/validator.js";

export const SLOT_SOURCES = Object.freeze(["project-local", "team-shared", "official"]);
export const SLOT_TYPES = Object.freeze([
  "architecture-constraint",
  "security-compliance",
  "domain-knowledge",
  "test-strategy",
  "release-approval",
  "documentation-output",
  "custom"
]);

function createLocalizedText(zhCN, enUS) {
  return {
    "zh-CN": zhCN,
    "en-US": enUS
  };
}

export function validateSlotDefinition(slotDefinition) {
  return validateSchemaDocument("slot", slotDefinition);
}

export const PROJECT_LOCAL_SLOT_SKELETON = Object.freeze(
  validateSlotDefinition({
    id: "project-slot",
    version: "1",
    kind: "governance-slot",
    meta: {
      name: createLocalizedText("项目本地插槽", "Project Local Slot"),
      source: "project-local",
      slotType: "custom",
      owner: "project",
      tags: []
    }
  })
);

export const OFFICIAL_SLOT_SKELETON = Object.freeze(
  validateSlotDefinition({
    id: "official-slot",
    version: "1",
    kind: "governance-slot",
    meta: {
      name: createLocalizedText("官方插槽", "Official Slot"),
      source: "official",
      slotType: "security-compliance",
      owner: "repo-ai-governor",
      tags: ["official"]
    },
    trigger: {
      match: "any",
      when: {
        stages: ["review"]
      }
    },
    behavior: {
      blockOnFailure: true,
      priority: 100,
      conflictPolicy: "error"
    }
  })
);

export function getSlotSource(slotDefinition) {
  return validateSlotDefinition(slotDefinition).meta.source;
}

export function listSlotTriggerTargets(slotDefinition) {
  const slot = validateSlotDefinition(slotDefinition);

  return {
    stages: slot.trigger.when.stages,
    paths: slot.trigger.when.paths,
    events: slot.trigger.when.events,
    adapters: slot.trigger.when.adapters,
    commands: slot.trigger.when.commands
  };
}

export function compareSlotsByPriority(leftSlot, rightSlot) {
  const left = validateSlotDefinition(leftSlot);
  const right = validateSlotDefinition(rightSlot);

  if (left.behavior.priority !== right.behavior.priority) {
    return right.behavior.priority - left.behavior.priority;
  }

  return left.id.localeCompare(right.id);
}
