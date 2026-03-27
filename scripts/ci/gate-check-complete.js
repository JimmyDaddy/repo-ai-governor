#!/usr/bin/env node

/**
 * Prints a concise success marker for Turbo gate orchestration.
 * Why this exists:
 * Turbo root task graph requires a terminal script node for `gate:check`.
 */
console.info('[gate:check] Turbo pipeline completed.');
