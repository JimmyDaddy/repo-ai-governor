import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { vi } from 'vitest';

import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  type OrchestrationExecutionSummary,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceTransportKind,
  OrchestrationSessionEventType,
  OrchestrationSessionStatus,
  type OrchestrationSessionSummary,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceShell } from '../src/index.js';
import { LocalOrchestrationServiceArtifactPaneQueryRuntime } from '../src/local-orchestration-service-artifact-pane-query-runtime.js';

describe('core-orchestration-service artifact-pane review routing', () => {
  it('prefers Worktree Review Target review records over a primary `Review records: none` marker', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-review-route-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-999-review/sprint-001-closeout/review',
    );
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: idle
- Project: \`none\`
- Sprint: \`none\`
- Docs root: \`none\`
- Task records: \`none\`
- Review records: \`none\`

## Worktree Review Target

- Project: \`project-999-review\`
- Sprint: \`sprint-001-closeout\`
- Review records: \`.repo-ai-governor/context/dev/project-999-review/sprint-001-closeout/review\`
- Stream State: \`completed\`
- Reason: \`close pending review lifecycle in completed stream\`
- Clear when: \`no code_review_* or verified_code_review_* files remain\`
`,
      );
      await writeFile(
        resolve(reviewDirectoryPath, 'code_review_demo.md'),
        `# Code Review: demo

- Status: review_pending
- Date: 2026-04-05
`,
      );
      await writeFile(
        resolve(reviewDirectoryPath, 'resolved_code_review_demo.md'),
        `# Code Review: demo resolved

- Status: resolved
- Date: 2026-04-05
`,
      );

      const artifactPane = await orchestrationService.queryArtifactPane({
        reviewLimit: 1,
      });

      expect(artifactPane.reviewSourcePath).toBe(reviewDirectoryPath);
      expect(artifactPane.reviews).toHaveLength(1);
      expect(artifactPane.reviewLifecycle.reviewSourcePath).toBe(reviewDirectoryPath);
      expect(artifactPane.reviewLifecycle.totalReviewCount).toBe(2);
      expect(artifactPane.workbench.reviewCount).toBe(1);
      expect(artifactPane.evidenceBacklinks.reviewPaths).toEqual([
        artifactPane.reviews[0]?.filePath,
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('does not publish a fake review source when current-context review records are set to `none`', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-review-none-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const orchestrationService = new LocalOrchestrationServiceShell({
      workspaceRoot,
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: idle
- Project: \`none\`
- Sprint: \`none\`
- Docs root: \`none\`
- Task records: \`none\`
- Review records: \`none\`
`,
      );

      const artifactPane = await orchestrationService.queryArtifactPane();

      expect(artifactPane.reviewSourcePath).toBeUndefined();
      expect(artifactPane.reviews).toEqual([]);
      expect(artifactPane.reviewLifecycle.totalReviewCount).toBe(0);
      expect(artifactPane.workbench.reviewCount).toBe(0);
      expect(artifactPane.evidenceBacklinks.reviewPaths).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('builds policy trace, workbench detail, and evidence backlinks from service-owned execution facts', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-evidence-detail-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-048/sprint-003/review',
    );
    const reviewDocumentPath = resolve(
      reviewDirectoryPath,
      'resolved_code_review_tk-565-governance-evidence.md',
    );
    const executionSummary = {
      executionId: 'execution-565',
      executionSessionId: 'session-565',
      processId: 'process-565',
      workspaceId: 'workspace-048',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'token-565',
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      status: OrchestrationExecutionStatus.RUNNING,
      checkpointCapable: true,
      recoveryCapable: true,
      acceptedAt: '2026-04-05T00:00:00.000Z',
      updatedAt: '2026-04-05T00:01:00.000Z',
      pendingHitl: true,
      latestEventType: OrchestrationServiceEventType.STAGE_PROGRESS,
      currentStageId: 'policy-review',
      latestArtifactId: 'artifact-565',
      latestArtifactPath: '/tmp/workspace/artifacts/policy-trace-565.json',
      taskId: 'TK-565',
      projectId: 'project-048',
      sprintId: 'sprint-003',
    } satisfies OrchestrationExecutionSummary;
    const sessionSummary = {
      sessionId: 'session-565',
      status: OrchestrationSessionStatus.ACTIVE,
      openedAt: '2026-04-05T00:00:00.000Z',
      latestEventSequence: 12,
      nextCursor: '12',
      eventCount: 12,
      context: {},
    } satisfies OrchestrationSessionSummary;
    const artifactPaneQueryRuntime = new LocalOrchestrationServiceArtifactPaneQueryRuntime({
      workspaceRoot,
      getExecution: async () => executionSummary,
      listExecutions: async () => ({
        executions: [executionSummary],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      getSession: async () => sessionSummary,
      listSessions: async () => ({
        sessions: [sessionSummary],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      subscribeSession: async () => ({
        session: sessionSummary,
        latestEventSequence: 12,
        nextCursor: '12',
        events: [
          {
            eventId: 'event-565',
            sequence: 12,
            streamCursor: '12',
            sessionId: 'session-565',
            type: OrchestrationSessionEventType.TURN_SUBMITTED,
            createdAt: '2026-04-05T00:02:00.000Z',
            payload: {
              content: 'Please inspect the latest governance evidence.',
              role: 'user',
            },
          },
        ],
      }),
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-048\`
- Sprint: \`sprint-003\`
- Docs root: \`.repo-ai-governor/context/dev/project-048\`
- Task records: \`.repo-ai-governor/context/dev/project-048/sprint-003/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-048/sprint-003/review/\`
`,
      );
      await writeFile(
        reviewDocumentPath,
        `# Code Review: TK-565

- Status: resolved
- Date: 2026-04-05
- Task: \`TK-565\`
`,
      );
      await writeFile(
        resolve(reviewDirectoryPath, 'resolved_code_review_tk-999-unrelated.md'),
        `# Code Review: TK-999

- Status: resolved
- Date: 2026-04-05
- Task: \`TK-999\`
`,
      );

      const artifactPane = await artifactPaneQueryRuntime.query({
        executionId: 'execution-565',
        sessionId: 'session-565',
        reviewLimit: 1,
      });

      expect(artifactPane.policyTrace?.executionId).toBe('execution-565');
      expect(artifactPane.policyTrace?.pendingHitl).toBe(true);
      expect(artifactPane.policyTrace?.reviewDocumentPath).toBe(reviewDocumentPath);
      expect(artifactPane.reviews).toHaveLength(1);
      expect(artifactPane.reviews[0]?.reviewId).toBe(
        'resolved_code_review_tk-565-governance-evidence.md',
      );
      expect(artifactPane.reviewLifecycle.latestReviewId).toBe(
        'resolved_code_review_tk-565-governance-evidence.md',
      );
      expect(artifactPane.workbench.latestArtifactPath).toBe(
        '/tmp/workspace/artifacts/policy-trace-565.json',
      );
      expect(artifactPane.workbench.latestReviewId).toBe(
        'resolved_code_review_tk-565-governance-evidence.md',
      );
      expect(artifactPane.workbench.latestTranscriptEntryId).toBe('event-565');
      expect(artifactPane.evidenceBacklinks.governanceWorkspacePath).toBe(workspaceRoot);
      expect(artifactPane.evidenceBacklinks.artifactPaths).toEqual([]);
      expect(artifactPane.evidenceBacklinks.reviewPaths).toEqual([reviewDocumentPath]);
      expect(artifactPane.evidenceBacklinks.transcriptEntryIds).toContain('event-565');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('does not fall back to unrelated review records when an execution-scoped review cannot be resolved', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-evidence-miss-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-048/sprint-003/review',
    );
    const executionSummary = {
      executionId: 'execution-565',
      executionSessionId: 'session-565',
      processId: 'process-565',
      workspaceId: 'workspace-048',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'token-565',
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      status: OrchestrationExecutionStatus.RUNNING,
      checkpointCapable: true,
      recoveryCapable: true,
      acceptedAt: '2026-04-05T00:00:00.000Z',
      updatedAt: '2026-04-05T00:01:00.000Z',
      pendingHitl: false,
      latestEventType: OrchestrationServiceEventType.STAGE_PROGRESS,
      taskId: 'TK-565',
      projectId: 'project-048',
      sprintId: 'sprint-003',
    } satisfies OrchestrationExecutionSummary;
    const artifactPaneQueryRuntime = new LocalOrchestrationServiceArtifactPaneQueryRuntime({
      workspaceRoot,
      getExecution: async () => executionSummary,
      listExecutions: async () => ({
        executions: [executionSummary],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      getSession: async () => undefined,
      listSessions: async () => ({
        sessions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      }),
      subscribeSession: async () => {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          'subscribeSession should not be called when no session is resolved',
        );
      },
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-048\`
- Sprint: \`sprint-003\`
- Docs root: \`.repo-ai-governor/context/dev/project-048\`
- Task records: \`.repo-ai-governor/context/dev/project-048/sprint-003/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-048/sprint-003/review/\`
`,
      );
      await writeFile(
        resolve(reviewDirectoryPath, 'resolved_code_review_tk-999-unrelated.md'),
        `# Code Review: TK-999

- Status: resolved
- Date: 2026-04-05
- Task: \`TK-999\`
`,
      );

      const artifactPane = await artifactPaneQueryRuntime.query({
        executionId: 'execution-565',
      });

      expect(artifactPane.policyTrace?.reviewDocumentPath).toBeUndefined();
      expect(artifactPane.reviews).toEqual([]);
      expect(artifactPane.reviewLifecycle.totalReviewCount).toBe(0);
      expect(artifactPane.workbench.latestReviewId).toBeUndefined();
      expect(artifactPane.evidenceBacklinks.reviewPaths).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('scopes ownership-peer lookups to the current sprint/project when resolving review routing', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-ownership-filter-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const executionSummary = {
      executionId: 'execution-777',
      executionSessionId: 'session-777',
      processId: 'process-777',
      workspaceId: 'workspace-777',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'token-777',
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      status: OrchestrationExecutionStatus.RUNNING,
      checkpointCapable: true,
      recoveryCapable: true,
      acceptedAt: '2026-04-05T00:00:00.000Z',
      updatedAt: '2026-04-05T00:01:00.000Z',
      pendingHitl: false,
      taskId: 'TK-777',
      projectId: 'project-777',
      sprintId: 'sprint-003',
    } satisfies OrchestrationExecutionSummary;
    const listExecutions = vi.fn(async () => ({
      executions: [executionSummary],
      returnedCount: 1,
      totalMatchedCount: 1,
    }));
    const artifactPaneQueryRuntime = new LocalOrchestrationServiceArtifactPaneQueryRuntime({
      workspaceRoot,
      getExecution: async () => executionSummary,
      listExecutions,
      getSession: async () => undefined,
      listSessions: async () => ({
        sessions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      }),
      subscribeSession: async () => {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          'subscribeSession should not be called when no session is resolved',
        );
      },
    });

    try {
      const artifactPane = await artifactPaneQueryRuntime.query({
        executionId: executionSummary.executionId,
      });

      expect(artifactPane.policyTrace?.executionId).toBe(executionSummary.executionId);
      expect(listExecutions).toHaveBeenCalledWith({
        filter: {
          projectId: 'project-777',
          sprintId: 'sprint-003',
        },
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('keeps transcript payload empty when transcriptLimit is zero', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-pane-transcript-limit-zero-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const sessionSummary = {
      sessionId: 'session-zero',
      status: OrchestrationSessionStatus.ACTIVE,
      openedAt: '2026-04-05T00:00:00.000Z',
      latestEventSequence: 8,
      nextCursor: '8',
      eventCount: 8,
      context: {},
    } satisfies OrchestrationSessionSummary;
    let subscribeCallCount = 0;
    const artifactPaneQueryRuntime = new LocalOrchestrationServiceArtifactPaneQueryRuntime({
      workspaceRoot,
      getExecution: async () => undefined,
      listExecutions: async () => ({
        executions: [],
        returnedCount: 0,
        totalMatchedCount: 0,
      }),
      getSession: async () => sessionSummary,
      listSessions: async () => ({
        sessions: [sessionSummary],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      subscribeSession: async () => {
        subscribeCallCount += 1;
        return {
          session: sessionSummary,
          latestEventSequence: 8,
          nextCursor: '8',
          events: [
            {
              eventId: 'event-zero',
              sequence: 8,
              streamCursor: '8',
              sessionId: 'session-zero',
              type: OrchestrationSessionEventType.TURN_SUBMITTED,
              createdAt: '2026-04-05T00:02:00.000Z',
              payload: {
                content: 'This transcript should stay hidden.',
                role: 'user',
              },
            },
          ],
        };
      },
    });

    try {
      const artifactPane = await artifactPaneQueryRuntime.query({
        sessionId: 'session-zero',
        transcriptLimit: 0,
      });

      expect(subscribeCallCount).toBe(0);
      expect(artifactPane.transcript).toEqual([]);
      expect(artifactPane.evidenceBacklinks.transcriptEntryIds).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
