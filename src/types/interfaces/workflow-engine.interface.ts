import type {
  WORKFLOW_EXECUTION_STATUS,
  WORKFLOW_STAGE_RESULT_STATUS,
} from "../../constants/workflow-status.js";
import type {
  LocalizedText,
  WorkflowConfig,
  WorkflowExecutor,
  WorkflowStage,
  WorkflowTemplate,
} from "./workflow-template.interface.js";

export interface RuntimeState {
  artifacts: Record<string, unknown>;
  values: Record<string, unknown>;
}

export interface WorkflowStageError {
  message: string;
  code: string | null;
}

export interface WorkflowStageResult {
  id: string;
  name: LocalizedText;
  executor: WorkflowExecutor | null;
  status: (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS];
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number;
  dependsOn: string[];
  dependencyStatuses: Record<
    string,
    (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS]
  >;
  summary: unknown;
  details: unknown;
  outputs: Record<string, unknown>;
  gates: unknown[];
  warnings: unknown[];
  blockedBy: string[];
  skippedReason: string | null;
  error: WorkflowStageError | null;
}

export interface WorkflowStageContext {
  template: WorkflowTemplate;
  stage: WorkflowStage;
  stageIndex: number;
  selectedStageIds: string[];
  dependencyResults: WorkflowStageResult[];
  previousResults: WorkflowStageResult[];
  state: Record<string, unknown>;
  runtime: RuntimeState;
  artifacts: Record<string, unknown>;
  metadata: Record<string, unknown>;
  slots: unknown[];
  slotResolution: unknown;
}

export interface WorkflowStageHandlerResult {
  status?: (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS];
  summary?: unknown;
  details?: unknown;
  outputs?: Record<string, unknown>;
  gates?: unknown[];
  warnings?: unknown[];
  blockedBy?: string[];
  skippedReason?: string | null;
  error?: {
    message?: string;
    code?: string | null;
  } | null;
}

export interface ExecuteWorkflowOptions {
  template?: WorkflowTemplate;
  workflowConfig?: WorkflowConfig;
  targetStages?: string | string[];
  initialArtifacts?: Record<string, unknown>;
  initialState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  handlers?: Record<
    string,
    | ((
        context: WorkflowStageContext,
      ) => WorkflowStageHandlerResult | Promise<WorkflowStageHandlerResult> | void | Promise<void>)
    | undefined
  >;
  slotRuntime?: unknown;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: (typeof WORKFLOW_EXECUTION_STATUS)[keyof typeof WORKFLOW_EXECUTION_STATUS];
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
  artifacts: Record<string, unknown>;
  state: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface NormalizedHandlerResult {
  status: (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS];
  summary: unknown;
  details: unknown;
  outputs: Record<string, unknown>;
  gates: unknown[];
  warnings: unknown[];
  blockedBy: string[];
  skippedReason: string | null;
  error: WorkflowStageError | null;
}

export interface CreateSkippedStageOptions {
  status?: (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS];
  dependencyStatuses?: Record<
    string,
    (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS]
  >;
  summary?: unknown;
  details?: unknown;
  blockedBy?: string[];
  skippedReason?: string | null;
  error?: WorkflowStageError | null;
}
