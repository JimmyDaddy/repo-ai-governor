import type { SessionStatus } from "../../constants/index.js";

/**
 * Defines one session event appended during execution.
 */
export interface SessionEvent {
  eventId: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
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
