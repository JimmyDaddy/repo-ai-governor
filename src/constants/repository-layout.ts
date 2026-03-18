export enum ReviewStatusEnum {
  Pending = "pending",
  Verified = "verified",
  Resolved = "resolved",
}

export const REVIEW_STATUSES = Object.freeze(
  Object.values(ReviewStatusEnum),
) as readonly `${ReviewStatusEnum}`[];

export enum ReviewStatusPrefixEnum {
  Pending = "review",
  Verified = "verified_review",
  Resolved = "resolved_review",
}

export const REVIEW_STATUS_PREFIXES = Object.freeze({
  [ReviewStatusEnum.Pending]: ReviewStatusPrefixEnum.Pending,
  [ReviewStatusEnum.Verified]: ReviewStatusPrefixEnum.Verified,
  [ReviewStatusEnum.Resolved]: ReviewStatusPrefixEnum.Resolved,
} as const);

export const DEFAULT_TASK_CSV_COLUMNS = Object.freeze([
  "execution_id",
  "task_id",
  "title",
  "owner",
  "priority",
  "due_date",
  "status",
  "project",
  "sprint",
  "plan",
  "result",
  "verify",
  "review_delta",
  "recorded_at",
]);

export enum ConfigDirectoryEnum {
  Context = "context",
  Slots = "slots",
  Adapters = "adapters",
  Reports = "reports",
  Templates = "templates",
}

export const DEFAULT_REPOSITORY_LAYOUT = Object.freeze({
  configRoot: ".repo-ai-governor",
  configFile: "governor.yaml",
  configDirectories: Object.freeze({
    context: ConfigDirectoryEnum.Context,
    slots: ConfigDirectoryEnum.Slots,
    adapters: ConfigDirectoryEnum.Adapters,
    reports: ConfigDirectoryEnum.Reports,
    templates: ConfigDirectoryEnum.Templates,
  }),
  agentEntry: "AGENTS.md",
  agentContext: ".repo-ai-governor/context/current-context.md",
  artifacts: Object.freeze({
    baseDir: "docs",
    files: Object.freeze({
      index: "index.md",
      plan: "plan.md",
    }),
    directories: Object.freeze({
      tasks: "tasks",
      codeReview: "code-review",
    }),
    taskFiles: Object.freeze({
      checklist: "checklist.md",
      csv: "tasks.csv",
      csvColumns: DEFAULT_TASK_CSV_COLUMNS,
    }),
    reviewFiles: Object.freeze({
      pending: "review_<slug>.md",
      verified: "verified_review_<slug>.md",
      resolved: "resolved_review_<slug>.md",
    }),
  }),
});
