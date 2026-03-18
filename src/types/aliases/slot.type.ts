import type {
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
} from "../../constants/slot-model.js";

export type SlotSource = (typeof SLOT_SOURCES)[number];

export type SlotType = (typeof SLOT_TYPES)[number];

export type ScriptExtensionHook = (typeof SCRIPT_EXTENSION_HOOKS)[number];

export type ScriptExtensionRuntimeKind = (typeof SCRIPT_EXTENSION_RUNTIME_KINDS)[number];

export type ScriptExtensionNetworkPolicy = (typeof SCRIPT_EXTENSION_NETWORK_POLICIES)[number];

export type ScriptExtensionGitPolicy = (typeof SCRIPT_EXTENSION_GIT_POLICIES)[number];

export type ScriptExtensionSecretPolicy = (typeof SCRIPT_EXTENSION_SECRET_POLICIES)[number];

export type SlotConflictPolicy = (typeof SLOT_CONFLICT_POLICIES)[number];

export type SlotTriggerMatchMode = (typeof SLOT_TRIGGER_MATCH_MODES)[number];

export type SlotScriptFailurePolicy = (typeof SCRIPT_EXTENSION_FAILURE_POLICIES)[number];

export type SlotScriptIsolationMode = (typeof SLOT_SCRIPT_ISOLATION_MODES)[number];

export type SlotDocumentKind = (typeof SLOT_DOCUMENT_KINDS)[number];

export type SlotDocumentSchemaVersion = (typeof SLOT_DOCUMENT_SCHEMA_VERSIONS)[number];
