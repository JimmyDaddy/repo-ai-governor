import type { WorkspaceMode } from '@repo-ai-governor/shared';
import type {
  AdoptionPackApplicabilityScope,
  AdoptionPackCompositionPolicy,
  AdoptionPackManagedAssetGroup,
  AdoptionPackParityClass,
  AdoptionPackPlaceholderPolicy,
  AdoptionPackReadinessGroup,
  AdoptionPackReadinessSink,
  AdoptionPackRemovePolicy,
  AdoptionPackSourceKind,
  AdoptionPackSourceMode,
  AdoptionPackSurfaceKind,
  AdoptionPackUpgradePolicy,
  AdoptionPackWorkspaceModePolicy,
} from '../../constants/adoption-pack.constant.js';
import type {
  HostDistributionHandoffBridge,
  HostDistributionTarget,
  HostVerificationStatus,
} from '../../constants/index.js';
import type { StructuredWorkflowAssetRecord } from './host-distribution.interface.js';

/**
 * Defines one installer profile declared by an adoption-pack manifest.
 */
export interface AdoptionPackProfile {
  profileId: string;
  displayName: string;
  workflowAssetIds: string[];
  commandEntrypoints: string[];
  guideEntrypoints: string[];
  standardsPackRefs: string[];
  hostTargets: HostDistributionTarget[];
  bootstrapActions: string[];
  workspaceModePolicy: AdoptionPackWorkspaceModePolicy;
}

/**
 * Defines the stable manifest payload consumed by the installer layer.
 */
export interface AdoptionPackManifest {
  schemaVersion: string;
  packId: string;
  packVersion: string;
  status: string;
  ownerModule: string;
  sourceKind: AdoptionPackSourceKind;
  sourceRef: string;
  profiles: AdoptionPackProfile[];
  managedAssetGroups: AdoptionPackManagedAssetGroup[];
  managedPaths: string[];
  canonicalSourceRefs: string[];
  sourcePackRefs: string[];
  hostTargets: HostDistributionTarget[];
  handoffBridge: HostDistributionHandoffBridge;
  verificationProfileRefs: string[];
  upgradePolicy: AdoptionPackUpgradePolicy;
  removePolicy: AdoptionPackRemovePolicy;
  docsEntrypoints: string[];
}

/**
 * Defines one concrete source-resolved manifest plus provenance metadata.
 */
export interface ResolvedAdoptionPackManifest extends AdoptionPackManifest {
  resolvedSourceKind: AdoptionPackSourceKind;
  resolvedSourceRef: string;
  resolutionOrder: AdoptionPackSourceKind[];
  installSupported: boolean;
}

/**
 * Defines one template or metadata file materialized by installer bootstrap.
 */
export interface AdoptionPackTemplateRecord {
  relativePath: string;
  content: string;
  assetGroup: AdoptionPackManagedAssetGroup;
  profileIds: string[];
  description: string;
  sourceCatalogId?: string;
}

/**
 * Defines one runtime-bootstrap text surface materialized outside the static template list.
 */
export interface AdoptionPackRuntimeBootstrapRecord {
  relativePath: string;
  content: string;
  assetGroup: AdoptionPackManagedAssetGroup;
  profileIds: string[];
  description: string;
  sourceCatalogId: string;
}

/**
 * Defines one machine-readable built-in source-catalog record for parity/readiness inventory.
 */
export interface AdoptionPackSourceCatalogRecord {
  surfaceId: string;
  surfaceKind: AdoptionPackSurfaceKind;
  description: string;
  profileIds: string[];
  assetGroup: AdoptionPackManagedAssetGroup;
  parityClass: AdoptionPackParityClass;
  sourceMode: AdoptionPackSourceMode;
  sourceRef: string;
  compositionPolicy: AdoptionPackCompositionPolicy;
  placeholderPolicy: AdoptionPackPlaceholderPolicy;
  applicabilityScope: AdoptionPackApplicabilityScope;
  readinessGroup: AdoptionPackReadinessGroup;
  readinessSinkIds: AdoptionPackReadinessSink[];
  relativePath?: string;
  workflowId?: string;
  structureSourceRef?: string;
  instanceSourceMode?: AdoptionPackSourceMode;
  instanceSourceRef?: string;
  instancePlaceholderPolicy?: AdoptionPackPlaceholderPolicy;
}

/**
 * Defines one grouped readiness matrix row built from the source-catalog inventory.
 */
export interface AdoptionPackReadinessMatrixRecord {
  readinessGroup: AdoptionPackReadinessGroup;
  applicabilityScope: AdoptionPackApplicabilityScope;
  sinkIds: AdoptionPackReadinessSink[];
  surfaceIds: string[];
  note: string;
}

/**
 * Defines one built-in or source-resolved installer definition with renderable assets.
 */
export interface ResolvedAdoptionPackDefinition {
  manifest: ResolvedAdoptionPackManifest;
  workflowRecords: StructuredWorkflowAssetRecord[];
  templateRecords: AdoptionPackTemplateRecord[];
  runtimeBootstrapRecords: AdoptionPackRuntimeBootstrapRecord[];
  sourceCatalogRecords: AdoptionPackSourceCatalogRecord[];
  readinessMatrixRecords: AdoptionPackReadinessMatrixRecord[];
  capabilityCoverage: Record<string, string[]>;
}

/**
 * Defines one managed file record retained inside the install receipt.
 */
export interface AdoptionPackManagedFileRecord {
  relativePath: string;
  absolutePath: string;
  assetGroup: AdoptionPackManagedAssetGroup;
  checksumSha256: string;
  managed: boolean;
}

/**
 * Defines one machine-readable source-resolution payload retained by receipts and diff reports.
 */
export interface AdoptionPackSourceResolution {
  sourceKind: AdoptionPackSourceKind;
  sourceRef: string;
  canonicalSourceRefs: string[];
  sourcePackRefs: string[];
  resolutionOrder: AdoptionPackSourceKind[];
}

/**
 * Defines one verification row emitted by adoption-pack verification or diff flows.
 */
export interface AdoptionPackVerificationCheck {
  checkId: string;
  status: HostVerificationStatus;
  detail: string;
  inspectedPath?: string;
  expectedValue?: string;
  actualValue?: string;
}

/**
 * Defines the verification summary retained by the installer layer.
 */
export interface AdoptionPackVerificationSummary {
  schemaVersion: string;
  status: HostVerificationStatus;
  verifiedAt: string;
  verificationSummaryPath: string;
  receiptPath: string;
  checks: AdoptionPackVerificationCheck[];
  driftDetected: boolean;
  hostVerificationSummaryPath?: string;
}

/**
 * Defines the canonical install receipt persisted by `adopt apply` and `adopt upgrade`.
 */
export interface AdoptionPackInstallReceipt {
  schemaVersion: string;
  installationId: string;
  packId: string;
  packVersion: string;
  appliedProfileId: string;
  workspaceMode: WorkspaceMode;
  managedFileRecords: AdoptionPackManagedFileRecord[];
  sourceResolution: AdoptionPackSourceResolution;
  verificationSummary: AdoptionPackVerificationSummary;
  installedAt: string;
  lastUpdatedAt: string;
  receiptPath: string;
  targetRepoRoot: string;
  /** Preferred multi-target compatibility shape for current receipts. */
  hostTargets?: HostDistributionTarget[];
  /** Legacy single-target compatibility alias retained for older receipts and consumers. */
  hostTarget?: HostDistributionTarget;
  hostManifestPaths?: string[];
  hostManifestPath?: string;
  hostApplyReportPaths?: string[];
  hostApplyReportPath?: string;
  hostPackReportPath?: string;
  bundleRoot?: string;
}

/**
 * Defines one diff row emitted by `adopt diff`.
 */
export interface AdoptionPackDiffRecord {
  relativePath: string;
  assetGroup: AdoptionPackManagedAssetGroup;
  diffKind: 'missing' | 'changed' | 'extraneous_managed';
  receiptChecksumSha256: string;
  currentChecksumSha256: string | null;
}

/**
 * Defines the diff report emitted by `adopt diff`.
 */
export interface AdoptionPackDiffReport {
  schemaVersion: string;
  installationId: string;
  packId: string;
  packVersion: string;
  diffReportPath: string;
  generatedAt: string;
  status: HostVerificationStatus;
  records: AdoptionPackDiffRecord[];
  verificationSummary: AdoptionPackVerificationSummary;
}

/**
 * Defines one registry source-root override for layered pack discovery.
 */
export interface AdoptionPackRegistryOptions {
  currentWorkingDirectory?: string;
  globalPackRoot?: string;
  repoLocalPackRoot?: string;
}
