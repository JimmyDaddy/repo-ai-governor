import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SqliteFsMemoryStoreProvider } from '../src/index.js';

describe('memory-providers/sqlite-fs unit', () => {
  it('writes, queries, and archives records through sqlite+fs backend', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'sqlite-fs-provider-unit-'));
    const provider = new SqliteFsMemoryStoreProvider({
      rootDirectory: join(temporaryRoot, 'memory'),
    });

    try {
      await provider.write({
        namespace: 'execution',
        key: 'task-001',
        value: { status: 'in_progress' },
        tags: ['execution'],
        updatedAt: '2026-03-21T00:00:00Z',
      });

      const queriedRecords = await provider.query({
        namespace: 'execution',
      });
      const archivedCount = await provider.archive({
        namespace: 'execution',
        keys: ['execution:task-001'],
        updatedBefore: '2026-03-22T00:00:00Z',
      });

      expect(queriedRecords).toHaveLength(1);
      expect(archivedCount).toBe(1);
    } finally {
      await provider.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
