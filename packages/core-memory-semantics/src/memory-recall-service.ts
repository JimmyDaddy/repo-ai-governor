import type {
  MemoryLayeredSnapshot,
  MemoryLayeredSnapshotRequest,
  MemoryManager,
} from "@repo-ai-governor/core-memory";
import { MemoryScope } from "@repo-ai-governor/core-memory";
import type { MemoryRecord } from "@repo-ai-governor/memory-store-adapter";
import { MemoryRecallKind, MemoryRecallLayer } from "./constants/index.js";
import type {
  MemoryRecallRequest,
  MemoryRecallResult,
  MemoryRecalledRecord,
  MemorySourceRef,
} from "./types/index.js";

/**
 * Resolves one explicit recall phase on top of the stable core-memory substrate.
 *
 * Why this exists:
 * runtime modules should consume one semantic recall contract instead of directly
 * interpreting layered snapshots inside orchestration or CLI owners.
 */
export class MemoryRecallService {
  public constructor(private readonly memoryManager: MemoryManager) {}

  /**
   * Executes one metadata-first recall request.
   * @param request Semantic recall request.
   * @returns Normalized recall result.
   */
  public async recall(request: MemoryRecallRequest): Promise<MemoryRecallResult> {
    const selector = this.createLayeredSnapshotSelector(request);
    const layeredSnapshot = await this.memoryManager.loadLayeredSnapshot(selector);
    const selectedRecords = this.collectSelectedRecords(layeredSnapshot, request);

    return {
      queryIntent: request.queryIntent,
      workspaceId: request.workspaceId,
      executionId: request.executionId,
      sessionId: request.sessionId ?? null,
      requestedLayers: [...request.requestedLayers],
      requestedMemoryKinds: [...request.requestedMemoryKinds],
      metadataFilters: {
        ...request.metadataFilters,
        normativeKeyPrefixes: [...request.metadataFilters.normativeKeyPrefixes],
        normativeTags: [...request.metadataFilters.normativeTags],
        artifactIds: [...request.metadataFilters.artifactIds],
      },
      recallOrder: [...request.recallOrder],
      selectionPolicy: request.selectionPolicy,
      selector,
      layeredSnapshot,
      selectedRecords,
      resultSummary: {
        matchedRecordCount:
          layeredSnapshot.normativeEntries.length +
          layeredSnapshot.executionEntries.length +
          layeredSnapshot.sessionEntries.length,
        selectedRecordCount: selectedRecords.length,
        normativeEntryCount: layeredSnapshot.normativeEntries.length,
        executionEntryCount: layeredSnapshot.executionEntries.length,
        sessionEntryCount: layeredSnapshot.sessionEntries.length,
        requestedLayerCount: request.requestedLayers.length,
      },
    };
  }

  /**
   * Converts one semantic recall request into one substrate layered-snapshot selector.
   * @param request Semantic recall request.
   * @returns Layered snapshot selector.
   */
  private createLayeredSnapshotSelector(
    request: MemoryRecallRequest,
  ): MemoryLayeredSnapshotRequest {
    return {
      includeNormativeBaseline: request.metadataFilters.includeNormativeBaseline !== false,
      normativeKeyPrefixes: request.metadataFilters.normativeKeyPrefixes,
      normativeTags: request.metadataFilters.normativeTags,
      executionId: request.executionId,
      projectId: request.metadataFilters.projectId,
      sprintId: request.metadataFilters.sprintId,
      taskId: request.metadataFilters.taskId,
      artifactIds: request.metadataFilters.artifactIds,
      sessionId: request.sessionId,
      limitPerQuery: request.metadataFilters.limitPerQuery,
    };
  }

  /**
   * Collects normalized recalled records from the substrate snapshot.
   * @param layeredSnapshot Raw layered snapshot.
   * @param request Semantic recall request.
   * @returns Ordered recalled records.
   */
  private collectSelectedRecords(
    layeredSnapshot: MemoryLayeredSnapshot,
    request: MemoryRecallRequest,
  ): MemoryRecalledRecord[] {
    const selectedRecords: MemoryRecalledRecord[] = [];

    if (
      request.requestedLayers.includes(MemoryRecallLayer.EXECUTION) &&
      request.requestedMemoryKinds.includes(MemoryRecallKind.EXECUTION_SHORT_TERM_FACT)
    ) {
      selectedRecords.push(
        ...layeredSnapshot.executionEntries.map((record) =>
          this.normalizeRecord(
            record,
            MemoryRecallLayer.EXECUTION,
            MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
          ),
        ),
      );
    }

    if (
      request.requestedLayers.includes(MemoryRecallLayer.SESSION) &&
      request.requestedMemoryKinds.includes(MemoryRecallKind.SESSION)
    ) {
      selectedRecords.push(
        ...layeredSnapshot.sessionEntries.map((record) =>
          this.normalizeRecord(record, MemoryRecallLayer.SESSION, MemoryRecallKind.SESSION),
        ),
      );
    }

    if (
      request.requestedLayers.includes(MemoryRecallLayer.NORMATIVE) &&
      request.requestedMemoryKinds.includes(MemoryRecallKind.NORMATIVE_PROJECTION)
    ) {
      selectedRecords.push(
        ...layeredSnapshot.normativeEntries.map((record) =>
          this.normalizeRecord(
            record,
            MemoryRecallLayer.NORMATIVE,
            MemoryRecallKind.NORMATIVE_PROJECTION,
          ),
        ),
      );
    }

    const recallOrderRanks = new Map(
      request.recallOrder.map((memoryKind, index) => [memoryKind, index] as const),
    );

    return selectedRecords.sort((left, right) => {
      const leftRank = recallOrderRanks.get(left.memoryKind) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = recallOrderRanks.get(right.memoryKind) ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      const updatedAtComparison = right.updatedAt.localeCompare(left.updatedAt);
      if (updatedAtComparison !== 0) {
        return updatedAtComparison;
      }

      return left.recordId.localeCompare(right.recordId);
    });
  }

  /**
   * Normalizes one substrate record into the semantic recall shape.
   * @param record Raw substrate record.
   * @param layer Semantic layer.
   * @param memoryKind Semantic memory kind.
   * @returns Normalized recalled record.
   */
  private normalizeRecord(
    record: MemoryRecord,
    layer: MemoryRecalledRecord["layer"],
    memoryKind: MemoryRecalledRecord["memoryKind"],
  ): MemoryRecalledRecord {
    return {
      recordId: `${record.namespace}:${record.key}`,
      namespace: record.namespace,
      key: record.key,
      layer,
      memoryKind,
      payload: record.value,
      tags: [...record.tags],
      updatedAt: record.updatedAt,
      sourceRefs: this.extractSourceRefs(record),
      sensitivity: this.extractSensitivity(record),
      visibility: this.extractVisibility(record),
    };
  }

  /**
   * Extracts machine-readable provenance refs from one memory record.
   * @param record Raw substrate record.
   * @returns Deduplicated source refs including record identity fallback.
   */
  private extractSourceRefs(record: MemoryRecord): MemorySourceRef[] {
    const sourceRefsByKey = new Map<string, MemorySourceRef>();
    const addSourceRef = (
      referenceType: MemorySourceRef["referenceType"],
      referenceValue: unknown,
    ) => {
      if (typeof referenceValue !== "string") {
        return;
      }

      const normalizedValue = referenceValue.trim();
      if (normalizedValue.length === 0) {
        return;
      }

      sourceRefsByKey.set(`${referenceType}:${normalizedValue}`, {
        reference: normalizedValue,
        referenceType,
      });
    };

    const sourceRefsValue = record.value.sourceRefs;
    if (Array.isArray(sourceRefsValue)) {
      for (const sourceRef of sourceRefsValue) {
        addSourceRef("source_ref", sourceRef);
      }
    }

    addSourceRef("source_ref", record.value.sourceRef);
    addSourceRef("path", record.value.referencePath);
    addSourceRef("path", record.value.taskCardPath);
    addSourceRef("path", record.value.artifactPath);
    addSourceRef("artifact", record.value.artifactId);
    addSourceRef("record", `${record.namespace}:${record.key}`);

    return Array.from(sourceRefsByKey.values());
  }

  /**
   * Extracts sensitivity labels from payload or tags.
   * @param record Raw substrate record.
   * @returns Deduplicated sensitivity labels.
   */
  private extractSensitivity(record: MemoryRecord): string[] {
    const sensitivities = new Set<string>();
    const sensitivityValue = record.value.sensitivity;

    if (typeof sensitivityValue === "string" && sensitivityValue.trim().length > 0) {
      sensitivities.add(sensitivityValue.trim());
    }

    if (Array.isArray(sensitivityValue)) {
      for (const entry of sensitivityValue) {
        if (typeof entry === "string" && entry.trim().length > 0) {
          sensitivities.add(entry.trim());
        }
      }
    }

    for (const tag of record.tags) {
      if (!tag.startsWith("sensitivity:")) {
        continue;
      }

      const sensitivityLabel = tag.slice("sensitivity:".length).trim();
      if (sensitivityLabel.length > 0) {
        sensitivities.add(sensitivityLabel);
      }
    }

    return Array.from(sensitivities.values()).sort((left, right) => left.localeCompare(right));
  }

  /**
   * Extracts visibility labels from payload or tags.
   * @param record Raw substrate record.
   * @returns Deduplicated visibility labels.
   */
  private extractVisibility(record: MemoryRecord): string[] {
    const visibilities = new Set<string>();
    const visibilityValue = record.value.visibility;

    if (typeof visibilityValue === "string" && visibilityValue.trim().length > 0) {
      visibilities.add(visibilityValue.trim());
    }

    if (Array.isArray(visibilityValue)) {
      for (const entry of visibilityValue) {
        if (typeof entry === "string" && entry.trim().length > 0) {
          visibilities.add(entry.trim());
        }
      }
    }

    for (const tag of record.tags) {
      if (!tag.startsWith("visibility:")) {
        continue;
      }

      const visibilityLabel = tag.slice("visibility:".length).trim();
      if (visibilityLabel.length > 0) {
        visibilities.add(visibilityLabel);
      }
    }

    return Array.from(visibilities.values()).sort((left, right) => left.localeCompare(right));
  }
}
