import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ProcessCompiler, ProcessNodeType } from '@repo-ai-governor/core-process';
import { CompiledIrGraphAdapter } from '@repo-ai-governor/core-runtime-langgraph';
import {
  MemoryProviderHostSurface,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
} from '@repo-ai-governor/orchestration-service-client';
import {
  GovernorError,
  GovernorErrorCode,
  MemoryStoreEngine,
  standardizeError,
} from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceShell } from '../src/index.js';

function createGraphPlan() {
  const compiler = new ProcessCompiler();
  const compiledIr = compiler.compile({
    processId: 'process-orchestration-shell-unit',
    executionId: 'exec-orchestration-shell-unit',
    entryNodeId: 'node-entry',
    nodes: [
      {
        nodeId: 'node-entry',
        stageId: 'stage-entry',
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: 'entry',
        roleProfileId: 'planner-default',
        inputSchemaRef: 'schemas/input.json',
        outputSchemaRef: 'schemas/output.json',
        retryPolicyRef: 'policy/retry-default',
        timeoutPolicyRef: 'policy/timeout-default',
        budgetPolicyRef: 'policy/budget-default',
      },
      {
        nodeId: 'node-review',
        stageId: 'stage-review',
        nodeType: ProcessNodeType.SEQUENTIAL,
        routeKey: 'review',
        roleProfileId: 'reviewer-default',
        inputSchemaRef: 'schemas/input.json',
        outputSchemaRef: 'schemas/output.json',
        retryPolicyRef: 'policy/retry-default',
        timeoutPolicyRef: 'policy/timeout-default',
        budgetPolicyRef: 'policy/budget-default',
      },
    ],
    edges: [
      {
        fromNodeId: 'node-entry',
        toNodeId: 'node-review',
      },
    ],
  });

  return new CompiledIrGraphAdapter().adapt(compiledIr);
}

describe('core-orchestration-service local shell', () => {
  it('tracks execution state, event stream, and sqlite-fs checkpoint recovery', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-unit-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-shell-001',
      executionSessionIdProvider: () => 'session-shell-001',
    });

    try {
      const health = await orchestrationService.getHealth();
      const plan = createGraphPlan();
      const started = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-unit',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
          taskId: 'TK-151',
          projectId: 'project-014',
          sprintId: 'sprint-002',
        },
        {
          executionId: plan.executionId,
          processId: plan.processId,
        },
      );
      await orchestrationService.publishEvent({
        executionId: plan.executionId,
        type: OrchestrationServiceEventType.STAGE_COMPLETED,
        status: OrchestrationExecutionStatus.RUNNING,
        stageId: 'stage-entry',
        message: 'Stage entry completed.',
      });
      const recovered = await orchestrationService.saveCheckpoint({
        executionId: plan.executionId,
        plan,
        executionSessionId: 'session-shell-001',
        activeNodeIds: ['node-review'],
        visitedNodeIds: ['node-entry'],
        reducedState: {
          'execution.cursor': 'node-review',
          'execution.visited_nodes': ['node-entry'],
        },
      });
      const replayedOrchestrationService = new LocalOrchestrationServiceShell({
        workspaceRoot: temporaryRoot,
      });
      const subscription = await replayedOrchestrationService.subscribeExecution({
        eventStreamToken: started.eventStreamToken,
      });
      const executionSummary = await replayedOrchestrationService.getExecution(plan.executionId);
      const executionList = await replayedOrchestrationService.listExecutions({
        filter: {
          workspaceId: 'workspace-unit',
          projectId: 'project-014',
          sprintId: 'sprint-002',
        },
      });
      const recoveryResult = await replayedOrchestrationService.recoverExecution({
        executionId: plan.executionId,
      });

      expect(health.lifecycleStatus).toBe(OrchestrationServiceLifecycleStatus.READY);
      expect(health.serviceHostKind).toBe(OrchestrationServiceHostKind.EMBEDDED);
      expect(health.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IN_PROCESS);
      expect(health.checkpointCapable).toBe(true);
      expect(health.protocolVersion).toBe('1');
      expect(started.status).toBe(OrchestrationExecutionStatus.RUNNING);
      expect(started.serviceHostKind).toBe(OrchestrationServiceHostKind.EMBEDDED);
      expect(started.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IN_PROCESS);
      expect(started.latestEventSequence).toBe(1);
      expect(subscription.events.map((event) => event.type)).toEqual([
        OrchestrationServiceEventType.EXECUTION_STARTED,
        OrchestrationServiceEventType.STAGE_COMPLETED,
        OrchestrationServiceEventType.ARTIFACT_READY,
      ]);
      expect(subscription.serviceHostKind).toBe(OrchestrationServiceHostKind.EMBEDDED);
      expect(subscription.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IN_PROCESS);
      expect(subscription.latestEventSequence).toBe(3);
      expect(subscription.nextCursor).toBe(subscription.events[2]?.streamCursor);
      expect(subscription.events.map((event) => event.sequence)).toEqual([1, 2, 3]);
      expect(subscription.events[0]?.eventId).toBe(`${plan.executionId}-event-1`);
      expect(subscription.events[2]?.artifactId).toBe('langgraph_checkpoint');
      expect(subscription.events[2]?.artifactPath).toContain('langgraph-checkpoints.sqlite#');
      expect(executionSummary?.checkpointSource).toBe('sqlite-fs');
      expect(executionSummary?.recoveryCapable).toBe(true);
      expect(executionSummary?.pendingHitl).toBe(false);
      expect(executionSummary?.currentStageId).toBe('stage-entry');
      expect(executionSummary?.latestArtifactId).toBe('langgraph_checkpoint');
      expect(executionSummary?.latestArtifactPath).toContain('langgraph-checkpoints.sqlite#');
      expect(executionSummary?.latestEventType).toBe(OrchestrationServiceEventType.ARTIFACT_READY);
      expect(executionSummary?.serviceHostKind).toBe(OrchestrationServiceHostKind.EMBEDDED);
      expect(executionSummary?.serviceTransportKind).toBe(
        OrchestrationServiceTransportKind.IN_PROCESS,
      );
      expect(executionSummary?.latestEventSequence).toBe(3);
      expect(executionSummary?.nextCursor).toBe(subscription.events[2]?.streamCursor);
      expect(executionList.returnedCount).toBe(1);
      expect(executionList.totalMatchedCount).toBe(1);
      expect(executionList.executions[0]?.executionId).toBe(plan.executionId);
      expect(recovered?.checkpointSource).toBe('sqlite-fs');
      expect(recoveryResult.recovered).toBe(true);
      expect(recoveryResult.recoveryCapable).toBe(true);
      expect(recoveryResult.nextNodeIds).toEqual(['node-review']);
      expect(recoveryResult.executionSummary.checkpointPath).toContain(
        'langgraph-checkpoints.sqlite#',
      );
      expect(recoveryResult.executionSummary.executionId).toBe(plan.executionId);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('persists a HITL decision receipt artifact and exposes the receipt path in the response', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-unit-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-shell-hitl-001',
      executionSessionIdProvider: () => 'session-shell-hitl-001',
      nowProvider: () => new Date('2026-03-25T12:30:00Z'),
    });

    try {
      const started = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-unit',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
          taskId: 'TK-151',
          projectId: 'project-014',
          sprintId: 'sprint-002',
        },
        {
          processId: 'process-orchestration-shell-hitl',
        },
      );
      await orchestrationService.publishEvent({
        executionId: started.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting HITL decision.',
      });

      const decisionResult = await orchestrationService.submitHitlDecision({
        executionId: started.executionId,
        executionSessionId: started.executionSessionId,
        decision: 'approve',
        resumeAction: 'resume',
        actor: 'reviewer',
        reason: 'Approved for continuation.',
      });
      const subscription = await orchestrationService.subscribeExecution({
        eventStreamToken: started.eventStreamToken,
      });
      const receiptPayload = JSON.parse(
        await readFile(decisionResult.decisionReceiptArtifactPath as string, 'utf8'),
      ) as {
        executionId: string;
        decision: string;
        decidedBy: string;
      };

      expect(decisionResult.accepted).toBe(true);
      expect(decisionResult.decisionReceiptArtifactPath).toContain(
        'context/hitl/decisions/hitl-decision-',
      );
      expect(receiptPayload.executionId).toBe(started.executionId);
      expect(receiptPayload.decision).toBe('approve');
      expect(receiptPayload.decidedBy).toBe('reviewer');
      expect(decisionResult.executionSummary.latestArtifactPath).toBe(
        decisionResult.decisionReceiptArtifactPath,
      );
      expect(decisionResult.latestEventSequence).toBe(3);
      expect(subscription.events.map((event) => event.type)).toContain(
        OrchestrationServiceEventType.ARTIFACT_READY,
      );
      expect(subscription.events[2]?.artifactPath).toBe(decisionResult.decisionReceiptArtifactPath);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('resolves memory provider composition through the shared loader and exposes it in health and execution summaries', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-memory-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory/service-shared-loader',
      },
      executionIdProvider: () => 'exec-shell-memory-001',
      executionSessionIdProvider: () => 'session-shell-memory-001',
    });

    try {
      const health = await orchestrationService.getHealth();
      const started = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-memory',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
        },
        {
          processId: 'process-orchestration-shell-memory',
        },
      );
      const summary = await orchestrationService.getExecution(started.executionId);

      expect(health.memoryProvider).toEqual(
        expect.objectContaining({
          memoryStoreProviderId: 'fs-csv',
          memoryStoreDistributionMode: 'default',
          memoryStoreResolutionSource: 'legacy_store_engine',
          memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
          memoryStoreRuntimeMode: MemoryProviderRuntimeMode.EMBEDDED,
        }),
      );
      expect(started.memoryProvider).toEqual(health.memoryProvider);
      expect(summary?.memoryProvider).toEqual(health.memoryProvider);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('keeps HITL pending when a degrade decision is supplied with a pre-existing receipt path', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-unit-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-shell-hitl-002',
      executionSessionIdProvider: () => 'session-shell-hitl-002',
      nowProvider: () => new Date('2026-03-25T12:45:00Z'),
    });

    try {
      const started = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-unit',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
        },
        {
          processId: 'process-orchestration-shell-hitl-degrade',
        },
      );
      await orchestrationService.publishEvent({
        executionId: started.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting revised HITL decision.',
      });

      const providedReceiptPath = join(
        temporaryRoot,
        'context',
        'hitl',
        'decisions',
        'provided.json',
      );
      await mkdir(join(temporaryRoot, 'context', 'hitl', 'decisions'), {
        recursive: true,
      });
      await writeFile(
        providedReceiptPath,
        JSON.stringify(
          {
            executionId: started.executionId,
            decision: 'revise',
            resumeAction: 'degrade',
          },
          null,
          2,
        ),
        'utf8',
      );

      const decisionResult = await orchestrationService.submitHitlDecision({
        executionId: started.executionId,
        executionSessionId: started.executionSessionId,
        decision: 'revise',
        resumeAction: 'degrade',
        actor: 'reviewer',
        decisionReceiptArtifactPath: providedReceiptPath,
      });

      expect(decisionResult.accepted).toBe(true);
      expect(decisionResult.decisionReceiptArtifactPath).toBe(providedReceiptPath);
      expect(decisionResult.nextStatus).toBe(OrchestrationExecutionStatus.HITL_REQUIRED);
      expect(decisionResult.executionSummary.status).toBe(
        OrchestrationExecutionStatus.HITL_REQUIRED,
      );
      expect(decisionResult.executionSummary.pendingHitl).toBe(true);
      expect(decisionResult.executionSummary.latestArtifactPath).toBe(providedReceiptPath);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('lists execution summaries with filters and keeps service-owned summary fields stable', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-unit-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: (() => {
        const executionIds = ['exec-list-001', 'exec-list-002'];
        return () => executionIds.shift() ?? 'exec-list-fallback';
      })(),
      executionSessionIdProvider: (executionId) => `session-${executionId}`,
      nowProvider: (() => {
        const timestamps = [
          new Date('2026-03-25T10:00:00Z'),
          new Date('2026-03-25T10:05:00Z'),
          new Date('2026-03-25T10:10:00Z'),
          new Date('2026-03-25T10:15:00Z'),
        ];
        return () => timestamps.shift() ?? new Date('2026-03-25T10:20:00Z');
      })(),
    });

    try {
      const first = await orchestrationService.startExecution({
        workspaceId: 'workspace-a',
        workspaceRoot: temporaryRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.CLI,
        taskId: 'TK-153',
        projectId: 'project-014',
        sprintId: 'sprint-003',
      });
      const second = await orchestrationService.startExecution({
        workspaceId: 'workspace-b',
        workspaceRoot: temporaryRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.DESKTOP,
        taskId: 'TK-other',
        projectId: 'project-other',
        sprintId: 'sprint-other',
      });
      await orchestrationService.publishEvent({
        executionId: first.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        stageId: 'stage-review',
        message: 'Awaiting review decision.',
      });

      const filtered = await orchestrationService.listExecutions({
        filter: {
          workspaceId: 'workspace-a',
          status: OrchestrationExecutionStatus.HITL_REQUIRED,
          taskId: 'TK-153',
          projectId: 'project-014',
          sprintId: 'sprint-003',
        },
        limit: 1,
      });
      const all = await orchestrationService.listExecutions();
      const fetched = await orchestrationService.getExecution(first.executionId);

      expect(fetched).toBeDefined();
      if (fetched === undefined) {
        return;
      }
      fetched.status = OrchestrationExecutionStatus.COMPLETED;
      const refetched = await orchestrationService.getExecution(first.executionId);

      expect(filtered.returnedCount).toBe(1);
      expect(filtered.totalMatchedCount).toBe(1);
      expect(filtered.executions[0]?.executionId).toBe(first.executionId);
      expect(filtered.executions[0]?.pendingHitl).toBe(true);
      expect(filtered.executions[0]?.currentStageId).toBe('stage-review');
      expect(all.returnedCount).toBe(2);
      expect(all.totalMatchedCount).toBe(2);
      expect(all.executions[0]?.executionId).toBe(second.executionId);
      expect(all.executions[1]?.executionId).toBe(first.executionId);
      expect(refetched?.status).toBe(OrchestrationExecutionStatus.HITL_REQUIRED);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when HITL decision or recovery is requested from an invalid execution state', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-unit-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-invalid-state-001',
      executionSessionIdProvider: () => 'session-invalid-state-001',
    });

    try {
      const started = await orchestrationService.startExecution({
        workspaceId: 'workspace-invalid',
        workspaceRoot: temporaryRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.CLI,
        taskId: 'TK-155',
        projectId: 'project-014',
        sprintId: 'sprint-003',
      });
      await orchestrationService.publishEvent({
        executionId: started.executionId,
        type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
        status: OrchestrationExecutionStatus.COMPLETED,
        message: 'Execution completed.',
      });

      let hitlError = standardizeError(new GovernorError(GovernorErrorCode.UNKNOWN, 'unreachable'));
      try {
        await orchestrationService.submitHitlDecision({
          executionId: started.executionId,
          executionSessionId: started.executionSessionId,
          decision: 'approve',
          resumeAction: 'resume',
          actor: 'reviewer',
        });
      } catch (error) {
        hitlError = standardizeError(error);
      }

      let recoveryError = standardizeError(
        new GovernorError(GovernorErrorCode.UNKNOWN, 'unreachable'),
      );
      try {
        await orchestrationService.recoverExecution({
          executionId: started.executionId,
        });
      } catch (error) {
        recoveryError = standardizeError(error);
      }

      expect(hitlError.code).toBe(GovernorErrorCode.MEMORY_SESSION_INVALID_STATUS);
      expect(recoveryError.code).toBe(GovernorErrorCode.MEMORY_SESSION_INVALID_STATUS);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('supports cursor-based incremental subscription for desktop-ready streaming', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-unit-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-cursor-001',
      executionSessionIdProvider: () => 'session-cursor-001',
    });

    try {
      const started = await orchestrationService.startExecution({
        workspaceId: 'workspace-cursor',
        workspaceRoot: temporaryRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.DESKTOP,
        taskId: 'TK-154',
        projectId: 'project-014',
        sprintId: 'sprint-003',
      });
      await orchestrationService.publishEvent({
        executionId: started.executionId,
        type: OrchestrationServiceEventType.STAGE_PROGRESS,
        status: OrchestrationExecutionStatus.RUNNING,
        stageId: 'stage-entry',
        message: 'Stage entry is running.',
      });
      await orchestrationService.publishEvent({
        executionId: started.executionId,
        type: OrchestrationServiceEventType.STAGE_COMPLETED,
        status: OrchestrationExecutionStatus.RUNNING,
        stageId: 'stage-entry',
        message: 'Stage entry completed.',
      });

      const firstSubscription = await orchestrationService.subscribeExecution({
        eventStreamToken: started.eventStreamToken,
      });

      await orchestrationService.publishEvent({
        executionId: started.executionId,
        type: OrchestrationServiceEventType.ARTIFACT_READY,
        status: OrchestrationExecutionStatus.RUNNING,
        artifactId: 'draft_report',
        message: 'Draft report ready.',
      });

      const secondSubscription = await orchestrationService.subscribeExecution({
        cursor: firstSubscription.nextCursor,
      });

      expect(firstSubscription.events.map((event) => event.sequence)).toEqual([1, 2, 3]);
      expect(firstSubscription.latestEventSequence).toBe(3);
      expect(firstSubscription.serviceHostKind).toBe(OrchestrationServiceHostKind.EMBEDDED);
      expect(firstSubscription.serviceTransportKind).toBe(
        OrchestrationServiceTransportKind.IN_PROCESS,
      );
      expect(secondSubscription.events).toHaveLength(1);
      expect(secondSubscription.events[0]?.sequence).toBe(4);
      expect(secondSubscription.events[0]?.artifactId).toBe('draft_report');
      expect(secondSubscription.latestEventSequence).toBe(4);
      expect(secondSubscription.nextCursor).toBe(secondSubscription.events[0]?.streamCursor);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('dispatches session.main turns through a real structured main-agent result instead of baseline ack', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      const turnResult = await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'Please connect the adapters for this repository',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );
      const deltaEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_STREAM_DELTA,
      );

      expect(turnResult.routeId).toBe(OrchestrationSessionRouteId.MAIN);
      expect(deltaEvent?.payload.delta).toBe('/connect');
      expect(completedEvent?.payload.responseMode).toBe('command_handoff_preview');
      expect(completedEvent?.payload.suggestedSlashCommand).toBe('/connect');
      expect(completedEvent?.payload.executionIntent).toBe('connect.adapters.bootstrap');
      expect(completedEvent?.payload.handoffCommandPreview).toBe(
        'repo-ai-governor connect --preset multi-tool-default --output pretty',
      );
      expect(completedEvent?.payload.selectedBy).toBe('session.main.intent_router');
      expect(completedEvent?.payload.requiresConfirmation).toBe(true);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('writes assistantMessage and interactionMode for direct-answer session.main turns when supervisor runtime is injected', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: async (context) => ({
          responseMode: 'answer',
          interactionMode: 'direct_answer',
          assistantDelta: '## Workspace status',
          assistantMessage: '## Workspace status\n\n- clean\n- ready for next step',
          executionIntent: 'session.answer',
          requiresConfirmation: false,
          selectedSurface: context.selectedSurface,
          selectedBy: 'session.main.answer.primary',
          sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
          invokedRoleIds: [],
        }),
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'Help me inspect the current workspace state',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('answer');
      expect(completedEvent?.payload.interactionMode).toBe('direct_answer');
      expect(completedEvent?.payload.assistantMessage).toBe(
        '## Workspace status\n\n- clean\n- ready for next step',
      );
      expect(completedEvent?.payload.executionIntent).toBe('session.answer');
      expect(completedEvent?.payload.selectedSurface).toBe('codex');
      expect(completedEvent?.payload.selectedBy).toBe('session.main.answer.primary');
      expect(completedEvent?.payload.invokedRoleIds).toEqual([]);
      expect(completedEvent?.payload.subagentCount).toBe(0);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('writes role-collaboration metadata for single-role delegated session.main turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: async () => ({
          responseMode: 'role_collaboration',
          interactionMode: 'single_role_delegate',
          assistantDelta: '## Planner perspective',
          assistantMessage: '## Planner perspective\n\n- checkpoint 1\n- checkpoint 2',
          routerDecisionReason: 'session.main.router.single_role_delegate.explicit_role',
          executionIntent: 'session.role_delegate.planner',
          requiresConfirmation: false,
          selectedSurface: 'ollama',
          selectedBy: 'session.main.role_delegate.safe_fallback',
          sessionRoutingPreferenceApplied: false,
          invokedRoleIds: ['planner'],
          subagentCount: 1,
        }),
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '@planner break this task into milestones',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('role_collaboration');
      expect(completedEvent?.payload.interactionMode).toBe('single_role_delegate');
      expect(completedEvent?.payload.assistantMessage).toBe(
        '## Planner perspective\n\n- checkpoint 1\n- checkpoint 2',
      );
      expect(completedEvent?.payload.routerDecisionReason).toBe(
        'session.main.router.single_role_delegate.explicit_role',
      );
      expect(completedEvent?.payload.executionIntent).toBe('session.role_delegate.planner');
      expect(completedEvent?.payload.selectedSurface).toBe('ollama');
      expect(completedEvent?.payload.selectedBy).toBe('session.main.role_delegate.safe_fallback');
      expect(completedEvent?.payload.invokedRoleIds).toEqual(['planner']);
      expect(completedEvent?.payload.subagentCount).toBe(1);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('applies session routing preference to selected surface and command preview metadata', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'connect the tools for this workspace',
        metadata: {
          sessionRoutingPreference: 'claude-code',
        },
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.selectedSurface).toBe('claude-code');
      expect(completedEvent?.payload.selectedBy).toBe('session.main.preference');
      expect(completedEvent?.payload.sessionRoutingPreferenceApplied).toBe(true);
      expect(completedEvent?.payload.handoffCommandPreview).toContain(
        '--single-tool-all-roles claude-code',
      );
      expect(completedEvent?.payload.handoffBacklinks).toEqual([
        {
          kind: 'slash_command',
          label: 'slash:/connect',
          target: '/connect',
        },
        {
          kind: 'execution_intent',
          label: 'intent:connect.adapters.bootstrap',
          target: 'connect.adapters.bootstrap',
        },
        {
          kind: 'command_preview',
          label: 'preview',
          target:
            'repo-ai-governor connect --preset multi-tool-default --output pretty --single-tool-all-roles claude-code',
        },
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('writes serial collaboration metadata for multi-role session.main turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveMentionedRoleId: () => 'planner',
        resolveTurn: async () => ({
          responseMode: 'role_collaboration',
          interactionMode: 'serial_role_collaboration',
          assistantDelta: '## Planner -> Reviewer Collaboration',
          assistantMessage: [
            '## Planner -> Reviewer Collaboration',
            '',
            '### Planner',
            '',
            '## Planner perspective\n\n- checkpoint 1\n- checkpoint 2',
            '',
            '### Reviewer',
            '',
            '## Reviewer perspective\n\n- sequencing looks safe',
          ].join('\n'),
          routerDecisionReason: 'session.main.router.serial_role_collaboration.explicit_roles',
          executionIntent: 'session.role_delegate.planner.reviewer',
          requiresConfirmation: false,
          selectedSurface: 'planner:ollama -> reviewer:ollama',
          selectedBy:
            'planner:session.main.role_delegate.safe_fallback -> reviewer:session.main.role_delegate.safe_fallback',
          sessionRoutingPreferenceApplied: false,
          invokedRoleIds: ['planner', 'reviewer'],
          subagentCount: 2,
        }),
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '@planner @reviewer collaborate on this rollout plan',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('role_collaboration');
      expect(completedEvent?.payload.interactionMode).toBe('serial_role_collaboration');
      expect(completedEvent?.payload.routerDecisionReason).toBe(
        'session.main.router.serial_role_collaboration.explicit_roles',
      );
      expect(completedEvent?.payload.executionIntent).toBe(
        'session.role_delegate.planner.reviewer',
      );
      expect(completedEvent?.payload.selectedSurface).toBe('planner:ollama -> reviewer:ollama');
      expect(completedEvent?.payload.invokedRoleIds).toEqual(['planner', 'reviewer']);
      expect(completedEvent?.payload.subagentCount).toBe(2);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('writes parallel collaboration metadata for multi-role session.main turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveMentionedRoleId: () => 'planner',
        resolveTurn: async () => ({
          responseMode: 'role_collaboration',
          interactionMode: 'parallel_role_fanout',
          assistantDelta: '## Planner + Reviewer Parallel Analysis',
          assistantMessage: [
            '## Planner + Reviewer Parallel Analysis',
            '',
            '### Planner',
            '',
            '## Planner perspective\n\n- planning risk',
            '',
            '### Reviewer',
            '',
            '## Reviewer perspective\n\n- review risk',
          ].join('\n'),
          routerDecisionReason: 'session.main.router.parallel_role_fanout.explicit_roles',
          synthesisMode: 'parallel_analysis',
          executionIntent: 'session.role_delegate.parallel.planner.reviewer',
          requiresConfirmation: false,
          selectedSurface: 'planner:ollama | reviewer:ollama',
          selectedBy:
            'planner:session.main.role_delegate.safe_fallback | reviewer:session.main.role_delegate.safe_fallback',
          sessionRoutingPreferenceApplied: false,
          invokedRoleIds: ['planner', 'reviewer'],
          subagentCount: 2,
        }),
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '@planner @reviewer parallel assess this rollout risk',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('role_collaboration');
      expect(completedEvent?.payload.interactionMode).toBe('parallel_role_fanout');
      expect(completedEvent?.payload.routerDecisionReason).toBe(
        'session.main.router.parallel_role_fanout.explicit_roles',
      );
      expect(completedEvent?.payload.synthesisMode).toBe('parallel_analysis');
      expect(completedEvent?.payload.executionIntent).toBe(
        'session.role_delegate.parallel.planner.reviewer',
      );
      expect(completedEvent?.payload.selectedSurface).toBe('planner:ollama | reviewer:ollama');
      expect(completedEvent?.payload.invokedRoleIds).toEqual(['planner', 'reviewer']);
      expect(completedEvent?.payload.subagentCount).toBe(2);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('keeps command handoff governance ahead of explicit role mentions for connect-like turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'role_collaboration',
      interactionMode: 'single_role_delegate',
      assistantDelta: '## Planner perspective',
      assistantMessage: '## Planner perspective\n\n- this should not be emitted',
      executionIntent: 'session.role_delegate.planner',
      requiresConfirmation: false,
      selectedSurface: 'ollama',
      selectedBy: 'session.main.role_delegate.safe_fallback',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: ['planner'],
      subagentCount: 1,
    }));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn,
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '@planner connect the tools for this workspace',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(resolveTurn).not.toHaveBeenCalled();
      expect(completedEvent?.payload.responseMode).toBe('command_handoff_preview');
      expect(completedEvent?.payload.suggestedSlashCommand).toBe('/connect');
      expect(completedEvent?.payload.requiresConfirmation).toBe(true);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('preserves review handoff preview when one unknown @mention is not a configured role', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'role_collaboration',
      interactionMode: 'single_role_delegate',
      assistantDelta: '## Planner perspective',
      assistantMessage: '## Planner perspective\n\n- this should not be emitted',
      executionIntent: 'session.role_delegate.planner',
      requiresConfirmation: false,
      selectedSurface: 'ollama',
      selectedBy: 'session.main.role_delegate.safe_fallback',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: ['planner'],
      subagentCount: 1,
    }));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveMentionedRoleId: () => null,
        resolveTurn,
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '@alice review this diff',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(resolveTurn).not.toHaveBeenCalled();
      expect(completedEvent?.payload.responseMode).toBe('command_handoff_preview');
      expect(completedEvent?.payload.suggestedSlashCommand).toBe('/review');
      expect(completedEvent?.payload.requiresConfirmation).toBe(true);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('emits failed and cancelled session-turn events for main-agent dispatcher interruptions', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });

      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'simulate failure for this turn',
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'please simulate cancel for this turn',
      });

      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const eventTypes = subscription.events.map((event) => event.type);
      const failedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_FAILED,
      );
      const cancelledEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_CANCELLED,
      );

      expect(eventTypes).toContain(OrchestrationSessionEventType.TURN_FAILED);
      expect(eventTypes).toContain(OrchestrationSessionEventType.TURN_CANCELLED);
      expect(failedEvent?.payload.errorCode).toBe('ADAPTER_PROTOCOL_INVOKE_FAILED');
      expect(cancelledEvent?.payload.errorCode).toBe('PROCESS_RUNTIME_CANCELLED');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('keeps turnIndex monotonic after failed and cancelled turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });

      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'simulate failure for this turn',
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'please simulate cancel for this turn',
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'Please connect the adapters for this repository',
      });

      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const failedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_FAILED,
      );
      const cancelledEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_CANCELLED,
      );
      const completedEvents = subscription.events.filter(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(failedEvent?.payload.turnIndex).toBe(1);
      expect(cancelledEvent?.payload.turnIndex).toBe(2);
      expect(completedEvents[0]?.payload.turnIndex).toBe(3);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
