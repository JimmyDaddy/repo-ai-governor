import {
  type LocalOrchestrationServicePublishEventRequest,
  type LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceSidecarClient,
  type LocalOrchestrationServiceStartExecutionRuntimeContext,
} from '@repo-ai-governor/core-orchestration-service';
import type { LangGraphRecoveredExecution } from '@repo-ai-governor/core-runtime-langgraph';
import type {
  OrchestrationAppendSessionMessageRequest,
  OrchestrationAppendSessionMessageResponse,
  OrchestrationArtifactPaneQueryRequest,
  OrchestrationArtifactPaneQueryResponse,
  OrchestrationExecutionBoardQueryRequest,
  OrchestrationExecutionBoardQueryResponse,
  OrchestrationExecutionSummary,
  OrchestrationHitlInboxQueryRequest,
  OrchestrationHitlInboxQueryResponse,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationQueueOverviewQueryRequest,
  OrchestrationQueueOverviewQueryResponse,
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
  OrchestrationTerminateExecutionRequest,
  OrchestrationTerminateExecutionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import { DesktopOrchestrationRuntimeMode } from '../constants/index.js';
import type {
  DesktopOrchestrationServiceOwner,
  DesktopOrchestrationServiceRuntimeDependencies,
} from '../types/interfaces/index.js';

/**
 * Owns lazy sidecar-backed orchestration-service resolution for the desktop shell.
 *
 * Why this exists:
 * desktop foundation work should use a real package-local runtime surface instead of importing
 * CLI internals, while still preserving service ownership inside the local orchestration sidecar.
 */
export class DesktopOrchestrationServiceRuntime {
  private serviceOwnerPromise: Promise<DesktopOrchestrationServiceOwner> | null = null;

  public constructor(
    private readonly workspaceRoot: string,
    private readonly dependencies: DesktopOrchestrationServiceRuntimeDependencies = {},
  ) {}

  public async getHealth(): Promise<OrchestrationServiceHealthResponse> {
    const service = await this.resolveServiceOwner();
    return service.getHealth();
  }

  public async startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse> {
    const service = await this.resolveServiceOwner();
    return service.startExecution(request, runtimeContext);
  }

  public async getExecution(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    const service = await this.resolveServiceOwner();
    return service.getExecution(executionId);
  }

  public async queryExecutionBoard(
    request?: OrchestrationExecutionBoardQueryRequest,
  ): Promise<OrchestrationExecutionBoardQueryResponse> {
    const service = await this.resolveServiceOwner();
    return service.queryExecutionBoard(request);
  }

  public async queryHitlInbox(
    request?: OrchestrationHitlInboxQueryRequest,
  ): Promise<OrchestrationHitlInboxQueryResponse> {
    const service = await this.resolveServiceOwner();
    return service.queryHitlInbox(request);
  }

  public async queryQueueOverview(
    request?: OrchestrationQueueOverviewQueryRequest,
  ): Promise<OrchestrationQueueOverviewQueryResponse> {
    const service = await this.resolveServiceOwner();
    return service.queryQueueOverview(request);
  }

  public async listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse> {
    const service = await this.resolveServiceOwner();
    return service.listExecutions(request);
  }

  public async queryArtifactPane(
    request?: OrchestrationArtifactPaneQueryRequest,
  ): Promise<OrchestrationArtifactPaneQueryResponse> {
    const service = await this.resolveServiceOwner();
    return service.queryArtifactPane(request);
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

  public async terminateExecution(
    request: OrchestrationTerminateExecutionRequest,
  ): Promise<OrchestrationTerminateExecutionResponse> {
    const service = await this.resolveServiceOwner();
    return service.terminateExecution(request);
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
    await service?.dispose();
  }

  public getRuntimeMode(): DesktopOrchestrationRuntimeMode {
    return this.dependencies.runtimeMode ?? DesktopOrchestrationRuntimeMode.SIDECAR_IPC;
  }

  private async resolveServiceOwner(): Promise<DesktopOrchestrationServiceOwner> {
    if (!this.serviceOwnerPromise) {
      this.serviceOwnerPromise = (async () => {
        if (this.dependencies.serviceOwnerProvider) {
          return this.dependencies.serviceOwnerProvider(this.workspaceRoot);
        }

        return new LocalOrchestrationServiceSidecarClient(this.workspaceRoot, {
          ...(this.dependencies.memoryConfig
            ? {
                memoryConfig: this.dependencies.memoryConfig,
              }
            : {}),
          ...this.dependencies.sidecarClientDependencies,
        }) as DesktopOrchestrationServiceOwner;
      })().catch((error) => {
        this.serviceOwnerPromise = null;
        throw error;
      });
    }

    return this.serviceOwnerPromise;
  }
}
