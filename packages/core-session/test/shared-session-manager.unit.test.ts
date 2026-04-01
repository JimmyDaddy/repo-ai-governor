import { MemoryManager } from '@repo-ai-governor/core-memory';
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from '@repo-ai-governor/memory-store-adapter';
import { SessionStatus, SharedSessionManager } from '../src/index.js';

function createInMemoryStoreProvider(): {
  provider: MemoryStoreProvider;
  counters: {
    readCount: number;
    writeCount: number;
    queryCount: number;
  };
} {
  const records = new Map<
    string,
    { value: Record<string, unknown>; tags: string[]; updatedAt: string }
  >();
  const counters = {
    readCount: 0,
    writeCount: 0,
    queryCount: 0,
  };

  return {
    counters,
    provider: {
      async read(namespace, key) {
        counters.readCount += 1;
        const record = records.get(`${namespace}:${key}`);
        if (!record) {
          return undefined;
        }

        return {
          namespace,
          key,
          value: record.value,
          tags: record.tags,
          updatedAt: record.updatedAt,
        };
      },
      async write(record) {
        counters.writeCount += 1;
        records.set(`${record.namespace}:${record.key}`, {
          value: record.value,
          tags: record.tags,
          updatedAt: record.updatedAt,
        });
      },
      async query() {
        counters.queryCount += 1;
        return Array.from(records.entries()).map(([compoundKey, record]) => {
          const delimiterIndex = compoundKey.indexOf(':');
          return {
            namespace: compoundKey.slice(0, delimiterIndex),
            key: compoundKey.slice(delimiterIndex + 1),
            value: record.value,
            tags: record.tags,
            updatedAt: record.updatedAt,
          };
        });
      },
      async snapshot() {
        return {
          snapshotId: 'snapshot-session-unit',
          createdAt: '2026-03-21T00:00:00Z',
          recordCount: records.size,
          snapshotPath: '/tmp/snapshot-session-unit.json',
        };
      },
      async archive() {
        return 0;
      },
    },
  };
}

describe('core-session unit', () => {
  it('opens session, appends event, and finalizes lifecycle', async () => {
    const inMemoryStore = createInMemoryStoreProvider();
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(inMemoryStore.provider));
    const sessionManager = new SharedSessionManager(memoryManager);

    const openedSession = await sessionManager.openSession({
      sessionId: 'session-unit-001',
      executionId: 'exec-unit-001',
    });
    const sessionWithEvent = await sessionManager.appendEvent({
      sessionId: openedSession.sessionId,
      type: 'runtime.node.completed',
      payload: { nodeId: 'node-entry' },
    });
    const finalizedSession = await sessionManager.finalizeSession({
      sessionId: openedSession.sessionId,
      status: SessionStatus.COMPLETED,
    });

    expect(openedSession.status).toBe(SessionStatus.ACTIVE);
    expect(sessionWithEvent.events).toHaveLength(1);
    expect(finalizedSession.status).toBe(SessionStatus.COMPLETED);
  });

  it('reads fresh session state on mutating paths so cross-manager appends do not overwrite events', async () => {
    const inMemoryStore = createInMemoryStoreProvider();
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(inMemoryStore.provider));
    const firstManager = new SharedSessionManager(memoryManager);
    const secondManager = new SharedSessionManager(memoryManager);

    const openedSession = await firstManager.openSession({
      sessionId: 'session-unit-shared',
      executionId: 'exec-unit-shared',
    });
    await firstManager.getSession(openedSession.sessionId);

    await secondManager.appendEvent({
      sessionId: openedSession.sessionId,
      type: 'runtime.node.started',
      payload: { nodeId: 'node-entry' },
    });
    const appendedSession = await firstManager.appendEvent({
      sessionId: openedSession.sessionId,
      type: 'runtime.node.completed',
      payload: { nodeId: 'node-entry' },
    });

    expect(appendedSession.events).toHaveLength(2);
    expect(appendedSession.events.map((event) => event.type)).toEqual([
      'runtime.node.started',
      'runtime.node.completed',
    ]);
  });
});
