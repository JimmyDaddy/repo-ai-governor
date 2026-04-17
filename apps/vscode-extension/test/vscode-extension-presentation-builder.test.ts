import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationGovernanceActionKind,
  OrchestrationGovernanceAttentionLevel,
  OrchestrationGovernanceFollowUpSlaState,
  OrchestrationGovernanceNotificationStatus,
  OrchestrationGovernanceQueueKind,
  OrchestrationGovernanceTemporaryBridgeBacklinkSurface,
  OrchestrationGovernanceTemporaryBridgeCapabilityClass,
  OrchestrationGovernanceTemporaryBridgeExitCriterion,
  OrchestrationGovernanceTemporaryBridgeReceiptKind,
  OrchestrationHandoffTargetKind,
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import type {
  OrchestrationExecutionBoardEntry,
  OrchestrationExecutionSummary,
  OrchestrationHitlInboxEntry,
} from '@repo-ai-governor/orchestration-service-client';
import { VSCODE_EXTENSION_COMMAND_IDS } from '../src/constants/index.js';
import { VsCodeExtensionPresentationBuilder } from '../src/runtime/vscode-extension-presentation-builder.js';

describe('VsCodeExtensionPresentationBuilder', () => {
  const builder = new VsCodeExtensionPresentationBuilder({
    localizeText: (english: string) => english,
  });

  it('renders task-board nodes from service-owned actions and handoff targets', () => {
    const nodes = builder.buildTaskBoardNodes([
      createExecutionBoardEntry({
        pendingHitl: true,
      }),
    ]);

    expect(nodes[0]?.label).toBe('TK-563');
    expect(nodes[0]?.command?.command).toBe(VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL);
    expect(nodes[0]?.children?.map((child) => child.label)).toEqual(
      expect.arrayContaining([
        'Status',
        'Workflow stage',
        'Latest event',
        'Open review detail',
        'Approve and resume',
        'Recover execution',
        'Terminate execution',
        'Open review document',
      ]),
    );
  });

  it('renders review-detail html from service-owned artifact pane metadata', () => {
    const html = builder.buildReviewDetailHtml({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
        serviceHealth: {
          lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
          serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
          serviceTransportKind: OrchestrationServiceTransportKind.IPC,
          checkpointCapable: true,
          memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
          pid: 4321,
        },
      },
      selectedExecution: createExecutionBoardEntry(),
      artifactPane: {
        artifacts: [
          {
            artifactId: 'artifact-1',
            artifactPath: '/repo/.repo-ai-governor/context/review.md',
            artifactStatus: 'active',
            artifactType: 'review',
            artifactVersion: '1',
            producerExecutionId: 'execution-1',
            producerTaskId: 'TK-563',
            registeredAt: '2026-04-05T09:00:00.000Z',
            lastUpdatedAt: '2026-04-05T09:05:00.000Z',
          },
        ],
        reviews: [
          {
            reviewId: 'review-1',
            title: 'Sprint 002 review',
            lifecycleStatus: 'resolved',
            filePath: '/repo/.repo-ai-governor/review/resolved.md',
            scope: 'TK-562-564',
            updatedAt: '2026-04-05T09:10:00.000Z',
          },
        ],
        transcript: [
          {
            entryId: 'entry-1',
            sessionId: 'session-1',
            eventType: 'message',
            role: 'assistant',
            lines: ['Review complete.', 'No additional action required.'],
            createdAt: '2026-04-05T09:15:00.000Z',
          },
        ],
        resolvedExecutionId: 'execution-1',
        resolvedSessionId: 'session-1',
        reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
        reviewLifecycle: {
          totalReviewCount: 1,
          pendingReviewCount: 0,
          verifiedReviewCount: 0,
          resolvedReviewCount: 1,
          latestReviewId: 'review-1',
          latestLifecycleStatus: 'resolved',
          latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
          navigationReviewIds: ['review-1'],
        },
        workbench: {
          artifactCount: 1,
          reviewCount: 1,
          transcriptCount: 1,
          latestArtifactId: 'artifact-1',
          latestArtifactPath: '/repo/.repo-ai-governor/context/review.md',
          latestReviewId: 'review-1',
          latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
          latestTranscriptEntryId: 'entry-1',
          latestTranscriptCreatedAt: '2026-04-05T09:15:00.000Z',
        },
        evidenceBacklinks: {
          governanceWorkspacePath: '/repo',
          artifactPaths: ['/repo/.repo-ai-governor/context/review.md'],
          reviewPaths: ['/repo/.repo-ai-governor/review/resolved.md'],
          transcriptEntryIds: ['entry-1'],
        },
        policyTrace: {
          executionId: 'execution-1',
          executionStatus: OrchestrationExecutionStatus.RUNNING,
          pendingHitl: false,
          recoveryCapable: true,
          currentStageId: 'review',
          latestEventType: 'execution.started',
          taskId: 'TK-563',
          projectId: 'project-048-governance-surface-clients-rollout',
          sprintId: 'sprint-002-vscode-editor-companion-mvp',
          reviewDocumentPath: '/repo/.repo-ai-governor/review/resolved.md',
        },
      },
    });

    expect(html).toContain('Governor review detail');
    expect(html).toContain('Sprint 002 review');
    expect(html).toContain('/repo/.repo-ai-governor/review/resolved.md');
    expect(html).toContain('Artifact workbench');
    expect(html).toContain('Evidence backlinks');
    expect(html).toContain('review · active');
    expect(html).toContain('Service lifecycle');
    expect(html).toContain('sidecar via ipc');
    expect(html).toContain('@repo-ai-governor/memory-provider-sqlite-fs');
  });

  it('renders chat review markdown with review counts', () => {
    const markdown = builder.buildChatResponseMarkdown({
      command: 'review',
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
        serviceHealth: {
          lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
          serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
          serviceTransportKind: OrchestrationServiceTransportKind.IPC,
          checkpointCapable: true,
          memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
        },
      },
      executionBoardEntries: [createExecutionBoardEntry()],
      hitlInboxEntries: [createHitlInboxEntry()],
      reviewDetailSnapshot: {
        workspaceContext: {
          workspaceLabel: 'ai-governor',
          workspaceRoot: '/repo',
          workspaceTrusted: true,
          serviceHealth: {
            lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
            serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
            serviceTransportKind: OrchestrationServiceTransportKind.IPC,
            checkpointCapable: true,
            memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
          },
        },
        selectedExecution: createExecutionBoardEntry(),
        artifactPane: {
          artifacts: [],
          reviews: [
            {
              reviewId: 'review-1',
              title: 'Sprint 002 review',
              lifecycleStatus: 'resolved',
              filePath: '/repo/.repo-ai-governor/review/resolved.md',
              updatedAt: '2026-04-05T09:10:00.000Z',
            },
          ],
          transcript: [],
          reviewLifecycle: {
            totalReviewCount: 1,
            pendingReviewCount: 0,
            verifiedReviewCount: 0,
            resolvedReviewCount: 1,
            navigationReviewIds: ['review-1'],
          },
          workbench: {
            artifactCount: 0,
            reviewCount: 1,
            transcriptCount: 0,
          },
          evidenceBacklinks: {
            artifactPaths: [],
            reviewPaths: ['/repo/.repo-ai-governor/review/resolved.md'],
            transcriptEntryIds: [],
          },
        },
      },
    });

    expect(markdown).toContain('# Governor status');
    expect(markdown).toContain('## Review focus');
    expect(markdown).toContain('Visible review records: 1');
    expect(markdown).toContain('Sprint 002 review (resolved)');
    expect(markdown).toContain('Trust-sensitive actions: Available');
    expect(markdown).toContain('Service lifecycle: Ready');
    expect(markdown).toContain('Service topology: sidecar via ipc');
    expect(markdown).toContain('Memory provider: @repo-ai-governor/memory-provider-sqlite-fs');
  });

  it('renders workbench-overview nodes with trust-sensitive and service diagnostics', () => {
    const nodes = builder.buildWorkbenchOverviewNodes({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: false,
        serviceHealth: {
          lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
          serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
          serviceTransportKind: OrchestrationServiceTransportKind.IPC,
          checkpointCapable: true,
          memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
          pid: 4321,
        },
      },
      queueOverview: {
        generatedAt: '2026-04-17T10:00:00.000Z',
        automationInbox: [
          {
            queueEntryId: 'automation:execution-1',
            queueKind: OrchestrationGovernanceQueueKind.AUTOMATION_INBOX,
            workspaceId: 'workspace-1',
            workspaceRoot: '/repo',
            executionId: 'execution-1',
            executionKind: OrchestrationExecutionKind.RUN,
            executionStatus: OrchestrationExecutionStatus.RUNNING,
            taskId: 'TK-563',
            projectId: 'project-048-governance-surface-clients-rollout',
            sprintId: 'sprint-002-vscode-editor-companion-mvp',
            attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
            notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
            followUpSlaState: OrchestrationGovernanceFollowUpSlaState.DUE_SOON,
            actions: [],
            handoffTargets: [],
          },
        ],
        reviewQueue: [
          {
            queueEntryId: 'review:review-1',
            queueKind: OrchestrationGovernanceQueueKind.REVIEW_QUEUE,
            workspaceId: 'workspace-1',
            workspaceRoot: '/repo',
            executionId: 'execution-1',
            executionKind: OrchestrationExecutionKind.RUN,
            executionStatus: OrchestrationExecutionStatus.RUNNING,
            taskId: 'TK-563',
            projectId: 'project-048-governance-surface-clients-rollout',
            sprintId: 'sprint-002-vscode-editor-companion-mvp',
            reviewId: 'review-1',
            reviewLifecycleStatus: 'review_pending',
            reviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
            attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
            notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
            followUpSlaState: OrchestrationGovernanceFollowUpSlaState.DUE_SOON,
            actions: [],
            handoffTargets: [],
          },
        ],
        parallelLanes: [],
        workspaceSummary: [
          {
            workspaceId: 'workspace-1',
            workspaceRoot: '/repo',
            totalExecutionCount: 1,
            activeExecutionCount: 1,
            pendingHitlCount: 0,
            automationInboxCount: 1,
            reviewQueueCount: 1,
            overdueFollowUpCount: 0,
            attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
            latestExecutionId: 'execution-1',
            latestUpdatedAt: '2026-04-17T10:00:00.000Z',
          },
        ],
        temporaryBridges: [
          {
            bridgeId: 'temporary-bridge-host-verify',
            capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_VERIFY,
            workspaceRoot: '/repo/.repo-ai-governor',
            commandWorkingDirectory: '/repo',
            previewCommandLine:
              'repo-ai-governor host verify --output-dir /repo/.repo-ai-governor/generated/hosts/github-copilot',
            receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_VERIFY_RECEIPT,
            backlinkSurface:
              OrchestrationGovernanceTemporaryBridgeBacklinkSurface.ARTIFACT_WORKBENCH,
            exitCriteria: [
              OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
              OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
            ],
          },
        ],
        notificationOwnership: {
          ownerSurface: OrchestrationClientSurface.DESKTOP,
          pendingItemCount: 2,
          dueSoonItemCount: 2,
          overdueItemCount: 0,
          activeWorkspaceCount: 1,
          defaultFollowUpSlaMinutes: 60,
          notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
        },
      },
      selectedExecution: createExecutionBoardEntry(),
      reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
    });

    expect(nodes.map((node) => node.label)).toEqual(
      expect.arrayContaining([
        'Workspace root',
        'Workspace trust',
        'Trust-sensitive actions',
        'Public support level',
        'Desktop relationship',
        'Workflow studio gate',
        'Queue ownership',
        'Review queue',
        'Automation queue',
        'Multi-workspace overview',
        'Temporary CLI bridges',
        'Service lifecycle',
        'Service topology',
        'Checkpoint support',
        'Memory provider',
      ]),
    );
    expect(
      nodes.find((node) => node.nodeId === 'temporary-bridges')?.children?.[0]?.command?.command,
    ).toBe(VSCODE_EXTENSION_COMMAND_IDS.STAGE_TEMPORARY_BRIDGE);
    expect(nodes.find((node) => node.nodeId === 'trust-sensitive-actions')?.description).toBe(
      'Blocked',
    );
    expect(nodes.find((node) => node.nodeId === 'public-support-level')?.description).toBe(
      'Workbench baseline in progress',
    );
    expect(nodes.find((node) => node.nodeId === 'desktop-relationship')?.description).toBe(
      'Foundation-only secondary surface',
    );
    expect(nodes.find((node) => node.nodeId === 'workflow-studio-gate')?.description).toBe(
      'Evidence in progress',
    );
    expect(nodes.find((node) => node.nodeId === 'service-topology')?.description).toBe(
      'sidecar via ipc',
    );
    expect(nodes.find((node) => node.nodeId === 'memory-provider')?.description).toBe(
      '@repo-ai-governor/memory-provider-sqlite-fs',
    );
  });

  it('renders automation-queue nodes with bridge-safe service-owned follow-up metadata', () => {
    const nodes = builder.buildAutomationQueueNodes([
      {
        queueEntryId: 'automation:execution-1',
        queueKind: OrchestrationGovernanceQueueKind.AUTOMATION_INBOX,
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo',
        executionId: 'execution-1',
        executionKind: OrchestrationExecutionKind.RUN,
        executionStatus: OrchestrationExecutionStatus.RUNNING,
        taskId: 'TK-563',
        projectId: 'project-048-governance-surface-clients-rollout',
        sprintId: 'sprint-002-vscode-editor-companion-mvp',
        attentionLevel: OrchestrationGovernanceAttentionLevel.WARNING,
        notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
        followUpSlaState: OrchestrationGovernanceFollowUpSlaState.DUE_SOON,
        actions: [],
        handoffTargets: [],
      },
    ]);

    expect(nodes[0]?.label).toBe('TK-563');
    expect(nodes[0]?.description).toContain('Due soon');
    expect(nodes[0]?.selectionRequest?.queueEntry?.queueEntryId).toBe('automation:execution-1');
    expect(nodes[0]?.children?.map((child) => child.label)).toEqual(
      expect.arrayContaining(['Queue kind', 'Execution status', 'Follow-up SLA', 'Workspace root']),
    );
  });

  it('renders workflow-studio html with desktop decision and support-truth evidence', () => {
    const html = builder.buildWorkflowStudioHtml({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
        serviceHealth: {
          lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
          serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
          serviceTransportKind: OrchestrationServiceTransportKind.IPC,
          checkpointCapable: true,
          memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
          pid: 4321,
        },
      },
      queueOverview: {
        generatedAt: '2026-04-17T10:15:00.000Z',
        automationInbox: [],
        reviewQueue: [],
        parallelLanes: [],
        workspaceSummary: [],
        temporaryBridges: [
          {
            bridgeId: 'temporary-bridge-host-verify',
            capabilityClass: OrchestrationGovernanceTemporaryBridgeCapabilityClass.HOST_VERIFY,
            workspaceRoot: '/repo/.repo-ai-governor',
            commandWorkingDirectory: '/repo',
            previewCommandLine:
              'repo-ai-governor host verify --output-dir /repo/.repo-ai-governor/generated/hosts/github-copilot',
            receiptKind: OrchestrationGovernanceTemporaryBridgeReceiptKind.HOST_VERIFY_RECEIPT,
            backlinkSurface:
              OrchestrationGovernanceTemporaryBridgeBacklinkSurface.ARTIFACT_WORKBENCH,
            exitCriteria: [
              OrchestrationGovernanceTemporaryBridgeExitCriterion.SERVICE_NATIVE_HOST_QUERY,
              OrchestrationGovernanceTemporaryBridgeExitCriterion.ARTIFACT_BACKLINK_PROJECTED,
            ],
          },
        ],
        notificationOwnership: {
          ownerSurface: OrchestrationClientSurface.DESKTOP,
          pendingItemCount: 1,
          dueSoonItemCount: 1,
          overdueItemCount: 0,
          activeWorkspaceCount: 1,
          defaultFollowUpSlaMinutes: 60,
          notificationStatus: OrchestrationGovernanceNotificationStatus.FOLLOW_UP_REQUIRED,
        },
      },
      selectedExecution: createExecutionBoardEntry({
        currentStageId: 'review_verify',
      }),
      artifactPane: {
        artifacts: [],
        reviews: [],
        transcript: [],
        resolvedExecutionId: 'execution-1',
        resolvedSessionId: 'session-1',
        reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
        reviewLifecycle: {
          totalReviewCount: 1,
          pendingReviewCount: 0,
          verifiedReviewCount: 0,
          resolvedReviewCount: 1,
          latestReviewId: 'review-1',
          latestLifecycleStatus: 'resolved',
          latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
          navigationReviewIds: ['review-1'],
        },
        workbench: {
          artifactCount: 1,
          reviewCount: 1,
          transcriptCount: 0,
          latestArtifactId: 'artifact-1',
          latestArtifactPath: '/repo/.repo-ai-governor/context/review.md',
          latestReviewId: 'review-1',
          latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
        },
        evidenceBacklinks: {
          governanceWorkspacePath: '/repo/.repo-ai-governor',
          artifactPaths: ['/repo/.repo-ai-governor/context/review.md'],
          reviewPaths: ['/repo/.repo-ai-governor/review/resolved.md'],
          transcriptEntryIds: [],
        },
        policyTrace: {
          executionId: 'execution-1',
          executionStatus: OrchestrationExecutionStatus.RUNNING,
          pendingHitl: false,
          recoveryCapable: true,
          currentStageId: 'review_verify',
          latestEventType: 'execution_progress',
          latestArtifactId: 'artifact-1',
          latestArtifactPath: '/repo/.repo-ai-governor/context/review.md',
          taskId: 'TK-563',
          projectId: 'project-112-vscode-governance-workbench-rollout',
          sprintId: 'sprint-003-phase-c-workflow-studio-and-full-workbench-cutover',
          reviewDocumentPath: '/repo/.repo-ai-governor/review/resolved.md',
        },
      },
      reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
    });

    expect(html).toContain('Governor workflow studio');
    expect(html).toContain('Support-truth gate');
    expect(html).toContain('Desktop decision surface');
    expect(html).toContain('Foundation-only secondary surface');
    expect(html).toContain('Workbench baseline in progress');
    expect(html).toContain('review_verify');
    expect(html).toContain('Service-native host query replaces this bridge.');
  });

  it('surfaces the ready support-truth branch when the selected execution stage is present and no bridge remains', () => {
    const html = builder.buildWorkflowStudioHtml({
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      queueOverview: {
        generatedAt: '2026-04-17T10:20:00.000Z',
        automationInbox: [],
        reviewQueue: [],
        parallelLanes: [],
        workspaceSummary: [],
        temporaryBridges: [],
        notificationOwnership: {
          ownerSurface: OrchestrationClientSurface.DESKTOP,
          pendingItemCount: 0,
          dueSoonItemCount: 0,
          overdueItemCount: 0,
          activeWorkspaceCount: 1,
          defaultFollowUpSlaMinutes: 60,
          notificationStatus: OrchestrationGovernanceNotificationStatus.IDLE,
        },
      },
      selectedExecution: createExecutionBoardEntry({
        currentStageId: 'support_truth_review',
      }),
      artifactPane: {
        artifacts: [],
        reviews: [],
        transcript: [],
        resolvedExecutionId: 'execution-1',
        resolvedSessionId: 'session-1',
        reviewSourcePath: '/repo/.repo-ai-governor/review/resolved.md',
        reviewLifecycle: {
          totalReviewCount: 1,
          pendingReviewCount: 0,
          verifiedReviewCount: 0,
          resolvedReviewCount: 1,
          latestReviewId: 'review-1',
          latestLifecycleStatus: 'resolved',
          latestReviewFilePath: '/repo/.repo-ai-governor/review/resolved.md',
          navigationReviewIds: ['review-1'],
        },
        workbench: {
          artifactCount: 1,
          reviewCount: 1,
          transcriptCount: 0,
        },
        evidenceBacklinks: {
          governanceWorkspacePath: '/repo/.repo-ai-governor',
          artifactPaths: [],
          reviewPaths: ['/repo/.repo-ai-governor/review/resolved.md'],
          transcriptEntryIds: [],
        },
      },
    });

    expect(html).toContain('Ready for support-truth review');
  });
});

function createExecutionBoardEntry(
  overrides: Partial<OrchestrationExecutionSummary> = {},
): OrchestrationExecutionBoardEntry {
  const execution = createExecutionSummary(overrides);
  return {
    execution,
    actions: [
      {
        actionId: `${execution.executionId}:view`,
        actionKind: OrchestrationGovernanceActionKind.VIEW_EXECUTION,
        executionId: execution.executionId,
        enabled: true,
        requiresConfirmation: false,
      },
      {
        actionId: `${execution.executionId}:submit-hitl`,
        actionKind: OrchestrationGovernanceActionKind.SUBMIT_HITL_DECISION,
        executionId: execution.executionId,
        enabled: execution.pendingHitl,
        requiresConfirmation: true,
        hitlDecisionOptions: execution.pendingHitl
          ? [
              {
                optionId: `${execution.executionId}:approve`,
                decision: 'approve',
                resumeAction: 'resume',
              },
            ]
          : undefined,
      },
      {
        actionId: `${execution.executionId}:recover`,
        actionKind: OrchestrationGovernanceActionKind.RECOVER_EXECUTION,
        executionId: execution.executionId,
        enabled: execution.recoveryCapable,
        requiresConfirmation: false,
      },
      {
        actionId: `${execution.executionId}:terminate`,
        actionKind: OrchestrationGovernanceActionKind.TERMINATE_EXECUTION,
        executionId: execution.executionId,
        enabled: execution.status !== OrchestrationExecutionStatus.COMPLETED,
        requiresConfirmation: true,
      },
    ],
    handoffTargets: [
      {
        targetId: `${execution.executionId}:review-document`,
        executionId: execution.executionId,
        targetKind: OrchestrationHandoffTargetKind.REVIEW_DOCUMENT,
        targetPath: '/repo/.repo-ai-governor/review/resolved.md',
        exists: true,
      },
    ],
  };
}

function createHitlInboxEntry(): OrchestrationHitlInboxEntry {
  return {
    ...createExecutionBoardEntry({
      pendingHitl: true,
      status: OrchestrationExecutionStatus.HITL_REQUIRED,
    }),
  };
}

function createExecutionSummary(
  overrides: Partial<OrchestrationExecutionSummary> = {},
): OrchestrationExecutionSummary {
  return {
    executionId: 'execution-1',
    executionSessionId: 'session-1',
    processId: 'process-1',
    workspaceId: 'workspace-1',
    workspaceRoot: '/repo',
    executionKind: OrchestrationExecutionKind.RUN,
    clientSurface: OrchestrationClientSurface.DESKTOP,
    eventStreamToken: 'stream-1',
    serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
    serviceTransportKind: OrchestrationServiceTransportKind.IPC,
    status: OrchestrationExecutionStatus.RUNNING,
    checkpointCapable: true,
    recoveryCapable: true,
    acceptedAt: '2026-04-05T09:00:00.000Z',
    updatedAt: '2026-04-05T09:05:00.000Z',
    pendingHitl: false,
    lastEventAt: '2026-04-05T09:05:00.000Z',
    latestEventType: 'execution.started',
    latestEventSequence: 1,
    nextCursor: 'cursor-1',
    currentStageId: 'review',
    taskId: 'TK-563',
    projectId: 'project-048-governance-surface-clients-rollout',
    sprintId: 'sprint-002-vscode-editor-companion-mvp',
    ...overrides,
  };
}
