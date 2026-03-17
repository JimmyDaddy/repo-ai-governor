import { ConfigurationValidationError } from "../config/errors.js";
import { validateSchemaDocument } from "../config/schema/validator.js";
import {
  SCRIPT_EXTENSION_GIT_POLICIES,
  SCRIPT_EXTENSION_HOOKS,
  SCRIPT_EXTENSION_NETWORK_POLICIES,
  SCRIPT_EXTENSION_RUNTIME_KINDS,
  SCRIPT_EXTENSION_SECRET_POLICIES,
  SLOT_SOURCES,
  SLOT_TYPES,
  type ScriptExtensionGitPolicyEnum,
  type ScriptExtensionHookEnum,
  type ScriptExtensionNetworkPolicyEnum,
  type ScriptExtensionRuntimeKindEnum,
  type ScriptExtensionSecretPolicyEnum,
  type SlotSourceEnum,
  type SlotTypeEnum,
} from "../constants/slot-model.js";
import { cloneValue } from "../utils/common.js";

export {
  SLOT_SOURCES,
  SLOT_TYPES,
  SCRIPT_EXTENSION_HOOKS,
  SCRIPT_EXTENSION_RUNTIME_KINDS,
  SCRIPT_EXTENSION_NETWORK_POLICIES,
  SCRIPT_EXTENSION_GIT_POLICIES,
  SCRIPT_EXTENSION_SECRET_POLICIES,
};

export type SlotSource = `${SlotSourceEnum}`;
export type SlotType = `${SlotTypeEnum}`;
export type ScriptExtensionHook = `${ScriptExtensionHookEnum}`;
export type ScriptExtensionRuntimeKind = `${ScriptExtensionRuntimeKindEnum}`;
export type ScriptExtensionNetworkPolicy = `${ScriptExtensionNetworkPolicyEnum}`;
export type ScriptExtensionGitPolicy = `${ScriptExtensionGitPolicyEnum}`;
export type ScriptExtensionSecretPolicy = `${ScriptExtensionSecretPolicyEnum}`;

export type LocalizedText = {
  "zh-CN": string;
  "en-US": string;
};

export type SlotTriggerWhen = {
  paths: string[];
  stages: string[];
  events: string[];
  adapters: string[];
  commands: string[];
};

export type SlotTrigger = {
  match: "any" | "all";
  when: SlotTriggerWhen;
};

export type SlotScope = {
  languages: string[];
  frameworks: string[];
  projects: string[];
  files: string[];
  tags: string[];
};

export type SlotInject = {
  ai?: {
    promptKey?: string;
  };
  human?: {
    docSection?: string;
  };
};

export type SlotBehavior = {
  blockOnFailure: boolean;
  priority: number;
  requiresApproval: boolean;
  conflictPolicy: "error" | "override" | "merge" | "replace";
  dependsOn: string[];
  supersedes: string[];
  inject: SlotInject;
};

export type SlotChecks = {
  before: string[];
  after: string[];
};

export type SlotScriptRuntime = {
  kind: ScriptExtensionRuntimeKind;
  entry: string;
  args: string[];
  cwd?: string;
  timeoutMs?: number;
};

export type SlotScriptPermissions = {
  filesystem: {
    read: string[];
    write: string[];
  };
  network: ScriptExtensionNetworkPolicy;
  git: ScriptExtensionGitPolicy;
  secrets: ScriptExtensionSecretPolicy;
};

export type SlotScriptAudit = {
  logKey?: string;
  capture: string[];
  redact: string[];
};

export type SlotScriptIsolation = {
  mode: "process" | "external-runner";
};

export type SlotScriptExtension = {
  id: string;
  description?: LocalizedText;
  hook: ScriptExtensionHook;
  failurePolicy: "stop" | "continue" | "warn";
  runtime: SlotScriptRuntime;
  permissions: SlotScriptPermissions;
  audit: SlotScriptAudit;
  isolation: SlotScriptIsolation;
};

export type SlotExtensions = {
  scripts: SlotScriptExtension[];
};

export type SlotDefinition = {
  id: string;
  version: "1";
  kind: "governance-slot";
  meta: {
    name?: LocalizedText;
    source: SlotSource;
    slotType: SlotType;
    owner?: string;
    description?: LocalizedText;
    tags: string[];
  };
  trigger: SlotTrigger;
  scope: SlotScope;
  behavior: SlotBehavior;
  checks: SlotChecks;
  extensions: SlotExtensions;
};

export type SlotScriptExtensionDescriptor = {
  slotId: string;
  slotSource: SlotSource;
  id: string;
  hook: ScriptExtensionHook;
  failurePolicy: "stop" | "continue" | "warn";
  runtime: SlotScriptRuntime;
  permissions: SlotScriptPermissions;
  audit: SlotScriptAudit;
  isolation: SlotScriptIsolation;
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
    version: "1",
    kind: "governance-slot",
    meta: {
      name: createLocalizedText("项目本地插槽", "Project Local Slot"),
      source: "project-local",
      slotType: "custom",
      owner: "project",
      tags: [],
    },
  }),
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
      tags: ["official"],
    },
    trigger: {
      match: "any",
      when: {
        stages: ["review"],
      },
    },
    behavior: {
      blockOnFailure: true,
      priority: 100,
      conflictPolicy: "error",
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
