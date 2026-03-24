import { randomUUID } from "node:crypto";

import { type MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { SessionStatus } from "./constants/index.js";
import type {
  AppendSessionEventOptions,
  FinalizeSessionOptions,
  ListSharedSessionsOptions,
  OpenSharedSessionOptions,
  SessionEvent,
  SharedSession,
  UpdateSessionContextOptions,
} from "./types/index.js";

const SESSION_TAG = "session";
const SESSION_STATUS_VALUES = new Set<string>(Object.values(SessionStatus));

/**
 * Manages shared session lifecycle and persistence through core-memory.
 *
 * Why this exists:
 * multiple agents should collaborate on one consistent session payload so runtime,
 * policy, and audit modules can reuse stable session semantics.
 */
export class SharedSessionManager {
  constructor(private readonly memoryManager: MemoryManager) {}

  /**
   * Opens an active shared session or returns existing active session by id.
   * @param options Open-session options.
   * @returns Active shared session payload.
   */
  public async openSession(options: OpenSharedSessionOptions = {}): Promise<SharedSession> {
    const resolvedSessionId = options.sessionId ?? randomUUID();
    const existingRecord = await this.memoryManager.readEntry({
      scope: MemoryScope.SESSION,
      key: resolvedSessionId,
    });

    if (existingRecord) {
      const existingSession = this.parseSharedSessionPayload(
        existingRecord.value,
        resolvedSessionId,
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

      return existingSession;
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
    };
    await this.persistSession(openedSession);

    return openedSession;
  }

  /**
   * Reads one session payload by session id.
   * @param sessionId Session id.
   * @returns Session payload.
   */
  public async getSession(sessionId: string): Promise<SharedSession> {
    const sessionRecord = await this.memoryManager.readEntry({
      scope: MemoryScope.SESSION,
      key: sessionId,
    });

    if (!sessionRecord) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
        `Session "${sessionId}" was not found in memory store.`,
        { sessionId },
      );
    }

    return this.parseSharedSessionPayload(sessionRecord.value, sessionId);
  }

  /**
   * Appends one event to active session event stream.
   * @param options Append-event options.
   * @returns Updated shared session payload.
   */
  public async appendEvent(options: AppendSessionEventOptions): Promise<SharedSession> {
    const session = await this.getSession(options.sessionId);
    this.assertSessionActiveOrThrow(session);

    const appendedEvent: SessionEvent = {
      eventId: options.eventId ?? randomUUID(),
      type: options.type,
      createdAt: options.createdAt ?? new Date().toISOString(),
      payload: options.payload ?? {},
    };

    const updatedSession: SharedSession = {
      ...session,
      events: [...session.events, appendedEvent],
    };
    await this.persistSession(updatedSession);

    return updatedSession;
  }

  /**
   * Merges one context patch into active session context.
   * @param options Context update options.
   * @returns Updated shared session payload.
   */
  public async updateContext(options: UpdateSessionContextOptions): Promise<SharedSession> {
    const session = await this.getSession(options.sessionId);
    this.assertSessionActiveOrThrow(session);

    const updatedSession: SharedSession = {
      ...session,
      context: {
        ...session.context,
        ...options.contextPatch,
      },
    };
    await this.persistSession(updatedSession);

    return updatedSession;
  }

  /**
   * Finalizes one active session with terminal status.
   * @param options Finalize-session options.
   * @returns Finalized shared session payload.
   */
  public async finalizeSession(options: FinalizeSessionOptions): Promise<SharedSession> {
    const session = await this.getSession(options.sessionId);
    this.assertSessionActiveOrThrow(session);

    const nextStatus = options.status ?? SessionStatus.COMPLETED;
    if (nextStatus === SessionStatus.ACTIVE) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_INVALID_STATUS,
        "Finalize session requires terminal status (completed/cancelled/failed).",
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
    await this.persistSession(finalizedSession);

    return finalizedSession;
  }

  /**
   * Lists sessions with optional status filter and limit.
   * @param options Session-list options.
   * @returns Session payloads.
   */
  public async listSessions(options: ListSharedSessionsOptions = {}): Promise<SharedSession[]> {
    const records = await this.memoryManager.queryEntries({
      scope: MemoryScope.SESSION,
      limit: options.limit,
    });

    const sessions = records.map((record) =>
      this.parseSharedSessionPayload(record.value, record.key),
    );
    if (!options.status) {
      return sessions;
    }

    return sessions.filter((session) => session.status === options.status);
  }

  /**
   * Persists one session payload back to memory layer.
   * @param session Session payload.
   * @returns Void.
   */
  private async persistSession(session: SharedSession): Promise<void> {
    await this.memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: session.sessionId,
      payload: session as unknown as Record<string, unknown>,
      tags: [
        SESSION_TAG,
        `status:${session.status}`,
        ...(session.executionId ? [`execution:${session.executionId}`] : []),
        ...(session.processId ? [`process:${session.processId}`] : []),
      ],
    });
  }

  /**
   * Parses unknown payload into typed shared session contract.
   * @param payload Raw memory payload.
   * @param sessionId Expected session id for diagnostics.
   * @returns Parsed shared session payload.
   */
  private parseSharedSessionPayload(
    payload: Record<string, unknown>,
    sessionId: string,
  ): SharedSession {
    const parsedSessionId = this.readStringField(payload.sessionId, "sessionId");
    const parsedStatus = this.readStringField(payload.status, "status");
    const parsedOpenedAt = this.readStringField(payload.openedAt, "openedAt");
    const parsedClosedAt = this.readOptionalStringField(payload.closedAt, "closedAt");
    const parsedProcessId = this.readOptionalStringField(payload.processId, "processId");
    const parsedExecutionId = this.readOptionalStringField(payload.executionId, "executionId");
    const parsedContext = this.readRecordField(payload.context, "context");
    const parsedEvents = this.readSessionEvents(payload.events, "events");

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
      events: parsedEvents,
    };
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
    if (typeof candidate === "string" && candidate.length > 0) {
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

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session payload field "${fieldName}" must be a non-empty string when provided.`,
      { fieldName },
    );
  }

  /**
   * Reads record field from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed record.
   */
  private readRecordField(candidate: unknown, fieldName: string): Record<string, unknown> {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Session payload field "${fieldName}" must be an object.`,
      { fieldName },
    );
  }

  /**
   * Reads session event array from unknown payload.
   * @param candidate Candidate value.
   * @param fieldName Field name for diagnostics.
   * @returns Parsed session events.
   */
  private readSessionEvents(candidate: unknown, fieldName: string): SessionEvent[] {
    if (!Array.isArray(candidate)) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        `Session payload field "${fieldName}" must be an array.`,
        { fieldName },
      );
    }

    return candidate.map((eventCandidate, eventIndex) => {
      if (!eventCandidate || typeof eventCandidate !== "object" || Array.isArray(eventCandidate)) {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
          "Session event item must be an object.",
          {
            fieldName,
            eventIndex,
          },
        );
      }

      const eventRecord = eventCandidate as Record<string, unknown>;
      const eventPayload = this.readRecordField(eventRecord.payload, "event.payload");
      return {
        eventId: this.readStringField(eventRecord.eventId, "event.eventId"),
        type: this.readStringField(eventRecord.type, "event.type"),
        createdAt: this.readStringField(eventRecord.createdAt, "event.createdAt"),
        payload: eventPayload,
      };
    });
  }
}
