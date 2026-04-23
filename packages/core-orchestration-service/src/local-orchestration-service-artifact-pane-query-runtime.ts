import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { ArtifactRegistry, SqliteArtifactIndexStore } from '@repo-ai-governor/artifact-registry';
import {
  type OrchestrationArtifactPaneArtifactEntry,
  type OrchestrationArtifactPaneQueryRequest,
  type OrchestrationArtifactPaneQueryResponse,
  type OrchestrationArtifactPaneReviewEntry,
  type OrchestrationArtifactPaneTranscriptEntry,
  type OrchestrationExecutionSummary,
  type OrchestrationListExecutionsRequest,
  type OrchestrationListExecutionsResponse,
  type OrchestrationListSessionsResponse,
  OrchestrationSessionEventType,
  type OrchestrationSessionSummary,
  type OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import { LocalOrchestrationServiceReviewRoutingRuntime } from './local-orchestration-service-review-routing-runtime.js';

interface LocalOrchestrationServiceArtifactPaneQueryRuntimeDependencies {
  workspaceRoot: string;
  getExecution: (executionId: string) => Promise<OrchestrationExecutionSummary | undefined>;
  listExecutions: (
    request?: OrchestrationListExecutionsRequest,
  ) => Promise<OrchestrationListExecutionsResponse>;
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

/**
 * Reads service-owned artifact, review, and transcript slices for desktop artifact-pane consumers.
 *
 * Why this exists:
 * desktop MVP follow-up should consume one orchestration-owned read contract instead of bypassing
 * workspace files directly from the renderer.
 */
export class LocalOrchestrationServiceArtifactPaneQueryRuntime {
  private readonly reviewRoutingRuntime: LocalOrchestrationServiceReviewRoutingRuntime;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceArtifactPaneQueryRuntimeDependencies,
  ) {
    this.reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot: dependencies.workspaceRoot,
    });
  }

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
    const reviewDocumentPath = executionSummary
      ? await this.resolveExecutionReviewDocumentPath(executionSummary)
      : undefined;
    const artifactLimit = this.normalizeLimit(request.artifactLimit, 5);
    const reviewLimit = this.normalizeLimit(request.reviewLimit, 5);
    const transcriptLimit = this.normalizeLimit(request.transcriptLimit, 8);
    const [allArtifacts, allReviews, transcript] = await Promise.all([
      this.readArtifacts(executionSummary?.executionId),
      this.readReviews(reviewSourcePath),
      this.readTranscript(sessionSummary, transcriptLimit),
    ]);
    const artifacts = allArtifacts.slice(0, artifactLimit);
    const executionScopedReviews = this.scopeReviewsToExecution(
      executionSummary,
      allReviews,
      reviewDocumentPath,
    );
    const reviews = executionScopedReviews.slice(0, reviewLimit);

    return {
      artifacts,
      reviews,
      transcript,
      reviewLifecycle: this.buildReviewLifecycleDetail(reviewSourcePath, executionScopedReviews),
      workbench: this.buildWorkbenchDetail(executionSummary, artifacts, reviews, transcript),
      evidenceBacklinks: this.buildEvidenceBacklinks(
        executionSummary,
        artifacts,
        reviews,
        transcript,
      ),
      ...(executionSummary
        ? {
            resolvedExecutionId: executionSummary.executionId,
            policyTrace: this.buildPolicyTraceDetail(executionSummary, reviewDocumentPath),
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

  private async resolveExecutionReviewDocumentPath(
    executionSummary: OrchestrationExecutionSummary,
  ): Promise<string | undefined> {
    const siblingExecutions = await this.listExecutionOwnershipPeers(executionSummary);
    return this.reviewRoutingRuntime.resolveExecutionReviewDocumentPath(executionSummary, {
      siblingExecutions,
    });
  }

  private async listExecutionOwnershipPeers(
    executionSummary: OrchestrationExecutionSummary,
  ): Promise<OrchestrationExecutionSummary[]> {
    const response = await this.dependencies.listExecutions({
      filter: {
        sprintId: executionSummary.sprintId,
        ...(executionSummary.projectId
          ? {
              projectId: executionSummary.projectId,
            }
          : {}),
      },
    });

    return response.executions.filter(
      (candidate) =>
        candidate.sprintId === executionSummary.sprintId &&
        (!executionSummary.projectId || candidate.projectId === executionSummary.projectId),
    );
  }

  private async readArtifacts(
    executionId: string | undefined,
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

    return reviewEntries.sort(
      (left: OrchestrationArtifactPaneReviewEntry, right: OrchestrationArtifactPaneReviewEntry) =>
        right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  private async readTranscript(
    sessionSummary: OrchestrationSessionSummary | undefined,
    limit: number,
  ): Promise<OrchestrationArtifactPaneTranscriptEntry[]> {
    if (!sessionSummary || limit <= 0) {
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
    return this.reviewRoutingRuntime.resolvePrimaryReviewDirectoryPath();
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

  private buildPolicyTraceDetail(
    executionSummary: OrchestrationExecutionSummary,
    reviewDocumentPath: string | undefined,
  ): OrchestrationArtifactPaneQueryResponse['policyTrace'] {
    return {
      executionId: executionSummary.executionId,
      executionStatus: executionSummary.status,
      pendingHitl: executionSummary.pendingHitl,
      recoveryCapable: executionSummary.recoveryCapable,
      ...(executionSummary.currentStageId
        ? {
            currentStageId: executionSummary.currentStageId,
          }
        : {}),
      ...(executionSummary.latestEventType
        ? {
            latestEventType: executionSummary.latestEventType,
          }
        : {}),
      ...(executionSummary.latestArtifactId
        ? {
            latestArtifactId: executionSummary.latestArtifactId,
          }
        : {}),
      ...(executionSummary.latestArtifactPath
        ? {
            latestArtifactPath: executionSummary.latestArtifactPath,
          }
        : {}),
      ...(executionSummary.taskId
        ? {
            taskId: executionSummary.taskId,
          }
        : {}),
      ...(executionSummary.projectId
        ? {
            projectId: executionSummary.projectId,
          }
        : {}),
      ...(executionSummary.sprintId
        ? {
            sprintId: executionSummary.sprintId,
          }
        : {}),
      ...(reviewDocumentPath
        ? {
            reviewDocumentPath,
          }
        : {}),
    };
  }

  private buildReviewLifecycleDetail(
    reviewSourcePath: string | undefined,
    reviews: OrchestrationArtifactPaneReviewEntry[],
  ): OrchestrationArtifactPaneQueryResponse['reviewLifecycle'] {
    const latestReview = reviews[0];
    const pendingReviewCount = reviews.filter(
      (review) => review.lifecycleStatus === 'review_pending',
    ).length;
    const verifiedReviewCount = reviews.filter(
      (review) => review.lifecycleStatus === 'verified',
    ).length;
    const resolvedReviewCount = reviews.filter(
      (review) => review.lifecycleStatus === 'resolved',
    ).length;

    return {
      ...(reviewSourcePath
        ? {
            reviewSourcePath,
          }
        : {}),
      ...(latestReview
        ? {
            latestReviewId: latestReview.reviewId,
            latestLifecycleStatus: latestReview.lifecycleStatus,
            latestReviewFilePath: latestReview.filePath,
          }
        : {}),
      totalReviewCount: reviews.length,
      pendingReviewCount,
      verifiedReviewCount,
      resolvedReviewCount,
      navigationReviewIds: reviews.map((review) => review.reviewId),
    };
  }

  private buildWorkbenchDetail(
    executionSummary: OrchestrationExecutionSummary | undefined,
    artifacts: OrchestrationArtifactPaneArtifactEntry[],
    reviews: OrchestrationArtifactPaneReviewEntry[],
    transcript: OrchestrationArtifactPaneTranscriptEntry[],
  ): OrchestrationArtifactPaneQueryResponse['workbench'] {
    const latestArtifact = artifacts[0];
    const latestReview = reviews[0];
    const latestTranscriptEntry = transcript[transcript.length - 1];

    return {
      artifactCount: artifacts.length,
      reviewCount: reviews.length,
      transcriptCount: transcript.length,
      ...(latestArtifact ||
      executionSummary?.latestArtifactId ||
      executionSummary?.latestArtifactPath
        ? {
            latestArtifactId: latestArtifact?.artifactId ?? executionSummary?.latestArtifactId,
            latestArtifactPath:
              latestArtifact?.artifactPath ?? executionSummary?.latestArtifactPath,
          }
        : {}),
      ...(latestReview
        ? {
            latestReviewId: latestReview.reviewId,
            latestReviewFilePath: latestReview.filePath,
          }
        : {}),
      ...(latestTranscriptEntry
        ? {
            latestTranscriptEntryId: latestTranscriptEntry.entryId,
            latestTranscriptCreatedAt: latestTranscriptEntry.createdAt,
          }
        : {}),
    };
  }

  private buildEvidenceBacklinks(
    executionSummary: OrchestrationExecutionSummary | undefined,
    artifacts: OrchestrationArtifactPaneArtifactEntry[],
    reviews: OrchestrationArtifactPaneReviewEntry[],
    transcript: OrchestrationArtifactPaneTranscriptEntry[],
  ): OrchestrationArtifactPaneQueryResponse['evidenceBacklinks'] {
    return {
      ...(executionSummary?.workspaceRoot || this.dependencies.workspaceRoot
        ? {
            governanceWorkspacePath:
              executionSummary?.workspaceRoot ?? this.dependencies.workspaceRoot,
          }
        : {}),
      artifactPaths: this.deduplicateDefinedStrings(
        artifacts.map((artifact) => artifact.artifactPath),
      ),
      reviewPaths: this.deduplicateDefinedStrings(reviews.map((review) => review.filePath)),
      transcriptEntryIds: this.deduplicateDefinedStrings(transcript.map((entry) => entry.entryId)),
    };
  }

  private deduplicateDefinedStrings(candidates: Array<string | undefined>): string[] {
    return Array.from(
      new Set(
        candidates.filter(
          (candidate): candidate is string =>
            typeof candidate === 'string' && candidate.trim().length > 0,
        ),
      ),
    );
  }

  private scopeReviewsToExecution(
    executionSummary: OrchestrationExecutionSummary | undefined,
    reviews: OrchestrationArtifactPaneReviewEntry[],
    reviewDocumentPath: string | undefined,
  ): OrchestrationArtifactPaneReviewEntry[] {
    if (!executionSummary) {
      return reviews;
    }

    if (!reviewDocumentPath) {
      return [];
    }

    const matchedReview = reviews.find((review) => review.filePath === reviewDocumentPath);
    return matchedReview ? [matchedReview] : [];
  }
}
