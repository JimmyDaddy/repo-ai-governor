import {
  compareSlotsByPriority,
  type SlotChecks,
  type SlotDefinition,
  type SlotInject,
  type SlotScriptExtension,
  type SlotSource,
  type SlotType,
  validateSlotDefinition,
} from "./slot-model.js";
import { cloneValue } from "../utils/common.js";

type GenericRecord = Record<string, unknown>;

type ConflictPolicy = "error" | "override" | "merge" | "replace";

type SlotEntryInput =
  | SlotDefinition
  | {
      config: SlotDefinition;
      filePath?: string | null;
    };

type RuntimeSlotEntry = {
  id: string;
  filePath: string | null;
  definition: SlotDefinition;
};

export type SerializableSlot = {
  id: string;
  filePath: string | null;
  source: SlotSource;
  slotType: SlotType;
  owner: string | null;
  priority: number;
  blockOnFailure: boolean;
  requiresApproval: boolean;
  conflictPolicy: ConflictPolicy;
  dependsOn: string[];
  supersedes: string[];
  inject: SlotInject;
  checks: SlotChecks;
  extensions: {
    scripts: SlotScriptExtension[];
  };
};

type CriterionMatchResult = {
  configured: boolean;
  matched: boolean;
  expected: string[];
  actual: string[];
};

type TriggerEvaluation = {
  matched: boolean;
  matchMode: "any" | "all";
  checks: {
    stages: CriterionMatchResult;
    commands: CriterionMatchResult;
    adapters: CriterionMatchResult;
    events: CriterionMatchResult;
    paths: CriterionMatchResult;
  };
};

type ScopeEvaluation = {
  matched: boolean;
  checks: {
    projects: CriterionMatchResult;
    languages: CriterionMatchResult;
    frameworks: CriterionMatchResult;
    files: CriterionMatchResult;
    tags: CriterionMatchResult;
  };
};

type RuntimeMatchedEntry = RuntimeSlotEntry & {
  trigger: TriggerEvaluation;
  scope: ScopeEvaluation;
};

type ResolvedConflictDecision =
  | {
      type: "merge";
      conflictKey: string;
      slotIds: string[];
    }
  | {
      type: "override";
      conflictKey: string;
      winner: string;
      slotIds: string[];
    };

export type SlotRuntime = {
  currentProject: string | null;
  language: string | null;
  framework: string | null;
  defaultConflictPolicy: Exclude<ConflictPolicy, "replace">;
  availableSlots: RuntimeSlotEntry[];
  enabledSlots: RuntimeSlotEntry[];
};

export type SlotResolutionCriteria = {
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
};

type NormalizedCriteria = {
  stageIds: string[];
  commandIds: string[];
  adapterIds: string[];
  eventIds: string[];
  paths: string[];
  projects: string[];
  languages: string[];
  frameworks: string[];
  tags: string[];
};

const SOURCE_PRIORITY = Object.freeze({
  "project-local": 3,
  "team-shared": 2,
  official: 1,
} as const);

const CONFLICT_POLICY_ALIAS = Object.freeze({
  replace: "override",
} as const);

function toArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  return [value];
}

function uniqueValues(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function normalizePath(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function escapeRegExp(value: string): string {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function createGlobMatcher(pattern: string): RegExp {
  const normalizedPattern = normalizePath(pattern);
  let expression = "";

  for (let index = 0; index < normalizedPattern.length; index += 1) {
    const character = normalizedPattern[index];
    const nextCharacter = normalizedPattern[index + 1];

    if (character === "*" && nextCharacter === "*") {
      expression += ".*";
      index += 1;
      continue;
    }

    if (character === "*") {
      expression += "[^/]*";
      continue;
    }

    expression += escapeRegExp(character);
  }

  return new RegExp(`^${expression}$`);
}

function matchesAnyGlob(patterns: string[], candidatePaths: string[]): boolean {
  if (patterns.length === 0) {
    return true;
  }

  if (candidatePaths.length === 0) {
    return false;
  }

  const matchers = patterns.map((pattern) => createGlobMatcher(pattern));
  return candidatePaths.some((candidatePath) =>
    matchers.some((matcher) => matcher.test(normalizePath(candidatePath))),
  );
}

function matchExactList(expectedValues: string[], actualValues: string[]): boolean {
  if (expectedValues.length === 0) {
    return true;
  }

  if (actualValues.length === 0) {
    return false;
  }

  return expectedValues.some((expectedValue) => actualValues.includes(expectedValue));
}

function normalizeConflictPolicy(policy: unknown): Exclude<ConflictPolicy, "replace"> {
  const normalized = String(policy ?? "error")
    .trim()
    .toLowerCase();
  const resolved =
    CONFLICT_POLICY_ALIAS[normalized as keyof typeof CONFLICT_POLICY_ALIAS] ?? normalized;

  if (resolved === "override" || resolved === "merge") {
    return resolved;
  }

  return "error";
}

function compareRuntimeSlotEntries(
  leftEntry: RuntimeSlotEntry,
  rightEntry: RuntimeSlotEntry,
): number {
  const priorityComparison = compareSlotsByPriority(leftEntry.definition, rightEntry.definition);

  if (priorityComparison !== 0) {
    return priorityComparison;
  }

  const leftSourceRank = SOURCE_PRIORITY[leftEntry.definition.meta.source] ?? 0;
  const rightSourceRank = SOURCE_PRIORITY[rightEntry.definition.meta.source] ?? 0;

  if (leftSourceRank !== rightSourceRank) {
    return rightSourceRank - leftSourceRank;
  }

  return leftEntry.id.localeCompare(rightEntry.id);
}

function normalizeSlotEntry(rawEntry: SlotEntryInput): RuntimeSlotEntry {
  const hasConfigWrapper =
    typeof rawEntry === "object" && rawEntry !== null && "config" in rawEntry;
  const definition = validateSlotDefinition(
    hasConfigWrapper ? (rawEntry as { config: unknown }).config : rawEntry,
  );

  return {
    id: definition.id,
    filePath:
      hasConfigWrapper && typeof (rawEntry as { filePath?: unknown }).filePath === "string"
        ? (rawEntry as { filePath: string }).filePath
        : null,
    definition,
  };
}

function evaluateTriggerCriterion(
  expectedValues: string[],
  actualValues: string[],
  matcher: (expected: string[], actual: string[]) => boolean,
): CriterionMatchResult {
  const configuredValues = uniqueValues(expectedValues);
  const currentValues = uniqueValues(actualValues);

  if (configuredValues.length === 0) {
    return {
      configured: false,
      matched: true,
      expected: configuredValues,
      actual: currentValues,
    };
  }

  if (currentValues.length === 0) {
    return {
      configured: true,
      matched: false,
      expected: configuredValues,
      actual: currentValues,
    };
  }

  const matched = matcher(configuredValues, currentValues);
  return {
    configured: true,
    matched,
    expected: configuredValues,
    actual: currentValues,
  };
}

function evaluateScopeCriterion(
  expectedValues: string[],
  actualValues: string[],
  matcher: (expected: string[], actual: string[]) => boolean,
): CriterionMatchResult {
  const configuredValues = uniqueValues(expectedValues);
  const currentValues = uniqueValues(actualValues);

  if (configuredValues.length === 0) {
    return {
      configured: false,
      matched: true,
      expected: configuredValues,
      actual: currentValues,
    };
  }

  if (currentValues.length === 0) {
    return {
      configured: true,
      matched: false,
      expected: configuredValues,
      actual: currentValues,
    };
  }

  const matched = matcher(configuredValues, currentValues);
  return {
    configured: true,
    matched,
    expected: configuredValues,
    actual: currentValues,
  };
}

function normalizeCriteria(
  criteria: SlotResolutionCriteria = {},
  slotRuntime: SlotRuntime,
): NormalizedCriteria {
  return {
    stageIds: uniqueValues([criteria.stageId, ...(criteria.stageIds ?? [])]),
    commandIds: uniqueValues([criteria.commandId, ...(criteria.commandIds ?? [])]),
    adapterIds: uniqueValues([criteria.adapterId, ...(criteria.adapterIds ?? [])]),
    eventIds: uniqueValues([criteria.eventId, ...(criteria.eventIds ?? [])]),
    paths: uniqueValues(
      [
        ...toArray(criteria.path),
        ...toArray(criteria.paths),
        ...toArray(criteria.changedPaths),
      ].map(normalizePath),
    ),
    projects: uniqueValues([
      criteria.project,
      ...(criteria.projects ?? []),
      slotRuntime.currentProject,
    ]),
    languages: uniqueValues([
      criteria.language,
      ...(criteria.languages ?? []),
      slotRuntime.language,
    ]),
    frameworks: uniqueValues([
      criteria.framework,
      ...(criteria.frameworks ?? []),
      slotRuntime.framework,
    ]),
    tags: uniqueValues(criteria.tags ?? []),
  };
}

function evaluateTrigger(
  definition: SlotDefinition,
  criteria: NormalizedCriteria,
): TriggerEvaluation {
  const trigger = definition.trigger;
  const checks = {
    stages: evaluateTriggerCriterion(trigger.when.stages, criteria.stageIds, matchExactList),
    commands: evaluateTriggerCriterion(trigger.when.commands, criteria.commandIds, matchExactList),
    adapters: evaluateTriggerCriterion(trigger.when.adapters, criteria.adapterIds, matchExactList),
    events: evaluateTriggerCriterion(trigger.when.events, criteria.eventIds, matchExactList),
    paths: evaluateTriggerCriterion(trigger.when.paths, criteria.paths, matchesAnyGlob),
  };
  const configuredChecks = Object.values(checks).filter((check) => check.configured);
  const matched =
    configuredChecks.length === 0
      ? true
      : trigger.match === "all"
        ? configuredChecks.every((check) => check.matched)
        : configuredChecks.some((check) => check.matched);

  return {
    matched,
    matchMode: trigger.match,
    checks,
  };
}

function evaluateScope(definition: SlotDefinition, criteria: NormalizedCriteria): ScopeEvaluation {
  const scope = definition.scope;
  const checks = {
    projects: evaluateScopeCriterion(scope.projects, criteria.projects, matchExactList),
    languages: evaluateScopeCriterion(scope.languages, criteria.languages, matchExactList),
    frameworks: evaluateScopeCriterion(scope.frameworks, criteria.frameworks, matchExactList),
    files: evaluateScopeCriterion(scope.files, criteria.paths, matchesAnyGlob),
    tags: evaluateScopeCriterion(scope.tags, criteria.tags, matchExactList),
  };
  const matched = Object.values(checks).every((check) => check.matched);

  return {
    matched,
    checks,
  };
}

function toSerializableSlot(entry: RuntimeSlotEntry): SerializableSlot {
  return {
    id: entry.id,
    filePath: entry.filePath,
    source: entry.definition.meta.source,
    slotType: entry.definition.meta.slotType,
    owner: entry.definition.meta.owner ?? null,
    priority: entry.definition.behavior.priority,
    blockOnFailure: entry.definition.behavior.blockOnFailure,
    requiresApproval: entry.definition.behavior.requiresApproval,
    conflictPolicy: entry.definition.behavior.conflictPolicy,
    dependsOn: [...entry.definition.behavior.dependsOn],
    supersedes: [...entry.definition.behavior.supersedes],
    inject: cloneValue(entry.definition.behavior.inject),
    checks: cloneValue(entry.definition.checks),
    extensions: cloneValue(entry.definition.extensions),
  };
}

function collectInjectionSummary(activeEntries: RuntimeSlotEntry[]): {
  aiPromptKeys: string[];
  humanDocSections: string[];
} {
  return {
    aiPromptKeys: uniqueValues(
      activeEntries.map((entry) => entry.definition.behavior.inject.ai?.promptKey),
    ),
    humanDocSections: uniqueValues(
      activeEntries.map((entry) => entry.definition.behavior.inject.human?.docSection),
    ),
  };
}

function collectChecksSummary(activeEntries: RuntimeSlotEntry[]): {
  before: string[];
  after: string[];
} {
  return {
    before: uniqueValues(activeEntries.flatMap((entry) => entry.definition.checks.before)),
    after: uniqueValues(activeEntries.flatMap((entry) => entry.definition.checks.after)),
  };
}

function collectExtensionSummary(activeEntries: RuntimeSlotEntry[]): {
  scriptCount: number;
  scripts: Array<
    {
      slotId: string;
      slotSource: SlotSource;
      slotType: SlotType;
    } & SlotScriptExtension
  >;
} {
  const scripts = activeEntries.flatMap((entry) =>
    (entry.definition.extensions?.scripts ?? []).map((scriptExtension) => ({
      slotId: entry.id,
      slotSource: entry.definition.meta.source,
      slotType: entry.definition.meta.slotType,
      id: scriptExtension.id,
      hook: scriptExtension.hook,
      failurePolicy: scriptExtension.failurePolicy,
      runtime: cloneValue(scriptExtension.runtime),
      permissions: cloneValue(scriptExtension.permissions),
      audit: cloneValue(scriptExtension.audit),
      isolation: cloneValue(scriptExtension.isolation),
    })),
  );

  return {
    scriptCount: scripts.length,
    scripts,
  };
}

function suppressEntry(
  activeEntries: Map<string, RuntimeSlotEntry>,
  suppressedEntries: Array<
    SerializableSlot & {
      reason: string;
      bySlotId?: string;
      conflictKey?: string;
    }
  >,
  entry: RuntimeSlotEntry,
  details: {
    reason: string;
    bySlotId?: string;
    conflictKey?: string;
  },
): void {
  activeEntries.delete(entry.id);
  suppressedEntries.push({
    ...toSerializableSlot(entry),
    ...details,
  });
}

function applySupersedes(activeEntries: Map<string, RuntimeSlotEntry>): Array<
  SerializableSlot & {
    reason: "superseded";
    bySlotId: string;
  }
> {
  const suppressedEntries: Array<
    SerializableSlot & {
      reason: "superseded";
      bySlotId: string;
    }
  > = [];

  for (const entry of [...activeEntries.values()].sort(compareRuntimeSlotEntries)) {
    for (const supersededId of entry.definition.behavior.supersedes) {
      const supersededEntry = activeEntries.get(supersededId);

      if (!supersededEntry || supersededEntry.id === entry.id) {
        continue;
      }

      suppressEntry(activeEntries, suppressedEntries, supersededEntry, {
        reason: "superseded",
        bySlotId: entry.id,
      });
    }
  }

  return suppressedEntries;
}

function listConflictGroups(activeEntries: Map<string, RuntimeSlotEntry>): Array<{
  key: string;
  entries: RuntimeSlotEntry[];
}> {
  const groupMap = new Map<string, RuntimeSlotEntry[]>();

  function addToGroup(key: string | null, entry: RuntimeSlotEntry): void {
    if (!key) {
      return;
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }

    groupMap.get(key)?.push(entry);
  }

  for (const entry of activeEntries.values()) {
    if (entry.definition.meta.slotType !== "custom") {
      addToGroup(`slot-type:${entry.definition.meta.slotType}`, entry);
    }

    addToGroup(
      entry.definition.behavior.inject.ai?.promptKey
        ? `ai:${entry.definition.behavior.inject.ai.promptKey}`
        : null,
      entry,
    );
    addToGroup(
      entry.definition.behavior.inject.human?.docSection
        ? `human:${entry.definition.behavior.inject.human.docSection}`
        : null,
      entry,
    );
  }

  return [...groupMap.entries()]
    .map(([key, entries]) => ({
      key,
      entries: entries.sort(compareRuntimeSlotEntries),
    }))
    .filter((group) => group.entries.length > 1);
}

export class SlotConflictError extends Error {
  code: string;
  details: GenericRecord;

  constructor(message: string, details: GenericRecord = {}) {
    super(message);
    this.name = "SlotConflictError";
    this.code = "slots.conflict";
    this.details = details;
  }
}

function resolveConflictPolicy(
  group: {
    key: string;
    entries: RuntimeSlotEntry[];
  },
  defaultPolicy: Exclude<ConflictPolicy, "replace">,
): {
  policy: "override" | "merge" | "error";
  winner: RuntimeSlotEntry | null;
} {
  const overrideEntries = group.entries.filter(
    (entry) => normalizeConflictPolicy(entry.definition.behavior.conflictPolicy) === "override",
  );

  if (overrideEntries.length > 0) {
    return {
      policy: "override",
      winner: overrideEntries.sort(compareRuntimeSlotEntries)[0],
    };
  }

  if (
    group.entries.every(
      (entry) => normalizeConflictPolicy(entry.definition.behavior.conflictPolicy) === "merge",
    )
  ) {
    return {
      policy: "merge",
      winner: null,
    };
  }

  if (defaultPolicy === "override") {
    return {
      policy: "override",
      winner: group.entries[0],
    };
  }

  if (defaultPolicy === "merge") {
    return {
      policy: "merge",
      winner: null,
    };
  }

  return {
    policy: "error",
    winner: null,
  };
}

function resolveConflicts(
  activeEntries: Map<string, RuntimeSlotEntry>,
  defaultPolicy: Exclude<ConflictPolicy, "replace">,
): {
  suppressedEntries: Array<
    SerializableSlot & {
      reason: "conflict-override";
      bySlotId: string;
      conflictKey: string;
    }
  >;
  decisions: ResolvedConflictDecision[];
} {
  const suppressedEntries: Array<
    SerializableSlot & {
      reason: "conflict-override";
      bySlotId: string;
      conflictKey: string;
    }
  > = [];
  const decisions: ResolvedConflictDecision[] = [];

  for (const group of listConflictGroups(activeEntries)) {
    const entries = group.entries.filter((entry) => activeEntries.has(entry.id));

    if (entries.length < 2) {
      continue;
    }

    const resolution = resolveConflictPolicy(
      {
        ...group,
        entries,
      },
      defaultPolicy,
    );

    if (resolution.policy === "merge") {
      decisions.push({
        type: "merge",
        conflictKey: group.key,
        slotIds: entries.map((entry) => entry.id),
      });
      continue;
    }

    if (resolution.policy === "override" && resolution.winner) {
      for (const entry of entries) {
        if (entry.id === resolution.winner.id || !activeEntries.has(entry.id)) {
          continue;
        }

        suppressEntry(activeEntries, suppressedEntries, entry, {
          reason: "conflict-override",
          bySlotId: resolution.winner.id,
          conflictKey: group.key,
        });
      }

      decisions.push({
        type: "override",
        conflictKey: group.key,
        winner: resolution.winner.id,
        slotIds: entries.map((entry) => entry.id),
      });
      continue;
    }

    throw new SlotConflictError(`Conflicting slots matched for ${group.key}.`, {
      conflictKey: group.key,
      slotIds: entries.map((entry) => entry.id),
      slots: entries.map((entry) => toSerializableSlot(entry)),
    });
  }

  return {
    suppressedEntries,
    decisions,
  };
}

function applyDependencies(activeEntries: Map<string, RuntimeSlotEntry>): Array<
  SerializableSlot & {
    reason: "missing-dependency";
    missingDependencies: string[];
  }
> {
  const blockedEntries: Array<
    SerializableSlot & {
      reason: "missing-dependency";
      missingDependencies: string[];
    }
  > = [];
  let mutated = true;

  while (mutated) {
    mutated = false;

    for (const entry of [...activeEntries.values()].sort(compareRuntimeSlotEntries)) {
      const missingDependencies = entry.definition.behavior.dependsOn.filter(
        (dependencyId) => !activeEntries.has(dependencyId),
      );

      if (missingDependencies.length === 0) {
        continue;
      }

      activeEntries.delete(entry.id);
      blockedEntries.push({
        ...toSerializableSlot(entry),
        reason: "missing-dependency",
        missingDependencies,
      });
      mutated = true;
    }
  }

  return blockedEntries;
}

export function buildSlotRuntime(
  options: {
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
        conflictPolicy?: ConflictPolicy;
      };
    };
    slotDefinitions?: SlotEntryInput[];
  } = {},
): SlotRuntime {
  const config = options.config ?? {};
  const availableSlots = (options.slotDefinitions ?? []).map(normalizeSlotEntry);
  const enabledIds = new Set(config.slots?.enabled ?? []);
  const disabledIds = new Set(config.slots?.disabled ?? []);
  const enabledSlots = availableSlots
    .filter((entry) => enabledIds.has(entry.id) && !disabledIds.has(entry.id))
    .sort(compareRuntimeSlotEntries);

  return {
    currentProject: config.execution?.currentProject ?? null,
    language: config.project?.language ?? null,
    framework: config.project?.framework ?? null,
    defaultConflictPolicy: normalizeConflictPolicy(config.slots?.conflictPolicy ?? "error"),
    availableSlots,
    enabledSlots,
  };
}

export function resolveApplicableSlots(
  slotRuntime: SlotRuntime,
  criteria: SlotResolutionCriteria = {},
): {
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
  blockedSlots: Array<
    SerializableSlot & {
      reason: "missing-dependency";
      missingDependencies: string[];
    }
  >;
  suppressedSlots: Array<
    SerializableSlot & {
      reason: "superseded" | "conflict-override";
      bySlotId: string;
      conflictKey?: string;
    }
  >;
  skippedSlots: Array<
    SerializableSlot & {
      reason: "trigger-miss" | "scope-miss";
      trigger: TriggerEvaluation;
      scope: ScopeEvaluation;
    }
  >;
  conflicts: ResolvedConflictDecision[];
  injections: {
    aiPromptKeys: string[];
    humanDocSections: string[];
  };
  checks: {
    before: string[];
    after: string[];
  };
  extensions: {
    scriptCount: number;
    scripts: Array<
      {
        slotId: string;
        slotSource: SlotSource;
        slotType: SlotType;
      } & SlotScriptExtension
    >;
  };
  requiresApproval: boolean;
  blockOnFailure: boolean;
} {
  const normalizedCriteria = normalizeCriteria(criteria, slotRuntime);
  const skippedSlots: Array<
    SerializableSlot & {
      reason: "trigger-miss" | "scope-miss";
      trigger: TriggerEvaluation;
      scope: ScopeEvaluation;
    }
  > = [];
  const matchedEntries: RuntimeMatchedEntry[] = [];

  for (const entry of slotRuntime.enabledSlots ?? []) {
    const trigger = evaluateTrigger(entry.definition, normalizedCriteria);
    const scope = evaluateScope(entry.definition, normalizedCriteria);

    if (!trigger.matched || !scope.matched) {
      skippedSlots.push({
        ...toSerializableSlot(entry),
        reason: !trigger.matched ? "trigger-miss" : "scope-miss",
        trigger,
        scope,
      });
      continue;
    }

    matchedEntries.push({
      ...entry,
      trigger,
      scope,
    });
  }

  matchedEntries.sort(compareRuntimeSlotEntries);
  const activeEntries = new Map<string, RuntimeSlotEntry>(
    matchedEntries.map((entry) => [entry.id, entry]),
  );
  const suppressedBySupersedes = applySupersedes(activeEntries);
  const conflictResolution = resolveConflicts(activeEntries, slotRuntime.defaultConflictPolicy);
  const blockedEntries = applyDependencies(activeEntries);
  const activeSlots = [...activeEntries.values()].sort(compareRuntimeSlotEntries);

  return {
    criteria: normalizedCriteria,
    summary: {
      enabledCount: slotRuntime.enabledSlots?.length ?? 0,
      matchedCount: matchedEntries.length,
      activeCount: activeSlots.length,
      blockedCount: blockedEntries.length,
      suppressedCount: suppressedBySupersedes.length + conflictResolution.suppressedEntries.length,
    },
    matchedSlots: matchedEntries.map((entry) => toSerializableSlot(entry)),
    activeSlots: activeSlots.map((entry) => toSerializableSlot(entry)),
    blockedSlots: blockedEntries,
    suppressedSlots: [...suppressedBySupersedes, ...conflictResolution.suppressedEntries],
    skippedSlots,
    conflicts: conflictResolution.decisions,
    injections: collectInjectionSummary(activeSlots),
    checks: collectChecksSummary(activeSlots),
    extensions: collectExtensionSummary(activeSlots),
    requiresApproval: activeSlots.some((entry) => entry.definition.behavior.requiresApproval),
    blockOnFailure: activeSlots.some((entry) => entry.definition.behavior.blockOnFailure),
  };
}
