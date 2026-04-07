import type {
  ReviewFindingSourceType,
  ReviewRuleApplicability,
  ReviewRuleExecutionMode,
  ReviewRuleSeverity,
} from '../../constants/index.js';
import type { ReviewRuleRegistry } from '../../review-rule-registry.js';

/**
 * Defines one projected review rule anchored to repository governance sources.
 */
export interface ReviewRuleDefinition {
  ruleId: string;
  semanticKey: string;
  title: string;
  description: string;
  severity: ReviewRuleSeverity;
  executionMode: ReviewRuleExecutionMode;
  applicability: ReviewRuleApplicability[];
  standardsSourceRefs: string[];
  deterministicCheckIds?: string[];
  projectedPackRefs?: string[];
  enabled: boolean;
  metadata?: Record<string, string>;
}

/**
 * Defines options used to initialize review-rule registry state.
 */
export interface ReviewRuleRegistryOptions {
  rules?: ReviewRuleDefinition[];
}

/**
 * Defines list filters used by review-rule registry queries.
 */
export interface ReviewRuleListOptions {
  executionModes?: ReviewRuleExecutionMode[];
  applicability?: ReviewRuleApplicability;
  includeDisabled?: boolean;
}

/**
 * Defines bundle projection options consumed by the review-rule registry.
 */
export interface ReviewRuleBundleProjectionOptions {
  bundleId: string;
  bundleVersion: string;
  title: string;
  description: string;
  ruleIds?: string[];
  executionModes?: ReviewRuleExecutionMode[];
  applicability?: ReviewRuleApplicability;
  includeDisabled?: boolean;
  supportedFindingSourceTypes: ReviewFindingSourceType[];
}

/**
 * Defines one projected rule bundle handed to deterministic or delegated review runtimes.
 */
export interface ProjectedReviewRuleBundle {
  bundleId: string;
  bundleVersion: string;
  title: string;
  description: string;
  standardsSourceRefs: string[];
  projectedPackRefs: string[];
  supportedFindingSourceTypes: ReviewFindingSourceType[];
  rules: ReviewRuleDefinition[];
}

/**
 * Defines minimal reader contract required by review-rule consumers.
 */
export interface ReviewRuleRegistryReader {
  /**
   * Returns one projected review rule by id.
   * @param ruleId Stable projected rule identifier.
   * @returns One normalized rule definition when present.
   */
  getRule(ruleId: string): ReviewRuleDefinition | undefined;

  /**
   * Lists normalized review rules under optional filters.
   * @param options Optional query filters.
   * @returns Stable list of rule definitions.
   */
  listRules(options?: ReviewRuleListOptions): ReviewRuleDefinition[];

  /**
   * Projects one structured rule bundle for review execution.
   * @param options Bundle projection metadata and filters.
   * @returns One normalized projected bundle.
   */
  projectRuleBundle(options: ReviewRuleBundleProjectionOptions): ProjectedReviewRuleBundle;
}

/**
 * Defines one runtime-assembled review-rule bundle with registry provenance.
 */
export interface ReviewRuleProjectionResult {
  bundle: ProjectedReviewRuleBundle;
  registry: ReviewRuleRegistry;
}
