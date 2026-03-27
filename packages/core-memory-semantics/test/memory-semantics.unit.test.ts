import { MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
import {
  MEMORY_RECALL_SELECTION_POLICY,
  MemoryContextAssembler,
  MemoryRecallKind,
  MemoryRecallLayer,
  MemoryRecallService,
} from "@repo-ai-governor/core-memory-semantics";
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from "@repo-ai-governor/memory-store-adapter";

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

          if (request.keyPrefix && !record.key.startsWith(request.keyPrefix)) {
            return false;
          }

          if (request.tag && !record.tags.includes(request.tag)) {
            return false;
          }

          return true;
        });
    },
    async snapshot() {
      return {
        snapshotId: "snapshot-memory-semantics-unit",
        createdAt: "2026-03-27T00:00:00Z",
        recordCount: records.size,
        snapshotPath: "/tmp/snapshot-memory-semantics-unit.json",
      };
    },
    async archive() {
      return 0;
    },
  };
}

describe("core-memory-semantics", () => {
  it("recalls metadata-filtered records and assembles truncation-aware context", async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: "exec-001:report-fact",
      payload: {
        summary: "Execution already produced DA-900 for the same task chain.",
        artifactId: "DA-900",
        sourceRefs: [".repo-ai-governor/context/dev/project-010/tasks/DA-900.md"],
      },
      tags: ["project:project-010", "task:TK-900", "artifact:DA-900", "sensitivity:internal"],
      updatedAt: "2026-03-27T00:00:03Z",
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: "session-001",
      payload: {
        summary: "Session asked for explicit verification before closeout.",
        sourceRefs: ["session:review-note"],
      },
      tags: ["execution:exec-001"],
      updatedAt: "2026-03-27T00:00:02Z",
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.NORMATIVE,
      key: "policy/retry-default",
      payload: {
        summary: "Retry policy remains the baseline fallback.",
        referencePath:
          ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md",
      },
      tags: ["policy"],
      updatedAt: "2026-03-27T00:00:01Z",
    });

    const recallService = new MemoryRecallService(memoryManager);
    const recallResult = await recallService.recall({
      queryIntent: "cli_task_driven_execution",
      workspaceId: "/tmp/workspace",
      executionId: "exec-001",
      sessionId: "session-001",
      requestedLayers: [
        MemoryRecallLayer.EXECUTION,
        MemoryRecallLayer.SESSION,
        MemoryRecallLayer.WORKSPACE,
        MemoryRecallLayer.USER,
        MemoryRecallLayer.NORMATIVE,
      ],
      requestedMemoryKinds: [
        MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
        MemoryRecallKind.SESSION,
        MemoryRecallKind.WORKSPACE,
        MemoryRecallKind.USER,
        MemoryRecallKind.NORMATIVE_PROJECTION,
      ],
      metadataFilters: {
        includeNormativeBaseline: true,
        normativeKeyPrefixes: [],
        normativeTags: [],
        projectId: "project-010",
        sprintId: "sprint-001",
        taskId: "TK-900",
        artifactIds: ["DA-900"],
        limitPerQuery: 20,
      },
      recallOrder: [
        MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
        MemoryRecallKind.SESSION,
        MemoryRecallKind.WORKSPACE,
        MemoryRecallKind.USER,
        MemoryRecallKind.NORMATIVE_PROJECTION,
      ],
      selectionPolicy: MEMORY_RECALL_SELECTION_POLICY,
    });

    expect(recallResult.resultSummary).toEqual({
      matchedRecordCount: 3,
      selectedRecordCount: 3,
      normativeEntryCount: 1,
      executionEntryCount: 1,
      sessionEntryCount: 1,
      requestedLayerCount: 5,
    });
    expect(recallResult.selectedRecords.map((record) => record.memoryKind)).toEqual([
      MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
      MemoryRecallKind.SESSION,
      MemoryRecallKind.NORMATIVE_PROJECTION,
    ]);

    const assemblyResult = new MemoryContextAssembler().assemble({
      recallResult,
      maxRecordCount: 2,
    });

    expect(assemblyResult.assemblyOutcome).toBe("truncated");
    expect(assemblyResult.truncationReason).toBe("selected_records_truncated_to_2");
    expect(assemblyResult.selectionSummary.selectedRecordCount).toBe(2);
    expect(assemblyResult.outputContext.recallItems).toEqual([
      expect.objectContaining({
        layer: MemoryRecallLayer.EXECUTION,
        memoryKind: MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
      }),
      expect.objectContaining({
        layer: MemoryRecallLayer.SESSION,
        memoryKind: MemoryRecallKind.SESSION,
      }),
    ]);
    expect(assemblyResult.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reference: ".repo-ai-governor/context/dev/project-010/tasks/DA-900.md",
        }),
        expect.objectContaining({
          reference: "session:review-note",
        }),
      ]),
    );
    expect(assemblyResult.provenanceSummary.canonicalSourceNote).toBe(
      "memory_projection_only_canonical_source_stays_external",
    );
  });
});
