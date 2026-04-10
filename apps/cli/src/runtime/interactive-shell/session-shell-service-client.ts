import {
  ORCHESTRATION_SESSION_DISPLAY_USER_MESSAGE_METADATA_KEY,
  OrchestrationSessionRouteId,
} from '@repo-ai-governor/orchestration-service-client';
import type {
  OrchestrationAppendSessionMessageResponse,
  OrchestrationArchiveSessionResponse,
  OrchestrationForkSessionResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationResumeSessionResponse,
  OrchestrationSessionTranscriptRole,
  OrchestrationStartSessionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
  OrchestrationUnarchiveSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import { DEFAULT_I18N_FALLBACK_LOCALE } from '@repo-ai-governor/shared';
import type { CliOrchestrationServiceRuntime } from '../orchestration-service-runtime.js';

/**
 * Owns the CLI-facing session client surface layered on top of orchestration runtime calls.
 *
 * Why this exists:
 * the session shell should depend on one small client tailored to conversation flows instead of
 * spreading raw orchestration method wiring across the presenter loop.
 */
export class CliSessionShellServiceClient {
  public constructor(
    private readonly orchestrationServiceRuntime: CliOrchestrationServiceRuntime,
    options?: {
      locale?: string;
    },
  ) {
    this.locale = options?.locale ?? DEFAULT_I18N_FALLBACK_LOCALE;
  }

  private readonly locale: string;

  /**
   * Starts a brand-new canonical session owned by the orchestration service.
   * @returns Newly-opened session response.
   */
  public async startSession(): Promise<OrchestrationStartSessionResponse> {
    return this.orchestrationServiceRuntime.startSession({
      routeId: OrchestrationSessionRouteId.MAIN,
    });
  }

  /**
   * Resumes the latest or explicitly requested session through the shared service contract.
   * @param sessionId Optional explicit session id.
   * @returns Resolved session response.
   */
  public async resumeSession(sessionId?: string): Promise<OrchestrationResumeSessionResponse> {
    return this.orchestrationServiceRuntime.resumeSession({
      ...(sessionId ? { sessionId } : {}),
      preferLatest: true,
    });
  }

  /**
   * Sends one plain-text user turn into the main session route.
   * @param sessionId Canonical session identifier.
   * @param userMessage User-authored message.
   * @returns Turn completion response.
   */
  public async sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ) {
    return this.orchestrationServiceRuntime.sendSessionTurn({
      sessionId,
      routeId: OrchestrationSessionRouteId.MAIN,
      userMessage,
      metadata: {
        locale: this.locale,
        ...(options?.displayUserMessage
          ? {
              [ORCHESTRATION_SESSION_DISPLAY_USER_MESSAGE_METADATA_KEY]:
                options.displayUserMessage,
            }
          : {}),
      },
    });
  }

  /**
   * Persists one non-turn transcript item so CLI and future desktop can resume the same shell notes.
   * @param sessionId Canonical session identifier.
   * @param role Shared transcript role.
   * @param lines Ordered transcript lines.
   * @param metadata Optional structured metadata for later consumers.
   * @returns Append response with the persisted event cursor.
   */
  public async appendMessage(
    sessionId: string,
    role: OrchestrationSessionTranscriptRole,
    lines: string[],
    metadata?: Record<string, unknown>,
  ): Promise<OrchestrationAppendSessionMessageResponse> {
    return this.orchestrationServiceRuntime.appendSessionMessage({
      sessionId,
      role,
      routeId: OrchestrationSessionRouteId.MAIN,
      lines,
      ...(metadata ? { metadata } : {}),
    });
  }

  /**
   * Streams one incremental session delta using the shared subscribe cursor contract.
   * @param request Session-subscribe request.
   * @returns Incremental transcript events.
   */
  public async subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse> {
    return this.orchestrationServiceRuntime.subscribeSession(request);
  }

  /**
   * Lists resumable sessions for palette or command-level selectors.
   * @param request Optional filter/limit request.
   * @returns Session summary list.
   */
  public async listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse> {
    return this.orchestrationServiceRuntime.listSessions(request);
  }

  /**
   * Forks the current or named session into a new active branch session.
   * @param sourceSessionId Existing canonical session identifier.
   * @param displayName Optional branch display label.
   * @returns Newly-created fork session response.
   */
  public async forkSession(
    sourceSessionId: string,
    displayName?: string,
  ): Promise<OrchestrationForkSessionResponse> {
    return this.orchestrationServiceRuntime.forkSession({
      sourceSessionId,
      ...(displayName ? { displayName } : {}),
    });
  }

  /**
   * Archives one active session so it no longer appears in default resume flows.
   * @param sessionId Canonical session identifier.
   * @param archiveReasonSummary Optional operator-facing archive note.
   * @returns Archive receipt.
   */
  public async archiveSession(
    sessionId: string,
    archiveReasonSummary?: string,
  ): Promise<OrchestrationArchiveSessionResponse> {
    return this.orchestrationServiceRuntime.archiveSession({
      sessionId,
      ...(archiveReasonSummary ? { archiveReasonSummary } : {}),
    });
  }

  /**
   * Restores one archived session to active status.
   * @param sessionId Canonical session identifier.
   * @returns Unarchive receipt.
   */
  public async unarchiveSession(sessionId: string): Promise<OrchestrationUnarchiveSessionResponse> {
    return this.orchestrationServiceRuntime.unarchiveSession({
      sessionId,
    });
  }
}
