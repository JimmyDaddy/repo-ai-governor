export const REVIEW_STATUS_PREFIXES = Object.freeze({
  pending: "review",
  verified: "verified_review",
  resolved: "resolved_review",
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

export const DEFAULT_REPOSITORY_LAYOUT = Object.freeze({
  configRoot: ".repo-ai-governor",
  configFile: "governor.yaml",
  configDirectories: Object.freeze({
    context: "context",
    slots: "slots",
    adapters: "adapters",
    reports: "reports",
    templates: "templates",
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
