/**
 * Defines built-in adapter surface identifiers used by Stage-9 runtime routing.
 *
 * Why this exists:
 * keeping surface ids centralized avoids cross-package drift between config,
 * CLI runtime routing, and adapter implementations.
 */
export enum AdapterSurface {
  CODEX = "codex",
  GITHUB_COPILOT = "github-copilot",
  CLAUDE_CODE = "claude-code",
  OLLAMA = "ollama",
}

/**
 * Defines adapter availability states accepted by config/runtime diagnostics.
 *
 * Why this exists:
 * config-level availability overrides and runtime probe snapshots should share
 * one finite vocabulary to keep pass/warn/fail semantics deterministic.
 */
export enum AdapterAvailability {
  AVAILABLE = "available",
  DEGRADED = "degraded",
  UNAVAILABLE = "unavailable",
}
