import { resolveWorkflowTemplate, validateWorkflowTemplate } from "./template-model.js";
import { SlotConflictError, resolveApplicableSlots } from "../slots/runtime.js";

export const WORKFLOW_STAGE_RESULT_STATUS = Object.freeze({
  pending: "pending",
  running: "running",
  passed: "passed",
  failed: "failed",
  skipped: "skipped",
  blocked: "blocked"
});

export const WORKFLOW_EXECUTION_STATUS = Object.freeze({
  passed: "passed",
  failed: "failed"
});

const FINAL_STAGE_STATUSES = new Set([
  WORKFLOW_STAGE_RESULT_STATUS.passed,
  WORKFLOW_STAGE_RESULT_STATUS.failed,
  WORKFLOW_STAGE_RESULT_STATUS.skipped,
  WORKFLOW_STAGE_RESULT_STATUS.blocked
]);

function cloneValue(value) {
  return structuredClone(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ensureSerialTemplate(template) {
  if (template.execution.mode !== "serial") {
    throw new TypeError(`Unsupported workflow execution mode: ${template.execution.mode}`);
  }

  return template;
}

function resolveTemplate(options) {
  if (options.template) {
    return ensureSerialTemplate(validateWorkflowTemplate(options.template));
  }

  return ensureSerialTemplate(resolveWorkflowTemplate(options.workflowConfig));
}

function resolveStageHandler(stage, handlers) {
  return handlers[stage.id] ?? handlers[stage.executor?.ref] ?? handlers[stage.executor?.command] ?? null;
}

function createSkippedStageResult(stage, options = {}) {
  return {
    id: stage.id,
    name: stage.name,
    executor: cloneValue(stage.executor ?? null),
    status: options.status ?? WORKFLOW_STAGE_RESULT_STATUS.skipped,
    startedAt: null,
    finishedAt: null,
    durationMs: 0,
    dependsOn: [...(stage.dependsOn ?? [])],
    dependencyStatuses: cloneValue(options.dependencyStatuses ?? {}),
    summary: options.summary ?? null,
    details: cloneValue(options.details ?? null),
    outputs: {},
    gates: [],
    warnings: [],
    blockedBy: [...(options.blockedBy ?? [])],
    skippedReason: options.skippedReason ?? null,
    error: options.error ?? null
  };
}

function normalizeHandlerResult(stage, rawResult) {
  if (rawResult === undefined) {
    return {
      status: WORKFLOW_STAGE_RESULT_STATUS.passed,
      summary: null,
      details: null,
      outputs: {},
      gates: [],
      warnings: []
    };
  }

  if (!isPlainObject(rawResult)) {
    throw new TypeError(`Workflow handler for stage "${stage.id}" must return an object`);
  }

  const status = rawResult.status ?? WORKFLOW_STAGE_RESULT_STATUS.passed;

  if (!FINAL_STAGE_STATUSES.has(status)) {
    throw new TypeError(`Unsupported workflow stage status "${status}" for stage "${stage.id}"`);
  }

  if (rawResult.outputs !== undefined && !isPlainObject(rawResult.outputs)) {
    throw new TypeError(`Workflow handler outputs for stage "${stage.id}" must be an object`);
  }

  return {
    status,
    summary: rawResult.summary ?? null,
    details: cloneValue(rawResult.details ?? null),
    outputs: cloneValue(rawResult.outputs ?? {}),
    gates: Array.isArray(rawResult.gates) ? cloneValue(rawResult.gates) : [],
    warnings: Array.isArray(rawResult.warnings) ? cloneValue(rawResult.warnings) : [],
    blockedBy: Array.isArray(rawResult.blockedBy) ? [...rawResult.blockedBy] : [],
    skippedReason: rawResult.skippedReason ?? null,
    error: rawResult.error
      ? {
          message: rawResult.error.message ?? String(rawResult.error),
          code: rawResult.error.code ?? null
        }
      : null
  };
}

function createStageContext({
  template,
  stage,
  stageIndex,
  selectedStageIds,
  dependencyResults,
  previousResults,
  runtimeState,
  metadata,
  slotResolution
}) {
  return {
    template,
    stage,
    stageIndex,
    selectedStageIds,
    dependencyResults: dependencyResults.map((result) => cloneValue(result)),
    previousResults: previousResults.map((result) => cloneValue(result)),
    state: runtimeState.values,
    runtime: runtimeState,
    artifacts: runtimeState.artifacts,
    metadata: cloneValue(metadata ?? {}),
    slots: cloneValue(slotResolution?.activeSlots ?? []),
    slotResolution: cloneValue(slotResolution ?? null)
  };
}

function createDependencyStatusMap(dependencyResults) {
  return Object.fromEntries(dependencyResults.map((result) => [result.id, result.status]));
}

function mergeStageOutputs(runtimeState, outputs) {
  if (!isPlainObject(outputs) || Object.keys(outputs).length === 0) {
    return;
  }

  Object.assign(runtimeState.artifacts, cloneValue(outputs));
}

function createStageSlotDetails(slotResolution) {
  if (!slotResolution) {
    return {
      activeSlots: [],
      blockedSlots: [],
      suppressedSlots: [],
      injections: {
        aiPromptKeys: [],
        humanDocSections: []
      },
      checks: {
        before: [],
        after: []
      }
    };
  }

  return {
    activeSlots: cloneValue(slotResolution.activeSlots),
    blockedSlots: cloneValue(slotResolution.blockedSlots),
    suppressedSlots: cloneValue(slotResolution.suppressedSlots),
    injections: cloneValue(slotResolution.injections),
    checks: cloneValue(slotResolution.checks)
  };
}

function resolveStageSlotResolution(stage, metadata, slotRuntime) {
  if (!slotRuntime) {
    return null;
  }

  return resolveApplicableSlots(slotRuntime, {
    stageId: stage.id,
    commandId: metadata?.command ?? stage.executor?.command ?? stage.executor?.ref ?? null,
    adapterId: metadata?.adapterId ?? null,
    eventId: metadata?.eventId ?? null,
    project: metadata?.currentProject ?? metadata?.project ?? null,
    language: metadata?.language ?? null,
    framework: metadata?.framework ?? null,
    tags: metadata?.tags ?? [],
    paths: metadata?.paths ?? metadata?.changedPaths ?? []
  });
}

export function selectWorkflowStages(template, stageIds) {
  const resolvedTemplate = ensureSerialTemplate(validateWorkflowTemplate(template));
  const requestedStageIds = stageIds
    ? Array.from(new Set(Array.isArray(stageIds) ? stageIds : [stageIds]))
    : resolvedTemplate.stages.map((stage) => stage.id);
  const selected = new Set();
  const stageMap = new Map(resolvedTemplate.stages.map((stage) => [stage.id, stage]));

  for (const stageId of requestedStageIds) {
    const stage = stageMap.get(stageId);

    if (!stage) {
      throw new TypeError(`Unknown workflow stage: ${stageId}`);
    }

    const queue = [stage];

    while (queue.length > 0) {
      const currentStage = queue.pop();

      if (!currentStage || selected.has(currentStage.id)) {
        continue;
      }

      selected.add(currentStage.id);

      for (const dependencyId of currentStage.dependsOn ?? []) {
        queue.push(stageMap.get(dependencyId));
      }
    }
  }

  return resolvedTemplate.stages
    .map((stage) => stage.id)
    .filter((stageId) => selected.has(stageId));
}

export function getWorkflowStageResult(executionResult, stageId) {
  return executionResult.stages.find((stageResult) => stageResult.id === stageId) ?? null;
}

export async function executeWorkflow(options = {}) {
  const template = resolveTemplate(options);
  const selectedStageIds = selectWorkflowStages(template, options.targetStages);
  const selectedStageIdSet = new Set(selectedStageIds);
  const runtimeState = {
    artifacts: cloneValue(options.initialArtifacts ?? {}),
    values: cloneValue(options.initialState ?? {})
  };
  const metadata = cloneValue(options.metadata ?? {});
  const handlers = options.handlers ?? {};
  const slotRuntime = options.slotRuntime ?? null;
  const stageResults = [];
  const stageResultsById = new Map();
  const startedAt = new Date().toISOString();
  let firstFailedStageId = null;

  for (const [stageIndex, stage] of template.stages.entries()) {
    const dependencyResults = (stage.dependsOn ?? [])
      .map((dependencyId) => stageResultsById.get(dependencyId))
      .filter(Boolean);
    const dependencyStatuses = createDependencyStatusMap(dependencyResults);

    if (!selectedStageIdSet.has(stage.id)) {
      const skippedStage = createSkippedStageResult(stage, {
        dependencyStatuses,
        skippedReason: "not-selected",
        summary: "Stage not selected for this workflow run."
      });

      stageResults.push(skippedStage);
      stageResultsById.set(stage.id, skippedStage);
      continue;
    }

    const blockedDependencies = dependencyResults.filter(
      (result) => result.status !== WORKFLOW_STAGE_RESULT_STATUS.passed
    );

    if (blockedDependencies.length > 0) {
      const blockedStage = createSkippedStageResult(stage, {
        status: WORKFLOW_STAGE_RESULT_STATUS.blocked,
        dependencyStatuses,
        blockedBy: blockedDependencies.map((result) => result.id),
        summary: `Blocked by dependency results: ${blockedDependencies
          .map((result) => `${result.id}:${result.status}`)
          .join(", ")}`
      });

      stageResults.push(blockedStage);
      stageResultsById.set(stage.id, blockedStage);
      continue;
    }

    if (firstFailedStageId && template.execution.stopOnFailure) {
      const blockedStage = createSkippedStageResult(stage, {
        status: WORKFLOW_STAGE_RESULT_STATUS.blocked,
        dependencyStatuses,
        blockedBy: [firstFailedStageId],
        summary: `Skipped because the workflow stopped after stage "${firstFailedStageId}" failed.`
      });

      stageResults.push(blockedStage);
      stageResultsById.set(stage.id, blockedStage);
      continue;
    }

    const handler = resolveStageHandler(stage, handlers);

    if (!handler) {
      if (stage.required === false || template.execution.allowSkipStages) {
        const skippedStage = createSkippedStageResult(stage, {
          dependencyStatuses,
          skippedReason: "handler-missing",
          summary: `No workflow handler registered for stage "${stage.id}".`
        });

        stageResults.push(skippedStage);
        stageResultsById.set(stage.id, skippedStage);
        continue;
      }

      const failedStage = createSkippedStageResult(stage, {
        status: WORKFLOW_STAGE_RESULT_STATUS.failed,
        dependencyStatuses,
        summary: `No workflow handler registered for stage "${stage.id}".`,
        error: {
          message: `Missing handler for stage "${stage.id}".`,
          code: "workflow.handler_missing"
        }
      });

      stageResults.push(failedStage);
      stageResultsById.set(stage.id, failedStage);
      firstFailedStageId ??= stage.id;
      continue;
    }

    const stageStartedAt = new Date().toISOString();
    const stageStartedAtMs = Date.now();
    let slotResolution = null;

    try {
      slotResolution = resolveStageSlotResolution(stage, metadata, slotRuntime);
    } catch (error) {
      if (!(error instanceof SlotConflictError)) {
        throw error;
      }

      const failedStage = createSkippedStageResult(stage, {
        status: WORKFLOW_STAGE_RESULT_STATUS.failed,
        dependencyStatuses,
        summary: error.message,
        details: {
          slots: createStageSlotDetails({
            activeSlots: [],
            blockedSlots: [],
            suppressedSlots: [],
            injections: {
              aiPromptKeys: [],
              humanDocSections: []
            },
            checks: {
              before: [],
              after: []
            }
          }),
          slotConflict: cloneValue(error.details ?? {})
        },
        error: {
          message: error.message,
          code: error.code ?? "slots.conflict"
        }
      });

      stageResults.push(failedStage);
      stageResultsById.set(stage.id, failedStage);
      firstFailedStageId ??= stage.id;
      continue;
    }

    try {
      const rawResult = await handler(
        createStageContext({
          template,
          stage,
          stageIndex,
          selectedStageIds,
          dependencyResults,
          previousResults: stageResults,
          runtimeState,
          metadata,
          slotResolution
        })
      );
      const normalizedResult = normalizeHandlerResult(stage, rawResult);
      const stageFinishedAt = new Date().toISOString();
      const stageResult = {
        id: stage.id,
        name: stage.name,
        executor: cloneValue(stage.executor ?? null),
        status: normalizedResult.status,
        startedAt: stageStartedAt,
        finishedAt: stageFinishedAt,
        durationMs: Math.max(Date.now() - stageStartedAtMs, 0),
        dependsOn: [...(stage.dependsOn ?? [])],
        dependencyStatuses,
        summary: normalizedResult.summary,
        details: {
          ...(isPlainObject(normalizedResult.details) ? normalizedResult.details : {}),
          slots: createStageSlotDetails(slotResolution)
        },
        outputs: normalizedResult.outputs,
        gates: normalizedResult.gates,
        warnings: normalizedResult.warnings,
        blockedBy: normalizedResult.blockedBy,
        skippedReason: normalizedResult.skippedReason,
        error: normalizedResult.error
      };

      mergeStageOutputs(runtimeState, stageResult.outputs);

      stageResults.push(stageResult);
      stageResultsById.set(stage.id, stageResult);

      if (stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.failed) {
        firstFailedStageId ??= stage.id;
      }
    } catch (error) {
      const failedStage = {
        id: stage.id,
        name: stage.name,
        executor: cloneValue(stage.executor ?? null),
        status: WORKFLOW_STAGE_RESULT_STATUS.failed,
        startedAt: stageStartedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Math.max(Date.now() - stageStartedAtMs, 0),
        dependsOn: [...(stage.dependsOn ?? [])],
        dependencyStatuses,
        summary: error instanceof Error ? error.message : "Workflow stage failed.",
        details: null,
        outputs: {},
        gates: [],
        warnings: [],
        blockedBy: [],
        skippedReason: null,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: error instanceof Error && "code" in error ? error.code : "workflow.handler_failed"
        }
      };

      stageResults.push(failedStage);
      stageResultsById.set(stage.id, failedStage);
      firstFailedStageId ??= stage.id;
    }
  }

  const finishedAt = new Date().toISOString();
  const selectedStageResults = stageResults.filter((stageResult) => selectedStageIdSet.has(stageResult.id));
  const status = selectedStageResults.some((stageResult) =>
    [WORKFLOW_STAGE_RESULT_STATUS.failed, WORKFLOW_STAGE_RESULT_STATUS.blocked].includes(stageResult.status)
  )
    ? WORKFLOW_EXECUTION_STATUS.failed
    : WORKFLOW_EXECUTION_STATUS.passed;

  return {
    workflowId: template.id,
    status,
    startedAt,
    finishedAt,
    durationMs: Math.max(new Date(finishedAt).getTime() - new Date(startedAt).getTime(), 0),
    selectedStageIds,
    stages: stageResults,
    summary: {
      passed: selectedStageResults.filter(
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.passed
      ).length,
      failed: selectedStageResults.filter(
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.failed
      ).length,
      blocked: selectedStageResults.filter(
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.blocked
      ).length,
      skipped: selectedStageResults.filter(
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.skipped
      ).length,
      selected: selectedStageIds.length
    },
    failure: firstFailedStageId
      ? {
          stageId: firstFailedStageId,
          stageResult: getWorkflowStageResult({ stages: stageResults }, firstFailedStageId)
        }
      : null,
    artifacts: runtimeState.artifacts,
    state: runtimeState.values,
    metadata
  };
}
