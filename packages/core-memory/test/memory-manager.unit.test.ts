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
      const matchedRecords = Array.from(records.entries())
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

          if (request.keyPrefix && !record.key.startsWith(request.keyPrefix)) {
            return false;
          }

          if (request.tag && !record.tags.includes(request.tag)) {
            return false;
          }

          return true;
        });

      if (typeof request.limit === "number") {
        return matchedRecords.slice(0, request.limit);
      }

      return matchedRecords;
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

  it("supports selective layered snapshot queries by execution task and artifact selectors", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));

    await memoryManager.writeEntry({
      scope: MemoryScope.NORMATIVE,
      key: "baseline/prd",
      payload: { version: "brief-v1" },
      tags: ["normative"],
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: "exec-001:stage-prepare:record-1",
      payload: { executionId: "exec-001" },
      tags: ["audit-record", "execution:exec-001", "project:project-010", "task:TK-099"],
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: "historic:stage-report:record-1",
      payload: { artifactId: "DA-121" },
      tags: ["audit-record", "project:project-010", "artifact:DA-121", "task:TK-099"],
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: "historic:stage-report:record-2",
      payload: { artifactId: "DA-404" },
      tags: ["audit-record", "project:project-999", "artifact:DA-404", "task:TK-404"],
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: "session-001",
      payload: { executionId: "exec-001", status: "active" },
      tags: ["session", "execution:exec-001", "status:active"],
    });

    const layeredSnapshot = await memoryManager.loadLayeredSnapshot({
      executionId: "exec-001",
      projectId: "project-010",
      taskId: "TK-099",
      artifactIds: ["DA-121"],
      limitPerQuery: 10,
    });

    expect(layeredSnapshot.normativeEntries).toHaveLength(1);
    expect(layeredSnapshot.executionEntries).toHaveLength(2);
    expect(layeredSnapshot.executionEntries.map((entry) => entry.key)).toEqual(
      expect.arrayContaining(["exec-001:stage-prepare:record-1", "historic:stage-report:record-1"]),
    );
    expect(layeredSnapshot.executionEntries.map((entry) => entry.key)).not.toContain(
      "historic:stage-report:record-2",
    );
    expect(layeredSnapshot.sessionEntries).toHaveLength(1);
    expect(layeredSnapshot.sessionEntries[0]?.key).toBe("session-001");
  });
});
