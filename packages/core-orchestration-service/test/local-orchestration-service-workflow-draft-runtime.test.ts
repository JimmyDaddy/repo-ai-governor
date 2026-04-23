import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { OrchestrationWorkflowDraftEntryMode } from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceWorkflowDraftRuntime } from '../src/local-orchestration-service-workflow-draft-runtime.js';

describe('LocalOrchestrationServiceWorkflowDraftRuntime', () => {
  it('fails closed before replacing one active mutable workflow draft session', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-workflow-draft-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const runtime = new LocalOrchestrationServiceWorkflowDraftRuntime({
      workspaceRoot,
      nowProvider: () => new Date('2026-04-22T00:00:00.000Z'),
    });

    try {
      const startedDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'parallel-review',
      });
      const blockedReplacement = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.READ_ONLY,
        templateId: 'loop-guarded',
      });
      const replacedDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.READ_ONLY,
        templateId: 'loop-guarded',
        replaceExistingDraftSession: true,
      });
      const activeDraft = await runtime.queryWorkflowDraftSession();

      expect(blockedReplacement.applied).toBe(false);
      expect(blockedReplacement.message).toContain('already active');
      expect(blockedReplacement.draftSession.workflowDraftId).toBe(
        startedDraft.draftSession.workflowDraftId,
      );
      expect(replacedDraft.applied).toBe(true);
      expect(replacedDraft.draftSession.workflowDraftId).not.toBe(
        startedDraft.draftSession.workflowDraftId,
      );
      expect(activeDraft?.workflowDraftId).toBe(replacedDraft.draftSession.workflowDraftId);
      expect(activeDraft?.entryMode).toBe(OrchestrationWorkflowDraftEntryMode.READ_ONLY);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('replaces an existing workflow edge instead of appending one duplicate during edit', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-workflow-draft-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const runtime = new LocalOrchestrationServiceWorkflowDraftRuntime({
      workspaceRoot,
      nowProvider: () => new Date('2026-04-22T00:00:00.000Z'),
    });

    try {
      const startedDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'condition-route',
      });
      const mutatedDraft = await runtime.updateWorkflowDraftEdge({
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

      expect(mutatedDraft.applied).toBe(true);
      expect(mutatedDraft.draftSession.edgeSpecs).toHaveLength(3);
      expect(
        mutatedDraft.draftSession.edgeSpecs.some(
          (edge) =>
            edge.fromNodeId === 'node-route-policy' &&
            edge.toNodeId === 'node-fast-lane' &&
            edge.conditionKey === 'allow',
        ),
      ).toBe(false);
      expect(
        mutatedDraft.draftSession.edgeSpecs.filter(
          (edge) =>
            edge.fromNodeId === 'node-route-policy' &&
            edge.toNodeId === 'node-guarded-lane' &&
            edge.conditionKey === 'allow',
        ),
      ).toHaveLength(1);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('blocks removing the final workflow node and keeps the persisted draft readable', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-workflow-draft-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const runtime = new LocalOrchestrationServiceWorkflowDraftRuntime({
      workspaceRoot,
      nowProvider: () => new Date('2026-04-22T00:00:00.000Z'),
    });

    try {
      const startedDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'parallel-review',
      });
      let latestDraft = startedDraft.draftSession;

      for (const nodeId of ['node-review-risk', 'node-review-quality', 'node-review-fanout']) {
        const updatedDraft = await runtime.updateWorkflowDraftNode({
          workflowDraftId: latestDraft.workflowDraftId,
          draftRevision: latestDraft.draftRevision,
          nodeId,
          remove: true,
        });
        expect(updatedDraft.applied).toBe(true);
        latestDraft = updatedDraft.draftSession;
      }

      await expect(
        runtime.updateWorkflowDraftNode({
          workflowDraftId: latestDraft.workflowDraftId,
          draftRevision: latestDraft.draftRevision,
          nodeId: 'node-plan',
          remove: true,
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        message: expect.stringContaining('must keep at least one node'),
      });

      const reloadedDraft = await runtime.queryWorkflowDraftSession({
        workflowDraftId: latestDraft.workflowDraftId,
      });

      expect(reloadedDraft?.draftRevision).toBe(latestDraft.draftRevision);
      expect(reloadedDraft?.nodeSpecs).toHaveLength(1);
      expect(reloadedDraft?.nodeSpecs[0]?.nodeId).toBe('node-plan');
      expect(reloadedDraft?.compiledIrPreview.entryNodeId).toBe('node-plan');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('blocks removing the active entry node until a replacement is chosen', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-workflow-draft-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const runtime = new LocalOrchestrationServiceWorkflowDraftRuntime({
      workspaceRoot,
      nowProvider: () => new Date('2026-04-22T00:00:00.000Z'),
    });

    try {
      const startedDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'condition-route',
      });

      await expect(
        runtime.updateWorkflowDraftNode({
          workflowDraftId: startedDraft.draftSession.workflowDraftId,
          draftRevision: startedDraft.draftSession.draftRevision,
          nodeId: 'node-prepare',
          remove: true,
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        message: expect.stringContaining('Select a new entry node'),
      });

      const reloadedDraft = await runtime.queryWorkflowDraftSession({
        workflowDraftId: startedDraft.draftSession.workflowDraftId,
      });

      expect(reloadedDraft?.nodeSpecs).toHaveLength(4);
      expect(reloadedDraft?.compiledIrPreview.entryNodeId).toBe('node-prepare');
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('preserves canonical execution identity across no-op edit commits', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-workflow-draft-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const runtime = new LocalOrchestrationServiceWorkflowDraftRuntime({
      workspaceRoot,
      nowProvider: () => new Date('2026-04-22T00:00:00.000Z'),
    });

    try {
      const startedDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'parallel-review',
      });
      const firstCommit = await runtime.commitWorkflowDraft({
        workflowDraftId: startedDraft.draftSession.workflowDraftId,
        draftRevision: startedDraft.draftSession.draftRevision,
      });
      const editDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.EDIT_SEED,
        replaceExistingDraftSession: true,
      });
      const secondCommit = await runtime.commitWorkflowDraft({
        workflowDraftId: editDraft.draftSession.workflowDraftId,
        draftRevision: editDraft.draftSession.draftRevision,
      });
      const definitionPath = firstCommit.definitionPath;
      const compiledIrPath = firstCommit.compiledIrPath;
      expect(definitionPath).toBeDefined();
      expect(compiledIrPath).toBeDefined();
      if (!definitionPath || !compiledIrPath) {
        return;
      }
      const compiledIrDirectoryPath = join(workspaceRoot, 'context', 'compiled-ir');
      const compiledIrEntries = await readdir(compiledIrDirectoryPath);
      const firstPersistedDefinition = JSON.parse(await readFile(definitionPath, 'utf8')) as {
        definition: {
          executionId: string;
        };
      };
      const secondPersistedDefinition = JSON.parse(await readFile(definitionPath, 'utf8')) as {
        definition: {
          executionId: string;
        };
      };

      expect(editDraft.applied).toBe(true);
      expect(secondCommit.compiledIrPath).toBe(compiledIrPath);
      expect(secondPersistedDefinition.definition.executionId).toBe(
        firstPersistedDefinition.definition.executionId,
      );
      expect(compiledIrEntries.sort()).toEqual([
        `${firstPersistedDefinition.definition.executionId}.json`,
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('rolls back canonical workflow artifacts when commit fails after definition persistence starts', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'local-orchestration-workflow-draft-'));
    const workspaceRoot = join(temporaryRoot, '.repo-ai-governor');
    const runtime = new LocalOrchestrationServiceWorkflowDraftRuntime({
      workspaceRoot,
      nowProvider: () => new Date('2026-04-22T00:00:00.000Z'),
    });

    try {
      const startedDraft = await runtime.startWorkflowDraft({
        entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
        templateId: 'parallel-review',
      });
      const draftSessionPath = join(
        workspaceRoot,
        'context',
        'workflow',
        'draft-sessions',
        'direct-workbench.active.json',
      );
      const definitionPath = join(
        workspaceRoot,
        'context',
        'workflow',
        'active-workflow.definition.json',
      );
      const compiledIrPath = join(
        workspaceRoot,
        'context',
        'compiled-ir',
        `${startedDraft.draftSession.workflowDraftId}.json`,
      );
      const persistedDraftBeforeCommit = await readFile(draftSessionPath, 'utf8');
      const runtimeInternals = runtime as unknown as {
        writePersistedDraftSession: (payload: unknown) => Promise<void>;
      };
      const draftSessionWriteSpy = vi
        .spyOn(runtimeInternals, 'writePersistedDraftSession')
        .mockRejectedValueOnce(
          new RuntimeError(
            GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
            'draft-session write failed',
            {
              artifactPath: draftSessionPath,
            },
          ),
        );

      await expect(
        runtime.commitWorkflowDraft({
          workflowDraftId: startedDraft.draftSession.workflowDraftId,
          draftRevision: startedDraft.draftSession.draftRevision,
        }),
      ).rejects.toMatchObject({
        code: GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
        message: 'draft-session write failed',
      });

      expect(existsSync(definitionPath)).toBe(false);
      expect(existsSync(compiledIrPath)).toBe(false);
      await expect(readFile(draftSessionPath, 'utf8')).resolves.toBe(persistedDraftBeforeCommit);

      draftSessionWriteSpy.mockRestore();
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
