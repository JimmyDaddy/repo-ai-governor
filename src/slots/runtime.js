import { compareSlotsByPriority, validateSlotDefinition } from "./slot-model.js";

const SOURCE_PRIORITY = Object.freeze({
  "project-local": 3,
  "team-shared": 2,
  official: 1
});

const CONFLICT_POLICY_ALIAS = Object.freeze({
  replace: "override"
});

function cloneValue(value) {
  return structuredClone(value);
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  return [value];
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizePath(value) {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function createGlobMatcher(pattern) {
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

function matchesAnyGlob(patterns, candidatePaths) {
  if (patterns.length === 0) {
    return true;
  }

  if (candidatePaths.length === 0) {
    return false;
  }

  const matchers = patterns.map((pattern) => createGlobMatcher(pattern));
  return candidatePaths.some((candidatePath) =>
    matchers.some((matcher) => matcher.test(normalizePath(candidatePath)))
  );
}

function matchExactList(expectedValues, actualValues) {
  if (expectedValues.length === 0) {
    return true;
  }

  if (actualValues.length === 0) {
    return false;
  }

  return expectedValues.some((expectedValue) => actualValues.includes(expectedValue));
}

function normalizeConflictPolicy(policy) {
  const normalized = String(policy ?? "error").trim().toLowerCase();
  return CONFLICT_POLICY_ALIAS[normalized] ?? normalized;
}

function compareRuntimeSlotEntries(leftEntry, rightEntry) {
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

function normalizeSlotEntry(rawEntry) {
  const definition = validateSlotDefinition(rawEntry?.config ?? rawEntry);

  return {
    id: definition.id,
    filePath: rawEntry?.filePath ?? null,
    definition
  };
}

function evaluateTriggerCriterion(expectedValues, actualValues, matcher) {
  const configuredValues = uniqueValues(expectedValues);
  const currentValues = uniqueValues(actualValues);

  if (configuredValues.length === 0) {
    return {
      configured: false,
      matched: true,
      expected: configuredValues,
      actual: currentValues
    };
  }

  if (currentValues.length === 0) {
    return {
      configured: true,
      matched: false,
      expected: configuredValues,
      actual: currentValues
    };
  }

  const matched = matcher(configuredValues, currentValues);
  return {
    configured: true,
    matched,
    expected: configuredValues,
    actual: currentValues
  };
}

function evaluateScopeCriterion(expectedValues, actualValues, matcher) {
  const configuredValues = uniqueValues(expectedValues);
  const currentValues = uniqueValues(actualValues);

  if (configuredValues.length === 0) {
    return {
      configured: false,
      matched: true,
      expected: configuredValues,
      actual: currentValues
    };
  }

  if (currentValues.length === 0) {
    return {
      configured: true,
      matched: false,
      expected: configuredValues,
      actual: currentValues
    };
  }

  const matched = matcher(configuredValues, currentValues);
  return {
    configured: true,
    matched,
    expected: configuredValues,
    actual: currentValues
  };
}

function normalizeCriteria(criteria = {}, slotRuntime = {}) {
  return {
    stageIds: uniqueValues([criteria.stageId, ...(criteria.stageIds ?? [])]),
    commandIds: uniqueValues([criteria.commandId, ...(criteria.commandIds ?? [])]),
    adapterIds: uniqueValues([criteria.adapterId, ...(criteria.adapterIds ?? [])]),
    eventIds: uniqueValues([criteria.eventId, ...(criteria.eventIds ?? [])]),
    paths: uniqueValues(
      [...toArray(criteria.path), ...toArray(criteria.paths), ...toArray(criteria.changedPaths)].map(
        normalizePath
      )
    ),
    projects: uniqueValues([criteria.project, ...(criteria.projects ?? []), slotRuntime.currentProject]),
    languages: uniqueValues([criteria.language, ...(criteria.languages ?? []), slotRuntime.language]),
    frameworks: uniqueValues([
      criteria.framework,
      ...(criteria.frameworks ?? []),
      slotRuntime.framework
    ]),
    tags: uniqueValues(criteria.tags ?? [])
  };
}

function evaluateTrigger(definition, criteria) {
  const trigger = definition.trigger;
  const checks = {
    stages: evaluateTriggerCriterion(trigger.when.stages, criteria.stageIds, matchExactList),
    commands: evaluateTriggerCriterion(trigger.when.commands, criteria.commandIds, matchExactList),
    adapters: evaluateTriggerCriterion(trigger.when.adapters, criteria.adapterIds, matchExactList),
    events: evaluateTriggerCriterion(trigger.when.events, criteria.eventIds, matchExactList),
    paths: evaluateTriggerCriterion(trigger.when.paths, criteria.paths, matchesAnyGlob)
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
    checks
  };
}

function evaluateScope(definition, criteria) {
  const scope = definition.scope;
  const checks = {
    projects: evaluateScopeCriterion(scope.projects, criteria.projects, matchExactList),
    languages: evaluateScopeCriterion(scope.languages, criteria.languages, matchExactList),
    frameworks: evaluateScopeCriterion(scope.frameworks, criteria.frameworks, matchExactList),
    files: evaluateScopeCriterion(scope.files, criteria.paths, matchesAnyGlob),
    tags: evaluateScopeCriterion(scope.tags, criteria.tags, matchExactList)
  };
  const matched = Object.values(checks).every((check) => check.matched);

  return {
    matched,
    checks
  };
}

function toSerializableSlot(entry) {
  return {
    id: entry.id,
    filePath: entry.filePath,
    source: entry.definition.meta.source,
    slotType: entry.definition.meta.slotType,
    owner: entry.definition.meta.owner,
    priority: entry.definition.behavior.priority,
    blockOnFailure: entry.definition.behavior.blockOnFailure,
    requiresApproval: entry.definition.behavior.requiresApproval,
    conflictPolicy: normalizeConflictPolicy(entry.definition.behavior.conflictPolicy),
    dependsOn: [...entry.definition.behavior.dependsOn],
    supersedes: [...entry.definition.behavior.supersedes],
    inject: cloneValue(entry.definition.behavior.inject),
    checks: cloneValue(entry.definition.checks)
  };
}

function collectInjectionSummary(activeEntries) {
  return {
    aiPromptKeys: uniqueValues(
      activeEntries.map((entry) => entry.definition.behavior.inject.ai?.promptKey)
    ),
    humanDocSections: uniqueValues(
      activeEntries.map((entry) => entry.definition.behavior.inject.human?.docSection)
    )
  };
}

function collectChecksSummary(activeEntries) {
  return {
    before: uniqueValues(activeEntries.flatMap((entry) => entry.definition.checks.before)),
    after: uniqueValues(activeEntries.flatMap((entry) => entry.definition.checks.after))
  };
}

function suppressEntry(activeEntries, suppressedEntries, entry, details) {
  activeEntries.delete(entry.id);
  suppressedEntries.push({
    ...toSerializableSlot(entry),
    ...details
  });
}

function applySupersedes(activeEntries) {
  const suppressedEntries = [];

  for (const entry of [...activeEntries.values()].sort(compareRuntimeSlotEntries)) {
    for (const supersededId of entry.definition.behavior.supersedes) {
      const supersededEntry = activeEntries.get(supersededId);

      if (!supersededEntry || supersededEntry.id === entry.id) {
        continue;
      }

      suppressEntry(activeEntries, suppressedEntries, supersededEntry, {
        reason: "superseded",
        bySlotId: entry.id
      });
    }
  }

  return suppressedEntries;
}

function listConflictGroups(activeEntries) {
  const groupMap = new Map();

  function addToGroup(key, entry) {
    if (!key) {
      return;
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }

    groupMap.get(key).push(entry);
  }

  for (const entry of activeEntries.values()) {
    if (entry.definition.meta.slotType !== "custom") {
      addToGroup(`slot-type:${entry.definition.meta.slotType}`, entry);
    }

    addToGroup(
      entry.definition.behavior.inject.ai?.promptKey
        ? `ai:${entry.definition.behavior.inject.ai.promptKey}`
        : null,
      entry
    );
    addToGroup(
      entry.definition.behavior.inject.human?.docSection
        ? `human:${entry.definition.behavior.inject.human.docSection}`
        : null,
      entry
    );
  }

  return [...groupMap.entries()]
    .map(([key, entries]) => ({
      key,
      entries: entries.sort(compareRuntimeSlotEntries)
    }))
    .filter((group) => group.entries.length > 1);
}

export class SlotConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "SlotConflictError";
    this.code = "slots.conflict";
    this.details = details;
  }
}

function resolveConflictPolicy(group, defaultPolicy) {
  const overrideEntries = group.entries.filter(
    (entry) => normalizeConflictPolicy(entry.definition.behavior.conflictPolicy) === "override"
  );

  if (overrideEntries.length > 0) {
    return {
      policy: "override",
      winner: overrideEntries.sort(compareRuntimeSlotEntries)[0]
    };
  }

  if (
    group.entries.every(
      (entry) => normalizeConflictPolicy(entry.definition.behavior.conflictPolicy) === "merge"
    )
  ) {
    return {
      policy: "merge",
      winner: null
    };
  }

  if (defaultPolicy === "override") {
    return {
      policy: "override",
      winner: group.entries[0]
    };
  }

  if (defaultPolicy === "merge") {
    return {
      policy: "merge",
      winner: null
    };
  }

  return {
    policy: "error",
    winner: null
  };
}

function resolveConflicts(activeEntries, defaultPolicy) {
  const suppressedEntries = [];
  const decisions = [];

  for (const group of listConflictGroups(activeEntries)) {
    const entries = group.entries.filter((entry) => activeEntries.has(entry.id));

    if (entries.length < 2) {
      continue;
    }

    const resolution = resolveConflictPolicy(
      {
        ...group,
        entries
      },
      defaultPolicy
    );

    if (resolution.policy === "merge") {
      decisions.push({
        type: "merge",
        conflictKey: group.key,
        slotIds: entries.map((entry) => entry.id)
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
          conflictKey: group.key
        });
      }

      decisions.push({
        type: "override",
        conflictKey: group.key,
        winner: resolution.winner.id,
        slotIds: entries.map((entry) => entry.id)
      });
      continue;
    }

    throw new SlotConflictError(`Conflicting slots matched for ${group.key}.`, {
      conflictKey: group.key,
      slotIds: entries.map((entry) => entry.id),
      slots: entries.map((entry) => toSerializableSlot(entry))
    });
  }

  return {
    suppressedEntries,
    decisions
  };
}

function applyDependencies(activeEntries) {
  const blockedEntries = [];
  let mutated = true;

  while (mutated) {
    mutated = false;

    for (const entry of [...activeEntries.values()].sort(compareRuntimeSlotEntries)) {
      const missingDependencies = entry.definition.behavior.dependsOn.filter(
        (dependencyId) => !activeEntries.has(dependencyId)
      );

      if (missingDependencies.length === 0) {
        continue;
      }

      activeEntries.delete(entry.id);
      blockedEntries.push({
        ...toSerializableSlot(entry),
        reason: "missing-dependency",
        missingDependencies
      });
      mutated = true;
    }
  }

  return blockedEntries;
}

export function buildSlotRuntime(options = {}) {
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
    enabledSlots
  };
}

export function resolveApplicableSlots(slotRuntime, criteria = {}) {
  const normalizedCriteria = normalizeCriteria(criteria, slotRuntime);
  const skippedSlots = [];
  const matchedEntries = [];

  for (const entry of slotRuntime.enabledSlots ?? []) {
    const trigger = evaluateTrigger(entry.definition, normalizedCriteria);
    const scope = evaluateScope(entry.definition, normalizedCriteria);

    if (!trigger.matched || !scope.matched) {
      skippedSlots.push({
        ...toSerializableSlot(entry),
        reason: !trigger.matched ? "trigger-miss" : "scope-miss",
        trigger,
        scope
      });
      continue;
    }

    matchedEntries.push({
      ...entry,
      trigger,
      scope
    });
  }

  matchedEntries.sort(compareRuntimeSlotEntries);
  const activeEntries = new Map(matchedEntries.map((entry) => [entry.id, entry]));
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
      suppressedCount: suppressedBySupersedes.length + conflictResolution.suppressedEntries.length
    },
    matchedSlots: matchedEntries.map((entry) => toSerializableSlot(entry)),
    activeSlots: activeSlots.map((entry) => toSerializableSlot(entry)),
    blockedSlots: blockedEntries,
    suppressedSlots: [
      ...suppressedBySupersedes,
      ...conflictResolution.suppressedEntries
    ],
    skippedSlots,
    conflicts: conflictResolution.decisions,
    injections: collectInjectionSummary(activeSlots),
    checks: collectChecksSummary(activeSlots),
    requiresApproval: activeSlots.some((entry) => entry.definition.behavior.requiresApproval),
    blockOnFailure: activeSlots.some((entry) => entry.definition.behavior.blockOnFailure)
  };
}
