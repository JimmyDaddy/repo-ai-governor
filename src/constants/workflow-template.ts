export enum StandardWorkflowStageEnum {
  Plan = "plan",
  Breakdown = "breakdown",
  Implement = "implement",
  SelfCheck = "self-check",
  Review = "review",
  ReviewVerify = "review-verify",
  TaskSync = "task-sync",
}

export const STANDARD_WORKFLOW_STAGE_SEQUENCE = Object.freeze(
  Object.values(StandardWorkflowStageEnum),
) as readonly `${StandardWorkflowStageEnum}`[];

export enum WorkflowExecutionModeEnum {
  Serial = "serial",
}

export const WORKFLOW_EXECUTION_MODES = Object.freeze(
  Object.values(WorkflowExecutionModeEnum),
) as readonly `${WorkflowExecutionModeEnum}`[];

export enum WorkflowFailurePolicyEnum {
  Stop = "stop",
  Continue = "continue",
  Warn = "warn",
}

export const WORKFLOW_FAILURE_POLICIES = Object.freeze(
  Object.values(WorkflowFailurePolicyEnum),
) as readonly `${WorkflowFailurePolicyEnum}`[];

export enum WorkflowExecutorKindEnum {
  Command = "command",
  Manual = "manual",
  Internal = "internal",
}

export const WORKFLOW_EXECUTOR_KINDS = Object.freeze(
  Object.values(WorkflowExecutorKindEnum),
) as readonly `${WorkflowExecutorKindEnum}`[];

export enum WorkflowBindingKindEnum {
  Context = "context",
  Config = "config",
  Artifact = "artifact",
  Workspace = "workspace",
  ReviewRecord = "review-record",
  CheckResult = "check-result",
  TaskRecord = "task-record",
}

export const WORKFLOW_BINDING_KINDS = Object.freeze(
  Object.values(WorkflowBindingKindEnum),
) as readonly `${WorkflowBindingKindEnum}`[];

export enum WorkflowGateKindEnum {
  ArtifactsExist = "artifacts-exist",
  ChecksPass = "checks-pass",
  ReviewStatus = "review-status",
  TaskRecordUpdated = "task-record-updated",
  ManualApproval = "manual-approval",
}

export const WORKFLOW_GATE_KINDS = Object.freeze(
  Object.values(WorkflowGateKindEnum),
) as readonly `${WorkflowGateKindEnum}`[];

export enum WorkflowTemplateKindEnum {
  WorkflowTemplate = "workflow-template",
}

export const WORKFLOW_TEMPLATE_KINDS = Object.freeze(
  Object.values(WorkflowTemplateKindEnum),
) as readonly `${WorkflowTemplateKindEnum}`[];

export enum WorkflowTemplateSchemaVersionEnum {
  V1 = "1",
}

export const WORKFLOW_TEMPLATE_SCHEMA_VERSIONS = Object.freeze(
  Object.values(WorkflowTemplateSchemaVersionEnum),
) as readonly `${WorkflowTemplateSchemaVersionEnum}`[];
