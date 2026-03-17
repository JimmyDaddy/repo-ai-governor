import path from "node:path";

export const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SPRINT_NAME_PATTERN = /^sprint-\d{3}$/;
export const TASK_ID_PATTERN = /^TK-\d{3}$/;
export const REVIEW_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REVIEW_STATUS_PREFIXES = Object.freeze({
  pending: "review",
  verified: "verified_review",
  resolved: "resolved_review",
} as const);

export type ReviewStatus = keyof typeof REVIEW_STATUS_PREFIXES;

type RelativeLayout = Record<string, string>;

export type ResolveRepositoryLayoutOptions = {
  cwd?: string;
  project?: string;
  sprint?: string;
};

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

function joinRelativePath(...segments: Array<string | undefined>): string {
  return segments.filter(Boolean).join("/");
}

function toAbsolutePath(cwd: string, relativePath: string): string {
  return path.resolve(cwd, ...relativePath.split("/"));
}

function toKebabCase(value: string): string {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function assertPatternMatch(value: string, pattern: RegExp, label: string): string {
  if (!pattern.test(value)) {
    throw new TypeError(`${label} does not match the required naming convention: ${value}`);
  }

  return value;
}

export function normalizeProjectSlug(value: string): string {
  const slug = toKebabCase(value);
  return assertPatternMatch(slug, PROJECT_SLUG_PATTERN, "Project slug");
}

export function normalizeSprintName(value: string): string {
  const sprintName = String(value).trim().toLowerCase();
  return assertPatternMatch(sprintName, SPRINT_NAME_PATTERN, "Sprint name");
}

export function normalizeTaskId(value: string): string {
  const taskId = String(value).trim().toUpperCase();
  return assertPatternMatch(taskId, TASK_ID_PATTERN, "Task ID");
}

export function createReviewSlug(...parts: Array<string | string[]>): string {
  const slug = parts
    .flat()
    .map((part) => toKebabCase(part))
    .filter(Boolean)
    .join("-");

  return assertPatternMatch(slug, REVIEW_SLUG_PATTERN, "Review slug");
}

export function createTaskFileName(taskId: string): string {
  return `${normalizeTaskId(taskId)}.md`;
}

export function createReviewFileName(options?: { status?: ReviewStatus; slug?: string }): string {
  const status = options?.status ?? "pending";
  const prefix = REVIEW_STATUS_PREFIXES[status];

  if (!prefix) {
    throw new TypeError(`Unsupported review status: ${status}`);
  }

  const slug = createReviewSlug(options?.slug ?? "");
  return `${prefix}_${slug}.md`;
}

export function resolveRepositoryLayout(options: ResolveRepositoryLayoutOptions = {}): {
  cwd: string;
  relative: RelativeLayout;
  absolute: Record<string, string>;
  naming: {
    projectPattern: string;
    sprintPattern: string;
    sprintExample: string;
    taskPattern: string;
    taskExample: string;
    taskCsvColumns: readonly string[];
    reviewPatterns: {
      pending: string;
      verified: string;
      resolved: string;
    };
    reviewExamples: {
      pending: string;
      verified: string;
      resolved: string;
    };
  };
} {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const configRoot = DEFAULT_REPOSITORY_LAYOUT.configRoot;
  const configDirectories = DEFAULT_REPOSITORY_LAYOUT.configDirectories;
  const artifacts = DEFAULT_REPOSITORY_LAYOUT.artifacts;
  const reviewExampleSlug = createReviewSlug("tk-101", "design", "config", "layout");
  const relative: RelativeLayout = {
    configRoot,
    configFile: joinRelativePath(configRoot, DEFAULT_REPOSITORY_LAYOUT.configFile),
    contextDir: joinRelativePath(configRoot, configDirectories.context),
    currentContextFile: DEFAULT_REPOSITORY_LAYOUT.agentContext,
    slotsDir: joinRelativePath(configRoot, configDirectories.slots),
    adaptersDir: joinRelativePath(configRoot, configDirectories.adapters),
    reportsDir: joinRelativePath(configRoot, configDirectories.reports),
    templatesDir: joinRelativePath(configRoot, configDirectories.templates),
    agentEntry: DEFAULT_REPOSITORY_LAYOUT.agentEntry,
    docsDir: artifacts.baseDir,
  };

  if (options.project) {
    const project = normalizeProjectSlug(options.project);
    relative.projectDir = joinRelativePath(artifacts.baseDir, project);

    if (options.sprint) {
      const sprint = normalizeSprintName(options.sprint);
      relative.sprintDir = joinRelativePath(relative.projectDir, sprint);
      relative.indexFile = joinRelativePath(relative.sprintDir, artifacts.files.index);
      relative.planFile = joinRelativePath(relative.sprintDir, artifacts.files.plan);
      relative.tasksDir = joinRelativePath(relative.sprintDir, artifacts.directories.tasks);
      relative.taskChecklistFile = joinRelativePath(
        relative.tasksDir,
        artifacts.taskFiles.checklist,
      );
      relative.taskCsvFile = joinRelativePath(relative.tasksDir, artifacts.taskFiles.csv);
      relative.codeReviewDir = joinRelativePath(
        relative.sprintDir,
        artifacts.directories.codeReview,
      );
    }
  }

  const absolute = Object.fromEntries(
    Object.entries(relative).map(([key, relativePath]) => [key, toAbsolutePath(cwd, relativePath)]),
  );

  return {
    cwd,
    relative,
    absolute,
    naming: {
      projectPattern: "<project>",
      sprintPattern: "sprint-xxx",
      sprintExample: "sprint-001",
      taskPattern: "TK-xxx.md",
      taskExample: createTaskFileName("TK-101"),
      taskCsvColumns: DEFAULT_TASK_CSV_COLUMNS,
      reviewPatterns: artifacts.reviewFiles,
      reviewExamples: {
        pending: createReviewFileName({ status: "pending", slug: reviewExampleSlug }),
        verified: createReviewFileName({ status: "verified", slug: reviewExampleSlug }),
        resolved: createReviewFileName({ status: "resolved", slug: reviewExampleSlug }),
      },
    },
  };
}
