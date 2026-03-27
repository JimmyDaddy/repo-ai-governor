import type {
  MemoryLayeredSnapshot,
  MemoryLayeredSnapshotRequest,
} from "@repo-ai-governor/core-memory";
import type {
  MemoryContextAssemblyOutcomeValue,
  MemoryRecallKindValue,
  MemoryRecallLayerValue,
  MemoryRecallSelectionPolicyValue,
} from "../aliases/index.js";

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
  referenceType: "record" | "source_ref" | "artifact" | "path";
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
}

/**
 * Defines one assembled output context payload.
 */
export interface MemoryContextOutput {
  recallItems: MemoryContextOutputItem[];
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
  sourceRefs: MemorySourceRef[];
  provenanceSummary: MemoryContextProvenanceSummary;
  truncationReason: string | null;
  safetyNotes: string[];
  assemblyOutcome: MemoryContextAssemblyOutcomeValue;
}
