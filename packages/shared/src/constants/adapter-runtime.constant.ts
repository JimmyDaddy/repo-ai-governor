/**
 * Defines built-in adapter surface identifiers used by Stage-9 runtime routing.
 *
 * Why this exists:
 * keeping surface ids centralized avoids cross-package drift between config,
 * CLI runtime routing, and adapter implementations.
 */
export enum AdapterSurface {
  CODEX = 'codex',
  GITHUB_COPILOT = 'github-copilot',
  CLAUDE_CODE = 'claude-code',
  OLLAMA = 'ollama',
}

/**
 * Defines normalized transport kinds shared by config, routing, and diagnostics.
 */
export enum AdapterTransportKind {
  BASELINE = 'baseline',
  CLI_EXEC = 'cli_exec',
  REMOTE_API = 'remote_api',
}

/**
 * Defines how the current transport selection was resolved for one tool row.
 */
export enum AdapterTransportSelectionSource {
  CONFIG_EXPLICIT = 'config_explicit',
  INFERRED_FROM_REMOTE_API = 'inferred_from_remote_api',
  SURFACE_DEFAULT = 'surface_default',
}

/**
 * Defines remote provider identifiers used by remote-api capable adapter surfaces.
 */
export enum AdapterProviderKind {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GITHUB_MODELS = 'github_models',
}

/**
 * Defines canonical vendor-binding identifiers for provider-specific remote APIs.
 */
export enum AdapterVendorBindingKind {
  OPENAI_RESPONSES = 'openai_responses',
  ANTHROPIC_MESSAGES = 'anthropic_messages',
  GITHUB_MODELS_INFERENCE = 'github_models_inference',
}

/**
 * Defines credential resolution sources surfaced by transport-aware diagnostics.
 */
export enum AdapterCredentialSource {
  NONE = 'none',
  ENV_EXPLICIT = 'env_explicit',
  ENV_DEFAULT = 'env_default',
  CREDENTIAL_REF = 'credential_ref',
  PROVIDER_LOCAL = 'provider_local',
}

/**
 * Defines endpoint resolution sources surfaced by transport-aware diagnostics.
 */
export enum AdapterEndpointSource {
  CONFIG_EXPLICIT = 'config_explicit',
  PROVIDER_LOCAL = 'provider_local',
  VENDOR_DEFAULT = 'vendor_default',
}

/**
 * Defines cancellation semantics exposed by transport-aware health checks.
 */
export enum AdapterRequestCancellationMode {
  NOT_SUPPORTED = 'not_supported',
  LOCAL_ABORT_ONLY = 'local_abort_only',
  PROVIDER_CANCEL_ATTEMPTED = 'provider_cancel_attempted',
}

/**
 * Defines where one capability/transport snapshot was sourced from.
 */
export enum AdapterCapabilitySnapshotSource {
  HEALTH_CHECK = 'health_check',
  CONFIG = 'config',
  SURFACE_DEFAULT = 'surface_default',
}

/**
 * Defines adapter availability states accepted by config/runtime diagnostics.
 *
 * Why this exists:
 * config-level availability overrides and runtime probe snapshots should share
 * one finite vocabulary to keep pass/warn/fail semantics deterministic.
 */
export enum AdapterAvailability {
  AVAILABLE = 'available',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable',
}
