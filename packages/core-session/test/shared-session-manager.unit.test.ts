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
  seedRecord(record: {
    namespace: string;
    key: string;
    value: Record<string, unknown>;
    tags?: string[];
    updatedAt?: string;
  }): void;
  listRecords(): Array<{
    namespace: string;
    key: string;
    value: Record<string, unknown>;
    tags: string[];
    updatedAt: string;
  }>;
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
    seedRecord(record) {
      records.set(`${record.namespace}:${record.key}`, {
        value: record.value,
        tags: record.tags ?? [],
        updatedAt: record.updatedAt ?? '2026-04-02T00:00:00Z',
      });
    },
    listRecords() {
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
      async query(request) {
        counters.queryCount += 1;
        const filteredRecords = Array.from(records.entries())
          .map(([compoundKey, record]) => {
            const delimiterIndex = compoundKey.indexOf(':');
            return {
              namespace: compoundKey.slice(0, delimiterIndex),
              key: compoundKey.slice(delimiterIndex + 1),
              value: record.value,
              tags: record.tags,
              updatedAt: record.updatedAt,
            };
          })
          .filter((record) => {
            if (request.namespace && record.namespace !== request.namespace) {
              return false;
            }
            if (request.keyPrefix && !record.key.startsWith(request.keyPrefix)) {
              return false;
            }
            if (request.tag && !record.tags.includes(request.tag)) {
              return false;
            }

            return true;
          });

        if (!request.limit || request.limit <= 0) {
          return filteredRecords;
        }

        return filteredRecords.slice(0, request.limit);
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

  it('transitions sessions between active and archived while preserving mutable context patches', async () => {
    const inMemoryStore = createInMemoryStoreProvider();
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(inMemoryStore.provider));
    const sessionManager = new SharedSessionManager(memoryManager);

    await sessionManager.openSession({
      sessionId: 'session-unit-archive',
      executionId: 'exec-unit-archive',
    });

    const archivedSession = await sessionManager.transitionSessionStatus({
      sessionId: 'session-unit-archive',
      status: SessionStatus.ARCHIVED,
      closedAt: '2026-04-04T12:00:00Z',
      contextPatch: {
        archivedAt: '2026-04-04T12:00:00Z',
        archiveReasonSummary: 'close out the old branch',
      },
    });
    const restoredSession = await sessionManager.transitionSessionStatus({
      sessionId: 'session-unit-archive',
      status: SessionStatus.ACTIVE,
      contextKeysToDelete: ['archivedAt', 'archiveReasonSummary'],
    });

    expect(archivedSession.status).toBe(SessionStatus.ARCHIVED);
    expect(archivedSession.context.archivedAt).toBe('2026-04-04T12:00:00Z');
    expect(restoredSession.status).toBe(SessionStatus.ACTIVE);
    expect(restoredSession.closedAt).toBeUndefined();
    expect(restoredSession.context.archivedAt).toBeUndefined();
    expect(restoredSession.context.archiveReasonSummary).toBeUndefined();
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

  it('rebuilds context patches from the latest persisted state so sibling nested updates are preserved', async () => {
    const inMemoryStore = createInMemoryStoreProvider();
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(inMemoryStore.provider));
    const firstManager = new SharedSessionManager(memoryManager);
    const secondManager = new SharedSessionManager(memoryManager);

    const openedSession = await firstManager.openSession({
      sessionId: 'session-unit-context-latest',
      executionId: 'exec-unit-context-latest',
    });
    const staleSession = await firstManager.getSession(openedSession.sessionId);

    expect(staleSession.context.providerContinuations).toBeUndefined();

    await secondManager.updateContext({
      sessionId: openedSession.sessionId,
      contextPatch: {
        providerContinuations: {
          version: 1,
          slots: {
            'lane-a': {
              handle: 'resp-a',
            },
          },
        },
      },
    });

    const updatedSession = await firstManager.updateContextWithLatest({
      sessionId: openedSession.sessionId,
      contextPatchBuilder: (currentContext) => {
        expect(currentContext.providerContinuations).toEqual({
          version: 1,
          slots: {
            'lane-a': {
              handle: 'resp-a',
            },
          },
        });

        const providerContinuations = currentContext.providerContinuations as {
          version: number;
          slots: Record<string, unknown>;
        };
        return {
          providerContinuations: {
            version: providerContinuations.version,
            slots: {
              ...providerContinuations.slots,
              'lane-b': {
                handle: 'resp-b',
              },
            },
          },
        };
      },
    });

    expect(updatedSession.context.providerContinuations).toEqual({
      version: 1,
      slots: {
        'lane-a': {
          handle: 'resp-a',
        },
        'lane-b': {
          handle: 'resp-b',
        },
      },
    });
  });

  it('migrates legacy blob payloads into summary and append-only event records on first read', async () => {
    const inMemoryStore = createInMemoryStoreProvider();
    inMemoryStore.seedRecord({
      namespace: 'session',
      key: 'session-legacy-001',
      tags: ['session', 'status:active', 'execution:exec-legacy-001'],
      value: {
        sessionId: 'session-legacy-001',
        status: SessionStatus.ACTIVE,
        openedAt: '2026-04-02T00:00:00Z',
        executionId: 'exec-legacy-001',
        context: {
          currentRouteId: 'session.main',
        },
        events: [
          {
            eventId: 'legacy-event-001',
            type: 'session.turn.submitted',
            createdAt: '2026-04-02T00:00:01Z',
            payload: {
              turnId: 'turn-001',
              turnIndex: 1,
              content: '你好',
            },
          },
        ],
      },
    });
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(inMemoryStore.provider));
    const sessionManager = new SharedSessionManager(memoryManager);

    const session = await sessionManager.getSession('session-legacy-001');
    const appendedSession = await sessionManager.appendEvent({
      sessionId: 'session-legacy-001',
      type: 'session.turn.completed',
      payload: {
        turnId: 'turn-001',
        turnIndex: 1,
        assistantMessage: '你好，有什么我可以帮你的？',
      },
    });

    expect(session.eventCount).toBe(1);
    expect(session.turnCount).toBe(1);
    expect(session.events[0]?.eventIndex).toBe(1);
    expect(appendedSession.events).toHaveLength(2);
    expect(appendedSession.lastEventId).toBe(appendedSession.events[1]?.eventId);
    expect(inMemoryStore.counters.writeCount).toBeGreaterThanOrEqual(3);
  });

  it('replays missing legacy events when a prior migration attempt only wrote a prefix of the event log', async () => {
    const inMemoryStore = createInMemoryStoreProvider();
    inMemoryStore.seedRecord({
      namespace: 'session',
      key: 'session-legacy-partial-001',
      tags: ['session', 'status:active', 'execution:exec-legacy-partial-001'],
      value: {
        sessionId: 'session-legacy-partial-001',
        status: SessionStatus.ACTIVE,
        openedAt: '2026-04-02T00:00:00Z',
        executionId: 'exec-legacy-partial-001',
        context: {
          currentRouteId: 'session.main',
        },
        events: [
          {
            eventId: 'legacy-partial-event-001',
            type: 'session.turn.submitted',
            createdAt: '2026-04-02T00:00:01Z',
            payload: {
              turnId: 'turn-001',
              turnIndex: 1,
              content: '你好',
            },
          },
          {
            eventId: 'legacy-partial-event-002',
            type: 'session.turn.completed',
            createdAt: '2026-04-02T00:00:02Z',
            payload: {
              turnId: 'turn-001',
              turnIndex: 1,
              assistantMessage: '你好，有什么我可以帮你的？',
            },
          },
        ],
      },
    });
    inMemoryStore.seedRecord({
      namespace: 'session',
      key: 'session-legacy-partial-001:event:000000000001:legacy-partial-event-001',
      tags: ['session-event', 'session:session-legacy-partial-001', 'type:session.turn.submitted'],
      value: {
        schemaVersion: 'shared-session-event.v1',
        sessionId: 'session-legacy-partial-001',
        eventId: 'legacy-partial-event-001',
        eventIndex: 1,
        type: 'session.turn.submitted',
        createdAt: '2026-04-02T00:00:01Z',
        turnIndex: 1,
        payload: {
          turnId: 'turn-001',
          turnIndex: 1,
          content: '你好',
        },
      },
    });
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(inMemoryStore.provider));
    const sessionManager = new SharedSessionManager(memoryManager);

    const migratedSession = await sessionManager.getSession('session-legacy-partial-001');
    const persistedEventRecords = inMemoryStore
      .listRecords()
      .filter(
        (record) =>
          record.namespace === 'session' &&
          record.key.startsWith('session-legacy-partial-001:event:'),
      );

    expect(migratedSession.events).toHaveLength(2);
    expect(migratedSession.eventCount).toBe(2);
    expect(migratedSession.turnCount).toBe(1);
    expect(persistedEventRecords).toHaveLength(2);
  });

  it('serializes concurrent appenders so eventIndex and turnIndex stay unique across managers', async () => {
    const baseStore = createInMemoryStoreProvider();
    let markFirstEventWriteStarted: (() => void) | undefined;
    const firstEventWriteStarted = new Promise<void>((resolve) => {
      markFirstEventWriteStarted = resolve;
    });
    let releaseFirstEventWrite: (() => void) | undefined;
    const firstEventWritePending = new Promise<void>((resolve) => {
      releaseFirstEventWrite = resolve;
    });
    let eventWriteCount = 0;
    const provider: MemoryStoreProvider = {
      ...baseStore.provider,
      async write(record) {
        if (record.namespace === 'session' && record.key.includes(':event:')) {
          eventWriteCount += 1;
          if (eventWriteCount === 1) {
            markFirstEventWriteStarted?.();
            await firstEventWritePending;
          }
        }
        await baseStore.provider.write(record);
      },
    };
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(provider));
    const firstManager = new SharedSessionManager(memoryManager);
    const secondManager = new SharedSessionManager(memoryManager);

    const openedSession = await firstManager.openSession({
      sessionId: 'session-concurrent-append-001',
      executionId: 'exec-concurrent-append-001',
    });

    const firstAppendPromise = firstManager.appendEvent({
      sessionId: openedSession.sessionId,
      type: 'session.turn.submitted',
      payload: {
        turnId: 'turn-001',
      },
    });
    await firstEventWriteStarted;
    const secondAppendPromise = secondManager.appendEvent({
      sessionId: openedSession.sessionId,
      type: 'session.turn.submitted',
      payload: {
        turnId: 'turn-002',
      },
    });

    releaseFirstEventWrite?.();
    await Promise.all([firstAppendPromise, secondAppendPromise]);

    const refreshedSession = await firstManager.getSession(openedSession.sessionId);
    expect(refreshedSession.events.map((event) => event.eventIndex)).toEqual([1, 2]);
    expect(refreshedSession.events.map((event) => event.turnIndex)).toEqual([1, 2]);
    expect(refreshedSession.eventCount).toBe(2);
    expect(refreshedSession.turnCount).toBe(2);
  });
});
