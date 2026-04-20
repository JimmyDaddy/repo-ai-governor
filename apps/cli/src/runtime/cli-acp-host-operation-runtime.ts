import type {
  AgentCancelRequest,
  AgentCancelResult,
  AgentConfirmationRequest,
  AgentConfirmationResult,
} from '@repo-ai-governor/adapter-sdk';
import { AgentCancellationReason, AgentCancellationScope } from '@repo-ai-governor/adapter-sdk';
import type { AdapterSurface } from '@repo-ai-governor/shared';
import type { CliAcpTransportClientRuntime } from './cli-acp-transport-client-runtime.js';

/**
 * Owns ACP host-operation bridging such as confirmation and future terminal/filesystem cleanup.
 */
export class CliAcpHostOperationRuntime {
  public constructor(
    private readonly options: {
      surfaceId: AdapterSurface;
      localizeText: (english: string, chinese: string) => string;
      transportClientRuntime: CliAcpTransportClientRuntime;
    },
  ) {}

  /**
   * Bridges one host-facing confirmation request into the ACP permission seam when supported.
   * @param _request Confirmation payload.
   * @returns Confirmation result once ACP permission bridging is enabled.
   */
  public async requestConfirmation(
    _request: AgentConfirmationRequest,
  ): Promise<AgentConfirmationResult> {
    return await this.options.transportClientRuntime.requestPermission({
      surfaceId: this.options.surfaceId,
      localizeText: this.options.localizeText,
    });
  }

  /**
   * Returns the current fail-closed cancellation acknowledgement for ACP host operations.
   * @param request Cancellation payload.
   * @returns Cancellation acknowledgement payload.
   */
  public async cancel(request: AgentCancelRequest): Promise<AgentCancelResult> {
    return {
      acknowledged: false,
      scope: request.scope ?? AgentCancellationScope.AGENT,
      reason: request.reason ?? AgentCancellationReason.SYSTEM_GUARD,
      cancelledAt: new Date().toISOString(),
    };
  }
}
