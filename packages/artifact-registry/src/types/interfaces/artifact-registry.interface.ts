import type {
  ArtifactDependencyFailureAction,
  ArtifactDependencyResolutionPolicy,
  ArtifactDependencyResolutionStatus,
  ArtifactDependencyUnresolvedReason,
  ArtifactLifecycleStatus,
} from '../../constants/index.js';
import type { ArtifactDependencyExpression } from '../aliases/index.js';

/**
 * Defines one normalized artifact registry record.
 */
export interface ArtifactRegistryRecord {
  artifactId: string;
  artifactType: string;
  artifactPath: string;
  artifactVersion: string;
  artifactStatus: ArtifactLifecycleStatus;
  producerTaskId: string;
  producerExecutionId: string;
  registeredAt: string;
  lastUpdatedAt: string;
  dependentTasks: string[];
}

/**
 * Defines one artifact upsert request payload.
 */
export interface RegisterArtifactOptions {
  artifactId: string;
  artifactType: string;
  artifactPath: string;
  artifactVersion: string;
  artifactStatus: ArtifactLifecycleStatus;
  producerTaskId: string;
  producerExecutionId: string;
  registeredAt?: string;
  lastUpdatedAt?: string;
  dependentTasks?: string[];
}

/**
 * Defines one artifact query payload.
 */
export interface ListArtifactsOptions {
  artifactIds?: string[];
  statuses?: ArtifactLifecycleStatus[];
  producerTaskId?: string;
}

/**
 * Defines one index-store contract for artifact runtime persistence.
 */
export interface ArtifactIndexStore {
  /**
   * Lists all stored registry records.
   * @returns Artifact registry rows.
   */
  list(): Promise<ArtifactRegistryRecord[]>;

  /**
   * Upserts one artifact registry row.
   * @param record Normalized record payload.
   * @returns Upserted record.
   */
  upsert(record: ArtifactRegistryRecord): Promise<ArtifactRegistryRecord>;
}

/**
 * Defines one parsed dependency expression payload.
 */
export interface ParsedArtifactDependency {
  rawExpression: ArtifactDependencyExpression;
  artifactId: string;
  constraint?: string;
}

/**
 * Defines one dependency resolution request payload.
 */
export interface ResolveArtifactDependenciesOptions {
  consumerTaskId: string;
  dependsOnArtifacts: ArtifactDependencyExpression[];
  resolutionPolicy?: ArtifactDependencyResolutionPolicy;
  missingArtifactAction?: ArtifactDependencyFailureAction;
  versionMismatchAction?: ArtifactDependencyFailureAction;
}

/**
 * Defines one unresolved dependency row.
 */
export interface ArtifactDependencyUnresolvedItem {
  dependency: ParsedArtifactDependency;
  reason: ArtifactDependencyUnresolvedReason;
  action: ArtifactDependencyFailureAction;
  message: string;
}

/**
 * Defines one dependency resolution audit field payload.
 */
export interface ArtifactDependencyResolutionAuditFields {
  dependencyResolutionStatus: ArtifactDependencyResolutionStatus;
  requiredAction: ArtifactDependencyFailureAction;
  consumerTaskId: string;
  resolutionPolicy: ArtifactDependencyResolutionPolicy;
  resolvedArtifactIds: string[];
  unresolvedDependencies: string[];
}

/**
 * Defines one dependency resolution result payload.
 */
export interface ArtifactDependencyResolutionResult {
  consumerTaskId: string;
  resolutionPolicy: ArtifactDependencyResolutionPolicy;
  resolutionStatus: ArtifactDependencyResolutionStatus;
  requiredAction: ArtifactDependencyFailureAction;
  resolvedArtifacts: ArtifactRegistryRecord[];
  unresolved: ArtifactDependencyUnresolvedItem[];
  messages: string[];
  auditFields: ArtifactDependencyResolutionAuditFields;
}
