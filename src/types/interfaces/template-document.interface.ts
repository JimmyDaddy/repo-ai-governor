import type { TemplateRenderer } from "../aliases/template-document.type.js";
import type { InitTemplateContext } from "./command-bootstrap.interface.js";

export interface TemplateMap<TContext> {
  [documentId: string]: TemplateRenderer<TContext>;
}

export interface PlanRuleView {
  level: string;
  summary: string;
  rationale?: string | null;
}

export interface PlanTask {
  id: string;
  title: string;
  owner: string;
  priority: string;
  dueDate: string;
  status: string;
  planSummary: string;
  dependsOn: string[];
  goal: string;
  deliverables: string[];
  acceptance: string[];
  ruleIds: string[];
}

export interface PlanTemplateContext {
  locale?: string;
  currentProject: string;
  currentSprint: string;
  dateStamp: string;
  title: string;
  goal: string;
  requirementSummary: string;
  inScope: string[];
  outOfScope: string[];
  workflowStages: string[];
  planRules: PlanRuleView[];
  strategy: string[];
  risks: string[];
  acceptance: string[];
  verificationPath: string[];
  tasks: PlanTask[];
  csvColumns: string[];
  task: PlanTask;
  status: string;
  dryRun: boolean;
  workflowStatus: string;
  standardsPreset: string;
  files: unknown;
}

export interface InitDocumentTemplateContext extends InitTemplateContext {}
