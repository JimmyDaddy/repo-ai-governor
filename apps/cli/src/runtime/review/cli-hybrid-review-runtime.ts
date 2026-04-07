import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ReviewFindingSourceType,
  ReviewRuleApplicability,
  type ReviewRuleDefinition,
  ReviewRuleExecutionMode,
  phaseAProjectedReviewRuleBundle,
} from '@repo-ai-governor/standards';
import {
  CLI_REVIEW_HYBRID_DEDUPE_STRATEGY,
  CLI_REVIEW_SUPPORTED_DETERMINISTIC_CHECK_IDS,
  CLI_REVIEW_TEST_FILE_PATH_PATTERN,
  CLI_REVIEW_USER_FACING_TEXT_CONTENT_MARKERS,
  CLI_REVIEW_USER_FACING_TEXT_PATH_PATTERNS,
} from '../../constants/cli-review.constant.js';
import type {
  CliHybridReviewContext,
  CliReviewFinding,
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
  public constructor(private readonly repositoryRoot: string) {}

  /**
   * Builds the structured hybrid review context retained in transport artifacts.
   * @param options Current review scope facts plus findings from executed passes.
   * @returns Normalized hybrid review context with projected rules and coverage gaps.
   */
  public buildHybridReviewContext(options: {
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
    const projectedRules = phaseAProjectedReviewRuleBundle.rules.filter((rule) =>
      this.isRuleApplicable(rule, options.changedPaths),
    );
    const uncoveredRuleIds = projectedRules
      .filter((rule) => this.isRuleUncovered(rule))
      .map((rule) => rule.ruleId);
    const standardsSourceRefs = this.collectUniqueStrings(
      projectedRules.flatMap((rule) => rule.standardsSourceRefs),
    );
    const projectedPackRefs = this.collectUniqueStrings(
      projectedRules.flatMap((rule) => rule.projectedPackRefs ?? []),
    );

    return {
      projectedRuleBundle: {
        ...phaseAProjectedReviewRuleBundle,
        standardsSourceRefs,
        projectedPackRefs,
        rules: projectedRules,
      },
      projectedRules,
      deterministicFindings,
      standardsGuidedFindings,
      riskFindings,
      uncoveredRuleIds,
      delegatedReviewEnabled: false,
      dedupeStrategy: CLI_REVIEW_HYBRID_DEDUPE_STRATEGY,
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
   * Resolves the canonical dedupe key shared by hybrid review passes.
   * @param finding Structured finding payload.
   * @returns Stable dedupe key based on rule/source plus file location.
   */
  public createDedupeKey(finding: CliReviewFinding): string {
    const classifier = finding.ruleId ?? finding.sourceType ?? 'review-finding';
    return `${classifier}:${finding.file}:${finding.line ?? 0}`;
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

    return !rule.deterministicCheckIds?.some((checkId) =>
      CLI_REVIEW_SUPPORTED_DETERMINISTIC_CHECK_IDS.includes(
        checkId as (typeof CLI_REVIEW_SUPPORTED_DETERMINISTIC_CHECK_IDS)[number],
      ),
    );
  }

  private collectUniqueStrings(values: string[]): string[] {
    return Array.from(
      new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
    );
  }
}
