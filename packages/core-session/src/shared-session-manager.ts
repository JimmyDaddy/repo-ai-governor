import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import { type MemoryManager, MemoryScope } from '@repo-ai-governor/core-memory';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { SessionStatus } from './constants/index.js';
import type {
  AppendSessionEventOptions,
  FinalizeSessionOptions,
  ListSharedSessionsOptions,
  OpenSharedSessionOptions,
  SessionEvent,
  SharedSession,
  SharedSessionDiagnosticRecord,
  SharedSessionEventRecord,
  SharedSessionSummaryRecord,
  UpdateSessionContextOptions,
} from './types/index.js';

const SESSION_TAG = 'session';
const SESSION_SUMMARY_RECORD_TAG = 'session-summary';
const SESSION_EVENT_RECORD_TAG = 'session-event';
const SESSION_DIAGNOSTIC_RECORD_TAG = 'session-diagnostic';
const SESSION_SUMMARY_SCHEMA_VERSION = 'shared-session-summary.v1';
const SESSION_EVENT_SCHEMA_VERSION = 'shared-session-event.v1';
const SESSION_DIAGNOSTIC_SCHEMA_VERSION = 'shared-session-diagnostic.v1';
const SESSION_EVENT_KEY_SEGMENT = 'event';
const SESSION_DIAGNOSTIC_KEY_SEGMENT = 'diagnostic';
const SESSION_EVENT_INDEX_PAD_WIDTH = 12;
const SESSION_TURN_SUBMITTED_EVENT_TYPE = 'session.turn.submitted';
const SESSION_DIAGNOSTIC_CATEGORY_TERMINAL = 'turn_terminal';
const SESSION_DIAGNOSTIC_CATEGORY_FAILURE = 'turn_failure';
const SESSION_DIAGNOSTIC_CATEGORY_EXECUTION_DETAILS = 'execution_details';
const SESSION_STATUS_VALUES = new Set<string>(Object.values(SessionStatus));

/**
 * Manages shared session lifecycle and persistence through core-memory.
 *
 * Why this exists:
 * runtime/session consumers should persist one stable session summary plus append-only event log
 * instead of rewriting the full session payload blob on every turn mutation.
 */
export class SharedSessionManager {
  private static readonly sessionMutationLocks = new Map<
    string,
    {
      token: symbol;
      tail: Promise<void>;
    }
  >();

  constructor(private readonly memoryManager: MemoryManager) {}

  /**
   * Opens an active shared session or returns an existing active session by id.
   * @param options Open-session options.
   * @returns Active shared session payload.
   */
  public async openSession(options: OpenSharedSessionOptions = {}): Promise<SharedSession> {
    const resolvedSessionId = options.sessionId ?? randomUUID();
    return this.runWithSessionMutationLock(resolvedSessionId, async () => {
      const existingRecord = await this.memoryManager.readEntry({
        scope: MemoryScope.SESSION,
        key: resolvedSessionId,
      });

      if (existingRecord) {
        const existingSession = await this.readPersistedSession(
          resolvedSessionId,
          existingRecord.value,
          {
            mutationLockHeld: true,
          },
        );
        if (existingSession.status !== SessionStatus.ACTIVE) {
          throw new RuntimeError(
            GovernorErrorCode.MEMORY_SESSION_ALREADY_CLOSED,
            `Session "${resolvedSessionId}" is already closed and cannot be reopened.`,
            {
              sessionId: resolvedSessionId,
              status: existingSession.status,
            },
          );
        }

        return this.cloneSession(existingSession);
      }

      const openedAt = options.openedAt ?? new Date().toISOString();
      const openedSession: SharedSession = {
        sessionId: resolvedSessionId,
        status: SessionStatus.ACTIVE,
        openedAt,
        ...(options.processId ? { processId: options.processId } : {}),
        ...(options.executionId ? { executionId: options.executionId } : {}),
        context: options.initialContext ?? {},
        events: [],
        eventCount: 0,
        turnCount: 0,
      };
      await this.writeSessionSummaryRecord(openedSession);

      return this.cloneSession(openedSession);
    });
  }

  /**
   * Reads one session payload by session id.
   * @param sessionId Session id.
   * @returns Session payload.
   */
  public async getSession(sessionId: string): Promise<SharedSession> {
    return this.readPersistedSession(sessionId);
  }

  /**
   * Appends one event to active session event stream.
   * @param options Append-event options.
   * @returns Updated shared session payload.
   */
  public async appendEvent(options: AppendSessionEventOptions): Promise<SharedSession> {
    return this.runWithSessionMutationLock(options.sessionId, async () => {
      const session = await this.readPersistedSession(options.sessionId, undefined, {
        mutationLockHeld: true,
      });
      this.assertSessionActiveOrThrow(session);

      const nextEventIndex = (session.eventCount ?? session.events.length) + 1;
      const normalizedPayload = {
        ...(options.payload ?? {}),
      };
      const currentTurnCount = this.resolveCanonicalTurnCount(session);
      const submittedTurnIndex = this.resolveSubmittedTurnIndex({
        eventType: options.type,
        payload: normalizedPayload,
        currentTurnCount,
      });
      if (submittedTurnIndex !== undefined) {
        normalizedPayload.turnIndex = submittedTurnIndex;
      }

      const appendedEvent: SessionEvent = {
        eventId: options.eventId ?? randomUUID(),
        type: options.type,
        createdAt: options.createdAt ?? new Date().toISOString(),
        payload: normalizedPayload,
        eventIndex: nextEventIndex,
        ...(submittedTurnIndex !== undefined ? { turnIndex: submittedTurnIndex } : {}),
      };

      await this.writeSessionEventRecord(session, appendedEvent);
      await this.writeSessionDiagnosticsRecord(session, appendedEvent);

      const updatedSession: SharedSession = {
        ...session,
        events: [...session.events, appendedEvent],
        eventCount: nextEventIndex,
        turnCount:
          options.type === SESSION_TURN_SUBMITTED_EVENT_TYPE
            ? (submittedTurnIndex ?? currentTurnCount + 1)
            : currentTurnCount,
        lastEventId: appendedEvent.eventId,
      };
      await this.writeSessionSummaryRecord(updatedSession);

      return this.cloneSession(updatedSession);
    });
  }

  /**
   * Merges one context patch into active session context.
   * @param options Context update options.
   * @returns Updated shared session payload.
   */
  public async updateContext(options: UpdateSessionContextOptions): Promise<SharedSession> {
    return this.runWithSessionMutationLock(options.sessionId, async () => {
      const session = await this.readPersistedSession(options.sessionId, undefined, {
        mutationLockHeld: true,
      });
      this.assertSessionActiveOrThrow(session);

      const updatedSession: SharedSession = {
        ...session,
        context: {
          ...session.context,
          ...options.contextPatch,
        },
      };
      await this.writeSessionSummaryRecord(updatedSession);

      return this.cloneSession(updatedSession);
    });
  }

  /**
   * Finalizes one active session with terminal status.
   * @param options Finalize-session options.
   * @returns Finalized shared session payload.
   */
  public async finalizeSession(options: FinalizeSessionOptions): Promise<SharedSession> {
    return this.runWithSessionMutationLock(options.sessionId, async () => {
      const session = await this.readPersistedSession(options.sessionId, undefined, {
        mutationLockHeld: true,
      });
      this.assertSessionActiveOrThrow(session);

      const nextStatus = options.status ?? SessionStatus.COMPLETED;
      if (nextStatus === SessionStatus.ACTIVE) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_INVALID_STATUS,
          'Finalize session requires terminal status (completed/cancelled/failed).',
          {
            sessionId: options.sessionId,
            status: nextStatus,
          },
        );
      }

      const finalizedSession: SharedSession = {
        ...session,
        status: nextStatus,
        closedAt: options.closedAt ?? new Date().toISOString(),
      };
      await this.writeSessionSummaryRecord(finalizedSession);

      return this.cloneSession(finalizedSession);
    });
  }

  /**
   * Lists sessions with optional status filter and limit.
   * @param options Session-list options.
   * @returns Session payloads.
   */
  public async listSessions(options: ListSharedSessionsOptions = {}): Promise<SharedSession[]> {
    const records = await this.memoryManager.queryEntries({
      scope: MemoryScope.SESSION,
      tag: SESSION_TAG,
      limit: options.limit,
    });

    const sessions = records
      .map((record) => this.parseSessionListRecord(record.key, record.value))
      .filter((session): session is SharedSession => Boolean(session));

    if (!options.status) {
      return sessions.map((session) => this.cloneSession(session));
    }

    return sessions
      .filter((session) => session.status === options.status)
      .map((session) => this.cloneSession(session));
  }

  /**
   * Reads one persisted session from summary + event log or lazily migrates legacy blob payload.
   * @param sessionId Session identifier.
   * @param preloadedSummaryValue Optional summary payload already read by caller.
   * @returns Parsed shared session.
   */
  private async readPersistedSession(
    sessionId: string,
    preloadedSummaryValue?: Record<string, unknown>,
    options: {
      mutationLockHeld?: boolean;
    } = {},
  ): Promise<SharedSession> {
    const summaryValue =
      preloadedSummaryValue ??
      (
        await this.memoryManager.readEntry({
          scope: MemoryScope.SESSION,
          key: sessionId,
        })
      )?.value;

    if (!summaryValue) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        `Session "${sessionId}" was not found in memory store.`,
        { sessionId },
      );
    }

    if (this.isSummaryRecordPayload(summaryValue)) {
      const summaryRecord = this.parseSessionSummaryRecord(summaryValue, sessionId);
      const eventRecords = await this.readSessionEventRecords(sessionId);
      return this.buildSessionFromDurableRecords(summaryRecord, eventRecords);
    }

    const legacySession = this.parseLegacySharedSessionPayload(summaryValue, sessionId);
    return this.migrateLegacySessionPayload(legacySession, options.mutationLockHeld === true);
  }

  /**
   * Parses one list-session record without forcing an eager event-log hydrate.
   * @param sessionId Session id derived from memory key.
   * @param value Record payload.
   * @returns Parsed session summary payload when the record belongs to a session summary.
   */
  private parseSessionListRecord(
    sessionId: string,
    value: Record<string, unknown>,
  ): SharedSession | undefined {
    if (this.isSummaryRecordPayload(value)) {
      const summary = this.parseSessionSummaryRecord(value, sessionId);
      return this.buildSessionListProjection(summary);
    }

    if (this.isLegacySessionPayload(value)) {
      return this.parseLegacySharedSessionPayload(value, sessionId);
    }

    return undefined;
  }

  /**
   * Writes one durable summary record under the canonical session key.
   * @param session Session payload to summarize.
   * @returns Void.
   */
  private async writeSessionSummaryRecord(session: SharedSession): Promise<void> {
    const summaryRecord = this.toSessionSummaryRecord(session);
    await this.memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: session.sessionId,
      payload: summaryRecord as unknown as Record<string, unknown>,
      tags: [
        SESSION_TAG,
        SESSION_SUMMARY_RECORD_TAG,
        `status:${session.status}`,
        ...(session.executionId ? [`execution:${session.executionId}`] : []),
        ...(session.processId ? [`process:${session.processId}`] : []),
      ],
      updatedAt: this.resolveSessionSummaryUpdatedAt(session),
    });
  }

  /**
   * Writes one append-only event record keyed by stable session + event index.
   * @param session Session owning the event.
   * @param event Event payload to persist.
   * @returns Void.
   */
  private async writeSessionEventRecord(
    session: SharedSession,
    event: SessionEvent,
  ): Promise<void> {
    const eventRecord = this.toSessionEventRecord(session.sessionId, event);
    await this.memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: this.createSessionEventStorageKey(
        session.sessionId,
        eventRecord.eventIndex,
        event.eventId,
      ),
      payload: eventRecord as unknown as Record<string, unknown>,
      tags: [
        SESSION_EVENT_RECORD_TAG,
        `session:${session.sessionId}`,
        `type:${event.type}`,
        ...(session.executionId ? [`execution:${session.executionId}`] : []),
        ...(session.processId ? [`process:${session.processId}`] : []),
        ...(eventRecord.turnIndex !== undefined ? [`turn:${String(eventRecord.turnIndex)}`] : []),
      ],
      updatedAt: event.createdAt,
    });
  }

  /**
   * Persists one diagnostic/projection row for terminal or detail-rich events.
   * @param session Session owning the event.
   * @param event Event payload that may expose diagnostics.
   * @returns Void.
   */
  private async writeSessionDiagnosticsRecord(
    session: SharedSession,
    event: SessionEvent,
  ): Promise<void> {
    const diagnosticRecord = this.buildSessionDiagnosticRecord(session.sessionId, event);
    if (!diagnosticRecord) {
      return;
    }

    await this.memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: this.createSessionDiagnosticStorageKey(
        session.sessionId,
        diagnosticRecord.eventIndex,
        diagnosticRecord.diagnosticId,
      ),
      payload: diagnosticRecord as unknown as Record<string, unknown>,
      tags: [
        SESSION_DIAGNOSTIC_RECORD_TAG,
        `session:${session.sessionId}`,
        `category:${diagnosticRecord.category}`,
        ...(diagnosticRecord.turnIndex !== undefined
          ? [`turn:${String(diagnosticRecord.turnIndex)}`]
          : []),
      ],
      updatedAt: diagnosticRecord.createdAt,
    });
  }

  /**
   * Reads append-only event records for one session and sorts them by canonical event index.
   * @param sessionId Session identifier.
   * @returns Persisted event records.
   */
  private async readSessionEventRecords(sessionId: string): Promise<SharedSessionEventRecord[]> {
    const records = await this.memoryManager.queryEntries({
      scope: MemoryScope.SESSION,
      keyPrefix: this.createSessionEventKeyPrefix(sessionId),
    });

    return records
      .map((record) => this.parseSessionEventRecord(record.value, sessionId))
      .sort((left, right) => left.eventIndex - right.eventIndex);
  }

  /**
   * Builds one in-memory shared session from durable summary and append-only event rows.
   * @param summary Durable summary record.
   * @param eventRecords Durable event rows.
   * @returns Hydrated shared session payload.
   */
  private buildSessionFromDurableRecords(
    summary: SharedSessionSummaryRecord,
    eventRecords: SharedSessionEventRecord[],
  ): SharedSession {
    this.assertSummaryMatchesEventLogOrThrow(summary, eventRecords);
    const hydratedEvents = eventRecords.map((eventRecord) => ({
      eventId: eventRecord.eventId,
      type: eventRecord.type,
      createdAt: eventRecord.createdAt,
      payload: {
        ...eventRecord.payload,
      },
      eventIndex: eventRecord.eventIndex,
      ...(eventRecord.turnIndex !== undefined ? { turnIndex: eventRecord.turnIndex } : {}),
    }));
    const derivedTurnCount = this.resolveTurnCountFromEvents(hydratedEvents);

    return {
      sessionId: summary.sessionId,
      status: summary.status,
      openedAt: summary.openedAt,
      ...(summary.closedAt ? { closedAt: summary.closedAt } : {}),
      ...(summary.processId ? { processId: summary.processId } : {}),
      ...(summary.executionId ? { executionId: summary.executionId } : {}),
      context: {
        ...summary.context,
      },
      events: hydratedEvents,
      eventCount: Math.max(summary.eventCount, hydratedEvents.length),
      turnCount: Math.max(summary.turnCount, derivedTurnCount),
      lastEventId:
        summary.lastEventId ??
        (hydratedEvents.length > 0
          ? hydratedEvents[hydratedEvents.length - 1]?.eventId
          : undefined),
    };
  }

  /**
   * Builds one list-friendly session projection directly from summary metadata.
   * @param summary Durable summary record.
   * @returns Shared session summary payload with no eagerly hydrated events.
   */
  private buildSessionListProjection(summary: SharedSessionSummaryRecord): SharedSession {
    return {
      sessionId: summary.sessionId,
      status: summary.status,
      openedAt: summary.openedAt,
      ...(summary.closedAt ? { closedAt: summary.closedAt } : {}),
      ...(summary.processId ? { processId: summary.processId } : {}),
      ...(summary.executionId ? { executionId: summary.executionId } : {}),
      context: {
        ...summary.context,
      },
      events: [],
      eventCount: summary.eventCount,
      turnCount: summary.turnCount,
      ...(summary.lastEventId ? { lastEventId: summary.lastEventId } : {}),
    };
  }

  /**
   * Lazily migrates one legacy blob payload into summary + event records.
   * @param legacySession Legacy session payload.
   * @returns Session payload after migration.
   */
  private async migrateLegacySessionPayload(
    legacySession: SharedSession,
    mutationLockHeld = false,
  ): Promise<SharedSession> {
    const migrate = async (): Promise<SharedSession> => {
      const latestRecord = await this.memoryManager.readEntry({
        scope: MemoryScope.SESSION,
        key: legacySession.sessionId,
      });
      const latestPayload = latestRecord?.value;
      if (latestPayload && this.isSummaryRecordPayload(latestPayload)) {
        const summaryRecord = this.parseSessionSummaryRecord(
          latestPayload,
          legacySession.sessionId,
        );
        const eventRecords = await this.readSessionEventRecords(legacySession.sessionId);
        return this.buildSessionFromDurableRecords(summaryRecord, eventRecords);
      }

      const existingEventRecords = await this.readSessionEventRecords(legacySession.sessionId);
      this.assertLegacyMigrationStateOrThrow(legacySession, existingEventRecords);

      for (const legacyEvent of legacySession.events) {
        await this.writeSessionEventRecord(legacySession, legacyEvent);
        await this.writeSessionDiagnosticsRecord(legacySession, legacyEvent);
      }

      const migratedSession: SharedSession = {
        ...legacySession,
        eventCount: legacySession.events.length,
        turnCount: this.resolveCanonicalTurnCount(legacySession),
        lastEventId: legacySession.events.at(-1)?.eventId,
      };
      await this.writeSessionSummaryRecord(migratedSession);

      return this.cloneSession(migratedSession);
    };

    if (mutationLockHeld) {
      return migrate();
    }

    return this.runWithSessionMutationLock(legacySession.sessionId, migrate);
  }

  /**
   * Serializes mutating operations per session inside one process so append/write ordering
   * cannot allocate duplicate canonical indices when multiple managers share the same provider.
   * @param sessionId Session id to serialize.
   * @param operation Mutation body.
   * @returns Operation result.
   */
  private async runWithSessionMutationLock<T>(
    sessionId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previousEntry = SharedSessionManager.sessionMutationLocks.get(sessionId);
    let releaseCurrentLock: (() => void) | undefined;
    const currentLockTail = new Promise<void>((resolve) => {
      releaseCurrentLock = resolve;
    });
    const currentToken = Symbol(sessionId);
    SharedSessionManager.sessionMutationLocks.set(sessionId, {
      token: currentToken,
      tail: currentLockTail,
    });

    await (previousEntry?.tail ?? Promise.resolve());

    try {
      return await operation();
    } finally {
      releaseCurrentLock?.();
      if (SharedSessionManager.sessionMutationLocks.get(sessionId)?.token === currentToken) {
        SharedSessionManager.sessionMutationLocks.delete(sessionId);
      }
    }
  }

  /**
   * Fails closed when durable summary metadata diverges from append-only event history.
   * @param summary Durable summary record.
   * @param eventRecords Durable event rows.
   * @returns Void.
   */
  private assertSummaryMatchesEventLogOrThrow(
    summary: SharedSessionSummaryRecord,
    eventRecords: SharedSessionEventRecord[],
  ): void {
    if (summary.eventCount !== eventRecords.length) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session "${summary.sessionId}" summary/event-log mismatch detected.`,
        {
          sessionId: summary.sessionId,
          summaryEventCount: summary.eventCount,
          durableEventRecordCount: eventRecords.length,
        },
      );
    }

    const lastEventId = eventRecords.at(-1)?.eventId;
    if (summary.eventCount > 0 && summary.lastEventId && lastEventId !== summary.lastEventId) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session "${summary.sessionId}" lastEventId does not match durable event log.`,
        {
          sessionId: summary.sessionId,
          summaryLastEventId: summary.lastEventId,
          durableLastEventId: lastEventId,
        },
      );
    }
  }

  /**
   * Validates any partially migrated event rows are still a prefix-compatible subset of legacy history.
   * @param legacySession Legacy session payload.
   * @param eventRecords Existing durable event rows.
   * @returns Void.
   */
  private assertLegacyMigrationStateOrThrow(
    legacySession: SharedSession,
    eventRecords: SharedSessionEventRecord[],
  ): void {
    if (eventRecords.length > legacySession.events.length) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session "${legacySession.sessionId}" has extra durable event rows that do not match legacy history.`,
        {
          sessionId: legacySession.sessionId,
          durableEventRecordCount: eventRecords.length,
          legacyEventCount: legacySession.events.length,
        },
      );
    }

    for (const [index, eventRecord] of eventRecords.entries()) {
      const legacyEvent = legacySession.events[index];
      if (!legacyEvent) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
          `Session "${legacySession.sessionId}" legacy migration found an unexpected durable event row.`,
          {
            sessionId: legacySession.sessionId,
            eventIndex: eventRecord.eventIndex,
            eventId: eventRecord.eventId,
          },
        );
      }

      const expectedEventRecord = this.toSessionEventRecord(legacySession.sessionId, legacyEvent);
      if (
        eventRecord.eventIndex !== expectedEventRecord.eventIndex ||
        eventRecord.eventId !== expectedEventRecord.eventId ||
        eventRecord.type !== expectedEventRecord.type ||
        eventRecord.createdAt !== expectedEventRecord.createdAt ||
        eventRecord.turnIndex !== expectedEventRecord.turnIndex ||
        !isDeepStrictEqual(eventRecord.payload, expectedEventRecord.payload)
      ) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
          `Session "${legacySession.sessionId}" durable event rows do not form a compatible legacy prefix.`,
          {
            sessionId: legacySession.sessionId,
            eventIndex: eventRecord.eventIndex,
            durableEventId: eventRecord.eventId,
            expectedEventId: expectedEventRecord.eventId,
          },
        );
      }
    }
  }

  /**
   * Converts one in-memory session payload into its durable summary projection.
   * @param session Session payload.
   * @returns Durable summary record.
   */
  private toSessionSummaryRecord(session: SharedSession): SharedSessionSummaryRecord {
    return {
      schemaVersion: SESSION_SUMMARY_SCHEMA_VERSION,
      sessionId: session.sessionId,
      status: session.status,
      openedAt: session.openedAt,
      ...(session.closedAt ? { closedAt: session.closedAt } : {}),
      ...(session.processId ? { processId: session.processId } : {}),
      ...(session.executionId ? { executionId: session.executionId } : {}),
      context: {
        ...session.context,
      },
      eventCount: session.eventCount ?? session.events.length,
      turnCount: this.resolveCanonicalTurnCount(session),
      ...(session.lastEventId ? { lastEventId: session.lastEventId } : {}),
    };
  }

  /**
   * Converts one in-memory event into its durable append-only representation.
   * @param sessionId Owning session id.
   * @param event Session event payload.
   * @returns Durable event record.
   */
  private toSessionEventRecord(sessionId: string, event: SessionEvent): SharedSessionEventRecord {
    const eventIndex = event.eventIndex ?? 1;
    const payloadTurnIndex = this.readOptionalNumberField(
      event.payload.turnIndex,
      'event.payload.turnIndex',
    );
    const resolvedTurnIndex = event.turnIndex ?? payloadTurnIndex;

    return {
      schemaVersion: SESSION_EVENT_SCHEMA_VERSION,
      sessionId,
      eventId: event.eventId,
      eventIndex,
      type: event.type,
      createdAt: event.createdAt,
      payload: {
        ...event.payload,
      },
      ...(resolvedTurnIndex !== undefined ? { turnIndex: resolvedTurnIndex } : {}),
    };
  }

  /**
   * Builds one derived diagnostic record when an event carries replay/debug detail worth indexing.
   * @param sessionId Session identifier.
   * @param event Event payload.
   * @returns Diagnostic record, or undefined when the event carries no diagnostic detail.
   */
  private buildSessionDiagnosticRecord(
    sessionId: string,
    event: SessionEvent,
  ): SharedSessionDiagnosticRecord | undefined {
    const eventIndex = event.eventIndex ?? 1;
    const turnIndex =
      event.turnIndex ??
      this.readOptionalNumberField(event.payload.turnIndex, 'event.payload.turnIndex');
    const executionDetailsLines = this.readOptionalStringArray(
      event.payload.executionDetailsLines,
      'event.payload.executionDetailsLines',
    );
    const errorCode = this.readOptionalStringField(
      event.payload.errorCode,
      'event.payload.errorCode',
    );
    const errorMessage = this.readOptionalStringField(
      event.payload.errorMessage,
      'event.payload.errorMessage',
    );
    const errorDetail = this.readOptionalStringField(
      event.payload.errorDetail,
      'event.payload.errorDetail',
    );

    if (!executionDetailsLines && !errorCode && !errorMessage && !errorDetail) {
      return undefined;
    }

    const category =
      errorCode || errorMessage
        ? SESSION_DIAGNOSTIC_CATEGORY_FAILURE
        : event.type === 'session.turn.completed' || event.type === 'session.turn.cancelled'
          ? SESSION_DIAGNOSTIC_CATEGORY_TERMINAL
          : SESSION_DIAGNOSTIC_CATEGORY_EXECUTION_DETAILS;

    return {
      schemaVersion: SESSION_DIAGNOSTIC_SCHEMA_VERSION,
      sessionId,
      diagnosticId: `diagnostic-${String(eventIndex)}`,
      eventIndex,
      ...(turnIndex !== undefined ? { turnIndex } : {}),
      category,
      createdAt: event.createdAt,
      detail: {
        eventType: event.type,
        ...(executionDetailsLines ? { executionDetailsLines: [...executionDetailsLines] } : {}),
        ...(errorCode ? { errorCode } : {}),
        ...(errorMessage ? { errorMessage } : {}),
        ...(errorDetail ? { errorDetail } : {}),
      },
    };
  }

  /**
   * Resolves canonical turn count using summary metadata first and submitted-turn events as fallback.
   * @param session Session payload.
   * @returns Canonical turn count.
   */
  private resolveCanonicalTurnCount(session: SharedSession): number {
    if (
      typeof session.turnCount === 'number' &&
      Number.isInteger(session.turnCount) &&
      session.turnCount >= 0
    ) {
      return session.turnCount;
    }

    return this.resolveTurnCountFromEvents(session.events);
  }

  /**
   * Counts submitted turns from event log payload as the monotonic turn anchor.
   * @param events Session events.
   * @returns Canonical turn count derived from event log.
   */
  private resolveTurnCountFromEvents(events: SessionEvent[]): number {
    let highestTurnIndex = 0;

    for (const event of events) {
      if (event.type !== SESSION_TURN_SUBMITTED_EVENT_TYPE) {
        continue;
      }

      const candidateTurnIndex =
        event.turnIndex ??
        this.readOptionalNumberField(event.payload.turnIndex, 'event.payload.turnIndex') ??
        0;
      highestTurnIndex = Math.max(highestTurnIndex, candidateTurnIndex);
    }

    if (highestTurnIndex > 0) {
      return highestTurnIndex;
    }

    return events.filter((event) => event.type === SESSION_TURN_SUBMITTED_EVENT_TYPE).length;
  }

  /**
   * Resolves the submitted turn index while preventing turn counter rewind.
   * @param options Candidate event context.
   * @returns Canonical turn index for submitted turns, or undefined for non-submitted events.
   */
  private resolveSubmittedTurnIndex(options: {
    eventType: string;
    payload: Record<string, unknown>;
    currentTurnCount: number;
  }): number | undefined {
    if (options.eventType !== SESSION_TURN_SUBMITTED_EVENT_TYPE) {
      return this.readOptionalNumberField(options.payload.turnIndex, 'payload.turnIndex');
    }

    const payloadTurnIndex = this.readOptionalNumberField(
      options.payload.turnIndex,
      'payload.turnIndex',
    );
    return Math.max(options.currentTurnCount + 1, payloadTurnIndex ?? options.currentTurnCount + 1);
  }

  /**
   * Creates one stable append-only event key prefix for memory queries.
   * @param sessionId Session id.
   * @returns Event key prefix.
   */
  private createSessionEventKeyPrefix(sessionId: string): string {
    return `${sessionId}:${SESSION_EVENT_KEY_SEGMENT}:`;
  }

  /**
   * Creates one stable event storage key including padded event index.
   * @param sessionId Session id.
   * @param eventIndex Event index.
   * @param eventId Event id.
   * @returns Event storage key.
   */
  private createSessionEventStorageKey(
    sessionId: string,
    eventIndex: number,
    eventId: string,
  ): string {
    return `${this.createSessionEventKeyPrefix(sessionId)}${this.padEventIndex(eventIndex)}:${eventId}`;
  }

  /**
   * Creates one stable diagnostic storage key tied to event index.
   * @param sessionId Session id.
   * @param eventIndex Event index.
   * @param diagnosticId Diagnostic identifier.
   * @returns Diagnostic storage key.
   */
  private createSessionDiagnosticStorageKey(
    sessionId: string,
    eventIndex: number,
    diagnosticId: string,
  ): string {
    return `${sessionId}:${SESSION_DIAGNOSTIC_KEY_SEGMENT}:${this.padEventIndex(eventIndex)}:${diagnosticId}`;
  }

  /**
   * Pads event index to keep lexicographic ordering stable across providers.
   * @param eventIndex Event index.
   * @returns Padded index string.
   */
  private padEventIndex(eventIndex: number): string {
    return String(eventIndex).padStart(SESSION_EVENT_INDEX_PAD_WIDTH, '0');
  }

  /**
   * Resolves summary-row updatedAt from terminal/session-event timestamps first.
   * @param session Session payload.
   * @returns Timestamp used for summary persistence ordering.
   */
  private resolveSessionSummaryUpdatedAt(session: SharedSession): string {
    return session.closedAt ?? new Date().toISOString();
  }

  /**
   * Returns a detached copy of one session payload.
   * @param session Session payload.
   * @returns Cloned payload.
   */
  private cloneSession(session: SharedSession): SharedSession {
    return {
      ...session,
      context: {
        ...session.context,
      },
      events: session.events.map((event) => ({
        ...event,
        payload: {
          ...event.payload,
        },
      })),
      ...(session.eventCount !== undefined ? { eventCount: session.eventCount } : {}),
      ...(session.turnCount !== undefined ? { turnCount: session.turnCount } : {}),
      ...(session.lastEventId ? { lastEventId: session.lastEventId } : {}),
    };
  }

  /**
   * Parses one durable summary record payload.
   * @param payload Raw summary payload.
   * @param sessionId Expected session id.
   * @returns Parsed summary record.
   */
  private parseSessionSummaryRecord(
    payload: Record<string, unknown>,
    sessionId: string,
  ): SharedSessionSummaryRecord {
    const parsedSessionId = this.readStringField(payload.sessionId, 'sessionId');
    const parsedStatus = this.readStringField(payload.status, 'status');
    const parsedOpenedAt = this.readStringField(payload.openedAt, 'openedAt');
    const parsedClosedAt = this.readOptionalStringField(payload.closedAt, 'closedAt');
    const parsedProcessId = this.readOptionalStringField(payload.processId, 'processId');
    const parsedExecutionId = this.readOptionalStringField(payload.executionId, 'executionId');
    const parsedContext = this.readRecordField(payload.context, 'context');
    const eventCount = this.readNonNegativeIntegerField(payload.eventCount, 'eventCount');
    const turnCount = this.readNonNegativeIntegerField(payload.turnCount, 'turnCount');
    const lastEventId = this.readOptionalStringField(payload.lastEventId, 'lastEventId');

    if (parsedSessionId !== sessionId) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session payload key mismatch for session "${sessionId}".`,
        {
          expected: sessionId,
          actual: parsedSessionId,
        },
      );
    }

    if (!SESSION_STATUS_VALUES.has(parsedStatus)) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session "${sessionId}" has unsupported status value.`,
        {
          sessionId,
          status: parsedStatus,
        },
      );
    }

    return {
      schemaVersion: SESSION_SUMMARY_SCHEMA_VERSION,
      sessionId: parsedSessionId,
      status: parsedStatus as SessionStatus,
      openedAt: parsedOpenedAt,
      ...(parsedClosedAt ? { closedAt: parsedClosedAt } : {}),
      ...(parsedProcessId ? { processId: parsedProcessId } : {}),
      ...(parsedExecutionId ? { executionId: parsedExecutionId } : {}),
      context: parsedContext,
      eventCount,
      turnCount,
      ...(lastEventId ? { lastEventId } : {}),
    };
  }

  /**
   * Parses one durable append-only event payload.
   * @param payload Raw event payload.
   * @param sessionId Expected session id.
   * @returns Parsed event record.
   */
  private parseSessionEventRecord(
    payload: Record<string, unknown>,
    sessionId: string,
  ): SharedSessionEventRecord {
    const parsedSessionId = this.readStringField(payload.sessionId, 'sessionId');
    if (parsedSessionId !== sessionId) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session event payload key mismatch for session "${sessionId}".`,
        {
          expected: sessionId,
          actual: parsedSessionId,
        },
      );
    }

    return {
      schemaVersion: SESSION_EVENT_SCHEMA_VERSION,
      sessionId: parsedSessionId,
      eventId: this.readStringField(payload.eventId, 'eventId'),
      eventIndex: this.readNonNegativeIntegerField(payload.eventIndex, 'eventIndex'),
      type: this.readStringField(payload.type, 'type'),
      createdAt: this.readStringField(payload.createdAt, 'createdAt'),
      payload: this.readRecordField(payload.payload, 'payload'),
      ...(this.readOptionalNumberField(payload.turnIndex, 'turnIndex') !== undefined
        ? { turnIndex: this.readOptionalNumberField(payload.turnIndex, 'turnIndex') }
        : {}),
    };
  }

  /**
   * Parses legacy blob payload used before append-only session storage cutover.
   * @param payload Raw legacy payload.
   * @param sessionId Expected session id.
   * @returns Parsed legacy session payload.
   */
  private parseLegacySharedSessionPayload(
    payload: Record<string, unknown>,
    sessionId: string,
  ): SharedSession {
    const parsedSessionId = this.readStringField(payload.sessionId, 'sessionId');
    const parsedStatus = this.readStringField(payload.status, 'status');
    const parsedOpenedAt = this.readStringField(payload.openedAt, 'openedAt');
    const parsedClosedAt = this.readOptionalStringField(payload.closedAt, 'closedAt');
    const parsedProcessId = this.readOptionalStringField(payload.processId, 'processId');
    const parsedExecutionId = this.readOptionalStringField(payload.executionId, 'executionId');
    const parsedContext = this.readRecordField(payload.context, 'context');
    const parsedEvents = this.readLegacySessionEvents(payload.events, 'events');

    if (parsedSessionId !== sessionId) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session payload key mismatch for session "${sessionId}".`,
        {
          expected: sessionId,
          actual: parsedSessionId,
        },
      );
    }

    if (!SESSION_STATUS_VALUES.has(parsedStatus)) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session "${sessionId}" has unsupported status value.`,
        {
          sessionId,
          status: parsedStatus,
        },
      );
    }

    return {
      sessionId: parsedSessionId,
      status: parsedStatus as SessionStatus,
      openedAt: parsedOpenedAt,
      ...(parsedClosedAt ? { closedAt: parsedClosedAt } : {}),
      ...(parsedProcessId ? { processId: parsedProcessId } : {}),
      ...(parsedExecutionId ? { executionId: parsedExecutionId } : {}),
      context: parsedContext,
      events: parsedEvents.map((event, index) => ({
        ...event,
        eventIndex: index + 1,
        ...(this.readOptionalNumberField(event.payload.turnIndex, 'event.payload.turnIndex') !==
        undefined
          ? {
              turnIndex: this.readOptionalNumberField(
                event.payload.turnIndex,
                'event.payload.turnIndex',
              ),
            }
          : {}),
      })),
      eventCount: parsedEvents.length,
      turnCount: this.resolveTurnCountFromEvents(parsedEvents),
      lastEventId: parsedEvents.at(-1)?.eventId,
    };
  }

  /**
   * Detects the new summary-record payload shape.
   * @param payload Candidate payload.
   * @returns Whether payload matches the new summary record schema.
   */
  private isSummaryRecordPayload(payload: Record<string, unknown>): boolean {
    return payload.schemaVersion === SESSION_SUMMARY_SCHEMA_VERSION;
  }

  /**
   * Detects legacy session blob payload shape.
   * @param payload Candidate payload.
   * @returns Whether payload still matches the legacy blob contract.
   */
  private isLegacySessionPayload(payload: Record<string, unknown>): boolean {
    return Array.isArray(payload.events);
  }

  /**
   * Validates session is active before mutating operations.
   * @param session Session payload.
   * @returns Void.
   */
  private assertSessionActiveOrThrow(session: SharedSession): void {
    if (session.status === SessionStatus.ACTIVE) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_ALREADY_CLOSED,
      `Session "${session.sessionId}" is already closed.`,
      {
        sessionId: session.sessionId,
        status: session.status,
      },
    );
  }

  /**
   * Reads required string field from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed string value.
   */
  private readStringField(candidate: unknown, fieldName: string): string {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session payload field "${fieldName}" must be a non-empty string.`,
      { fieldName },
    );
  }

  /**
   * Reads optional string field from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed string value or undefined.
   */
  private readOptionalStringField(candidate: unknown, fieldName: string): string | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session payload field "${fieldName}" must be a non-empty string when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads one optional string array from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed array or undefined.
   */
  private readOptionalStringArray(candidate: unknown, fieldName: string): string[] | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (!Array.isArray(candidate) || candidate.some((item) => typeof item !== 'string')) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session payload field "${fieldName}" must be a string array when provided.`,
        { fieldName },
      );
    }

    return [...candidate];
  }

  /**
   * Reads one record field from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed record.
   */
  private readRecordField(candidate: unknown, fieldName: string): Record<string, unknown> {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session payload field "${fieldName}" must be an object.`,
      { fieldName },
    );
  }

  /**
   * Reads one non-negative integer field from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed non-negative integer.
   */
  private readNonNegativeIntegerField(candidate: unknown, fieldName: string): number {
    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session payload field "${fieldName}" must be a non-negative integer.`,
      {
        fieldName,
        value: candidate,
      },
    );
  }

  /**
   * Reads one optional integer field from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed integer or undefined.
   */
  private readOptionalNumberField(candidate: unknown, fieldName: string): number | undefined {
    if (candidate === undefined) {
      return undefined;
    }

    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session payload field "${fieldName}" must be a non-negative integer when provided.`,
      {
        fieldName,
        value: candidate,
      },
    );
  }

  /**
   * Reads session event array from legacy blob payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed session events.
   */
  private readLegacySessionEvents(candidate: unknown, fieldName: string): SessionEvent[] {
    if (!Array.isArray(candidate)) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session payload field "${fieldName}" must be an array.`,
        { fieldName },
      );
    }

    return candidate.map((eventCandidate, eventIndex) => {
      if (!eventCandidate || typeof eventCandidate !== 'object' || Array.isArray(eventCandidate)) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
          'Session event item must be an object.',
          {
            fieldName,
            eventIndex,
          },
        );
      }

      const eventRecord = eventCandidate as Record<string, unknown>;
      const eventPayload = this.readRecordField(eventRecord.payload, 'event.payload');
      return {
        eventId: this.readStringField(eventRecord.eventId, 'event.eventId'),
        type: this.readStringField(eventRecord.type, 'event.type'),
        createdAt: this.readStringField(eventRecord.createdAt, 'event.createdAt'),
        payload: eventPayload,
      };
    });
  }
}
