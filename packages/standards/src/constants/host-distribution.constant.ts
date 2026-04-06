/**
 * Defines host families supported by the host-distribution shared model.
 */
export enum HostDistributionHost {
  CODEX = 'codex',
  CLAUDE_CODE = 'claude-code',
  GITHUB_COPILOT = 'github-copilot',
}

/**
 * Defines the stable host-distribution modes.
 */
export enum HostDistributionMode {
  PROJECT_LOCAL = 'project-local',
  PLUGIN_BUNDLE = 'plugin-bundle',
}

/**
 * Defines the host-target matrix used by the export contract.
 */
export enum HostDistributionTarget {
  CODEX_PROJECT_LOCAL = 'codex.project_local',
  CODEX_PLUGIN = 'codex.plugin',
  CLAUDE_CODE_PROJECT_LOCAL = 'claude_code.project_local',
  CLAUDE_CODE_PLUGIN = 'claude_code.plugin',
  GITHUB_COPILOT_REPO_LOCAL = 'github_copilot.repo_local',
  GITHUB_COPILOT_CLI_PLUGIN = 'github_copilot.cli_plugin',
  GITHUB_COPILOT_GITHUB_COM_AGENT = 'github_copilot.github_com_agent',
}

/**
 * Defines the lifecycle state of a staged export or installed host bundle.
 */
export enum HostDistributionDiscoveryState {
  STAGED_EXPORT = 'staged_export',
  HOST_DISCOVERABLE = 'host_discoverable',
  INSTALLED_BUNDLE = 'installed_bundle',
}

/**
 * Defines the bridge used by a host asset to hand control back to governor core.
 */
export enum HostDistributionHandoffBridge {
  CLI_WRAPPER = 'cli_wrapper',
  MCP = 'mcp',
}

/**
 * Defines supported verification outcomes for host-distribution checks.
 */
export enum HostVerificationStatus {
  PASS = 'pass',
  WARN = 'warn',
  FAIL = 'fail',
}

/**
 * Defines the stable schema version for host export manifests.
 */
export const HOST_EXPORT_MANIFEST_SCHEMA_VERSION = 'host-export-manifest-v1';

/**
 * Defines the stable schema version for host apply reports.
 */
export const HOST_APPLY_REPORT_SCHEMA_VERSION = 'host-apply-report-v1';

/**
 * Defines the stable schema version for host pack reports.
 */
export const HOST_PACK_REPORT_SCHEMA_VERSION = 'host-pack-report-v1';

/**
 * Defines the stable schema version for host verification summaries.
 */
export const HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION = 'host-verification-summary-v1';

/**
 * Re-exports host-family values as a validation set.
 */
export const HOST_DISTRIBUTION_HOST_VALUES = new Set<string>(Object.values(HostDistributionHost));

/**
 * Re-exports host-distribution mode values as a validation set.
 */
export const HOST_DISTRIBUTION_MODE_VALUES = new Set<string>(Object.values(HostDistributionMode));

/**
 * Re-exports host target values as a validation set.
 */
export const HOST_DISTRIBUTION_TARGET_VALUES = new Set<string>(
  Object.values(HostDistributionTarget),
);

/**
 * Re-exports discovery-state values as a validation set.
 */
export const HOST_DISTRIBUTION_DISCOVERY_STATE_VALUES = new Set<string>(
  Object.values(HostDistributionDiscoveryState),
);

/**
 * Re-exports handoff-bridge values as a validation set.
 */
export const HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES = new Set<string>(
  Object.values(HostDistributionHandoffBridge),
);

/**
 * Re-exports verification-status values as a validation set.
 */
export const HOST_VERIFICATION_STATUS_VALUES = new Set<string>(
  Object.values(HostVerificationStatus),
);
