import { SlotConflictError, resolveApplicableSlots } from "../slots/runtime.js";
import { cloneValue, isPlainObject } from "../utils/common.js";
import {
  type LocalizedText,
  type WorkflowConfig,
  type WorkflowExecutor,
  type WorkflowStage,
  type WorkflowTemplate,
  resolveWorkflowTemplate,
  validateWorkflowTemplate,
} from "./template-model.js";

type GenericRecord = Record<string, unknown>;

type RuntimeState = {
  artifacts: GenericRecord;
  values: GenericRecord;
};

export const WORKFLOW_STAGE_RESULT_STATUS = Object.freeze({
  pending: "pending",
  running: "running",
  passed: "passed",
  failed: "failed",
  skipped: "skipped",
  blocked: "blocked",
} as const);

export type WorkflowStageResultStatus =
  (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS];

export const WORKFLOW_EXECUTION_STATUS = Object.freeze({
  passed: "passed",
  failed: "failed",
} as const);

export type WorkflowExecutionStatus =
  (typeof WORKFLOW_EXECUTION_STATUS)[keyof typeof WORKFLOW_EXECUTION_STATUS];

export type WorkflowStageError = {
  message: string;
  code: string | null;
};

export type WorkflowStageResult = {
  id: string;
  name: LocalizedText;
  executor: WorkflowExecutor | null;
  status: WorkflowStageResultStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number;
  dependsOn: string[];
  dependencyStatuses: Record<string, WorkflowStageResultStatus>;
  summary: unknown;
  details: unknown;
  outputs: GenericRecord;
  gates: unknown[];
  warnings: unknown[];
  blockedBy: string[];
  skippedReason: string | null;
  error: WorkflowStageError | null;
};

export type WorkflowStageContext = {
  template: WorkflowTemplate;
  stage: WorkflowStage;
  stageIndex: number;
  selectedStageIds: string[];
  dependencyResults: WorkflowStageResult[];
  previousResults: WorkflowStageResult[];
  state: GenericRecord;
  runtime: RuntimeState;
  artifacts: GenericRecord;
  metadata: GenericRecord;
  slots: unknown[];
  slotResolution: unknown;
};

export type WorkflowStageHandlerResult = {
  status?: WorkflowStageResultStatus;
  summary?: unknown;
  details?: unknown;
  outputs?: GenericRecord;
  gates?: unknown[];
  warnings?: unknown[];
  blockedBy?: string[];
  skippedReason?: string | null;
  error?: {
    message?: string;
    code?: string | null;
  } | null;
};

export type WorkflowStageHandler = (
  context: WorkflowStageContext,
) => WorkflowStageHandlerResult | Promise<WorkflowStageHandlerResult> | void | Promise<void>;

export type ExecuteWorkflowOptions = {
  template?: WorkflowTemplate;
  workflowConfig?: WorkflowConfig;
  targetStages?: string | string[];
  initialArtifacts?: GenericRecord;
  initialState?: GenericRecord;
  metadata?: GenericRecord;
  handlers?: Record<string, WorkflowStageHandler | undefined>;
  slotRuntime?: unknown;
};

export type WorkflowExecutionResult = {
  workflowId: string;
  status: WorkflowExecutionStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  selectedStageIds: string[];
  stages: WorkflowStageResult[];
  summary: {
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    selected: number;
  };
  failure: {
    stageId: string;
    stageResult: WorkflowStageResult | null;
  } | null;
  artifacts: GenericRecord;
  state: GenericRecord;
  metadata: GenericRecord;
};

type NormalizedHandlerResult = {
  status: WorkflowStageResultStatus;
  summary: unknown;
  details: unknown;
  outputs: GenericRecord;
  gates: unknown[];
  warnings: unknown[];
  blockedBy: string[];
  skippedReason: string | null;
  error: WorkflowStageError | null;
};

type CreateSkippedStageOptions = {
  status?: WorkflowStageResultStatus;
  dependencyStatuses?: Record<string, WorkflowStageResultStatus>;
  summary?: unknown;
  details?: unknown;
  blockedBy?: string[];
  skippedReason?: string | null;
  error?: WorkflowStageError | null;
};

const FINAL_STAGE_STATUSES = new Set<WorkflowStageResultStatus>([
  WORKFLOW_STAGE_RESULT_STATUS.passed,
  WORKFLOW_STAGE_RESULT_STATUS.failed,
  WORKFLOW_STAGE_RESULT_STATUS.skipped,
  WORKFLOW_STAGE_RESULT_STATUS.blocked,
]);

function ensureSerialTemplate(template: WorkflowTemplate): WorkflowTemplate {
  if (template.execution.mode !== "serial") {
    throw new TypeError(`Unsupported workflow execution mode: ${template.execution.mode}`);
  }

  return template;
}

function resolveTemplate(options: ExecuteWorkflowOptions): WorkflowTemplate {
  if (options.template) {
    return ensureSerialTemplate(validateWorkflowTemplate(options.template));
  }

  return ensureSerialTemplate(resolveWorkflowTemplate(options.workflowConfig));
}

function resolveStageHandler(
  stage: WorkflowStage,
  handlers: Record<string, WorkflowStageHandler | undefined>,
): WorkflowStageHandler | null {
  return (
    handlers[stage.id] ??
    handlers[stage.executor?.ref] ??
    handlers[stage.executor?.command ?? ""] ??
    null
  );
}

function createSkippedStageResult(
  stage: WorkflowStage,
  options: CreateSkippedStageOptions = {},
): WorkflowStageResult {
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
    error: options.error ?? null,
  };
}

function normalizeHandlerResult(stage: WorkflowStage, rawResult: unknown): NormalizedHandlerResult {
  if (rawResult === undefined) {
    return {
      status: WORKFLOW_STAGE_RESULT_STATUS.passed,
      summary: null,
      details: null,
      outputs: {},
      gates: [],
      warnings: [],
      blockedBy: [],
      skippedReason: null,
      error: null,
    };
  }

  if (!isPlainObject(rawResult)) {
    throw new TypeError(`Workflow handler for stage "${stage.id}" must return an object`);
  }

  const status =
    (rawResult.status as WorkflowStageResultStatus | undefined) ??
    WORKFLOW_STAGE_RESULT_STATUS.passed;

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
    outputs: cloneValue((rawResult.outputs ?? {}) as GenericRecord),
    gates: Array.isArray(rawResult.gates) ? cloneValue(rawResult.gates) : [],
    warnings: Array.isArray(rawResult.warnings) ? cloneValue(rawResult.warnings) : [],
    blockedBy: Array.isArray(rawResult.blockedBy)
      ? rawResult.blockedBy.filter((item): item is string => typeof item === "string")
      : [],
    skippedReason: typeof rawResult.skippedReason === "string" ? rawResult.skippedReason : null,
    error: isPlainObject(rawResult.error)
      ? {
          message:
            typeof rawResult.error.message === "string"
              ? rawResult.error.message
              : String(rawResult.error),
          code: typeof rawResult.error.code === "string" ? rawResult.error.code : null,
        }
      : null,
  };
}

function createStageContext(options: {
  template: WorkflowTemplate;
  stage: WorkflowStage;
  stageIndex: number;
  selectedStageIds: string[];
  dependencyResults: WorkflowStageResult[];
  previousResults: WorkflowStageResult[];
  runtimeState: RuntimeState;
  metadata: GenericRecord;
  slotResolution: unknown;
}): WorkflowStageContext {
  const activeSlots = (options.slotResolution as GenericRecord | null)?.activeSlots;

  return {
    template: options.template,
    stage: options.stage,
    stageIndex: options.stageIndex,
    selectedStageIds: options.selectedStageIds,
    dependencyResults: options.dependencyResults.map((result) => cloneValue(result)),
    previousResults: options.previousResults.map((result) => cloneValue(result)),
    state: options.runtimeState.values,
    runtime: options.runtimeState,
    artifacts: options.runtimeState.artifacts,
    metadata: cloneValue(options.metadata ?? {}),
    slots: Array.isArray(activeSlots) ? cloneValue(activeSlots) : [],
    slotResolution: cloneValue(options.slotResolution ?? null),
  };
}

function createDependencyStatusMap(
  dependencyResults: WorkflowStageResult[],
): Record<string, WorkflowStageResultStatus> {
  return Object.fromEntries(dependencyResults.map((result) => [result.id, result.status]));
}

function mergeStageOutputs(runtimeState: RuntimeState, outputs: unknown): void {
  if (!isPlainObject(outputs) || Object.keys(outputs).length === 0) {
    return;
  }

  Object.assign(runtimeState.artifacts, cloneValue(outputs));
}

function createStageSlotDetails(slotResolution: unknown): GenericRecord {
  if (!isPlainObject(slotResolution)) {
    return {
      activeSlots: [],
      blockedSlots: [],
      suppressedSlots: [],
      injections: {
        aiPromptKeys: [],
        humanDocSections: [],
      },
      checks: {
        before: [],
        after: [],
      },
    };
  }

  return {
    activeSlots: cloneValue(slotResolution.activeSlots ?? []),
    blockedSlots: cloneValue(slotResolution.blockedSlots ?? []),
    suppressedSlots: cloneValue(slotResolution.suppressedSlots ?? []),
    injections: cloneValue(slotResolution.injections ?? {}),
    checks: cloneValue(slotResolution.checks ?? {}),
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function resolveStageSlotResolution(
  stage: WorkflowStage,
  metadata: GenericRecord,
  slotRuntime: unknown,
): unknown {
  if (!slotRuntime) {
    return null;
  }

  return resolveApplicableSlots(slotRuntime as Parameters<typeof resolveApplicableSlots>[0], {
    stageId: stage.id,
    commandId:
      (typeof metadata.command === "string" ? metadata.command : undefined) ??
      stage.executor?.command ??
      stage.executor?.ref ??
      undefined,
    adapterId: typeof metadata.adapterId === "string" ? metadata.adapterId : undefined,
    eventId: typeof metadata.eventId === "string" ? metadata.eventId : undefined,
    project:
      (typeof metadata.currentProject === "string" ? metadata.currentProject : undefined) ??
      (typeof metadata.project === "string" ? metadata.project : undefined),
    language: typeof metadata.language === "string" ? metadata.language : undefined,
    framework: typeof metadata.framework === "string" ? metadata.framework : undefined,
    tags: asStringArray(metadata.tags),
    paths: asStringArray(metadata.paths ?? metadata.changedPaths),
  });
}

export function selectWorkflowStages(
  template: WorkflowTemplate,
  stageIds?: string | string[],
): string[] {
  const resolvedTemplate = ensureSerialTemplate(validateWorkflowTemplate(template));
  const requestedStageIds = stageIds
    ? Array.from(new Set(Array.isArray(stageIds) ? stageIds : [stageIds]))
    : resolvedTemplate.stages.map((stage) => stage.id);
  const selected = new Set<string>();
  const stageMap = new Map<string, WorkflowStage>(
    resolvedTemplate.stages.map((stage) => [stage.id, stage]),
  );

  for (const stageId of requestedStageIds) {
    const stage = stageMap.get(stageId);

    if (!stage) {
      throw new TypeError(`Unknown workflow stage: ${stageId}`);
    }

    const queue: Array<WorkflowStage | undefined> = [stage];

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

export function getWorkflowStageResult(
  executionResult: { stages: WorkflowStageResult[] },
  stageId: string,
): WorkflowStageResult | null {
  return executionResult.stages.find((stageResult) => stageResult.id === stageId) ?? null;
}

export async function executeWorkflow(
  options: ExecuteWorkflowOptions = {},
): Promise<WorkflowExecutionResult> {
  const template = resolveTemplate(options);
  const selectedStageIds = selectWorkflowStages(template, options.targetStages);
  const selectedStageIdSet = new Set(selectedStageIds);
  const runtimeState: RuntimeState = {
    artifacts: cloneValue(options.initialArtifacts ?? {}),
    values: cloneValue(options.initialState ?? {}),
  };
  const metadata = cloneValue(options.metadata ?? {});
  const handlers = options.handlers ?? {};
  const slotRuntime = options.slotRuntime ?? null;
  const stageResults: WorkflowStageResult[] = [];
  const stageResultsById = new Map<string, WorkflowStageResult>();
  const startedAt = new Date().toISOString();
  let firstFailedStageId: string | null = null;

  for (const [stageIndex, stage] of template.stages.entries()) {
    const dependencyResults = (stage.dependsOn ?? [])
      .map((dependencyId) => stageResultsById.get(dependencyId))
      .filter((result): result is WorkflowStageResult => Boolean(result));
    const dependencyStatuses = createDependencyStatusMap(dependencyResults);

    if (!selectedStageIdSet.has(stage.id)) {
      const skippedStage = createSkippedStageResult(stage, {
        dependencyStatuses,
        skippedReason: "not-selected",
        summary: "Stage not selected for this workflow run.",
      });

      stageResults.push(skippedStage);
      stageResultsById.set(stage.id, skippedStage);
      continue;
    }

    const blockedDependencies = dependencyResults.filter(
      (result) => result.status !== WORKFLOW_STAGE_RESULT_STATUS.passed,
    );

    if (blockedDependencies.length > 0) {
      const blockedStage = createSkippedStageResult(stage, {
        status: WORKFLOW_STAGE_RESULT_STATUS.blocked,
        dependencyStatuses,
        blockedBy: blockedDependencies.map((result) => result.id),
        summary: `Blocked by dependency results: ${blockedDependencies
          .map((result) => `${result.id}:${result.status}`)
          .join(", ")}`,
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
        summary: `Skipped because the workflow stopped after stage "${firstFailedStageId}" failed.`,
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
          summary: `No workflow handler registered for stage "${stage.id}".`,
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
          code: "workflow.handler_missing",
        },
      });

      stageResults.push(failedStage);
      stageResultsById.set(stage.id, failedStage);
      firstFailedStageId ??= stage.id;
      continue;
    }

    const stageStartedAt = new Date().toISOString();
    const stageStartedAtMs = Date.now();
    let slotResolution: unknown = null;

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
              humanDocSections: [],
            },
            checks: {
              before: [],
              after: [],
            },
          }),
          slotConflict: cloneValue((error as { details?: unknown }).details ?? {}),
        },
        error: {
          message: error.message,
          code:
            typeof (error as { code?: unknown }).code === "string"
              ? ((error as { code: string }).code ?? "slots.conflict")
              : "slots.conflict",
        },
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
          slotResolution,
        }),
      );
      const normalizedResult = normalizeHandlerResult(stage, rawResult);
      const stageFinishedAt = new Date().toISOString();
      const stageResult: WorkflowStageResult = {
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
          slots: createStageSlotDetails(slotResolution),
        },
        outputs: normalizedResult.outputs,
        gates: normalizedResult.gates,
        warnings: normalizedResult.warnings,
        blockedBy: normalizedResult.blockedBy,
        skippedReason: normalizedResult.skippedReason,
        error: normalizedResult.error,
      };

      mergeStageOutputs(runtimeState, stageResult.outputs);

      stageResults.push(stageResult);
      stageResultsById.set(stage.id, stageResult);

      if (stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.failed) {
        firstFailedStageId ??= stage.id;
      }
    } catch (error) {
      const errorCodeCandidate =
        error instanceof Error && "code" in error
          ? (error as { code?: unknown }).code
          : "workflow.handler_failed";
      const failedStage: WorkflowStageResult = {
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
          code:
            typeof errorCodeCandidate === "string" ? errorCodeCandidate : "workflow.handler_failed",
        },
      };

      stageResults.push(failedStage);
      stageResultsById.set(stage.id, failedStage);
      firstFailedStageId ??= stage.id;
    }
  }

  const finishedAt = new Date().toISOString();
  const selectedStageResults = stageResults.filter((stageResult) =>
    selectedStageIdSet.has(stageResult.id),
  );
  const hasFailedOrBlockedStages = selectedStageResults.some(
    (stageResult) =>
      stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.failed ||
      stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.blocked,
  );
  const status = hasFailedOrBlockedStages
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
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.passed,
      ).length,
      failed: selectedStageResults.filter(
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.failed,
      ).length,
      blocked: selectedStageResults.filter(
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.blocked,
      ).length,
      skipped: selectedStageResults.filter(
        (stageResult) => stageResult.status === WORKFLOW_STAGE_RESULT_STATUS.skipped,
      ).length,
      selected: selectedStageIds.length,
    },
    failure: firstFailedStageId
      ? {
          stageId: firstFailedStageId,
          stageResult: getWorkflowStageResult({ stages: stageResults }, firstFailedStageId),
        }
      : null,
    artifacts: runtimeState.artifacts,
    state: runtimeState.values,
    metadata,
  };
}
