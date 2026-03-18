import type {
  SLOT_BLOCKED_REASONS,
  SLOT_CONFLICT_DECISION_TYPES,
  SLOT_CONFLICT_RESOLUTION_POLICIES,
  SLOT_SKIPPED_REASONS,
  SLOT_SUPPRESSED_REASONS,
} from "../../constants/slot-runtime.js";
import type { SlotDefinition, SlotScriptExtension } from "../interfaces/slot-model.interface.js";
import type {
  ResolvedConflictMergeDecision,
  ResolvedConflictOverrideDecision,
  SlotEntryConfigInput,
} from "../interfaces/slot-runtime.interface.js";
import type { SlotConflictPolicy } from "./slot.type.js";

export type ConflictPolicy = SlotConflictPolicy;

export type DefaultConflictPolicy = Exclude<ConflictPolicy, "replace">;

export type SlotEntryInput = SlotDefinition | SlotEntryConfigInput;

export type ResolvedConflictDecision =
  | ResolvedConflictMergeDecision
  | ResolvedConflictOverrideDecision;

export type SlotConflictDecisionType = (typeof SLOT_CONFLICT_DECISION_TYPES)[number];

export type SlotSuppressedReason = (typeof SLOT_SUPPRESSED_REASONS)[number];

export type SlotBlockedReason = (typeof SLOT_BLOCKED_REASONS)[number];

export type SlotSkippedReason = (typeof SLOT_SKIPPED_REASONS)[number];

export type SlotConflictResolutionPolicyType = (typeof SLOT_CONFLICT_RESOLUTION_POLICIES)[number];

export type SlotExtensionSummaryScript = {
  slotId: string;
  slotSource: SlotDefinition["meta"]["source"];
  slotType: SlotDefinition["meta"]["slotType"];
} & SlotScriptExtension;
