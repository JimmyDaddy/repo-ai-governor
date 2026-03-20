import { MemoryManager } from "../../core-memory/src/index.js";
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from "../../memory-store-adapter/src/index.js";
import { SessionStatus, SharedSessionManager } from "../src/index.js";

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
    async query() {
      return Array.from(records.entries()).map(([compoundKey, record]) => {
        const delimiterIndex = compoundKey.indexOf(":");
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
        snapshotId: "snapshot-session-unit",
        createdAt: "2026-03-21T00:00:00Z",
        recordCount: records.size,
        snapshotPath: "/tmp/snapshot-session-unit.json",
      };
    },
    async archive() {
      return 0;
    },
  };
}

describe("core-session unit", () => {
  it("opens session, appends event, and finalizes lifecycle", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const sessionManager = new SharedSessionManager(memoryManager);

    const openedSession = await sessionManager.openSession({
      sessionId: "session-unit-001",
      executionId: "exec-unit-001",
    });
    const sessionWithEvent = await sessionManager.appendEvent({
      sessionId: openedSession.sessionId,
      type: "runtime.node.completed",
      payload: { nodeId: "node-entry" },
    });
    const finalizedSession = await sessionManager.finalizeSession({
      sessionId: openedSession.sessionId,
      status: SessionStatus.COMPLETED,
    });

    expect(openedSession.status).toBe(SessionStatus.ACTIVE);
    expect(sessionWithEvent.events).toHaveLength(1);
    expect(finalizedSession.status).toBe(SessionStatus.COMPLETED);
  });
});
