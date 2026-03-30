import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from '@repo-ai-governor/core-orchestration-service';
import type { LangGraphRecoveredExecution } from '@repo-ai-governor/core-runtime-langgraph';
import type {
  OrchestrationAppendSessionMessageRequest,
  OrchestrationAppendSessionMessageResponse,
  OrchestrationExecutionSummary,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationResumeSessionRequest,
  OrchestrationResumeSessionResponse,
  OrchestrationSendSessionTurnRequest,
  OrchestrationSendSessionTurnResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationSessionSummary,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationStartSessionRequest,
  OrchestrationStartSessionResponse,
  OrchestrationSubmitHitlDecisionRequest,
  OrchestrationSubmitHitlDecisionResponse,
  OrchestrationSubscribeExecutionRequest,
  OrchestrationSubscribeExecutionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import { CliOrchestrationServiceRuntimeMode } from '../constants/orchestration-service-runtime.constant.js';
import type {
  CliOrchestrationServiceOwner,
  CliOrchestrationServiceRuntimeDependencies,
} from '../types/interfaces/cli-orchestration-service-runtime.interface.js';

/**
 * Owns lazy embedded orchestration-service resolution for CLI runtime and command executors.
 *
 * Why this exists:
 * CLI command paths should depend on the service client surface instead of directly new-ing
 * LocalOrchestrationServiceShell in multiple places, while still avoiding eager sqlite loading
 * on non-runtime entrypoints.
 */
export class CliOrchestrationServiceRuntime {
  private serviceOwnerPromise: Promise<CliOrchestrationServiceOwner> | null = null;

  public constructor(
    private readonly workspaceRoot: string,
    private readonly dependencies: CliOrchestrationServiceRuntimeDependencies = {},
  ) {}

  public async startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse> {
    const service = await this.resolveServiceOwner();
    return service.startExecution(request, runtimeContext);
  }

  public async getHealth(): Promise<OrchestrationServiceHealthResponse> {
    const service = await this.resolveServiceOwner();
    return service.getHealth();
  }

  public async getExecution(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    const service = await this.resolveServiceOwner();
    return service.getExecution(executionId);
  }

  public async listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse> {
    const service = await this.resolveServiceOwner();
    return service.listExecutions(request);
  }

  public async subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse> {
    const service = await this.resolveServiceOwner();
    return service.subscribeExecution(request);
  }

  public async submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse> {
    const service = await this.resolveServiceOwner();
    return service.submitHitlDecision(request);
  }

  public async recoverExecution(
    request: OrchestrationRecoverExecutionRequest,
  ): Promise<OrchestrationRecoverExecutionResponse> {
    const service = await this.resolveServiceOwner();
    return service.recoverExecution(request);
  }

  public async startSession(
    request: OrchestrationStartSessionRequest,
  ): Promise<OrchestrationStartSessionResponse> {
    const service = await this.resolveServiceOwner();
    return service.startSession(request);
  }

  public async sendSessionTurn(
    request: OrchestrationSendSessionTurnRequest,
  ): Promise<OrchestrationSendSessionTurnResponse> {
    const service = await this.resolveServiceOwner();
    return service.sendSessionTurn(request);
  }

  public async appendSessionMessage(
    request: OrchestrationAppendSessionMessageRequest,
  ): Promise<OrchestrationAppendSessionMessageResponse> {
    const service = await this.resolveServiceOwner();
    return service.appendSessionMessage(request);
  }

  public async getSession(sessionId: string): Promise<OrchestrationSessionSummary | undefined> {
    const service = await this.resolveServiceOwner();
    return service.getSession(sessionId);
  }

  public async listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse> {
    const service = await this.resolveServiceOwner();
    return service.listSessions(request);
  }

  public async subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse> {
    const service = await this.resolveServiceOwner();
    return service.subscribeSession(request);
  }

  public async resumeSession(
    request?: OrchestrationResumeSessionRequest,
  ): Promise<OrchestrationResumeSessionResponse> {
    const service = await this.resolveServiceOwner();
    return service.resumeSession(request);
  }

  public async publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void> {
    const service = await this.resolveServiceOwner();
    return service.publishEvent(request);
  }

  public async saveCheckpoint(
    request: LocalOrchestrationServiceSaveCheckpointRequest,
  ): Promise<LangGraphRecoveredExecution | undefined> {
    const service = await this.resolveServiceOwner();
    return service.saveCheckpoint(request);
  }

  public async dispose(): Promise<void> {
    if (!this.serviceOwnerPromise) {
      return;
    }

    const service = await this.serviceOwnerPromise.catch(() => undefined);
    this.serviceOwnerPromise = null;
    await service?.dispose?.();
  }

  private async resolveServiceOwner(): Promise<CliOrchestrationServiceOwner> {
    if (!this.serviceOwnerPromise) {
      this.serviceOwnerPromise = (async () => {
        if (this.dependencies.serviceOwnerProvider) {
          return this.dependencies.serviceOwnerProvider(this.workspaceRoot);
        }
        if (this.dependencies.runtimeMode === CliOrchestrationServiceRuntimeMode.SIDECAR_IPC) {
          const { LocalOrchestrationServiceSidecarClient } = await import(
            '@repo-ai-governor/core-orchestration-service'
          );
          return new LocalOrchestrationServiceSidecarClient(this.workspaceRoot, {
            ...(this.dependencies.memoryConfig
              ? {
                  memoryConfig: this.dependencies.memoryConfig,
                }
              : {}),
            ...this.dependencies.sidecarClientDependencies,
          }) as CliOrchestrationServiceOwner;
        }
        const { LocalOrchestrationServiceShell } = await import(
          '@repo-ai-governor/core-orchestration-service'
        );
        return new LocalOrchestrationServiceShell({
          workspaceRoot: this.workspaceRoot,
          ...(this.dependencies.memoryConfig
            ? {
                memoryConfig: this.dependencies.memoryConfig,
              }
            : {}),
          ...this.dependencies.embeddedShellDependencies,
        });
      })().catch((error) => {
        this.serviceOwnerPromise = null;
        throw error;
      });
    }

    return this.serviceOwnerPromise;
  }
}
