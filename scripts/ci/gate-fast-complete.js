#!/usr/bin/env node

/**
 * Prints a concise success marker for Turbo gate:fast orchestration.
 * Why this exists:
 * Turbo root task graph requires a terminal script node for `gate:fast`.
 */
console.info("[gate:fast] Turbo fast-profile pipeline completed.");
