import {
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from "@repo-ai-governor/orchestration-service-client";
import { GovernorErrorCode, RuntimeError, standardizeError } from "@repo-ai-governor/shared";
import {
  LOCAL_ORCHESTRATION_SERVICE_SIDECAR_PROTOCOL_VERSION,
  LocalOrchestrationServiceSidecarOperation,
} from "./constants/index.js";
import { LocalOrchestrationServiceShell } from "./local-orchestration-service-shell.js";
import type {
  LocalOrchestrationServiceSidecarDispatchTable,
  LocalOrchestrationServiceSidecarHostDependencies,
  LocalOrchestrationServiceSidecarRequestEnvelope,
  LocalOrchestrationServiceSidecarResponseEnvelope,
  LocalOrchestrationServiceSidecarShutdownResponse,
  LocalOrchestrationServiceSidecarStartExecutionPayload,
} from "./types/index.js";

/**
 * Hosts the local orchestration service shell behind a Node IPC request/response loop.
 *
 * Why this exists:
 * project-016 needs a truthful `sidecar + ipc` baseline instead of transport descriptors only.
 */
export class LocalOrchestrationServiceSidecarHost
  implements LocalOrchestrationServiceSidecarDispatchTable
{
  private lifecycleStatus = OrchestrationServiceLifecycleStatus.STARTING;
  private readonly shell: LocalOrchestrationServiceShell;
  private readonly boundMessageHandler = (message: unknown) => {
    void this.handleMessage(process, message);
  };

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceSidecarHostDependencies,
  ) {
    this.shell = new LocalOrchestrationServiceShell({
      ...dependencies,
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      lifecycleStatusProvider: () => this.lifecycleStatus,
      protocolVersion: LOCAL_ORCHESTRATION_SERVICE_SIDECAR_PROTOCOL_VERSION,
      pidProvider: () => process.pid,
    });
  }

  public attachToCurrentProcess(): void {
    if (!process.send) {
      throw new RuntimeError(
        GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
        "Local orchestration sidecar host requires an IPC-enabled process.",
        {
          workspaceRoot: this.dependencies.workspaceRoot,
        },
      );
    }

    this.lifecycleStatus = OrchestrationServiceLifecycleStatus.READY;
    process.on("message", this.boundMessageHandler);
  }

  public async dispose(): Promise<void> {
    this.lifecycleStatus = OrchestrationServiceLifecycleStatus.STOPPED;
    process.off("message", this.boundMessageHandler);
  }

  public getHealth() {
    return this.shell.getHealth();
  }

  public startExecution(payload: LocalOrchestrationServiceSidecarStartExecutionPayload) {
    return this.shell.startExecution(payload.request, payload.runtimeContext);
  }

  public getExecution(executionId: string) {
    return this.shell.getExecution(executionId);
  }

  public listExecutions(request?: Parameters<LocalOrchestrationServiceShell["listExecutions"]>[0]) {
    return this.shell.listExecutions(request);
  }

  public subscribeExecution(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable["subscribeExecution"]>[0],
  ) {
    return this.shell.subscribeExecution(request);
  }

  public submitHitlDecision(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable["submitHitlDecision"]>[0],
  ) {
    return this.shell.submitHitlDecision(request);
  }

  public recoverExecution(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable["recoverExecution"]>[0],
  ) {
    return this.shell.recoverExecution(request);
  }

  public publishEvent(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable["publishEvent"]>[0],
  ) {
    return this.shell.publishEvent(request);
  }

  public saveCheckpoint(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable["saveCheckpoint"]>[0],
  ) {
    return this.shell.saveCheckpoint(request);
  }

  private async handleMessage(targetProcess: NodeJS.Process, message: unknown): Promise<void> {
    if (!this.isRequestEnvelope(message)) {
      return;
    }

    try {
      const payload = await this.dispatch(message.operation, message.payload);
      await this.sendResponse(targetProcess, {
        requestId: message.requestId,
        ok: true,
        ...(payload !== undefined ? { payload } : {}),
      });
      if (message.operation === LocalOrchestrationServiceSidecarOperation.SHUTDOWN) {
        await this.dispose();
        targetProcess.disconnect?.();
        targetProcess.exit(0);
      }
    } catch (error) {
      const standardizedError = standardizeError(error);
      await this.sendResponse(targetProcess, {
        requestId: message.requestId,
        ok: false,
        error: {
          code: standardizedError.code,
          message: standardizedError.message,
          ...(standardizedError.details ? { details: standardizedError.details } : {}),
        },
      });
    }
  }

  private async dispatch(
    operation: LocalOrchestrationServiceSidecarOperation,
    payload: unknown,
  ): Promise<unknown> {
    switch (operation) {
      case LocalOrchestrationServiceSidecarOperation.GET_HEALTH:
        return this.getHealth();
      case LocalOrchestrationServiceSidecarOperation.START_EXECUTION:
        return this.startExecution(
          this.assertPayload<LocalOrchestrationServiceSidecarStartExecutionPayload>(
            payload,
            operation,
          ),
        );
      case LocalOrchestrationServiceSidecarOperation.GET_EXECUTION:
        return this.getExecution(this.assertPayload<string>(payload, operation));
      case LocalOrchestrationServiceSidecarOperation.LIST_EXECUTIONS:
        return this.listExecutions(
          payload as Parameters<LocalOrchestrationServiceSidecarDispatchTable["listExecutions"]>[0],
        );
      case LocalOrchestrationServiceSidecarOperation.SUBSCRIBE_EXECUTION:
        return this.subscribeExecution(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable["subscribeExecution"]>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SUBMIT_HITL_DECISION:
        return this.submitHitlDecision(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable["submitHitlDecision"]>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.RECOVER_EXECUTION:
        return this.recoverExecution(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable["recoverExecution"]>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.PUBLISH_EVENT:
        return this.publishEvent(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable["publishEvent"]>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SAVE_CHECKPOINT:
        return this.saveCheckpoint(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable["saveCheckpoint"]>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SHUTDOWN:
        this.lifecycleStatus = OrchestrationServiceLifecycleStatus.STOPPING;
        return { acknowledged: true } satisfies LocalOrchestrationServiceSidecarShutdownResponse;
    }
  }

  private async sendResponse(
    targetProcess: NodeJS.Process,
    response: LocalOrchestrationServiceSidecarResponseEnvelope,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      targetProcess.send?.(response, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private isRequestEnvelope(
    message: unknown,
  ): message is LocalOrchestrationServiceSidecarRequestEnvelope {
    if (!message || typeof message !== "object") {
      return false;
    }
    const requestId = (message as { requestId?: unknown }).requestId;
    const operation = (message as { operation?: unknown }).operation;
    return typeof requestId === "string" && typeof operation === "string";
  }

  private assertPayload<T>(
    payload: unknown,
    operation: LocalOrchestrationServiceSidecarOperation,
  ): T {
    if (payload !== undefined) {
      return payload as T;
    }

    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      `Local orchestration sidecar operation "${operation}" requires a payload.`,
      {
        operation,
      },
    );
  }
}
