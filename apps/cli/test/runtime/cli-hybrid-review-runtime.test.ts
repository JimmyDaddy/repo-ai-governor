import { ReviewFindingSourceType, ReviewRuleExecutionMode } from '@repo-ai-governor/standards';
import {
  CliReviewFindingSeverity,
  CliReviewScopeMode,
} from '../../src/constants/cli-review.constant.js';
import { CliHybridReviewRuntime } from '../../src/runtime/review/cli-hybrid-review-runtime.js';

describe('CliHybridReviewRuntime', () => {
  it('builds a structured delegated reviewer handoff contract alongside the hybrid review context', () => {
    const runtime = new CliHybridReviewRuntime(process.cwd());
    const hybridReviewContext = runtime.buildHybridReviewContext({
      requestId: 'review-001',
      scope: {
        reviewMode: CliReviewScopeMode.WORKING_TREE,
        scopeSummary: 'working tree fixture scope',
        reviewedPaths: ['apps/cli/src/commands/review-command.ts'],
        excludedPaths: [],
        riskLevel: 'medium',
        requiredAction: 'confirm',
      },
      changedPaths: ['apps/cli/src/commands/review-command.ts'],
      findings: [
        {
          findingId: 'deterministic-fixture',
          fingerprint:
            'review-rule.cs-003-unresolved-markers:apps/cli/src/commands/review-command.ts:1',
          ruleId: 'review-rule.cs-003-unresolved-markers',
          severity: CliReviewFindingSeverity.P2,
          sourceType: ReviewFindingSourceType.DETERMINISTIC_RULE,
          executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
          title: 'fixture finding',
          file: 'apps/cli/src/commands/review-command.ts',
          line: 1,
          summary: 'fixture summary',
          impact: 'fixture impact',
          suggestedAction: 'fixture action',
          evidence: ['apps/cli/src/commands/review-command.ts:1'],
        },
      ],
    });

    expect(hybridReviewContext.delegatedReviewRequest.requestId).toBe('review-001');
    expect(hybridReviewContext.delegatedReviewRequest.reviewSurface).toEqual([
      'apps/cli/src/commands/review-command.ts',
    ]);
    expect(hybridReviewContext.delegatedReviewRequest.requiredNormativeInputs).toEqual(
      expect.arrayContaining(['AGENTS.md']),
    );
  });

  it('normalizes delegated reviewer findings and filters duplicates already covered by deterministic findings', () => {
    const runtime = new CliHybridReviewRuntime(process.cwd());
    const hybridReviewContext = runtime.buildHybridReviewContext({
      requestId: 'review-002',
      scope: {
        reviewMode: CliReviewScopeMode.WORKING_TREE,
        scopeSummary: 'working tree fixture scope',
        reviewedPaths: ['apps/cli/src/commands/review-command.ts'],
        excludedPaths: [],
        riskLevel: 'medium',
        requiredAction: 'confirm',
      },
      changedPaths: ['apps/cli/src/commands/review-command.ts'],
      findings: [
        {
          findingId: 'deterministic-fixture',
          fingerprint:
            'review-rule.cs-003-unresolved-markers:apps/cli/src/commands/review-command.ts:1',
          ruleId: 'review-rule.cs-003-unresolved-markers',
          severity: CliReviewFindingSeverity.P2,
          sourceType: ReviewFindingSourceType.DETERMINISTIC_RULE,
          executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
          title: 'fixture finding',
          file: 'apps/cli/src/commands/review-command.ts',
          line: 1,
          summary: 'fixture summary',
          impact: 'fixture impact',
          suggestedAction: 'fixture action',
          evidence: ['apps/cli/src/commands/review-command.ts:1'],
        },
      ],
    });

    const normalizedFindings = runtime.normalizeDelegatedFindings({
      delegatedReviewRequest: {
        ...hybridReviewContext.delegatedReviewRequest,
        projectedRules: [
          ...hybridReviewContext.delegatedReviewRequest.projectedRules,
          {
            ruleId: 'review-rule.cs-033-user-facing-i18n',
            semanticKey: 'code-standards.cs-033',
            title: 'CS-033 user-facing i18n governance',
            description: 'fixture description',
            severity: CliReviewFindingSeverity.P1,
            executionMode: ReviewRuleExecutionMode.STANDARDS_GUIDED,
            applicability: [],
            standardsSourceRefs: [
              '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-033',
            ],
            enabled: true,
          },
        ],
        uncoveredRuleIds: ['review-rule.cs-033-user-facing-i18n'],
      },
      rawFindings: [
        {
          ruleId: 'review-rule.cs-003-unresolved-markers',
          title: 'duplicate deterministic finding',
          file: 'apps/cli/src/commands/review-command.ts',
          line: 1,
          summary: 'should be filtered',
          impact: 'duplicate',
          suggestedAction: 'skip',
          evidence: ['apps/cli/src/commands/review-command.ts:1'],
        },
        {
          ruleId: 'review-rule.cs-033-user-facing-i18n',
          title: 'User-facing copy bypasses i18n',
          file: 'apps/cli/src/commands/review-command.ts',
          summary: 'reviewer summary',
          impact: 'i18n drift',
          suggestedAction: 'use localizeText',
          evidence: ['apps/cli/src/commands/review-command.ts'],
          reviewerRationale: 'The delegated reviewer observed direct user-facing copy.',
        },
      ],
    });

    expect(normalizedFindings).toHaveLength(1);
    expect(normalizedFindings[0]).toEqual(
      expect.objectContaining({
        ruleId: 'review-rule.cs-033-user-facing-i18n',
        sourceType: ReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
        reviewerRationale: 'The delegated reviewer observed direct user-facing copy.',
      }),
    );
  });
});
