import { SlotSourceEnum } from "./slot-model.js";

export enum SlotSourcePriorityRankEnum {
  ProjectLocal = 3,
  TeamShared = 2,
  Official = 1,
}

export const SOURCE_PRIORITY = Object.freeze({
  [SlotSourceEnum.ProjectLocal]: SlotSourcePriorityRankEnum.ProjectLocal,
  [SlotSourceEnum.TeamShared]: SlotSourcePriorityRankEnum.TeamShared,
  [SlotSourceEnum.Official]: SlotSourcePriorityRankEnum.Official,
} as const);

export enum SlotConflictDecisionTypeEnum {
  Merge = "merge",
  Override = "override",
}

export const SLOT_CONFLICT_DECISION_TYPES = Object.freeze(
  Object.values(SlotConflictDecisionTypeEnum),
) as readonly `${SlotConflictDecisionTypeEnum}`[];

export enum SlotSuppressedReasonEnum {
  Superseded = "superseded",
  ConflictOverride = "conflict-override",
}

export const SLOT_SUPPRESSED_REASONS = Object.freeze(
  Object.values(SlotSuppressedReasonEnum),
) as readonly `${SlotSuppressedReasonEnum}`[];

export enum SlotBlockedReasonEnum {
  MissingDependency = "missing-dependency",
}

export const SLOT_BLOCKED_REASONS = Object.freeze(
  Object.values(SlotBlockedReasonEnum),
) as readonly `${SlotBlockedReasonEnum}`[];

export enum SlotSkippedReasonEnum {
  TriggerMiss = "trigger-miss",
  ScopeMiss = "scope-miss",
}

export const SLOT_SKIPPED_REASONS = Object.freeze(
  Object.values(SlotSkippedReasonEnum),
) as readonly `${SlotSkippedReasonEnum}`[];

export enum SlotConflictResolutionPolicyEnum {
  Override = "override",
  Merge = "merge",
  Error = "error",
}

export const SLOT_CONFLICT_RESOLUTION_POLICIES = Object.freeze(
  Object.values(SlotConflictResolutionPolicyEnum),
) as readonly `${SlotConflictResolutionPolicyEnum}`[];
