import { MemoryManager } from "@repo-ai-governor/core-memory";
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from "@repo-ai-governor/memory-store-adapter";
import { GovernorErrorCode } from "@repo-ai-governor/shared";
import {
  type AuditEventRecord,
  AuditRecordStatus,
  AuditRecorder,
  DependencyResolutionStatus,
} from "../src/index.js";

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
      const namespacePrefix = `${request.namespace}:`;
      const prefix = request.keyPrefix ? `${namespacePrefix}${request.keyPrefix}` : namespacePrefix;

      return Array.from(records.entries())
        .filter(([compoundKey, storedRecord]) => {
          if (!compoundKey.startsWith(prefix)) {
            return false;
          }

          if (!request.tag) {
            return true;
          }

          return storedRecord.tags.includes(request.tag);
        })
        .slice(0, request.limit ?? Number.POSITIVE_INFINITY)
        .map(([compoundKey, record]) => {
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
        snapshotId: "snapshot-audit-unit",
        createdAt: "2026-03-21T00:00:00Z",
        recordCount: records.size,
        snapshotPath: "/tmp/snapshot-audit-unit.json",
      };
    },
    async archive() {
      return 0;
    },
  };
}

function createAuditEventRecord(overrides: Partial<AuditEventRecord> = {}): AuditEventRecord {
  return {
    executionId: "exec-audit-001",
    stageId: "stage-audit-001",
    routeKey: "route.core.runtime",
    surface: "codex",
    agentRole: "governance_reviewer",
    roleProfileId: "role.default.governance-reviewer",
    roleSource: "default",
    policyOutcome: "allow",
    status: AuditRecordStatus.SUCCEEDED,
    startedAt: "2026-03-21T10:00:00Z",
    endedAt: "2026-03-21T10:00:05Z",
    startedAtDisplay: "2026-03-21 18:00:00 UTC+08:00",
    endedAtDisplay: "2026-03-21 18:00:05 UTC+08:00",
    executionSessionId: "session-audit-001",
    memoryScope: "execution",
    memoryDelta: {
      writes: 1,
    },
    workspaceId: "workspace-audit-001",
    workspaceMode: "tool_managed",
    workspaceRoot: "/tmp/repo-audit",
    ...overrides,
  };
}

describe("audit-recorder unit", () => {
  it("records and lists audit events by execution and stage", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await recorder.recordEvent({
      event: createAuditEventRecord(),
      recordId: "audit-record-001",
      recordedAt: "2026-03-21T10:00:05Z",
    });
    await recorder.recordEvent({
      event: createAuditEventRecord({
        stageId: "stage-audit-002",
      }),
      recordId: "audit-record-002",
      recordedAt: "2026-03-21T10:00:06Z",
    });

    const executionRecords = await recorder.listEvents({
      executionId: "exec-audit-001",
    });
    const stageRecords = await recorder.listEvents({
      executionId: "exec-audit-001",
      stageId: "stage-audit-002",
    });

    expect(executionRecords).toHaveLength(2);
    expect(executionRecords[0]?.recordId).toBe("audit-record-001");
    expect(executionRecords[1]?.recordId).toBe("audit-record-002");
    expect(stageRecords).toHaveLength(1);
    expect(stageRecords[0]?.event.stageId).toBe("stage-audit-002");
  });

  it("rejects event payload when RFC3339 seconds timestamp is invalid", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await expect(
      recorder.recordEvent({
        event: createAuditEventRecord({
          startedAt: "2026-03-21T10:00:00.000Z",
        }),
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.AUDIT_RECORD_INVALID,
    });
  });

  it("orders same-second events by recordId for deterministic list output", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await recorder.recordEvent({
      event: createAuditEventRecord({
        dependencyResolutionStatus: DependencyResolutionStatus.ESCALATED,
      }),
      recordId: "audit-record-b",
      recordedAt: "2026-03-21T10:00:05Z",
    });
    await recorder.recordEvent({
      event: createAuditEventRecord({
        dependencyResolutionStatus: DependencyResolutionStatus.BLOCKED,
      }),
      recordId: "audit-record-a",
      recordedAt: "2026-03-21T10:00:05Z",
    });

    const records = await recorder.listEvents({
      executionId: "exec-audit-001",
    });

    expect(records.map((record) => record.recordId)).toEqual(["audit-record-a", "audit-record-b"]);
  });

  it("rejects unsupported dependency resolution statuses", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await expect(
      recorder.recordEvent({
        event: createAuditEventRecord({
          dependencyResolutionStatus: "missing" as AuditEventRecord["dependencyResolutionStatus"],
        }),
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.AUDIT_RECORD_INVALID,
    });
  });
});
