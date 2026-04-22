import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  type OrchestrationExecutionSummary,
  OrchestrationServiceHostKind,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import { LocalOrchestrationServiceReviewRoutingRuntime } from '../src/local-orchestration-service-review-routing-runtime.js';

describe('core-orchestration-service review routing runtime', () => {
  it('accepts the live current-context `Review` field alias for primary review routing', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'review-routing-runtime-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-121/sprint-001/review',
    );
    const reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot,
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

      await expect(reviewRoutingRuntime.resolvePrimaryReviewDirectoryPath()).resolves.toBe(
        reviewDirectoryPath,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('prefers the worktree review target when it uses the live `Review` field alias', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'review-routing-runtime-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const primaryReviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-121/sprint-001/review',
    );
    const overrideReviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-999/sprint-closeout/review',
    );
    const reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot,
    });

    try {
      await mkdir(resolve(workspaceRoot, 'context'), { recursive: true });
      await mkdir(primaryReviewDirectoryPath, { recursive: true });
      await mkdir(overrideReviewDirectoryPath, { recursive: true });
      await writeFile(
        resolve(workspaceRoot, 'context/current-context.md'),
        `# Workspace Current Context

## Primary Stream

- Status: active
- Project: \`project-121\`
- Sprint: \`sprint-001\`
- Review: \`.repo-ai-governor/context/dev/project-121/sprint-001/review\`

## Worktree Review Target

- Project: \`project-999\`
- Sprint: \`sprint-closeout\`
- Review: \`.repo-ai-governor/context/dev/project-999/sprint-closeout/review\`
`,
        'utf8',
      );

      await expect(reviewRoutingRuntime.resolvePrimaryReviewDirectoryPath()).resolves.toBe(
        overrideReviewDirectoryPath,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('falls back to the newest sprint working-tree CR when execution-scoped task ids are absent from review metadata', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'review-routing-runtime-working-tree-'));
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
    const reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot,
    });
    const execution = {
      executionId: 'exec-121-1044',
      executionSessionId: 'session-121-1044',
      processId: 'process-121-1044',
      workspaceId: 'workspace-121',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-121-1044',
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

      await expect(
        reviewRoutingRuntime.resolveExecutionReviewDocumentPath(execution),
      ).resolves.toBe(latestReviewPath);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('fails closed for sprint working-tree CR fallback when multiple executions share the same sprint', async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'review-routing-runtime-working-tree-ambiguous-'),
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
    const reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot,
    });
    const primaryExecution = {
      executionId: 'exec-121-1044',
      executionSessionId: 'session-121-1044',
      processId: 'process-121-1044',
      workspaceId: 'workspace-121',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-121-1044',
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
      executionId: 'exec-121-1045',
      executionSessionId: 'session-121-1045',
      processId: 'process-121-1045',
      eventStreamToken: 'stream-121-1045',
      taskId: 'TK-1045',
    } satisfies OrchestrationExecutionSummary;

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

      await expect(
        reviewRoutingRuntime.resolveExecutionReviewDocumentPath(primaryExecution, {
          siblingExecutions: [primaryExecution, siblingExecution],
        }),
      ).resolves.toBeUndefined();
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('does not treat non-working-tree CR lifecycle docs as sprint working-tree fallback candidates', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'review-routing-runtime-non-working-tree-'));
    const workspaceRoot = resolve(temporaryRoot, '.repo-ai-governor');
    const reviewDirectoryPath = resolve(
      temporaryRoot,
      '.repo-ai-governor/context/dev/project-121/sprint-001/review',
    );
    const reviewDocumentPath = resolve(
      reviewDirectoryPath,
      'resolved_code_review_support-truth.md',
    );
    const reviewRoutingRuntime = new LocalOrchestrationServiceReviewRoutingRuntime({
      workspaceRoot,
    });
    const execution = {
      executionId: 'exec-121-1044',
      executionSessionId: 'session-121-1044',
      processId: 'process-121-1044',
      workspaceId: 'workspace-121',
      workspaceRoot,
      executionKind: OrchestrationExecutionKind.RUN,
      clientSurface: OrchestrationClientSurface.DESKTOP,
      eventStreamToken: 'stream-121-1044',
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

      await expect(
        reviewRoutingRuntime.resolveExecutionReviewDocumentPath(execution),
      ).resolves.toBe(undefined);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
