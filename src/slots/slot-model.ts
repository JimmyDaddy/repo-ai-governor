import { ConfigurationValidationError } from "../config/errors.js";
import { validateSchemaDocument } from "../config/schema/validator.js";
import {
  SCRIPT_EXTENSION_FAILURE_POLICIES,
  SCRIPT_EXTENSION_GIT_POLICIES,
  SCRIPT_EXTENSION_HOOKS,
  SCRIPT_EXTENSION_NETWORK_POLICIES,
  SCRIPT_EXTENSION_RUNTIME_KINDS,
  SCRIPT_EXTENSION_SECRET_POLICIES,
  SLOT_CONFLICT_POLICIES,
  SLOT_DOCUMENT_KINDS,
  SLOT_DOCUMENT_SCHEMA_VERSIONS,
  SLOT_SCRIPT_ISOLATION_MODES,
  SLOT_SOURCES,
  SLOT_TRIGGER_MATCH_MODES,
  SLOT_TYPES,
  SlotConflictPolicyEnum,
  SlotDocumentKindEnum,
  SlotDocumentSchemaVersionEnum,
  SlotSourceEnum,
  SlotTriggerMatchModeEnum,
  SlotTypeEnum,
} from "../constants/slot-model.js";
import { StandardWorkflowStageEnum } from "../constants/workflow-template.js";
import type { SlotSource } from "../types/aliases/slot.type.js";
import type {
  LocalizedText,
  SlotDefinition,
  SlotScriptExtensionDescriptor,
  SlotTriggerWhen,
} from "../types/interfaces/slot-model.interface.js";
import { cloneValue } from "../utils/common.js";
export type {
  SlotSource,
  SlotType,
  ScriptExtensionHook,
  ScriptExtensionRuntimeKind,
  ScriptExtensionNetworkPolicy,
  ScriptExtensionGitPolicy,
  ScriptExtensionSecretPolicy,
  SlotConflictPolicy,
  SlotTriggerMatchMode,
  SlotScriptFailurePolicy,
  SlotScriptIsolationMode,
} from "../types/aliases/slot.type.js";
export type {
  LocalizedText,
  SlotTriggerWhen,
  SlotTrigger,
  SlotScope,
  SlotInject,
  SlotBehavior,
  SlotChecks,
  SlotScriptRuntime,
  SlotScriptPermissions,
  SlotScriptAudit,
  SlotScriptIsolation,
  SlotScriptExtension,
  SlotExtensions,
  SlotDefinition,
  SlotScriptExtensionDescriptor,
} from "../types/interfaces/slot-model.interface.js";

export {
  SLOT_SOURCES,
  SLOT_TYPES,
  SCRIPT_EXTENSION_HOOKS,
  SCRIPT_EXTENSION_RUNTIME_KINDS,
  SCRIPT_EXTENSION_NETWORK_POLICIES,
  SCRIPT_EXTENSION_GIT_POLICIES,
  SCRIPT_EXTENSION_SECRET_POLICIES,
  SLOT_CONFLICT_POLICIES,
  SLOT_DOCUMENT_KINDS,
  SLOT_DOCUMENT_SCHEMA_VERSIONS,
  SLOT_TRIGGER_MATCH_MODES,
  SCRIPT_EXTENSION_FAILURE_POLICIES,
  SLOT_SCRIPT_ISOLATION_MODES,
};

function createLocalizedText(zhCN: string, enUS: string): LocalizedText {
  return {
    "zh-CN": zhCN,
    "en-US": enUS,
  };
}

function ensureUniqueScriptExtensionIds(slotDefinition: SlotDefinition): SlotDefinition {
  const seenIds = new Set<string>();

  for (const scriptExtension of slotDefinition.extensions?.scripts ?? []) {
    if (seenIds.has(scriptExtension.id)) {
      throw new ConfigurationValidationError(
        `Invalid slot document: duplicate script extension id "${scriptExtension.id}"`,
        {
          details: {
            slotId: slotDefinition.id,
            scriptExtensionId: scriptExtension.id,
          },
        },
      );
    }

    seenIds.add(scriptExtension.id);
  }

  return slotDefinition;
}

export function validateSlotDefinition(slotDefinition: unknown): SlotDefinition {
  return ensureUniqueScriptExtensionIds(
    validateSchemaDocument("slot", slotDefinition) as SlotDefinition,
  );
}

export const PROJECT_LOCAL_SLOT_SKELETON = Object.freeze(
  validateSlotDefinition({
    id: "project-slot",
    version: SlotDocumentSchemaVersionEnum.V1,
    kind: SlotDocumentKindEnum.GovernanceSlot,
    meta: {
      name: createLocalizedText("项目本地插槽", "Project Local Slot"),
      source: SlotSourceEnum.ProjectLocal,
      slotType: SlotTypeEnum.Custom,
      owner: "project",
      tags: [],
    },
  }),
);

export const OFFICIAL_SLOT_SKELETON = Object.freeze(
  validateSlotDefinition({
    id: "official-slot",
    version: SlotDocumentSchemaVersionEnum.V1,
    kind: SlotDocumentKindEnum.GovernanceSlot,
    meta: {
      name: createLocalizedText("官方插槽", "Official Slot"),
      source: SlotSourceEnum.Official,
      slotType: SlotTypeEnum.SecurityCompliance,
      owner: "repo-ai-governor",
      tags: ["official"],
    },
    trigger: {
      match: SlotTriggerMatchModeEnum.Any,
      when: {
        stages: [StandardWorkflowStageEnum.Review],
      },
    },
    behavior: {
      blockOnFailure: true,
      priority: 100,
      conflictPolicy: SlotConflictPolicyEnum.Error,
    },
  }),
);

export function getSlotSource(slotDefinition: unknown): SlotSource {
  return validateSlotDefinition(slotDefinition).meta.source;
}

export function listSlotTriggerTargets(slotDefinition: unknown): SlotTriggerWhen {
  const slot = validateSlotDefinition(slotDefinition);

  return {
    stages: slot.trigger.when.stages,
    paths: slot.trigger.when.paths,
    events: slot.trigger.when.events,
    adapters: slot.trigger.when.adapters,
    commands: slot.trigger.when.commands,
  };
}

export function listSlotScriptExtensions(slotDefinition: unknown): SlotScriptExtensionDescriptor[] {
  const slot = validateSlotDefinition(slotDefinition);

  return (slot.extensions?.scripts ?? []).map((scriptExtension) => ({
    slotId: slot.id,
    slotSource: slot.meta.source,
    id: scriptExtension.id,
    hook: scriptExtension.hook,
    failurePolicy: scriptExtension.failurePolicy,
    runtime: cloneValue(scriptExtension.runtime),
    permissions: cloneValue(scriptExtension.permissions),
    audit: cloneValue(scriptExtension.audit),
    isolation: cloneValue(scriptExtension.isolation),
  }));
}

export function compareSlotsByPriority(leftSlot: unknown, rightSlot: unknown): number {
  const left = validateSlotDefinition(leftSlot);
  const right = validateSlotDefinition(rightSlot);

  if (left.behavior.priority !== right.behavior.priority) {
    return right.behavior.priority - left.behavior.priority;
  }

  return left.id.localeCompare(right.id);
}
