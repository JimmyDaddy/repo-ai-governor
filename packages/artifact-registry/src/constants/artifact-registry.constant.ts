import { DependencyResolutionStatus } from '@repo-ai-governor/shared';

/**
 * Defines full lifecycle statuses accepted by artifact registry records.
 */
export enum ArtifactLifecycleStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
  RETIRED = 'retired',
}

/**
 * Defines dependency resolution policy levels.
 */
export enum ArtifactDependencyResolutionPolicy {
  STRICT = 'strict',
  COMPATIBLE = 'compatible',
  LATEST = 'latest',
}

/**
 * Defines dependency resolution actions aligned with policy outcome semantics.
 */
export enum ArtifactDependencyFailureAction {
  ALLOW = 'allow',
  WARN = 'warn',
  ESCALATE = 'escalate',
  BLOCK = 'block',
}

export { DependencyResolutionStatus as ArtifactDependencyResolutionStatus };

/**
 * Defines unresolved dependency reasons for deterministic diagnostics.
 */
export enum ArtifactDependencyUnresolvedReason {
  MISSING = 'missing',
  VERSION_INCOMPATIBLE = 'version_incompatible',
  STATUS_NOT_RESOLVABLE = 'status_not_resolvable',
  AMBIGUOUS_MATCH = 'ambiguous_match',
}

/**
 * Defines artifact statuses that are eligible for automatic dependency injection.
 */
export const RESOLVABLE_ARTIFACT_STATUSES = new Set<string>([
  ArtifactLifecycleStatus.ACTIVE,
  ArtifactLifecycleStatus.FROZEN,
]);

/**
 * Defines all lifecycle statuses accepted by artifact registry runtime.
 */
export const ALL_ARTIFACT_LIFECYCLE_STATUSES = new Set<string>(
  Object.values(ArtifactLifecycleStatus),
);

/**
 * Defines all supported dependency resolution policies.
 */
export const ALL_ARTIFACT_RESOLUTION_POLICIES = new Set<string>(
  Object.values(ArtifactDependencyResolutionPolicy),
);

/**
 * Defines all supported dependency resolution actions.
 */
export const ALL_ARTIFACT_FAILURE_ACTIONS = new Set<string>(
  Object.values(ArtifactDependencyFailureAction),
);

/**
 * Defines deterministic severity used to merge multi-dependency outcomes.
 */
export const ARTIFACT_FAILURE_ACTION_SEVERITY: Record<ArtifactDependencyFailureAction, number> = {
  [ArtifactDependencyFailureAction.ALLOW]: 1,
  [ArtifactDependencyFailureAction.WARN]: 2,
  [ArtifactDependencyFailureAction.ESCALATE]: 3,
  [ArtifactDependencyFailureAction.BLOCK]: 4,
};

/**
 * Defines strict artifact version grammar used by runtime matching.
 */
export const ARTIFACT_VERSION_PATTERN = /^v\d+(?:\.\d+){0,2}$/u;

/**
 * Defines dependency expression grammar: `artifactId` or `artifactId@constraint`.
 */
export const ARTIFACT_DEPENDENCY_EXPRESSION_PATTERN =
  /^(?<artifactId>[A-Za-z0-9._-]+)(?:@(?<constraint>\^?v\d+(?:\.\d+){0,2}))?$/u;
