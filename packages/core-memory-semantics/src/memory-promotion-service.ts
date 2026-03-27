import { type MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
import {
  MEMORY_PROMOTION_FORBIDDEN_SENSITIVITY_LABELS,
  MemoryContextAssemblyOutcome,
  MemoryPromotionCandidateAction,
  MemoryPromotionOutcome,
  MemoryPromotionPhase,
  MemoryRecallKind,
  MemoryRecallLayer,
} from "./constants/index.js";
import type {
  MemoryContextContractSafeSummaryItem,
  MemoryPromotionCandidateDecision,
  MemoryPromotionPhaseResult,
  MemoryPromotionRequest,
  MemoryPromotionResult,
} from "./types/index.js";

interface SessionPromotionProjectionItem {
  sourceRecordId: string;
  sourceLayer: string;
  memoryKind: string;
  summary: string;
  sourceRefs: string[];
  updatedAt: string;
  sensitivity: string[];
  promotedAt: string;
}

/**
 * Builds and optionally persists one explicit promotion pipeline on top of contract-safe context.
 *
 * Why this exists:
 * promotion must stay explicit, auditable, and bounded rather than silently writing raw working
 * state back into long-term memory.
 */
export class MemoryPromotionService {
  public constructor(private readonly memoryManager: MemoryManager) {}

  /**
   * Plans and optionally persists one promotion pipeline from contract-safe context.
   * @param request Promotion request.
   * @returns Machine-readable promotion result.
   */
  public async promote(request: MemoryPromotionRequest): Promise<MemoryPromotionResult> {
    const candidates = this.captureCandidates(request.contextSummary.items);
    const candidateDecisions = candidates.map((candidate) =>
      this.decideCandidate(candidate, request.sessionId ?? null),
    );
    const mergeCandidates = candidateDecisions.filter(
      (candidate) => candidate.action === MemoryPromotionCandidateAction.MERGE,
    );
    const promotionBlockReason = this.getPromotionBlockReason(request.contextSummary);
    const persistRequested = request.persist !== false;
    const persistAllowed = persistRequested && promotionBlockReason === null;
    const persistedRecord =
      mergeCandidates.length > 0 && persistAllowed && request.sessionId
        ? await this.persistSessionSummary(
            request.sessionId,
            request.contextSummary.executionId,
            request.promotedBy ?? "memory_promotion_service",
            candidates.filter((candidate) =>
              mergeCandidates.some(
                (decision) => decision.sourceRecordId === candidate.sourceRecordId,
              ),
            ),
          )
        : null;
    const mergedCount = persistedRecord ? mergeCandidates.length : 0;
    const phaseResults = this.createPhaseResults(candidateDecisions, {
      plannedMergeCount: mergeCandidates.length,
      mergedCount,
      persistRequested,
      promotionBlockReason,
    });

    return {
      executionId: request.contextSummary.executionId,
      queryIntent: request.contextSummary.queryIntent,
      sessionId: request.sessionId ?? null,
      outcome:
        mergeCandidates.length === 0
          ? MemoryPromotionOutcome.NO_ELIGIBLE_CANDIDATES
          : mergedCount > 0
            ? MemoryPromotionOutcome.SESSION_SUMMARY_MERGED
            : MemoryPromotionOutcome.PLAN_ONLY,
      summary: this.createSummary(candidateDecisions, {
        plannedMergeCount: mergeCandidates.length,
        mergedCount,
        promotionBlockReason,
      }),
      candidateDecisions,
      phaseResults,
      persistedRecord,
    };
  }

  /**
   * Captures normalized promotion candidates from one contract-safe summary.
   * @param items Contract-safe summary items.
   * @returns Captured promotion candidates.
   */
  private captureCandidates(items: MemoryContextContractSafeSummaryItem[]) {
    return items.map((item) => ({
      sourceRecordId: item.recordId,
      sourceLayer: item.layer,
      memoryKind: item.memoryKind,
      summary: item.summary,
      sourceRefs: [...item.sourceRefs],
      sourceRefCount: item.sourceRefCount,
      explicitSourceRefCount: item.explicitSourceRefCount,
      updatedAt: item.updatedAt,
      sensitivity: [...item.sensitivity],
    }));
  }

  /**
   * Resolves one explicit promotion decision for a captured candidate.
   * @param candidate Captured promotion candidate.
   * @param sessionId Session target for the current baseline.
   * @returns Promotion candidate decision.
   */
  private decideCandidate(
    candidate: ReturnType<MemoryPromotionService["captureCandidates"]>[number],
    sessionId: string | null,
  ): MemoryPromotionCandidateDecision {
    const validation = this.validateCandidate(candidate);
    if (validation.failureReasons.length > 0) {
      return {
        sourceRecordId: candidate.sourceRecordId,
        sourceLayer: candidate.sourceLayer,
        memoryKind: candidate.memoryKind,
        action: MemoryPromotionCandidateAction.REJECT,
        targetLayer: null,
        targetScope: null,
        targetKey: null,
        mergeStrategy: null,
        decisionReason: validation.failureReasons[0] ?? "promotion_validation_failed",
        validation,
      };
    }

    if (candidate.sourceLayer === MemoryRecallLayer.SESSION) {
      return {
        sourceRecordId: candidate.sourceRecordId,
        sourceLayer: candidate.sourceLayer,
        memoryKind: candidate.memoryKind,
        action: MemoryPromotionCandidateAction.SKIP,
        targetLayer: MemoryRecallLayer.SESSION,
        targetScope: MemoryScope.SESSION,
        targetKey: sessionId,
        mergeStrategy: null,
        decisionReason: "already_within_session_layer",
        validation,
      };
    }

    if (!sessionId) {
      return {
        sourceRecordId: candidate.sourceRecordId,
        sourceLayer: candidate.sourceLayer,
        memoryKind: candidate.memoryKind,
        action: MemoryPromotionCandidateAction.SKIP,
        targetLayer: null,
        targetScope: null,
        targetKey: null,
        mergeStrategy: null,
        decisionReason: "session_target_missing",
        validation,
      };
    }

    if (candidate.sourceLayer !== MemoryRecallLayer.EXECUTION) {
      return {
        sourceRecordId: candidate.sourceRecordId,
        sourceLayer: candidate.sourceLayer,
        memoryKind: candidate.memoryKind,
        action: MemoryPromotionCandidateAction.SKIP,
        targetLayer: null,
        targetScope: null,
        targetKey: null,
        mergeStrategy: null,
        decisionReason: "target_layer_not_supported_in_baseline",
        validation,
      };
    }

    return {
      sourceRecordId: candidate.sourceRecordId,
      sourceLayer: candidate.sourceLayer,
      memoryKind: candidate.memoryKind,
      action: MemoryPromotionCandidateAction.MERGE,
      targetLayer: MemoryRecallLayer.SESSION,
      targetScope: MemoryScope.SESSION,
      targetKey: sessionId,
      mergeStrategy: "session_summary_record",
      decisionReason: "session_summary_projection_merge",
      validation,
    };
  }

  /**
   * Validates one promotion candidate against baseline persistence rules.
   * @param candidate Captured promotion candidate.
   * @returns Validation result.
   */
  private validateCandidate(
    candidate: ReturnType<MemoryPromotionService["captureCandidates"]>[number],
  ) {
    const reusable = candidate.summary.trim().length > 0;
    const attributable = candidate.sourceRefCount > 0;
    const traceable = candidate.explicitSourceRefCount > 0;
    const sensitivitySafe = candidate.sensitivity.every(
      (label) =>
        !MEMORY_PROMOTION_FORBIDDEN_SENSITIVITY_LABELS.includes(
          label.toLowerCase() as (typeof MEMORY_PROMOTION_FORBIDDEN_SENSITIVITY_LABELS)[number],
        ),
    );
    const sensitivityLabeled = candidate.sensitivity.length > 0;
    const canonicalSourceSafe =
      candidate.sourceLayer !== MemoryRecallLayer.NORMATIVE &&
      candidate.memoryKind !== MemoryRecallKind.NORMATIVE_PROJECTION;
    const failureReasons: string[] = [];

    if (!reusable) {
      failureReasons.push("summary_missing");
    }
    if (!attributable) {
      failureReasons.push("source_refs_missing");
    }
    if (!traceable) {
      failureReasons.push("explicit_traceability_missing");
    }
    if (!sensitivityLabeled) {
      failureReasons.push("sensitivity_labels_required");
    }
    if (!sensitivitySafe) {
      failureReasons.push("sensitivity_requires_redaction");
    }
    if (!canonicalSourceSafe) {
      failureReasons.push("canonical_projection_not_promotable");
    }

    return {
      reusable,
      attributable,
      traceable,
      sensitivityLabeled,
      sensitivitySafe,
      canonicalSourceSafe,
      failureReasons,
    };
  }

  /**
   * Creates explicit phase summaries for one promotion run.
   * @param candidateDecisions Candidate decisions.
   * @param mergeCandidateCount Count of merge-eligible candidates.
   * @returns Ordered promotion phase results.
   */
  private createPhaseResults(
    candidateDecisions: MemoryPromotionCandidateDecision[],
    options: {
      plannedMergeCount: number;
      mergedCount: number;
      persistRequested: boolean;
      promotionBlockReason: string | null;
    },
  ): MemoryPromotionPhaseResult[] {
    const candidateCount = candidateDecisions.length;
    const { plannedMergeCount, mergedCount, persistRequested, promotionBlockReason } = options;
    return [
      {
        phase: MemoryPromotionPhase.CAPTURE_CANDIDATES,
        status: "completed",
        candidateCount,
        detail: `captured_candidates=${candidateCount}`,
      },
      {
        phase: MemoryPromotionPhase.CLASSIFY_CANDIDATES,
        status: "completed",
        candidateCount,
        detail: `classified_candidates=${candidateCount}`,
      },
      {
        phase: MemoryPromotionPhase.VALIDATE_CANDIDATES,
        status: "completed",
        candidateCount,
        detail: `validated_candidates=${candidateCount}`,
      },
      {
        phase: MemoryPromotionPhase.DECIDE_TARGET_LAYER,
        status: "completed",
        candidateCount,
        detail: `merge_candidates=${plannedMergeCount}`,
      },
      {
        phase: MemoryPromotionPhase.MERGE_OR_PERSIST,
        status: mergedCount > 0 ? "completed" : "skipped",
        candidateCount: plannedMergeCount,
        detail: this.createMergeOrPersistDetail({
          plannedMergeCount,
          mergedCount,
          persistRequested,
          promotionBlockReason,
        }),
      },
    ];
  }

  /**
   * Creates one machine-readable promotion summary.
   * @param candidateDecisions Candidate decisions.
   * @returns Promotion summary.
   */
  private createSummary(
    candidateDecisions: MemoryPromotionCandidateDecision[],
    options: {
      plannedMergeCount: number;
      mergedCount: number;
      promotionBlockReason: string | null;
    },
  ) {
    const targetLayerCounts: MemoryPromotionResult["summary"]["targetLayerCounts"] = {};
    const failureReasonCounts: Record<string, number> = {};
    const { plannedMergeCount, mergedCount, promotionBlockReason } = options;

    for (const candidateDecision of candidateDecisions) {
      if (candidateDecision.targetLayer) {
        targetLayerCounts[candidateDecision.targetLayer] =
          (targetLayerCounts[candidateDecision.targetLayer] ?? 0) + 1;
      }

      const failureReasons =
        candidateDecision.validation.failureReasons.length > 0
          ? candidateDecision.validation.failureReasons
          : [candidateDecision.decisionReason];
      for (const failureReason of failureReasons) {
        failureReasonCounts[failureReason] = (failureReasonCounts[failureReason] ?? 0) + 1;
      }
    }

    if (promotionBlockReason && plannedMergeCount > 0 && mergedCount === 0) {
      failureReasonCounts[promotionBlockReason] =
        (failureReasonCounts[promotionBlockReason] ?? 0) + plannedMergeCount;
    }

    return {
      candidateCount: candidateDecisions.length,
      promotableCount: candidateDecisions.filter(
        (candidateDecision) => candidateDecision.action === MemoryPromotionCandidateAction.MERGE,
      ).length,
      plannedMergeCount,
      mergedCount,
      skippedCount: candidateDecisions.filter(
        (candidateDecision) => candidateDecision.action === MemoryPromotionCandidateAction.SKIP,
      ).length,
      rejectedCount: candidateDecisions.filter(
        (candidateDecision) => candidateDecision.action === MemoryPromotionCandidateAction.REJECT,
      ).length,
      targetLayerCounts,
      failureReasonCounts,
    };
  }

  /**
   * Resolves whether one contract-safe summary is eligible for persistence.
   * @param contextSummary Contract-safe context summary.
   * @returns Null when persistence is allowed, otherwise one explicit block reason.
   */
  private getPromotionBlockReason(
    request: MemoryPromotionRequest["contextSummary"],
  ): string | null {
    if (request.truncationReason) {
      return "context_summary_truncated";
    }

    if (request.assemblyOutcome !== MemoryContextAssemblyOutcome.CONTEXT_READY) {
      return `context_summary_not_ready:${request.assemblyOutcome}`;
    }

    return null;
  }

  /**
   * Renders one explicit merge/persist phase detail string.
   * @param options Merge/persist phase facts.
   * @returns Machine-readable phase detail.
   */
  private createMergeOrPersistDetail(options: {
    plannedMergeCount: number;
    mergedCount: number;
    persistRequested: boolean;
    promotionBlockReason: string | null;
  }): string {
    const { plannedMergeCount, mergedCount, persistRequested, promotionBlockReason } = options;

    if (mergedCount > 0) {
      return `session_summary_merged=${mergedCount}`;
    }

    if (plannedMergeCount === 0) {
      return "no_merge_candidates";
    }

    if (promotionBlockReason) {
      return `promotion_blocked=${promotionBlockReason};planned_merge_candidates=${plannedMergeCount}`;
    }

    if (!persistRequested) {
      return `plan_only_requested;planned_merge_candidates=${plannedMergeCount}`;
    }

    return `merge_candidates_not_persisted=${plannedMergeCount}`;
  }

  /**
   * Persists one merged session-summary record for merge-eligible candidates.
   * @param sessionId Session target key.
   * @param executionId Current execution id.
   * @param promotedBy Promotion owner label.
   * @param candidates Merge-eligible candidates.
   * @returns Persisted record summary.
   */
  private async persistSessionSummary(
    sessionId: string,
    executionId: string,
    promotedBy: string,
    candidates: ReturnType<MemoryPromotionService["captureCandidates"]>,
  ): Promise<MemoryPromotionResult["persistedRecord"]> {
    const existingSessionRecord = await this.memoryManager.readEntry({
      scope: MemoryScope.SESSION,
      key: sessionId,
    });
    const promotedAt = new Date().toISOString();
    const existingPromotedItems = Array.isArray(existingSessionRecord?.value.promotedContextItems)
      ? (existingSessionRecord?.value.promotedContextItems as SessionPromotionProjectionItem[])
      : [];
    const promotedItemsById = new Map<string, SessionPromotionProjectionItem>(
      existingPromotedItems.map((item) => [item.sourceRecordId, item]),
    );

    for (const candidate of candidates) {
      promotedItemsById.set(candidate.sourceRecordId, {
        sourceRecordId: candidate.sourceRecordId,
        sourceLayer: candidate.sourceLayer,
        memoryKind: candidate.memoryKind,
        summary: candidate.summary,
        sourceRefs: [...candidate.sourceRefs],
        updatedAt: candidate.updatedAt,
        sensitivity: [...candidate.sensitivity],
        promotedAt,
      });
    }

    const promotedItems = Array.from(promotedItemsById.values()).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
    const sourceRefs = Array.from(
      new Set(
        promotedItems
          .flatMap((item) => item.sourceRefs)
          .concat(
            Array.isArray(existingSessionRecord?.value.sourceRefs)
              ? existingSessionRecord.value.sourceRefs.filter(
                  (entry): entry is string => typeof entry === "string",
                )
              : [],
          ),
      ),
    );

    await this.memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: sessionId,
      payload: {
        ...(existingSessionRecord?.value ?? {}),
        summary:
          typeof existingSessionRecord?.value.summary === "string" &&
          existingSessionRecord.value.summary.trim().length > 0
            ? existingSessionRecord.value.summary
            : `Promoted execution memory summary for session ${sessionId}.`,
        sourceRefs,
        promotedContextItems: promotedItems,
        promotionSummary: {
          promotedRecordCount: promotedItems.length,
          lastPromotionExecutionId: executionId,
          lastPromotionAt: promotedAt,
          promotedBy,
        },
      },
      tags: Array.from(
        new Set([
          ...(existingSessionRecord?.tags ?? []),
          "memory-promotion",
          `execution:${executionId}`,
        ]),
      ),
      updatedAt: promotedAt,
    });

    return {
      scope: MemoryScope.SESSION,
      key: sessionId,
      promotedRecordIds: candidates.map((candidate) => candidate.sourceRecordId),
      updatedAt: promotedAt,
    };
  }
}
