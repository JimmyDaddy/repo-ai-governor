export enum SlotSourceEnum {
  ProjectLocal = "project-local",
  TeamShared = "team-shared",
  Official = "official",
}

export const SLOT_SOURCES = Object.freeze(
  Object.values(SlotSourceEnum),
) as readonly `${SlotSourceEnum}`[];

export enum SlotTypeEnum {
  ArchitectureConstraint = "architecture-constraint",
  SecurityCompliance = "security-compliance",
  DomainKnowledge = "domain-knowledge",
  TestStrategy = "test-strategy",
  ReleaseApproval = "release-approval",
  DocumentationOutput = "documentation-output",
  Custom = "custom",
}

export const SLOT_TYPES = Object.freeze(
  Object.values(SlotTypeEnum),
) as readonly `${SlotTypeEnum}`[];

export enum ScriptExtensionHookEnum {
  Before = "before",
  After = "after",
}

export const SCRIPT_EXTENSION_HOOKS = Object.freeze(
  Object.values(ScriptExtensionHookEnum),
) as readonly `${ScriptExtensionHookEnum}`[];

export enum ScriptExtensionRuntimeKindEnum {
  Command = "command",
  NodeModule = "node-module",
}

export const SCRIPT_EXTENSION_RUNTIME_KINDS = Object.freeze(
  Object.values(ScriptExtensionRuntimeKindEnum),
) as readonly `${ScriptExtensionRuntimeKindEnum}`[];

export enum ScriptExtensionNetworkPolicyEnum {
  Forbid = "forbid",
  Allow = "allow",
}

export const SCRIPT_EXTENSION_NETWORK_POLICIES = Object.freeze(
  Object.values(ScriptExtensionNetworkPolicyEnum),
) as readonly `${ScriptExtensionNetworkPolicyEnum}`[];

export enum ScriptExtensionGitPolicyEnum {
  Forbid = "forbid",
  Read = "read",
  Write = "write",
}

export const SCRIPT_EXTENSION_GIT_POLICIES = Object.freeze(
  Object.values(ScriptExtensionGitPolicyEnum),
) as readonly `${ScriptExtensionGitPolicyEnum}`[];

export enum ScriptExtensionSecretPolicyEnum {
  Forbid = "forbid",
  AllowInherited = "allow-inherited",
}

export const SCRIPT_EXTENSION_SECRET_POLICIES = Object.freeze(
  Object.values(ScriptExtensionSecretPolicyEnum),
) as readonly `${ScriptExtensionSecretPolicyEnum}`[];

export enum SlotConflictPolicyEnum {
  Error = "error",
  Override = "override",
  Merge = "merge",
  Replace = "replace",
}

export const SLOT_CONFLICT_POLICIES = Object.freeze(
  Object.values(SlotConflictPolicyEnum),
) as readonly `${SlotConflictPolicyEnum}`[];

export enum SlotTriggerMatchModeEnum {
  Any = "any",
  All = "all",
}

export const SLOT_TRIGGER_MATCH_MODES = Object.freeze(
  Object.values(SlotTriggerMatchModeEnum),
) as readonly `${SlotTriggerMatchModeEnum}`[];

export enum ScriptExtensionFailurePolicyEnum {
  Stop = "stop",
  Continue = "continue",
  Warn = "warn",
}

export const SCRIPT_EXTENSION_FAILURE_POLICIES = Object.freeze(
  Object.values(ScriptExtensionFailurePolicyEnum),
) as readonly `${ScriptExtensionFailurePolicyEnum}`[];

export enum SlotScriptIsolationModeEnum {
  Process = "process",
  ExternalRunner = "external-runner",
}

export const SLOT_SCRIPT_ISOLATION_MODES = Object.freeze(
  Object.values(SlotScriptIsolationModeEnum),
) as readonly `${SlotScriptIsolationModeEnum}`[];

export enum SlotDocumentKindEnum {
  GovernanceSlot = "governance-slot",
}

export const SLOT_DOCUMENT_KINDS = Object.freeze(
  Object.values(SlotDocumentKindEnum),
) as readonly `${SlotDocumentKindEnum}`[];

export enum SlotDocumentSchemaVersionEnum {
  V1 = "1",
}

export const SLOT_DOCUMENT_SCHEMA_VERSIONS = Object.freeze(
  Object.values(SlotDocumentSchemaVersionEnum),
) as readonly `${SlotDocumentSchemaVersionEnum}`[];
