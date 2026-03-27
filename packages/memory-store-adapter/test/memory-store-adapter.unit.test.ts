import { GovernorErrorCode, type RuntimeError } from '@repo-ai-governor/shared';
import { type MemoryRecord, MemoryStoreAdapter, type MemoryStoreProvider } from '../src/index.js';

function createStoreProvider(record: MemoryRecord): MemoryStoreProvider {
  return {
    async read() {
      return record;
    },
    async write() {},
    async query() {
      return [record];
    },
    async snapshot() {
      return {
        snapshotId: 'snapshot-adapter-unit',
        createdAt: '2026-03-21T00:00:00Z',
        recordCount: 1,
        snapshotPath: '/tmp/snapshot-adapter-unit.json',
      };
    },
    async archive() {
      return 0;
    },
  };
}

describe('memory-store-adapter unit', () => {
  it('normalizes write payload with default tags and timestamp', async () => {
    const adapter = new MemoryStoreAdapter(
      createStoreProvider({
        namespace: 'normative',
        key: 'prd',
        value: { version: 'v1' },
        tags: [],
        updatedAt: '2026-03-21T00:00:00Z',
      }),
    );
    const writtenRecord = await adapter.write({
      namespace: 'execution',
      key: 'task',
      value: { status: 'in_progress' },
    });

    expect(writtenRecord.tags).toEqual([]);
    expect(writtenRecord.updatedAt).toMatch(/T/u);
  });

  it('wraps provider read failures with standardized runtime error', async () => {
    const adapter = new MemoryStoreAdapter({
      async read() {
        throw { message: 'provider down' };
      },
      async write() {},
      async query() {
        return [];
      },
      async snapshot() {
        return {
          snapshotId: 'snapshot-adapter-error',
          createdAt: '2026-03-21T00:00:00Z',
          recordCount: 0,
          snapshotPath: '/tmp/snapshot-adapter-error.json',
        };
      },
      async archive() {
        return 0;
      },
    });

    await expect(
      adapter.read({
        namespace: 'execution',
        key: 'task',
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.MEMORY_STORE_READ_FAILED,
    } satisfies Partial<RuntimeError>);
  });
});
