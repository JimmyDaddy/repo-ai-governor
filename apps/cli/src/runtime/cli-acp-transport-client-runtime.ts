import type {
  AgentConfirmationResult,
  AgentInvokeStageResult,
  AgentStreamEvent,
} from '@repo-ai-governor/adapter-sdk';
import {
  type AdapterSurface,
  AdapterTransportKind,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import type { CliAcpInvocationExecutionState } from '../types/index.js';

const CLI_ACP_HOST_ACTION_LABELS = {
  invoke: {
    english: 'invoke',
    chinese: '调用',
  },
  stream: {
    english: 'stream',
    chinese: '流式输出',
  },
  confirm: {
    english: 'confirm',
    chinese: '确认',
  },
} as const;

/**
 * Owns the ACP protocol transport seam beneath the host-facing protocol entrypoint.
 *
 * Why this exists:
 * sprint-001 freezes a dedicated ACP transport owner so later execution work can evolve without
 * turning CliAcpHostProtocol into a new God object or reinterpreting ACP as cli_exec.
 */
export class CliAcpTransportClientRuntime {
  /**
   * Executes one ACP prompt turn for invokeStage.
   * @param options Surface-local invoke context.
   * @returns Never resolves during the sprint-001 fail-closed baseline.
   */
  public async invokePromptTurn(options: {
    surfaceId: AdapterSurface;
    invocationState: CliAcpInvocationExecutionState;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<AgentInvokeStageResult> {
    void options.invocationState;
    throw this.createUnavailableError(options.surfaceId, 'invoke', options.localizeText);
  }

  /**
   * Attaches to one ACP prompt turn for streamEvents.
   * @param options Surface-local stream context.
   * @returns Empty async iterable before throwing the canonical fail-closed error.
   */
  public async *streamPromptTurn(options: {
    surfaceId: AdapterSurface;
    invocationState: CliAcpInvocationExecutionState;
    localizeText: (english: string, chinese: string) => string;
  }): AsyncIterable<AgentStreamEvent> {
    void options.invocationState;
    yield* [];
    throw this.createUnavailableError(options.surfaceId, 'stream', options.localizeText);
  }

  /**
   * Bridges one ACP-native permission request back into the host-facing confirmation seam.
   * @param options Surface-local confirmation context.
   * @returns Never resolves during the sprint-001 fail-closed baseline.
   */
  public async requestPermission(options: {
    surfaceId: AdapterSurface;
    localizeText: (english: string, chinese: string) => string;
  }): Promise<AgentConfirmationResult> {
    throw this.createUnavailableError(options.surfaceId, 'confirm', options.localizeText);
  }

  private createUnavailableError(
    surfaceId: AdapterSurface,
    action: 'invoke' | 'stream' | 'confirm',
    localizeText: (english: string, chinese: string) => string,
  ): RuntimeError {
    const actionLabels = CLI_ACP_HOST_ACTION_LABELS[action];
    return new RuntimeError(
      GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
      localizeText(
        `ACP host-facing transport is not ready for ${surfaceId}; ${actionLabels.english} is fail-closed until rollout enablement completes.`,
        `ACP host-facing transport 尚未为 ${surfaceId} 就绪；在 rollout enablement 完成前，${actionLabels.chinese} 将保持 fail-closed。`,
      ),
      {
        surfaceId,
        transportKind: AdapterTransportKind.ACP_EXEC,
        action,
      },
    );
  }
}
