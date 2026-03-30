import { randomUUID } from 'node:crypto';

import { MemoryManager } from '@repo-ai-governor/core-memory';
import {
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
  type OrchestrationAppendSessionMessageRequest,
  type OrchestrationAppendSessionMessageResponse,
  type OrchestrationListSessionsFilter,
  type OrchestrationListSessionsRequest,
  type OrchestrationListSessionsResponse,
  type OrchestrationResumeSessionRequest,
  type OrchestrationResumeSessionResponse,
  type OrchestrationSendSessionTurnRequest,
  type OrchestrationSendSessionTurnResponse,
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
} from '@repo-ai-governor/orchestration-service-client';
import {
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  GovernorErrorCode,
  type MemoryRuntimeConfig,
  RuntimeError,
  type StandardizedError,
  standardizeError,
} from '@repo-ai-governor/shared';

interface LocalOrchestrationServiceSessionMemoryProviderState {
  composition: MemoryProviderCompositionSummary;
  provider: MemoryStoreProvider;
}

interface LocalOrchestrationServiceSessionRuntimeDependencies {
  workspaceRoot: string;
  memoryConfig?: MemoryRuntimeConfig;
  memoryProviderRegistry?: MemoryProviderRegistry;
  memoryProviderRuntimeMode?: MemoryProviderRuntimeMode;
  nowProvider?: () => Date;
}

const SESSION_CONTEXT_CURRENT_ROUTE_KEY = 'currentRouteId';
const SESSION_CONTEXT_LATEST_TURN_ID_KEY = 'latestTurnId';
const SESSION_CONTEXT_TURN_COUNT_KEY = 'turnCount';
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
  private memoryProviderStatePromise: Promise<LocalOrchestrationServiceSessionMemoryProviderState> | null =
    null;
  private sharedSessionManagerPromise: Promise<SharedSessionManager> | null = null;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceSessionRuntimeDependencies,
  ) {
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
    this.memoryProviderRegistry =
      dependencies.memoryProviderRegistry ?? new MemoryProviderRegistry();
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
   * Appends one `session.main` user turn and the synthesized assistant baseline response.
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
    const acceptedAt = this.toTimestamp();
    const turnId = request.turnId ?? `turn-${randomUUID().replace(/-/gu, '')}`;
    const turnIndex = this.countCompletedTurns(existingSession) + 1;

    await sessionManager.appendEvent({
      sessionId: request.sessionId,
      type: OrchestrationSessionEventType.TURN_SUBMITTED,
      createdAt: acceptedAt,
      payload: {
        role: OrchestrationSessionTranscriptRole.USER,
        routeId: currentRouteId,
        turnId,
        content: request.userMessage,
        ...(request.metadata ? { metadata: { ...request.metadata } } : {}),
      },
    });
    await sessionManager.appendEvent({
      sessionId: request.sessionId,
      type: OrchestrationSessionEventType.TURN_STREAM_DELTA,
      createdAt: this.toTimestamp(),
      payload: {
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: currentRouteId,
        turnId,
        delta: `turn:${turnIndex}:ack`,
      },
    });
    await sessionManager.appendEvent({
      sessionId: request.sessionId,
      type: OrchestrationSessionEventType.TURN_COMPLETED,
      createdAt: this.toTimestamp(),
      payload: {
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: currentRouteId,
        turnId,
        turnIndex,
        responseMode: 'baseline_ack',
        latestUserMessage: request.userMessage,
      },
    });
    await sessionManager.updateContext({
      sessionId: request.sessionId,
      contextPatch: {
        [SESSION_CONTEXT_CURRENT_ROUTE_KEY]: currentRouteId,
        [SESSION_CONTEXT_LATEST_TURN_ID_KEY]: turnId,
        [SESSION_CONTEXT_TURN_COUNT_KEY]: turnIndex,
      },
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
      .sort((left, right) => right.openedAt.localeCompare(left.openedAt))
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
    const sessions = await sessionManager.listSessions();
    return [...sessions].sort((left, right) => right.openedAt.localeCompare(left.openedAt))[0];
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
      ...(session.processId ? { processId: session.processId } : {}),
      ...(session.executionId ? { executionId: session.executionId } : {}),
      ...(currentRouteId ? { currentRouteId } : {}),
      ...(latestTurnId ? { latestTurnId } : {}),
      latestEventSequence: session.events.length,
      nextCursor: this.createSessionCursor(session.sessionId, session.events.length),
      eventCount: session.events.length,
      context: {
        ...session.context,
      },
    };
  }

  private toSessionEvents(session: SharedSession): OrchestrationSessionEvent[] {
    return session.events.map((event, index) => {
      const sequence = index + 1;
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

  private countCompletedTurns(session: SharedSession): number {
    return session.events.filter(
      (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
    ).length;
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
}
