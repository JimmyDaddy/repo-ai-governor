/**
 * Defines structured diagnostic codes emitted by the CLI-local ACP host protocol baseline.
 */
export enum CliAcpHostDiagnosticCode {
  HOST_READINESS_STATUS = 'protocol.acp_host_readiness_status',
  DISTRIBUTION_BOUNDARY = 'protocol.acp_distribution_boundary',
  COMPANION_STATE_SUMMARY = 'protocol.acp_companion_state_summary',
}

/**
 * Defines presenter-safe host readiness values carried by the ACP host companion.
 */
export enum CliAcpHostReadinessStatus {
  BASELINE_ONLY = 'baseline_only',
}

/**
 * Defines rollout boundary markers carried by the ACP host companion.
 */
export enum CliAcpHostDistributionBoundary {
  PACKAGED_DISTRIBUTION_PENDING = 'packaged_distribution_pending',
}

/**
 * Defines the machine-readable summary emitted while ACP stays in sprint-001 baseline-only mode.
 */
export const CLI_ACP_HOST_COMPANION_STATE_SUMMARY = 'runtime_service_enablement_pending';

/**
 * Defines one generic health-check failure detail reused by ACP baseline diagnostics.
 */
export const CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL = 'acp_host_transport_not_ready';
