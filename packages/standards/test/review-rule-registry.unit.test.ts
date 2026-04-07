import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  ReviewFindingSourceType,
  ReviewRuleApplicability,
  ReviewRuleExecutionMode,
  ReviewRuleRegistry,
  ReviewRuleSeverity,
  phaseAProjectedReviewRuleBundle,
  phaseAReviewRuleDefinitions,
} from '../src/index.js';
import type { ReviewRuleDefinition } from '../src/index.js';

function createReviewRuleFixture(
  overrides: Partial<ReviewRuleDefinition> = {},
): ReviewRuleDefinition {
  return {
    ruleId: 'review-rule.cs-003-unresolved-markers',
    semanticKey: 'code-standards.cs-003',
    title: 'CS-003 unresolved implementation markers',
    description: 'Flag unresolved TODO/FIXME/HACK markers.',
    severity: ReviewRuleSeverity.P2,
    executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
    applicability: [ReviewRuleApplicability.ALWAYS],
    standardsSourceRefs: [
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-003',
    ],
    deterministicCheckIds: ['cli-review.todo-marker-scan'],
    enabled: true,
    ...overrides,
  };
}

describe('ReviewRuleRegistry', () => {
  it('lists rules by applicability and execution mode', () => {
    const registry = new ReviewRuleRegistry({
      rules: [
        createReviewRuleFixture(),
        createReviewRuleFixture({
          ruleId: 'review-rule.cs-033-user-facing-i18n',
          semanticKey: 'code-standards.cs-033',
          title: 'CS-033 user-facing i18n governance',
          description: 'Require shared i18n usage for user-facing text.',
          severity: ReviewRuleSeverity.P1,
          executionMode: ReviewRuleExecutionMode.STANDARDS_GUIDED,
          applicability: [ReviewRuleApplicability.USER_FACING_TEXT_CHANGE],
          standardsSourceRefs: [
            '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-033',
          ],
          deterministicCheckIds: undefined,
        }),
      ],
    });

    expect(
      registry.listRules({
        applicability: ReviewRuleApplicability.ALWAYS,
      }),
    ).toHaveLength(1);
    expect(
      registry.listRules({
        executionModes: [ReviewRuleExecutionMode.STANDARDS_GUIDED],
      }),
    ).toHaveLength(1);
  });

  it('projects one structured bundle with deduplicated provenance refs', () => {
    const registry = new ReviewRuleRegistry({
      rules: phaseAReviewRuleDefinitions,
    });

    const projectedBundle = registry.projectRuleBundle({
      bundleId: 'bundle.review.phase-a.recheck',
      bundleVersion: '1.0.0',
      title: 'Phase A recheck bundle',
      description: 'Covers deterministic and standards-guided first-phase rules.',
      executionModes: [
        ReviewRuleExecutionMode.DETERMINISTIC,
        ReviewRuleExecutionMode.STANDARDS_GUIDED,
      ],
      supportedFindingSourceTypes: [
        ReviewFindingSourceType.DETERMINISTIC_RULE,
        ReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
      ],
    });

    expect(projectedBundle.rules).toHaveLength(6);
    expect(projectedBundle.projectedPackRefs).toEqual(['pack.official.workflow-review']);
    expect(projectedBundle.standardsSourceRefs).toContain(
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-034',
    );
  });

  it('rejects deterministic rules that omit deterministic check ids', () => {
    expect(
      () =>
        new ReviewRuleRegistry({
          rules: [
            createReviewRuleFixture({
              deterministicCheckIds: undefined,
            }),
          ],
        }),
    ).toThrowError(RuntimeError);

    try {
      new ReviewRuleRegistry({
        rules: [
          createReviewRuleFixture({
            deterministicCheckIds: undefined,
          }),
        ],
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.REVIEW_RULE_INVALID);
    }
  });

  it('exports the Phase A projected bundle with the full finding-source baseline', () => {
    expect(phaseAProjectedReviewRuleBundle.bundleId).toBe('bundle.review.phase-a');
    expect(phaseAProjectedReviewRuleBundle.rules).toHaveLength(6);
    expect(phaseAProjectedReviewRuleBundle.supportedFindingSourceTypes).toEqual([
      ReviewFindingSourceType.DETERMINISTIC_RULE,
      ReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
      ReviewFindingSourceType.RISK_INFERENCE,
    ]);

    const reviewLifecycleRule = phaseAProjectedReviewRuleBundle.rules.find(
      (rule) => rule.ruleId === 'review-rule.cs-026-review-lifecycle-sync',
    );
    expect(reviewLifecycleRule?.executionMode).toBe(ReviewRuleExecutionMode.STANDARDS_GUIDED);
    expect(reviewLifecycleRule?.metadata?.currentCoverage).toBe('partial');
  });
});
