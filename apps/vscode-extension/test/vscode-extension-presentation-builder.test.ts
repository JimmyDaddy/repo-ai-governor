import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationGovernanceActionKind,
  OrchestrationHandoffTargetKind,
  OrchestrationServiceHostKind,
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

  it('renders execution-board nodes from service-owned actions and handoff targets', () => {
    const nodes = builder.buildExecutionBoardNodes([
      createExecutionBoardEntry({
        pendingHitl: true,
      }),
    ]);

    expect(nodes[0]?.label).toBe('TK-563');
    expect(nodes[0]?.command?.command).toBe(VSCODE_EXTENSION_COMMAND_IDS.OPEN_REVIEW_DETAIL);
    expect(nodes[0]?.children?.map((child) => child.label)).toEqual(
      expect.arrayContaining([
        'Status',
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
      },
    });

    expect(html).toContain('Governor review detail');
    expect(html).toContain('Sprint 002 review');
    expect(html).toContain('/repo/.repo-ai-governor/review/resolved.md');
    expect(html).toContain('review · active');
  });

  it('renders chat review markdown with review counts', () => {
    const markdown = builder.buildChatResponseMarkdown({
      command: 'review',
      workspaceContext: {
        workspaceLabel: 'ai-governor',
        workspaceRoot: '/repo',
        workspaceTrusted: true,
      },
      executionBoardEntries: [createExecutionBoardEntry()],
      hitlInboxEntries: [createHitlInboxEntry()],
      reviewDetailSnapshot: {
        workspaceContext: {
          workspaceLabel: 'ai-governor',
          workspaceRoot: '/repo',
          workspaceTrusted: true,
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
        },
      },
    });

    expect(markdown).toContain('# Governor status');
    expect(markdown).toContain('## Review focus');
    expect(markdown).toContain('Visible review records: 1');
    expect(markdown).toContain('Sprint 002 review (resolved)');
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
