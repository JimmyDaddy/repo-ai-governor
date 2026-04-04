import { OrchestrationSessionRouteId } from '@repo-ai-governor/orchestration-service-client';
import type {
  OrchestrationAppendSessionMessageResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationResumeSessionResponse,
  OrchestrationSendSessionTurnResponse,
  OrchestrationSessionTranscriptRole,
  OrchestrationStartSessionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import { DEFAULT_I18N_FALLBACK_LOCALE } from '@repo-ai-governor/shared';
import type { DesktopOrchestrationServiceRuntime } from './desktop-orchestration-service-runtime.js';

/**
 * Owns the desktop-facing session bridge layered on top of orchestration runtime calls.
 *
 * Why this exists:
 * desktop renderer/preload flows should depend on one small typed session seam instead of
 * wiring raw orchestration methods directly through every panel or controller.
 */
export class DesktopSessionBridge {
  private readonly locale: string;

  public constructor(
    private readonly orchestrationServiceRuntime: DesktopOrchestrationServiceRuntime,
    options?: {
      locale?: string;
    },
  ) {
    this.locale = options?.locale ?? DEFAULT_I18N_FALLBACK_LOCALE;
  }

  /**
   * Starts a canonical desktop session owned by the orchestration service.
   * @returns Newly-opened session response.
   */
  public async startSession(): Promise<OrchestrationStartSessionResponse> {
    return this.orchestrationServiceRuntime.startSession({
      routeId: OrchestrationSessionRouteId.MAIN,
    });
  }

  /**
   * Resumes the latest or explicitly requested desktop session.
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
   * Sends one user-authored turn into the canonical desktop session lane.
   * @param sessionId Canonical session identifier.
   * @param userMessage User-authored message.
   * @returns Turn completion response.
   */
  public async sendMainTurn(
    sessionId: string,
    userMessage: string,
  ): Promise<OrchestrationSendSessionTurnResponse> {
    return this.orchestrationServiceRuntime.sendSessionTurn({
      sessionId,
      routeId: OrchestrationSessionRouteId.MAIN,
      userMessage,
      metadata: {
        locale: this.locale,
      },
    });
  }

  /**
   * Persists one non-turn transcript item so desktop and CLI keep the same session continuity.
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
   * Lists resumable sessions for desktop selectors and lane hydration.
   * @param request Optional filter/limit request.
   * @returns Session summary list.
   */
  public async listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse> {
    return this.orchestrationServiceRuntime.listSessions(request);
  }
}
