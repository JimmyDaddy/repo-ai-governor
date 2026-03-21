/**
 * Defines dependency resolution statuses shared by resolver, audit, and reporting.
 *
 * Why this exists:
 * a single enum source prevents cross-package contract drift in runtime outputs.
 */
export enum DependencyResolutionStatus {
  RESOLVED = "resolved",
  WARNED = "warned",
  ESCALATED = "escalated",
  BLOCKED = "blocked",
}

/**
 * Defines all dependency resolution statuses accepted by runtime validators.
 */
export const ALL_DEPENDENCY_RESOLUTION_STATUSES = new Set<string>(
  Object.values(DependencyResolutionStatus),
);
