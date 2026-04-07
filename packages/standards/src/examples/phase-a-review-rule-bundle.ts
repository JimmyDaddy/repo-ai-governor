import {
  ReviewFindingSourceType,
  ReviewRuleApplicability,
  ReviewRuleExecutionMode,
  ReviewRuleSeverity,
} from '../constants/index.js';
import { ReviewRuleRegistry } from '../review-rule-registry.js';
import type { ProjectedReviewRuleBundle, ReviewRuleDefinition } from '../types/index.js';

/**
 * Defines the curated Phase A projected review-rule subset used by project-057 sprint-001.
 */
export const phaseAReviewRuleDefinitions: ReviewRuleDefinition[] = [
  {
    ruleId: 'review-rule.cs-003-unresolved-markers',
    semanticKey: 'code-standards.cs-003',
    title: 'CS-003 unresolved implementation markers',
    description:
      'Flag TODO/FIXME/HACK markers that remain inside the reviewed boundary unless they are explicitly tracked as a known risk.',
    severity: ReviewRuleSeverity.P2,
    executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
    applicability: [ReviewRuleApplicability.ALWAYS],
    standardsSourceRefs: [
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-003',
    ],
    deterministicCheckIds: ['cli-review.todo-marker-scan'],
    enabled: true,
    metadata: {
      currentCoverage: 'full',
      currentOwner: 'apps/cli runtime review finding generator',
    },
  },
  {
    ruleId: 'review-rule.cs-015-triad-sync',
    semanticKey: 'code-standards.cs-015',
    title: 'CS-015 triad document synchronization',
    description:
      'Require requirement, solution, architecture, and brief PRD documents to stay synchronized when one normative layer changes.',
    severity: ReviewRuleSeverity.P1,
    executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
    applicability: [ReviewRuleApplicability.GOVERNANCE_DOC_CHANGE],
    standardsSourceRefs: [
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-015',
    ],
    deterministicCheckIds: ['gate.check-docs-triad-sync'],
    enabled: true,
    metadata: {
      currentCoverage: 'full',
      currentOwner: 'governance gate',
    },
  },
  {
    ruleId: 'review-rule.cs-021-task-ledger-sync',
    semanticKey: 'code-standards.cs-021',
    title: 'CS-021 task ledger synchronization',
    description:
      'Keep task cards, sqlite canonical ledger, checklist, tasks.csv, and sprint plan status aligned inside the active stream.',
    severity: ReviewRuleSeverity.P1,
    executionMode: ReviewRuleExecutionMode.DETERMINISTIC,
    applicability: [ReviewRuleApplicability.TASK_LEDGER_CHANGE],
    standardsSourceRefs: [
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-021',
      '.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md#6-drift-governance',
    ],
    deterministicCheckIds: ['gate.check-task-ledger-sync', 'gate.check-sprint-plan-status-sync'],
    projectedPackRefs: ['pack.official.workflow-review'],
    enabled: true,
    metadata: {
      currentCoverage: 'full',
      currentOwner: 'governance task-ledger sync gates',
    },
  },
  {
    ruleId: 'review-rule.cs-026-review-lifecycle-sync',
    semanticKey: 'code-standards.cs-026',
    title: 'CS-026 review lifecycle synchronization',
    description:
      'Keep review artifact filename prefixes, top-level lifecycle status, and paired CR task status synchronized for each governed review round.',
    severity: ReviewRuleSeverity.P1,
    executionMode: ReviewRuleExecutionMode.STANDARDS_GUIDED,
    applicability: [ReviewRuleApplicability.REVIEW_LIFECYCLE_CHANGE],
    standardsSourceRefs: [
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-026',
      '.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md#3-transition-rules',
    ],
    projectedPackRefs: ['pack.official.workflow-review'],
    enabled: true,
    metadata: {
      currentCoverage: 'partial',
      currentOwner: 'review lifecycle status gate plus reviewer-guided CR-task progression check',
      deterministicSignal: 'gate.check-code-review-status-sync',
      deterministicGap:
        'No single deterministic check currently verifies the paired CR-task lifecycle progression against the review artifact state.',
    },
  },
  {
    ruleId: 'review-rule.cs-033-user-facing-i18n',
    semanticKey: 'code-standards.cs-033',
    title: 'CS-033 user-facing i18n governance',
    description:
      'Require user-facing text in apps and packages to flow through shared i18n surfaces instead of hardcoded single-language copy.',
    severity: ReviewRuleSeverity.P1,
    executionMode: ReviewRuleExecutionMode.STANDARDS_GUIDED,
    applicability: [ReviewRuleApplicability.USER_FACING_TEXT_CHANGE],
    standardsSourceRefs: [
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-033',
    ],
    enabled: true,
    metadata: {
      currentCoverage: 'partial',
      currentOwner: 'reviewer-guided inspection plus i18n parity gate',
      deterministicGap: 'No dedicated hardcoded-user-facing-text detector exists yet.',
    },
  },
  {
    ruleId: 'review-rule.cs-034-build-evidence',
    semanticKey: 'code-standards.cs-034',
    title: 'CS-034 completion build evidence',
    description:
      'Require one same-window real build before any completed or resolved claim on code-affecting changes under apps, packages, bin, or test.',
    severity: ReviewRuleSeverity.P1,
    executionMode: ReviewRuleExecutionMode.STANDARDS_GUIDED,
    applicability: [ReviewRuleApplicability.CODE_AFFECTING_CHANGE],
    standardsSourceRefs: [
      '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-034',
      '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md#completion-claim-and-review-closure-build-protocol',
    ],
    enabled: true,
    metadata: {
      currentCoverage: 'partial',
      currentOwner: 'reviewer-guided evidence check',
      deterministicGap:
        'The current repo has build execution gates but no same-window evidence projection checker.',
    },
  },
];

/**
 * Provides one reusable registry instance for the Phase A review-rule subset.
 */
export const phaseAReviewRuleRegistry = new ReviewRuleRegistry({
  rules: phaseAReviewRuleDefinitions,
});

/**
 * Provides the structured Phase A bundle for deterministic and delegated review handoff.
 */
export const phaseAProjectedReviewRuleBundle: ProjectedReviewRuleBundle =
  phaseAReviewRuleRegistry.projectRuleBundle({
    bundleId: 'bundle.review.phase-a',
    bundleVersion: '1.0.0',
    title: 'Phase A standards-native review baseline',
    description:
      'Curated review-rule subset covering contract freeze, ledger sync, lifecycle sync, i18n review, and completion build evidence baseline.',
    ruleIds: phaseAReviewRuleDefinitions.map((rule) => rule.ruleId),
    supportedFindingSourceTypes: [
      ReviewFindingSourceType.DETERMINISTIC_RULE,
      ReviewFindingSourceType.STANDARDS_GUIDED_INFERENCE,
      ReviewFindingSourceType.RISK_INFERENCE,
    ],
  });
