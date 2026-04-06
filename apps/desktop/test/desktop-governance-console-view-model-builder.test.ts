import {
  OrchestrationGovernanceActionKind,
  OrchestrationHandoffTargetKind,
} from '@repo-ai-governor/orchestration-service-client';
import { AgentProjectionPanelStatusVariant } from '@repo-ai-governor/reporting';
import { DesktopArtifactQueryGateState } from '../src/constants/index.js';
import { DesktopGovernanceConsoleViewModelBuilder } from '../src/runtime/desktop-governance-console-view-model-builder.js';

describe('DesktopGovernanceConsoleViewModelBuilder', () => {
  it('builds workspace, session, timeline, hitl, artifact pane, and shared agent projection sections', () => {
    const builder = new DesktopGovernanceConsoleViewModelBuilder();
    const viewModel = builder.build({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
      health: {
        serviceHostKind: 'sidecar',
        serviceTransportKind: 'ipc',
        lifecycleStatus: 'ready',
        checkpointCapable: true,
        workspaceRoot: '/tmp/workspace/.repo-ai-governor',
        startedAt: '2026-04-04T00:00:00.000Z',
        protocolVersion: '1.0',
        memoryProvider: {
          memoryStoreEngine: 'fs_csv',
          memoryStoreProvider: 'FsCsvMemoryStoreProvider',
          memoryStoreProviderId: 'fs-csv',
          memoryStoreDistributionMode: 'default',
          memoryStoreResolutionSource: 'legacy_store_engine',
          memoryStoreHostSurface: 'local_orchestration_service',
          memoryStoreRuntimeMode: 'daemon',
        },
      },
      sessions: [
        {
          sessionId: 'session-1',
          status: 'open',
          openedAt: '2026-04-04T00:00:00.000Z',
          latestEventSequence: 4,
          nextCursor: '4',
          eventCount: 4,
          currentRouteId: 'main',
          context: {},
        },
      ],
      executionBoard: {
        executions: [
          {
            execution: {
              executionId: 'execution-1',
              executionSessionId: 'execution-session-1',
              processId: 'desktop-process',
              workspaceId: 'desktop-workspace',
              workspaceRoot: '/tmp/workspace/.repo-ai-governor',
              executionKind: 'run',
              clientSurface: 'desktop',
              eventStreamToken: 'token-1',
              serviceHostKind: 'sidecar',
              serviceTransportKind: 'ipc',
              status: 'running',
              checkpointCapable: true,
              recoveryCapable: true,
              acceptedAt: '2026-04-04T00:00:00.000Z',
              updatedAt: '2026-04-04T00:01:00.000Z',
              pendingHitl: true,
              latestEventSequence: 3,
              nextCursor: '3',
              latestEventType: 'execution_running',
              currentStageId: 'review',
            },
            actions: [
              {
                actionId: 'execution-1:view',
                actionKind: OrchestrationGovernanceActionKind.VIEW_EXECUTION,
                executionId: 'execution-1',
                enabled: true,
                requiresConfirmation: false,
              },
              {
                actionId: 'execution-1:submit-hitl',
                actionKind: OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION,
                executionId: 'execution-1',
                enabled: true,
                requiresConfirmation: true,
                hitlDecisionOptions: [
                  {
                    optionId: 'execution-1:approve',
                    decision: 'approve',
                    resumeAction: 'resume',
                  },
                ],
              },
            ],
            handoffTargets: [
              {
                targetId: 'execution-1:worktree',
                executionId: 'execution-1',
                targetKind: OrchestrationHandoffTargetKind.WORKTREE,
                targetPath: '/tmp/workspace',
                exists: true,
              },
            ],
          },
        ],
        returnedCount: 1,
        totalMatchedCount: 1,
      },
      hitlInbox: {
        pendingDecisions: [
          {
            execution: {
              executionId: 'execution-1',
              executionSessionId: 'execution-session-1',
              processId: 'desktop-process',
              workspaceId: 'desktop-workspace',
              workspaceRoot: '/tmp/workspace/.repo-ai-governor',
              executionKind: 'run',
              clientSurface: 'desktop',
              eventStreamToken: 'token-1',
              serviceHostKind: 'sidecar',
              serviceTransportKind: 'ipc',
              status: 'running',
              checkpointCapable: true,
              recoveryCapable: true,
              acceptedAt: '2026-04-04T00:00:00.000Z',
              updatedAt: '2026-04-04T00:01:00.000Z',
              pendingHitl: true,
              latestEventSequence: 3,
              nextCursor: '3',
              latestEventType: 'execution_running',
              currentStageId: 'review',
            },
            actions: [
              {
                actionId: 'execution-1:submit-hitl',
                actionKind: OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION,
                executionId: 'execution-1',
                enabled: true,
                requiresConfirmation: true,
                hitlDecisionOptions: [
                  {
                    optionId: 'execution-1:approve',
                    decision: 'approve',
                    resumeAction: 'resume',
                  },
                ],
              },
            ],
            handoffTargets: [
              {
                targetId: 'execution-1:review',
                executionId: 'execution-1',
                targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
                targetPath: '/tmp/workspace/review/code_review_tk-551.md',
                exists: true,
              },
            ],
          },
        ],
        returnedCount: 1,
        totalMatchedCount: 1,
      },
      queueOverview: {
        generatedAt: '2026-04-04T00:04:00.000Z',
        automationInbox: [
          {
            queueEntryId: 'automation:execution-1',
            queueKind: 'automation_inbox',
            workspaceId: 'desktop-workspace',
            workspaceRoot: '/tmp/workspace/.repo-ai-governor',
            executionId: 'execution-1',
            executionKind: 'run',
            executionStatus: 'running',
            taskId: 'TK-551',
            projectId: 'project-048',
            sprintId: 'sprint-004',
            attentionLevel: 'warning',
            notificationStatus: 'follow_up_required',
            followUpSlaState: 'due_soon',
            followUpDueAt: '2026-04-04T01:00:00.000Z',
            pendingSince: '2026-04-04T00:15:00.000Z',
            updatedAt: '2026-04-04T00:45:00.000Z',
            actions: [
              {
                actionId: 'execution-1:view',
                actionKind: OrchestrationGovernanceActionKind.VIEW_EXECUTION,
                executionId: 'execution-1',
                enabled: true,
                requiresConfirmation: false,
              },
            ],
            handoffTargets: [
              {
                targetId: 'execution-1:worktree',
                executionId: 'execution-1',
                targetKind: OrchestrationHandoffTargetKind.WORKTREE,
                targetPath: '/tmp/workspace',
                exists: true,
              },
            ],
          },
        ],
        reviewQueue: [
          {
            queueEntryId: 'review:code_review_tk-551.md',
            queueKind: 'review_queue',
            workspaceId: 'desktop-workspace',
            workspaceRoot: '/tmp/workspace/.repo-ai-governor',
            executionId: 'execution-1',
            executionKind: 'run',
            executionStatus: 'running',
            taskId: 'TK-551',
            projectId: 'project-048',
            sprintId: 'sprint-004',
            reviewId: 'code_review_tk-551.md',
            reviewLifecycleStatus: 'review_pending',
            reviewFilePath: '/tmp/workspace/review/code_review_tk-551.md',
            attentionLevel: 'warning',
            notificationStatus: 'follow_up_required',
            followUpSlaState: 'healthy',
            pendingSince: '2026-04-04T00:20:00.000Z',
            updatedAt: '2026-04-04T00:20:00.000Z',
            actions: [],
            handoffTargets: [],
          },
        ],
        parallelLanes: [
          {
            laneId: 'desktop-workspace:/tmp/workspace/.repo-ai-governor',
            workspaceId: 'desktop-workspace',
            workspaceRoot: '/tmp/workspace/.repo-ai-governor',
            activeExecutionIds: ['execution-1'],
            activeExecutionCount: 1,
            runningExecutionCount: 1,
            pendingHitlCount: 1,
            interruptedCount: 0,
            attentionExecutionCount: 1,
            attentionLevel: 'warning',
            latestExecutionId: 'execution-1',
            latestUpdatedAt: '2026-04-04T00:01:00.000Z',
          },
        ],
        workspaceSummary: [
          {
            workspaceId: 'desktop-workspace',
            workspaceRoot: '/tmp/workspace/.repo-ai-governor',
            totalExecutionCount: 1,
            activeExecutionCount: 1,
            pendingHitlCount: 1,
            automationInboxCount: 1,
            reviewQueueCount: 1,
            overdueFollowUpCount: 0,
            attentionLevel: 'warning',
            latestExecutionId: 'execution-1',
            latestUpdatedAt: '2026-04-04T00:01:00.000Z',
          },
        ],
        notificationOwnership: {
          ownerSurface: 'desktop',
          pendingItemCount: 2,
          dueSoonItemCount: 1,
          overdueItemCount: 0,
          activeWorkspaceCount: 1,
          defaultFollowUpSlaMinutes: 60,
          notificationStatus: 'follow_up_required',
        },
      },
      lifecycle: {
        serviceLifecycleStatus: 'ready',
        restartCount: 1,
        lastRestartReason: 'desktop-restart',
        windowWakeCount: 1,
        notificationCount: 1,
        artifactQueryGateState: DesktopArtifactQueryGateState.READY,
      },
      artifactPane: {
        artifacts: [
          {
            artifactId: 'artifact-1',
            artifactType: 'review_report',
            artifactPath: '/tmp/workspace/review/report.md',
            artifactVersion: 'v1',
            artifactStatus: 'active',
            producerTaskId: 'TK-551',
            producerExecutionId: 'execution-1',
            registeredAt: '2026-04-04T00:00:00.000Z',
            lastUpdatedAt: '2026-04-04T00:01:00.000Z',
          },
        ],
        reviews: [
          {
            reviewId: 'code_review_tk-551.md',
            title: 'Desktop artifact pane readiness',
            lifecycleStatus: 'review_pending',
            filePath: '/tmp/workspace/review/code_review_tk-551.md',
            updatedAt: '2026-04-04T00:02:00.000Z',
          },
        ],
        transcript: [
          {
            entryId: 'session-event-1',
            sessionId: 'session-1',
            eventType: 'turn_submitted',
            role: 'user',
            routeId: 'main',
            lines: ['Please open the latest review report.'],
            createdAt: '2026-04-04T00:03:00.000Z',
          },
        ],
        resolvedExecutionId: 'execution-1',
        resolvedSessionId: 'session-1',
        reviewSourcePath: '/tmp/workspace/review',
        policyTrace: {
          executionId: 'execution-1',
          executionStatus: 'running',
          pendingHitl: true,
          recoveryCapable: true,
          currentStageId: 'review',
          latestEventType: 'execution_running',
          latestArtifactId: 'artifact-1',
          latestArtifactPath: '/tmp/workspace/review/report.md',
          taskId: 'TK-551',
          projectId: 'project-048',
          sprintId: 'sprint-003',
          reviewDocumentPath: '/tmp/workspace/review/code_review_tk-551.md',
        },
        reviewLifecycle: {
          reviewSourcePath: '/tmp/workspace/review',
          latestReviewId: 'code_review_tk-551.md',
          latestLifecycleStatus: 'review_pending',
          latestReviewFilePath: '/tmp/workspace/review/code_review_tk-551.md',
          totalReviewCount: 1,
          pendingReviewCount: 1,
          verifiedReviewCount: 0,
          resolvedReviewCount: 0,
          navigationReviewIds: ['code_review_tk-551.md'],
        },
        workbench: {
          artifactCount: 1,
          reviewCount: 1,
          transcriptCount: 1,
          latestArtifactId: 'artifact-1',
          latestArtifactPath: '/tmp/workspace/review/report.md',
          latestReviewId: 'code_review_tk-551.md',
          latestReviewFilePath: '/tmp/workspace/review/code_review_tk-551.md',
          latestTranscriptEntryId: 'session-event-1',
          latestTranscriptCreatedAt: '2026-04-04T00:03:00.000Z',
        },
        evidenceBacklinks: {
          governanceWorkspacePath: '/tmp/workspace/.repo-ai-governor',
          artifactPaths: ['/tmp/workspace/review/report.md'],
          reviewPaths: ['/tmp/workspace/review/code_review_tk-551.md'],
          transcriptEntryIds: ['session-event-1'],
        },
      },
      agentView: createAgentView(),
    } as never);

    expect(viewModel.workspaceHome.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.workspaceHome.detailLines).toContain('workspace=desktop-workspace');
    expect(viewModel.sessionLane.detailLines).toContain('session=session-1');
    expect(viewModel.executionBoard.entries[0]?.title).toBe('execution-1 -> running');
    expect(viewModel.executionBoard.entries[0]?.actions[1]?.title).toBe('Submit HITL decision');
    expect(viewModel.hitlInbox.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.hitlInbox.entries[0]?.handoffTargets[0]?.title).toBe('Review document');
    expect(viewModel.queueOverview.title).toBe('Queue & workspace overview');
    expect(viewModel.queueOverview.notificationOwnership.title).toBe('Notification ownership');
    expect(viewModel.queueOverview.automationInbox.entries[0]?.title).toBe(
      'execution-1 -> running',
    );
    expect(viewModel.queueOverview.reviewQueue.entries[0]?.title).toBe(
      'code_review_tk-551.md -> review_pending',
    );
    expect(viewModel.queueOverview.parallelLanes.entries[0]?.title).toBe(
      'desktop-workspace -> 1 active',
    );
    expect(viewModel.queueOverview.workspaceSummary.entries[0]?.detailLines).toContain(
      'automation_inbox=1 review_queue=1 overdue_follow_up=0',
    );
    expect(viewModel.agentProjectionPanel?.rows[0]?.title).toBe('coder -> github-copilot');
    expect(viewModel.artifactPane.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
    expect(viewModel.artifactPane.policyTrace.title).toBe('Policy & standards lens');
    expect(viewModel.artifactPane.policyTrace.detailLines).toContain(
      'stage=review latest=execution_running',
    );
    expect(viewModel.artifactPane.reviewLifecycle.detailLines).toContain(
      'pending=1 verified=0 resolved=0',
    );
    expect(viewModel.artifactPane.workbench.detailLines).toContain(
      'artifacts=1 reviews=1 transcript_entries=1',
    );
    expect(viewModel.artifactPane.evidenceBacklinks.entries[0]?.detailLines).toContain(
      'path=/tmp/workspace/.repo-ai-governor',
    );
    expect(viewModel.artifactPane.artifacts.entries[0]?.title).toBe('review_report -> active');
    expect(viewModel.artifactPane.reviews.entries[0]?.title).toBe(
      'review_pending -> Desktop artifact pane readiness',
    );
    expect(viewModel.artifactPane.transcript.entries[0]?.detailLines).toContain(
      'Please open the latest review report.',
    );
  });

  it('keeps the artifact pane deferred when the gate is explicitly blocked', () => {
    const builder = new DesktopGovernanceConsoleViewModelBuilder();
    const viewModel = builder.build({
      locale: 'zh-CN',
      workspaceLabel: 'desktop-workspace',
      health: {
        serviceHostKind: 'sidecar',
        serviceTransportKind: 'ipc',
        lifecycleStatus: 'ready',
        checkpointCapable: true,
        workspaceRoot: '/tmp/workspace/.repo-ai-governor',
        startedAt: '2026-04-04T00:00:00.000Z',
        protocolVersion: '1.0',
      },
      sessions: [],
      executionBoard: {
        executions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      },
      hitlInbox: {
        pendingDecisions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      },
      lifecycle: {
        serviceLifecycleStatus: 'ready',
        restartCount: 0,
        windowWakeCount: 0,
        notificationCount: 0,
        artifactQueryGateState: DesktopArtifactQueryGateState.BLOCKED,
      },
    } as never);

    expect(viewModel.artifactPane.gateState).toBe(DesktopArtifactQueryGateState.BLOCKED);
    expect(viewModel.artifactPane.detailLines[0]).toContain(
      'service-owned artifact query contract',
    );
    expect(viewModel.artifactPane.policyTrace.statusVariant).toBe(
      AgentProjectionPanelStatusVariant.INFO,
    );
    expect(viewModel.artifactPane.evidenceBacklinks.entries).toHaveLength(0);
    expect(viewModel.artifactPane.artifacts.entries).toHaveLength(0);
  });

  it('prefers error status when the execution board mixes failed and warning executions', () => {
    const builder = new DesktopGovernanceConsoleViewModelBuilder();
    const viewModel = builder.build({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
      health: {
        serviceHostKind: 'sidecar',
        serviceTransportKind: 'ipc',
        lifecycleStatus: 'ready',
        checkpointCapable: true,
        workspaceRoot: '/tmp/workspace/.repo-ai-governor',
        startedAt: '2026-04-04T00:00:00.000Z',
        protocolVersion: '1.0',
      },
      sessions: [],
      executionBoard: {
        executions: [
          createExecutionBoardEntry('execution-failed', 'failed', false),
          createExecutionBoardEntry('execution-running', 'running', true),
        ],
        returnedCount: 2,
        totalMatchedCount: 2,
      },
      hitlInbox: {
        pendingDecisions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      },
      lifecycle: {
        serviceLifecycleStatus: 'ready',
        restartCount: 0,
        windowWakeCount: 0,
        notificationCount: 0,
        artifactQueryGateState: DesktopArtifactQueryGateState.BLOCKED,
      },
    } as never);

    expect(viewModel.executionBoard.statusVariant).toBe(AgentProjectionPanelStatusVariant.ERROR);
  });

  it('keeps the artifact pane in warning status when review lifecycle still reports pending work outside the truncated review slice', () => {
    const builder = new DesktopGovernanceConsoleViewModelBuilder();
    const viewModel = builder.build({
      locale: 'en-US',
      workspaceLabel: 'desktop-workspace',
      health: {
        serviceHostKind: 'sidecar',
        serviceTransportKind: 'ipc',
        lifecycleStatus: 'ready',
        checkpointCapable: true,
        workspaceRoot: '/tmp/workspace/.repo-ai-governor',
        startedAt: '2026-04-04T00:00:00.000Z',
        protocolVersion: '1.0',
      },
      sessions: [],
      executionBoard: {
        executions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      },
      hitlInbox: {
        pendingDecisions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      },
      lifecycle: {
        serviceLifecycleStatus: 'ready',
        restartCount: 0,
        windowWakeCount: 0,
        notificationCount: 0,
        artifactQueryGateState: DesktopArtifactQueryGateState.READY,
      },
      artifactPane: {
        artifacts: [],
        reviews: [
          {
            reviewId: 'resolved_code_review_tk-565.md',
            title: 'Resolved review',
            lifecycleStatus: 'resolved',
            filePath: '/tmp/workspace/review/resolved_code_review_tk-565.md',
            updatedAt: '2026-04-04T00:02:00.000Z',
          },
        ],
        transcript: [],
        reviewLifecycle: {
          reviewSourcePath: '/tmp/workspace/review',
          latestReviewId: 'resolved_code_review_tk-565.md',
          latestLifecycleStatus: 'resolved',
          latestReviewFilePath: '/tmp/workspace/review/resolved_code_review_tk-565.md',
          totalReviewCount: 2,
          pendingReviewCount: 1,
          verifiedReviewCount: 0,
          resolvedReviewCount: 1,
          navigationReviewIds: ['code_review_tk-565.md', 'resolved_code_review_tk-565.md'],
        },
        workbench: {
          artifactCount: 0,
          reviewCount: 1,
          transcriptCount: 0,
          latestReviewId: 'resolved_code_review_tk-565.md',
          latestReviewFilePath: '/tmp/workspace/review/resolved_code_review_tk-565.md',
        },
        evidenceBacklinks: {
          governanceWorkspacePath: '/tmp/workspace/.repo-ai-governor',
          artifactPaths: [],
          reviewPaths: ['/tmp/workspace/review/resolved_code_review_tk-565.md'],
          transcriptEntryIds: [],
        },
      },
    } as never);

    expect(viewModel.artifactPane.statusVariant).toBe(AgentProjectionPanelStatusVariant.WARNING);
  });
});

function createAgentView() {
  return {
    descriptors: [
      {
        agentId: 'coder:coder:coder',
        agentRole: 'coder',
        roleProfileId: 'coder-default',
        roleSource: 'default',
        primarySurface: 'codex',
        fallbackSurfaces: ['github-copilot'],
        capabilities: ['tool_calling'],
        permissionLevel: 'edit',
        inputSchemaRef: null,
        outputSchemaRef: null,
        errorContractRef: null,
        maxExecutionTimeSeconds: 300,
        stageTimeoutSeconds: 300,
        tokenBudget: null,
        costBudget: null,
        timeBudgetSeconds: null,
        retryPolicyRef: null,
        timeoutPolicyRef: null,
        budgetPolicyRef: null,
        workspaceId: 'desktop-workspace',
        workspaceMode: 'repo_local',
        executionId: 'execution-1',
        sessionId: null,
        selectedBy: 'fallback',
        selectedSurface: 'github-copilot',
        projectionStatus: 'warn',
        failureReasons: ['primary_surface_unavailable'],
        unsupportedCapabilities: [],
        degradedCapabilities: ['tool_calling'],
      },
    ],
    sessionProjection: null,
  } as never;
}

function createExecutionBoardEntry(executionId: string, status: string, pendingHitl: boolean) {
  return {
    execution: {
      executionId,
      executionSessionId: `${executionId}-session`,
      processId: `${executionId}-process`,
      workspaceId: 'desktop-workspace',
      workspaceRoot: '/tmp/workspace/.repo-ai-governor',
      executionKind: 'run',
      clientSurface: 'desktop',
      eventStreamToken: `${executionId}-token`,
      serviceHostKind: 'sidecar',
      serviceTransportKind: 'ipc',
      status,
      checkpointCapable: true,
      recoveryCapable: status !== 'failed',
      acceptedAt: '2026-04-04T00:00:00.000Z',
      updatedAt: '2026-04-04T00:01:00.000Z',
      pendingHitl,
      latestEventSequence: 3,
      nextCursor: '3',
      latestEventType: 'execution_running',
      currentStageId: 'review',
    },
    actions: [],
    handoffTargets: [],
  };
}
