import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MemoryManager, MemoryScope } from '@repo-ai-governor/core-memory';
import { SessionStatus, SharedSessionManager } from '@repo-ai-governor/core-session';
import { FsCsvMemoryStoreProvider } from '@repo-ai-governor/memory-provider-fs-csv';
import { MemoryStoreAdapter } from '@repo-ai-governor/memory-store-adapter';
import { GovernorErrorCode, standardizeError } from '@repo-ai-governor/shared';

/**
 * Creates one temporary root directory for memory/session smoke tests.
 * @returns Temporary absolute directory path.
 */
async function createTemporaryRootDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'repo-ai-governor-memory-smoke-'));
}

describe('Memory/Session/Store smoke', () => {
  it('persists memory records through adapter and fs-csv provider', async () => {
    const temporaryRootDirectory = await createTemporaryRootDirectory();
    const provider = new FsCsvMemoryStoreProvider({
      rootDirectory: join(temporaryRootDirectory, '.repo-ai-governor', 'memory'),
    });
    const adapter = new MemoryStoreAdapter(provider);
    const memoryManager = new MemoryManager(adapter);

    try {
      await memoryManager.writeEntry({
        scope: MemoryScope.NORMATIVE,
        key: 'prd:brief',
        payload: { version: 'v1' },
        tags: ['normative', 'prd'],
      });
      await memoryManager.writeEntry({
        scope: MemoryScope.EXECUTION,
        key: 'task:tk-015',
        payload: { status: 'in_progress' },
        tags: ['execution', 'task'],
      });
      await memoryManager.writeEntry({
        scope: MemoryScope.NORMATIVE,
        key: 'shared-key',
        payload: { lane: 'normative' },
        tags: ['normative', 'shared'],
      });
      await memoryManager.writeEntry({
        scope: MemoryScope.EXECUTION,
        key: 'shared-key',
        payload: { lane: 'execution' },
        tags: ['execution', 'shared'],
      });

      const normativeRecord = await memoryManager.readEntry({
        scope: MemoryScope.NORMATIVE,
        key: 'prd:brief',
      });
      expect(normativeRecord?.value.version).toBe('v1');

      const executionRecords = await memoryManager.queryEntries({
        scope: MemoryScope.EXECUTION,
      });
      expect(executionRecords).toHaveLength(2);

      const snapshot = await memoryManager.snapshot({
        reason: 'smoke-test',
        recordKeys: ['normative:shared-key'],
      });
      expect(snapshot.recordCount).toBe(1);
      expect(existsSync(snapshot.snapshotPath)).toBe(true);

      const archivedCount = await memoryManager.archiveEntries({
        keys: ['normative:shared-key'],
        updatedBefore: new Date(Date.now() + 1000).toISOString(),
      });
      expect(archivedCount).toBe(1);

      const normativeSharedRecord = await memoryManager.readEntry({
        scope: MemoryScope.NORMATIVE,
        key: 'shared-key',
      });
      expect(normativeSharedRecord).toBeUndefined();

      const executionSharedRecord = await memoryManager.readEntry({
        scope: MemoryScope.EXECUTION,
        key: 'shared-key',
      });
      expect(executionSharedRecord?.value.lane).toBe('execution');

      const executionRecordsAfterArchive = await memoryManager.queryEntries({
        scope: MemoryScope.EXECUTION,
      });
      expect(executionRecordsAfterArchive).toHaveLength(2);
    } finally {
      await provider.dispose?.();
      await rm(temporaryRootDirectory, { recursive: true, force: true });
    }
  });

  it('manages session lifecycle and blocks writes after session finalization', async () => {
    const temporaryRootDirectory = await createTemporaryRootDirectory();
    const provider = new FsCsvMemoryStoreProvider({
      rootDirectory: join(temporaryRootDirectory, '.repo-ai-governor', 'memory'),
    });
    const adapter = new MemoryStoreAdapter(provider);
    const memoryManager = new MemoryManager(adapter);
    const sharedSessionManager = new SharedSessionManager(memoryManager);

    try {
      const openedSession = await sharedSessionManager.openSession({
        sessionId: 'session-tk-015',
        processId: 'process-015',
        executionId: 'exec-015',
        initialContext: { lane: 'memory' },
      });
      expect(openedSession.status).toBe(SessionStatus.ACTIVE);

      const sessionWithEvent = await sharedSessionManager.appendEvent({
        sessionId: openedSession.sessionId,
        type: 'runtime.node.completed',
        payload: { nodeId: 'node-memory' },
      });
      expect(sessionWithEvent.events).toHaveLength(1);

      const sessionWithContext = await sharedSessionManager.updateContext({
        sessionId: openedSession.sessionId,
        contextPatch: { checkpoint: 'snapshot-created' },
      });
      expect(sessionWithContext.context.checkpoint).toBe('snapshot-created');

      const finalizedSession = await sharedSessionManager.finalizeSession({
        sessionId: openedSession.sessionId,
        status: SessionStatus.COMPLETED,
      });
      expect(finalizedSession.status).toBe(SessionStatus.COMPLETED);
      expect(finalizedSession.closedAt).toBeDefined();

      const listedCompletedSessions = await sharedSessionManager.listSessions({
        status: SessionStatus.COMPLETED,
      });
      expect(listedCompletedSessions).toHaveLength(1);

      await expect(
        sharedSessionManager.appendEvent({
          sessionId: openedSession.sessionId,
          type: 'runtime.node.failed',
        }),
      ).rejects.toSatisfy((error: unknown) => {
        const standardizedError = standardizeError(error);
        return standardizedError.code === GovernorErrorCode.MEMORY_SESSION_ALREADY_CLOSED;
      });
    } finally {
      await provider.dispose?.();
      await rm(temporaryRootDirectory, { recursive: true, force: true });
    }
  });

  it('preserves events when two shared-session managers append to the same fs-csv-backed session', async () => {
    const temporaryRootDirectory = await createTemporaryRootDirectory();
    const provider = new FsCsvMemoryStoreProvider({
      rootDirectory: join(temporaryRootDirectory, '.repo-ai-governor', 'memory'),
    });
    const adapter = new MemoryStoreAdapter(provider);
    const memoryManager = new MemoryManager(adapter);
    const firstSessionManager = new SharedSessionManager(memoryManager);
    const secondSessionManager = new SharedSessionManager(memoryManager);

    try {
      const openedSession = await firstSessionManager.openSession({
        sessionId: 'session-shared-smoke',
        processId: 'process-shared',
        executionId: 'exec-shared',
      });

      await firstSessionManager.getSession(openedSession.sessionId);
      await secondSessionManager.appendEvent({
        sessionId: openedSession.sessionId,
        type: 'runtime.node.started',
        payload: { nodeId: 'node-shared' },
      });
      await firstSessionManager.appendEvent({
        sessionId: openedSession.sessionId,
        type: 'runtime.node.completed',
        payload: { nodeId: 'node-shared' },
      });

      const refreshedSession = await secondSessionManager.getSession(openedSession.sessionId);
      expect(refreshedSession.events.map((event) => event.type)).toEqual([
        'runtime.node.started',
        'runtime.node.completed',
      ]);
    } finally {
      await provider.dispose?.();
      await rm(temporaryRootDirectory, { recursive: true, force: true });
    }
  });
});
