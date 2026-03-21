import { MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
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
    async archive(options) {
      let archivedCount = 0;

      for (const [compoundKey, storedRecord] of Array.from(records.entries())) {
        const delimiterIndex = compoundKey.indexOf(":");
        const namespace = compoundKey.slice(0, delimiterIndex);
        const key = compoundKey.slice(delimiterIndex + 1);
        const matchesNamespace = !options?.namespace || namespace === options.namespace;
        const matchesKeys =
          !options?.keys || options.keys.length === 0 || options.keys.includes(key);
        const matchesUpdatedBefore =
          !options?.updatedBefore || storedRecord.updatedAt < options.updatedBefore;

        if (!matchesNamespace || !matchesKeys || !matchesUpdatedBefore) {
          continue;
        }

        records.delete(compoundKey);
        archivedCount += 1;
      }

      return archivedCount;
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
        outputLocale: "en-US",
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
    expect(stageRecords[0]?.event.outputLocale).toBe("en-US");
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

  it("masks sensitive values before persisting audit payloads", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await recorder.recordEvent({
      event: createAuditEventRecord({
        error: "authorization=Bearer secret-token-value",
        memoryDelta: {
          apiKey: "sk-this-should-be-hidden",
          nested: {
            sessionToken: "token-value-001",
          },
        },
      }),
      recordId: "audit-record-mask-001",
      recordedAt: "2026-03-21T10:00:07Z",
    });

    const records = await recorder.listEvents({
      executionId: "exec-audit-001",
    });

    expect(records).toHaveLength(1);
    expect(records[0]?.event.error).toContain("[REDACTED]");
    expect(records[0]?.event.error).not.toContain("secret-token-value");
    expect(records[0]?.event.memoryDelta).toMatchObject({
      apiKey: "[REDACTED]",
      nested: {
        sessionToken: "[REDACTED]",
      },
    });
  });

  it("keeps token usage metrics numeric when masking is enabled", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await recorder.recordEvent({
      event: createAuditEventRecord({
        tokenBudget: 100,
        tokenUsed: 60,
        memoryDelta: {
          sessionToken: "session-value-should-be-masked",
        },
      }),
      recordId: "audit-record-token-metrics-001",
      recordedAt: "2026-03-21T10:00:08Z",
    });

    const records = await recorder.listEvents({
      executionId: "exec-audit-001",
    });

    expect(records).toHaveLength(1);
    expect(records[0]?.event.tokenBudget).toBe(100);
    expect(records[0]?.event.tokenUsed).toBe(60);
    expect(records[0]?.event.memoryDelta).toMatchObject({
      sessionToken: "[REDACTED]",
    });
  });

  it("exports and deletes audit records by execution/project/sprint/date-range filters", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await recorder.recordEvent({
      event: createAuditEventRecord({
        executionId: "exec-export-001",
        projectId: "project-alpha",
        sprintId: "sprint-001",
      }),
      recordId: "audit-record-export-001",
      recordedAt: "2026-03-21T10:00:01Z",
    });
    await recorder.recordEvent({
      event: createAuditEventRecord({
        executionId: "exec-export-002",
        projectId: "project-alpha",
        sprintId: "sprint-002",
      }),
      recordId: "audit-record-export-002",
      recordedAt: "2026-03-21T10:00:02Z",
    });
    await recorder.recordEvent({
      event: createAuditEventRecord({
        executionId: "exec-export-003",
        projectId: "project-beta",
        sprintId: "sprint-001",
      }),
      recordId: "audit-record-export-003",
      recordedAt: "2026-03-21T10:00:03Z",
    });

    const exported = await recorder.exportEvents({
      projectId: "project-alpha",
      fromRecordedAt: "2026-03-21T10:00:01Z",
      toRecordedAt: "2026-03-21T10:00:02Z",
    });
    expect(exported.map((record) => record.recordId)).toEqual([
      "audit-record-export-001",
      "audit-record-export-002",
    ]);

    const deletedCount = await recorder.deleteEvents({
      projectId: "project-alpha",
      sprintId: "sprint-001",
    });
    expect(deletedCount).toBe(1);

    const afterDeleteProjectAlpha = await recorder.exportEvents({
      projectId: "project-alpha",
    });
    expect(afterDeleteProjectAlpha.map((record) => record.recordId)).toEqual([
      "audit-record-export-002",
    ]);
  });

  it("does not let malformed unrelated records block scoped export", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await recorder.recordEvent({
      event: createAuditEventRecord({
        executionId: "good-exec",
      }),
      recordId: "audit-record-good-001",
      recordedAt: "2026-03-21T10:00:01Z",
    });

    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: "bad-exec:stage-bad-001:audit-record-bad-001",
      payload: {
        recordId: "audit-record-bad-001",
        recordedAt: "2026-03-21T10:00:02Z",
        event: "not-an-object" as unknown as Record<string, unknown>,
      },
      tags: ["audit-record", "execution:bad-exec", "stage:stage-bad-001", "status:succeeded"],
    });

    const exported = await recorder.exportEvents({
      executionId: "good-exec",
    });

    expect(exported).toHaveLength(1);
    expect(exported[0]?.recordId).toBe("audit-record-good-001");
  });

  it("applies default 90-day retention policy and archives stale records", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    const recorder = new AuditRecorder(memoryManager);

    await recorder.recordEvent({
      event: createAuditEventRecord({
        executionId: "exec-retention-old",
      }),
      recordId: "audit-record-retention-old",
      recordedAt: "2025-11-30T00:00:00Z",
    });
    await recorder.recordEvent({
      event: createAuditEventRecord({
        executionId: "exec-retention-recent",
      }),
      recordId: "audit-record-retention-recent",
      recordedAt: "2026-03-21T00:00:00Z",
    });

    const retentionResult = await recorder.applyRetentionPolicy({
      now: "2026-03-22T00:00:00Z",
    });
    expect(retentionResult.retentionDays).toBe(90);
    expect(retentionResult.archivedCount).toBe(1);

    const oldExecutionRecords = await recorder.exportEvents({
      executionId: "exec-retention-old",
    });
    const recentExecutionRecords = await recorder.exportEvents({
      executionId: "exec-retention-recent",
    });
    expect(oldExecutionRecords).toHaveLength(0);
    expect(recentExecutionRecords).toHaveLength(1);
  });
});
