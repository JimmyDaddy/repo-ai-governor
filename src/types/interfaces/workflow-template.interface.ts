import type { Locale } from "../aliases/locale.type.js";
import type {
  FailurePolicy,
  WorkflowBindingKind,
  WorkflowExecutionMode,
  WorkflowExecutorKind,
  WorkflowGateKind,
  WorkflowTemplateKind,
  WorkflowTemplateSchemaVersion,
} from "../aliases/workflow.type.js";

export interface LocalizedText extends Record<Locale, string> {}

export interface WorkflowExecutor {
  kind: WorkflowExecutorKind;
  ref: string;
  command?: string;
  options?: Record<string, unknown>;
}

export interface WorkflowBinding {
  kind: WorkflowBindingKind;
  ref: string;
  required?: boolean;
  multiple?: boolean;
}

export interface WorkflowGateCondition {
  id: string;
  kind: WorkflowGateKind;
  refs?: string[];
  expectedStatus?: string;
  message?: LocalizedText;
}

export interface WorkflowGateSet {
  enter?: WorkflowGateCondition[];
  exit?: WorkflowGateCondition[];
}

export interface WorkflowStage {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  dependsOn?: string[];
  executor: WorkflowExecutor;
  inputs?: WorkflowBinding[];
  outputs?: WorkflowBinding[];
  gates?: WorkflowGateSet;
  enabled?: boolean;
  required?: boolean;
  onFailure?: FailurePolicy;
  requiresApproval?: boolean;
}

export interface WorkflowExecution {
  mode: WorkflowExecutionMode;
  allowSkipStages: boolean;
  stopOnFailure: boolean;
}

export interface WorkflowTemplate {
  id: string;
  version: WorkflowTemplateSchemaVersion;
  kind: WorkflowTemplateKind;
  meta: {
    name: LocalizedText;
    description?: LocalizedText;
  };
  execution: WorkflowExecution;
  stages: WorkflowStage[];
}

export interface WorkflowStageOverride extends Partial<Omit<WorkflowStage, "id">> {
  id: string;
}

export interface WorkflowConfig {
  template?: string;
  stages?: WorkflowStageOverride[];
  allowSkipStages?: boolean;
  stopOnFailure?: boolean;
  requireHumanApprovalFor?: string[];
}
