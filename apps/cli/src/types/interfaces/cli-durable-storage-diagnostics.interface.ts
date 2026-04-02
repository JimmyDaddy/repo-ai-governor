import type { MemoryStoreEngine } from '@repo-ai-governor/shared';
import type { CliGovernanceCheckStatus } from '../../constants/cli-governance-runtime.constant.js';

/**
 * Defines normalized input required to inspect durable-storage surfaces from one CLI workspace.
 */
export interface CliDurableStorageInspectionOptions {
  workspaceRoot: string;
  memoryStoreRoot: string;
  configuredStoreEngine: MemoryStoreEngine;
  memoryStoreProviderName: string;
}

/**
 * Defines shared shape for one durable-storage diagnostic surface.
 */
export interface CliDurableStorageSurfaceDiagnostics {
  status: CliGovernanceCheckStatus;
  state: string;
  detail: string;
}

/**
 * Defines diagnostics for runtime session durable truth selection and provider alignment.
 */
export interface CliSessionDurableTruthDiagnostics extends CliDurableStorageSurfaceDiagnostics {
  expectedStoreEngine: MemoryStoreEngine;
  configuredStoreEngine: MemoryStoreEngine;
  memoryStoreProviderName: string;
  memoryStoreRoot: string;
  sqliteDatabasePath: string;
  databaseFileExists: boolean;
}

/**
 * Defines diagnostics for artifact-registry canonical sqlite truth.
 */
export interface CliArtifactRegistryCanonicalDiagnostics
  extends CliDurableStorageSurfaceDiagnostics {
  databaseFilePath: string;
  mainRegistryPath: string;
  archiveRegistryPath: string;
  databaseFileExists: boolean;
  mainRowCount: number;
  archiveRowCount: number;
}

/**
 * Defines diagnostics for rendered artifact-registry CSV compatibility views.
 */
export interface CliArtifactRegistryRenderedViewDiagnostics
  extends CliDurableStorageSurfaceDiagnostics {
  mainRegistryPath: string;
  archiveRegistryPath: string;
  mainMatches: boolean | null;
  archiveMatches: boolean | null;
}

/**
 * Defines diagnostics for tasks.csv sqlite projection/read-model state.
 */
export interface CliTaskLedgerProjectionDiagnostics extends CliDurableStorageSurfaceDiagnostics {
  taskLedgerRoot: string;
  databaseFilePath: string;
  sourceCount: number;
  sourceRowCount: number;
  projectedSourceCount: number;
  projectedRowCount: number;
  databaseFileExists: boolean;
}

/**
 * Defines the full durable-storage diagnostic snapshot shared by `doctor` and `verify`.
 */
export interface CliDurableStorageDiagnosticsSnapshot {
  sessionDurableTruth: CliSessionDurableTruthDiagnostics;
  artifactRegistryCanonicalTruth: CliArtifactRegistryCanonicalDiagnostics;
  artifactRegistryRenderedViews: CliArtifactRegistryRenderedViewDiagnostics;
  taskLedgerProjection: CliTaskLedgerProjectionDiagnostics;
}
