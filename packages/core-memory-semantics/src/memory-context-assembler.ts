import {
  DEFAULT_MEMORY_CONTEXT_RECORD_LIMIT,
  MEMORY_CANONICAL_SOURCE_NOTE,
  MemoryContextAssemblyOutcome,
} from "./constants/index.js";
import type {
  MemoryContextAssemblyRequest,
  MemoryContextAssemblyResult,
  MemoryContextOutputItem,
  MemoryRecalledRecord,
  MemorySourceRef,
} from "./types/index.js";

/**
 * Assembles prompt-safe and execution-safe memory context from one recall result.
 *
 * Why this exists:
 * recall selection and context injection must stay explicit and traceable rather than
 * leaking raw substrate snapshots into runtime stage inputs.
 */
export class MemoryContextAssembler {
  /**
   * Assembles one normalized context payload from semantic recall results.
   * @param request Context assembly request.
   * @returns Machine-readable context payload.
   */
  public assemble(request: MemoryContextAssemblyRequest): MemoryContextAssemblyResult {
    const maxRecordCount = request.maxRecordCount ?? DEFAULT_MEMORY_CONTEXT_RECORD_LIMIT;
    const selectedRecords = request.recallResult.selectedRecords.slice(0, maxRecordCount);
    const truncationReason =
      request.recallResult.selectedRecords.length > maxRecordCount
        ? `selected_records_truncated_to_${maxRecordCount}`
        : null;
    const sourceRefs = this.collectSourceRefs(selectedRecords);
    const outputContext = {
      recallItems: selectedRecords.map((record) => this.renderOutputItem(record)),
    };
    const safetyNotes = this.collectSafetyNotes(selectedRecords);
    const layerCounts = selectedRecords.reduce<
      MemoryContextAssemblyResult["selectionSummary"]["layerCounts"]
    >((accumulator, record) => {
      accumulator[record.layer] = (accumulator[record.layer] ?? 0) + 1;
      return accumulator;
    }, {});
    const memoryKindCounts = selectedRecords.reduce<
      MemoryContextAssemblyResult["selectionSummary"]["memoryKindCounts"]
    >((accumulator, record) => {
      accumulator[record.memoryKind] = (accumulator[record.memoryKind] ?? 0) + 1;
      return accumulator;
    }, {});
    const recordsMissingExplicitSourceRefs = selectedRecords.filter((record) =>
      record.sourceRefs.every((sourceRef) => sourceRef.referenceType === "record"),
    ).length;

    return {
      executionId: request.recallResult.executionId,
      queryIntent: request.recallResult.queryIntent,
      selectedRecords,
      selectionSummary: {
        selectedRecordCount: selectedRecords.length,
        layerCounts,
        memoryKindCounts,
      },
      outputContext,
      sourceRefs,
      provenanceSummary: {
        sourceRefCount: sourceRefs.length,
        recordsMissingExplicitSourceRefs,
        canonicalSourceNote: MEMORY_CANONICAL_SOURCE_NOTE,
      },
      truncationReason,
      safetyNotes,
      assemblyOutcome:
        selectedRecords.length === 0
          ? MemoryContextAssemblyOutcome.NO_MATCHING_RECORDS
          : truncationReason
            ? MemoryContextAssemblyOutcome.TRUNCATED
            : MemoryContextAssemblyOutcome.CONTEXT_READY,
    };
  }

  /**
   * Collects deduplicated source refs for the final assembled context.
   * @param selectedRecords Selected recalled records.
   * @returns Deduplicated source refs.
   */
  private collectSourceRefs(selectedRecords: MemoryRecalledRecord[]): MemorySourceRef[] {
    const sourceRefsByKey = new Map<string, MemorySourceRef>();

    for (const record of selectedRecords) {
      for (const sourceRef of record.sourceRefs) {
        sourceRefsByKey.set(`${sourceRef.referenceType}:${sourceRef.reference}`, sourceRef);
      }
    }

    return Array.from(sourceRefsByKey.values());
  }

  /**
   * Renders one compact output item for runtime consumption.
   * @param record Selected recalled record.
   * @returns Prompt-safe context item.
   */
  private renderOutputItem(record: MemoryRecalledRecord): MemoryContextOutputItem {
    return {
      recordId: record.recordId,
      layer: record.layer,
      memoryKind: record.memoryKind,
      summary: this.renderRecordSummary(record),
      sourceRefs: record.sourceRefs.map((sourceRef) => sourceRef.reference),
      updatedAt: record.updatedAt,
      sensitivity: [...record.sensitivity],
    };
  }

  /**
   * Creates one compact summary string for runtime context injection.
   * @param record Selected recalled record.
   * @returns Compact summary string.
   */
  private renderRecordSummary(record: MemoryRecalledRecord): string {
    const summaryParts: string[] = [];
    const addSummaryPart = (value: unknown) => {
      if (typeof value !== "string") {
        return;
      }

      const normalizedValue = value.trim();
      if (normalizedValue.length === 0) {
        return;
      }

      summaryParts.push(normalizedValue);
    };

    addSummaryPart(record.payload.summary);
    addSummaryPart(record.payload.title);
    addSummaryPart(record.payload.goal);
    addSummaryPart(record.payload.referenceText);
    addSummaryPart(record.payload.artifactId);

    if (summaryParts.length > 0) {
      return summaryParts.join(" | ").slice(0, 240);
    }

    const fallbackSummary = JSON.stringify(record.payload);
    return fallbackSummary.length > 240 ? `${fallbackSummary.slice(0, 237)}...` : fallbackSummary;
  }

  /**
   * Collects safety notes for assembled memory context.
   * @param selectedRecords Selected recalled records.
   * @returns Deduplicated safety notes.
   */
  private collectSafetyNotes(selectedRecords: MemoryRecalledRecord[]): string[] {
    const safetyNotes = new Set<string>();

    if (
      selectedRecords.some((record) =>
        record.sourceRefs.every((sourceRef) => sourceRef.referenceType === "record"),
      )
    ) {
      safetyNotes.add("some_records_only_have_record_identity_fallback");
    }

    if (selectedRecords.some((record) => record.sensitivity.length === 0)) {
      safetyNotes.add("some_records_missing_sensitivity_labels");
    }

    return Array.from(safetyNotes.values());
  }
}
