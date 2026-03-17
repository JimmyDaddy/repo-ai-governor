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
