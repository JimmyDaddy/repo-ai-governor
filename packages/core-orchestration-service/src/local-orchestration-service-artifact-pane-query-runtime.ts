import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { ArtifactRegistry, SqliteArtifactIndexStore } from '@repo-ai-governor/artifact-registry';
import {
  type OrchestrationArtifactPaneArtifactEntry,
  type OrchestrationArtifactPaneQueryRequest,
  type OrchestrationArtifactPaneQueryResponse,
  type OrchestrationArtifactPaneReviewEntry,
  type OrchestrationArtifactPaneTranscriptEntry,
  type OrchestrationExecutionSummary,
  type OrchestrationListExecutionsResponse,
  type OrchestrationListSessionsResponse,
  OrchestrationSessionEventType,
  type OrchestrationSessionSummary,
  type OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';

interface LocalOrchestrationServiceArtifactPaneQueryRuntimeDependencies {
  workspaceRoot: string;
  getExecution: (executionId: string) => Promise<OrchestrationExecutionSummary | undefined>;
  listExecutions: () => Promise<OrchestrationListExecutionsResponse>;
  getSession: (sessionId: string) => Promise<OrchestrationSessionSummary | undefined>;
  listSessions: () => Promise<OrchestrationListSessionsResponse>;
  subscribeSession: (
    sessionId: string,
    afterSequence: number,
  ) => Promise<OrchestrationSubscribeSessionResponse>;
}

const ARTIFACT_REGISTRY_SQLITE_FILE_SEGMENTS = [
  'context',
  'artifact-registry',
  'sqlite',
  'artifact-registry.sqlite',
] as const;
const CURRENT_CONTEXT_FILE_SEGMENTS = ['context', 'current-context.md'] as const;

/**
 * Reads service-owned artifact, review, and transcript slices for desktop artifact-pane consumers.
 *
 * Why this exists:
 * desktop MVP follow-up should consume one orchestration-owned read contract instead of bypassing
 * workspace files directly from the renderer.
 */
export class LocalOrchestrationServiceArtifactPaneQueryRuntime {
  public constructor(
    private readonly dependencies: LocalOrchestrationServiceArtifactPaneQueryRuntimeDependencies,
  ) {}

  /**
   * Queries one normalized artifact-pane payload from runtime-owned sources.
   * @param request Optional execution/session selectors and slice limits.
   * @returns Artifact, review, and transcript slices plus resolved selectors.
   */
  public async query(
    request: OrchestrationArtifactPaneQueryRequest = {},
  ): Promise<OrchestrationArtifactPaneQueryResponse> {
    const [executionSummary, sessionSummary, reviewSourcePath] = await Promise.all([
      this.resolveExecutionSummary(request.executionId),
      this.resolveSessionSummary(request.sessionId),
      this.resolvePrimaryReviewDirectoryPath(),
    ]);
    const artifactLimit = this.normalizeLimit(request.artifactLimit, 5);
    const reviewLimit = this.normalizeLimit(request.reviewLimit, 5);
    const transcriptLimit = this.normalizeLimit(request.transcriptLimit, 8);
    const [artifacts, reviews, transcript] = await Promise.all([
      this.readArtifacts(executionSummary?.executionId, artifactLimit),
      this.readReviews(reviewSourcePath, reviewLimit),
      this.readTranscript(sessionSummary, transcriptLimit),
    ]);

    return {
      artifacts,
      reviews,
      transcript,
      ...(executionSummary
        ? {
            resolvedExecutionId: executionSummary.executionId,
          }
        : {}),
      ...(sessionSummary
        ? {
            resolvedSessionId: sessionSummary.sessionId,
          }
        : {}),
      ...(reviewSourcePath
        ? {
            reviewSourcePath,
          }
        : {}),
    };
  }

  private async resolveExecutionSummary(
    executionId?: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    if (executionId) {
      return this.dependencies.getExecution(executionId);
    }

    const response = await this.dependencies.listExecutions();
    return response.executions[0];
  }

  private async resolveSessionSummary(
    sessionId?: string,
  ): Promise<OrchestrationSessionSummary | undefined> {
    if (sessionId) {
      return this.dependencies.getSession(sessionId);
    }

    const response = await this.dependencies.listSessions();
    return response.sessions[0];
  }

  private async readArtifacts(
    executionId: string | undefined,
    limit: number,
  ): Promise<OrchestrationArtifactPaneArtifactEntry[]> {
    const databaseFilePath = resolve(
      this.dependencies.workspaceRoot,
      ...ARTIFACT_REGISTRY_SQLITE_FILE_SEGMENTS,
    );
    if (!existsSync(databaseFilePath)) {
      return [];
    }

    const sqliteStore = new SqliteArtifactIndexStore({
      databaseFilePath,
    });

    try {
      const artifactRegistry = new ArtifactRegistry(sqliteStore);
      const records = await artifactRegistry.listArtifacts();
      return records
        .filter((record) => (executionId ? record.producerExecutionId === executionId : true))
        .sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt))
        .slice(0, limit)
        .map((record) => ({
          artifactId: record.artifactId,
          artifactType: record.artifactType,
          artifactPath: record.artifactPath,
          artifactVersion: record.artifactVersion,
          artifactStatus: record.artifactStatus,
          producerTaskId: record.producerTaskId,
          producerExecutionId: record.producerExecutionId,
          registeredAt: record.registeredAt,
          lastUpdatedAt: record.lastUpdatedAt,
        }));
    } finally {
      await sqliteStore.dispose();
    }
  }

  private async readReviews(
    reviewDirectoryPath: string | undefined,
    limit: number,
  ): Promise<OrchestrationArtifactPaneReviewEntry[]> {
    if (!reviewDirectoryPath || !existsSync(reviewDirectoryPath)) {
      return [];
    }

    const directoryEntries = await readdir(reviewDirectoryPath);
    const reviewEntries: OrchestrationArtifactPaneReviewEntry[] = await Promise.all(
      directoryEntries
        .filter((entry) => entry.endsWith('.md'))
        .map(async (entry) => {
          const absolutePath = resolve(reviewDirectoryPath, entry);
          const [content, fileStat] = await Promise.all([
            readFile(absolutePath, 'utf8'),
            stat(absolutePath),
          ]);

          return {
            reviewId: entry,
            title: this.readMarkdownHeading(content) ?? entry,
            lifecycleStatus:
              this.readReviewMetadataField(content, 'Status') ??
              this.inferReviewLifecycleStatus(entry),
            filePath: absolutePath,
            ...(this.readReviewMetadataField(content, 'Scope')
              ? {
                  scope: this.readReviewMetadataField(content, 'Scope'),
                }
              : {}),
            updatedAt: new Date(fileStat.mtimeMs).toISOString(),
          } satisfies OrchestrationArtifactPaneReviewEntry;
        }),
    );

    return reviewEntries
      .sort(
        (left: OrchestrationArtifactPaneReviewEntry, right: OrchestrationArtifactPaneReviewEntry) =>
          right.updatedAt.localeCompare(left.updatedAt),
      )
      .slice(0, limit);
  }

  private async readTranscript(
    sessionSummary: OrchestrationSessionSummary | undefined,
    limit: number,
  ): Promise<OrchestrationArtifactPaneTranscriptEntry[]> {
    if (!sessionSummary) {
      return [];
    }

    const afterSequence = Math.max(sessionSummary.latestEventSequence - Math.max(limit * 4, 20), 0);
    const subscription = await this.dependencies.subscribeSession(
      sessionSummary.sessionId,
      afterSequence,
    );

    return subscription.events
      .map((event) => this.toTranscriptEntry(event))
      .filter((entry): entry is OrchestrationArtifactPaneTranscriptEntry => entry !== null)
      .slice(-limit);
  }

  private toTranscriptEntry(
    event: OrchestrationSubscribeSessionResponse['events'][number],
  ): OrchestrationArtifactPaneTranscriptEntry | null {
    const lines = this.extractTranscriptLines(event);
    const role = this.readOptionalString(event.payload.role);
    if (lines.length === 0 || !role) {
      return null;
    }

    const routeId = this.readOptionalString(event.payload.routeId);
    return {
      entryId: event.eventId,
      sessionId: event.sessionId,
      eventType: event.type,
      role,
      ...(routeId
        ? {
            routeId,
          }
        : {}),
      lines,
      createdAt: event.createdAt,
    };
  }

  private extractTranscriptLines(
    event: OrchestrationSubscribeSessionResponse['events'][number],
  ): string[] {
    if (event.type === OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED) {
      return this.readOptionalStringArray(event.payload.lines);
    }

    if (event.type === OrchestrationSessionEventType.TURN_SUBMITTED) {
      const content = this.readOptionalString(event.payload.content);
      return content ? [content] : [];
    }

    if (event.type === OrchestrationSessionEventType.TURN_COMPLETED) {
      const assistantMessage = this.readOptionalString(event.payload.assistantMessage);
      if (assistantMessage) {
        return [assistantMessage];
      }

      return this.readOptionalStringArray(event.payload.executionDetailsLines);
    }

    if (
      event.type === OrchestrationSessionEventType.TURN_FAILED ||
      event.type === OrchestrationSessionEventType.TURN_CANCELLED
    ) {
      const errorMessage = this.readOptionalString(event.payload.errorMessage);
      return errorMessage ? [errorMessage] : [];
    }

    return [];
  }

  private async resolvePrimaryReviewDirectoryPath(): Promise<string | undefined> {
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

  private normalizeLimit(candidate: number | undefined, defaultLimit: number): number {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
      return defaultLimit;
    }

    return Math.max(Math.trunc(candidate), 0);
  }

  private readReviewMetadataField(content: string, fieldName: string): string | undefined {
    const match = content.match(new RegExp(`^- ${fieldName}: (.+)$`, 'mu'));
    return match?.[1]?.trim();
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

  private readSectionMetadataField(sectionContent: string, fieldName: string): string | undefined {
    const fieldMatch = sectionContent.match(new RegExp(`^- ${fieldName}:\\s*(.+)$`, 'mu'));
    const rawValue = fieldMatch?.[1]?.trim();
    if (!rawValue) {
      return undefined;
    }

    const backtickMatch = rawValue.match(/^`([^`]+)`$/u);
    return backtickMatch?.[1]?.trim() ?? rawValue;
  }

  private inferReviewLifecycleStatus(fileName: string): string {
    if (fileName.startsWith('resolved_') || fileName.startsWith('resolved_code_review_')) {
      return 'resolved';
    }

    if (fileName.startsWith('verified_') || fileName.startsWith('verified_code_review_')) {
      return 'verified';
    }

    return 'review_pending';
  }

  private readMarkdownHeading(content: string): string | undefined {
    const match = content.match(/^#\s+(.+)$/mu);
    return match?.[1]?.trim();
  }

  private readOptionalString(candidate: unknown): string | undefined {
    return typeof candidate === 'string' && candidate.trim().length > 0
      ? candidate.trim()
      : undefined;
  }

  private readOptionalStringArray(candidate: unknown): string[] {
    if (!Array.isArray(candidate)) {
      return [];
    }

    return candidate
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
