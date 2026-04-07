import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type ProjectedReviewRuleBundle,
  ReviewFindingSourceType,
  ReviewRuleApplicability,
  type ReviewRuleDefinition,
  ReviewRuleExecutionMode,
  ReviewRuleSeverity,
  phaseAProjectedReviewRuleBundle,
} from '@repo-ai-governor/standards';
import {
  CLI_REVIEW_HYBRID_DEDUPE_STRATEGY,
  CLI_REVIEW_REQUIRED_NORMATIVE_INPUTS,
  CLI_REVIEW_SUPPORTED_DETERMINISTIC_CHECK_IDS,
  CLI_REVIEW_TEST_FILE_PATH_PATTERN,
  CLI_REVIEW_USER_FACING_TEXT_CONTENT_MARKERS,
  CLI_REVIEW_USER_FACING_TEXT_PATH_PATTERNS,
  CliDelegatedReviewActivationLevel,
  CliDelegatedReviewActivationReason,
  CliReviewCoverageState,
} from '../../constants/cli-review.constant.js';
import type {
  CliDelegatedReviewActivationPolicy,
  CliDelegatedReviewRequest,
  CliHybridReviewContext,
  CliReviewCoverageSummary,
  CliReviewFinding,
  CliReviewScopeSnapshot,
} from '../../types/interfaces/cli-review-command.interface.js';

/**
 * Owns the current standards-native hybrid review projection for native CLI review.
 *
 * Why this exists:
 * sprint-002 needs one explicit seam where deterministic findings, projected review rules,
 * and future delegated-review inputs are normalized without turning the command entry into
 * another cross-layer coordinator.
 */
export class CliHybridReviewRuntime {
  public constructor(
    private readonly repositoryRoot: string,
    private readonly projectedReviewRuleBundle: ProjectedReviewRuleBundle = phaseAProjectedReviewRuleBundle,
  ) {}

  /**
   * Builds the structured hybrid review context retained in transport artifacts.
   * @param options Current review scope facts plus findings from executed passes.
   * @returns Normalized hybrid review context with projected rules and coverage gaps.
   */
  public buildHybridReviewContext(options: {
    requestId: string;
    scope: CliReviewScopeSnapshot;
    changedPaths: string[];
    findings: CliReviewFinding[];
    delegatedFindings?: CliReviewFinding[];
  }): CliHybridReviewContext {
    const deterministicFindings = options.findings.filter(
      (finding) => finding.sourceType === ReviewFindingSourceType.DETERMINISTIC_RULE,
    );
    const delegatedFindings = options.delegatedFindings ?? [];
    const standardsGuidedFindings = this.collectUniqueFindings(
      options.findings.filter(
        (finding) => finding.sourceType === ReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
      ),
      delegatedFindings,
    );
    const riskFindings = options.findings.filter(
      (finding) => finding.sourceType === ReviewFindingSourceType.RISK_INFERENCE,
    );
    const projectedRules = this.projectedReviewRuleBundle.rules.filter((rule) =>
      this.isRuleApplicable(rule, options.changedPaths),
    );
    const deterministicCoveredRuleIds = projectedRules
      .filter((rule) => this.isDeterministicallyCovered(rule))
      .map((rule) => rule.ruleId);
    const standardsGuidedCoveredRuleIds = this.collectCoveredRuleIds({
      findings: standardsGuidedFindings,
      projectedRules,
      executionMode: ReviewRuleExecutionMode.STANDARDS_GUIDED,
    });
    const manualOnlyGapRuleIds = projectedRules
      .filter(
        (rule) =>
          rule.executionMode === ReviewRuleExecutionMode.MANUAL_ONLY &&
          !deterministicCoveredRuleIds.includes(rule.ruleId) &&
          !standardsGuidedCoveredRuleIds.includes(rule.ruleId),
      )
      .map((rule) => rule.ruleId);
    const residualGapRuleIds = projectedRules
      .filter(
        (rule) =>
          rule.executionMode !== ReviewRuleExecutionMode.MANUAL_ONLY &&
          !deterministicCoveredRuleIds.includes(rule.ruleId) &&
          !standardsGuidedCoveredRuleIds.includes(rule.ruleId),
      )
      .map((rule) => rule.ruleId);
    const uncoveredRuleIds = projectedRules
      .filter(
        (rule) =>
          rule.executionMode === ReviewRuleExecutionMode.STANDARDS_GUIDED &&
          residualGapRuleIds.includes(rule.ruleId),
      )
      .map((rule) => rule.ruleId);
    const standardsSourceRefs = this.collectUniqueStrings(
      projectedRules.flatMap((rule) => rule.standardsSourceRefs),
    );
    const projectedPackRefs = this.collectUniqueStrings(
      projectedRules.flatMap((rule) => rule.projectedPackRefs ?? []),
    );
    const coverageSummary = this.buildCoverageSummary({
      projectedRules,
      deterministicCoveredRuleIds,
      standardsGuidedCoveredRuleIds,
      residualGapRuleIds,
      manualOnlyGapRuleIds,
    });
    const delegatedReviewActivationPolicy = this.buildDelegatedReviewActivationPolicy({
      scope: options.scope,
      uncoveredRuleIds,
      manualOnlyGapRuleIds,
    });

    return {
      projectedRuleBundle: {
        ...this.projectedReviewRuleBundle,
        standardsSourceRefs,
        projectedPackRefs,
        rules: projectedRules,
      },
      projectedRules,
      deterministicFindings,
      standardsGuidedFindings,
      riskFindings,
      coverageSummary,
      delegatedReviewActivationPolicy,
      uncoveredRuleIds,
      delegatedReviewEnabled: false,
      dedupeStrategy: CLI_REVIEW_HYBRID_DEDUPE_STRATEGY,
      delegatedReviewRequest: this.buildDelegatedReviewRequest({
        requestId: options.requestId,
        scope: options.scope,
        projectedRuleBundle: {
          ...this.projectedReviewRuleBundle,
          standardsSourceRefs,
          projectedPackRefs,
          rules: projectedRules,
        },
        projectedRules,
        deterministicFindings,
        coverageSummary,
        delegatedReviewActivationPolicy,
        uncoveredRuleIds,
        changedPaths: options.changedPaths,
      }),
    };
  }

  /**
   * Merges deterministic and delegated findings while preserving one canonical finding record.
   * @param options Findings already emitted by active review passes.
   * @returns Stable de-duplicated findings for canonical artifact persistence.
   */
  public mergeFindings(options: {
    deterministicFindings: CliReviewFinding[];
    delegatedFindings?: CliReviewFinding[];
    riskFindings?: CliReviewFinding[];
  }): CliReviewFinding[] {
    return this.collectUniqueFindings(
      options.deterministicFindings,
      options.delegatedFindings ?? [],
      options.riskFindings ?? [],
    );
  }

  /**
   * Normalizes delegated reviewer findings onto the same governed finding contract used by native review.
   * @param options Raw delegated-review findings plus the structured handoff request used for the round.
   * @returns Canonical delegated findings filtered to uncovered rules or explicit risk observations.
   */
  public normalizeDelegatedFindings(options: {
    rawFindings: Array<
      Partial<CliReviewFinding> & {
        title: string;
        file: string;
        summary: string;
        impact: string;
        suggestedAction: string;
      }
    >;
    delegatedReviewRequest: CliDelegatedReviewRequest;
  }): CliReviewFinding[] {
    const uncoveredRuleIds = new Set(options.delegatedReviewRequest.uncoveredRuleIds);
    const projectedRulesById = new Map(
      options.delegatedReviewRequest.projectedRules.map((rule) => [rule.ruleId, rule]),
    );
    const normalizedFindings: CliReviewFinding[] = [];

    for (const rawFinding of options.rawFindings) {
      const projectedRule =
        typeof rawFinding.ruleId === 'string' ? projectedRulesById.get(rawFinding.ruleId) : null;
      const isExplicitRiskObservation =
        rawFinding.sourceType === ReviewFindingSourceType.RISK_INFERENCE;
      const isAllowedStandardsGuidedFinding =
        projectedRule && uncoveredRuleIds.has(projectedRule.ruleId);

      if (!isExplicitRiskObservation && !isAllowedStandardsGuidedFinding) {
        continue;
      }

      const sourceType = isExplicitRiskObservation
        ? ReviewFindingSourceType.RISK_INFERENCE
        : ReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE;
      const ruleId =
        typeof rawFinding.ruleId === 'string' && rawFinding.ruleId.trim().length > 0
          ? rawFinding.ruleId.trim()
          : sourceType === ReviewFindingSourceType.RISK_INFERENCE
            ? 'delegated-risk-observation'
            : 'delegated-standards-guided-observation';
      const line =
        typeof rawFinding.line === 'number' && Number.isFinite(rawFinding.line)
          ? rawFinding.line
          : undefined;
      const severity =
        rawFinding.severity ??
        projectedRule?.severity ??
        (sourceType === ReviewFindingSourceType.RISK_INFERENCE
          ? ReviewRuleSeverity.P2
          : ReviewRuleSeverity.P1);
      const findingId = this.createStableFindingId({
        ruleId,
        file: rawFinding.file,
        line,
      });
      const normalizedFinding: CliReviewFinding = {
        findingId,
        fingerprint: `${ruleId}:${rawFinding.file}:${line ?? 0}`,
        ruleId,
        severity,
        sourceType,
        executionMode: ReviewRuleExecutionMode.STANDARDS_GUIDED,
        ...(projectedRule?.semanticKey ? { semanticKey: projectedRule.semanticKey } : {}),
        standardsSourceRefs: projectedRule?.standardsSourceRefs ?? [],
        projectedPackRefs: projectedRule?.projectedPackRefs ?? [],
        title: rawFinding.title,
        file: rawFinding.file,
        ...(typeof line === 'number' ? { line } : {}),
        summary: rawFinding.summary,
        impact: rawFinding.impact,
        suggestedAction: rawFinding.suggestedAction,
        evidence:
          Array.isArray(rawFinding.evidence) && rawFinding.evidence.length > 0
            ? rawFinding.evidence.filter(
                (evidence): evidence is string => typeof evidence === 'string',
              )
            : [rawFinding.file],
        ...(typeof rawFinding.confidence === 'number' ? { confidence: rawFinding.confidence } : {}),
        reviewerRationale:
          typeof rawFinding.reviewerRationale === 'string' &&
          rawFinding.reviewerRationale.trim().length > 0
            ? rawFinding.reviewerRationale.trim()
            : rawFinding.summary,
      };
      normalizedFindings.push(normalizedFinding);
    }

    return this.collectUniqueFindings(
      normalizedFindings.filter((finding) => {
        const dedupeKey = this.createDedupeKey(finding);
        return !options.delegatedReviewRequest.deterministicFindings.some(
          (deterministicFinding) => this.createDedupeKey(deterministicFinding) === dedupeKey,
        );
      }),
    );
  }

  /**
   * Resolves the canonical dedupe key shared by hybrid review passes.
   * @param finding Structured finding payload.
   * @returns Stable dedupe key based on rule/source plus file location.
   */
  public createDedupeKey(finding: CliReviewFinding): string {
    const classifier = finding.ruleId ?? finding.sourceType ?? 'review-finding';
    return `${classifier}:${finding.file}:${finding.line ?? 0}`;
  }

  private buildDelegatedReviewRequest(options: {
    requestId: string;
    scope: CliReviewScopeSnapshot;
    projectedRuleBundle: CliHybridReviewContext['projectedRuleBundle'];
    projectedRules: ReviewRuleDefinition[];
    deterministicFindings: CliReviewFinding[];
    coverageSummary: CliReviewCoverageSummary;
    delegatedReviewActivationPolicy: CliDelegatedReviewActivationPolicy;
    uncoveredRuleIds: string[];
    changedPaths: string[];
  }): CliDelegatedReviewRequest {
    return {
      requestId: options.requestId,
      scopeSummary: options.scope.scopeSummary,
      reviewMode: options.scope.reviewMode,
      reviewSurface: this.buildReviewSurface(options.changedPaths),
      requiredNormativeInputs: [...CLI_REVIEW_REQUIRED_NORMATIVE_INPUTS],
      projectedRuleBundle: options.projectedRuleBundle,
      projectedRules: options.projectedRules,
      deterministicFindings: options.deterministicFindings,
      coverageSummary: options.coverageSummary,
      delegatedReviewActivationPolicy: options.delegatedReviewActivationPolicy,
      uncoveredRuleIds: options.uncoveredRuleIds,
    };
  }

  private collectUniqueFindings(...findingGroups: CliReviewFinding[][]): CliReviewFinding[] {
    const findingsByKey = new Map<string, CliReviewFinding>();

    for (const findingGroup of findingGroups) {
      for (const finding of findingGroup) {
        const dedupeKey = this.createDedupeKey(finding);
        if (!findingsByKey.has(dedupeKey)) {
          findingsByKey.set(dedupeKey, finding);
        }
      }
    }

    return Array.from(findingsByKey.values());
  }

  private isRuleApplicable(rule: ReviewRuleDefinition, changedPaths: string[]): boolean {
    return rule.applicability.some((applicability) =>
      this.matchesApplicability(applicability, changedPaths),
    );
  }

  private matchesApplicability(
    applicability: ReviewRuleApplicability,
    changedPaths: string[],
  ): boolean {
    switch (applicability) {
      case ReviewRuleApplicability.ALWAYS:
        return true;
      case ReviewRuleApplicability.GOVERNANCE_DOC_CHANGE:
        return changedPaths.some((changedPath) =>
          changedPath.startsWith('.repo-ai-governor/normative_knowledge_sources/'),
        );
      case ReviewRuleApplicability.TASK_LEDGER_CHANGE:
        return changedPaths.some((changedPath) =>
          /\/(tasks\/|checklist\.md$|tasks\.csv$|plan\.md$)/u.test(changedPath),
        );
      case ReviewRuleApplicability.REVIEW_LIFECYCLE_CHANGE:
        return changedPaths.some(
          (changedPath) =>
            changedPath.includes('/review/') ||
            /\/CR-\d+/u.test(changedPath) ||
            /^\.repo-ai-governor\/context\/dev\/.+\/review\//u.test(changedPath),
        );
      case ReviewRuleApplicability.USER_FACING_TEXT_CHANGE:
        return changedPaths.some((changedPath) => this.isLikelyUserFacingTextChange(changedPath));
      case ReviewRuleApplicability.CODE_AFFECTING_CHANGE:
        return changedPaths.some((changedPath) => /^(apps|packages|bin|test)\//u.test(changedPath));
      default:
        return false;
    }
  }

  private isLikelyUserFacingTextChange(changedPath: string): boolean {
    if (!/^(apps|packages)\//u.test(changedPath)) {
      return false;
    }

    if (CLI_REVIEW_TEST_FILE_PATH_PATTERN.test(changedPath)) {
      return false;
    }

    if (
      CLI_REVIEW_USER_FACING_TEXT_PATH_PATTERNS.some((pathPattern) => pathPattern.test(changedPath))
    ) {
      return true;
    }

    const absolutePath = resolve(this.repositoryRoot, changedPath);
    if (!existsSync(absolutePath)) {
      return false;
    }

    const fileContent = readFileSync(absolutePath, 'utf8');
    return CLI_REVIEW_USER_FACING_TEXT_CONTENT_MARKERS.some((marker) =>
      fileContent.includes(marker),
    );
  }

  private isRuleUncovered(rule: ReviewRuleDefinition): boolean {
    if (rule.executionMode !== ReviewRuleExecutionMode.DETERMINISTIC) {
      return true;
    }

    return !this.isDeterministicallyCovered(rule);
  }

  private isDeterministicallyCovered(rule: ReviewRuleDefinition): boolean {
    return Boolean(
      rule.deterministicCheckIds?.some((checkId) =>
        CLI_REVIEW_SUPPORTED_DETERMINISTIC_CHECK_IDS.includes(
          checkId as (typeof CLI_REVIEW_SUPPORTED_DETERMINISTIC_CHECK_IDS)[number],
        ),
      ),
    );
  }

  private collectCoveredRuleIds(options: {
    findings: CliReviewFinding[];
    projectedRules: ReviewRuleDefinition[];
    executionMode: ReviewRuleExecutionMode;
  }): string[] {
    const eligibleRuleIds = new Set(
      options.projectedRules
        .filter((rule) => rule.executionMode === options.executionMode)
        .map((rule) => rule.ruleId),
    );

    return this.collectUniqueStrings(
      options.findings
        .map((finding) => finding.ruleId)
        .filter((ruleId): ruleId is string => typeof ruleId === 'string')
        .filter((ruleId) => eligibleRuleIds.has(ruleId)),
    );
  }

  private buildCoverageSummary(options: {
    projectedRules: ReviewRuleDefinition[];
    deterministicCoveredRuleIds: string[];
    standardsGuidedCoveredRuleIds: string[];
    residualGapRuleIds: string[];
    manualOnlyGapRuleIds: string[];
  }): CliReviewCoverageSummary {
    return {
      totalApplicableRuleCount: options.projectedRules.length,
      deterministicCoveredRuleCount: options.deterministicCoveredRuleIds.length,
      standardsGuidedCoveredRuleCount: options.standardsGuidedCoveredRuleIds.length,
      residualGapRuleCount: options.residualGapRuleIds.length,
      manualOnlyGapRuleCount: options.manualOnlyGapRuleIds.length,
      deterministicCoveredRuleIds: options.deterministicCoveredRuleIds,
      standardsGuidedCoveredRuleIds: options.standardsGuidedCoveredRuleIds,
      residualGapRuleIds: options.residualGapRuleIds,
      manualOnlyGapRuleIds: options.manualOnlyGapRuleIds,
      coverageBuckets: [
        {
          state: CliReviewCoverageState.DETERMINISTIC_COVERED,
          ruleIds: options.deterministicCoveredRuleIds,
          count: options.deterministicCoveredRuleIds.length,
        },
        {
          state: CliReviewCoverageState.STANDARDS_GUIDED_COVERED,
          ruleIds: options.standardsGuidedCoveredRuleIds,
          count: options.standardsGuidedCoveredRuleIds.length,
        },
        {
          state: CliReviewCoverageState.RESIDUAL_GAP,
          ruleIds: options.residualGapRuleIds,
          count: options.residualGapRuleIds.length,
        },
        {
          state: CliReviewCoverageState.MANUAL_ONLY_GAP,
          ruleIds: options.manualOnlyGapRuleIds,
          count: options.manualOnlyGapRuleIds.length,
        },
      ],
    };
  }

  private buildDelegatedReviewActivationPolicy(options: {
    scope: CliReviewScopeSnapshot;
    uncoveredRuleIds: string[];
    manualOnlyGapRuleIds: string[];
  }): CliDelegatedReviewActivationPolicy {
    const reasonCodes: CliDelegatedReviewActivationReason[] = [];
    const nonAllowRequiredAction = options.scope.requiredAction !== 'allow';
    const manualFollowUpRequired = options.manualOnlyGapRuleIds.length > 0;
    const level =
      options.uncoveredRuleIds.length === 0
        ? CliDelegatedReviewActivationLevel.OPTIONAL
        : nonAllowRequiredAction || options.scope.riskLevel === 'high'
          ? CliDelegatedReviewActivationLevel.REQUIRED
          : CliDelegatedReviewActivationLevel.RECOMMENDED;

    if (options.uncoveredRuleIds.length === 0) {
      reasonCodes.push(CliDelegatedReviewActivationReason.NO_DELEGATABLE_GAP);
    } else {
      reasonCodes.push(CliDelegatedReviewActivationReason.DELEGATABLE_GAP_PRESENT);
    }

    if (nonAllowRequiredAction) {
      reasonCodes.push(CliDelegatedReviewActivationReason.NON_ALLOW_REQUIRED_ACTION);
    }

    if (manualFollowUpRequired) {
      reasonCodes.push(CliDelegatedReviewActivationReason.MANUAL_ONLY_GAP_PRESENT);
    }

    return {
      level,
      reasonCodes,
      delegatableGapRuleIds: options.uncoveredRuleIds,
      manualOnlyGapRuleIds: options.manualOnlyGapRuleIds,
      manualFollowUpRequired,
    };
  }

  private collectUniqueStrings(values: string[]): string[] {
    return Array.from(
      new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
    );
  }

  private buildReviewSurface(changedPaths: string[]): string[] {
    if (changedPaths.length === 0) {
      return ['working-tree:empty'];
    }

    return this.collectUniqueStrings(changedPaths);
  }

  private createStableFindingId(options: {
    ruleId: string;
    file: string;
    line?: number;
  }): string {
    return `${options.ruleId}-${options.file}-${options.line ?? 0}`
      .replace(/[^A-Za-z0-9]+/gu, '-')
      .replace(/^-+/u, '')
      .replace(/-+$/u, '')
      .toLowerCase();
  }
}
