export const DEFAULT_TASK_COMPLETION_STATUSES = Object.freeze([
  "done",
  "resolved",
  "completed",
  "closed",
]);

export const DEFAULT_TASK_LOOP = Object.freeze({
  stageId: "task-delivery-loop",
  implementationRouteKey: "task-implementation",
  codeReviewRouteKey: "task-code-review",
  maxReviewCycles: 3,
});

export const REVIEW_STATUS_WEIGHT = Object.freeze({
  review: 1,
  verified_review: 2,
  resolved_review: 3,
});

export const ACTION_PERMISSION_FIELD = Object.freeze({
  read: "allowRead",
  editCode: "allowEditCode",
  editDocs: "allowEditDocs",
  runChecks: "allowRunChecks",
  commit: "allowCommit",
  push: "allowPush",
  pullRequest: "allowPullRequest",
});

export const HIGH_RISK_PERMISSION_FIELD = Object.freeze({
  secrets_or_credentials: "allowSecretsEdit",
  infra_or_deploy: "allowInfraEdit",
  ci_workflow_modification: "allowInfraEdit",
  dangerous_command: "allowDangerousCommands",
  production_config_edit: "allowProductionConfigEdit",
});

export const DEFAULT_APPROVAL_RISK_TAGS = Object.freeze([
  "secrets_or_credentials",
  "infra_or_deploy",
  "ci_workflow_modification",
  "dependency_major_upgrade",
  "database_migration",
  "dangerous_command",
  "production_config_edit",
]);
