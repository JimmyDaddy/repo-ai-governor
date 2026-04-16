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
 * Defines the built-in adoption-pack parity classes for surface-level governance.
 */
export enum AdoptionPackParityClass {
  EXACT_SYNC = 'exact_sync',
  GENERATED_PROJECTION = 'generated_projection',
  TEMPLATE_SEED = 'template_seed',
  ADOPTER_OWNED_PLACEHOLDER = 'adopter_owned_placeholder',
}

/**
 * Defines the source-mode taxonomy used by the built-in pack source catalog.
 */
export enum AdoptionPackSourceMode {
  REPO_FILE_SYNC = 'repo_file_sync',
  STRUCTURED_TEMPLATE_PROJECTION = 'structured_template_projection',
  GENERATED_PROJECTION = 'generated_projection',
  TEMPLATE_SEED = 'template_seed',
  ADOPTER_PLACEHOLDER = 'adopter_placeholder',
}

/**
 * Defines how one source-catalog surface is materialized at install time.
 */
export enum AdoptionPackCompositionPolicy {
  WHOLE_FILE = 'whole_file',
  CATALOG_ASSEMBLED = 'catalog_assembled',
  STRUCTURE_INSTANCE_SPLIT = 'structure_instance_split',
  RUNTIME_BOOTSTRAP = 'runtime_bootstrap',
}

/**
 * Defines whether a surface is still a template/placeholder after bootstrap.
 */
export enum AdoptionPackPlaceholderPolicy {
  NONE = 'none',
  TEMPLATE_SEED = 'template_seed',
  ADOPTER_OWNED = 'adopter_owned',
}

/**
 * Defines where one surface or readiness rule is allowed to apply.
 */
export enum AdoptionPackApplicabilityScope {
  ALL_PROFILES = 'all_profiles',
  SELF_HOST_COMPLETE = 'self_host_complete',
  SELF_HOST_REPO_LOCAL = 'self_host_repo_local',
  SELF_HOST_DETECTED_SURFACE = 'self_host_detected_surface',
}

/**
 * Defines the stable source-catalog surface kinds used by built-in inventory records.
 */
export enum AdoptionPackSurfaceKind {
  WORKFLOW_ASSET = 'workflow_asset',
  TEMPLATE_FILE = 'template_file',
  RUNTIME_BOOTSTRAP = 'runtime_bootstrap',
}

/**
 * Defines the first-wave readiness groups formalized for self-host bootstrap surfaces.
 */
export enum AdoptionPackReadinessGroup {
  NONE = 'none',
  GOVERNANCE_RULES_READY = 'governance_rules_ready',
  PRODUCT_DIRECTION_READY = 'product_direction_ready',
  EXECUTION_SURFACE_READY = 'execution_surface_ready',
}

/**
 * Defines the first stable sinks that will later consume self-host readiness results.
 */
export enum AdoptionPackReadinessSink {
  DOCTOR_DIAGNOSTICS = 'doctor_diagnostics',
  ADOPT_VERIFY = 'adopt_verify',
  EXECUTION_PREFLIGHT = 'execution_preflight',
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
 * Re-exports parity-class values as a validation set.
 */
export const ADOPTION_PACK_PARITY_CLASS_VALUES = new Set<string>(
  Object.values(AdoptionPackParityClass),
);

/**
 * Re-exports source-mode values as a validation set.
 */
export const ADOPTION_PACK_SOURCE_MODE_VALUES = new Set<string>(
  Object.values(AdoptionPackSourceMode),
);

/**
 * Re-exports composition-policy values as a validation set.
 */
export const ADOPTION_PACK_COMPOSITION_POLICY_VALUES = new Set<string>(
  Object.values(AdoptionPackCompositionPolicy),
);

/**
 * Re-exports placeholder-policy values as a validation set.
 */
export const ADOPTION_PACK_PLACEHOLDER_POLICY_VALUES = new Set<string>(
  Object.values(AdoptionPackPlaceholderPolicy),
);

/**
 * Re-exports applicability-scope values as a validation set.
 */
export const ADOPTION_PACK_APPLICABILITY_SCOPE_VALUES = new Set<string>(
  Object.values(AdoptionPackApplicabilityScope),
);

/**
 * Re-exports surface-kind values as a validation set.
 */
export const ADOPTION_PACK_SURFACE_KIND_VALUES = new Set<string>(
  Object.values(AdoptionPackSurfaceKind),
);

/**
 * Re-exports readiness-group values as a validation set.
 */
export const ADOPTION_PACK_READINESS_GROUP_VALUES = new Set<string>(
  Object.values(AdoptionPackReadinessGroup),
);

/**
 * Re-exports readiness-sink values as a validation set.
 */
export const ADOPTION_PACK_READINESS_SINK_VALUES = new Set<string>(
  Object.values(AdoptionPackReadinessSink),
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
