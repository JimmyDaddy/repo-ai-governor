import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import {
  type ChangeRiskEvaluationResult,
  ChangeRiskEvaluator,
  ChangeRiskFileCategory,
  type ChangeRiskFileCategoryValue,
} from '@repo-ai-governor/core-change-risk';
import { CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS } from '../../constants/cli-governance-runtime.constant.js';
import {
  CLI_REVIEW_ARTIFACT_FILE_PREFIX_BY_STATUS,
  CLI_REVIEW_GENERATED_PATH_PREFIXES,
  type CliReviewLifecycleStatus,
} from '../../constants/cli-review.constant.js';
import type { CliReviewStreamContext } from '../../types/interfaces/cli-review-command.interface.js';

const execFileAsync = promisify(execFile);

/**
 * Owns review lifecycle path resolution, filename conventions, and scope collection.
 *
 * Why this exists:
 * review/review-verify must share one deterministic source for current-context routing,
 * review artifact naming, and reviewable working-tree scope collection.
 */
export class CliReviewLifecycleRuntime {
  public constructor(
    private readonly repositoryRoot: string,
    private readonly workspaceRoot: string,
  ) {}

  /**
   * Resolves active-stream review paths from workspace current-context when available.
   * @returns Canonical review stream context or fallback review directory under workspace context.
   */
  public async resolveStreamContext(): Promise<CliReviewStreamContext> {
    const currentContextPath = resolve(this.workspaceRoot, 'context', 'current-context.md');
    const fallbackReviewDirPath = resolve(this.workspaceRoot, 'context', 'review');
    if (!existsSync(currentContextPath)) {
      return {
        projectId: null,
        sprintId: null,
        reviewDirPath: fallbackReviewDirPath,
        tasksDirPath: null,
        checklistPath: null,
        csvPath: null,
        currentContextPath: null,
        usesFallbackReviewDir: true,
      };
    }

    try {
      const currentContextContent = await readFile(currentContextPath, 'utf8');
      const activeStreamsSection = this.extractSection(currentContextContent, 'Active Streams');
      const primaryDescriptor = activeStreamsSection.match(/^- `primary`: (.+)$/mu)?.[1] ?? null;
      const primaryProjectId =
        currentContextContent.match(/^- Project:\s*`([^`]+)`/mu)?.[1]?.trim() ?? null;
      const primarySprintId =
        currentContextContent.match(/^- Sprint:\s*`([^`]+)`/mu)?.[1]?.trim() ?? null;

      if (!primaryDescriptor) {
        return {
          projectId: primaryProjectId,
          sprintId: primarySprintId,
          reviewDirPath: fallbackReviewDirPath,
          tasksDirPath: null,
          checklistPath: null,
          csvPath: null,
          currentContextPath,
          usesFallbackReviewDir: true,
        };
      }

      return {
        projectId: this.extractBacktickField(primaryDescriptor, 'project') ?? primaryProjectId,
        sprintId: this.extractBacktickField(primaryDescriptor, 'sprint') ?? primarySprintId,
        reviewDirPath:
          this.resolveRepoRelativePath(this.extractBacktickField(primaryDescriptor, 'review')) ??
          fallbackReviewDirPath,
        tasksDirPath: this.resolveRepoRelativePath(
          this.extractBacktickField(primaryDescriptor, 'tasks'),
        ),
        checklistPath: this.resolveRepoRelativePath(
          this.extractBacktickField(primaryDescriptor, 'checklist'),
        ),
        csvPath: this.resolveRepoRelativePath(this.extractBacktickField(primaryDescriptor, 'csv')),
        currentContextPath,
        usesFallbackReviewDir: false,
      };
    } catch {
      return {
        projectId: null,
        sprintId: null,
        reviewDirPath: fallbackReviewDirPath,
        tasksDirPath: null,
        checklistPath: null,
        csvPath: null,
        currentContextPath,
        usesFallbackReviewDir: true,
      };
    }
  }

  /**
   * Collects repository-relative changed paths from git status while excluding generated artifacts.
   * @param options Exclusion rules for generated or out-of-scope paths.
   * @returns Stable unique repository-relative paths.
   */
  public async collectGitChangedPaths(
    options: {
      excludePaths?: string[];
    } = {},
  ): Promise<string[]> {
    try {
      const result = await execFileAsync(
        'git',
        ['status', '--porcelain', '--untracked-files=all'],
        {
          cwd: this.repositoryRoot,
          maxBuffer: 2 * 1024 * 1024,
          encoding: 'utf8',
        },
      );
      const changedPaths = result.stdout
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 3)
        .map((line) => line.slice(3))
        .map((line) => {
          const renameArrowIndex = line.indexOf(' -> ');
          return renameArrowIndex >= 0 ? line.slice(renameArrowIndex + 4) : line;
        })
        .map((line) => line.replace(/\\/gu, '/').trim())
        .filter((line) => line.length > 0);
      const excludedPaths = new Set(
        (options.excludePaths ?? [])
          .map((value) => value.replace(/\\/gu, '/').trim())
          .filter((value) => value.length > 0),
      );

      return Array.from(new Set(changedPaths)).filter(
        (changedPath) =>
          !Array.from(excludedPaths.values()).some(
            (excludedPath) =>
              changedPath === excludedPath || changedPath.startsWith(`${excludedPath}/`),
          ),
      );
    } catch {
      return [];
    }
  }

  /**
   * Evaluates changed-path risk facts using the shared change-risk evaluator baseline.
   * @param changedPaths Repository-relative changed paths.
   * @returns Structured change-risk evaluation result.
   */
  public evaluateRisk(changedPaths: string[]): ChangeRiskEvaluationResult {
    const changeRiskEvaluator = new ChangeRiskEvaluator();
    return changeRiskEvaluator.evaluate({
      changedPaths,
      fileCategories: this.resolveRiskFileCategories(changedPaths),
      requestedPermissions: [],
      commandClass: 'code_edit',
      lockfileDelta: changedPaths.some((path) => path.endsWith('pnpm-lock.yaml')),
      migrationDetected: changedPaths.some(
        (path) => path.includes('migration') || path.includes('migrations'),
      ),
      ciWorkflowChanged: changedPaths.some((path) => path.includes('.github/workflows/')),
      releaseScriptChanged: changedPaths.some((path) => path.includes('scripts/release')),
    });
  }

  /**
   * Creates one canonical review slug from task scope or working-tree scope plus timestamp.
   * @param options Scope identifiers captured for artifact naming.
   * @returns Repository-stable review slug.
   */
  public createReviewSlug(options: { taskId: string | null; createdAt: Date }): string {
    const timestamp = this.formatTimestamp(options.createdAt);
    if (options.taskId) {
      return `${options.taskId.toLowerCase()}-${timestamp}`;
    }

    return `working-tree-${timestamp}`;
  }

  /**
   * Resolves canonical markdown artifact path for one lifecycle status + slug pair.
   * @param options Target artifact naming inputs.
   * @returns Absolute markdown artifact path.
   */
  public resolveArtifactPath(options: {
    reviewDirPath: string;
    status: CliReviewLifecycleStatus;
    slug: string;
  }): string {
    const filePrefix = CLI_REVIEW_ARTIFACT_FILE_PREFIX_BY_STATUS[options.status];
    return resolve(options.reviewDirPath, `${filePrefix}${options.slug}.md`);
  }

  /**
   * Extracts logical review slug from an existing lifecycle artifact path.
   * @param artifactPath Existing lifecycle artifact path.
   * @returns Artifact slug without filename prefix/suffix.
   */
  public extractReviewSlugFromArtifactPath(artifactPath: string): string {
    const fileName = artifactPath.replace(/\\/gu, '/').split('/').at(-1) ?? '';
    for (const prefix of Object.values(CLI_REVIEW_ARTIFACT_FILE_PREFIX_BY_STATUS)) {
      if (fileName.startsWith(prefix) && fileName.endsWith('.md')) {
        return fileName.slice(prefix.length, -3);
      }
    }

    return fileName.replace(/\.md$/u, '');
  }

  /**
   * Converts one absolute repository path into repository-relative review payload form.
   * @param targetPath Absolute path under repository root.
   * @returns Repository-relative path with POSIX separators.
   */
  public toRepositoryRelativePath(targetPath: string): string {
    return relative(this.repositoryRoot, targetPath).replace(/\\/gu, '/');
  }

  /**
   * Lists generated-path prefixes that should never become review findings by default.
   * @returns Repository-relative generated prefixes.
   */
  public resolveGeneratedPathPrefixes(): string[] {
    return [...CLI_REVIEW_GENERATED_PATH_PREFIXES];
  }

  private resolveRiskFileCategories(changedPaths: string[]): ChangeRiskFileCategoryValue[] {
    if (changedPaths.length === 0) {
      return [ChangeRiskFileCategory.CODE];
    }

    const categories = new Set<ChangeRiskFileCategoryValue>([ChangeRiskFileCategory.CODE]);
    for (const changedPath of changedPaths) {
      const lowerCasePath = changedPath.toLowerCase();
      for (const patternEntry of CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS) {
        if (lowerCasePath.includes(patternEntry.pattern.toLowerCase())) {
          categories.add(patternEntry.category);
        }
      }
    }

    return Array.from(categories.values());
  }

  private formatTimestamp(value: Date): string {
    const year = String(value.getFullYear());
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  private extractSection(content: string, headingText: string): string {
    const headingPattern = /^##\s+([^\n]+)$/gmu;
    const headingMatches = Array.from(content.matchAll(headingPattern));
    for (let index = 0; index < headingMatches.length; index += 1) {
      const currentHeadingMatch = headingMatches[index];
      const currentHeadingIndex = currentHeadingMatch.index;
      const currentHeading = currentHeadingMatch[1]?.trim() ?? '';
      if (typeof currentHeadingIndex !== 'number' || currentHeading !== headingText) {
        continue;
      }

      const sectionStart = currentHeadingIndex + currentHeadingMatch[0].length;
      const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
      return content.slice(sectionStart, sectionEnd).trim();
    }

    return '';
  }

  private extractBacktickField(descriptor: string, fieldName: string): string | null {
    const marker = `${fieldName}=\``;
    const startIndex = descriptor.indexOf(marker);
    if (startIndex < 0) {
      return null;
    }

    const valueStartIndex = startIndex + marker.length;
    const endIndex = descriptor.indexOf('`', valueStartIndex);
    if (endIndex < 0) {
      return null;
    }

    const rawValue = descriptor.slice(valueStartIndex, endIndex).trim();
    return rawValue.length > 0 ? rawValue : null;
  }

  private resolveRepoRelativePath(relativePath: string | null): string | null {
    if (!relativePath) {
      return null;
    }

    return resolve(this.repositoryRoot, relativePath);
  }
}
