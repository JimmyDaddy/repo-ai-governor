import { randomUUID } from 'node:crypto';

import { MemoryManager } from '@repo-ai-governor/core-memory';
import {
  type AppendSessionEventOptions,
  SessionStatus,
  type SharedSession,
  SharedSessionManager,
} from '@repo-ai-governor/core-session';
import {
  type MemoryProviderCompositionSummary,
  MemoryProviderHostSurface,
  MemoryProviderRegistry,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from '@repo-ai-governor/memory-store-adapter';
import {
  ORCHESTRATION_SESSION_DISPLAY_USER_MESSAGE_METADATA_KEY,
  type OrchestrationAppendSessionMessageRequest,
  type OrchestrationAppendSessionMessageResponse,
  type OrchestrationArchiveSessionRequest,
  type OrchestrationArchiveSessionResponse,
  type OrchestrationExecutionLivenessSnapshot,
  type OrchestrationForkSessionRequest,
  type OrchestrationForkSessionResponse,
  type OrchestrationListSessionsFilter,
  type OrchestrationListSessionsRequest,
  type OrchestrationListSessionsResponse,
  type OrchestrationResumeSessionRequest,
  type OrchestrationResumeSessionResponse,
  type OrchestrationSendSessionTurnRequest,
  type OrchestrationSendSessionTurnResponse,
  OrchestrationServiceEventType,
  type OrchestrationServiceHostKind,
  type OrchestrationServiceTransportKind,
  type OrchestrationSessionEvent,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionStatus,
  type OrchestrationSessionSummary,
  OrchestrationSessionTranscriptRole,
  type OrchestrationStartSessionRequest,
  type OrchestrationStartSessionResponse,
  type OrchestrationSubscribeSessionRequest,
  type OrchestrationSubscribeSessionResponse,
  type OrchestrationUnarchiveSessionRequest,
  type OrchestrationUnarchiveSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import {
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  GovernorErrorCode,
  type MemoryRuntimeConfig,
  RuntimeError,
  type StandardizedError,
  standardizeError,
} from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceSessionMainAgentDispatcher } from './local-orchestration-service-session-main-agent-dispatcher.js';
import { ProviderContinuationSessionRuntime } from './provider-continuation-session-runtime.js';
import type {
  LocalOrchestrationServicePublishEventRequest,
  SessionMainSupervisorRuntimeContract,
  SessionMainSupervisorStreamEvent,
} from './types/index.js';

interface LocalOrchestrationServiceSessionMemoryProviderState {
  composition: MemoryProviderCompositionSummary;
  provider: MemoryStoreProvider;
}

interface LocalOrchestrationServiceSessionRuntimeDependencies {
  workspaceRoot: string;
  serviceHostKind?: OrchestrationServiceHostKind;
  serviceTransportKind?: OrchestrationServiceTransportKind;
  memoryConfig?: MemoryRuntimeConfig;
  memoryProviderRegistry?: MemoryProviderRegistry;
  memoryProviderRuntimeMode?: MemoryProviderRuntimeMode;
  sessionMainSupervisorRuntime?: SessionMainSupervisorRuntimeContract;
  publishExecutionEvent?: (request: LocalOrchestrationServicePublishEventRequest) => Promise<void>;
  nowProvider?: () => Date;
}

const SESSION_CONTEXT_CURRENT_ROUTE_KEY = 'currentRouteId';
const SESSION_CONTEXT_LATEST_TURN_ID_KEY = 'latestTurnId';
const SESSION_CONTEXT_LATEST_TURN_AT_KEY = 'latestTurnAt';
const SESSION_CONTEXT_SOURCE_KIND_KEY = 'sourceKind';
const SESSION_CONTEXT_SOURCE_SESSION_ID_KEY = 'sourceSessionId';
const SESSION_CONTEXT_FORK_FROM_TURN_ID_KEY = 'forkFromTurnId';
const SESSION_CONTEXT_DISPLAY_NAME_KEY = 'displayName';
const SESSION_CONTEXT_PREVIEW_SUMMARY_KEY = 'previewSummary';
const SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY = 'latestNoteSummary';
const SESSION_CONTEXT_ARCHIVED_AT_KEY = 'archivedAt';
const SESSION_CONTEXT_ARCHIVE_REASON_SUMMARY_KEY = 'archiveReasonSummary';
const SESSION_CURSOR_VERSION = 1;

/**
 * Owns service-backed session lifecycle, transcript events, and resume semantics.
 *
 * Why this exists:
 * CLI should keep only presenter state while canonical session continuity lives behind the
 * local orchestration service so future desktop surfaces can reuse the same DTO contract.
 */
export class LocalOrchestrationServiceSessionRuntime {
  private readonly nowProvider: () => Date;
  private readonly memoryProviderRegistry: MemoryProviderRegistry;
  private readonly mainAgentDispatcher: LocalOrchestrationServiceSessionMainAgentDispatcher;
  private readonly providerContinuationSessionRuntime = new ProviderContinuationSessionRuntime();
  private memoryProviderStatePromise: Promise<LocalOrchestrationServiceSessionMemoryProviderState> | null =
    null;
  private sharedSessionManagerPromise: Promise<SharedSessionManager> | null = null;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceSessionRuntimeDependencies,
  ) {
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
    this.memoryProviderRegistry =
      dependencies.memoryProviderRegistry ?? new MemoryProviderRegistry();
    this.mainAgentDispatcher = new LocalOrchestrationServiceSessionMainAgentDispatcher(
      dependencies.sessionMainSupervisorRuntime,
    );
  }

  /**
   * Opens or reuses one canonical session owned by the orchestration service.
   * @param request Session-open request.
   * @returns Session summary plus the initial stream cursor.
   */
  public async startSession(
    request: OrchestrationStartSessionRequest,
  ): Promise<OrchestrationStartSessionResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const currentRouteId = request.routeId ?? OrchestrationSessionRouteId.MAIN;
    const existingSession = request.sessionId
      ? await this.getSharedSessionIfExists(sessionManager, request.sessionId)
      : undefined;
    const session = await sessionManager.openSession({
      ...(request.sessionId ? { sessionId: request.sessionId } : {}),
      ...(request.processId ? { processId: request.processId } : {}),
      ...(request.executionId ? { executionId: request.executionId } : {}),
      initialContext: {
        ...(request.initialContext ?? {}),
        [SESSION_CONTEXT_CURRENT_ROUTE_KEY]: currentRouteId,
        [SESSION_CONTEXT_SOURCE_KIND_KEY]:
          (request.initialContext?.[SESSION_CONTEXT_SOURCE_KIND_KEY] as string | undefined) ??
          'new',
      },
      openedAt: this.toTimestamp(),
    });

    if (!existingSession) {
      await sessionManager.appendEvent({
        sessionId: session.sessionId,
        type: OrchestrationSessionEventType.SESSION_STARTED,
        createdAt: this.toTimestamp(),
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          routeId: currentRouteId,
        },
      });
    }

    const refreshedSession = await sessionManager.getSession(session.sessionId);
    const summary = this.toSessionSummary(refreshedSession);
    return {
      created: !existingSession,
      session: summary,
      latestEventSequence: summary.latestEventSequence,
      nextCursor: summary.nextCursor,
    };
  }

  /**
   * Appends one `session.main` user turn and resolves it through the service-owned main agent.
   * @param request Session-turn request.
   * @returns Updated session summary plus stream cursor after the turn completes.
   */
  public async sendSessionTurn(
    request: OrchestrationSendSessionTurnRequest,
  ): Promise<OrchestrationSendSessionTurnResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const currentRouteId = request.routeId ?? OrchestrationSessionRouteId.MAIN;
    this.assertSupportedRouteId(currentRouteId);

    const existingSession = await sessionManager.getSession(request.sessionId);
    const linkedExecutionId = existingSession.executionId ?? null;
    const acceptedAt = this.toTimestamp();
    const turnId = request.turnId ?? `turn-${randomUUID().replace(/-/gu, '')}`;
    const turnIndex = this.resolveNextTurnIndex(existingSession);
    const turnStartedAtMs = this.currentTimeMs();
    const displayUserMessage =
      this.readOptionalMetadataString(
        request.metadata,
        ORCHESTRATION_SESSION_DISPLAY_USER_MESSAGE_METADATA_KEY,
      ) ?? request.userMessage;
    const sessionProjectionContextPatch: Record<string, unknown> = {
      [SESSION_CONTEXT_CURRENT_ROUTE_KEY]: currentRouteId,
      [SESSION_CONTEXT_LATEST_TURN_ID_KEY]: turnId,
      [SESSION_CONTEXT_LATEST_TURN_AT_KEY]: acceptedAt,
    };
    const sessionPersistenceMetrics = {
      totalElapsedMs: 0,
      writeCount: 0,
    };
    const executionLivenessRelayState = {
      latestFingerprint: null as string | null,
      partialSnapshotPersisted: false,
    };
    const appendSessionEvent = async (
      options: AppendSessionEventOptions,
    ): Promise<SharedSession> => {
      const persistStartedAtMs = this.currentTimeMs();
      const updatedSession = await sessionManager.appendEvent(options);
      sessionPersistenceMetrics.totalElapsedMs += Math.max(
        this.currentTimeMs() - persistStartedAtMs,
        0,
      );
      sessionPersistenceMetrics.writeCount += 1;
      return updatedSession;
    };
    const updateSessionContext = async (
      contextPatch: Record<string, unknown>,
    ): Promise<SharedSession> => {
      const persistStartedAtMs = this.currentTimeMs();
      const updatedSession = await sessionManager.updateContext({
        sessionId: request.sessionId,
        contextPatch,
      });
      sessionPersistenceMetrics.totalElapsedMs += Math.max(
        this.currentTimeMs() - persistStartedAtMs,
        0,
      );
      sessionPersistenceMetrics.writeCount += 1;
      return updatedSession;
    };
    const updateSessionContextWithLatest = async (
      contextPatchBuilder: (
        currentContext: Record<string, unknown>,
      ) => Record<string, unknown> | null,
    ): Promise<SharedSession> => {
      const persistStartedAtMs = this.currentTimeMs();
      const updatedSession = await sessionManager.updateContextWithLatest({
        sessionId: request.sessionId,
        contextPatchBuilder,
      });
      sessionPersistenceMetrics.totalElapsedMs += Math.max(
        this.currentTimeMs() - persistStartedAtMs,
        0,
      );
      sessionPersistenceMetrics.writeCount += 1;
      return updatedSession;
    };
    let emittedStreamDeltaCount = 0;
    await appendSessionEvent({
      sessionId: request.sessionId,
      type: OrchestrationSessionEventType.TURN_SUBMITTED,
      createdAt: acceptedAt,
        payload: {
          role: OrchestrationSessionTranscriptRole.USER,
          routeId: currentRouteId,
          turnId,
          turnIndex,
          content: displayUserMessage,
          ...(request.metadata ? { metadata: { ...request.metadata } } : {}),
        },
      });
    try {
      const dispatchStartedAtMs = this.currentTimeMs();
      const dispatchResult = await this.mainAgentDispatcher.dispatch({
        sessionId: request.sessionId,
        routeId: currentRouteId,
        turnId,
        turnIndex,
        userMessage: request.userMessage,
        locale: this.readOptionalMetadataString(request.metadata, 'locale'),
        metadata: request.metadata,
        selectedSurface: '',
        selectedBy: '',
        sessionRoutingPreferenceApplied: false,
        previewSummary: this.readOptionalContextString(
          existingSession.context,
          SESSION_CONTEXT_PREVIEW_SUMMARY_KEY,
        ),
        latestNoteSummary: this.readOptionalContextString(
          existingSession.context,
          SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY,
        ),
        providerContinuationState: this.providerContinuationSessionRuntime.readSessionState(
          existingSession.context,
        ),
        publishStreamEvent: async (streamEvent) => {
          emittedStreamDeltaCount += 1;
          await appendSessionEvent({
            sessionId: request.sessionId,
            type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
            createdAt: this.toTimestamp(),
            payload: this.createTurnStreamDeltaPayload({
              routeId: currentRouteId,
              turnId,
              streamEvent,
            }),
          });
          await this.publishExecutionLivenessEvent({
            executionId: linkedExecutionId,
            routeId: currentRouteId,
            turnId,
            streamEvent,
            relayState: executionLivenessRelayState,
          });
        },
      });
      if (emittedStreamDeltaCount === 0) {
        await appendSessionEvent({
          sessionId: request.sessionId,
          type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
          createdAt: this.toTimestamp(),
          payload: {
            role: OrchestrationSessionTranscriptRole.ASSISTANT,
            routeId: currentRouteId,
            turnId,
            delta: dispatchResult.assistantDelta,
          },
        });
        emittedStreamDeltaCount += 1;
      }
      if (
        dispatchResult.providerContinuationMutations &&
        dispatchResult.providerContinuationMutations.length > 0
      ) {
        await updateSessionContextWithLatest((currentContext) =>
          this.providerContinuationSessionRuntime.createContextPatch(
            currentContext,
            dispatchResult.providerContinuationMutations,
          ),
        );
      }
      const runtimePerformanceDetailLines = this.buildRuntimePerformanceDetailLines({
        dispatchElapsedMs: Math.max(this.currentTimeMs() - dispatchStartedAtMs, 0),
        persistenceElapsedMs: sessionPersistenceMetrics.totalElapsedMs,
        persistenceWriteCount: sessionPersistenceMetrics.writeCount,
        streamDeltaCount: emittedStreamDeltaCount,
        turnElapsedMs: Math.max(this.currentTimeMs() - turnStartedAtMs, 0),
      });
      await appendSessionEvent({
        sessionId: request.sessionId,
        type: OrchestrationSessionEventType.TURN_COMPLETED,
        createdAt: this.toTimestamp(),
        payload: {
          role: OrchestrationSessionTranscriptRole.ASSISTANT,
          routeId: currentRouteId,
          turnId,
          turnIndex,
          responseMode: dispatchResult.responseMode,
          latestUserMessage: displayUserMessage,
          ...(dispatchResult.assistantMessage
            ? { assistantMessage: dispatchResult.assistantMessage }
            : {}),
          ...(dispatchResult.executionDetailsLines
            ? {
                executionDetailsLines: this.mergeExecutionDetailsLines(
                  dispatchResult.executionDetailsLines,
                  runtimePerformanceDetailLines,
                ),
              }
            : {}),
          ...(!dispatchResult.executionDetailsLines && runtimePerformanceDetailLines.length > 0
            ? {
                executionDetailsLines: [...runtimePerformanceDetailLines],
              }
            : {}),
          ...(dispatchResult.routerDecisionReason
            ? { routerDecisionReason: dispatchResult.routerDecisionReason }
            : {}),
          ...(dispatchResult.synthesisMode ? { synthesisMode: dispatchResult.synthesisMode } : {}),
          ...(dispatchResult.suggestedSlashCommand
            ? { suggestedSlashCommand: dispatchResult.suggestedSlashCommand }
            : {}),
          ...(dispatchResult.executionIntent
            ? { executionIntent: dispatchResult.executionIntent }
            : {}),
          ...(dispatchResult.followUpQuestion
            ? { followUpQuestion: dispatchResult.followUpQuestion }
            : {}),
          ...(dispatchResult.capabilityAnswerKind
            ? { capabilityAnswerKind: dispatchResult.capabilityAnswerKind }
            : {}),
          ...(dispatchResult.referencedCapabilityIds
            ? {
                referencedCapabilityIds: [...dispatchResult.referencedCapabilityIds],
              }
            : {}),
          ...(dispatchResult.suggestedActions
            ? {
                suggestedActions: dispatchResult.suggestedActions.map((suggestedAction) => ({
                  ...suggestedAction,
                })),
              }
            : {}),
          requiresConfirmation: dispatchResult.requiresConfirmation,
          selectedSurface: dispatchResult.selectedSurface,
          selectedBy: dispatchResult.selectedBy,
          sessionRoutingPreferenceApplied: dispatchResult.sessionRoutingPreferenceApplied,
          interactionMode: dispatchResult.interactionMode,
          ...(dispatchResult.skillId ? { skillId: dispatchResult.skillId } : {}),
          ...(dispatchResult.skillVersion ? { skillVersion: dispatchResult.skillVersion } : {}),
          ...(dispatchResult.handoffExecutionMode
            ? { handoffExecutionMode: dispatchResult.handoffExecutionMode }
            : {}),
          ...(dispatchResult.invokedRoleIds
            ? {
                invokedRoleIds: [...dispatchResult.invokedRoleIds],
              }
            : {}),
          ...(dispatchResult.invokedRoles
            ? {
                invokedRoles: dispatchResult.invokedRoles.map((invokedRole) => ({
                  ...invokedRole,
                })),
              }
            : {}),
          subagentCount:
            typeof dispatchResult.subagentCount === 'number'
              ? dispatchResult.subagentCount
              : (dispatchResult.invokedRoleIds?.length ?? 0),
          ...(dispatchResult.handoffCommandPreview
            ? { handoffCommandPreview: dispatchResult.handoffCommandPreview }
            : {}),
          ...(dispatchResult.commandBatches
            ? {
                commandBatches: dispatchResult.commandBatches.map((commandBatch) => ({
                  slashQuery: commandBatch.slashQuery,
                  bridgeArgv: [...commandBatch.bridgeArgv],
                  previewCommandLine: commandBatch.previewCommandLine,
                })),
              }
            : {}),
          ...(dispatchResult.handoffBacklinks
            ? {
                handoffBacklinks: dispatchResult.handoffBacklinks.map((backlink) => ({
                  ...backlink,
                })),
              }
            : {}),
          ...(dispatchResult.providerContinuationSummaries
            ? {
                providerContinuationSummaries: dispatchResult.providerContinuationSummaries.map(
                  (summary) => ({
                    ...summary,
                  }),
                ),
              }
            : {}),
        },
      });
      sessionProjectionContextPatch[SESSION_CONTEXT_PREVIEW_SUMMARY_KEY] =
        this.buildSessionPreviewSummary({
          latestUserMessage: displayUserMessage,
          assistantMessage: dispatchResult.assistantMessage,
          followUpQuestion: dispatchResult.followUpQuestion,
          suggestedSlashCommand: dispatchResult.suggestedSlashCommand,
        });
      sessionProjectionContextPatch[SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY] =
        this.buildTurnNoteSummary({
          latestUserMessage: displayUserMessage,
          assistantMessage: dispatchResult.assistantMessage,
          followUpQuestion: dispatchResult.followUpQuestion,
          suggestedSlashCommand: dispatchResult.suggestedSlashCommand,
          responseMode: dispatchResult.responseMode,
          selectedSurface: dispatchResult.selectedSurface,
        });
    } catch (error) {
      const standardizedError = standardizeError(error);
      const formattedFailure = this.formatTurnFailure(error, standardizedError);
      const runtimePerformanceDetailLines = this.buildRuntimePerformanceDetailLines({
        dispatchElapsedMs: Math.max(this.currentTimeMs() - turnStartedAtMs, 0),
        persistenceElapsedMs: sessionPersistenceMetrics.totalElapsedMs,
        persistenceWriteCount: sessionPersistenceMetrics.writeCount,
        streamDeltaCount: emittedStreamDeltaCount,
        turnElapsedMs: Math.max(this.currentTimeMs() - turnStartedAtMs, 0),
      });
      const failureEventType =
        standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED
          ? OrchestrationSessionEventType.TURN_CANCELLED
          : OrchestrationSessionEventType.TURN_FAILED;
      await appendSessionEvent({
        sessionId: request.sessionId,
        type: failureEventType,
        createdAt: this.toTimestamp(),
        payload: {
          role: OrchestrationSessionTranscriptRole.SYSTEM,
          routeId: currentRouteId,
          turnId,
          turnIndex,
          errorCode: standardizedError.code,
          errorMessage: formattedFailure.message,
          ...(formattedFailure.detail ? { errorDetail: formattedFailure.detail } : {}),
          ...(runtimePerformanceDetailLines.length > 0
            ? { executionDetailsLines: [...runtimePerformanceDetailLines] }
            : {}),
        },
      });
      sessionProjectionContextPatch[SESSION_CONTEXT_PREVIEW_SUMMARY_KEY] =
        this.toSingleLineSummary(displayUserMessage);
      sessionProjectionContextPatch[SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY] = [
        `goal=${this.toSingleLineSummary(displayUserMessage)}`,
        `last_status=failed:${this.toSingleLineSummary(formattedFailure.message)}`,
      ].join(' | ');
    }
    await updateSessionContext({
      ...sessionProjectionContextPatch,
    });

    const refreshedSession = await sessionManager.getSession(request.sessionId);
    const summary = this.toSessionSummary(refreshedSession);
    return {
      session: summary,
      turnId,
      routeId: currentRouteId,
      acceptedAt,
      latestEventSequence: summary.latestEventSequence,
      nextCursor: summary.nextCursor,
    };
  }

  /**
   * Appends one service-owned transcript item that is not represented as a user turn.
   * @param request Session transcript append request.
   * @returns Updated session summary plus the appended event.
   */
  public async appendSessionMessage(
    request: OrchestrationAppendSessionMessageRequest,
  ): Promise<OrchestrationAppendSessionMessageResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    await sessionManager.getSession(request.sessionId);
    const createdAt = this.toTimestamp();
    const normalizedLines = request.lines
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);
    if (normalizedLines.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        'Appended session message requires at least one non-empty line.',
        {
          sessionId: request.sessionId,
        },
      );
    }

    const role = this.assertSupportedTranscriptRole(request.role);
    const routeId = request.routeId ?? OrchestrationSessionRouteId.MAIN;
    this.assertSupportedRouteId(routeId);
    await sessionManager.appendEvent({
      sessionId: request.sessionId,
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      createdAt,
      payload: {
        role,
        routeId,
        lines: normalizedLines,
        ...(request.metadata ? { metadata: { ...request.metadata } } : {}),
      },
    });
    const noteContextPatch = this.buildAppendedMessageContextPatch(
      normalizedLines,
      request.metadata,
    );
    if (Object.keys(noteContextPatch).length > 0) {
      await sessionManager.updateContext({
        sessionId: request.sessionId,
        contextPatch: noteContextPatch,
      });
    }

    const refreshedSession = await sessionManager.getSession(request.sessionId);
    const summary = this.toSessionSummary(refreshedSession);
    const event = this.toSessionEvents(refreshedSession).at(-1);
    if (!event) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        'Appended session message event was not persisted.',
        {
          sessionId: request.sessionId,
        },
      );
    }

    return {
      session: summary,
      latestEventSequence: summary.latestEventSequence,
      nextCursor: summary.nextCursor,
      event,
    };
  }

  /**
   * Reads one persisted session summary by id.
   * @param sessionId Session identifier.
   * @returns Session summary when present, otherwise `undefined`.
   */
  public async getSession(sessionId: string): Promise<OrchestrationSessionSummary | undefined> {
    const sessionManager = await this.resolveSharedSessionManager();
    const session = await this.getSharedSessionIfExists(sessionManager, sessionId);
    return session ? this.toSessionSummary(session) : undefined;
  }

  /**
   * Lists sessions with stable sorting and optional filters shared by CLI and desktop.
   * @param request Session-list query.
   * @returns Filtered session summaries.
   */
  public async listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const matchedSessions = (await sessionManager.listSessions())
      .filter((session) => this.matchesSessionFilter(session, request?.filter))
      .sort((left, right) =>
        this.resolveSessionSortTimestamp(right).localeCompare(
          this.resolveSessionSortTimestamp(left),
        ),
      )
      .map((session) => this.toSessionSummary(session));
    const sessions =
      typeof request?.limit === 'number'
        ? matchedSessions.slice(0, Math.max(request.limit, 0))
        : matchedSessions;

    return {
      sessions,
      returnedCount: sessions.length,
      totalMatchedCount: matchedSessions.length,
    };
  }

  /**
   * Returns incremental transcript events after the supplied session cursor or sequence.
   * @param request Session-subscription request.
   * @returns Delta events plus the resolved next cursor.
   */
  public async subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const session = await sessionManager.getSession(request.sessionId);
    const parsedCursor = request.cursor ? this.parseSessionCursor(request.cursor) : undefined;
    if (parsedCursor && parsedCursor.sessionId !== request.sessionId) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        'Session cursor does not match the requested session identifier.',
        {
          sessionId: request.sessionId,
          cursor: request.cursor,
          cursorSessionId: parsedCursor.sessionId,
        },
      );
    }

    const afterSequence = request.afterSequence ?? parsedCursor?.sequence;
    const allEvents = this.toSessionEvents(session);
    const filteredEvents = allEvents.filter((event) =>
      afterSequence === undefined ? true : event.sequence > afterSequence,
    );
    const events =
      typeof request.limit === 'number'
        ? filteredEvents.slice(0, Math.max(request.limit, 0))
        : filteredEvents;
    const nextCursorSequence = events.at(-1)?.sequence ?? afterSequence ?? 0;
    const summary = this.toSessionSummary(session);

    return {
      session: summary,
      latestEventSequence: summary.latestEventSequence,
      nextCursor: this.createSessionCursor(request.sessionId, nextCursorSequence),
      events,
    };
  }

  /**
   * Resolves the latest or explicitly requested session and appends a resume marker event.
   * @param request Resume request.
   * @returns Resolved session summary plus the selector used for the resume action.
   */
  public async resumeSession(
    request?: OrchestrationResumeSessionRequest,
  ): Promise<OrchestrationResumeSessionResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const resumeSelector = request?.sessionId ?? 'latest';
    const session = request?.sessionId
      ? await this.getSharedSessionIfExists(sessionManager, request.sessionId)
      : await this.resolveLatestSession(sessionManager);
    if (!session) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        'No resumable orchestration session was found.',
        {
          resumeSelector,
          preferLatest: request?.preferLatest ?? true,
        },
      );
    }
    this.assertSessionResumable(session, resumeSelector);

    await sessionManager.appendEvent({
      sessionId: session.sessionId,
      type: OrchestrationSessionEventType.SESSION_RESUMED,
      createdAt: this.toTimestamp(),
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: this.readCurrentRouteId(session.context),
        resumeSelector,
      },
    });

    const refreshedSession = await sessionManager.getSession(session.sessionId);
    const summary = this.toSessionSummary(refreshedSession);
    return {
      session: summary,
      resumeSelector,
      latestEventSequence: summary.latestEventSequence,
      nextCursor: summary.nextCursor,
    };
  }

  /**
   * Creates one new active branch session using an existing session as the source pointer.
   * @param request Fork request.
   * @returns Forked session summary and receipt cursor.
   */
  public async forkSession(
    request: OrchestrationForkSessionRequest,
  ): Promise<OrchestrationForkSessionResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const sourceSession = await sessionManager.getSession(request.sourceSessionId);
    const currentRouteId = this.readCurrentRouteId(sourceSession.context);
    const forkedFromTurnId =
      request.forkFromTurnId ??
      this.readOptionalContextString(sourceSession.context, SESSION_CONTEXT_LATEST_TURN_ID_KEY);
    const forkedSession = await sessionManager.openSession({
      initialContext: {
        [SESSION_CONTEXT_CURRENT_ROUTE_KEY]: currentRouteId,
        [SESSION_CONTEXT_SOURCE_KIND_KEY]: 'forked',
        [SESSION_CONTEXT_SOURCE_SESSION_ID_KEY]: sourceSession.sessionId,
        ...(forkedFromTurnId
          ? {
              [SESSION_CONTEXT_FORK_FROM_TURN_ID_KEY]: forkedFromTurnId,
            }
          : {}),
        ...(request.displayName
          ? {
              [SESSION_CONTEXT_DISPLAY_NAME_KEY]: request.displayName,
            }
          : {}),
        ...(this.readOptionalContextString(
          sourceSession.context,
          SESSION_CONTEXT_PREVIEW_SUMMARY_KEY,
        )
          ? {
              [SESSION_CONTEXT_PREVIEW_SUMMARY_KEY]: this.readOptionalContextString(
                sourceSession.context,
                SESSION_CONTEXT_PREVIEW_SUMMARY_KEY,
              ),
            }
          : {}),
        ...(this.readOptionalContextString(
          sourceSession.context,
          SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY,
        )
          ? {
              [SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY]: this.readOptionalContextString(
                sourceSession.context,
                SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY,
              ),
            }
          : {}),
      },
      openedAt: this.toTimestamp(),
    });
    await sessionManager.appendEvent({
      sessionId: forkedSession.sessionId,
      type: OrchestrationSessionEventType.SESSION_STARTED,
      createdAt: this.toTimestamp(),
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: currentRouteId,
      },
    });
    await sessionManager.appendEvent({
      sessionId: forkedSession.sessionId,
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      createdAt: this.toTimestamp(),
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: currentRouteId,
        lines: [
          `Forked from session ${sourceSession.sessionId}.`,
          ...(forkedFromTurnId ? [`Fork anchor turn=${forkedFromTurnId}.`] : []),
        ],
        metadata: {
          renderKind: 'system_notice',
        },
      },
    });

    const refreshedSession = await sessionManager.getSession(forkedSession.sessionId);
    const summary = this.toSessionSummary(refreshedSession);
    return {
      session: summary,
      sourceSessionId: sourceSession.sessionId,
      ...(forkedFromTurnId ? { forkedFromTurnId } : {}),
      latestEventSequence: summary.latestEventSequence,
      nextCursor: summary.nextCursor,
    };
  }

  /**
   * Archives one active session so default resume flows only target active sessions.
   * @param request Archive request.
   * @returns Archive receipt summary.
   */
  public async archiveSession(
    request: OrchestrationArchiveSessionRequest,
  ): Promise<OrchestrationArchiveSessionResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const session = await sessionManager.getSession(request.sessionId);
    if (session.status !== SessionStatus.ACTIVE) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_ALREADY_CLOSED,
        'Only active sessions can be archived.',
        {
          sessionId: request.sessionId,
          status: session.status,
        },
      );
    }

    const archivedAt = this.toTimestamp();
    await sessionManager.appendEvent({
      sessionId: request.sessionId,
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      createdAt: archivedAt,
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: this.readCurrentRouteId(session.context),
        lines: [
          `Archived session ${request.sessionId}.`,
          ...(request.archiveReasonSummary ? [request.archiveReasonSummary] : []),
        ],
        metadata: {
          renderKind: 'system_notice',
        },
      },
    });
    await sessionManager.transitionSessionStatus({
      sessionId: request.sessionId,
      status: SessionStatus.ARCHIVED,
      closedAt: archivedAt,
      contextPatch: {
        [SESSION_CONTEXT_ARCHIVED_AT_KEY]: archivedAt,
        ...(request.archiveReasonSummary
          ? {
              [SESSION_CONTEXT_ARCHIVE_REASON_SUMMARY_KEY]: request.archiveReasonSummary,
            }
          : {}),
      },
    });

    const refreshedSession = await sessionManager.getSession(request.sessionId);
    const summary = this.toSessionSummary(refreshedSession);
    return {
      session: summary,
      archivedAt,
      ...(request.archiveReasonSummary
        ? {
            archiveReasonSummary: request.archiveReasonSummary,
          }
        : {}),
      latestEventSequence: summary.latestEventSequence,
      nextCursor: summary.nextCursor,
    };
  }

  /**
   * Restores one archived session to active status so it can be resumed again.
   * @param request Unarchive request.
   * @returns Unarchive receipt summary.
   */
  public async unarchiveSession(
    request: OrchestrationUnarchiveSessionRequest,
  ): Promise<OrchestrationUnarchiveSessionResponse> {
    const sessionManager = await this.resolveSharedSessionManager();
    const session = await sessionManager.getSession(request.sessionId);
    if (session.status !== SessionStatus.ARCHIVED) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_INVALID_STATUS,
        'Only archived sessions can be restored.',
        {
          sessionId: request.sessionId,
          status: session.status,
        },
      );
    }

    await sessionManager.transitionSessionStatus({
      sessionId: request.sessionId,
      status: SessionStatus.ACTIVE,
      contextKeysToDelete: [
        SESSION_CONTEXT_ARCHIVED_AT_KEY,
        SESSION_CONTEXT_ARCHIVE_REASON_SUMMARY_KEY,
      ],
    });
    await sessionManager.appendEvent({
      sessionId: request.sessionId,
      type: OrchestrationSessionEventType.SESSION_MESSAGE_APPENDED,
      createdAt: this.toTimestamp(),
      payload: {
        role: OrchestrationSessionTranscriptRole.SYSTEM,
        routeId: this.readCurrentRouteId(session.context),
        lines: [`Restored archived session ${request.sessionId} to active status.`],
        metadata: {
          renderKind: 'system_notice',
        },
      },
    });

    const refreshedSession = await sessionManager.getSession(request.sessionId);
    const summary = this.toSessionSummary(refreshedSession);
    return {
      session: summary,
      latestEventSequence: summary.latestEventSequence,
      nextCursor: summary.nextCursor,
    };
  }

  private async resolveSharedSessionManager(): Promise<SharedSessionManager> {
    if (!this.sharedSessionManagerPromise) {
      this.sharedSessionManagerPromise = (async () => {
        const memoryProviderState = await this.resolveMemoryProviderState();
        return new SharedSessionManager(
          new MemoryManager(new MemoryStoreAdapter(memoryProviderState.provider)),
        );
      })().catch((error) => {
        this.sharedSessionManagerPromise = null;
        throw error;
      });
    }

    return this.sharedSessionManagerPromise;
  }

  private async resolveMemoryProviderState(): Promise<LocalOrchestrationServiceSessionMemoryProviderState> {
    if (!this.memoryProviderStatePromise) {
      this.memoryProviderStatePromise = (async () => {
        const composition = await this.memoryProviderRegistry.loadProvider({
          workspaceRoot: this.dependencies.workspaceRoot,
          memoryConfig: this.dependencies.memoryConfig ?? DEFAULT_MEMORY_RUNTIME_CONFIG,
          hostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
          runtimeMode:
            this.dependencies.memoryProviderRuntimeMode ?? MemoryProviderRuntimeMode.DAEMON,
        });
        return {
          composition: {
            ...composition.summary,
          },
          provider: composition.provider,
        };
      })().catch((error) => {
        this.memoryProviderStatePromise = null;
        throw error;
      });
    }

    return this.memoryProviderStatePromise;
  }

  private async getSharedSessionIfExists(
    sessionManager: SharedSessionManager,
    sessionId: string,
  ): Promise<SharedSession | undefined> {
    try {
      return await sessionManager.getSession(sessionId);
    } catch (error) {
      const standardizedError = standardizeError(error);
      if (standardizedError.code === GovernorErrorCode.MEMORY_SESSION_NOT_FOUND) {
        return undefined;
      }
      throw error;
    }
  }

  private async resolveLatestSession(
    sessionManager: SharedSessionManager,
  ): Promise<SharedSession | undefined> {
    const sessions = await sessionManager.listSessions({
      status: SessionStatus.ACTIVE,
    });
    return [...sessions].sort((left, right) =>
      this.resolveSessionSortTimestamp(right).localeCompare(this.resolveSessionSortTimestamp(left)),
    )[0];
  }

  private matchesSessionFilter(
    session: SharedSession,
    filter?: OrchestrationListSessionsFilter,
  ): boolean {
    if (!filter) {
      return true;
    }

    if (filter.status && this.mapSessionStatus(session.status) !== filter.status) {
      return false;
    }
    if (filter.executionId && session.executionId !== filter.executionId) {
      return false;
    }
    if (filter.processId && session.processId !== filter.processId) {
      return false;
    }
    if (filter.routeId && this.readCurrentRouteId(session.context) !== filter.routeId) {
      return false;
    }

    return true;
  }

  private toSessionSummary(session: SharedSession): OrchestrationSessionSummary {
    const currentRouteId = this.readCurrentRouteId(session.context);
    const latestTurnId = this.readOptionalContextString(
      session.context,
      SESSION_CONTEXT_LATEST_TURN_ID_KEY,
    );

    return {
      sessionId: session.sessionId,
      status: this.mapSessionStatus(session.status),
      openedAt: session.openedAt,
      ...(session.closedAt ? { closedAt: session.closedAt } : {}),
      ...(this.dependencies.serviceHostKind
        ? { serviceHostKind: this.dependencies.serviceHostKind }
        : {}),
      ...(this.dependencies.serviceTransportKind
        ? { serviceTransportKind: this.dependencies.serviceTransportKind }
        : {}),
      ...(session.processId ? { processId: session.processId } : {}),
      ...(session.executionId ? { executionId: session.executionId } : {}),
      ...(currentRouteId ? { currentRouteId } : {}),
      ...(latestTurnId ? { latestTurnId } : {}),
      latestEventSequence: session.eventCount ?? session.events.length,
      nextCursor: this.createSessionCursor(
        session.sessionId,
        session.eventCount ?? session.events.length,
      ),
      eventCount: session.eventCount ?? session.events.length,
      context: {
        ...session.context,
      },
    };
  }

  private createTurnStreamDeltaPayload(options: {
    routeId: string;
    turnId: string;
    streamEvent: SessionMainSupervisorStreamEvent;
  }): Record<string, unknown> {
    return {
      role: OrchestrationSessionTranscriptRole.ASSISTANT,
      routeId: options.routeId,
      turnId: options.turnId,
      delta:
        options.streamEvent.chunkText ??
        options.streamEvent.accumulatedText ??
        options.streamEvent.detail ??
        options.streamEvent.title ??
        options.streamEvent.toolName ??
        options.streamEvent.kind,
      streamKind: options.streamEvent.kind,
      ...(options.streamEvent.state ? { streamState: options.streamEvent.state } : {}),
      ...(options.streamEvent.title ? { title: options.streamEvent.title } : {}),
      ...(options.streamEvent.detail ? { detail: options.streamEvent.detail } : {}),
      ...(options.streamEvent.detailOrigin
        ? { detailOrigin: options.streamEvent.detailOrigin }
        : {}),
      ...(options.streamEvent.activityKey ? { activityKey: options.streamEvent.activityKey } : {}),
      ...(options.streamEvent.chunkText ? { chunkText: options.streamEvent.chunkText } : {}),
      ...(options.streamEvent.accumulatedText
        ? { accumulatedText: options.streamEvent.accumulatedText }
        : {}),
      ...(options.streamEvent.roleId ? { roleId: options.streamEvent.roleId } : {}),
      ...(options.streamEvent.stageId ? { stageId: options.streamEvent.stageId } : {}),
      ...(options.streamEvent.routeKey ? { routeKey: options.streamEvent.routeKey } : {}),
      ...(options.streamEvent.selectedSurface
        ? { selectedSurface: options.streamEvent.selectedSurface }
        : {}),
      ...(options.streamEvent.selectedBy ? { selectedBy: options.streamEvent.selectedBy } : {}),
      ...(options.streamEvent.toolName ? { toolName: options.streamEvent.toolName } : {}),
      ...(options.streamEvent.toolCallId ? { toolCallId: options.streamEvent.toolCallId } : {}),
      ...(options.streamEvent.invokeLiveness
        ? {
            invokeLiveness: {
              ...options.streamEvent.invokeLiveness,
            },
          }
        : {}),
    };
  }

  private async publishExecutionLivenessEvent(options: {
    executionId: string | null;
    routeId: string;
    turnId: string;
    streamEvent: SessionMainSupervisorStreamEvent;
    relayState: {
      latestFingerprint: string | null;
      partialSnapshotPersisted: boolean;
    };
  }): Promise<void> {
    if (!options.executionId || !options.streamEvent.invokeLiveness) {
      return;
    }
    if (!this.dependencies.publishExecutionEvent) {
      return;
    }

    const livenessSnapshot = this.createExecutionLivenessSnapshot(
      options.routeId,
      options.streamEvent,
    );
    const eventType = this.resolveExecutionLivenessEventType(livenessSnapshot.status);
    const fingerprint = JSON.stringify({
      eventType,
      livenessSnapshot,
    });
    if (fingerprint === options.relayState.latestFingerprint) {
      return;
    }

    await this.dependencies.publishExecutionEvent({
      executionId: options.executionId,
      type: eventType,
      stageId: options.streamEvent.stageId,
      message: this.formatExecutionLivenessMessage(livenessSnapshot),
      livenessSnapshot,
    });
    options.relayState.latestFingerprint = fingerprint;

    if (livenessSnapshot.partialOutputPreserved && !options.relayState.partialSnapshotPersisted) {
      await this.dependencies.publishExecutionEvent({
        executionId: options.executionId,
        type: OrchestrationServiceEventType.EXECUTION_PARTIAL_SNAPSHOT_PERSISTED,
        stageId: options.streamEvent.stageId,
        message: `Execution partial output snapshot persisted for turn ${options.turnId}.`,
        livenessSnapshot,
      });
      options.relayState.partialSnapshotPersisted = true;
    }
  }

  private createExecutionLivenessSnapshot(
    routeId: string,
    streamEvent: SessionMainSupervisorStreamEvent,
  ): OrchestrationExecutionLivenessSnapshot {
    return {
      ...(streamEvent.invokeLiveness ? { ...streamEvent.invokeLiveness } : {}),
      ...(streamEvent.routeKey ? { routeKey: streamEvent.routeKey } : { routeKey: routeId }),
      ...(streamEvent.roleId ? { roleId: streamEvent.roleId } : {}),
      ...(streamEvent.selectedSurface
        ? { surfaceId: streamEvent.selectedSurface }
        : streamEvent.invokeLiveness?.surfaceId
          ? { surfaceId: streamEvent.invokeLiveness.surfaceId }
          : {}),
      ...(streamEvent.chunkText
        ? { latestTextPreview: this.resolveLivenessTextPreview(streamEvent.chunkText) }
        : streamEvent.accumulatedText
          ? { latestTextPreview: this.resolveLivenessTextPreview(streamEvent.accumulatedText) }
          : {}),
      ...(streamEvent.state === 'completed' && !streamEvent.invokeLiveness?.status
        ? { status: 'completed' }
        : {}),
      ...(streamEvent.state === 'failed' && !streamEvent.invokeLiveness?.status
        ? { status: 'failed' }
        : {}),
    };
  }

  private resolveExecutionLivenessEventType(
    status: string | undefined,
  ): OrchestrationServiceEventType {
    if (status === 'graceful_interrupting') {
      return OrchestrationServiceEventType.EXECUTION_GRACEFUL_INTERRUPT_STARTED;
    }
    if (status === 'hard_terminating') {
      return OrchestrationServiceEventType.EXECUTION_HARD_TERMINATION_STARTED;
    }
    return OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED;
  }

  private formatExecutionLivenessMessage(snapshot: OrchestrationExecutionLivenessSnapshot): string {
    const detailParts = [
      snapshot.status ? `status=${snapshot.status}` : null,
      snapshot.routeKey ? `route=${snapshot.routeKey}` : null,
      snapshot.surfaceId ? `surface=${snapshot.surfaceId}` : null,
      snapshot.remoteRequestId ? `remote_request_id=${snapshot.remoteRequestId}` : null,
    ].filter((value): value is string => value !== null);
    return detailParts.length > 0
      ? `Execution liveness updated (${detailParts.join(' ')}).`
      : 'Execution liveness updated.';
  }

  private resolveLivenessTextPreview(source: string): string {
    const normalized = source.trim();
    return normalized.length > 160 ? normalized.slice(-160) : normalized;
  }

  private toSessionEvents(session: SharedSession): OrchestrationSessionEvent[] {
    return session.events.map((event, index) => {
      const sequence = event.eventIndex ?? index + 1;
      return {
        eventId: event.eventId,
        sequence,
        streamCursor: this.createSessionCursor(session.sessionId, sequence),
        sessionId: session.sessionId,
        type: event.type as OrchestrationSessionEventType,
        createdAt: event.createdAt,
        payload: {
          ...event.payload,
        },
      };
    });
  }

  private resolveNextTurnIndex(session: SharedSession): number {
    if (typeof session.turnCount === 'number' && Number.isFinite(session.turnCount)) {
      return session.turnCount + 1;
    }

    return (
      session.events.filter((event) => event.type === OrchestrationSessionEventType.TURN_SUBMITTED)
        .length + 1
    );
  }

  private assertSupportedRouteId(routeId: string): void {
    if (routeId === OrchestrationSessionRouteId.MAIN) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Unsupported session route "${routeId}".`,
      {
        routeId,
      },
    );
  }

  private assertSupportedTranscriptRole(role: string): OrchestrationSessionTranscriptRole {
    if (
      role === OrchestrationSessionTranscriptRole.SYSTEM ||
      role === OrchestrationSessionTranscriptRole.USER ||
      role === OrchestrationSessionTranscriptRole.ASSISTANT ||
      role === OrchestrationSessionTranscriptRole.SLASH_COMMAND
    ) {
      return role;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Unsupported session transcript role "${role}".`,
      {
        role,
      },
    );
  }

  private mapSessionStatus(status: SessionStatus): OrchestrationSessionStatus {
    if (status === SessionStatus.ACTIVE) {
      return OrchestrationSessionStatus.ACTIVE;
    }
    if (status === SessionStatus.ARCHIVED) {
      return OrchestrationSessionStatus.ARCHIVED;
    }
    if (status === SessionStatus.COMPLETED) {
      return OrchestrationSessionStatus.COMPLETED;
    }
    if (status === SessionStatus.CANCELLED) {
      return OrchestrationSessionStatus.CANCELLED;
    }
    return OrchestrationSessionStatus.FAILED;
  }

  private readCurrentRouteId(context: Record<string, unknown>): string {
    return (
      this.readOptionalContextString(context, SESSION_CONTEXT_CURRENT_ROUTE_KEY) ??
      OrchestrationSessionRouteId.MAIN
    );
  }

  private readOptionalMetadataString(
    metadata: Record<string, unknown> | undefined,
    fieldName: string,
  ): string | undefined {
    if (!metadata) {
      return undefined;
    }

    const candidate = metadata[fieldName];
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session turn metadata field "${fieldName}" must be a non-empty string when present.`,
      {
        fieldName,
      },
    );
  }

  private readOptionalContextString(
    context: Record<string, unknown>,
    fieldName: string,
  ): string | undefined {
    const candidate = context[fieldName];
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session context field "${fieldName}" must be a non-empty string when present.`,
      {
        fieldName,
      },
    );
  }

  private assertSessionResumable(session: SharedSession, resumeSelector: string): void {
    if (session.status === SessionStatus.ACTIVE) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_ALREADY_CLOSED,
      'The requested session is not resumable in its current lifecycle state.',
      {
        resumeSelector,
        sessionId: session.sessionId,
        status: session.status,
      },
    );
  }

  private resolveSessionSortTimestamp(session: SharedSession): string {
    return (
      this.readOptionalContextString(session.context, SESSION_CONTEXT_LATEST_TURN_AT_KEY) ??
      this.readOptionalContextString(session.context, SESSION_CONTEXT_ARCHIVED_AT_KEY) ??
      session.closedAt ??
      session.openedAt
    );
  }

  private buildAppendedMessageContextPatch(
    lines: string[],
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    const renderKind = this.readOptionalMetadataString(metadata, 'renderKind');
    const commandLine = this.readOptionalMetadataString(metadata, 'commandLine');
    if (!commandLine && renderKind !== 'collaboration_recap') {
      return {};
    }

    const previewSummary = lines[0] ? this.toSingleLineSummary(lines[0]) : undefined;
    const latestNoteSummary = commandLine
      ? `last_command=${this.toSingleLineSummary(commandLine)}`
      : previewSummary;

    return {
      ...(previewSummary ? { [SESSION_CONTEXT_PREVIEW_SUMMARY_KEY]: previewSummary } : {}),
      ...(latestNoteSummary
        ? { [SESSION_CONTEXT_LATEST_NOTE_SUMMARY_KEY]: latestNoteSummary }
        : {}),
    };
  }

  private buildSessionPreviewSummary(options: {
    latestUserMessage: string;
    assistantMessage?: string;
    followUpQuestion?: string;
    suggestedSlashCommand?: string;
  }): string {
    return this.toSingleLineSummary(
      options.assistantMessage ??
        options.followUpQuestion ??
        options.suggestedSlashCommand ??
        options.latestUserMessage,
    );
  }

  private buildTurnNoteSummary(options: {
    latestUserMessage: string;
    assistantMessage?: string;
    followUpQuestion?: string;
    suggestedSlashCommand?: string;
    responseMode: string;
    selectedSurface?: string;
  }): string {
    const segments = [`goal=${this.toSingleLineSummary(options.latestUserMessage)}`];
    if (options.responseMode === 'command_handoff_preview' && options.suggestedSlashCommand) {
      segments.push(`next=${this.toSingleLineSummary(options.suggestedSlashCommand)}`);
    } else if (options.responseMode === 'follow_up_question' && options.followUpQuestion) {
      segments.push(`follow_up=${this.toSingleLineSummary(options.followUpQuestion)}`);
    } else if (options.responseMode === 'role_collaboration') {
      segments.push('last_status=role_collaboration_completed');
    } else if (options.assistantMessage) {
      segments.push(`last_reply=${this.toSingleLineSummary(options.assistantMessage)}`);
    }
    if (options.selectedSurface) {
      segments.push(`surface=${this.toSingleLineSummary(options.selectedSurface)}`);
    }
    return segments.join(' | ');
  }

  private toSingleLineSummary(candidate: string, maxLength = 140): string {
    const normalized = candidate.replace(/\s+/gu, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }
    return `${normalized.slice(0, Math.max(maxLength - 3, 1))}...`;
  }

  private createSessionCursor(sessionId: string, sequence: number): string {
    return Buffer.from(
      JSON.stringify({
        sessionId,
        sequence,
        version: SESSION_CURSOR_VERSION,
      }),
      'utf8',
    ).toString('base64url');
  }

  private parseSessionCursor(cursor: string): {
    sessionId: string;
    sequence: number;
  } {
    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as {
        sessionId?: unknown;
        sequence?: unknown;
      };
      if (
        typeof parsed.sessionId !== 'string' ||
        parsed.sessionId.length === 0 ||
        typeof parsed.sequence !== 'number' ||
        !Number.isFinite(parsed.sequence)
      ) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
          'Session cursor payload is invalid.',
          {
            cursor,
          },
        );
      }

      return {
        sessionId: parsed.sessionId,
        sequence: parsed.sequence,
      };
    } catch (error) {
      const standardizedError = standardizeError(error) as StandardizedError;
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Failed to parse session cursor: ${standardizedError.message}`,
        {
          cursor,
        },
        error,
      );
    }
  }

  private toTimestamp(): string {
    return this.nowProvider().toISOString();
  }

  private currentTimeMs(): number {
    return this.nowProvider().getTime();
  }

  private buildRuntimePerformanceDetailLines(options: {
    dispatchElapsedMs: number;
    persistenceElapsedMs: number;
    persistenceWriteCount: number;
    streamDeltaCount: number;
    turnElapsedMs: number;
  }): string[] {
    return [
      `performance.turn_elapsed_pre_terminal_ms=${String(options.turnElapsedMs)}`,
      `performance.dispatch_ms=${String(options.dispatchElapsedMs)}`,
      `performance.session_persist_pre_terminal_ms=${String(options.persistenceElapsedMs)} writes=${String(options.persistenceWriteCount)}`,
      `performance.stream_delta_count=${String(options.streamDeltaCount)}`,
    ];
  }

  private mergeExecutionDetailsLines(primaryLines: string[], secondaryLines: string[]): string[] {
    const mergedLines: string[] = [];
    for (const line of [...primaryLines, ...secondaryLines]) {
      const normalizedLine = line.trim();
      if (normalizedLine.length === 0 || mergedLines.includes(line)) {
        continue;
      }
      mergedLines.push(line);
    }
    return mergedLines;
  }

  private formatTurnFailure(
    error: unknown,
    standardizedError: StandardizedError,
  ): {
    message: string;
    detail?: string;
  } {
    const detailCandidates = this.collectTurnFailureDetailCandidates(error)
      .map((candidate) => this.normalizeTurnFailureDetail(candidate))
      .filter((candidate): candidate is string => Boolean(candidate))
      .filter((candidate) => candidate !== standardizedError.message)
      .filter((candidate, index, list) => list.indexOf(candidate) === index);
    if (detailCandidates.length === 0) {
      return {
        message: standardizedError.message,
      };
    }

    return {
      message: standardizedError.message,
      detail: detailCandidates.join(' | '),
    };
  }

  private collectTurnFailureDetailCandidates(error: unknown): string[] {
    if (!error || typeof error !== 'object') {
      return [];
    }

    const candidateMessages: string[] = [];
    const visited = new Set<unknown>();
    let cursor: unknown = error;
    while (cursor && typeof cursor === 'object' && !visited.has(cursor)) {
      visited.add(cursor);
      const errorLike = cursor as {
        message?: unknown;
        details?: unknown;
        cause?: unknown;
      };
      const details = this.readErrorDetails(errorLike.details);
      const stderr = typeof details?.stderr === 'string' ? details.stderr : null;
      const stdout = typeof details?.stdout === 'string' ? details.stdout : null;
      const nestedMessage = typeof errorLike.message === 'string' ? errorLike.message : null;
      if (stderr) {
        candidateMessages.push(stderr);
      }
      if (stdout?.trimStart().startsWith('error:')) {
        candidateMessages.push(stdout);
      }
      if (nestedMessage) {
        candidateMessages.push(nestedMessage);
      }
      cursor = errorLike.cause;
    }
    return candidateMessages;
  }

  private readErrorDetails(candidate: unknown): Record<string, unknown> | undefined {
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }
    return candidate as Record<string, unknown>;
  }

  private normalizeTurnFailureDetail(candidate: string): string | undefined {
    const normalized = candidate.replace(/\s+/gu, ' ').trim();
    if (normalized.length === 0) {
      return undefined;
    }
    return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
  }
}
