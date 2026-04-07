/**
 * Defines one persisted provider-owned continuation handle stored in shared-session context.
 */
export interface SessionProviderContinuationHandle {
  providerId: string;
  surface: string;
  transportKind: string;
  handleKind: string;
  value: string;
  model?: string | null;
  acquiredAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Defines one lane-scoped provider continuation slot owned by the shared session.
 */
export interface SessionProviderContinuationSlot {
  laneKey: string;
  routeId: string;
  stageId: string;
  roleId: string | null;
  selectedSurface: string;
  providerId: string;
  transportKind: string;
  model: string | null;
  policyEnvelope: string;
  workspaceRoot: string;
  currentWorkingDirectory: string;
  handle: SessionProviderContinuationHandle;
  updatedAt: string;
}

/**
 * Defines the persisted shared-session state that owns all provider continuation slots.
 */
export interface SessionProviderContinuationSessionState {
  version: 1;
  slots: Record<string, SessionProviderContinuationSlot>;
}

/**
 * Defines one presenter-safe continuation summary projected out of a completed turn.
 */
export interface SessionProviderContinuationSummary {
  laneKey: string;
  laneLabel: string;
  status: string;
  surface: string;
  providerId: string;
  transportKind: string;
  model?: string | null;
  stageId: string;
  roleId: string | null;
  policyEnvelope: string;
  invalidationReason?: string;
  lightweightSessionFallbackApplied?: boolean;
}

/**
 * Defines one session-owned slot mutation derived from adapter continuation output.
 */
export interface SessionProviderContinuationMutation {
  laneKey: string;
  slot?: SessionProviderContinuationSlot;
  summary: SessionProviderContinuationSummary;
}
