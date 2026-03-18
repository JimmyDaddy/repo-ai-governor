import type {
  WORKFLOW_EXECUTION_STATUS,
  WORKFLOW_STAGE_RESULT_STATUS,
} from "../../constants/workflow-status.js";
import type {
  WORKFLOW_BINDING_KINDS,
  WORKFLOW_EXECUTION_MODES,
  WORKFLOW_EXECUTOR_KINDS,
  WORKFLOW_FAILURE_POLICIES,
  WORKFLOW_GATE_KINDS,
  WORKFLOW_TEMPLATE_KINDS,
  WORKFLOW_TEMPLATE_SCHEMA_VERSIONS,
} from "../../constants/workflow-template.js";
import type {
  WorkflowStageContext,
  WorkflowStageHandlerResult,
} from "../interfaces/workflow-engine.interface.js";

export type WorkflowExecutionMode = (typeof WORKFLOW_EXECUTION_MODES)[number];

export type FailurePolicy = (typeof WORKFLOW_FAILURE_POLICIES)[number];

export type WorkflowExecutorKind = (typeof WORKFLOW_EXECUTOR_KINDS)[number];

export type WorkflowBindingKind = (typeof WORKFLOW_BINDING_KINDS)[number];

export type WorkflowGateKind = (typeof WORKFLOW_GATE_KINDS)[number];

export type WorkflowTemplateKind = (typeof WORKFLOW_TEMPLATE_KINDS)[number];

export type WorkflowTemplateSchemaVersion = (typeof WORKFLOW_TEMPLATE_SCHEMA_VERSIONS)[number];

export type WorkflowStageResultStatus =
  (typeof WORKFLOW_STAGE_RESULT_STATUS)[keyof typeof WORKFLOW_STAGE_RESULT_STATUS];

export type WorkflowExecutionStatus =
  (typeof WORKFLOW_EXECUTION_STATUS)[keyof typeof WORKFLOW_EXECUTION_STATUS];

export type WorkflowStageHandler = (
  context: WorkflowStageContext,
) => WorkflowStageHandlerResult | Promise<WorkflowStageHandlerResult> | void | Promise<void>;
