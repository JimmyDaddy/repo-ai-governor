import {
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import {
  LOCAL_ORCHESTRATION_SERVICE_SIDECAR_PROTOCOL_VERSION,
  LocalOrchestrationServiceSidecarOperation,
} from './constants/index.js';
import { LocalOrchestrationServiceShell } from './local-orchestration-service-shell.js';
import type {
  LocalOrchestrationServiceSidecarDispatchTable,
  LocalOrchestrationServiceSidecarHostDependencies,
  LocalOrchestrationServiceSidecarRequestEnvelope,
  LocalOrchestrationServiceSidecarResponseEnvelope,
  LocalOrchestrationServiceSidecarShutdownResponse,
  LocalOrchestrationServiceSidecarStartExecutionPayload,
} from './types/index.js';

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
        'Local orchestration sidecar host requires an IPC-enabled process.',
        {
          workspaceRoot: this.dependencies.workspaceRoot,
        },
      );
    }

    this.lifecycleStatus = OrchestrationServiceLifecycleStatus.READY;
    process.on('message', this.boundMessageHandler);
  }

  public async dispose(): Promise<void> {
    this.lifecycleStatus = OrchestrationServiceLifecycleStatus.STOPPED;
    process.off('message', this.boundMessageHandler);
  }

  public getHealth() {
    return this.shell.getHealth();
  }

  public queryBootstrapReadiness() {
    return this.shell.queryBootstrapReadiness();
  }

  public querySecureAuthoring(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['querySecureAuthoring']>[0],
  ) {
    return this.shell.querySecureAuthoring(request);
  }

  public queryProviderOnboarding(
    request: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['queryProviderOnboarding']
    >[0],
  ) {
    return this.shell.queryProviderOnboarding(request);
  }

  public setUserConfigValue(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['setUserConfigValue']>[0],
  ) {
    return this.shell.setUserConfigValue(request);
  }

  public setManagedSecret(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['setManagedSecret']>[0],
  ) {
    return this.shell.setManagedSecret(request);
  }

  public applyProviderOnboarding(
    request: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['applyProviderOnboarding']
    >[0],
  ) {
    return this.shell.applyProviderOnboarding(request);
  }

  public queryWorkflowDraftSession(
    request?: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['queryWorkflowDraftSession']
    >[0],
  ) {
    return this.shell.queryWorkflowDraftSession(request);
  }

  public startWorkflowDraft(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['startWorkflowDraft']>[0],
  ) {
    return this.shell.startWorkflowDraft(request);
  }

  public updateWorkflowDraftNode(
    request: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['updateWorkflowDraftNode']
    >[0],
  ) {
    return this.shell.updateWorkflowDraftNode(request);
  }

  public updateWorkflowDraftEdge(
    request: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['updateWorkflowDraftEdge']
    >[0],
  ) {
    return this.shell.updateWorkflowDraftEdge(request);
  }

  public updateWorkflowDraftPolicy(
    request: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['updateWorkflowDraftPolicy']
    >[0],
  ) {
    return this.shell.updateWorkflowDraftPolicy(request);
  }

  public validateWorkflowDraft(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['validateWorkflowDraft']>[0],
  ) {
    return this.shell.validateWorkflowDraft(request);
  }

  public commitWorkflowDraft(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['commitWorkflowDraft']>[0],
  ) {
    return this.shell.commitWorkflowDraft(request);
  }

  public runWorkspaceOperation(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['runWorkspaceOperation']>[0],
  ) {
    return this.shell.runWorkspaceOperation(request);
  }

  public startExecution(payload: LocalOrchestrationServiceSidecarStartExecutionPayload) {
    return this.shell.startExecution(payload.request, payload.runtimeContext);
  }

  public getExecution(executionId: string) {
    return this.shell.getExecution(executionId);
  }

  public queryExecutionBoard(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['queryExecutionBoard']>[0],
  ) {
    return this.shell.queryExecutionBoard(request);
  }

  public queryHitlInbox(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['queryHitlInbox']>[0],
  ) {
    return this.shell.queryHitlInbox(request);
  }

  public queryRoleLaneStatus(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['queryRoleLaneStatus']>[0],
  ) {
    return this.shell.queryRoleLaneStatus(request);
  }

  public querySessionContinuity(
    request?: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['querySessionContinuity']
    >[0],
  ) {
    return this.shell.querySessionContinuity(request);
  }

  public queryHitlDecisionPacket(
    request?: Parameters<
      LocalOrchestrationServiceSidecarDispatchTable['queryHitlDecisionPacket']
    >[0],
  ) {
    return this.shell.queryHitlDecisionPacket(request);
  }

  public queryQueueOverview(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['queryQueueOverview']>[0],
  ) {
    return this.shell.queryQueueOverview(request);
  }

  public listExecutions(request?: Parameters<LocalOrchestrationServiceShell['listExecutions']>[0]) {
    return this.shell.listExecutions(request);
  }

  public queryArtifactPane(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['queryArtifactPane']>[0],
  ) {
    return this.shell.queryArtifactPane(request);
  }

  public subscribeExecution(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['subscribeExecution']>[0],
  ) {
    return this.shell.subscribeExecution(request);
  }

  public submitHitlDecision(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['submitHitlDecision']>[0],
  ) {
    return this.shell.submitHitlDecision(request);
  }

  public recoverExecution(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['recoverExecution']>[0],
  ) {
    return this.shell.recoverExecution(request);
  }

  public terminateExecution(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['terminateExecution']>[0],
  ) {
    return this.shell.terminateExecution(request);
  }

  public startSession(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['startSession']>[0],
  ) {
    return this.shell.startSession(request);
  }

  public sendSessionTurn(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['sendSessionTurn']>[0],
  ) {
    return this.shell.sendSessionTurn(request);
  }

  public appendSessionMessage(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['appendSessionMessage']>[0],
  ) {
    return this.shell.appendSessionMessage(request);
  }

  public getSession(sessionId: string) {
    return this.shell.getSession(sessionId);
  }

  public listSessions(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['listSessions']>[0],
  ) {
    return this.shell.listSessions(request);
  }

  public subscribeSession(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['subscribeSession']>[0],
  ) {
    return this.shell.subscribeSession(request);
  }

  public resumeSession(
    request?: Parameters<LocalOrchestrationServiceSidecarDispatchTable['resumeSession']>[0],
  ) {
    return this.shell.resumeSession(request);
  }

  public forkSession(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['forkSession']>[0],
  ) {
    return this.shell.forkSession(request);
  }

  public archiveSession(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['archiveSession']>[0],
  ) {
    return this.shell.archiveSession(request);
  }

  public unarchiveSession(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['unarchiveSession']>[0],
  ) {
    return this.shell.unarchiveSession(request);
  }

  public publishEvent(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['publishEvent']>[0],
  ) {
    return this.shell.publishEvent(request);
  }

  public saveCheckpoint(
    request: Parameters<LocalOrchestrationServiceSidecarDispatchTable['saveCheckpoint']>[0],
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
      case LocalOrchestrationServiceSidecarOperation.QUERY_BOOTSTRAP_READINESS:
        return this.queryBootstrapReadiness();
      case LocalOrchestrationServiceSidecarOperation.QUERY_SECURE_AUTHORING:
        return this.querySecureAuthoring(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['querySecureAuthoring']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_PROVIDER_ONBOARDING:
        return this.queryProviderOnboarding(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['queryProviderOnboarding']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SET_USER_CONFIG_VALUE:
        return this.setUserConfigValue(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['setUserConfigValue']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SET_MANAGED_SECRET:
        return this.setManagedSecret(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['setManagedSecret']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.APPLY_PROVIDER_ONBOARDING:
        return this.applyProviderOnboarding(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['applyProviderOnboarding']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_WORKFLOW_DRAFT_SESSION:
        return this.queryWorkflowDraftSession(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['queryWorkflowDraftSession']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.START_WORKFLOW_DRAFT:
        return this.startWorkflowDraft(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['startWorkflowDraft']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.UPDATE_WORKFLOW_DRAFT_NODE:
        return this.updateWorkflowDraftNode(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['updateWorkflowDraftNode']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.UPDATE_WORKFLOW_DRAFT_EDGE:
        return this.updateWorkflowDraftEdge(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['updateWorkflowDraftEdge']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.UPDATE_WORKFLOW_DRAFT_POLICY:
        return this.updateWorkflowDraftPolicy(
          this.assertPayload<
            Parameters<
              LocalOrchestrationServiceSidecarDispatchTable['updateWorkflowDraftPolicy']
            >[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.VALIDATE_WORKFLOW_DRAFT:
        return this.validateWorkflowDraft(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['validateWorkflowDraft']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.COMMIT_WORKFLOW_DRAFT:
        return this.commitWorkflowDraft(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['commitWorkflowDraft']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.RUN_WORKSPACE_OPERATION:
        return this.runWorkspaceOperation(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['runWorkspaceOperation']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.START_EXECUTION:
        return this.startExecution(
          this.assertPayload<LocalOrchestrationServiceSidecarStartExecutionPayload>(
            payload,
            operation,
          ),
        );
      case LocalOrchestrationServiceSidecarOperation.GET_EXECUTION:
        return this.getExecution(this.assertPayload<string>(payload, operation));
      case LocalOrchestrationServiceSidecarOperation.QUERY_EXECUTION_BOARD:
        return this.queryExecutionBoard(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['queryExecutionBoard']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_HITL_INBOX:
        return this.queryHitlInbox(
          payload as Parameters<LocalOrchestrationServiceSidecarDispatchTable['queryHitlInbox']>[0],
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_ROLE_LANE_STATUS:
        return this.queryRoleLaneStatus(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['queryRoleLaneStatus']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_SESSION_CONTINUITY:
        return this.querySessionContinuity(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['querySessionContinuity']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_HITL_DECISION_PACKET:
        return this.queryHitlDecisionPacket(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['queryHitlDecisionPacket']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_QUEUE_OVERVIEW:
        return this.queryQueueOverview(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['queryQueueOverview']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.LIST_EXECUTIONS:
        return this.listExecutions(
          payload as Parameters<LocalOrchestrationServiceSidecarDispatchTable['listExecutions']>[0],
        );
      case LocalOrchestrationServiceSidecarOperation.QUERY_ARTIFACT_PANE:
        return this.queryArtifactPane(
          payload as Parameters<
            LocalOrchestrationServiceSidecarDispatchTable['queryArtifactPane']
          >[0],
        );
      case LocalOrchestrationServiceSidecarOperation.SUBSCRIBE_EXECUTION:
        return this.subscribeExecution(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['subscribeExecution']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SUBMIT_HITL_DECISION:
        return this.submitHitlDecision(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['submitHitlDecision']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.RECOVER_EXECUTION:
        return this.recoverExecution(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['recoverExecution']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.TERMINATE_EXECUTION:
        return this.terminateExecution(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['terminateExecution']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.START_SESSION:
        return this.startSession(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['startSession']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SEND_SESSION_TURN:
        return this.sendSessionTurn(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['sendSessionTurn']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.APPEND_SESSION_MESSAGE:
        return this.appendSessionMessage(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['appendSessionMessage']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.GET_SESSION:
        return this.getSession(this.assertPayload<string>(payload, operation));
      case LocalOrchestrationServiceSidecarOperation.LIST_SESSIONS:
        return this.listSessions(
          payload as Parameters<LocalOrchestrationServiceSidecarDispatchTable['listSessions']>[0],
        );
      case LocalOrchestrationServiceSidecarOperation.SUBSCRIBE_SESSION:
        return this.subscribeSession(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['subscribeSession']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.RESUME_SESSION:
        return this.resumeSession(
          payload as Parameters<LocalOrchestrationServiceSidecarDispatchTable['resumeSession']>[0],
        );
      case LocalOrchestrationServiceSidecarOperation.FORK_SESSION:
        return this.forkSession(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['forkSession']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.ARCHIVE_SESSION:
        return this.archiveSession(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['archiveSession']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.UNARCHIVE_SESSION:
        return this.unarchiveSession(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['unarchiveSession']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.PUBLISH_EVENT:
        return this.publishEvent(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['publishEvent']>[0]
          >(payload, operation),
        );
      case LocalOrchestrationServiceSidecarOperation.SAVE_CHECKPOINT:
        return this.saveCheckpoint(
          this.assertPayload<
            Parameters<LocalOrchestrationServiceSidecarDispatchTable['saveCheckpoint']>[0]
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
    if (!message || typeof message !== 'object') {
      return false;
    }
    const requestId = (message as { requestId?: unknown }).requestId;
    const operation = (message as { operation?: unknown }).operation;
    return typeof requestId === 'string' && typeof operation === 'string';
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
