import type {
  MemoryLayeredSnapshot,
  MemoryLayeredSnapshotRequest,
} from '@repo-ai-governor/core-memory';
import type {
  MemoryContextAssemblyOutcomeValue,
  MemoryContextPolicyActionValue,
  MemoryPromotionCandidateActionValue,
  MemoryPromotionOutcomeValue,
  MemoryPromotionPhaseValue,
  MemoryRecallKindValue,
  MemoryRecallLayerValue,
  MemoryRecallSelectionPolicyValue,
} from '../aliases/index.js';

/**
 * Defines explicit metadata filters consumed by memory recall.
 */
export interface MemoryRecallMetadataFilters {
  includeNormativeBaseline?: boolean;
  normativeKeyPrefixes: string[];
  normativeTags: string[];
  projectId?: string;
  sprintId?: string;
  taskId?: string;
  artifactIds: string[];
  limitPerQuery?: number;
}

/**
 * Defines one recall request aligned with the runtime.memory-semantics contract.
 */
export interface MemoryRecallRequest {
  queryIntent: string;
  workspaceId: string;
  executionId: string;
  sessionId?: string;
  requestedLayers: MemoryRecallLayerValue[];
  requestedMemoryKinds: MemoryRecallKindValue[];
  metadataFilters: MemoryRecallMetadataFilters;
  recallOrder: MemoryRecallKindValue[];
  selectionPolicy: MemoryRecallSelectionPolicyValue;
}

/**
 * Defines one normalized provenance reference retained during recall and assembly.
 */
export interface MemorySourceRef {
  reference: string;
  referenceType: 'record' | 'source_ref' | 'artifact' | 'path';
}

/**
 * Defines one recalled memory record normalized for semantic consumption.
 */
export interface MemoryRecalledRecord {
  recordId: string;
  namespace: string;
  key: string;
  layer: MemoryRecallLayerValue;
  memoryKind: MemoryRecallKindValue;
  payload: Record<string, unknown>;
  tags: string[];
  updatedAt: string;
  sourceRefs: MemorySourceRef[];
  sensitivity: string[];
  visibility: string[];
}

/**
 * Defines one machine-readable recall summary.
 */
export interface MemoryRecallResultSummary {
  matchedRecordCount: number;
  selectedRecordCount: number;
  normativeEntryCount: number;
  executionEntryCount: number;
  sessionEntryCount: number;
  requestedLayerCount: number;
}

/**
 * Defines one normalized recall result.
 */
export interface MemoryRecallResult {
  queryIntent: string;
  workspaceId: string;
  executionId: string;
  sessionId: string | null;
  requestedLayers: MemoryRecallLayerValue[];
  requestedMemoryKinds: MemoryRecallKindValue[];
  metadataFilters: MemoryRecallMetadataFilters;
  recallOrder: MemoryRecallKindValue[];
  selectionPolicy: MemoryRecallSelectionPolicyValue;
  selector: MemoryLayeredSnapshotRequest;
  layeredSnapshot: MemoryLayeredSnapshot;
  selectedRecords: MemoryRecalledRecord[];
  resultSummary: MemoryRecallResultSummary;
}

/**
 * Defines one prompt-safe memory context item injected into runtime stage inputs.
 */
export interface MemoryContextOutputItem {
  recordId: string;
  layer: MemoryRecallLayerValue;
  memoryKind: MemoryRecallKindValue;
  summary: string;
  sourceRefs: string[];
  updatedAt: string;
  sensitivity: string[];
  visibility: string[];
  policyAction: MemoryContextPolicyActionValue;
  policyReasons: string[];
}

/**
 * Defines one assembled output context payload.
 */
export interface MemoryContextOutput {
  recallItems: MemoryContextOutputItem[];
}

/**
 * Defines one contract-safe summary item derived from assembled output context.
 */
export interface MemoryContextContractSafeSummaryItem {
  recordId: string;
  layer: MemoryRecallLayerValue;
  memoryKind: MemoryRecallKindValue;
  summary: string;
  sourceRefs: string[];
  sourceRefCount: number;
  explicitSourceRefCount: number;
  updatedAt: string;
  sensitivity: string[];
  visibility: string[];
  policyAction: MemoryContextPolicyActionValue;
  policyReasons: string[];
}

export interface MemoryContextPolicySummary {
  overallAction: MemoryContextPolicyActionValue;
  actionCounts: Record<MemoryContextPolicyActionValue, number>;
  allowedRecordCount: number;
  warningRecordCount: number;
  redactedRecordCount: number;
  blockedRecordCount: number;
}

/**
 * Defines machine-readable selection summary for assembled context.
 */
export interface MemoryContextSelectionSummary {
  selectedRecordCount: number;
  layerCounts: Partial<Record<MemoryRecallLayerValue, number>>;
  memoryKindCounts: Partial<Record<MemoryRecallKindValue, number>>;
}

/**
 * Defines machine-readable provenance summary for assembled context.
 */
export interface MemoryContextProvenanceSummary {
  sourceRefCount: number;
  recordsMissingExplicitSourceRefs: number;
  canonicalSourceNote: string;
}

/**
 * Defines one machine-readable summary safe to share with downstream runtime consumers.
 */
export interface MemoryContextContractSafeSummary {
  executionId: string;
  queryIntent: string;
  assemblyOutcome: MemoryContextAssemblyOutcomeValue;
  selectedRecordCount: number;
  layerCounts: Partial<Record<MemoryRecallLayerValue, number>>;
  memoryKindCounts: Partial<Record<MemoryRecallKindValue, number>>;
  sourceRefCount: number;
  recordsMissingExplicitSourceRefs: number;
  canonicalSourceNote: string;
  truncationReason: string | null;
  safetyNotes: string[];
  policySummary: MemoryContextPolicySummary;
  items: MemoryContextContractSafeSummaryItem[];
}

/**
 * Defines one context assembly request.
 */
export interface MemoryContextAssemblyRequest {
  recallResult: MemoryRecallResult;
  maxRecordCount?: number;
}

/**
 * Defines one assembled context payload aligned with the runtime.memory-semantics contract.
 */
export interface MemoryContextAssemblyResult {
  executionId: string;
  queryIntent: string;
  selectedRecords: MemoryRecalledRecord[];
  selectionSummary: MemoryContextSelectionSummary;
  outputContext: MemoryContextOutput;
  contractSafeSummary: MemoryContextContractSafeSummary;
  sourceRefs: MemorySourceRef[];
  provenanceSummary: MemoryContextProvenanceSummary;
  truncationReason: string | null;
  safetyNotes: string[];
  policySummary: MemoryContextPolicySummary;
  assemblyOutcome: MemoryContextAssemblyOutcomeValue;
}

/**
 * Defines one promotion request built from contract-safe context.
 */
export interface MemoryPromotionRequest {
  contextSummary: MemoryContextContractSafeSummary;
  sessionId?: string | null;
  persist?: boolean;
  promotedBy?: string;
}

/**
 * Defines validation facts for one promotion candidate.
 */
export interface MemoryPromotionCandidateValidation {
  reusable: boolean;
  attributable: boolean;
  traceable: boolean;
  sensitivityLabeled: boolean;
  sensitivitySafe: boolean;
  canonicalSourceSafe: boolean;
  failureReasons: string[];
}

/**
 * Defines one promotion candidate decision.
 */
export interface MemoryPromotionCandidateDecision {
  sourceRecordId: string;
  sourceLayer: MemoryRecallLayerValue;
  memoryKind: MemoryRecallKindValue;
  action: MemoryPromotionCandidateActionValue;
  targetLayer: MemoryRecallLayerValue | null;
  targetScope: string | null;
  targetKey: string | null;
  mergeStrategy: string | null;
  decisionReason: string;
  validation: MemoryPromotionCandidateValidation;
}

/**
 * Defines one explicit promotion pipeline phase summary.
 */
export interface MemoryPromotionPhaseResult {
  phase: MemoryPromotionPhaseValue;
  status: 'completed' | 'skipped';
  candidateCount: number;
  detail: string;
}

/**
 * Defines one machine-readable promotion summary.
 */
export interface MemoryPromotionSummary {
  candidateCount: number;
  promotableCount: number;
  plannedMergeCount: number;
  mergedCount: number;
  skippedCount: number;
  rejectedCount: number;
  targetLayerCounts: Partial<Record<MemoryRecallLayerValue, number>>;
  failureReasonCounts: Record<string, number>;
}

/**
 * Defines one persisted session summary projection.
 */
export interface MemoryPromotionPersistedRecord {
  scope: string;
  key: string;
  promotedRecordIds: string[];
  updatedAt: string;
}

/**
 * Defines one explicit promotion pipeline result.
 */
export interface MemoryPromotionResult {
  executionId: string;
  queryIntent: string;
  sessionId: string | null;
  outcome: MemoryPromotionOutcomeValue;
  summary: MemoryPromotionSummary;
  candidateDecisions: MemoryPromotionCandidateDecision[];
  phaseResults: MemoryPromotionPhaseResult[];
  persistedRecord: MemoryPromotionPersistedRecord | null;
}
