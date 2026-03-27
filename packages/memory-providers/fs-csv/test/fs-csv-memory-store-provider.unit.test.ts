import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FsCsvMemoryStoreProvider } from '../src/index.js';

describe('memory-providers/fs-csv unit', () => {
  it('writes, reads, and snapshots records on local fs-csv store', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'fs-csv-provider-unit-'));
    const provider = new FsCsvMemoryStoreProvider({
      rootDirectory: join(temporaryRoot, 'memory'),
    });

    try {
      await provider.write({
        namespace: 'execution',
        key: 'task:tk-001',
        value: { status: 'in_progress' },
        tags: ['execution'],
        updatedAt: '2026-03-21T00:00:00Z',
      });

      const record = await provider.read('execution', 'task:tk-001');
      const snapshot = await provider.snapshot({
        reason: 'unit-test',
        recordKeys: ['execution:task:tk-001'],
      });

      expect(record?.value.status).toBe('in_progress');
      expect(snapshot.recordCount).toBe(1);
      expect(snapshot.snapshotPath).toContain('snapshots');
    } finally {
      await provider.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
