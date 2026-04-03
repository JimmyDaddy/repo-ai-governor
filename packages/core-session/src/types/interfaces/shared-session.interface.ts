import type { SessionStatus } from '../../constants/index.js';

/**
 * Defines one session event appended during execution.
 */
export interface SessionEvent {
  eventId: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
  eventIndex?: number;
  turnIndex?: number;
}

/**
 * Defines shared execution session payload persisted in memory layer.
 */
export interface SharedSession {
  sessionId: string;
  status: SessionStatus;
  openedAt: string;
  closedAt?: string;
  processId?: string;
  executionId?: string;
  context: Record<string, unknown>;
  events: SessionEvent[];
  eventCount?: number;
  turnCount?: number;
  lastEventId?: string;
}

/**
 * Defines one summary record persisted for session durable truth.
 */
export interface SharedSessionSummaryRecord {
  schemaVersion: 'shared-session-summary.v1';
  sessionId: string;
  status: SessionStatus;
  openedAt: string;
  closedAt?: string;
  processId?: string;
  executionId?: string;
  context: Record<string, unknown>;
  eventCount: number;
  turnCount: number;
  lastEventId?: string;
}

/**
 * Defines one append-only event record persisted for session replay.
 */
export interface SharedSessionEventRecord {
  schemaVersion: 'shared-session-event.v1';
  sessionId: string;
  eventId: string;
  eventIndex: number;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
  turnIndex?: number;
}

/**
 * Defines one persisted diagnostic/projection record derived from terminal session events.
 */
export interface SharedSessionDiagnosticRecord {
  schemaVersion: 'shared-session-diagnostic.v1';
  sessionId: string;
  diagnosticId: string;
  eventIndex: number;
  turnIndex?: number;
  category: string;
  createdAt: string;
  detail: Record<string, unknown>;
}

/**
 * Defines session-open request payload.
 */
export interface OpenSharedSessionOptions {
  sessionId?: string;
  processId?: string;
  executionId?: string;
  initialContext?: Record<string, unknown>;
  openedAt?: string;
}

/**
 * Defines append-event request payload.
 */
export interface AppendSessionEventOptions {
  sessionId: string;
  type: string;
  payload?: Record<string, unknown>;
  eventId?: string;
  createdAt?: string;
}

/**
 * Defines context-update request payload.
 */
export interface UpdateSessionContextOptions {
  sessionId: string;
  contextPatch: Record<string, unknown>;
}

/**
 * Defines lock-scoped context-update request payload built from the latest persisted context.
 */
export interface UpdateSessionContextWithLatestOptions {
  sessionId: string;
  contextPatchBuilder: (currentContext: Record<string, unknown>) => Record<string, unknown> | null;
}

/**
 * Defines finalize-session request payload.
 */
export interface FinalizeSessionOptions {
  sessionId: string;
  status?: SessionStatus;
  closedAt?: string;
}

/**
 * Defines session-list query request payload.
 */
export interface ListSharedSessionsOptions {
  status?: SessionStatus;
  limit?: number;
}
