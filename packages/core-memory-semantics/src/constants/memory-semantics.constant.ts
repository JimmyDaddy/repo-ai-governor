export const MemoryRecallLayer = {
  EXECUTION: "execution",
  SESSION: "session",
  WORKSPACE: "workspace",
  USER: "user",
  NORMATIVE: "normative",
} as const;

export const MemoryRecallKind = {
  EXECUTION_SHORT_TERM_FACT: "execution_short_term_fact",
  SESSION: "session",
  WORKSPACE: "workspace",
  USER: "user",
  NORMATIVE_PROJECTION: "normative_projection",
} as const;

export const MemoryContextAssemblyOutcome = {
  CONTEXT_READY: "context_ready",
  NO_MATCHING_RECORDS: "no_matching_records",
  TRUNCATED: "truncated",
} as const;

export const MemoryPromotionCandidateAction = {
  MERGE: "merge",
  SKIP: "skip",
  REJECT: "reject",
} as const;

export const MemoryPromotionPhase = {
  CAPTURE_CANDIDATES: "capture_candidates",
  CLASSIFY_CANDIDATES: "classify_candidates",
  VALIDATE_CANDIDATES: "validate_candidates",
  DECIDE_TARGET_LAYER: "decide_target_layer",
  MERGE_OR_PERSIST: "merge_or_persist",
} as const;

export const MemoryPromotionOutcome = {
  SESSION_SUMMARY_MERGED: "session_summary_merged",
  NO_ELIGIBLE_CANDIDATES: "no_eligible_candidates",
  PLAN_ONLY: "plan_only",
} as const;

export const DEFAULT_MEMORY_RECALL_LAYERS = [
  MemoryRecallLayer.EXECUTION,
  MemoryRecallLayer.SESSION,
  MemoryRecallLayer.WORKSPACE,
  MemoryRecallLayer.USER,
  MemoryRecallLayer.NORMATIVE,
] as const;

export const DEFAULT_MEMORY_RECALL_ORDER = [
  MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
  MemoryRecallKind.SESSION,
  MemoryRecallKind.WORKSPACE,
  MemoryRecallKind.USER,
  MemoryRecallKind.NORMATIVE_PROJECTION,
] as const;

export const MEMORY_RECALL_SELECTION_POLICY = "metadata_first_explicit_ordering" as const;

export const DEFAULT_MEMORY_CONTEXT_RECORD_LIMIT = 12;

export const MEMORY_CANONICAL_SOURCE_NOTE =
  "memory_projection_only_canonical_source_stays_external" as const;

export const MEMORY_PROMOTION_FORBIDDEN_SENSITIVITY_LABELS = [
  "credential",
  "password",
  "pii",
  "restricted",
  "secret",
  "token",
] as const;

export type MemoryRecallLayerValue = (typeof MemoryRecallLayer)[keyof typeof MemoryRecallLayer];

export type MemoryRecallKindValue = (typeof MemoryRecallKind)[keyof typeof MemoryRecallKind];

export type MemoryRecallSelectionPolicyValue = typeof MEMORY_RECALL_SELECTION_POLICY;

export type MemoryContextAssemblyOutcomeValue =
  (typeof MemoryContextAssemblyOutcome)[keyof typeof MemoryContextAssemblyOutcome];

export type MemoryPromotionCandidateActionValue =
  (typeof MemoryPromotionCandidateAction)[keyof typeof MemoryPromotionCandidateAction];

export type MemoryPromotionPhaseValue =
  (typeof MemoryPromotionPhase)[keyof typeof MemoryPromotionPhase];

export type MemoryPromotionOutcomeValue =
  (typeof MemoryPromotionOutcome)[keyof typeof MemoryPromotionOutcome];
