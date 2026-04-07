import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  REVIEW_FINDING_SOURCE_TYPE_VALUES,
  REVIEW_RULE_APPLICABILITY_VALUES,
  REVIEW_RULE_EXECUTION_MODE_VALUES,
  REVIEW_RULE_SEVERITY_VALUES,
  type ReviewFindingSourceType,
  type ReviewRuleApplicability,
  ReviewRuleExecutionMode,
  type ReviewRuleExecutionMode as ReviewRuleExecutionModeValue,
} from './constants/index.js';
import type {
  ProjectedReviewRuleBundle,
  ReviewRuleBundleProjectionOptions,
  ReviewRuleDefinition,
  ReviewRuleListOptions,
  ReviewRuleRegistryOptions,
} from './types/index.js';
import { readRequiredString } from './utils/index.js';

/**
 * Stores and projects review-rule definitions derived from repository governance sources.
 *
 * Why this exists:
 * standards-native review needs one normalized rule catalog so deterministic checks, delegated
 * reviewers, and lifecycle closure can all consume the same projected truth.
 */
// i18n-deferred: review-rule registry validation still uses internal English diagnostics until
// packages/standards gains a shared localized validation-error factory for this package surface.
export class ReviewRuleRegistry {
  private readonly ruleById = new Map<string, ReviewRuleDefinition>();

  public constructor(options: ReviewRuleRegistryOptions = {}) {
    const rules = options.rules ?? [];
    if (!Array.isArray(rules)) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        'ReviewRuleRegistry option "rules" must be an array.',
      );
    }

    for (const rule of rules) {
      this.registerRule(rule);
    }
  }

  /**
   * Registers one normalized projected review rule.
   * @param rule Raw rule payload.
   * @returns Void.
   */
  public registerRule(rule: ReviewRuleDefinition): void {
    const normalizedRule = this.normalizeRuleDefinition(rule, 'rule');
    if (this.ruleById.has(normalizedRule.ruleId)) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        'Review rule ids must stay unique inside one registry.',
        {
          ruleId: normalizedRule.ruleId,
        },
      );
    }

    this.ruleById.set(normalizedRule.ruleId, normalizedRule);
  }

  /**
   * Returns one projected review rule by id.
   * @param ruleId Stable rule id.
   * @returns One normalized rule definition when present.
   */
  public getRule(ruleId: string): ReviewRuleDefinition | undefined {
    const normalizedRuleId = readRequiredString(
      ruleId,
      'ruleId',
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    return this.ruleById.get(normalizedRuleId);
  }

  /**
   * Lists normalized review rules under optional execution filters.
   * @param options Optional query filters.
   * @returns Stable list of rule definitions.
   */
  public listRules(options: ReviewRuleListOptions = {}): ReviewRuleDefinition[] {
    const includeDisabled = options.includeDisabled ?? false;
    const executionModes = this.normalizeEnumList(
      options.executionModes,
      'options.executionModes',
      REVIEW_RULE_EXECUTION_MODE_VALUES,
    );
    const applicability =
      options.applicability === undefined
        ? undefined
        : (this.readEnumValue(
            options.applicability,
            'options.applicability',
            REVIEW_RULE_APPLICABILITY_VALUES,
          ) as ReviewRuleApplicability);

    return Array.from(this.ruleById.values())
      .filter((rule) => {
        if (!includeDisabled && !rule.enabled) {
          return false;
        }

        if (executionModes && !executionModes.includes(rule.executionMode)) {
          return false;
        }

        if (applicability && !rule.applicability.includes(applicability)) {
          return false;
        }

        return true;
      })
      .sort((left, right) => left.ruleId.localeCompare(right.ruleId, 'en'));
  }

  /**
   * Projects one structured rule bundle for downstream review execution.
   * @param options Bundle projection metadata and filters.
   * @returns One normalized projected bundle.
   */
  public projectRuleBundle(options: ReviewRuleBundleProjectionOptions): ProjectedReviewRuleBundle {
    const bundleId = readRequiredString(
      options.bundleId,
      'options.bundleId',
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const bundleVersion = readRequiredString(
      options.bundleVersion,
      'options.bundleVersion',
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const title = readRequiredString(
      options.title,
      'options.title',
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const description = readRequiredString(
      options.description,
      'options.description',
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const supportedFindingSourceTypes = this.normalizeEnumList(
      options.supportedFindingSourceTypes,
      'options.supportedFindingSourceTypes',
      REVIEW_FINDING_SOURCE_TYPE_VALUES,
      true,
    ) as ReviewFindingSourceType[];

    const selectedRules = this.resolveBundleRules(options);
    if (selectedRules.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        'Projected review bundles must include at least one rule.',
        {
          bundleId,
        },
      );
    }

    return {
      bundleId,
      bundleVersion,
      title,
      description,
      standardsSourceRefs: this.collectUniqueStrings(
        selectedRules.flatMap((rule) => rule.standardsSourceRefs),
      ),
      projectedPackRefs: this.collectUniqueStrings(
        selectedRules.flatMap((rule) => rule.projectedPackRefs ?? []),
      ),
      supportedFindingSourceTypes,
      rules: selectedRules,
    };
  }

  private resolveBundleRules(options: ReviewRuleBundleProjectionOptions): ReviewRuleDefinition[] {
    if (options.ruleIds && options.ruleIds.length > 0) {
      const normalizedRuleIds = this.normalizeStringList(options.ruleIds, 'options.ruleIds', true);

      return normalizedRuleIds.map((ruleId) => {
        const rule = this.getRule(ruleId);
        if (!rule) {
          throw new RuntimeError(
            GovernorErrorCode.REVIEW_RULE_INVALID,
            'Projected review bundle references an unknown rule id.',
            {
              ruleId,
            },
          );
        }

        if (!options.includeDisabled && !rule.enabled) {
          throw new RuntimeError(
            GovernorErrorCode.REVIEW_RULE_INVALID,
            'Projected review bundle cannot reference a disabled rule without includeDisabled=true.',
            {
              ruleId,
            },
          );
        }

        return rule;
      });
    }

    return this.listRules({
      applicability: options.applicability,
      executionModes: options.executionModes,
      includeDisabled: options.includeDisabled,
    });
  }

  /**
   * Validates one projected review-rule payload.
   * @param rule Raw rule payload.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized rule definition.
   */
  private normalizeRuleDefinition(
    rule: ReviewRuleDefinition,
    fieldName: string,
  ): ReviewRuleDefinition {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}" must be a plain object.`,
      );
    }

    const ruleId = readRequiredString(
      rule.ruleId,
      `${fieldName}.ruleId`,
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const semanticKey = readRequiredString(
      rule.semanticKey,
      `${fieldName}.semanticKey`,
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const title = readRequiredString(
      rule.title,
      `${fieldName}.title`,
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const description = readRequiredString(
      rule.description,
      `${fieldName}.description`,
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    const severity = this.readEnumValue(
      rule.severity,
      `${fieldName}.severity`,
      REVIEW_RULE_SEVERITY_VALUES,
    ) as ReviewRuleDefinition['severity'];
    const executionMode = this.readEnumValue(
      rule.executionMode,
      `${fieldName}.executionMode`,
      REVIEW_RULE_EXECUTION_MODE_VALUES,
    ) as ReviewRuleExecutionModeValue;

    if (typeof rule.enabled !== 'boolean') {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}.enabled" must be a boolean.`,
      );
    }

    const applicability = this.normalizeEnumList(
      rule.applicability,
      `${fieldName}.applicability`,
      REVIEW_RULE_APPLICABILITY_VALUES,
      true,
    ) as ReviewRuleApplicability[];
    const standardsSourceRefs = this.normalizeStringList(
      rule.standardsSourceRefs,
      `${fieldName}.standardsSourceRefs`,
      true,
    );
    const deterministicCheckIds =
      rule.deterministicCheckIds === undefined
        ? undefined
        : this.normalizeStringList(
            rule.deterministicCheckIds,
            `${fieldName}.deterministicCheckIds`,
            true,
          );
    const projectedPackRefs =
      rule.projectedPackRefs === undefined
        ? undefined
        : this.normalizeStringList(rule.projectedPackRefs, `${fieldName}.projectedPackRefs`, true);
    const metadata =
      rule.metadata === undefined
        ? undefined
        : this.normalizeMetadata(rule.metadata, `${fieldName}.metadata`);

    if (
      executionMode === ReviewRuleExecutionMode.DETERMINISTIC &&
      (!deterministicCheckIds || deterministicCheckIds.length === 0)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}.deterministicCheckIds" must be provided for deterministic review rules.`,
        {
          ruleId,
          executionMode,
        },
      );
    }

    if (
      executionMode !== ReviewRuleExecutionMode.DETERMINISTIC &&
      deterministicCheckIds &&
      deterministicCheckIds.length > 0
    ) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}.deterministicCheckIds" is only allowed on deterministic review rules.`,
        {
          ruleId,
          executionMode,
        },
      );
    }

    return {
      ruleId,
      semanticKey,
      title,
      description,
      severity,
      executionMode,
      applicability,
      standardsSourceRefs,
      ...(deterministicCheckIds ? { deterministicCheckIds } : {}),
      ...(projectedPackRefs ? { projectedPackRefs } : {}),
      enabled: rule.enabled,
      ...(metadata ? { metadata } : {}),
    };
  }

  private normalizeMetadata(
    metadata: Record<string, string>,
    fieldName: string,
  ): Record<string, string> {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}" must be a plain object.`,
      );
    }

    const normalizedMetadata: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const normalizedKey = readRequiredString(
        key,
        `${fieldName}.key`,
        GovernorErrorCode.REVIEW_RULE_INVALID,
      );
      normalizedMetadata[normalizedKey] = readRequiredString(
        value,
        `${fieldName}.${key}`,
        GovernorErrorCode.REVIEW_RULE_INVALID,
      );
    }

    return normalizedMetadata;
  }

  private normalizeStringList(
    value: unknown,
    fieldName: string,
    requireNonEmpty: boolean,
  ): string[] {
    if (!Array.isArray(value)) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}" must be an array.`,
      );
    }

    const normalizedValues = this.collectUniqueStrings(
      value.map((entry, entryIndex) =>
        readRequiredString(
          entry,
          `${fieldName}[${entryIndex}]`,
          GovernorErrorCode.REVIEW_RULE_INVALID,
        ),
      ),
    );

    if (requireNonEmpty && normalizedValues.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}" must include at least one value.`,
      );
    }

    return normalizedValues;
  }

  private normalizeEnumList(
    value: unknown,
    fieldName: string,
    enumValues: Set<string>,
    requireNonEmpty = false,
  ): string[] | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalizedValues = this.normalizeStringList(value, fieldName, requireNonEmpty).map(
      (entry) => this.readEnumValue(entry, fieldName, enumValues),
    );

    return this.collectUniqueStrings(normalizedValues);
  }

  private collectUniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values));
  }

  private readEnumValue(value: unknown, fieldName: string, enumValues: Set<string>): string {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.REVIEW_RULE_INVALID,
    );
    if (!enumValues.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.REVIEW_RULE_INVALID,
        `Field "${fieldName}" contains unsupported value.`,
        {
          value: normalizedValue,
          allowedValues: Array.from(enumValues),
        },
      );
    }

    return normalizedValue;
  }
}
