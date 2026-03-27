import {
  DEFAULT_MEMORY_CONTEXT_RECORD_LIMIT,
  MEMORY_CANONICAL_SOURCE_NOTE,
  MEMORY_PROMOTION_FORBIDDEN_SENSITIVITY_LABELS,
  MemoryContextAssemblyOutcome,
} from "./constants/index.js";
import type {
  MemoryContextAssemblyRequest,
  MemoryContextAssemblyResult,
  MemoryContextOutputItem,
  MemoryRecalledRecord,
  MemorySourceRef,
} from "./types/index.js";

const MEMORY_CONTEXT_ALLOWED_RUNTIME_VISIBILITY = ["internal", "public", "runtime"] as const;
const MEMORY_CONTEXT_REDACTED_SUMMARY_BY_REASON = {
  missing_sensitivity_labels: "[redacted: sensitivity_labels_required]",
  sensitivity_policy: "[redacted: sensitivity_policy]",
  visibility_policy: "[redacted: visibility_policy]",
} as const;

type MemoryContextRedactionReason = keyof typeof MEMORY_CONTEXT_REDACTED_SUMMARY_BY_REASON;

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
    const safetyDecisions = selectedRecords.map((record) => this.evaluateRecordSafety(record));
    const truncationReason =
      request.recallResult.selectedRecords.length > maxRecordCount
        ? `selected_records_truncated_to_${maxRecordCount}`
        : null;
    const sourceRefs = this.collectSourceRefs(selectedRecords);
    const outputContext = {
      recallItems: selectedRecords.map((record, index) =>
        this.renderOutputItem(record, safetyDecisions[index]?.redactionReason ?? null),
      ),
    };
    const safetyNotes = this.collectSafetyNotes(selectedRecords, safetyDecisions);
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
    const contractSafeSummaryItems = selectedRecords.map((record, index) => {
      const outputItem = this.renderOutputItem(
        record,
        safetyDecisions[index]?.redactionReason ?? null,
      );
      return {
        recordId: outputItem.recordId,
        layer: outputItem.layer,
        memoryKind: outputItem.memoryKind,
        summary: outputItem.summary,
        sourceRefs: [...outputItem.sourceRefs],
        sourceRefCount: outputItem.sourceRefs.length,
        explicitSourceRefCount: record.sourceRefs.filter(
          (sourceRef) => sourceRef.referenceType !== "record",
        ).length,
        updatedAt: outputItem.updatedAt,
        sensitivity: [...outputItem.sensitivity],
        visibility: [...outputItem.visibility],
      };
    });
    const assemblyOutcome =
      selectedRecords.length === 0
        ? MemoryContextAssemblyOutcome.NO_MATCHING_RECORDS
        : truncationReason
          ? MemoryContextAssemblyOutcome.TRUNCATED
          : MemoryContextAssemblyOutcome.CONTEXT_READY;

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
      contractSafeSummary: {
        executionId: request.recallResult.executionId,
        queryIntent: request.recallResult.queryIntent,
        assemblyOutcome,
        selectedRecordCount: selectedRecords.length,
        layerCounts,
        memoryKindCounts,
        sourceRefCount: sourceRefs.length,
        recordsMissingExplicitSourceRefs,
        canonicalSourceNote: MEMORY_CANONICAL_SOURCE_NOTE,
        truncationReason,
        safetyNotes,
        items: contractSafeSummaryItems,
      },
      sourceRefs,
      provenanceSummary: {
        sourceRefCount: sourceRefs.length,
        recordsMissingExplicitSourceRefs,
        canonicalSourceNote: MEMORY_CANONICAL_SOURCE_NOTE,
      },
      truncationReason,
      safetyNotes,
      assemblyOutcome,
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
  private renderOutputItem(
    record: MemoryRecalledRecord,
    redactionReason: MemoryContextRedactionReason | null,
  ): MemoryContextOutputItem {
    return {
      recordId: record.recordId,
      layer: record.layer,
      memoryKind: record.memoryKind,
      summary: this.renderRecordSummary(record, redactionReason),
      sourceRefs: record.sourceRefs.map((sourceRef) => sourceRef.reference),
      updatedAt: record.updatedAt,
      sensitivity: [...record.sensitivity],
      visibility: [...record.visibility],
    };
  }

  /**
   * Creates one compact summary string for runtime context injection.
   * @param record Selected recalled record.
   * @returns Compact summary string.
   */
  private renderRecordSummary(
    record: MemoryRecalledRecord,
    redactionReason: MemoryContextRedactionReason | null,
  ): string {
    if (redactionReason) {
      return MEMORY_CONTEXT_REDACTED_SUMMARY_BY_REASON[redactionReason];
    }

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
  private collectSafetyNotes(
    selectedRecords: MemoryRecalledRecord[],
    safetyDecisions: Array<{ redactionReason: MemoryContextRedactionReason | null }>,
  ): string[] {
    const safetyNotes = new Set<string>();

    if (
      selectedRecords.some((record) =>
        record.sourceRefs.every((sourceRef) => sourceRef.referenceType === "record"),
      )
    ) {
      safetyNotes.add("some_records_only_have_record_identity_fallback");
    }

    if (
      safetyDecisions.some((decision) => decision.redactionReason === "missing_sensitivity_labels")
    ) {
      safetyNotes.add("some_records_redacted_due_to_missing_sensitivity_labels");
    }

    if (safetyDecisions.some((decision) => decision.redactionReason === "sensitivity_policy")) {
      safetyNotes.add("some_records_redacted_due_to_sensitivity_policy");
    }

    if (safetyDecisions.some((decision) => decision.redactionReason === "visibility_policy")) {
      safetyNotes.add("some_records_redacted_due_to_visibility_policy");
    }

    return Array.from(safetyNotes.values());
  }

  /**
   * Evaluates whether one recalled record must be redacted before entering runtime context.
   * @param record Selected recalled record.
   * @returns One redaction decision.
   */
  private evaluateRecordSafety(record: MemoryRecalledRecord): {
    redactionReason: MemoryContextRedactionReason | null;
  } {
    if (record.sensitivity.length === 0) {
      return {
        redactionReason: "missing_sensitivity_labels",
      };
    }

    if (
      record.sensitivity.some((label) =>
        MEMORY_PROMOTION_FORBIDDEN_SENSITIVITY_LABELS.includes(
          label.toLowerCase() as (typeof MEMORY_PROMOTION_FORBIDDEN_SENSITIVITY_LABELS)[number],
        ),
      )
    ) {
      return {
        redactionReason: "sensitivity_policy",
      };
    }

    if (
      record.visibility.length > 0 &&
      !record.visibility.some((label) =>
        MEMORY_CONTEXT_ALLOWED_RUNTIME_VISIBILITY.includes(
          label.toLowerCase() as (typeof MEMORY_CONTEXT_ALLOWED_RUNTIME_VISIBILITY)[number],
        ),
      )
    ) {
      return {
        redactionReason: "visibility_policy",
      };
    }

    return {
      redactionReason: null,
    };
  }
}
