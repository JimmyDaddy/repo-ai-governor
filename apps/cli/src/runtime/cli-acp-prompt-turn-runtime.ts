import type {
  AgentInvokeStageRequest,
  AgentInvokeStageResult,
  AgentStreamEvent,
  AgentStreamEventsRequest,
} from '@repo-ai-governor/adapter-sdk';
import type { AdapterSurface } from '@repo-ai-governor/shared';
import type { CliAcpSessionRuntime } from './cli-acp-session-runtime.js';
import type { CliAcpTransportClientRuntime } from './cli-acp-transport-client-runtime.js';

/**
 * Owns ACP invoke/stream orchestration while keeping shared-turn execution transport-scoped.
 */
export class CliAcpPromptTurnRuntime {
  public constructor(
    private readonly options: {
      surfaceId: AdapterSurface;
      localizeText: (english: string, chinese: string) => string;
      sessionRuntime: CliAcpSessionRuntime;
      transportClientRuntime: CliAcpTransportClientRuntime;
    },
  ) {}

  /**
   * Executes one self-sufficient ACP invokeStage path for the selected surface.
   * @param request Stage invocation payload.
   * @returns Invoke result payload once the ACP bridge is implemented.
   */
  public async invokeStage(request: AgentInvokeStageRequest): Promise<AgentInvokeStageResult> {
    const invocationState = this.options.sessionRuntime.ensureInvocationState(
      this.options.surfaceId,
      request,
    );
    return await this.options.transportClientRuntime.invokePromptTurn({
      surfaceId: this.options.surfaceId,
      invocationState,
      localizeText: this.options.localizeText,
    });
  }

  /**
   * Attaches streamEvents to the shared ACP invocation owned by invoke/stream runtime state.
   * @param request Stream request payload.
   * @returns Async iterable of ACP stream events.
   */
  public async *streamEvents(request: AgentStreamEventsRequest): AsyncIterable<AgentStreamEvent> {
    const invocationState = this.options.sessionRuntime.ensureInvocationState(
      this.options.surfaceId,
      request,
    );
    yield* this.options.transportClientRuntime.streamPromptTurn({
      surfaceId: this.options.surfaceId,
      invocationState,
      localizeText: this.options.localizeText,
    });
  }
}
