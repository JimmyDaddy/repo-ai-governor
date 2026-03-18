import path from "node:path";
import {
  DEFAULT_REPOSITORY_LAYOUT,
  DEFAULT_TASK_CSV_COLUMNS,
  REVIEW_STATUS_PREFIXES,
  ReviewStatusEnum,
} from "../constants/repository-layout.js";
import type { ReviewStatus } from "../types/aliases/repository-layout.type.js";
import type {
  RelativeLayout,
  RepositoryLayoutResolution,
  ResolveRepositoryLayoutOptions,
} from "../types/interfaces/config-repository-layout.interface.js";

export const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SPRINT_NAME_PATTERN = /^sprint-\d{3}$/;
export const TASK_ID_PATTERN = /^TK-\d{3}$/;
export const REVIEW_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type { ReviewStatus } from "../types/aliases/repository-layout.type.js";
export type {
  RelativeLayout,
  RepositoryLayoutResolution,
  ResolveRepositoryLayoutOptions,
} from "../types/interfaces/config-repository-layout.interface.js";

export { DEFAULT_TASK_CSV_COLUMNS, DEFAULT_REPOSITORY_LAYOUT };

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
  const status = options?.status ?? ReviewStatusEnum.Pending;
  const prefix = REVIEW_STATUS_PREFIXES[status];

  if (!prefix) {
    throw new TypeError(`Unsupported review status: ${status}`);
  }

  const slug = createReviewSlug(options?.slug ?? "");
  return `${prefix}_${slug}.md`;
}

export function resolveRepositoryLayout(
  options: ResolveRepositoryLayoutOptions = {},
): RepositoryLayoutResolution {
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
        pending: createReviewFileName({
          status: ReviewStatusEnum.Pending,
          slug: reviewExampleSlug,
        }),
        verified: createReviewFileName({
          status: ReviewStatusEnum.Verified,
          slug: reviewExampleSlug,
        }),
        resolved: createReviewFileName({
          status: ReviewStatusEnum.Resolved,
          slug: reviewExampleSlug,
        }),
      },
    },
  };
}
