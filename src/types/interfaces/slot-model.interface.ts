import type { Locale } from "../aliases/locale.type.js";
import type {
  ScriptExtensionGitPolicy,
  ScriptExtensionHook,
  ScriptExtensionNetworkPolicy,
  ScriptExtensionRuntimeKind,
  ScriptExtensionSecretPolicy,
  SlotConflictPolicy,
  SlotDocumentKind,
  SlotDocumentSchemaVersion,
  SlotScriptFailurePolicy,
  SlotScriptIsolationMode,
  SlotSource,
  SlotTriggerMatchMode,
  SlotType,
} from "../aliases/slot.type.js";

export interface LocalizedText extends Record<Locale, string> {}

export interface SlotTriggerWhen {
  paths: string[];
  stages: string[];
  events: string[];
  adapters: string[];
  commands: string[];
}

export interface SlotTrigger {
  match: SlotTriggerMatchMode;
  when: SlotTriggerWhen;
}

export interface SlotScope {
  languages: string[];
  frameworks: string[];
  projects: string[];
  files: string[];
  tags: string[];
}

export interface SlotInject {
  ai?: {
    promptKey?: string;
  };
  human?: {
    docSection?: string;
  };
}

export interface SlotBehavior {
  blockOnFailure: boolean;
  priority: number;
  requiresApproval: boolean;
  conflictPolicy: SlotConflictPolicy;
  dependsOn: string[];
  supersedes: string[];
  inject: SlotInject;
}

export interface SlotChecks {
  before: string[];
  after: string[];
}

export interface SlotScriptRuntime {
  kind: ScriptExtensionRuntimeKind;
  entry: string;
  args: string[];
  cwd?: string;
  timeoutMs?: number;
}

export interface SlotScriptPermissions {
  filesystem: {
    read: string[];
    write: string[];
  };
  network: ScriptExtensionNetworkPolicy;
  git: ScriptExtensionGitPolicy;
  secrets: ScriptExtensionSecretPolicy;
}

export interface SlotScriptAudit {
  logKey?: string;
  capture: string[];
  redact: string[];
}

export interface SlotScriptIsolation {
  mode: SlotScriptIsolationMode;
}

export interface SlotScriptExtension {
  id: string;
  description?: LocalizedText;
  hook: ScriptExtensionHook;
  failurePolicy: SlotScriptFailurePolicy;
  runtime: SlotScriptRuntime;
  permissions: SlotScriptPermissions;
  audit: SlotScriptAudit;
  isolation: SlotScriptIsolation;
}

export interface SlotExtensions {
  scripts: SlotScriptExtension[];
}

export interface SlotDefinition {
  id: string;
  version: SlotDocumentSchemaVersion;
  kind: SlotDocumentKind;
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
}

export interface SlotScriptExtensionDescriptor {
  slotId: string;
  slotSource: SlotSource;
  id: string;
  hook: ScriptExtensionHook;
  failurePolicy: SlotScriptFailurePolicy;
  runtime: SlotScriptRuntime;
  permissions: SlotScriptPermissions;
  audit: SlotScriptAudit;
  isolation: SlotScriptIsolation;
}
