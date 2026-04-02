import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MemoryManager, MemoryScope } from '@repo-ai-governor/core-memory';
import { SessionStatus, SharedSessionManager } from '@repo-ai-governor/core-session';
import { SqliteFsMemoryStoreProvider } from '@repo-ai-governor/memory-provider-sqlite-fs';
import { MemoryStoreAdapter } from '@repo-ai-governor/memory-store-adapter';
import { GovernorErrorCode, standardizeError } from '@repo-ai-governor/shared';

/**
 * Creates one temporary root directory for sqlite+fs smoke tests.
 * @returns Temporary absolute directory path.
 */
async function createTemporaryRootDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'repo-ai-governor-memory-sqlite-smoke-'));
}

describe('Sqlite+fs memory provider smoke', () => {
  it('persists memory records through sqlite+fs provider and adapter', async () => {
    const temporaryRootDirectory = await createTemporaryRootDirectory();
    const provider = new SqliteFsMemoryStoreProvider({
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
        key: 'task:tk-022',
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

      const scopedExecutionRecords = await memoryManager.queryEntries({
        scope: MemoryScope.EXECUTION,
        keyPrefix: 'task:',
        tag: 'task',
      });
      expect(scopedExecutionRecords).toHaveLength(1);
      expect(scopedExecutionRecords[0]?.key).toBe('task:tk-022');

      const snapshot = await memoryManager.snapshot({
        reason: 'sqlite-smoke-test',
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

  it('keeps session lifecycle semantics on sqlite+fs store', async () => {
    const temporaryRootDirectory = await createTemporaryRootDirectory();
    const provider = new SqliteFsMemoryStoreProvider({
      rootDirectory: join(temporaryRootDirectory, '.repo-ai-governor', 'memory'),
    });
    const adapter = new MemoryStoreAdapter(provider);
    const memoryManager = new MemoryManager(adapter);
    const sharedSessionManager = new SharedSessionManager(memoryManager);

    try {
      const openedSession = await sharedSessionManager.openSession({
        sessionId: 'session-tk-022',
        processId: 'process-022',
        executionId: 'exec-022',
        initialContext: { lane: 'sqlite-fs-memory' },
      });
      expect(openedSession.status).toBe(SessionStatus.ACTIVE);

      const sessionWithEvent = await sharedSessionManager.appendEvent({
        sessionId: openedSession.sessionId,
        type: 'runtime.node.completed',
        payload: { nodeId: 'node-sqlite-fs' },
      });
      expect(sessionWithEvent.events).toHaveLength(1);

      const finalizedSession = await sharedSessionManager.finalizeSession({
        sessionId: openedSession.sessionId,
        status: SessionStatus.COMPLETED,
      });
      expect(finalizedSession.status).toBe(SessionStatus.COMPLETED);

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
});
