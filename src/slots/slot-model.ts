import { ConfigurationValidationError } from "../config/errors.js";
import { validateSchemaDocument } from "../config/schema/validator.js";
import { cloneValue } from "../utils/common.js";

export const SLOT_SOURCES = Object.freeze(["project-local", "team-shared", "official"] as const);

export type SlotSource = (typeof SLOT_SOURCES)[number];

export const SLOT_TYPES = Object.freeze([
  "architecture-constraint",
  "security-compliance",
  "domain-knowledge",
  "test-strategy",
  "release-approval",
  "documentation-output",
  "custom",
] as const);

export type SlotType = (typeof SLOT_TYPES)[number];

export const SCRIPT_EXTENSION_HOOKS = Object.freeze(["before", "after"] as const);
export type ScriptExtensionHook = (typeof SCRIPT_EXTENSION_HOOKS)[number];

export const SCRIPT_EXTENSION_RUNTIME_KINDS = Object.freeze(["command", "node-module"] as const);
export type ScriptExtensionRuntimeKind = (typeof SCRIPT_EXTENSION_RUNTIME_KINDS)[number];

export const SCRIPT_EXTENSION_NETWORK_POLICIES = Object.freeze(["forbid", "allow"] as const);
export type ScriptExtensionNetworkPolicy = (typeof SCRIPT_EXTENSION_NETWORK_POLICIES)[number];

export const SCRIPT_EXTENSION_GIT_POLICIES = Object.freeze(["forbid", "read", "write"] as const);
export type ScriptExtensionGitPolicy = (typeof SCRIPT_EXTENSION_GIT_POLICIES)[number];

export const SCRIPT_EXTENSION_SECRET_POLICIES = Object.freeze([
  "forbid",
  "allow-inherited",
] as const);
export type ScriptExtensionSecretPolicy = (typeof SCRIPT_EXTENSION_SECRET_POLICIES)[number];

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
