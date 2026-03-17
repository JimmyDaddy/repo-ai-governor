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
