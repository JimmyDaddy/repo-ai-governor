import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ProcessCompiler, ProcessNodeType } from '@repo-ai-governor/core-process';
import { CompiledIrGraphAdapter } from '@repo-ai-governor/core-runtime-langgraph';
import {
  MemoryProviderHostSurface,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import {
  ORCHESTRATION_SESSION_DISPLAY_USER_MESSAGE_METADATA_KEY,
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
  OrchestrationSessionEventType,
  OrchestrationSessionRouteId,
  OrchestrationSessionStatus,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import {
  GovernorError,
  GovernorErrorCode,
  MemoryStoreEngine,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  LocalOrchestrationServiceShell,
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME,
  SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID,
  SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY,
  SESSION_DELIVERY_WORKFLOW_PENDING_ACTION,
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_DELIVERY_WORKFLOW_VERSION,
  SESSION_MAIN_CAPABILITY_ID,
} from '../src/index.js';

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

  it('builds execution-board and HITL inbox read models with service-owned actions and handoff targets', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-governance-'));
    const repositoryRoot = join(temporaryRoot, 'governed repo');
    const workspaceRoot = join(
      temporaryRoot,
      'tool managed',
      'workspace governance',
      '.repo-ai-governor',
    );
    const executionWorkspaceRoot = repositoryRoot;
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-001/review');
    const artifactPath = join(executionWorkspaceRoot, 'artifacts/summary.md');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
      repositoryRoot,
    });

    try {
      await mkdir(join(workspaceRoot, 'context', 'upgrade'), { recursive: true });
      await mkdir(join(executionWorkspaceRoot, 'artifacts'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      const upgradeReportPath = join(
        workspaceRoot,
        'context',
        'upgrade',
        'upgrade-202604171203.report.json',
      );
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
        upgradeReportPath,
        JSON.stringify({
          upgradeId: 'upgrade-202604171203',
        }),
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
      await writeFile(artifactPath, 'artifact ready\n');

      const started560 = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-governance',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: 'TK-560',
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          executionId: 'exec-governance-560',
          executionSessionId: 'session-governance-560',
          processId: 'process-governance-560',
        },
      );
      const started561 = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-governance',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: 'TK-561',
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          executionId: 'exec-governance-561',
          executionSessionId: 'session-governance-561',
          processId: 'process-governance-561',
        },
      );
      await orchestrationService.publishEvent({
        executionId: started560.executionId,
        type: OrchestrationServiceEventType.ARTIFACT_READY,
        status: OrchestrationExecutionStatus.RUNNING,
        artifactId: 'artifact-summary',
        artifactPath,
        message: 'artifact ready',
      });
      await orchestrationService.publishEvent({
        executionId: started560.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting HITL decision.',
      });
      await orchestrationService.publishEvent({
        executionId: started561.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting HITL decision.',
      });

      const executionBoard = await orchestrationService.queryExecutionBoard({
        filter: {
          projectId: 'project-048',
        },
      });
      const hitlInbox = await orchestrationService.queryHitlInbox({
        filter: {
          sprintId: 'sprint-001',
        },
      });
      const queueOverview = await orchestrationService.queryQueueOverview({
        filter: {
          projectId: 'project-048',
        },
      });
      const execution560 = executionBoard.executions.find(
        (entry) => entry.execution.executionId === started560.executionId,
      );
      const execution561 = executionBoard.executions.find(
        (entry) => entry.execution.executionId === started561.executionId,
      );

      expect(executionBoard.totalMatchedCount).toBe(2);
      expect(execution560?.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actionKind: 'submit_hitl_decision',
            enabled: true,
            hitlDecisionOptions: expect.arrayContaining([
              expect.objectContaining({
                decision: 'approve',
                resumeAction: 'resume',
              }),
            ]),
          }),
          expect.objectContaining({
            actionKind: 'open_handoff_target',
            targetId: 'exec-governance-560:review-document',
          }),
        ]),
      );
      expect(execution560?.handoffTargets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            targetKind: 'worktree',
            targetPath: executionWorkspaceRoot,
          }),
          expect.objectContaining({
            targetKind: 'editor',
            targetPath: artifactPath,
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
      expect(hitlInbox.totalMatchedCount).toBe(2);
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
      expect(queueOverview.parallelLanes).toHaveLength(1);
      expect(queueOverview.parallelLanes[0]?.activeExecutionCount).toBe(2);
      expect(queueOverview.workspaceSummary).toHaveLength(1);
      expect(queueOverview.temporaryBridges).toHaveLength(6);
      expect(queueOverview.temporaryBridges[0]?.workspaceRoot).toBe(workspaceRoot);
      expect(queueOverview.temporaryBridges[0]?.commandWorkingDirectory).toBe(repositoryRoot);
      expect(queueOverview.temporaryBridges.map((entry) => entry.previewCommandLine)).toEqual([
        `repo-ai-governor adopt bootstrap adopter-complete --repo '${repositoryRoot}' --hosts codex,claude-code`,
        `repo-ai-governor adopt apply adopter-complete --repo '${repositoryRoot}' --hosts codex,claude-code,github-copilot`,
        `repo-ai-governor host export --host codex --mode project-local --output-dir '${join(workspaceRoot, 'generated', 'hosts', 'codex')}'`,
        `repo-ai-governor host verify --output-dir '${join(workspaceRoot, 'generated', 'hosts', 'github-copilot')}'`,
        `repo-ai-governor host pack --host claude-code --mode plugin-bundle --bundle-dir '${join(workspaceRoot, 'generated', 'bundles', 'claude')}'`,
        `repo-ai-governor upgrade apply '${upgradeReportPath}' --confirm-upgrade approve --output pretty`,
      ]);
      expect(queueOverview.workspaceSummary[0]?.workspaceId).toBe('workspace-governance');
      expect(queueOverview.workspaceSummary[0]?.reviewQueueCount).toBe(2);
      expect(queueOverview.notificationOwnership.ownerSurface).toBe(
        OrchestrationClientSurface.DESKTOP,
      );
      expect(queueOverview.notificationOwnership.pendingItemCount).toBe(4);
      expect(queueOverview.automationInbox[0]?.handoffTargets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            targetKind: 'review_document',
          }),
        ]),
      );
      expect(queueOverview.reviewQueue[0]?.reviewId).toContain('code_review_tk-');
      expect(queueOverview.reviewQueue[0]?.reviewFilePath).toContain('/review/code_review_tk-');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('treats custom repo-local workspace roots as the authoritative bridge workspace root', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-custom-bridge-'));
    const repositoryRoot = join(temporaryRoot, 'governed repo');
    const workspaceRoot = join(repositoryRoot, 'governance', 'state');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
      repositoryRoot,
    });

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      const queueOverview = await orchestrationService.queryQueueOverview();

      expect(queueOverview.temporaryBridges).toHaveLength(5);
      expect(queueOverview.temporaryBridges[0]?.workspaceRoot).toBe(workspaceRoot);
      expect(queueOverview.temporaryBridges[0]?.commandWorkingDirectory).toBe(repositoryRoot);
      expect(queueOverview.temporaryBridges.map((entry) => entry.previewCommandLine)).toEqual([
        `repo-ai-governor adopt bootstrap adopter-complete --repo '${repositoryRoot}' --hosts codex,claude-code`,
        `repo-ai-governor adopt apply adopter-complete --repo '${repositoryRoot}' --hosts codex,claude-code,github-copilot`,
        `repo-ai-governor host export --host codex --mode project-local --output-dir '${join(workspaceRoot, 'generated', 'hosts', 'codex')}'`,
        `repo-ai-governor host verify --output-dir '${join(workspaceRoot, 'generated', 'hosts', 'github-copilot')}'`,
        `repo-ai-governor host pack --host claude-code --mode plugin-bundle --bundle-dir '${join(workspaceRoot, 'generated', 'bundles', 'claude')}'`,
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('suppresses temporary bridges when repository-root facts are unavailable', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-no-repo-root-'));
    const workspaceRoot = join(temporaryRoot, 'governance', 'state');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
    });

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      const queueOverview = await orchestrationService.queryQueueOverview();

      expect(queueOverview.temporaryBridges).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('suppresses the upgrade temporary bridge when no upgrade report artifact exists', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'local-orchestration-shell-upgrade-bridge-'),
    );
    const repositoryRoot = join(temporaryRoot, 'governed-repo');
    const workspaceRoot = join(
      temporaryRoot,
      'tool-managed',
      'workspace-upgrade',
      '.repo-ai-governor',
    );
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
      repositoryRoot,
    });

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      const queueOverview = await orchestrationService.queryQueueOverview();

      expect(
        queueOverview.temporaryBridges.some(
          (entry) => entry.bridgeId === 'temporary-bridge-upgrade',
        ),
      ).toBe(false);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('preserves aggregate queue truth when returned desktop collections are UI-limited', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-queue-limit-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const workspaceARoot = join(temporaryRoot, 'workspace-a');
    const workspaceBRoot = join(temporaryRoot, 'workspace-b');
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-004/review');
    const reviewPathA = join(reviewDirectoryPath, 'code_review_tk-568.md');
    const reviewPathB = join(reviewDirectoryPath, 'verified_code_review_tk-569.md');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
      executionIdProvider: (() => {
        const executionIds = ['exec-queue-limit-001', 'exec-queue-limit-002'];
        return () => executionIds.shift() ?? 'exec-queue-limit-fallback';
      })(),
      executionSessionIdProvider: (executionId) => `session-${executionId}`,
      nowProvider: (() => {
        const timestamps = [
          new Date('2026-03-25T09:30:00Z'),
          new Date('2026-03-25T10:00:00Z'),
          new Date('2026-03-25T10:00:00Z'),
          new Date('2026-03-25T10:00:00Z'),
          new Date('2026-03-25T10:20:00Z'),
          new Date('2026-03-25T10:20:00Z'),
          new Date('2026-03-25T10:20:00Z'),
        ];
        return () => timestamps.shift() ?? new Date('2026-03-25T11:10:00Z');
      })(),
    });

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await mkdir(workspaceARoot, { recursive: true });
      await mkdir(workspaceBRoot, { recursive: true });
      await writeFile(
        join(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-048\`
- Sprint: \`sprint-004\`
- Docs root: \`.repo-ai-governor/context/dev/project-048\`
- Task records: \`.repo-ai-governor/context/dev/project-048/sprint-004/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-048/sprint-004/review\`
`,
      );
      await writeFile(
        reviewPathA,
        '# Code Review: TK-568\n\n- Status: review_pending\n- Task: `TK-568`\n- Scope: `project-048 / sprint-004`\n',
      );
      await writeFile(
        reviewPathB,
        '# Code Review: TK-569\n\n- Status: verified\n- Task: `TK-569`\n- Scope: `project-048 / sprint-004`\n',
      );
      await utimes(reviewPathA, new Date('2026-03-25T10:00:00Z'), new Date('2026-03-25T10:00:00Z'));
      await utimes(reviewPathB, new Date('2026-03-25T10:20:00Z'), new Date('2026-03-25T10:20:00Z'));

      const firstExecution = await orchestrationService.startExecution({
        workspaceId: 'workspace-a',
        workspaceRoot: workspaceARoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.DESKTOP,
        taskId: 'TK-568',
        projectId: 'project-048',
        sprintId: 'sprint-004',
      });
      await orchestrationService.publishEvent({
        executionId: firstExecution.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting queue review.',
      });

      const secondExecution = await orchestrationService.startExecution({
        workspaceId: 'workspace-b',
        workspaceRoot: workspaceBRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.DESKTOP,
        taskId: 'TK-569',
        projectId: 'project-048',
        sprintId: 'sprint-004',
      });
      await orchestrationService.publishEvent({
        executionId: secondExecution.executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: 'Awaiting queue review.',
      });

      const queueOverview = await orchestrationService.queryQueueOverview({
        filter: {
          projectId: 'project-048',
        },
        limit: 1,
        workspaceLimit: 1,
      });

      expect(queueOverview.automationInbox).toHaveLength(1);
      expect(queueOverview.reviewQueue).toHaveLength(1);
      expect(queueOverview.parallelLanes).toHaveLength(2);
      expect(queueOverview.workspaceSummary).toHaveLength(1);
      expect(queueOverview.notificationOwnership.pendingItemCount).toBe(4);
      expect(queueOverview.notificationOwnership.dueSoonItemCount).toBe(2);
      expect(queueOverview.notificationOwnership.overdueItemCount).toBe(2);
      expect(queueOverview.notificationOwnership.activeWorkspaceCount).toBe(2);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('includes a review-only governance workspace in queue overview summary', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-queue-review-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-004/review');
    const reviewPath = join(reviewDirectoryPath, 'code_review_tk-570.md');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
      nowProvider: () => new Date('2026-03-25T11:10:00Z'),
    });

    try {
      await mkdir(join(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await writeFile(
        join(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-048\`
- Sprint: \`sprint-004\`
- Docs root: \`.repo-ai-governor/context/dev/project-048\`
- Task records: \`.repo-ai-governor/context/dev/project-048/sprint-004/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-048/sprint-004/review\`
`,
      );
      await writeFile(
        reviewPath,
        '# Code Review: TK-570\n\n- Status: review_pending\n- Task: `TK-570`\n- Scope: `project-048 / sprint-004`\n',
      );
      await utimes(reviewPath, new Date('2026-03-25T10:20:00Z'), new Date('2026-03-25T10:20:00Z'));

      const queueOverview = await orchestrationService.queryQueueOverview({
        filter: {
          projectId: 'project-048',
        },
      });

      expect(queueOverview.automationInbox).toHaveLength(0);
      expect(queueOverview.reviewQueue).toHaveLength(1);
      expect(queueOverview.parallelLanes).toHaveLength(0);
      expect(queueOverview.workspaceSummary).toHaveLength(1);
      expect(queueOverview.workspaceSummary[0]).toEqual(
        expect.objectContaining({
          workspaceId: 'governance-workspace',
          workspaceRoot,
          totalExecutionCount: 0,
          activeExecutionCount: 0,
          reviewQueueCount: 1,
        }),
      );
      expect(queueOverview.notificationOwnership.pendingItemCount).toBe(1);
      expect(queueOverview.notificationOwnership.activeWorkspaceCount).toBe(0);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('omits review-document handoff when a lone review file does not match execution ownership', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-review-miss-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const executionWorkspaceRoot = join(temporaryRoot, 'workspace');
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-001/review');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
    });

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

      const started = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-governance',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          taskId: 'TK-560',
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          executionId: 'exec-governance-review-miss',
          executionSessionId: 'session-governance-review-miss',
          processId: 'process-governance-review-miss',
        },
      );

      const executionBoard = await orchestrationService.queryExecutionBoard({
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
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('omits review-document handoff when multiple review files tie on non-task ownership facts', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-review-tie-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const executionWorkspaceRoot = join(temporaryRoot, 'workspace');
    const reviewDirectoryPath = join(workspaceRoot, 'context/dev/project-048/sprint-001/review');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
    });

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

      const started = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-governance',
          workspaceRoot: executionWorkspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
          projectId: 'project-048',
          sprintId: 'sprint-001',
        },
        {
          executionId: 'exec-governance-review-tie',
          executionSessionId: 'session-governance-review-tie',
          processId: 'process-governance-review-tie',
        },
      );

      const executionBoard = await orchestrationService.queryExecutionBoard({
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
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('terminates an execution and persists a partial snapshot before cancelling it', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-terminate-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-terminate-001',
      executionSessionIdProvider: () => 'session-terminate-001',
    });

    try {
      const started = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-terminate',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.DESKTOP,
        },
        {
          processId: 'process-terminate-001',
        },
      );

      const termination = await orchestrationService.terminateExecution({
        executionId: started.executionId,
        actor: 'desktop-user',
        reason: 'Manual stop',
      });
      const summary = await orchestrationService.getExecution(started.executionId);
      const subscription = await orchestrationService.subscribeExecution({
        executionId: started.executionId,
      });
      const partialSnapshotPayload = JSON.parse(
        await readFile(termination.partialSnapshotArtifactPath as string, 'utf8'),
      ) as {
        actor: string;
        reason: string;
      };

      expect(termination.terminated).toBe(true);
      expect(termination.nextStatus).toBe(OrchestrationExecutionStatus.CANCELLED);
      expect(termination.partialSnapshotArtifactPath).toContain('partial-snapshot-');
      expect(partialSnapshotPayload.actor).toBe('desktop-user');
      expect(partialSnapshotPayload.reason).toBe('Manual stop');
      expect(summary?.status).toBe(OrchestrationExecutionStatus.CANCELLED);
      expect(subscription.events.map((event) => event.type)).toEqual([
        OrchestrationServiceEventType.EXECUTION_STARTED,
        OrchestrationServiceEventType.EXECUTION_PARTIAL_SNAPSHOT_PERSISTED,
        OrchestrationServiceEventType.EXECUTION_HARD_TERMINATION_STARTED,
      ]);
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
      expect(completedEvent?.payload.requiresConfirmation).toBe(false);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('maps supervisor stream events into shared session turn deltas for running presentation consumers', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: async (context) => {
          await context.publishStreamEvent?.({
            kind: 'lifecycle',
            state: 'running',
            title: 'Session Main Answer',
            detail: 'Planning current workspace answer.',
            selectedSurface: 'codex',
            stageId: 'stage-session-main-answer',
            routeKey: 'session.main.answer',
          });
          await context.publishStreamEvent?.({
            kind: 'token',
            state: 'running',
            title: 'Assistant Draft',
            chunkText: '## Workspace status',
            accumulatedText: '## Workspace status\n\n- clean',
            selectedSurface: 'codex',
            stageId: 'stage-session-main-answer',
            routeKey: 'session.main.answer',
            invokeLiveness: {
              status: 'running',
              transportKind: 'remote_api',
              vendorBindingKind: 'openai_responses',
              remoteRequestId: 'resp-session-1',
              lastTransportActivityAt: '2026-04-03T10:00:00.000Z',
              lastSemanticProgressAt: '2026-04-03T10:00:01.000Z',
              latestEventAt: '2026-04-03T10:00:01.000Z',
              latestEventType: 'token',
              latestTextPreview: '## Workspace status',
              partialOutputPreserved: false,
              cancelMechanism: 'none',
            },
          });
          return {
            responseMode: 'answer',
            interactionMode: 'direct_answer',
            assistantDelta: '## Workspace status',
            assistantMessage: '## Workspace status\n\n- clean',
            executionIntent: 'session.answer',
            requiresConfirmation: false,
            selectedSurface: 'codex',
            selectedBy: 'session.main.answer.primary',
            sessionRoutingPreferenceApplied: false,
            invokedRoleIds: [],
            invokedRoles: [],
            subagentCount: 0,
          };
        },
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '帮我总结一下当前工作区状态',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const deltaEvents = subscription.events.filter(
        (event) => event.type === OrchestrationSessionEventType.TURN_STREAM_DELTA,
      );
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(deltaEvents).toHaveLength(2);
      expect(deltaEvents[0]?.payload).toEqual(
        expect.objectContaining({
          streamKind: 'lifecycle',
          streamState: 'running',
          title: 'Session Main Answer',
          detail: 'Planning current workspace answer.',
          selectedSurface: 'codex',
          stageId: 'stage-session-main-answer',
          routeKey: 'session.main.answer',
          delta: 'Planning current workspace answer.',
        }),
      );
      expect(deltaEvents[1]?.payload).toEqual(
        expect.objectContaining({
          streamKind: 'token',
          streamState: 'running',
          title: 'Assistant Draft',
          chunkText: '## Workspace status',
          accumulatedText: '## Workspace status\n\n- clean',
          selectedSurface: 'codex',
          stageId: 'stage-session-main-answer',
          routeKey: 'session.main.answer',
          delta: '## Workspace status',
          invokeLiveness: expect.objectContaining({
            status: 'running',
            remoteRequestId: 'resp-session-1',
            lastTransportActivityAt: '2026-04-03T10:00:00.000Z',
            lastSemanticProgressAt: '2026-04-03T10:00:01.000Z',
          }),
        }),
      );
      expect(completedEvent?.payload.invokedRoles).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('projects capability explanation metadata into the canonical TURN_COMPLETED payload', async () => {
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
        userMessage: 'tell me about review',
        metadata: {
          locale: 'en-US',
        },
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload).toMatchObject({
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        responseMode: 'answer',
        capabilityAnswerKind: 'detail',
        referencedCapabilityIds: ['review'],
      });
      expect(completedEvent?.payload.suggestedActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Review',
            target: '/review',
            suggestedSlashCommand: '/review',
          }),
        ]),
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('projects delivery workflow presenter metadata into the canonical TURN_COMPLETED payload', async () => {
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
        userMessage: 'Help me deliver this requirement through the governed path.',
        metadata: {
          locale: 'en-US',
        },
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload).toMatchObject({
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        responseMode: 'answer',
        executionIntent: 'deliver.requirement_to_cr',
        turn_delivery_phase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_CAPTURE,
        turn_delivery_pending_action: 'capture_requirement_or_attach_approved_brief',
        turn_delivery_selected_stream: null,
        turn_delivery_result_summary: null,
      });
      expect(completedEvent?.payload.turn_delivery_related_artifact_paths).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('merges plan preview delivery updates into session context and appended transcript metadata', async () => {
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
        userMessage: 'Help me deliver this requirement through the governed path.',
        metadata: {
          locale: 'en-US',
        },
      });

      const appendResult = await orchestrationService.appendSessionMessage({
        sessionId: started.session.sessionId,
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines: ['Summary: plan preview is ready for confirmation.'],
        metadata: {
          renderKind: 'command_recap',
          commandLine: 'plan --output pretty',
          deliveryWorkflowUpdate: {
            currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING,
            pendingAction: 'confirm_task_plan_commit',
            selectedTargetStream: 'stream-project-110-sprint-002',
            relatedArtifactPaths: [
              '.repo-ai-governor/context/plan/plan-001.preview.json',
              '.repo-ai-governor/context/dev/project-110/sprint-002/plan.md',
              '.repo-ai-governor/context/dev/project-110/sprint-002/tasks/checklist.md',
            ],
            resultSummary: 'Task plan preview is ready for confirmation.',
            childWorkflowBacklinks: [
              {
                capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
                artifactPath: '.repo-ai-governor/context/plan/plan-001.preview.json',
                summary: 'Task plan preview artifact.',
              },
            ],
          },
        },
      });
      const session = await orchestrationService.getSession(started.session.sessionId);
      const deliveryWorkflowState = session?.context[
        SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY
      ] as Record<string, unknown> | null;

      expect(deliveryWorkflowState).toEqual(
        expect.objectContaining({
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING,
          pendingAction: 'confirm_task_plan_commit',
          selectedTargetStream: 'stream-project-110-sprint-002',
          resultSummary: 'Task plan preview is ready for confirmation.',
        }),
      );
      expect(deliveryWorkflowState?.relatedArtifactPaths).toEqual([
        '.repo-ai-governor/context/plan/plan-001.preview.json',
        '.repo-ai-governor/context/dev/project-110/sprint-002/plan.md',
        '.repo-ai-governor/context/dev/project-110/sprint-002/tasks/checklist.md',
      ]);
      expect(deliveryWorkflowState?.childWorkflowBacklinks).toEqual([
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
          artifactPath: '.repo-ai-governor/context/plan/plan-001.preview.json',
          summary: 'Task plan preview artifact.',
        },
      ]);
      expect(appendResult.event.payload.metadata).toMatchObject({
        turn_delivery_phase: SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING,
        turn_delivery_pending_action: 'confirm_task_plan_commit',
        turn_delivery_selected_stream: 'stream-project-110-sprint-002',
        turn_delivery_result_summary: 'Task plan preview is ready for confirmation.',
      });
      expect(appendResult.event.payload.metadata?.turn_delivery_related_artifact_paths).toEqual([
        '.repo-ai-governor/context/plan/plan-001.preview.json',
        '.repo-ai-governor/context/dev/project-110/sprint-002/plan.md',
        '.repo-ai-governor/context/dev/project-110/sprint-002/tasks/checklist.md',
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('bootstraps canonical delivery workflow state from appended metadata when no prior delivery turn exists', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });

      const appendResult = await orchestrationService.appendSessionMessage({
        sessionId: started.session.sessionId,
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines: ['Summary: plan preview is ready for confirmation.'],
        metadata: {
          renderKind: 'command_recap',
          commandLine: 'plan --output pretty',
          deliveryWorkflowUpdate: {
            currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING,
            pendingAction: 'confirm_task_plan_commit',
            selectedTargetStream: 'stream-project-110-sprint-002',
            relatedArtifactPaths: [
              '.repo-ai-governor/context/plan/plan-001.preview.json',
              '.repo-ai-governor/context/dev/project-110/sprint-002/tasks/checklist.md',
            ],
            resultSummary: 'Task plan preview is ready for confirmation.',
            childWorkflowBacklinks: [
              {
                capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
                artifactPath: '.repo-ai-governor/context/plan/plan-001.preview.json',
                summary: 'Task plan preview artifact.',
              },
            ],
          },
        },
      });
      const session = await orchestrationService.getSession(started.session.sessionId);
      const deliveryWorkflowState = session?.context[
        SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY
      ] as Record<string, unknown> | null;

      expect(deliveryWorkflowState).toEqual(
        expect.objectContaining({
          version: SESSION_DELIVERY_WORKFLOW_VERSION,
          workflowId: expect.stringContaining(`delivery-workflow-${started.session.sessionId}`),
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING,
          pendingAction: 'confirm_task_plan_commit',
          selectedTargetStream: 'stream-project-110-sprint-002',
          resultSummary: 'Task plan preview is ready for confirmation.',
          requirementReviewGate: {
            outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.PENDING,
            evidenceArtifactPath: null,
          },
        }),
      );
      expect(deliveryWorkflowState?.relatedArtifactPaths).toEqual([
        '.repo-ai-governor/context/plan/plan-001.preview.json',
        '.repo-ai-governor/context/dev/project-110/sprint-002/tasks/checklist.md',
      ]);
      expect(appendResult.event.payload.metadata).toMatchObject({
        turn_delivery_phase: SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING,
        turn_delivery_pending_action: 'confirm_task_plan_commit',
        turn_delivery_selected_stream: 'stream-project-110-sprint-002',
        turn_delivery_result_summary: 'Task plan preview is ready for confirmation.',
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('preserves the selected target stream when later deliver updates omit it', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });

      await orchestrationService.appendSessionMessage({
        sessionId: started.session.sessionId,
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines: ['Summary: task plan preview is ready for confirmation.'],
        metadata: {
          renderKind: 'command_recap',
          commandLine: 'plan --output pretty',
          deliveryWorkflowUpdate: {
            currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.TASK_PLAN_COMMIT_PENDING,
            pendingAction: SESSION_DELIVERY_WORKFLOW_PENDING_ACTION.CONFIRM_TASK_PLAN_COMMIT,
            selectedTargetStream: 'stream-project-110-sprint-003',
            relatedArtifactPaths: ['.repo-ai-governor/context/plan/plan-003.preview.json'],
            resultSummary: 'Task plan preview is ready for confirmation.',
            childWorkflowBacklinks: [
              {
                capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
                artifactPath: '.repo-ai-governor/context/plan/plan-003.preview.json',
                summary: 'Task plan preview artifact.',
              },
            ],
          },
        },
      });

      const appendResult = await orchestrationService.appendSessionMessage({
        sessionId: started.session.sessionId,
        role: OrchestrationSessionTranscriptRole.ASSISTANT,
        routeId: OrchestrationSessionRouteId.MAIN,
        lines: ['Summary: governed review verify completed and clean recheck is next.'],
        metadata: {
          renderKind: 'command_recap',
          commandLine: 'review-verify --output pretty',
          deliveryWorkflowUpdate: {
            currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.RESOLVED,
            pendingAction: SESSION_DELIVERY_WORKFLOW_PENDING_ACTION.RUN_FRESH_CLEAN_RECHECK,
            relatedArtifactPaths: [
              '.repo-ai-governor/context/dev/project-110/sprint-003/review/resolved_code_review_tk-929.md',
              '.repo-ai-governor/context/dev/project-110/sprint-003/tasks/CR-001.md',
            ],
            resultSummary: 'Governed review verify completed and clean recheck is next.',
            childWorkflowBacklinks: [
              {
                capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
                artifactPath:
                  '.repo-ai-governor/context/dev/project-110/sprint-003/review/resolved_code_review_tk-929.md',
                summary: 'Governed review verify completed and clean recheck is next.',
              },
              {
                capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
                artifactPath:
                  '.repo-ai-governor/context/dev/project-110/sprint-003/review/resolved_code_review_tk-929.md',
                summary: 'Governed review verify completed and clean recheck is next.',
              },
            ],
          },
        },
      });
      const session = await orchestrationService.getSession(started.session.sessionId);
      const deliveryWorkflowState = session?.context[
        SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY
      ] as Record<string, unknown> | null;

      expect(deliveryWorkflowState).toEqual(
        expect.objectContaining({
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.RESOLVED,
          pendingAction: SESSION_DELIVERY_WORKFLOW_PENDING_ACTION.RUN_FRESH_CLEAN_RECHECK,
          selectedTargetStream: 'stream-project-110-sprint-003',
          resultSummary: 'Governed review verify completed and clean recheck is next.',
        }),
      );
      expect(deliveryWorkflowState?.relatedArtifactPaths).toEqual([
        '.repo-ai-governor/context/plan/plan-003.preview.json',
        '.repo-ai-governor/context/dev/project-110/sprint-003/review/resolved_code_review_tk-929.md',
        '.repo-ai-governor/context/dev/project-110/sprint-003/tasks/CR-001.md',
      ]);
      expect(deliveryWorkflowState?.childWorkflowBacklinks).toEqual([
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
          artifactPath: '.repo-ai-governor/context/plan/plan-003.preview.json',
          summary: 'Task plan preview artifact.',
        },
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          artifactPath:
            '.repo-ai-governor/context/dev/project-110/sprint-003/review/resolved_code_review_tk-929.md',
          summary: 'Governed review verify completed and clean recheck is next.',
        },
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
          artifactPath:
            '.repo-ai-governor/context/dev/project-110/sprint-003/review/resolved_code_review_tk-929.md',
          summary: 'Governed review verify completed and clean recheck is next.',
        },
      ]);
      expect(appendResult.event.payload.metadata).toMatchObject({
        turn_delivery_phase: SESSION_DELIVERY_WORKFLOW_PHASE.RESOLVED,
        turn_delivery_pending_action:
          SESSION_DELIVERY_WORKFLOW_PENDING_ACTION.RUN_FRESH_CLEAN_RECHECK,
        turn_delivery_selected_stream: 'stream-project-110-sprint-003',
        turn_delivery_result_summary: 'Governed review verify completed and clean recheck is next.',
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('projects session.main invoke liveness into linked orchestration execution summaries and events', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-session-liveness-001',
      executionSessionIdProvider: () => 'session-exec-liveness-001',
      sessionMainSupervisorRuntime: {
        resolveTurn: async (context) => {
          await context.publishStreamEvent?.({
            kind: 'token',
            state: 'running',
            title: 'Assistant Draft',
            chunkText: 'remote draft',
            accumulatedText: 'remote draft complete',
            selectedSurface: 'codex',
            stageId: 'stage-session-main-answer',
            routeKey: 'session.main.answer',
            invokeLiveness: {
              status: 'running',
              transportKind: 'remote_api',
              vendorBindingKind: 'openai_responses',
              remoteRequestId: 'resp-linked-1',
              lastTransportActivityAt: '2026-04-03T12:00:00.000Z',
              lastSemanticProgressAt: '2026-04-03T12:00:01.000Z',
              latestEventAt: '2026-04-03T12:00:01.000Z',
              latestEventType: 'token',
              latestTextPreview: 'remote draft',
              partialOutputPreserved: false,
              cancelMechanism: 'none',
            },
          });
          await context.publishStreamEvent?.({
            kind: 'lifecycle',
            state: 'completed',
            title: 'Session Main Answer',
            detail: 'Remote answer completed.',
            selectedSurface: 'codex',
            stageId: 'stage-session-main-answer',
            routeKey: 'session.main.answer',
            invokeLiveness: {
              status: 'completed',
              transportKind: 'remote_api',
              vendorBindingKind: 'openai_responses',
              remoteRequestId: 'resp-linked-1',
              lastTransportActivityAt: '2026-04-03T12:00:02.000Z',
              lastSemanticProgressAt: '2026-04-03T12:00:01.000Z',
              lastTerminalSignalAt: '2026-04-03T12:00:02.000Z',
              latestEventAt: '2026-04-03T12:00:02.000Z',
              latestEventType: 'completed',
              latestTextPreview: 'remote draft complete',
              partialOutputPreserved: false,
              cancelMechanism: 'none',
            },
          });
          return {
            responseMode: 'answer',
            interactionMode: 'direct_answer',
            assistantDelta: 'remote draft',
            assistantMessage: 'remote draft complete',
            requiresConfirmation: false,
            selectedSurface: 'codex',
            selectedBy: 'session.main.answer.primary',
            sessionRoutingPreferenceApplied: false,
            invokedRoleIds: [],
            invokedRoles: [],
            subagentCount: 0,
          };
        },
      },
    });

    try {
      const startedExecution = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-session-liveness',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
        },
        {
          processId: 'process-session-liveness',
        },
      );
      const startedSession = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
        executionId: startedExecution.executionId,
        processId: 'process-session-liveness',
      });

      await orchestrationService.sendSessionTurn({
        sessionId: startedSession.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '请总结当前远端执行状态',
      });

      const executionSummary = await orchestrationService.getExecution(
        startedExecution.executionId,
      );
      const executionSubscription = await orchestrationService.subscribeExecution({
        executionId: startedExecution.executionId,
      });

      expect(executionSummary).toEqual(
        expect.objectContaining({
          livenessStatus: 'completed',
          lastTransportActivityAt: '2026-04-03T12:00:02.000Z',
          lastSemanticProgressAt: '2026-04-03T12:00:01.000Z',
          latestLivenessEventAt: '2026-04-03T12:00:02.000Z',
          latestLivenessEventType: 'completed',
          latestLivenessTextPreview: 'remote draft complete',
          partialOutputPreserved: false,
          transportKind: 'remote_api',
          vendorBindingKind: 'openai_responses',
          remoteRequestId: 'resp-linked-1',
          cancelMechanism: 'none',
          latestEventType: OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED,
        }),
      );
      expect(
        executionSubscription.events.filter(
          (event) => event.type === OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED,
        ),
      ).toEqual([
        expect.objectContaining({
          livenessSnapshot: expect.objectContaining({
            status: 'running',
            remoteRequestId: 'resp-linked-1',
            latestTextPreview: 'remote draft',
          }),
        }),
        expect.objectContaining({
          livenessSnapshot: expect.objectContaining({
            status: 'completed',
            remoteRequestId: 'resp-linked-1',
            latestTextPreview: 'remote draft complete',
          }),
        }),
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('projects graceful interrupt liveness transitions into linked orchestration execution events', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      executionIdProvider: () => 'exec-session-graceful-001',
      executionSessionIdProvider: () => 'session-exec-graceful-001',
      sessionMainSupervisorRuntime: {
        resolveTurn: async (context) => {
          await context.publishStreamEvent?.({
            kind: 'token',
            state: 'running',
            title: 'Assistant Draft',
            chunkText: 'partial draft',
            accumulatedText: 'partial draft',
            selectedSurface: 'github-copilot',
            stageId: 'stage-session-main-answer',
            routeKey: 'session.main.answer',
            invokeLiveness: {
              status: 'running',
              transportKind: 'cli_exec',
              lastTransportActivityAt: '2026-04-03T13:00:00.000Z',
              lastSemanticProgressAt: '2026-04-03T13:00:01.000Z',
              latestEventAt: '2026-04-03T13:00:01.000Z',
              latestEventType: 'token',
              latestTextPreview: 'partial draft',
              partialOutputPreserved: false,
              cancelMechanism: 'none',
            },
          });
          await context.publishStreamEvent?.({
            kind: 'lifecycle',
            state: 'failed',
            title: 'Assistant Interrupt',
            detail: 'Graceful interrupt requested before timeout.',
            selectedSurface: 'github-copilot',
            stageId: 'stage-session-main-answer',
            routeKey: 'session.main.answer',
            invokeLiveness: {
              status: 'graceful_interrupting',
              transportKind: 'cli_exec',
              lastTransportActivityAt: '2026-04-03T13:00:02.000Z',
              lastSemanticProgressAt: '2026-04-03T13:00:01.000Z',
              latestEventAt: '2026-04-03T13:00:02.000Z',
              latestEventType: 'graceful_interrupting',
              latestTextPreview: 'partial draft',
              partialOutputPreserved: true,
              cancelMechanism: 'process_signal',
              suspectReasonCodes: ['invoke_hard_timeout', 'invoke_partial_output_preserved'],
            },
          });
          await context.publishStreamEvent?.({
            kind: 'lifecycle',
            state: 'failed',
            title: 'Assistant Timeout',
            detail: 'Invocation timed out after graceful interrupt.',
            selectedSurface: 'github-copilot',
            stageId: 'stage-session-main-answer',
            routeKey: 'session.main.answer',
            invokeLiveness: {
              status: 'failed',
              transportKind: 'cli_exec',
              lastTransportActivityAt: '2026-04-03T13:00:03.000Z',
              lastSemanticProgressAt: '2026-04-03T13:00:01.000Z',
              lastTerminalSignalAt: '2026-04-03T13:00:03.000Z',
              latestEventAt: '2026-04-03T13:00:03.000Z',
              latestEventType: 'failed',
              latestTextPreview: 'partial draft',
              partialOutputPreserved: true,
              cancelMechanism: 'process_signal',
              suspectReasonCodes: ['invoke_hard_timeout', 'invoke_partial_output_preserved'],
            },
          });
          return {
            responseMode: 'answer',
            interactionMode: 'direct_answer',
            assistantDelta: 'partial draft',
            assistantMessage: 'partial draft',
            requiresConfirmation: false,
            selectedSurface: 'github-copilot',
            selectedBy: 'session.main.answer.primary',
            sessionRoutingPreferenceApplied: false,
            invokedRoleIds: [],
            invokedRoles: [],
            subagentCount: 0,
          };
        },
      },
    });

    try {
      const startedExecution = await orchestrationService.startExecution(
        {
          workspaceId: 'workspace-session-graceful',
          workspaceRoot: temporaryRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
        },
        {
          processId: 'process-session-graceful',
        },
      );
      const startedSession = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
        executionId: startedExecution.executionId,
        processId: 'process-session-graceful',
      });

      await orchestrationService.sendSessionTurn({
        sessionId: startedSession.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '请总结当前超时中的执行状态',
      });

      const executionSummary = await orchestrationService.getExecution(
        startedExecution.executionId,
      );
      const executionSubscription = await orchestrationService.subscribeExecution({
        executionId: startedExecution.executionId,
      });

      expect(executionSummary).toEqual(
        expect.objectContaining({
          livenessStatus: 'failed',
          livenessSuspectReasonCode: 'invoke_hard_timeout',
          lastTransportActivityAt: '2026-04-03T13:00:03.000Z',
          lastSemanticProgressAt: '2026-04-03T13:00:01.000Z',
          latestLivenessEventAt: '2026-04-03T13:00:03.000Z',
          latestLivenessEventType: 'failed',
          latestLivenessTextPreview: 'partial draft',
          partialOutputPreserved: true,
          transportKind: 'cli_exec',
          cancelMechanism: 'process_signal',
          latestEventType: OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED,
        }),
      );

      const livenessEvents = executionSubscription.events.filter((event) =>
        [
          OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED,
          OrchestrationServiceEventType.EXECUTION_GRACEFUL_INTERRUPT_STARTED,
          OrchestrationServiceEventType.EXECUTION_PARTIAL_SNAPSHOT_PERSISTED,
        ].includes(event.type),
      );

      expect(livenessEvents.map((event) => event.type)).toEqual([
        OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED,
        OrchestrationServiceEventType.EXECUTION_GRACEFUL_INTERRUPT_STARTED,
        OrchestrationServiceEventType.EXECUTION_PARTIAL_SNAPSHOT_PERSISTED,
        OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED,
      ]);
      expect(livenessEvents[1]).toEqual(
        expect.objectContaining({
          type: OrchestrationServiceEventType.EXECUTION_GRACEFUL_INTERRUPT_STARTED,
          livenessSnapshot: expect.objectContaining({
            status: 'graceful_interrupting',
            cancelMechanism: 'process_signal',
            partialOutputPreserved: true,
            suspectReasonCodes: ['invoke_hard_timeout', 'invoke_partial_output_preserved'],
          }),
        }),
      );
      expect(livenessEvents[2]).toEqual(
        expect.objectContaining({
          type: OrchestrationServiceEventType.EXECUTION_PARTIAL_SNAPSHOT_PERSISTED,
          livenessSnapshot: expect.objectContaining({
            status: 'graceful_interrupting',
            partialOutputPreserved: true,
          }),
        }),
      );
      expect(livenessEvents[3]).toEqual(
        expect.objectContaining({
          type: OrchestrationServiceEventType.EXECUTION_LIVENESS_UPDATED,
          livenessSnapshot: expect.objectContaining({
            status: 'failed',
            cancelMechanism: 'process_signal',
            suspectReasonCodes: ['invoke_hard_timeout', 'invoke_partial_output_preserved'],
          }),
        }),
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('migrates low-risk natural-language verify skills into direct-execute doctor turn metadata', async () => {
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
        userMessage: '帮我验证一下 adapter 状态',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('command_handoff_preview');
      expect(completedEvent?.payload.suggestedSlashCommand).toBe('/doctor');
      expect(completedEvent?.payload.requiresConfirmation).toBe(false);
      expect(completedEvent?.payload.skillId).toBe('skill.doctor.environment');
      expect(completedEvent?.payload.handoffExecutionMode).toBe('direct_execute');
      expect(completedEvent?.payload.commandBatches).toEqual([
        {
          slashQuery: '/doctor',
          bridgeArgv: ['doctor', '--adapters', '--output', 'pretty'],
          previewCommandLine: 'repo-ai-governor doctor --adapters --output pretty',
        },
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('projects branch-switch requests into direct-execute turn metadata', async () => {
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
        userMessage: '帮我把当前代码分支切换到 main',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('command_handoff_preview');
      expect(completedEvent?.payload.suggestedSlashCommand).toBe('/workspace switch-branch');
      expect(completedEvent?.payload.requiresConfirmation).toBe(false);
      expect(completedEvent?.payload.skillId).toBe('skill.workspace.switch_branch');
      expect(completedEvent?.payload.handoffExecutionMode).toBe('direct_execute');
      expect(completedEvent?.payload.commandBatches).toEqual([
        {
          slashQuery: '/workspace switch-branch main',
          bridgeArgv: ['workspace', 'switch-branch', 'main'],
          previewCommandLine: 'repo-ai-governor workspace switch-branch main',
        },
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('projects onboarding bundles into shared command-batch truth', async () => {
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
        userMessage: '把 adapter onboarding 全走一遍',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('command_handoff_preview');
      expect(completedEvent?.payload.requiresConfirmation).toBe(false);
      expect(completedEvent?.payload.skillId).toBe('skill.onboard.adapters');
      expect(completedEvent?.payload.handoffExecutionMode).toBe('direct_execute');
      expect(completedEvent?.payload.commandBatches).toEqual([
        {
          slashQuery: '/connect',
          bridgeArgv: ['connect', '--preset', 'multi-tool-default', '--output', 'pretty'],
          previewCommandLine:
            'repo-ai-governor connect --preset multi-tool-default --output pretty',
        },
        {
          slashQuery: '/doctor',
          bridgeArgv: ['doctor', '--adapters', '--output', 'pretty'],
          previewCommandLine: 'repo-ai-governor doctor --adapters --output pretty',
        },
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('routes natural-language planning asks through the injected planner collaboration runtime', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: async (context) => ({
          responseMode: 'role_collaboration',
          interactionMode: 'single_role_delegate',
          assistantDelta: '## Planner perspective',
          assistantMessage: `## Planner perspective\n\n- user_message: ${context.userMessage}`,
          executionIntent: 'session.role_delegate.planner',
          requiresConfirmation: false,
          selectedSurface: context.selectedSurface,
          selectedBy: 'session.main.router.single_role_delegate.implicit_role',
          sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
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
        userMessage: '帮我拆一下任务计划',
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(completedEvent?.payload.responseMode).toBe('role_collaboration');
      expect(completedEvent?.payload.requiresConfirmation).toBe(false);
      expect(completedEvent?.payload.executionIntent).toBe('session.role_delegate.planner');
      expect(completedEvent?.payload.invokedRoleIds).toEqual(['planner']);
      expect(completedEvent?.payload.assistantMessage).toContain(
        'user_message: 帮我拆一下任务计划',
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('preserves transcript-facing slash input when turn metadata supplies a display user message', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: async (context) => ({
          responseMode: 'role_collaboration',
          interactionMode: 'single_role_delegate',
          assistantDelta: '## Planner perspective',
          assistantMessage: `## Planner perspective\n\n- user_message: ${context.userMessage}`,
          executionIntent: 'session.role_delegate.planner',
          requiresConfirmation: false,
          selectedSurface: context.selectedSurface,
          selectedBy: 'session.main.router.single_role_delegate.implicit_role',
          sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
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
        userMessage: [
          'Use the standard planning template to create an execution plan for the following goal.',
          'Do not sync anything to the sprint ledger yet.',
          '',
          'Goal: ship a tetris clone',
        ].join('\n'),
        metadata: {
          [ORCHESTRATION_SESSION_DISPLAY_USER_MESSAGE_METADATA_KEY]: '/plan ship a tetris clone',
        },
      });
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const submittedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_SUBMITTED,
      );
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(submittedEvent?.payload.content).toBe('/plan ship a tetris clone');
      expect(completedEvent?.payload.latestUserMessage).toBe('/plan ship a tetris clone');
      expect(completedEvent?.payload.assistantMessage).toContain(
        'user_message: Use the standard planning template to create an execution plan for the following goal.',
      );
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
          invokedRoles: [],
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
        userMessage: 'What is this repository responsible for?',
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
      expect(completedEvent?.payload.invokedRoles).toEqual([]);
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
          invokedRoles: [
            {
              roleId: 'planner',
              roleProfileId: 'planner-default',
              agentId: 'agent-planner',
              selectedSurface: 'ollama',
              selectedBy: 'session.main.role_delegate.safe_fallback',
              dispatchBoundary: 'local_projection',
              transportKind: 'local_protocol',
            },
          ],
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
      expect(completedEvent?.payload.invokedRoles).toEqual([
        {
          roleId: 'planner',
          roleProfileId: 'planner-default',
          agentId: 'agent-planner',
          selectedSurface: 'ollama',
          selectedBy: 'session.main.role_delegate.safe_fallback',
          dispatchBoundary: 'local_projection',
          transportKind: 'local_protocol',
        },
      ]);
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
          invokedRoles: [
            {
              roleId: 'planner',
              roleProfileId: 'planner-default',
              agentId: 'agent-planner',
              selectedSurface: 'ollama',
              selectedBy: 'session.main.role_delegate.safe_fallback',
              dispatchBoundary: 'local_projection',
              transportKind: 'local_protocol',
            },
            {
              roleId: 'reviewer',
              roleProfileId: 'reviewer-default',
              agentId: 'agent-reviewer',
              selectedSurface: 'ollama',
              selectedBy: 'session.main.role_delegate.safe_fallback',
              dispatchBoundary: 'local_projection',
              transportKind: 'local_protocol',
            },
          ],
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
      expect(completedEvent?.payload.invokedRoles).toEqual([
        {
          roleId: 'planner',
          roleProfileId: 'planner-default',
          agentId: 'agent-planner',
          selectedSurface: 'ollama',
          selectedBy: 'session.main.role_delegate.safe_fallback',
          dispatchBoundary: 'local_projection',
          transportKind: 'local_protocol',
        },
        {
          roleId: 'reviewer',
          roleProfileId: 'reviewer-default',
          agentId: 'agent-reviewer',
          selectedSurface: 'ollama',
          selectedBy: 'session.main.role_delegate.safe_fallback',
          dispatchBoundary: 'local_projection',
          transportKind: 'local_protocol',
        },
      ]);
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
          assistantDelta: '## Architect + Reviewer + Verifier Parallel Analysis',
          assistantMessage: [
            '## Architect + Reviewer + Verifier Parallel Analysis',
            '',
            '### Architect',
            '',
            '## Architect perspective\n\n- architecture risk',
            '',
            '### Reviewer',
            '',
            '## Reviewer perspective\n\n- review risk',
            '',
            '### Verifier',
            '',
            '## Verifier perspective\n\n- verification risk',
          ].join('\n'),
          routerDecisionReason: 'session.main.router.parallel_role_fanout.explicit_roles',
          synthesisMode: 'parallel_analysis',
          executionIntent: 'session.role_delegate.parallel.architect.reviewer.verifier',
          requiresConfirmation: false,
          selectedSurface: 'architect:ollama | reviewer:ollama | verifier:ollama',
          selectedBy:
            'architect:session.main.role_delegate.safe_fallback | reviewer:session.main.role_delegate.safe_fallback | verifier:session.main.role_delegate.safe_fallback',
          sessionRoutingPreferenceApplied: false,
          invokedRoleIds: ['architect', 'reviewer', 'verifier'],
          invokedRoles: [
            {
              roleId: 'architect',
              roleProfileId: 'architect-default',
              agentId: 'agent-architect',
              selectedSurface: 'ollama',
              selectedBy: 'session.main.role_delegate.safe_fallback',
              dispatchBoundary: 'local_projection',
              transportKind: 'local_protocol',
            },
            {
              roleId: 'reviewer',
              roleProfileId: 'reviewer-default',
              agentId: 'agent-reviewer',
              selectedSurface: 'ollama',
              selectedBy: 'session.main.role_delegate.safe_fallback',
              dispatchBoundary: 'local_projection',
              transportKind: 'local_protocol',
            },
            {
              roleId: 'verifier',
              roleProfileId: 'verifier-default',
              agentId: 'agent-verifier',
              selectedSurface: 'ollama',
              selectedBy: 'session.main.role_delegate.safe_fallback',
              dispatchBoundary: 'local_projection',
              transportKind: 'local_protocol',
            },
          ],
          subagentCount: 3,
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
        userMessage: '@architect @reviewer @verifier parallel assess this rollout risk',
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
        'session.role_delegate.parallel.architect.reviewer.verifier',
      );
      expect(completedEvent?.payload.selectedSurface).toBe(
        'architect:ollama | reviewer:ollama | verifier:ollama',
      );
      expect(completedEvent?.payload.invokedRoleIds).toEqual(['architect', 'reviewer', 'verifier']);
      expect(completedEvent?.payload.invokedRoles).toEqual([
        {
          roleId: 'architect',
          roleProfileId: 'architect-default',
          agentId: 'agent-architect',
          selectedSurface: 'ollama',
          selectedBy: 'session.main.role_delegate.safe_fallback',
          dispatchBoundary: 'local_projection',
          transportKind: 'local_protocol',
        },
        {
          roleId: 'reviewer',
          roleProfileId: 'reviewer-default',
          agentId: 'agent-reviewer',
          selectedSurface: 'ollama',
          selectedBy: 'session.main.role_delegate.safe_fallback',
          dispatchBoundary: 'local_projection',
          transportKind: 'local_protocol',
        },
        {
          roleId: 'verifier',
          roleProfileId: 'verifier-default',
          agentId: 'agent-verifier',
          selectedSurface: 'ollama',
          selectedBy: 'session.main.role_delegate.safe_fallback',
          dispatchBoundary: 'local_projection',
          transportKind: 'local_protocol',
        },
      ]);
      expect(completedEvent?.payload.subagentCount).toBe(3);
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
      expect(completedEvent?.payload.requiresConfirmation).toBe(false);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('preserves direct-execute review handoff when one unknown @mention is not a configured role', async () => {
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
      expect(completedEvent?.payload.requiresConfirmation).toBe(false);
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

  it('preserves nested adapter stderr details on failed session turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveMentionedRoleId: () => 'reviewer',
        resolveTurn: async () => {
          throw new GovernorError(
            GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
            'Failed to invoke stage "stage-session-main-role-reviewer" on adapter surface "codex".',
            {
              surface: 'codex',
            },
            new GovernorError(
              GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
              'Codex invoke exited with code 2.',
              {
                stderr: "error: the argument '--uncommitted' cannot be used with '[PROMPT]'",
              },
            ),
          );
        },
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });

      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: '@reviewer 帮我 review 一下代码',
      });

      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const failedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_FAILED,
      );

      expect(failedEvent?.payload.errorCode).toBe('ADAPTER_PROTOCOL_INVOKE_FAILED');
      expect(failedEvent?.payload.errorMessage).toBe(
        'Failed to invoke stage "stage-session-main-role-reviewer" on adapter surface "codex".',
      );
      expect(failedEvent?.payload.errorDetail).toContain('Codex invoke exited with code 2.');
      expect(failedEvent?.payload.errorDetail).toContain(
        "error: the argument '--uncommitted' cannot be used with '[PROMPT]'",
      );
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
      const submittedEvents = subscription.events.filter(
        (event) => event.type === OrchestrationSessionEventType.TURN_SUBMITTED,
      );

      expect(failedEvent?.payload.turnIndex).toBe(1);
      expect(cancelledEvent?.payload.turnIndex).toBe(2);
      expect(completedEvents[0]?.payload.turnIndex).toBe(3);
      expect(submittedEvents.map((event) => event.payload.turnIndex)).toEqual([1, 2, 3]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('supports fork, archive, and unarchive across the shared session lifecycle surface', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: async () => ({
          responseMode: 'answer',
          interactionMode: 'direct_answer',
          assistantDelta: 'reply',
          assistantMessage: 'reply',
          executionIntent: 'session.answer',
          requiresConfirmation: false,
          selectedSurface: 'codex',
          selectedBy: 'session.main.answer.primary',
          sessionRoutingPreferenceApplied: false,
          invokedRoleIds: [],
          subagentCount: 0,
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
        userMessage: 'draft the rollout note',
      });

      const forked = await orchestrationService.forkSession({
        sourceSessionId: started.session.sessionId,
        displayName: 'branch-alpha',
      });
      const archived = await orchestrationService.archiveSession({
        sessionId: started.session.sessionId,
      });
      const archivedList = await orchestrationService.listSessions({
        filter: {
          status: OrchestrationSessionStatus.ARCHIVED,
        },
      });

      expect(forked.session.context.sourceKind).toBe('forked');
      expect(forked.session.context.sourceSessionId).toBe(started.session.sessionId);
      expect(forked.session.context.displayName).toBe('branch-alpha');
      expect(forked.session.context.latestNoteSummary).toBe(
        'goal=draft the rollout note | last_reply=reply | surface=codex',
      );
      expect(archived.session.status).toBe(OrchestrationSessionStatus.ARCHIVED);
      expect(archived.session.context.archivedAt).toBe(archived.archivedAt);
      expect(archivedList.sessions.map((session) => session.sessionId)).toContain(
        started.session.sessionId,
      );
      await expect(
        orchestrationService.resumeSession({
          sessionId: started.session.sessionId,
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.MEMORY_SESSION_ALREADY_CLOSED,
      });

      const restored = await orchestrationService.unarchiveSession({
        sessionId: started.session.sessionId,
      });
      const resumed = await orchestrationService.resumeSession({
        sessionId: started.session.sessionId,
      });

      expect(restored.session.status).toBe(OrchestrationSessionStatus.ACTIVE);
      expect(restored.session.context.archivedAt).toBeUndefined();
      expect(resumed.session.sessionId).toBe(started.session.sessionId);
      expect(resumed.session.status).toBe(OrchestrationSessionStatus.ACTIVE);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('persists provider continuation slots into session context and reloads them on resumed turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const laneKey = 'session.main::stage-session-main-answer::session.main::codex::chat_only';
    const createdSummary = {
      laneKey,
      laneLabel: 'session.main',
      status: 'created',
      surface: 'codex',
      providerId: 'openai',
      transportKind: 'remote_api',
      model: 'gpt-5',
      stageId: 'stage-session-main-answer',
      roleId: null,
      policyEnvelope: 'chat_only',
    };
    const firstResolveTurn = vi.fn(async () => ({
      responseMode: 'answer',
      interactionMode: 'direct_answer',
      assistantDelta: 'continued answer',
      assistantMessage: 'continued answer',
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: 'codex',
      selectedBy: 'session.main.answer.primary',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: [],
      subagentCount: 0,
      providerContinuationSummaries: [createdSummary],
      providerContinuationMutations: [
        {
          laneKey,
          summary: createdSummary,
          slot: {
            laneKey,
            routeId: 'session.main',
            stageId: 'stage-session-main-answer',
            roleId: null,
            selectedSurface: 'codex',
            providerId: 'openai',
            transportKind: 'remote_api',
            model: 'gpt-5',
            policyEnvelope: 'chat_only',
            workspaceRoot: temporaryRoot,
            currentWorkingDirectory: temporaryRoot,
            handle: {
              providerId: 'openai',
              surface: 'codex',
              transportKind: 'remote_api',
              handleKind: 'response_id',
              value: 'resp-1',
              model: 'gpt-5',
              acquiredAt: '2026-04-04T12:00:00.000Z',
            },
            updatedAt: '2026-04-04T12:00:00.000Z',
          },
        },
      ],
    }));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: firstResolveTurn,
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'continue the previous answer',
      });
      const session = await orchestrationService.getSession(started.session.sessionId);
      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(firstResolveTurn).toHaveBeenCalledTimes(1);
      expect(session?.context.providerContinuations).toEqual(
        expect.objectContaining({
          version: 1,
          slots: {
            [laneKey]: expect.objectContaining({
              handle: expect.objectContaining({
                value: 'resp-1',
              }),
            }),
          },
        }),
      );
      expect(completedEvent?.payload.providerContinuationSummaries).toEqual([
        expect.objectContaining({
          laneKey,
          status: 'created',
          surface: 'codex',
        }),
      ]);

      const resumedResolveTurn = vi.fn(async (context) => {
        expect(context.providerContinuationState?.slots[laneKey]?.handle.value).toBe('resp-1');
        return {
          responseMode: 'answer',
          interactionMode: 'direct_answer',
          assistantDelta: 'follow-up answer',
          assistantMessage: 'follow-up answer',
          executionIntent: 'session.answer',
          requiresConfirmation: false,
          selectedSurface: 'codex',
          selectedBy: 'session.main.answer.primary',
          sessionRoutingPreferenceApplied: false,
          invokedRoleIds: [],
          subagentCount: 0,
        };
      });
      const resumedService = new LocalOrchestrationServiceShell({
        workspaceRoot: temporaryRoot,
        sessionMainSupervisorRuntime: {
          resolveTurn: resumedResolveTurn,
        },
      });
      const resumed = await resumedService.resumeSession({
        sessionId: started.session.sessionId,
      });

      expect(resumed.session.context.providerContinuations).toEqual(
        expect.objectContaining({
          version: 1,
          slots: {
            [laneKey]: expect.objectContaining({
              handle: expect.objectContaining({
                value: 'resp-1',
              }),
            }),
          },
        }),
      );

      await resumedService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'continue once more',
      });

      expect(resumedResolveTurn).toHaveBeenCalledTimes(1);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('persists delivery workflow state into session context and reloads it on resumed turns', async () => {
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
        userMessage: 'Help me deliver this requirement through the governed path.',
        metadata: {
          locale: 'en-US',
        },
      });
      const session = await orchestrationService.getSession(started.session.sessionId);

      expect(session?.context[SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]).toEqual(
        expect.objectContaining({
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_CAPTURE,
          pendingAction: 'capture_requirement_or_attach_approved_brief',
        }),
      );

      const resumedResolveTurn = vi.fn(async (context) => {
        expect(context.deliveryWorkflowState).toEqual(
          expect.objectContaining({
            capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
            currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_CAPTURE,
            pendingAction: 'capture_requirement_or_attach_approved_brief',
          }),
        );
        return {
          responseMode: 'answer' as const,
          interactionMode: 'direct_answer' as const,
          assistantDelta: 'Resumed the governed deliver workflow.',
          assistantMessage: 'Resumed the governed deliver workflow.',
          executionIntent: 'deliver.requirement_to_cr',
          requiresConfirmation: false,
          selectedSurface: 'codex',
          selectedBy: 'session.main.router.delivery_workflow.start',
          sessionRoutingPreferenceApplied: false,
          referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
          skillId: 'skill.deliver.workflow',
          skillVersion: '2026-04-08',
          handoffExecutionMode: 'direct_execute' as const,
          deliveryWorkflowState: {
            version: SESSION_DELIVERY_WORKFLOW_VERSION,
            workflowId:
              context.deliveryWorkflowState?.workflowId ?? 'delivery-workflow-shell-resumed-001',
            capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
            currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.SOLUTION_REVIEW_PENDING,
            requirementReviewGate: {
              outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.EXPLICIT_APPROVAL,
              evidenceArtifactPath: '.repo-ai-governor/context/evidence/approval.md',
            },
            approvedDeliveryBriefPath: '.repo-ai-governor/context/durable/approved-brief.md',
            pendingAction: 'review_solution_artifact',
            selectedTargetStream: 'stream-project-110-sprint-001',
            relatedArtifactPaths: ['.repo-ai-governor/context/durable/approved-brief.md'],
            childWorkflowBacklinks: [
              {
                capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
                artifactPath: '.repo-ai-governor/context/review/approved-requirement.md',
                summary: 'Requirement review receipt.',
              },
            ],
            blockedReason: null,
            resultSummary: 'Approved durable brief exported.',
          },
          invokedRoleIds: [],
          subagentCount: 0,
        };
      });
      const resumedService = new LocalOrchestrationServiceShell({
        workspaceRoot: temporaryRoot,
        sessionMainSupervisorRuntime: {
          resolveTurn: resumedResolveTurn,
        },
      });
      const resumed = await resumedService.resumeSession({
        sessionId: started.session.sessionId,
      });

      expect(resumed.session.context[SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]).toEqual(
        expect.objectContaining({
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_CAPTURE,
        }),
      );

      await resumedService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'Summarize the current session state for me.',
      });
      const resumedSession = await resumedService.getSession(started.session.sessionId);
      const resumedSubscription = await resumedService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const resumedCompletedEvent = resumedSubscription.events
        .filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .at(-1);

      expect(resumedResolveTurn).toHaveBeenCalledTimes(1);
      expect(resumedSession?.context[SESSION_DELIVERY_WORKFLOW_CONTEXT_KEY]).toEqual(
        expect.objectContaining({
          capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
          currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.SOLUTION_REVIEW_PENDING,
          pendingAction: 'review_solution_artifact',
          approvedDeliveryBriefPath: '.repo-ai-governor/context/durable/approved-brief.md',
        }),
      );
      expect(resumedCompletedEvent?.payload).toMatchObject({
        executionIntent: 'deliver.requirement_to_cr',
        turn_delivery_phase: SESSION_DELIVERY_WORKFLOW_PHASE.SOLUTION_REVIEW_PENDING,
        turn_delivery_pending_action: 'review_solution_artifact',
        turn_delivery_selected_stream: 'stream-project-110-sprint-001',
        turn_delivery_result_summary: 'Approved durable brief exported.',
      });
      expect(resumedCompletedEvent?.payload.turn_delivery_related_artifact_paths).toEqual([
        '.repo-ai-governor/context/durable/approved-brief.md',
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('persists supervisor execution details lines on completed turns', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const resolveTurn = vi.fn(async () => ({
      responseMode: 'answer',
      interactionMode: 'direct_answer',
      assistantDelta: '## Session Main Answer',
      assistantMessage: '## Session Main Answer\n\nNo eligible direct-answer surface.',
      executionDetailsLines: [
        'Surface probe diagnostics for this turn:',
        'codex · not eligible · Codex probe exited with code 1.',
      ],
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: 'guarded-direct-answer',
      selectedBy: 'session.main.answer.guard',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: [],
      subagentCount: 0,
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
        userMessage: '你好',
      });

      const subscription = await orchestrationService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const completedEvent = subscription.events.find(
        (event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED,
      );

      expect(resolveTurn).toHaveBeenCalledTimes(1);
      expect(completedEvent?.payload.executionDetailsLines).toEqual(
        expect.arrayContaining([
          'Surface probe diagnostics for this turn:',
          'codex · not eligible · Codex probe exited with code 1.',
          expect.stringMatching(/^performance\.turn_elapsed_pre_terminal_ms=/u),
          expect.stringMatching(/^performance\.dispatch_ms=/u),
          expect.stringMatching(/^performance\.session_persist_pre_terminal_ms=/u),
          'performance.stream_delta_count=1',
        ]),
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('keeps unsupported continuation summaries replayable while clearing persisted slots', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-shell-session-'));
    const laneKey = 'session.main::stage-session-main-answer::session.main::codex::chat_only';
    const createdSummary = {
      laneKey,
      laneLabel: 'session.main',
      status: 'created',
      surface: 'codex',
      providerId: 'openai',
      transportKind: 'remote_api',
      model: 'gpt-5',
      stageId: 'stage-session-main-answer',
      roleId: null,
      policyEnvelope: 'chat_only',
    };
    const firstResolveTurn = vi.fn(async () => ({
      responseMode: 'answer',
      interactionMode: 'direct_answer',
      assistantDelta: 'continued answer',
      assistantMessage: 'continued answer',
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: 'codex',
      selectedBy: 'session.main.answer.primary',
      sessionRoutingPreferenceApplied: false,
      invokedRoleIds: [],
      subagentCount: 0,
      providerContinuationSummaries: [createdSummary],
      providerContinuationMutations: [
        {
          laneKey,
          summary: createdSummary,
          slot: {
            laneKey,
            routeId: 'session.main',
            stageId: 'stage-session-main-answer',
            roleId: null,
            selectedSurface: 'codex',
            providerId: 'openai',
            transportKind: 'remote_api',
            model: 'gpt-5',
            policyEnvelope: 'chat_only',
            workspaceRoot: temporaryRoot,
            currentWorkingDirectory: temporaryRoot,
            handle: {
              providerId: 'openai',
              surface: 'codex',
              transportKind: 'remote_api',
              handleKind: 'response_id',
              value: 'resp-1',
              model: 'gpt-5',
              acquiredAt: '2026-04-04T12:00:00.000Z',
            },
            updatedAt: '2026-04-04T12:00:00.000Z',
          },
        },
      ],
    }));
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot: temporaryRoot,
      sessionMainSupervisorRuntime: {
        resolveTurn: firstResolveTurn,
      },
    });

    try {
      const started = await orchestrationService.startSession({
        routeId: OrchestrationSessionRouteId.MAIN,
      });
      await orchestrationService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'continue the previous answer',
      });

      const resumedResolveTurn = vi.fn(async (context) => {
        expect(context.providerContinuationState?.slots[laneKey]?.handle.value).toBe('resp-1');
        return {
          responseMode: 'answer',
          interactionMode: 'direct_answer',
          assistantDelta: 'stateless follow-up answer',
          assistantMessage: 'stateless follow-up answer',
          executionIntent: 'session.answer',
          requiresConfirmation: false,
          selectedSurface: 'codex',
          selectedBy: 'session.main.answer.primary',
          sessionRoutingPreferenceApplied: false,
          invokedRoleIds: [],
          subagentCount: 0,
          providerContinuationSummaries: [
            {
              laneKey,
              laneLabel: 'session.main',
              status: 'unsupported',
              surface: 'codex',
              providerId: 'openai',
              transportKind: 'remote_api',
              model: 'gpt-5',
              stageId: 'stage-session-main-answer',
              roleId: null,
              policyEnvelope: 'chat_only',
              invalidationReason: 'provider_session_not_supported',
            },
          ],
          providerContinuationMutations: [
            {
              laneKey,
              summary: {
                laneKey,
                laneLabel: 'session.main',
                status: 'unsupported',
                surface: 'codex',
                providerId: 'openai',
                transportKind: 'remote_api',
                model: 'gpt-5',
                stageId: 'stage-session-main-answer',
                roleId: null,
                policyEnvelope: 'chat_only',
                invalidationReason: 'provider_session_not_supported',
              },
            },
          ],
        };
      });
      const resumedService = new LocalOrchestrationServiceShell({
        workspaceRoot: temporaryRoot,
        sessionMainSupervisorRuntime: {
          resolveTurn: resumedResolveTurn,
        },
      });

      await resumedService.resumeSession({
        sessionId: started.session.sessionId,
      });
      await resumedService.sendSessionTurn({
        sessionId: started.session.sessionId,
        routeId: OrchestrationSessionRouteId.MAIN,
        userMessage: 'continue once more',
      });

      const session = await resumedService.getSession(started.session.sessionId);
      const subscription = await resumedService.subscribeSession({
        sessionId: started.session.sessionId,
      });
      const unsupportedCompletedEvent = subscription.events
        .filter((event) => event.type === OrchestrationSessionEventType.TURN_COMPLETED)
        .at(-1);

      expect(resumedResolveTurn).toHaveBeenCalledTimes(1);
      expect(session?.context.providerContinuations).toEqual({
        version: 1,
        slots: {},
      });
      expect(unsupportedCompletedEvent?.payload.providerContinuationSummaries).toEqual([
        expect.objectContaining({
          laneKey,
          status: 'unsupported',
          invalidationReason: 'provider_session_not_supported',
        }),
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
