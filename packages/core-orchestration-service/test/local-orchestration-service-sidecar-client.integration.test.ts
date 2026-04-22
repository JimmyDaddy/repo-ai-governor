import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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
} from '@repo-ai-governor/orchestration-service-client';
import { MemoryStoreEngine } from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceSidecarClient } from '../src/index.js';

function createGraphPlan() {
  const compiler = new ProcessCompiler();
  const compiledIr = compiler.compile({
    processId: 'process-sidecar-client-test',
    executionId: 'exec-sidecar-client-test',
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

describe('LocalOrchestrationServiceSidecarClient', () => {
  it('runs a local sidecar host over Node IPC and preserves sidecar host descriptors', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-'));
    const client = new LocalOrchestrationServiceSidecarClient(temporaryRoot, {
      memoryConfig: {
        storeEngine: MemoryStoreEngine.SQLITE_FS,
        storeRoot: 'context/memory/sidecar-plugin',
        provider: {
          module: '@repo-ai-governor/memory-provider-sqlite-fs',
          exportName: 'createMemoryStoreProvider',
        },
      },
    });

    try {
      const health = await client.getHealth();
      const plan = createGraphPlan();
      const started = await client.startExecution(
        {
          workspaceId: 'workspace-sidecar',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: 'TK-164',
          projectId: 'project-016',
          sprintId: 'sprint-001',
        },
        {
          processId: plan.processId,
          executionId: plan.executionId,
          executionSessionId: 'session-sidecar-001',
        },
      );
      await client.publishEvent({
        executionId: plan.executionId,
        type: OrchestrationServiceEventType.STAGE_COMPLETED,
        status: OrchestrationExecutionStatus.RUNNING,
        stageId: 'stage-entry',
        message: 'stage completed',
      });
      const recoveredExecution = await client.saveCheckpoint({
        executionId: plan.executionId,
        plan,
        executionSessionId: 'session-sidecar-001',
        activeNodeIds: ['node-review'],
        visitedNodeIds: ['node-entry'],
        reducedState: {
          'execution.cursor': 'node-review',
          'execution.visited_nodes': ['node-entry'],
        },
      });
      await client.publishEvent({
        executionId: plan.executionId,
        type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
        status: OrchestrationExecutionStatus.COMPLETED,
        message: 'completed',
      });

      const summary = await client.getExecution(plan.executionId);
      const listed = await client.listExecutions({
        filter: {
          workspaceId: 'workspace-sidecar',
        },
      });
      const subscription = await client.subscribeExecution({
        executionId: plan.executionId,
      });

      expect(health.lifecycleStatus).toBe(OrchestrationServiceLifecycleStatus.READY);
      expect(health.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(health.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(health.memoryProvider).toEqual(
        expect.objectContaining({
          memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
          memoryStoreProviderModule: '@repo-ai-governor/memory-provider-sqlite-fs',
          memoryStoreResolutionSource: 'plugin_module',
          memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
          memoryStoreRuntimeMode: MemoryProviderRuntimeMode.DAEMON,
        }),
      );
      expect(health.pid).toBeTypeOf('number');
      expect(started.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(started.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(started.memoryProvider).toEqual(health.memoryProvider);
      expect(recoveredExecution?.checkpointSource).toBe('sqlite-fs');
      expect(summary?.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(summary?.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(summary?.memoryProvider).toEqual(health.memoryProvider);
      expect(summary?.checkpointPath).toContain('langgraph-checkpoints.sqlite#');
      expect(listed.executions).toHaveLength(1);
      expect(listed.executions[0]?.memoryProvider).toEqual(health.memoryProvider);
      expect(subscription.events.map((event) => event.type)).toEqual([
        OrchestrationServiceEventType.EXECUTION_STARTED,
        OrchestrationServiceEventType.STAGE_COMPLETED,
        OrchestrationServiceEventType.ARTIFACT_READY,
        OrchestrationServiceEventType.EXECUTION_COMPLETED,
      ]);
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('exposes governance read models and terminateExecution over the sidecar IPC contract', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-governance-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-001/review');
    const executionWorkspaceRoot = join(temporaryRoot, 'workspace');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await mkdir(executionWorkspaceRoot, { recursive: true });
      await writeFile(
        join(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-048\`
- Sprint: \`sprint-001\`
- Docs root: \`.repo-ai-governor/context/dev/project-048\`
- Task records: \`.repo-ai-governor/context/dev/project-048/sprint-001/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-048/sprint-001/review\`
`,
      );
      const reviewDocumentPath560 = join(reviewDirectoryPath, 'code_review_tk-560.md');
      const reviewDocumentPath561 = join(reviewDirectoryPath, 'code_review_tk-561.md');
      await writeFile(
        reviewDocumentPath560,
        '# Code Review: TK-560\n\n- Status: review_pending\n- Task: `TK-560`\n- Scope: `project-048 / sprint-001`\n',
      );
      await writeFile(
        reviewDocumentPath561,
        '# Code Review: TK-561\n\n- Status: review_pending\n- Task: `TK-561`\n- Scope: `project-048 / sprint-001`\n',
      );

      const started560 = await client.startExecution(
        {
          workspaceId: 'workspace-sidecar',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: 'TK-560',
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          processId: 'process-sidecar-governance-560',
          executionId: 'exec-sidecar-governance-560',
          executionSessionId: 'session-sidecar-governance-560',
        },
      );
      const started561 = await client.startExecution(
        {
          workspaceId: 'workspace-sidecar',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: 'TK-561',
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          processId: 'process-sidecar-governance-561',
          executionId: 'exec-sidecar-governance-561',
          executionSessionId: 'session-sidecar-governance-561',
        },
      );
      await client.publishEvent({
        executionId: started560.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting HITL decision.',
      });
      await client.publishEvent({
        executionId: started561.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting HITL decision.',
      });

      const executionBoard = await client.queryExecutionBoard({
        filter: {
          projectId: 'project-048',
        },
      });
      const hitlInbox = await client.queryHitlInbox({
        filter: {
          sprintId: 'sprint-001',
        },
      });
      const queueOverview = await client.queryQueueOverview({
        filter: {
          projectId: 'project-048',
        },
      });
      const roleLaneStatus = await client.queryRoleLaneStatus({
        executionId: started561.executionId,
      });
      const sessionContinuity = await client.querySessionContinuity({
        executionId: started561.executionId,
      });
      const hitlDecisionPacket = await client.queryHitlDecisionPacket({
        executionId: started561.executionId,
      });
      const repeatedHitlDecisionPacket = await client.queryHitlDecisionPacket({
        executionId: started561.executionId,
      });
      const termination = await client.terminateExecution({
        executionId: started560.executionId,
        actor: 'desktop-reviewer',
        reason: 'Stop execution',
      });
      const execution560 = executionBoard.executions.find(
        (entry) => entry.execution.executionId === started560.executionId,
      );
      const execution561 = executionBoard.executions.find(
        (entry) => entry.execution.executionId === started561.executionId,
      );

      expect(execution560?.execution.executionId).toBe(started560.executionId);
      expect(execution560?.handoffTargets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            targetKind: 'worktree',
            targetPath: executionWorkspaceRoot,
          }),
          expect.objectContaining({
            targetKind: 'review_document',
            targetPath: reviewDocumentPath560,
          }),
        ]),
      );
      expect(execution561?.handoffTargets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            targetKind: 'review_document',
            targetPath: reviewDocumentPath561,
          }),
        ]),
      );
      expect(hitlInbox.pendingDecisions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            execution: expect.objectContaining({
              executionId: started560.executionId,
            }),
          }),
          expect.objectContaining({
            execution: expect.objectContaining({
              executionId: started561.executionId,
            }),
          }),
        ]),
      );
      expect(queueOverview.automationInbox).toHaveLength(2);
      expect(queueOverview.reviewQueue).toHaveLength(2);
      expect(queueOverview.parallelLanes[0]?.activeExecutionCount).toBe(2);
      expect(queueOverview.notificationOwnership.pendingItemCount).toBe(4);
      expect(roleLaneStatus).toMatchObject({
        returnedCount: 1,
        totalMatchedCount: 1,
        lanes: [
          expect.objectContaining({
            executionId: started561.executionId,
            sessionId: started561.executionSessionId,
            pendingHitl: true,
            latestEventType: 'hitl.required',
          }),
        ],
      });
      expect(sessionContinuity?.sessionId).toBe(started561.executionSessionId);
      expect(hitlDecisionPacket).toMatchObject({
        executionId: started561.executionId,
        executionSessionId: started561.executionSessionId,
        taskId: 'TK-561',
        policyAction: 'confirm',
        defaultTimeoutAction: 'block',
        reviewId: 'code_review_tk-561.md',
      });
      expect(hitlDecisionPacket?.riskFacts[0]).toEqual(
        expect.objectContaining({
          riskCategory: 'hitl-decision-pending',
          riskLevel: 'L2',
          changeScope: 'TK-561',
          triggerRule: 'runtime-hitl-pending',
        }),
      );
      expect(repeatedHitlDecisionPacket?.slaDeadlineAt).toBe(hitlDecisionPacket?.slaDeadlineAt);
      expect(termination.terminated).toBe(true);
      expect(termination.nextStatus).toBe(OrchestrationExecutionStatus.CANCELLED);
      expect(termination.executionSummary.serviceHostKind).toBe(
        OrchestrationServiceHostKind.SIDECAR,
      );
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('keeps review-document handoff unavailable when the lone review file does not match execution ownership', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-review-miss-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-001/review');
    const executionWorkspaceRoot = join(temporaryRoot, 'workspace');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await mkdir(executionWorkspaceRoot, { recursive: true });
      await writeFile(
        join(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-048\`
- Sprint: \`sprint-001\`
- Docs root: \`.repo-ai-governor/context/dev/project-048\`
- Task records: \`.repo-ai-governor/context/dev/project-048/sprint-001/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-048/sprint-001/review\`
`,
      );
      await writeFile(
        join(reviewDirectoryPath, 'code_review_tk-999.md'),
        '# Code Review: TK-999\n\n- Status: review_pending\n- Task: `TK-999`\n- Scope: `project-048 / sprint-001`\n',
      );

      const started = await client.startExecution(
        {
          workspaceId: 'workspace-sidecar',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: 'TK-560',
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          processId: 'process-sidecar-review-miss',
          executionId: 'exec-sidecar-review-miss',
          executionSessionId: 'session-sidecar-review-miss',
        },
      );

      const executionBoard = await client.queryExecutionBoard({
        filter: {
          projectId: 'project-048',
        },
      });
      const reviewTarget = executionBoard.executions
        .find((entry) => entry.execution.executionId === started.executionId)
        ?.handoffTargets.find((target) => target.targetKind === 'review_document');

      expect(reviewTarget?.exists).toBe(false);
      expect(reviewTarget?.targetPath).toBeUndefined();
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('keeps review-document handoff unavailable when multiple review files tie on project and sprint only', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-review-tie-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-001/review');
    const executionWorkspaceRoot = join(temporaryRoot, 'workspace');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await mkdir(executionWorkspaceRoot, { recursive: true });
      await writeFile(
        join(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-048\`
- Sprint: \`sprint-001\`
- Docs root: \`.repo-ai-governor/context/dev/project-048\`
- Task records: \`.repo-ai-governor/context/dev/project-048/sprint-001/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-048/sprint-001/review\`
`,
      );
      await writeFile(
        join(reviewDirectoryPath, 'code_review_scope-a.md'),
        '# Code Review: Scope A\n\n- Status: review_pending\n- Scope: `project-048 / sprint-001`\n',
      );
      await writeFile(
        join(reviewDirectoryPath, 'code_review_scope-b.md'),
        '# Code Review: Scope B\n\n- Status: review_pending\n- Scope: `project-048 / sprint-001`\n',
      );

      const started = await client.startExecution(
        {
          workspaceId: 'workspace-sidecar',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          processId: 'process-sidecar-review-tie',
          executionId: 'exec-sidecar-review-tie',
          executionSessionId: 'session-sidecar-review-tie',
        },
      );

      const executionBoard = await client.queryExecutionBoard({
        filter: {
          projectId: 'project-048',
        },
      });
      const reviewTarget = executionBoard.executions
        .find((entry) => entry.execution.executionId === started.executionId)
        ?.handoffTargets.find((target) => target.targetKind === 'review_document');

      expect(reviewTarget?.exists).toBe(false);
      expect(reviewTarget?.targetPath).toBeUndefined();
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
