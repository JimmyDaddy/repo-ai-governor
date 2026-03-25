import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from "@repo-ai-governor/core-orchestration-service";
import type { LangGraphRecoveredExecution } from "@repo-ai-governor/core-runtime-langgraph";
import type {
  OrchestrationExecutionSummary,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationSubmitHitlDecisionRequest,
  OrchestrationSubmitHitlDecisionResponse,
  OrchestrationSubscribeExecutionRequest,
  OrchestrationSubscribeExecutionResponse,
} from "@repo-ai-governor/orchestration-service-client";
import type {
  CliOrchestrationServiceOwner,
  CliOrchestrationServiceRuntimeDependencies,
} from "../types/interfaces/cli-orchestration-service-runtime.interface.js";

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

  private async resolveServiceOwner(): Promise<CliOrchestrationServiceOwner> {
    if (!this.serviceOwnerPromise) {
      this.serviceOwnerPromise = (async () => {
        if (this.dependencies.serviceOwnerProvider) {
          return this.dependencies.serviceOwnerProvider(this.workspaceRoot);
        }
        const { LocalOrchestrationServiceShell } = await import(
          "@repo-ai-governor/core-orchestration-service"
        );
        return new LocalOrchestrationServiceShell({
          workspaceRoot: this.workspaceRoot,
        });
      })().catch((error) => {
        this.serviceOwnerPromise = null;
        throw error;
      });
    }

    return this.serviceOwnerPromise;
  }
}
