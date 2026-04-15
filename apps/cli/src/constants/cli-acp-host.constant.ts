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
  RUNTIME_SERVICE_ENABLEMENT_PENDING = 'runtime_service_enablement_pending',
  RUNTIME_SERVICE_READY = 'runtime_service_ready',
}

/**
 * Defines rollout boundary markers carried by the ACP host companion.
 */
export enum CliAcpHostDistributionBoundary {
  PACKAGED_DISTRIBUTION_PENDING = 'packaged_distribution_pending',
  PACKAGED_DISTRIBUTION_READY = 'packaged_distribution_ready',
}

/**
 * Defines the machine-readable summary emitted while ACP stays in sprint-001 baseline-only mode.
 */
export const CLI_ACP_HOST_COMPANION_STATE_SUMMARY = 'runtime_service_enablement_pending';

/**
 * Defines the presenter-safe summary emitted once packaged distribution evidence exists.
 */
export const CLI_ACP_HOST_DISTRIBUTION_READY_STATE_SUMMARY =
  'packaged_distribution_ready_runtime_service_pending';

/**
 * Defines the presenter-safe summary emitted once runtime-service evidence exists.
 */
export const CLI_ACP_HOST_RUNTIME_SERVICE_READY_STATE_SUMMARY =
  'runtime_service_ready_distribution_pending';

/**
 * Defines the presenter-safe summary emitted once both runtime-service and distribution evidence
 * exist for one ACP host surface.
 */
export const CLI_ACP_HOST_RUNTIME_AND_DISTRIBUTION_READY_STATE_SUMMARY =
  'runtime_service_and_distribution_ready';

/**
 * Defines the presenter-safe summary emitted once runtime-service, packaged-distribution, and
 * clean-room verification evidence all exist for one ACP host surface.
 */
export const CLI_ACP_HOST_CLEAN_ROOM_VERIFIED_STATE_SUMMARY =
  'runtime_service_and_distribution_cleanroom_verified';

/**
 * Defines one generic health-check failure detail reused by ACP baseline diagnostics.
 */
export const CLI_ACP_HOST_HEALTH_CHECK_FAILURE_DETAIL = 'acp_host_transport_not_ready';
