/**
 * Defines finite capability ids governed by the adapter protocol contract.
 *
 * Why this exists:
 * stable capability ids allow runtime, adapters, and policy layers to evaluate
 * support gaps with one shared semantic vocabulary.
 */
export enum AgentCapability {
  TOOL_CALLING = 'tool_calling',
  STRUCTURED_OUTPUT = 'structured_output',
  PARALLEL_TASK = 'parallel_task',
  STREAMING = 'streaming',
  CONFIRMATION_GATE = 'confirmation_gate',
  CANCELLATION = 'cancellation',
  AGENT_TIMEOUT = 'agent_timeout',
  STAGE_TIMEOUT_SIGNAL = 'stage_timeout_signal',
  FLOW_TIMEOUT_SIGNAL = 'flow_timeout_signal',
  CONTEXT_WINDOW = 'context_window',
}

/**
 * Defines support levels for one capability in the capability matrix.
 */
export enum AgentCapabilitySupportLevel {
  SUPPORTED = 'supported',
  DEGRADED = 'degraded',
  UNSUPPORTED = 'unsupported',
}

/**
 * Defines agent availability states returned by `probe`.
 */
export enum AgentAvailabilityStatus {
  AVAILABLE = 'available',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable',
}

/**
 * Defines canonical stream event kinds exposed by adapter implementations.
 */
export enum AgentStreamEventType {
  STATUS = 'status',
  TOKEN = 'token',
  TOOL_CALL = 'tool_call',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Defines decision outcomes for human confirmation requests.
 */
export enum AgentConfirmationDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
  REVISE = 'revise',
}

/**
 * Defines cancellation scopes for flow interruption propagation.
 */
export enum AgentCancellationScope {
  AGENT = 'agent',
  STAGE = 'stage',
  FLOW = 'flow',
}

/**
 * Defines canonical reasons for cancellation events.
 */
export enum AgentCancellationReason {
  USER_REQUESTED = 'user_requested',
  POLICY_ENGINE = 'policy_engine',
  SYSTEM_GUARD = 'system_guard',
  TIMEOUT_EXCEEDED = 'timeout_exceeded',
}

/**
 * Defines fallback actions used when required capabilities are not fully met.
 */
export enum AgentCapabilityFallbackAction {
  USE_FALLBACK_SURFACE = 'use_fallback_surface',
  DISABLE_CAPABILITY = 'disable_capability',
  REQUIRE_CONFIRMATION = 'require_confirmation',
  ESCALATE = 'escalate',
  BLOCK = 'block',
}

/**
 * Defines selected source marker for route decision audit records.
 */
export enum AgentRouteSelectionSource {
  PRIMARY = 'primary',
  FALLBACK = 'fallback',
  LOCAL_FALLBACK = 'local_fallback',
}

/**
 * Defines skip reasons for one route surface evaluation row.
 */
export enum AgentSurfaceSkipReason {
  SURFACE_NOT_REGISTERED = 'surface_not_registered',
  PROBE_FAILED = 'probe_failed',
  SURFACE_UNAVAILABLE = 'surface_unavailable',
  CAPABILITY_UNSATISFIED = 'capability_unsatisfied',
  NETWORK_RESTRICTED = 'network_restricted',
}

/**
 * Defines runtime network modes consumed by route dispatch decisions.
 */
export enum AgentNetworkMode {
  STANDARD = 'standard',
  RESTRICTED = 'restricted',
}

/**
 * Defines per-surface network requirement semantics for restricted mode decisions.
 */
export enum AgentSurfaceNetworkRequirement {
  EXTERNAL_NETWORK = 'external_network',
  LOCAL_ONLY = 'local_only',
}

/**
 * Defines the synthetic surface id used by local restricted-network fallback execution.
 */
export const AGENT_LOCAL_FALLBACK_SURFACE = 'local-governance-fallback';
