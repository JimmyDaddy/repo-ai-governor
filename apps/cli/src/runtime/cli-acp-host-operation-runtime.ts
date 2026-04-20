import type {
  AgentCancelRequest,
  AgentCancelResult,
  AgentConfirmationRequest,
  AgentConfirmationResult,
} from '@repo-ai-governor/adapter-sdk';
import { AgentCancellationReason, AgentCancellationScope } from '@repo-ai-governor/adapter-sdk';
import type { AdapterSurface } from '@repo-ai-governor/shared';
import type { CliAcpSessionRuntime } from './cli-acp-session-runtime.js';
import type { CliAcpTransportClientRuntime } from './cli-acp-transport-client-runtime.js';

/**
 * Owns ACP host-operation bridging such as confirmation and future terminal/filesystem cleanup.
 */
export class CliAcpHostOperationRuntime {
  public constructor(
    private readonly options: {
      surfaceId: AdapterSurface;
      localizeText: (english: string, chinese: string) => string;
      sessionRuntime: CliAcpSessionRuntime;
      transportClientRuntime: CliAcpTransportClientRuntime;
    },
  ) {}

  /**
   * Bridges one host-facing confirmation request into the ACP permission seam when supported.
   * @param request Confirmation payload.
   * @returns Confirmation result once ACP permission bridging is enabled.
   */
  public async requestConfirmation(
    request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    return await this.options.transportClientRuntime.requestPermission({
      surfaceId: this.options.surfaceId,
      request,
      invocationState: this.options.sessionRuntime.findInvocationStateForConfirmation(
        this.options.surfaceId,
        request,
      ),
      localizeText: this.options.localizeText,
    });
  }

  /**
   * Cancels one active shared ACP prompt turn when the request resolves to a live invocation.
   * @param request Cancellation payload.
   * @returns Cancellation acknowledgement payload.
   */
  public async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    return await this.options.transportClientRuntime.cancelPromptTurn({
      surfaceId: this.options.surfaceId,
      request: {
        ...request,
        scope: request.scope ?? AgentCancellationScope.AGENT,
        reason: request.reason ?? AgentCancellationReason.SYSTEM_GUARD,
      },
      invocationState: this.options.sessionRuntime.findInvocationState(
        this.options.surfaceId,
        request,
      ),
      localizeText: this.options.localizeText,
    });
  }
}
