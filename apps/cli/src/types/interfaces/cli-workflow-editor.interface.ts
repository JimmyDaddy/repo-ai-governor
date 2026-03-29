import type { ProcessDslDefinition, ProcessNodeType } from '@repo-ai-governor/core-process';
import type {
  CliWorkflowAction,
  CliWorkflowDefinitionSource,
  CliWorkflowEditorIssueCode,
  CliWorkflowEditorIssueSeverity,
  CliWorkflowTemplateId,
} from '../../constants/cli-workflow.constant.js';
import type { CliArtifactWriter } from './cli-governance-runtime.interface.js';

/**
 * Describes one normalized workflow node surfaced by the editor runtime.
 */
export interface CliWorkflowEditorNodeSummary {
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType | string;
  routeKey: string;
  roleProfileId: string;
  maxCycles?: number;
  maxWallTimeSeconds?: number;
}

/**
 * Describes one normalized workflow edge surfaced by the editor runtime.
 */
export interface CliWorkflowEditorEdgeSummary {
  fromNodeId: string;
  toNodeId: string;
  conditionKey?: string;
}

/**
 * Describes one condition-node branch summary surfaced by the editor runtime.
 */
export interface CliWorkflowEditorConditionBranchSummary {
  nodeId: string;
  branchKeys: string[];
}

/**
 * Describes one workflow editor semantic validation issue.
 */
export interface CliWorkflowEditorValidationIssue {
  code: CliWorkflowEditorIssueCode;
  severity: CliWorkflowEditorIssueSeverity;
  location: string;
}

/**
 * Defines inputs needed to prepare one workflow editor session.
 */
export interface CliWorkflowEditorPrepareOptions {
  action: CliWorkflowAction;
  requestedTemplateId: CliWorkflowTemplateId | null;
  executionId: string;
  workspaceRoot: string;
  artifactWriter: CliArtifactWriter;
}

/**
 * Describes one prepared workflow editor session.
 */
export interface CliWorkflowEditorSession {
  action: CliWorkflowAction;
  templateId: CliWorkflowTemplateId;
  definitionSource: CliWorkflowDefinitionSource;
  definitionPath: string;
  definition: ProcessDslDefinition;
  nodeSummaries: CliWorkflowEditorNodeSummary[];
  edgeSummaries: CliWorkflowEditorEdgeSummary[];
  conditionBranchSummaries: CliWorkflowEditorConditionBranchSummary[];
  validationIssues: CliWorkflowEditorValidationIssue[];
}
