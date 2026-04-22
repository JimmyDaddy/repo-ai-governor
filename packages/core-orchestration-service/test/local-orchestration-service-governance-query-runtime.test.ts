import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
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
  OrchestrationWorkbenchBacklinkKind,
} from '@repo-ai-governor/orchestration-service-client';
import { LocalOrchestrationServiceGovernanceQueryRuntime } from '../src/local-orchestration-service-governance-query-runtime.js';

describe('core-orchestration-service governance query runtime', () => {
  it('keeps role-lane queries inside the caller filter when the requested execution is out of scope', async () => {
    const workspaceRoot = '/tmp/governance-query-filtered-role-lanes';
    const scopedExecution = {
      executionId: 'exec-governance-700',
      executionSessionId: 'session-governance-700',
      processId: 'process-governance-700',
      workspaceId: 'workspace-governance',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-governance-700',
      serviceHostKind: OrchestrationServiceHostKind.EMBEDDED,
      serviceTransportKind: OrchestrationServiceTransportKind.IN_PROCESS,
      status: OrchestrationExecutionStatus.RUNNING,
      checkpointCapable: true,
      recoveryCapable: true,
      acceptedAt: '2026-04-22T16:00:00.000Z',
      updatedAt: '2026-04-22T16:05:00.000Z',
      pendingHitl: false,
      taskId: 'TK-700',
      projectId: 'project-121',
      sprintId: 'sprint-001',
    } satisfies OrchestrationExecutionSummary;
    const outOfScopeExecution = {
      ...scopedExecution,
      executionId: 'exec-governance-701',
      executionSessionId: 'session-governance-701',
      processId: 'process-governance-701',
      eventStreamToken: 'stream-governance-701',
      taskId: 'TK-701',
      projectId: 'project-999',
      sprintId: 'sprint-009',
    } satisfies OrchestrationExecutionSummary;
    const listExecutions = vi.fn(async (request?: { filter?: { projectId?: string } }) => {
      const executions =
        request?.filter?.projectId === 'project-121'
          ? [scopedExecution]
          : [scopedExecution, outOfScopeExecution];
      return {
        executions,
        returnedCount: executions.length,
        totalMatchedCount: executions.length,
      };
    });
    const readExecutionEvents = vi.fn().mockResolvedValue([]);
    const governanceQueryRuntime = new LocalOrchestrationServiceGovernanceQueryRuntime({
      workspaceRoot,
      listExecutions,
      readExecutionEvents,
      readHitlDecisionState: async () => undefined,
    });

    const roleLaneStatus = await governanceQueryRuntime.queryRoleLaneStatus({
      executionId: outOfScopeExecution.executionId,
      filter: {
        projectId: 'project-121',
      },
    });

    expect(roleLaneStatus.lanes).toEqual([]);
    expect(roleLaneStatus.returnedCount).toBe(0);
    expect(roleLaneStatus.totalMatchedCount).toBe(0);
    expect(listExecutions).toHaveBeenCalledTimes(1);
    expect(listExecutions).toHaveBeenCalledWith({
      filter: {
        projectId: 'project-121',
      },
    });
    expect(readExecutionEvents).not.toHaveBeenCalled();
  });

  it('falls back to review routing for structured review handoff when artifact-pane review metadata is unavailable', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'governance-query-review-fallback-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-048/sprint-001/review',
    );
    const reviewDocumentPath = resolve(reviewDirectoryPath, 'code_review_tk-560.md');
    const execution = {
      executionId: 'exec-governance-560',
      executionSessionId: 'session-governance-560',
      processId: 'process-governance-560',
      workspaceId: 'workspace-governance',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-governance-560',
      serviceHostKind: OrchestrationServiceHostKind.EMBEDDED,
      serviceTransportKind: OrchestrationServiceTransportKind.IN_PROCESS,
      status: OrchestrationExecutionStatus.HITL_REQUIRED,
      checkpointCapable: true,
      recoveryCapable: false,
      acceptedAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-04-22T00:05:00.000Z',
      pendingHitl: true,
      taskId: 'TK-560',
      projectId: 'project-048',
      sprintId: 'sprint-001',
    } satisfies OrchestrationExecutionSummary;
    const governanceQueryRuntime = new LocalOrchestrationServiceGovernanceQueryRuntime({
      workspaceRoot,
      listExecutions: async () => ({
        executions: [execution],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      readExecutionEvents: async () => [
        {
          eventId: 'event-governance-560',
          sequence: 1,
          streamCursor: '1',
          type: OrchestrationServiceEventType.HITL_REQUIRED,
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
          status: OrchestrationExecutionStatus.HITL_REQUIRED,
          timestamp: '2026-04-22T00:05:00.000Z',
          message: 'Awaiting HITL decision.',
          livenessSnapshot: {
            roleId: 'reviewer-default',
            routeKey: 'session.main',
            status: 'waiting_for_hitl',
            latestEventType: 'hitl.required',
            latestEventAt: '2026-04-22T00:05:00.000Z',
          },
        },
      ],
      readHitlDecisionState: async () => ({
        policyAction: 'confirm',
        defaultTimeoutAction: 'block',
        allowedDecisions: [
          {
            optionId: 'exec-governance-560:hitl:approve-resume',
            decision: 'approve',
            resumeAction: 'resume',
          },
        ],
        riskFacts: [
          {
            riskId: 'risk-governance-560',
            riskCategory: 'hitl-decision-pending',
            riskLevel: 'L2',
            evidence: ['execution_id=exec-governance-560'],
            changeScope: 'TK-560',
            confidence: 0.86,
            triggerRule: 'runtime-hitl-pending',
          },
        ],
        recordedAt: '2026-04-22T00:05:00.000Z',
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
- Sprint: \`sprint-001\`
- Review: \`.repo-ai-governor/context/dev/project-048/sprint-001/review\`
`,
        'utf8',
      );
      await writeFile(
        reviewDocumentPath,
        `# Code Review: TK-560

- Status: review_pending
- Task: \`TK-560\`
- Scope: \`project-048 / sprint-001\`
`,
        'utf8',
      );

      const hitlDecisionPacket = await governanceQueryRuntime.queryHitlDecisionPacket({
        executionId: execution.executionId,
      });
      const roleLaneStatus = await governanceQueryRuntime.queryRoleLaneStatus({
        executionId: execution.executionId,
      });

      expect(hitlDecisionPacket?.reviewId).toBe('code_review_tk-560.md');
      expect(hitlDecisionPacket?.impactSummary).toContain(reviewDocumentPath);
      expect(hitlDecisionPacket?.backlinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backlinkKind: OrchestrationWorkbenchBacklinkKind.REVIEW,
            target: reviewDocumentPath,
          }),
        ]),
      );
      expect(roleLaneStatus.lanes[0]?.reviewBacklinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backlinkKind: OrchestrationWorkbenchBacklinkKind.REVIEW,
            target: reviewDocumentPath,
          }),
        ]),
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('synthesizes a stable HITL decision packet from the persisted pending event when decision state is missing', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'governance-query-hitl-fallback-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-048/sprint-001/review',
    );
    const reviewDocumentPath = resolve(reviewDirectoryPath, 'code_review_tk-561.md');
    const execution = {
      executionId: 'exec-governance-561',
      executionSessionId: 'session-governance-561',
      processId: 'process-governance-561',
      workspaceId: 'workspace-governance',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-governance-561',
      serviceHostKind: OrchestrationServiceHostKind.EMBEDDED,
      serviceTransportKind: OrchestrationServiceTransportKind.IN_PROCESS,
      status: OrchestrationExecutionStatus.HITL_REQUIRED,
      checkpointCapable: true,
      recoveryCapable: false,
      acceptedAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-04-22T00:07:00.000Z',
      pendingHitl: true,
      taskId: 'TK-561',
      projectId: 'project-048',
      sprintId: 'sprint-001',
    } satisfies OrchestrationExecutionSummary;
    const governanceQueryRuntime = new LocalOrchestrationServiceGovernanceQueryRuntime({
      workspaceRoot,
      listExecutions: async () => ({
        executions: [execution],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      readExecutionEvents: async () => [
        {
          eventId: 'event-governance-561-hitl',
          sequence: 1,
          streamCursor: '1',
          type: OrchestrationServiceEventType.HITL_REQUIRED,
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
          status: OrchestrationExecutionStatus.HITL_REQUIRED,
          timestamp: '2026-04-22T00:05:00.000Z',
          taskId: execution.taskId,
          projectId: execution.projectId,
          sprintId: execution.sprintId,
          message: 'Awaiting HITL decision.',
        },
        {
          eventId: 'event-governance-561-artifact',
          sequence: 2,
          streamCursor: '2',
          type: OrchestrationServiceEventType.ARTIFACT_READY,
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
          status: OrchestrationExecutionStatus.HITL_REQUIRED,
          timestamp: '2026-04-22T00:07:00.000Z',
          artifactId: 'follow-up-evidence',
          artifactPath: '/tmp/follow-up-evidence.md',
          taskId: execution.taskId,
          projectId: execution.projectId,
          sprintId: execution.sprintId,
          message: 'Captured evidence while HITL remains pending.',
        },
      ],
      readHitlDecisionState: async () => undefined,
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
- Sprint: \`sprint-001\`
- Review: \`.repo-ai-governor/context/dev/project-048/sprint-001/review\`
`,
        'utf8',
      );
      await writeFile(
        reviewDocumentPath,
        `# Code Review: TK-561

- Status: review_pending
- Task: \`TK-561\`
- Scope: \`project-048 / sprint-001\`
`,
        'utf8',
      );

      const hitlDecisionPacket = await governanceQueryRuntime.queryHitlDecisionPacket({
        executionId: execution.executionId,
      });
      const repeatedHitlDecisionPacket = await governanceQueryRuntime.queryHitlDecisionPacket({
        executionId: execution.executionId,
      });

      expect(hitlDecisionPacket).toMatchObject({
        executionId: execution.executionId,
        executionSessionId: execution.executionSessionId,
        taskId: 'TK-561',
        reviewId: 'code_review_tk-561.md',
        policyAction: 'confirm',
        defaultTimeoutAction: 'block',
        slaDeadlineAt: '2026-04-22T04:05:00.000Z',
      });
      expect(hitlDecisionPacket?.riskFacts[0]).toEqual(
        expect.objectContaining({
          riskCategory: 'hitl-decision-pending',
          riskLevel: 'L2',
          changeScope: 'TK-561',
          triggerRule: 'runtime-hitl-pending',
          evidence: expect.arrayContaining([
            'execution_id=exec-governance-561',
            'task_id=TK-561',
            'pending_since=2026-04-22T00:05:00.000Z',
          ]),
        }),
      );
      expect(hitlDecisionPacket?.backlinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backlinkKind: OrchestrationWorkbenchBacklinkKind.REVIEW,
            target: reviewDocumentPath,
          }),
        ]),
      );
      expect(repeatedHitlDecisionPacket?.slaDeadlineAt).toBe(hitlDecisionPacket?.slaDeadlineAt);
      expect(repeatedHitlDecisionPacket?.riskFacts).toEqual(hitlDecisionPacket?.riskFacts);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('falls back to the latest sprint working-tree CR for review backlinks when task-scoped review metadata is unavailable', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'governance-query-working-tree-review-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-121/sprint-001/review',
    );
    const olderReviewPath = resolve(
      reviewDirectoryPath,
      'resolved_code_review_working-tree-20260422-1320.md',
    );
    const latestReviewPath = resolve(
      reviewDirectoryPath,
      'resolved_code_review_working-tree-20260422-1347.md',
    );
    const execution = {
      executionId: 'exec-governance-1044',
      executionSessionId: 'session-governance-1044',
      processId: 'process-governance-1044',
      workspaceId: 'workspace-governance',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-governance-1044',
      serviceHostKind: OrchestrationServiceHostKind.EMBEDDED,
      serviceTransportKind: OrchestrationServiceTransportKind.IN_PROCESS,
      status: OrchestrationExecutionStatus.HITL_REQUIRED,
      checkpointCapable: true,
      recoveryCapable: false,
      acceptedAt: '2026-04-22T13:20:00.000Z',
      updatedAt: '2026-04-22T13:47:00.000Z',
      pendingHitl: true,
      taskId: 'TK-1044',
      projectId: 'project-121',
      sprintId: 'sprint-001',
    } satisfies OrchestrationExecutionSummary;
    const governanceQueryRuntime = new LocalOrchestrationServiceGovernanceQueryRuntime({
      workspaceRoot,
      listExecutions: async () => ({
        executions: [execution],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      readExecutionEvents: async () => [
        {
          eventId: 'event-governance-1044-hitl',
          sequence: 1,
          streamCursor: '1',
          type: OrchestrationServiceEventType.HITL_REQUIRED,
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
          status: OrchestrationExecutionStatus.HITL_REQUIRED,
          timestamp: '2026-04-22T13:47:00.000Z',
          taskId: execution.taskId,
          projectId: execution.projectId,
          sprintId: execution.sprintId,
          message: 'Awaiting HITL decision.',
        },
      ],
      readHitlDecisionState: async () => undefined,
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await mkdir(reviewDirectoryPath, { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-121\`
- Sprint: \`sprint-001\`
- Review: \`.repo-ai-governor/context/dev/project-121/sprint-001/review\`
`,
        'utf8',
      );
      await writeFile(
        olderReviewPath,
        `# Code Review: working-tree-20260422-1320

- Status: resolved
- Task: \`CR-008\`
`,
        'utf8',
      );
      await writeFile(
        latestReviewPath,
        `# Code Review: working-tree-20260422-1347

- Status: resolved
- Task: \`CR-009\`
`,
        'utf8',
      );
      await utimes(
        olderReviewPath,
        new Date('2026-04-22T13:20:00.000Z'),
        new Date('2026-04-22T13:20:00.000Z'),
      );
      await utimes(
        latestReviewPath,
        new Date('2026-04-22T13:47:00.000Z'),
        new Date('2026-04-22T13:47:00.000Z'),
      );

      const hitlDecisionPacket = await governanceQueryRuntime.queryHitlDecisionPacket({
        executionId: execution.executionId,
      });
      const roleLaneStatus = await governanceQueryRuntime.queryRoleLaneStatus({
        executionId: execution.executionId,
      });

      expect(hitlDecisionPacket?.reviewId).toBe(
        'resolved_code_review_working-tree-20260422-1347.md',
      );
      expect(hitlDecisionPacket?.backlinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backlinkKind: OrchestrationWorkbenchBacklinkKind.REVIEW,
            target: latestReviewPath,
          }),
        ]),
      );
      expect(roleLaneStatus.lanes[0]?.reviewBacklinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backlinkKind: OrchestrationWorkbenchBacklinkKind.REVIEW,
            target: latestReviewPath,
          }),
        ]),
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed for sprint working-tree fallback when multiple executions share the same sprint', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'governance-query-working-tree-review-ambiguous-'),
    );
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-121/sprint-001/review',
    );
    const latestReviewPath = resolve(
      reviewDirectoryPath,
      'resolved_code_review_working-tree-20260422-1347.md',
    );
    const primaryExecution = {
      executionId: 'exec-governance-1044',
      executionSessionId: 'session-governance-1044',
      processId: 'process-governance-1044',
      workspaceId: 'workspace-governance',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-governance-1044',
      serviceHostKind: OrchestrationServiceHostKind.EMBEDDED,
      serviceTransportKind: OrchestrationServiceTransportKind.IN_PROCESS,
      status: OrchestrationExecutionStatus.HITL_REQUIRED,
      checkpointCapable: true,
      recoveryCapable: false,
      acceptedAt: '2026-04-22T13:20:00.000Z',
      updatedAt: '2026-04-22T13:47:00.000Z',
      pendingHitl: true,
      taskId: 'TK-1044',
      projectId: 'project-121',
      sprintId: 'sprint-001',
    } satisfies OrchestrationExecutionSummary;
    const siblingExecution = {
      ...primaryExecution,
      executionId: 'exec-governance-1045',
      executionSessionId: 'session-governance-1045',
      processId: 'process-governance-1045',
      eventStreamToken: 'stream-governance-1045',
      taskId: 'TK-1045',
    } satisfies OrchestrationExecutionSummary;
    const governanceQueryRuntime = new LocalOrchestrationServiceGovernanceQueryRuntime({
      workspaceRoot,
      listExecutions: async () => ({
        executions: [primaryExecution, siblingExecution],
        returnedCount: 2,
        totalMatchedCount: 2,
      }),
      readExecutionEvents: async (executionId) => [
        {
          eventId: `event-${executionId}-hitl`,
          sequence: 1,
          streamCursor: '1',
          type: OrchestrationServiceEventType.HITL_REQUIRED,
          executionId,
          executionSessionId:
            executionId === primaryExecution.executionId
              ? primaryExecution.executionSessionId
              : siblingExecution.executionSessionId,
          status: OrchestrationExecutionStatus.HITL_REQUIRED,
          timestamp: '2026-04-22T13:47:00.000Z',
          taskId:
            executionId === primaryExecution.executionId
              ? primaryExecution.taskId
              : siblingExecution.taskId,
          projectId: 'project-121',
          sprintId: 'sprint-001',
          message: 'Awaiting HITL decision.',
        },
      ],
      readHitlDecisionState: async (executionId) => ({
        policyAction: 'confirm',
        defaultTimeoutAction: 'block',
        allowedDecisions: [
          {
            optionId: `${executionId}:hitl:approve-resume`,
            decision: 'approve',
            resumeAction: 'resume',
          },
        ],
        riskFacts: [
          {
            riskId: `risk-${executionId}`,
            riskCategory: 'hitl-decision-pending',
            riskLevel: 'L2',
            evidence: [`execution_id=${executionId}`],
            changeScope: executionId === primaryExecution.executionId ? 'TK-1044' : 'TK-1045',
            confidence: 0.86,
            triggerRule: 'runtime-hitl-pending',
          },
        ],
        recordedAt: '2026-04-22T13:47:00.000Z',
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
- Project: \`project-121\`
- Sprint: \`sprint-001\`
- Review: \`.repo-ai-governor/context/dev/project-121/sprint-001/review\`
`,
        'utf8',
      );
      await writeFile(
        latestReviewPath,
        `# Code Review: working-tree-20260422-1347

- Status: resolved
- Task: \`CR-009\`
`,
        'utf8',
      );
      await utimes(
        latestReviewPath,
        new Date('2026-04-22T13:47:00.000Z'),
        new Date('2026-04-22T13:47:00.000Z'),
      );

      const executionBoard = await governanceQueryRuntime.queryExecutionBoard({
        filter: {
          projectId: 'project-121',
        },
      });
      const hitlDecisionPacket = await governanceQueryRuntime.queryHitlDecisionPacket({
        executionId: primaryExecution.executionId,
      });
      const roleLaneStatus = await governanceQueryRuntime.queryRoleLaneStatus({
        executionId: primaryExecution.executionId,
      });
      const reviewTarget = executionBoard.executions[0]?.handoffTargets.find(
        (target) => target.targetKind === 'review_document',
      );

      expect(reviewTarget?.exists).toBe(false);
      expect(reviewTarget?.targetPath).toBeUndefined();
      expect(hitlDecisionPacket?.reviewId).toBeUndefined();
      expect(
        hitlDecisionPacket?.backlinks.filter(
          (backlink) => backlink.backlinkKind === OrchestrationWorkbenchBacklinkKind.REVIEW,
        ),
      ).toEqual([]);
      expect(roleLaneStatus.lanes[0]?.reviewBacklinks).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('ignores same-sprint non-working-tree CR lifecycle docs when resolving execution review backlinks', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'governance-query-non-working-tree-review-'),
    );
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-121/sprint-001/review',
    );
    const reviewDocumentPath = resolve(
      reviewDirectoryPath,
      'resolved_code_review_support-truth.md',
    );
    const execution = {
      executionId: 'exec-governance-1044',
      executionSessionId: 'session-governance-1044',
      processId: 'process-governance-1044',
      workspaceId: 'workspace-governance',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-governance-1044',
      serviceHostKind: OrchestrationServiceHostKind.EMBEDDED,
      serviceTransportKind: OrchestrationServiceTransportKind.IN_PROCESS,
      status: OrchestrationExecutionStatus.HITL_REQUIRED,
      checkpointCapable: true,
      recoveryCapable: false,
      acceptedAt: '2026-04-22T13:20:00.000Z',
      updatedAt: '2026-04-22T13:47:00.000Z',
      pendingHitl: true,
      taskId: 'TK-1044',
      projectId: 'project-121',
      sprintId: 'sprint-001',
    } satisfies OrchestrationExecutionSummary;
    const governanceQueryRuntime = new LocalOrchestrationServiceGovernanceQueryRuntime({
      workspaceRoot,
      listExecutions: async () => ({
        executions: [execution],
        returnedCount: 1,
        totalMatchedCount: 1,
      }),
      readExecutionEvents: async () => [
        {
          eventId: 'event-governance-1044-hitl',
          sequence: 1,
          streamCursor: '1',
          type: OrchestrationServiceEventType.HITL_REQUIRED,
          executionId: execution.executionId,
          executionSessionId: execution.executionSessionId,
          status: OrchestrationExecutionStatus.HITL_REQUIRED,
          timestamp: '2026-04-22T13:47:00.000Z',
          taskId: execution.taskId,
          projectId: execution.projectId,
          sprintId: execution.sprintId,
          message: 'Awaiting HITL decision.',
        },
      ],
      readHitlDecisionState: async () => ({
        policyAction: 'confirm',
        defaultTimeoutAction: 'block',
        allowedDecisions: [
          {
            optionId: 'exec-governance-1044:hitl:approve-resume',
            decision: 'approve',
            resumeAction: 'resume',
          },
        ],
        riskFacts: [
          {
            riskId: 'risk-governance-1044',
            riskCategory: 'hitl-decision-pending',
            riskLevel: 'L2',
            evidence: ['execution_id=exec-governance-1044'],
            changeScope: 'TK-1044',
            confidence: 0.86,
            triggerRule: 'runtime-hitl-pending',
          },
        ],
        recordedAt: '2026-04-22T13:47:00.000Z',
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
- Project: \`project-121\`
- Sprint: \`sprint-001\`
- Review: \`.repo-ai-governor/context/dev/project-121/sprint-001/review\`
`,
        'utf8',
      );
      await writeFile(
        reviewDocumentPath,
        `# Code Review: support-truth

- Status: resolved
- Task: \`CR-011\`
- Scope: \`project-121 / sprint-001\`
`,
        'utf8',
      );

      const hitlDecisionPacket = await governanceQueryRuntime.queryHitlDecisionPacket({
        executionId: execution.executionId,
      });
      const roleLaneStatus = await governanceQueryRuntime.queryRoleLaneStatus({
        executionId: execution.executionId,
      });

      expect(hitlDecisionPacket?.reviewId).toBeUndefined();
      expect(
        hitlDecisionPacket?.backlinks.filter(
          (backlink) => backlink.backlinkKind === OrchestrationWorkbenchBacklinkKind.REVIEW,
        ),
      ).toEqual([]);
      expect(roleLaneStatus.lanes[0]?.reviewBacklinks).toEqual([]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
