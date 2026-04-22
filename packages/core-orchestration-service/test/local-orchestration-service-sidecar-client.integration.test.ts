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
  OrchestrationWorkflowDraftConflictKind,
  OrchestrationWorkflowDraftEntryMode,
  OrchestrationWorkflowDraftSupportedPatchOp,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, MemoryStoreEngine } from '@repo-ai-governor/shared';
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

  it('exposes workflow draft-session authoring seams over the sidecar IPC contract', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-workflow-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(workspaceRoot, { recursive: true });

      const startedDraft = await client.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'parallel-review',
      });
      const workflowDraftId = startedDraft.draftSession.workflowDraftId;
      const firstRevision = startedDraft.draftSession.draftRevision;

      const mutatedDraft = await client.updateWorkflowDraftNode({
        workflowDraftId,
        draftRevision: firstRevision,
        nodeId: 'node-review',
        nodeSpec: {
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
      });
      const queriedDraft = await client.queryWorkflowDraftSession({
        workflowDraftId,
      });
      const committedDraft = await client.commitWorkflowDraft({
        workflowDraftId,
        draftRevision: mutatedDraft.draftSession.draftRevision,
      });

      expect(startedDraft.applied).toBe(true);
      expect(startedDraft.draftSession.entryMode).toBe(
        OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
      );
      expect(mutatedDraft.applied).toBe(true);
      expect(
        mutatedDraft.draftSession.nodeSpecs.some(
          (node: (typeof mutatedDraft.draftSession.nodeSpecs)[number]) =>
            node.nodeId === 'node-review',
        ),
      ).toBe(true);
      expect(queriedDraft?.workflowDraftId).toBe(workflowDraftId);
      expect(committedDraft.applied).toBe(true);
      expect(committedDraft.definitionPath).toContain('active-workflow.definition.json');
      expect(committedDraft.compiledIrPath).toContain('compiled-ir');
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('guards mutable workflow draft replacement over the sidecar IPC contract until the caller confirms overwrite', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-workflow-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(workspaceRoot, { recursive: true });

      const startedDraft = await client.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'parallel-review',
      });
      const blockedReplacement = await client.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.READ_ONLY,
        templateId: 'loop-guarded',
      });
      const replacedDraft = await client.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.READ_ONLY,
        templateId: 'loop-guarded',
        replaceExistingDraftSession: true,
      });

      expect(blockedReplacement.applied).toBe(false);
      expect(blockedReplacement.draftSession.workflowDraftId).toBe(
        startedDraft.draftSession.workflowDraftId,
      );
      expect(replacedDraft.applied).toBe(true);
      expect(replacedDraft.draftSession.workflowDraftId).not.toBe(
        startedDraft.draftSession.workflowDraftId,
      );
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('supports true workflow edge replacement over the sidecar IPC contract', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-workflow-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(workspaceRoot, { recursive: true });

      const startedDraft = await client.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'condition-route',
      });
      const editedDraft = await client.updateWorkflowDraftEdge({
        workflowDraftId: startedDraft.draftSession.workflowDraftId,
        draftRevision: startedDraft.draftSession.draftRevision,
        previousEdgeSpec: {
          fromNodeId: 'node-route-policy',
          toNodeId: 'node-fast-lane',
          conditionKey: 'allow',
        },
        edgeSpec: {
          fromNodeId: 'node-route-policy',
          toNodeId: 'node-guarded-lane',
          conditionKey: 'allow',
        },
      });

      expect(editedDraft.applied).toBe(true);
      expect(editedDraft.draftSession.edgeSpecs).toHaveLength(3);
      expect(
        editedDraft.draftSession.edgeSpecs.some(
          (edge) =>
            edge.fromNodeId === 'node-route-policy' &&
            edge.toNodeId === 'node-fast-lane' &&
            edge.conditionKey === 'allow',
        ),
      ).toBe(false);
      expect(
        editedDraft.draftSession.edgeSpecs.filter(
          (edge) =>
            edge.fromNodeId === 'node-route-policy' &&
            edge.toNodeId === 'node-guarded-lane' &&
            edge.conditionKey === 'allow',
        ),
      ).toHaveLength(1);
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('blocks read-only preview drafts from mutating or committing canonical workflow state', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-preview-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const persistedDraftPath = join(
      workspaceRoot,
      'context',
      'workflow',
      'draft-sessions',
      'direct-workbench.active.json',
    );
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(workspaceRoot, { recursive: true });

      const startedDraft = await client.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.READ_ONLY,
        templateId: 'parallel-review',
      });
      const workflowDraftId = startedDraft.draftSession.workflowDraftId;
      const previewMutation = await client.updateWorkflowDraftNode({
        workflowDraftId,
        draftRevision: startedDraft.draftSession.draftRevision,
        nodeId: 'node-preview',
        nodeSpec: {
          nodeId: 'node-preview',
          stageId: 'stage-preview',
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: 'preview',
          roleProfileId: 'reviewer-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
      });
      const previewCommit = await client.commitWorkflowDraft({
        workflowDraftId,
        draftRevision: startedDraft.draftSession.draftRevision,
      });
      const queriedDraft = await client.queryWorkflowDraftSession({
        workflowDraftId,
      });
      const persistedPayload = JSON.parse(await readFile(persistedDraftPath, 'utf8')) as {
        session: {
          supportedPatchOps: string[];
        };
      };
      persistedPayload.session.supportedPatchOps = [
        OrchestrationWorkflowDraftSupportedPatchOp.UPSERT_NODE,
        OrchestrationWorkflowDraftSupportedPatchOp.COMMIT,
      ];
      await writeFile(persistedDraftPath, JSON.stringify(persistedPayload, null, 2), 'utf8');
      const rehydratedDraft = await client.queryWorkflowDraftSession({
        workflowDraftId,
      });

      expect(startedDraft.draftSession.supportedPatchOps).toEqual([
        OrchestrationWorkflowDraftSupportedPatchOp.VALIDATE,
      ]);
      expect(previewMutation.applied).toBe(false);
      expect(previewMutation.message).toContain('read-only');
      expect(previewCommit.applied).toBe(false);
      expect(previewCommit.message).toContain('read-only');
      expect(queriedDraft?.supportedPatchOps).toEqual([
        OrchestrationWorkflowDraftSupportedPatchOp.VALIDATE,
      ]);
      expect(rehydratedDraft?.supportedPatchOps).toEqual([
        OrchestrationWorkflowDraftSupportedPatchOp.VALIDATE,
      ]);
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when the persisted draft-session artifact is corrupted', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'local-orchestration-sidecar-corrupt-draft-session-'),
    );
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const persistedDraftPath = join(
      workspaceRoot,
      'context',
      'workflow',
      'draft-sessions',
      'direct-workbench.active.json',
    );
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(join(workspaceRoot, 'context', 'workflow', 'draft-sessions'), {
        recursive: true,
      });
      await writeFile(persistedDraftPath, '{not valid json', 'utf8');

      await expect(
        client.queryWorkflowDraftSession({
          workflowDraftId: 'workflow-draft-corrupt',
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
        message: expect.stringContaining('workflow draft session'),
      });
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when workflow edit is requested from a corrupted saved workflow definition', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'local-orchestration-sidecar-corrupt-definition-'),
    );
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const persistedDefinitionPath = join(
      workspaceRoot,
      'context',
      'workflow',
      'active-workflow.definition.json',
    );
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(join(workspaceRoot, 'context', 'workflow'), { recursive: true });
      await writeFile(
        persistedDefinitionPath,
        JSON.stringify({
          schema_version: 'cli_workflow_definition_v1',
          generated_at: '2026-04-22T00:00:00.000Z',
          action: 'edit',
          template_id: 'parallel-review',
          definition_source: 'workspace_saved',
          definition: {
            processId: 'process-corrupt-definition',
            executionId: 'execution-corrupt-definition',
            entryNodeId: 'node-entry',
            nodes: 'not-an-array',
            edges: [],
          },
        }),
        'utf8',
      );

      await expect(
        client.startWorkflowDraft({
          entryMode: OrchestrationWorkflowDraftEntryMode.EDIT_SEED,
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
        message: expect.stringContaining('workflow definition'),
      });
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when workflow edit is requested without a saved workflow definition', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-edit-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(workspaceRoot, { recursive: true });

      await expect(
        client.startWorkflowDraft({
          entryMode: OrchestrationWorkflowDraftEntryMode.EDIT_SEED,
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
        message: expect.stringContaining('No saved workflow definition is available to edit yet.'),
      });
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed when workflow authoring starts from one unsupported template id', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-template-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(workspaceRoot, { recursive: true });

      await expect(
        client.startWorkflowDraft({
          entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
          templateId: 'unknown-template',
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        message: expect.stringContaining('Unknown workflow template id "unknown-template"'),
      });
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('returns stale-revision and base-definition conflicts for workflow draft authoring seams', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-sidecar-conflict-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const workflowDirectoryPath = join(workspaceRoot, 'context', 'workflow');
    const client = new LocalOrchestrationServiceSidecarClient(workspaceRoot);

    try {
      await mkdir(workspaceRoot, { recursive: true });
      await mkdir(workflowDirectoryPath, { recursive: true });

      const startedDraft = await client.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'parallel-review',
      });
      const workflowDraftId = startedDraft.draftSession.workflowDraftId;
      const firstRevision = startedDraft.draftSession.draftRevision;

      const mutatedDraft = await client.updateWorkflowDraftNode({
        workflowDraftId,
        draftRevision: firstRevision,
        nodeId: 'node-conflict',
        nodeSpec: {
          nodeId: 'node-conflict',
          stageId: 'stage-conflict',
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: 'conflict',
          roleProfileId: 'reviewer-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
      });
      const staleMutation = await client.updateWorkflowDraftEdge({
        workflowDraftId,
        draftRevision: firstRevision,
        edgeSpec: {
          fromNodeId: 'node-plan',
          toNodeId: 'node-conflict',
        },
      });
      const refreshedAfterStale = await client.queryWorkflowDraftSession({
        workflowDraftId,
      });
      await writeFile(
        join(workflowDirectoryPath, 'active-workflow.definition.json'),
        JSON.stringify(
          {
            schema_version: 'cli_workflow_definition_v1',
            generated_at: '2026-04-22T08:00:00.000Z',
            action: 'edit',
            template_id: 'parallel-review',
            definition_source: 'workspace_saved',
            definition: {
              processId: 'process-base-changed',
              executionId: 'execution-base-changed',
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
              ],
              edges: [],
            },
          },
          null,
          2,
        ),
        'utf8',
      );
      const rehydratedAfterBaseChange = await client.queryWorkflowDraftSession({
        workflowDraftId,
      });
      const baseChangedCommit = await client.commitWorkflowDraft({
        workflowDraftId,
        draftRevision: mutatedDraft.draftSession.draftRevision,
      });
      const revalidatedDraft = await client.validateWorkflowDraft({
        workflowDraftId,
        draftRevision: mutatedDraft.draftSession.draftRevision,
      });

      expect(mutatedDraft.applied).toBe(true);
      expect(startedDraft.draftSession.supportedPatchOps).toEqual(
        expect.arrayContaining([
          OrchestrationWorkflowDraftSupportedPatchOp.UPDATE_NODE_POLICY,
          OrchestrationWorkflowDraftSupportedPatchOp.UPDATE_WORKFLOW_METADATA,
          OrchestrationWorkflowDraftSupportedPatchOp.COMMIT,
        ]),
      );
      expect(staleMutation.applied).toBe(false);
      expect(staleMutation.message).toContain('stale');
      expect(staleMutation.draftSession.draftRevision).toBe(
        mutatedDraft.draftSession.draftRevision,
      );
      expect(staleMutation.draftSession.conflictState.conflictKind).toBe(
        OrchestrationWorkflowDraftConflictKind.NONE,
      );
      expect(refreshedAfterStale?.draftRevision).toBe(mutatedDraft.draftSession.draftRevision);
      expect(refreshedAfterStale?.conflictState.conflictKind).toBe(
        OrchestrationWorkflowDraftConflictKind.NONE,
      );
      expect(rehydratedAfterBaseChange?.conflictState.conflictKind).toBe(
        OrchestrationWorkflowDraftConflictKind.BASE_DEFINITION_CHANGED,
      );
      expect(baseChangedCommit.applied).toBe(false);
      expect(baseChangedCommit.draftSession.conflictState.conflictKind).toBe(
        OrchestrationWorkflowDraftConflictKind.BASE_DEFINITION_CHANGED,
      );
      expect(revalidatedDraft.applied).toBe(false);
      expect(revalidatedDraft.draftSession.conflictState.conflictKind).toBe(
        OrchestrationWorkflowDraftConflictKind.BASE_DEFINITION_CHANGED,
      );
    } finally {
      await client.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
