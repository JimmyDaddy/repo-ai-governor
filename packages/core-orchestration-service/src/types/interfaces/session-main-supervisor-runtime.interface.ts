import type {
  SessionMainHandoffExecutionMode,
  SessionMainInteractionMode,
  SessionMainResponseMode,
} from '../aliases/index.js';

/**
 * Defines one structured backlink returned by the `session.main` supervisor.
 */
export interface SessionMainSupervisorTurnBacklink {
  kind: 'slash_command' | 'execution_intent' | 'command_preview' | 'artifact';
  label: string;
  target: string;
}

/**
 * Defines one executable step projected from a natural-language foreground skill plan.
 */
export interface SessionMainSupervisorCommandBatch {
  slashQuery: string;
  bridgeArgv: string[];
  previewCommandLine: string;
}

/**
 * Defines one progressive stream event emitted while the supervisor is still resolving a turn.
 */
export interface SessionMainSupervisorStreamEvent {
  kind: 'lifecycle' | 'token' | 'tool_call';
  state?: 'started' | 'running' | 'completed' | 'failed';
  title?: string;
  detail?: string;
  activityKey?: string;
  chunkText?: string;
  accumulatedText?: string;
  roleId?: string;
  stageId?: string;
  routeKey?: string;
  selectedSurface?: string;
  selectedBy?: string;
  toolName?: string;
  toolCallId?: string;
}

/**
 * Defines one invoked role descriptor preserved in shared session truth for future remote bridges.
 */
export interface SessionMainSupervisorInvokedRole {
  roleId: string;
  roleProfileId: string;
  agentId: string;
  selectedSurface?: string;
  selectedBy?: string;
  dispatchBoundary: 'local_projection' | 'remote_bridge_reserved';
  transportKind: 'local_protocol' | 'a2a_reserved';
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
  publishStreamEvent?: (event: SessionMainSupervisorStreamEvent) => Promise<void>;
}

/**
 * Defines one structured supervisor outcome written back into the shared session turn payload.
 */
export interface SessionMainSupervisorTurnOutcome {
  responseMode: SessionMainResponseMode;
  interactionMode: SessionMainInteractionMode;
  assistantDelta: string;
  assistantMessage?: string;
  executionDetailsLines?: string[];
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
  invokedRoles?: SessionMainSupervisorInvokedRole[];
  subagentCount?: number;
  skillId?: string;
  skillVersion?: string;
  handoffExecutionMode?: SessionMainHandoffExecutionMode;
  commandBatches?: SessionMainSupervisorCommandBatch[];
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
