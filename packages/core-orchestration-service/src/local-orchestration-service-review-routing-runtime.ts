import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { OrchestrationExecutionSummary } from '@repo-ai-governor/orchestration-service-client';

interface LocalOrchestrationServiceReviewRoutingRuntimeDependencies {
  workspaceRoot: string;
}

const CURRENT_CONTEXT_FILE_SEGMENTS = ['context', 'current-context.md'] as const;

export interface LocalOrchestrationServiceReviewDocumentDescriptor {
  absolutePath: string;
  fileName: string;
  updatedAt: string;
  title?: string;
  task?: string;
  scope?: string;
  lifecycleStatus?: string;
}

/**
 * Resolves service-owned review directories and review documents from current-context truth.
 *
 * Why this exists:
 * governance surfaces should open review records through orchestration-owned routing instead of
 * reconstructing review paths inside each client or read-model builder.
 */
export class LocalOrchestrationServiceReviewRoutingRuntime {
  public constructor(
    private readonly dependencies: LocalOrchestrationServiceReviewRoutingRuntimeDependencies,
  ) {}

  /**
   * Resolves the active review directory from current-context routing truth.
   * @returns The absolute review directory path when one is configured.
   */
  public async resolvePrimaryReviewDirectoryPath(): Promise<string | undefined> {
    const currentContextPath = resolve(
      this.dependencies.workspaceRoot,
      ...CURRENT_CONTEXT_FILE_SEGMENTS,
    );
    if (!existsSync(currentContextPath)) {
      return undefined;
    }

    const currentContextContent = await readFile(currentContextPath, 'utf8');
    const configuredReviewDirectoryPath =
      this.readSectionMetadataField(
        this.extractMarkdownSection(currentContextContent, 'Worktree Review Target'),
        'Review records',
      ) ??
      this.readSectionMetadataField(
        this.extractMarkdownSection(currentContextContent, 'Primary Stream'),
        'Review records',
      );
    if (!configuredReviewDirectoryPath || configuredReviewDirectoryPath === 'none') {
      return undefined;
    }

    const resolvedReviewDirectoryPath = resolve(
      dirname(this.dependencies.workspaceRoot),
      configuredReviewDirectoryPath,
    );
    return existsSync(resolvedReviewDirectoryPath) ? resolvedReviewDirectoryPath : undefined;
  }

  /**
   * Resolves the newest markdown review document under the routed review directory.
   * @returns The absolute review document path when one exists.
   */
  public async resolveLatestReviewDocumentPath(): Promise<string | undefined> {
    const reviewDirectoryPath = await this.resolvePrimaryReviewDirectoryPath();
    if (!reviewDirectoryPath || !existsSync(reviewDirectoryPath)) {
      return undefined;
    }

    const reviewFiles = await this.listReviewDocuments(reviewDirectoryPath);
    return reviewFiles[0]?.absolutePath;
  }

  /**
   * Lists routed review documents with service-owned lifecycle metadata.
   * @param reviewDirectoryPath Optional explicit review directory; defaults to the routed directory.
   * @returns Review document descriptors sorted by newest update first.
   */
  public async listReviewDocuments(
    reviewDirectoryPath?: string,
  ): Promise<LocalOrchestrationServiceReviewDocumentDescriptor[]> {
    const resolvedReviewDirectoryPath =
      reviewDirectoryPath ?? (await this.resolvePrimaryReviewDirectoryPath());
    if (!resolvedReviewDirectoryPath || !existsSync(resolvedReviewDirectoryPath)) {
      return [];
    }

    const reviewFiles = await Promise.all(
      (await readdir(resolvedReviewDirectoryPath))
        .filter((entry) => entry.endsWith('.md'))
        .map(async (entry) => {
          const absolutePath = resolve(resolvedReviewDirectoryPath, entry);
          const [content, fileStat] = await Promise.all([
            readFile(absolutePath, 'utf8'),
            stat(absolutePath),
          ]);
          return {
            absolutePath,
            fileName: entry,
            updatedAt: new Date(fileStat.mtimeMs).toISOString(),
            title: this.readMarkdownHeading(content),
            task: this.readReviewMetadataField(content, 'Task'),
            scope: this.readReviewMetadataField(content, 'Scope'),
            lifecycleStatus: this.readReviewMetadataField(content, 'Status'),
          } satisfies LocalOrchestrationServiceReviewDocumentDescriptor;
        }),
    );
    return reviewFiles.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  /**
   * Resolves one execution-scoped review document from service-owned execution facts.
   * @param execution Execution summary carrying task/project/sprint ownership facts.
   * @returns The matching review document path, or `undefined` when no unambiguous match exists.
   */
  public async resolveExecutionReviewDocumentPath(
    execution: OrchestrationExecutionSummary,
  ): Promise<string | undefined> {
    const reviewDirectoryPath = await this.resolvePrimaryReviewDirectoryPath();
    if (!reviewDirectoryPath || !existsSync(reviewDirectoryPath)) {
      return undefined;
    }

    const reviewFiles = await this.listReviewDocuments(reviewDirectoryPath);
    if (reviewFiles.length === 0) {
      return undefined;
    }
    const scoredCandidates = reviewFiles
      .map((candidate) => ({
        candidate,
        score: this.scoreExecutionReviewDocumentCandidate(candidate, execution),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.candidate.updatedAt.localeCompare(left.candidate.updatedAt),
      );
    const [bestCandidate, nextCandidate] = scoredCandidates;
    if (!bestCandidate) {
      return undefined;
    }
    if (nextCandidate && nextCandidate.score === bestCandidate.score) {
      return undefined;
    }
    return bestCandidate.candidate.absolutePath;
  }

  private extractMarkdownSection(content: string, headingText: string): string {
    const normalizedHeadingText = this.normalizeSectionHeading(headingText);
    const headingPattern = /^##\s+([^\n]+)$/gmu;
    const headingMatches = Array.from(content.matchAll(headingPattern));

    for (let index = 0; index < headingMatches.length; index += 1) {
      const headingMatch = headingMatches[index];
      const rawHeadingText = headingMatch[1]?.trim() ?? '';
      const headingIndex = headingMatch.index;
      if (
        typeof headingIndex !== 'number' ||
        this.normalizeSectionHeading(rawHeadingText) !== normalizedHeadingText
      ) {
        continue;
      }

      const sectionStart = headingIndex + headingMatch[0].length;
      const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
      return content.slice(sectionStart, sectionEnd).trim();
    }

    return '';
  }

  private normalizeSectionHeading(headingText: string): string {
    return headingText
      .replace(/^\d+(?:\.\d+)*\.?\s*/u, '')
      .trim()
      .toLowerCase();
  }

  private scoreExecutionReviewDocumentCandidate(
    candidate: LocalOrchestrationServiceReviewDocumentDescriptor,
    execution: OrchestrationExecutionSummary,
  ): number {
    const searchText = [candidate.fileName, candidate.title, candidate.task, candidate.scope]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ');
    let score = 0;

    const matchesTaskId = this.matchesExecutionFact(searchText, execution.taskId);
    if (execution.taskId && !matchesTaskId) {
      return 0;
    }
    if (matchesTaskId) {
      score += 16;
    }
    if (this.matchesExecutionFact(searchText, execution.sprintId)) {
      score += 4;
    }
    if (this.matchesExecutionFact(searchText, execution.projectId)) {
      score += 2;
    }

    return score;
  }

  private matchesExecutionFact(searchText: string, fact: string | undefined): boolean {
    if (!fact) {
      return false;
    }
    return this.normalizeSearchText(searchText).includes(this.normalizeSearchText(fact));
  }

  private normalizeSearchText(value: string): string {
    return value
      .replace(/[^a-z0-9]+/giu, ' ')
      .trim()
      .toLowerCase();
  }

  private readMarkdownHeading(content: string): string | undefined {
    const headingMatch = content.match(/^#\s+(.+)$/mu);
    return headingMatch?.[1]?.trim();
  }

  private readSectionMetadataField(sectionContent: string, fieldName: string): string | undefined {
    const fieldMatch = sectionContent.match(new RegExp(`^- ${fieldName}:\\s*(.+)$`, 'mu'));
    const rawValue = fieldMatch?.[1]?.trim();
    if (!rawValue) {
      return undefined;
    }

    const backtickMatch = rawValue.match(/^`([^`]+)`$/u);
    return backtickMatch?.[1]?.trim() ?? rawValue;
  }

  private readReviewMetadataField(content: string, fieldName: string): string | undefined {
    const fieldMatch = content.match(new RegExp(`^- ${fieldName}:\\s*(.+)$`, 'mu'));
    const rawValue = fieldMatch?.[1]?.trim();
    if (!rawValue) {
      return undefined;
    }

    const backtickMatch = rawValue.match(/^`([^`]+)`$/u);
    return backtickMatch?.[1]?.trim() ?? rawValue;
  }
}
