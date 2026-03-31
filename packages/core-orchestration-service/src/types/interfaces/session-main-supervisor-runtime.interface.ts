import type { SessionMainInteractionMode, SessionMainResponseMode } from '../aliases/index.js';

/**
 * Defines one structured backlink returned by the `session.main` supervisor.
 */
export interface SessionMainSupervisorTurnBacklink {
  kind: 'slash_command' | 'execution_intent' | 'command_preview' | 'artifact';
  label: string;
  target: string;
}

/**
 * Defines the service-owned turn context handed to the `session.main` supervisor runtime.
 */
export interface SessionMainSupervisorTurnContext {
  sessionId: string;
  routeId: string;
  turnId: string;
  turnIndex: number;
  userMessage: string;
  selectedSurface: string;
  selectedBy: string;
  sessionRoutingPreferenceApplied: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Defines one structured supervisor outcome written back into the shared session turn payload.
 */
export interface SessionMainSupervisorTurnOutcome {
  responseMode: SessionMainResponseMode;
  interactionMode: SessionMainInteractionMode;
  assistantDelta: string;
  assistantMessage?: string;
  routerDecisionReason?: string;
  synthesisMode?: string;
  suggestedSlashCommand?: string;
  executionIntent?: string;
  followUpQuestion?: string;
  requiresConfirmation: boolean;
  selectedSurface: string;
  selectedBy: string;
  sessionRoutingPreferenceApplied: boolean;
  invokedRoleIds?: string[];
  subagentCount?: number;
  handoffCommandPreview?: string;
  handoffBacklinks?: SessionMainSupervisorTurnBacklink[];
}

/**
 * Defines the optional service-side runtime seam used by `session.main` supervisor bootstrap.
 */
export interface SessionMainSupervisorRuntimeContract {
  /**
   * Resolves one configured explicit role mention from the raw user message when supported.
   * @param userMessage Raw session.main user text.
   * @returns Normalized role id when one configured role mention is present.
   */
  resolveMentionedRoleId?(userMessage: string): string | null;

  /**
   * Resolves one foreground `session.main` turn into a structured supervisor outcome.
   * @param context Service-owned turn context.
   * @returns Structured supervisor outcome.
   */
  resolveTurn(context: SessionMainSupervisorTurnContext): Promise<SessionMainSupervisorTurnOutcome>;
}
