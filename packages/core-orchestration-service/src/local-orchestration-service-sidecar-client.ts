import { type ChildProcess, fork } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { LangGraphRecoveredExecution } from "@repo-ai-governor/core-runtime-langgraph";
import type {
  OrchestrationExecutionSummary,
  OrchestrationListExecutionsRequest,
  OrchestrationListExecutionsResponse,
  OrchestrationRecoverExecutionRequest,
  OrchestrationRecoverExecutionResponse,
  OrchestrationServiceHealthResponse,
  OrchestrationStartExecutionRequest,
  OrchestrationStartExecutionResponse,
  OrchestrationSubmitHitlDecisionRequest,
  OrchestrationSubmitHitlDecisionResponse,
  OrchestrationSubscribeExecutionRequest,
  OrchestrationSubscribeExecutionResponse,
} from "@repo-ai-governor/orchestration-service-client";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  LOCAL_ORCHESTRATION_SERVICE_SIDECAR_MEMORY_CONFIG_ENV,
  LOCAL_ORCHESTRATION_SERVICE_SIDECAR_PROTOCOL_VERSION,
  LocalOrchestrationServiceSidecarOperation,
} from "./constants/index.js";
import type {
  LocalOrchestrationServicePublishEventRequest,
  LocalOrchestrationServiceSaveCheckpointRequest,
  LocalOrchestrationServiceStartExecutionRuntimeContext,
} from "./types/index.js";
import type {
  LocalOrchestrationServiceSidecarClientDependencies,
  LocalOrchestrationServiceSidecarRequestEnvelope,
  LocalOrchestrationServiceSidecarResponseEnvelope,
  LocalOrchestrationServiceSidecarSerializedError,
} from "./types/interfaces/local-orchestration-service-sidecar.interface.js";

const DEFAULT_SIDECAR_REQUEST_TIMEOUT_MS = 10000;

interface PendingRequest {
  resolve: (payload: unknown) => void;
  reject: (error: unknown) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

/**
 * Implements the Node IPC client used to talk to the sidecar orchestration host.
 */
export class LocalOrchestrationServiceSidecarClient {
  private childProcessPromise: Promise<ChildProcess> | null = null;
  private requestSequence = 0;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private lastSidecarStderr = "";

  public constructor(
    private readonly workspaceRoot: string,
    private readonly dependencies: LocalOrchestrationServiceSidecarClientDependencies = {},
  ) {}

  public async getHealth(): Promise<OrchestrationServiceHealthResponse> {
    return this.sendRequest<OrchestrationServiceHealthResponse>(
      LocalOrchestrationServiceSidecarOperation.GET_HEALTH,
    );
  }

  public async startExecution(
    request: OrchestrationStartExecutionRequest,
    runtimeContext?: LocalOrchestrationServiceStartExecutionRuntimeContext,
  ): Promise<OrchestrationStartExecutionResponse> {
    return this.sendRequest<OrchestrationStartExecutionResponse>(
      LocalOrchestrationServiceSidecarOperation.START_EXECUTION,
      {
        request,
        ...(runtimeContext ? { runtimeContext } : {}),
      },
    );
  }

  public async getExecution(
    executionId: string,
  ): Promise<OrchestrationExecutionSummary | undefined> {
    return this.sendRequest<OrchestrationExecutionSummary | undefined>(
      LocalOrchestrationServiceSidecarOperation.GET_EXECUTION,
      executionId,
    );
  }

  public async listExecutions(
    request?: OrchestrationListExecutionsRequest,
  ): Promise<OrchestrationListExecutionsResponse> {
    return this.sendRequest<OrchestrationListExecutionsResponse>(
      LocalOrchestrationServiceSidecarOperation.LIST_EXECUTIONS,
      request,
    );
  }

  public async subscribeExecution(
    request: OrchestrationSubscribeExecutionRequest,
  ): Promise<OrchestrationSubscribeExecutionResponse> {
    return this.sendRequest<OrchestrationSubscribeExecutionResponse>(
      LocalOrchestrationServiceSidecarOperation.SUBSCRIBE_EXECUTION,
      request,
    );
  }

  public async submitHitlDecision(
    request: OrchestrationSubmitHitlDecisionRequest,
  ): Promise<OrchestrationSubmitHitlDecisionResponse> {
    return this.sendRequest<OrchestrationSubmitHitlDecisionResponse>(
      LocalOrchestrationServiceSidecarOperation.SUBMIT_HITL_DECISION,
      request,
    );
  }

  public async recoverExecution(
    request: OrchestrationRecoverExecutionRequest,
  ): Promise<OrchestrationRecoverExecutionResponse> {
    return this.sendRequest<OrchestrationRecoverExecutionResponse>(
      LocalOrchestrationServiceSidecarOperation.RECOVER_EXECUTION,
      request,
    );
  }

  public async publishEvent(request: LocalOrchestrationServicePublishEventRequest): Promise<void> {
    await this.sendRequest<void>(LocalOrchestrationServiceSidecarOperation.PUBLISH_EVENT, request);
  }

  public async saveCheckpoint(
    request: LocalOrchestrationServiceSaveCheckpointRequest,
  ): Promise<LangGraphRecoveredExecution | undefined> {
    return this.sendRequest<LangGraphRecoveredExecution | undefined>(
      LocalOrchestrationServiceSidecarOperation.SAVE_CHECKPOINT,
      request,
    );
  }

  public async dispose(): Promise<void> {
    if (!this.childProcessPromise) {
      return;
    }

    try {
      await this.sendRequest(LocalOrchestrationServiceSidecarOperation.SHUTDOWN);
    } finally {
      const childProcess = await this.childProcessPromise.catch(() => undefined);
      this.childProcessPromise = null;
      if (childProcess && !childProcess.killed) {
        childProcess.kill();
      }
      this.rejectAllPending(
        new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
          "Local orchestration sidecar client was disposed.",
        ),
      );
    }
  }

  private async sendRequest<T>(
    operation: LocalOrchestrationServiceSidecarOperation,
    payload?: unknown,
  ): Promise<T> {
    const childProcess = await this.resolveChildProcess();
    const requestId = this.createRequestId();
    const requestEnvelope: LocalOrchestrationServiceSidecarRequestEnvelope = {
      requestId,
      operation,
      ...(payload !== undefined ? { payload } : {}),
    };

    return new Promise<T>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT,
            `Local orchestration sidecar request "${operation}" timed out.`,
            {
              operation,
              requestId,
            },
          ),
        );
      }, this.dependencies.requestTimeoutMs ?? DEFAULT_SIDECAR_REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(requestId, {
        resolve: (responsePayload) => resolve(responsePayload as T),
        reject,
        timeoutHandle,
      });

      childProcess.send(requestEnvelope, (error) => {
        if (!error) {
          return;
        }
        const pendingRequest = this.pendingRequests.get(requestId);
        if (!pendingRequest) {
          return;
        }
        clearTimeout(pendingRequest.timeoutHandle);
        this.pendingRequests.delete(requestId);
        reject(
          new RuntimeError(
            GovernorErrorCode.MEMORY_STORE_WRITE_FAILED,
            `Failed to send local orchestration sidecar request "${operation}".`,
            {
              operation,
              requestId,
            },
            error,
          ),
        );
      });
    });
  }

  private async resolveChildProcess(): Promise<ChildProcess> {
    if (!this.childProcessPromise) {
      this.childProcessPromise = (async () => {
        const sidecarEntryPath =
          this.dependencies.sidecarEntryPath ?? this.resolveDefaultSidecarEntryPath();
        const execArgv = this.resolveExecArgv(sidecarEntryPath);
        this.lastSidecarStderr = "";
        const childProcess = this.dependencies.childProcessFactory
          ? this.dependencies.childProcessFactory(
              this.workspaceRoot,
              sidecarEntryPath,
              execArgv,
              this.resolveSidecarEnvironment(),
            )
          : fork(sidecarEntryPath, ["--workspace-root", this.workspaceRoot], {
              execArgv,
              env: this.resolveSidecarEnvironment(),
              stdio: ["ignore", "ignore", "pipe", "ipc"],
            });
        childProcess.stderr?.setEncoding("utf8");
        childProcess.stderr?.on("data", (chunk: string) => {
          this.lastSidecarStderr += chunk;
        });
        childProcess.on("message", (message) => {
          this.handleResponse(message);
        });
        childProcess.on("exit", () => {
          this.childProcessPromise = null;
          this.rejectAllPending(
            new RuntimeError(
              GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
              "Local orchestration sidecar process exited.",
              this.lastSidecarStderr
                ? {
                    stderr: this.lastSidecarStderr.trim(),
                  }
                : undefined,
            ),
          );
        });
        return childProcess;
      })().catch((error) => {
        this.childProcessPromise = null;
        throw error;
      });
    }

    return this.childProcessPromise;
  }

  private handleResponse(message: unknown): void {
    if (!this.isResponseEnvelope(message)) {
      return;
    }

    const pendingRequest = this.pendingRequests.get(message.requestId);
    if (!pendingRequest) {
      return;
    }

    clearTimeout(pendingRequest.timeoutHandle);
    this.pendingRequests.delete(message.requestId);

    if (message.ok) {
      pendingRequest.resolve(message.payload);
      return;
    }

    pendingRequest.reject(this.rehydrateError(message.error));
  }

  private rejectAllPending(error: unknown): void {
    for (const [requestId, pendingRequest] of this.pendingRequests) {
      clearTimeout(pendingRequest.timeoutHandle);
      pendingRequest.reject(error);
      this.pendingRequests.delete(requestId);
    }
  }

  private rehydrateError(
    serializedError?: LocalOrchestrationServiceSidecarSerializedError,
  ): RuntimeError {
    return new RuntimeError(
      serializedError?.code ?? GovernorErrorCode.UNKNOWN,
      serializedError?.message ?? "Local orchestration sidecar request failed.",
      serializedError?.details,
    );
  }

  private createRequestId(): string {
    this.requestSequence += 1;
    return `sidecar-request-${String(this.requestSequence)}`;
  }

  private resolveDefaultSidecarEntryPath(): string {
    const moduleDirectory = dirname(fileURLToPath(import.meta.url));
    const jsEntryPath = resolve(moduleDirectory, "local-orchestration-service-sidecar-entry.js");
    if (existsSync(jsEntryPath)) {
      return jsEntryPath;
    }

    const tsEntryPath = resolve(moduleDirectory, "local-orchestration-service-sidecar-entry.ts");
    if (existsSync(tsEntryPath)) {
      return tsEntryPath;
    }

    throw new RuntimeError(
      GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
      "Local orchestration sidecar entry was not found.",
      {
        moduleDirectory,
      },
    );
  }

  private resolveExecArgv(sidecarEntryPath: string): string[] {
    if (this.dependencies.execArgv) {
      return [...this.dependencies.execArgv];
    }

    if (sidecarEntryPath.endsWith(".ts")) {
      const moduleDirectory = dirname(fileURLToPath(import.meta.url));
      return [
        "--experimental-transform-types",
        "--loader",
        resolve(moduleDirectory, "local-orchestration-service-sidecar-loader.ts"),
      ];
    }

    return [];
  }

  /**
   * Builds the sidecar environment, including optional serialized memory config.
   * @returns Environment passed to the child sidecar process.
   */
  private resolveSidecarEnvironment(): NodeJS.ProcessEnv {
    const resolvedEnvironment = {
      ...(this.dependencies.env ?? process.env),
    };
    if (this.dependencies.memoryConfig) {
      resolvedEnvironment[LOCAL_ORCHESTRATION_SERVICE_SIDECAR_MEMORY_CONFIG_ENV] = JSON.stringify(
        this.dependencies.memoryConfig,
      );
    }
    return resolvedEnvironment;
  }

  private isResponseEnvelope(
    message: unknown,
  ): message is LocalOrchestrationServiceSidecarResponseEnvelope {
    if (!message || typeof message !== "object") {
      return false;
    }
    const requestId = (message as { requestId?: unknown }).requestId;
    const ok = (message as { ok?: unknown }).ok;
    return typeof requestId === "string" && typeof ok === "boolean";
  }
}
