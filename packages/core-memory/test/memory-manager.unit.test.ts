import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from "@repo-ai-governor/memory-store-adapter";
import { MemoryManager, MemoryScope } from "../src/index.js";

function createInMemoryStoreProvider(): MemoryStoreProvider {
  const records = new Map<
    string,
    { value: Record<string, unknown>; tags: string[]; updatedAt: string }
  >();

  return {
    async read(namespace, key) {
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
      records.set(`${record.namespace}:${record.key}`, {
        value: record.value,
        tags: record.tags,
        updatedAt: record.updatedAt,
      });
    },
    async query(request) {
      return Array.from(records.entries())
        .map(([compoundKey, record]) => {
          const delimiterIndex = compoundKey.indexOf(":");
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

          return true;
        });
    },
    async snapshot() {
      return {
        snapshotId: "snapshot-memory-unit",
        createdAt: "2026-03-21T00:00:00Z",
        recordCount: records.size,
        snapshotPath: "/tmp/snapshot-memory-unit.json",
      };
    },
    async archive() {
      return 0;
    },
  };
}

describe("core-memory unit", () => {
  it("reads and groups scoped records through adapter boundary", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));

    await memoryManager.writeEntry({
      scope: MemoryScope.NORMATIVE,
      key: "prd",
      payload: { version: "v1" },
      tags: ["normative"],
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: "task",
      payload: { status: "in_progress" },
      tags: ["execution"],
    });

    const layeredSnapshot = await memoryManager.loadLayeredSnapshot();
    expect(layeredSnapshot.normativeEntries).toHaveLength(1);
    expect(layeredSnapshot.executionEntries).toHaveLength(1);
    expect(layeredSnapshot.sessionEntries).toHaveLength(0);
  });
});
