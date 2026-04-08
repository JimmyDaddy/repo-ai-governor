import { WorkspaceMode } from '@repo-ai-governor/shared';

/**
 * Defines stable adoption-pack source kinds resolved by the installer layer.
 */
export enum AdoptionPackSourceKind {
  BUILT_IN = 'built_in',
  GLOBAL = 'global',
  REPO_LOCAL = 'repo_local',
}

/**
 * Defines workspace-mode policies frozen by the adoption-pack profile contract.
 */
export enum AdoptionPackWorkspaceModePolicy {
  TOOL_MANAGED_DEFAULT = 'tool_managed_default',
  REPO_LOCAL_OPT_IN = 'repo_local_opt_in',
  REPO_LOCAL_REQUIRED = 'repo_local_required',
}

/**
 * Defines managed asset groups recorded by installer receipts and diff/remove policy.
 */
export enum AdoptionPackManagedAssetGroup {
  COMMAND_GUIDES = 'command_guides',
  INSTRUCTIONS = 'instructions',
  SKILLS = 'skills',
  AGENTS = 'agents',
  HOOKS = 'hooks',
  WRAPPERS = 'wrappers',
  MCP_BRIDGE = 'mcp_bridge',
  BOOTSTRAP_TEMPLATES = 'bootstrap_templates',
  RUNTIME_HANDOFF_METADATA = 'runtime_handoff_metadata',
  MANAGEMENT_METADATA = 'management_metadata',
  NORMATIVE_TEMPLATES = 'normative_templates',
  EXECUTION_TEMPLATES = 'execution_templates',
  SQLITE_REGISTRIES = 'sqlite_registries',
  GOVERNANCE_AUTHORING_TEMPLATES = 'governance_authoring_templates',
}

/**
 * Defines upgrade policies formalized by the installer contract.
 */
export enum AdoptionPackUpgradePolicy {
  MANAGED_ONLY = 'managed_only',
  MANAGED_WITH_DRIFT_REPORT = 'managed_with_drift_report',
}

/**
 * Defines remove policies formalized by the installer contract.
 */
export enum AdoptionPackRemovePolicy {
  MANAGED_ONLY = 'managed_only',
  MANAGED_WITH_CONFIRM = 'managed_with_confirm',
}

/**
 * Defines the stable schema version for adoption-pack manifests.
 */
export const ADOPTION_PACK_MANIFEST_SCHEMA_VERSION = 'adoption-pack-manifest-v1';

/**
 * Defines the stable schema version for adoption-pack install receipts.
 */
export const ADOPTION_PACK_INSTALL_RECEIPT_SCHEMA_VERSION = 'adoption-pack-install-receipt-v1';

/**
 * Defines the stable schema version for adoption-pack diff reports.
 */
export const ADOPTION_PACK_DIFF_REPORT_SCHEMA_VERSION = 'adoption-pack-diff-report-v1';

/**
 * Defines the stable schema version for adoption-pack verification summaries.
 */
export const ADOPTION_PACK_VERIFICATION_SUMMARY_SCHEMA_VERSION =
  'adoption-pack-verification-summary-v1';

/**
 * Defines the stable built-in pack id shipped by the current governor distribution.
 */
export const BUILT_IN_ADOPTION_PACK_ID = 'repo-ai-governor-adoption-pack';

/**
 * Defines the stable built-in pack version shipped by the current governor distribution.
 */
export const BUILT_IN_ADOPTION_PACK_VERSION = '1.0.0';

/**
 * Defines the supported built-in profile ids.
 */
export const BUILT_IN_ADOPTION_PACK_PROFILE_IDS = {
  ADOPTER_COMPLETE: 'adopter-complete',
  SELF_HOST_COMPLETE: 'self-host-complete',
} as const;

/**
 * Defines the default repository-local adoption metadata root.
 */
export const DEFAULT_ADOPTION_METADATA_ROOT_SEGMENTS = ['.repo-ai-governor', 'adoption'] as const;

/**
 * Defines the default global adoption-pack override root under the user's home directory.
 */
export const DEFAULT_GLOBAL_ADOPTION_PACK_ROOT_SEGMENTS = [
  '.repo-ai-governor',
  'adoption-packs',
] as const;

/**
 * Defines the default repo-local adoption-pack override root.
 */
export const DEFAULT_REPO_LOCAL_ADOPTION_PACK_ROOT_SEGMENTS = [
  '.repo-ai-governor',
  'adoption-packs',
] as const;

/**
 * Defines the default workspace mode applied for tool-managed-first profiles.
 */
export const DEFAULT_ADOPTION_PACK_WORKSPACE_MODE = WorkspaceMode.TOOL_MANAGED;

/**
 * Re-exports source-kind values as a validation set.
 */
export const ADOPTION_PACK_SOURCE_KIND_VALUES = new Set<string>(
  Object.values(AdoptionPackSourceKind),
);

/**
 * Re-exports workspace-mode-policy values as a validation set.
 */
export const ADOPTION_PACK_WORKSPACE_MODE_POLICY_VALUES = new Set<string>(
  Object.values(AdoptionPackWorkspaceModePolicy),
);

/**
 * Re-exports managed-asset-group values as a validation set.
 */
export const ADOPTION_PACK_MANAGED_ASSET_GROUP_VALUES = new Set<string>(
  Object.values(AdoptionPackManagedAssetGroup),
);

/**
 * Re-exports upgrade-policy values as a validation set.
 */
export const ADOPTION_PACK_UPGRADE_POLICY_VALUES = new Set<string>(
  Object.values(AdoptionPackUpgradePolicy),
);

/**
 * Re-exports remove-policy values as a validation set.
 */
export const ADOPTION_PACK_REMOVE_POLICY_VALUES = new Set<string>(
  Object.values(AdoptionPackRemovePolicy),
);
