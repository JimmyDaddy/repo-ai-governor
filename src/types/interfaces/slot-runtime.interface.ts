import type {
  SlotBlockedReason,
  SlotConflictDecisionType,
  SlotConflictResolutionPolicyType,
  SlotSkippedReason,
  SlotSuppressedReason,
} from "../aliases/slot-runtime.type.js";
import type { SlotSource, SlotType } from "../aliases/slot.type.js";
import type {
  SlotChecks,
  SlotDefinition,
  SlotInject,
  SlotScriptExtension,
} from "./slot-model.interface.js";

export interface SlotEntryConfigInput {
  config: SlotDefinition;
  filePath?: string | null;
}

export interface RuntimeSlotEntry {
  id: string;
  filePath: string | null;
  definition: SlotDefinition;
}

export interface SerializableSlot {
  id: string;
  filePath: string | null;
  source: SlotSource;
  slotType: SlotType;
  owner: string | null;
  priority: number;
  blockOnFailure: boolean;
  requiresApproval: boolean;
  conflictPolicy: SlotDefinition["behavior"]["conflictPolicy"];
  dependsOn: string[];
  supersedes: string[];
  inject: SlotInject;
  checks: SlotChecks;
  extensions: {
    scripts: SlotScriptExtension[];
  };
}

export interface CriterionMatchResult {
  configured: boolean;
  matched: boolean;
  expected: string[];
  actual: string[];
}

export interface TriggerEvaluation {
  matched: boolean;
  matchMode: SlotDefinition["trigger"]["match"];
  checks: {
    stages: CriterionMatchResult;
    commands: CriterionMatchResult;
    adapters: CriterionMatchResult;
    events: CriterionMatchResult;
    paths: CriterionMatchResult;
  };
}

export interface ScopeEvaluation {
  matched: boolean;
  checks: {
    projects: CriterionMatchResult;
    languages: CriterionMatchResult;
    frameworks: CriterionMatchResult;
    files: CriterionMatchResult;
    tags: CriterionMatchResult;
  };
}

export interface RuntimeMatchedEntry extends RuntimeSlotEntry {
  trigger: TriggerEvaluation;
  scope: ScopeEvaluation;
}

export interface ResolvedConflictMergeDecision {
  type: SlotConflictDecisionType;
  conflictKey: string;
  slotIds: string[];
}

export interface ResolvedConflictOverrideDecision {
  type: SlotConflictDecisionType;
  conflictKey: string;
  winner: string;
  slotIds: string[];
}

export interface SlotRuntime {
  currentProject: string | null;
  language: string | null;
  framework: string | null;
  defaultConflictPolicy: Exclude<SlotDefinition["behavior"]["conflictPolicy"], "replace">;
  availableSlots: RuntimeSlotEntry[];
  enabledSlots: RuntimeSlotEntry[];
}

export interface SlotResolutionCriteria {
  stageId?: string;
  stageIds?: string[];
  commandId?: string;
  commandIds?: string[];
  adapterId?: string;
  adapterIds?: string[];
  eventId?: string;
  eventIds?: string[];
  path?: string | string[];
  paths?: string | string[];
  changedPaths?: string | string[];
  project?: string;
  projects?: string[];
  language?: string;
  languages?: string[];
  framework?: string;
  frameworks?: string[];
  tags?: string[];
}

export interface NormalizedCriteria {
  stageIds: string[];
  commandIds: string[];
  adapterIds: string[];
  eventIds: string[];
  paths: string[];
  projects: string[];
  languages: string[];
  frameworks: string[];
  tags: string[];
}

export interface SlotSuppressedBySupersede extends SerializableSlot {
  reason: SlotSuppressedReason;
  bySlotId: string;
}

export interface SlotSuppressedByConflictOverride extends SerializableSlot {
  reason: SlotSuppressedReason;
  bySlotId: string;
  conflictKey: string;
}

export interface SlotBlockedByMissingDependency extends SerializableSlot {
  reason: SlotBlockedReason;
  missingDependencies: string[];
}

export interface SlotSkippedByCriteria extends SerializableSlot {
  reason: SlotSkippedReason;
  trigger: TriggerEvaluation;
  scope: ScopeEvaluation;
}

export interface SlotInjectionSummary {
  aiPromptKeys: string[];
  humanDocSections: string[];
}

export interface SlotChecksSummary {
  before: string[];
  after: string[];
}

export interface SlotExtensionSummary {
  scriptCount: number;
  scripts: Array<
    {
      slotId: string;
      slotSource: SlotDefinition["meta"]["source"];
      slotType: SlotDefinition["meta"]["slotType"];
    } & SlotScriptExtension
  >;
}

export interface SlotConflictGroup {
  key: string;
  entries: RuntimeSlotEntry[];
}

export interface SlotConflictResolutionPolicy {
  policy: SlotConflictResolutionPolicyType;
  winner: RuntimeSlotEntry | null;
}

export interface SlotConflictResolutionResult {
  suppressedEntries: SlotSuppressedByConflictOverride[];
  decisions: Array<ResolvedConflictMergeDecision | ResolvedConflictOverrideDecision>;
}

export interface BuildSlotRuntimeOptions {
  config?: {
    project?: {
      language?: string;
      framework?: string;
    };
    execution?: {
      currentProject?: string;
    };
    slots?: {
      enabled?: string[];
      disabled?: string[];
      conflictPolicy?: SlotDefinition["behavior"]["conflictPolicy"];
    };
  };
  slotDefinitions?: Array<SlotDefinition | SlotEntryConfigInput>;
}

export interface ResolveApplicableSlotsResult {
  criteria: NormalizedCriteria;
  summary: {
    enabledCount: number;
    matchedCount: number;
    activeCount: number;
    blockedCount: number;
    suppressedCount: number;
  };
  matchedSlots: SerializableSlot[];
  activeSlots: SerializableSlot[];
  blockedSlots: SlotBlockedByMissingDependency[];
  suppressedSlots: Array<SlotSuppressedBySupersede | SlotSuppressedByConflictOverride>;
  skippedSlots: SlotSkippedByCriteria[];
  conflicts: Array<ResolvedConflictMergeDecision | ResolvedConflictOverrideDecision>;
  injections: SlotInjectionSummary;
  checks: SlotChecksSummary;
  extensions: SlotExtensionSummary;
  requiresApproval: boolean;
  blockOnFailure: boolean;
}
