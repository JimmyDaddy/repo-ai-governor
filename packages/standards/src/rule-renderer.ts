import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  DEFAULT_STANDARDS_FALLBACK_LOCALE,
  DEFAULT_STANDARDS_RENDER_LOCALE,
  STANDARDS_RENDER_TARGET_VALUES,
} from "./constants/index.js";
import type {
  RenderedStandardsRule,
  ResolvedStandardsRule,
  RuleRendererOptions,
  RuleRendererRenderInput,
  RuleRendererRenderResult,
} from "./types/index.js";
import { readRequiredString } from "./utils/index.js";

interface NormalizedRuleRendererOptions {
  registry: RuleRendererOptions["registry"];
  defaultLocale: string;
  fallbackLocale: string;
}

/**
 * Renders standards rules into target-specific strings with locale fallback.
 *
 * Why this exists:
 * rendering should be deterministic and semantic-key aligned so human/ai/agents
 * views are generated from one shared rule source instead of separate documents.
 */
export class RuleRenderer {
  private readonly resolvedOptions: NormalizedRuleRendererOptions;

  public constructor(options: RuleRendererOptions) {
    this.resolvedOptions = this.resolveOptions(options);
  }

  /**
   * Renders standards rules for one target and optional scope/locale.
   * @param input Render input payload.
   * @returns Structured render result with per-rule provenance.
   */
  public render(input: RuleRendererRenderInput): RuleRendererRenderResult {
    if (!input || typeof input !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        "Rule renderer input must be an object.",
      );
    }

    const target = this.readRenderTarget(input.target, "input.target");
    const requestedLocale =
      input.locale === undefined ? this.resolvedOptions.defaultLocale : input.locale;
    const baseLocale = readRequiredString(
      requestedLocale,
      "input.locale",
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    const resolvedRules = this.resolvedOptions.registry.resolveRules({
      scope: input.scope,
    });

    const renderedRules: RenderedStandardsRule[] = resolvedRules.map((resolvedRule) =>
      this.renderResolvedRule(
        resolvedRule,
        target,
        baseLocale,
        this.resolveInterpolationPayload(input, resolvedRule),
      ),
    );

    return {
      target,
      locale: baseLocale,
      renderedRules,
    };
  }

  /**
   * Normalizes and validates renderer options.
   * @param options Raw renderer options.
   * @returns Normalized options.
   */
  private resolveOptions(options: RuleRendererOptions): NormalizedRuleRendererOptions {
    if (!options || typeof options !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        "Rule renderer options must be an object.",
      );
    }

    if (!options.registry || typeof options.registry.resolveRules !== "function") {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        'Rule renderer option "registry" must provide resolveRules().',
      );
    }

    const defaultLocale = readRequiredString(
      options.defaultLocale ?? DEFAULT_STANDARDS_RENDER_LOCALE,
      "options.defaultLocale",
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    const fallbackLocale = readRequiredString(
      options.fallbackLocale ?? DEFAULT_STANDARDS_FALLBACK_LOCALE,
      "options.fallbackLocale",
      GovernorErrorCode.RULE_RENDER_INVALID,
    );

    return {
      registry: options.registry,
      defaultLocale,
      fallbackLocale,
    };
  }

  /**
   * Renders one resolved standards rule with locale fallback and interpolation.
   * @param resolvedRule Resolved standards rule.
   * @param target Render target.
   * @param baseLocale Requested locale.
   * @param interpolation Optional interpolation payload.
   * @returns Rendered rule row.
   */
  private renderResolvedRule(
    resolvedRule: ResolvedStandardsRule,
    target: RuleRendererRenderInput["target"],
    baseLocale: string,
    interpolation?: Record<string, string>,
  ): RenderedStandardsRule {
    const localizedTemplate = this.resolveLocalizedTemplate(resolvedRule, target, baseLocale);
    const renderedText = this.applyInterpolation(localizedTemplate.template, interpolation);

    return {
      ruleId: resolvedRule.definition.ruleId,
      semanticKey: resolvedRule.definition.semanticKey,
      severity: resolvedRule.definition.severity,
      target,
      locale: localizedTemplate.locale,
      text: renderedText,
      sourcePackId: resolvedRule.sourcePackId,
      sourcePackVersion: resolvedRule.sourcePackVersion,
    };
  }

  /**
   * Resolves interpolation payload by stable precedence.
   * @param input Render input payload.
   * @param resolvedRule Resolved standards rule.
   * @returns Interpolation payload when available.
   */
  private resolveInterpolationPayload(
    input: RuleRendererRenderInput,
    resolvedRule: ResolvedStandardsRule,
  ): Record<string, string> | undefined {
    const interpolationByRuleId = input.interpolationByRuleId?.[resolvedRule.definition.ruleId];
    if (interpolationByRuleId !== undefined) {
      return interpolationByRuleId;
    }

    return input.interpolationBySemanticKey?.[resolvedRule.definition.semanticKey];
  }

  /**
   * Resolves locale-specific template for one rule and target.
   * @param resolvedRule Resolved standards rule.
   * @param target Render target.
   * @param baseLocale Requested locale.
   * @returns Locale and template pair.
   */
  private resolveLocalizedTemplate(
    resolvedRule: ResolvedStandardsRule,
    target: RuleRendererRenderInput["target"],
    baseLocale: string,
  ): { locale: string; template: string } {
    const localeCandidates = this.collectLocaleCandidates(baseLocale);

    for (const candidate of localeCandidates) {
      const matchedLocale = this.matchLocaleKey(candidate, resolvedRule);
      if (!matchedLocale) {
        continue;
      }

      const templateRecord = resolvedRule.definition.localizedTemplates[matchedLocale];
      const template = templateRecord?.[target];
      if (template?.trim()) {
        return {
          locale: matchedLocale,
          template,
        };
      }
    }

    throw new RuntimeError(
      GovernorErrorCode.RULE_RENDER_TEMPLATE_MISSING,
      "Rule renderer cannot resolve localized template for target.",
      {
        ruleId: resolvedRule.definition.ruleId,
        semanticKey: resolvedRule.definition.semanticKey,
        target,
        requestedLocale: baseLocale,
      },
    );
  }

  /**
   * Builds locale fallback chain in deterministic priority.
   * @param baseLocale Requested locale.
   * @returns Ordered locale candidates.
   */
  private collectLocaleCandidates(baseLocale: string): string[] {
    const candidates = [
      baseLocale,
      this.toLanguageBase(baseLocale),
      this.resolvedOptions.defaultLocale,
      this.toLanguageBase(this.resolvedOptions.defaultLocale),
      this.resolvedOptions.fallbackLocale,
      this.toLanguageBase(this.resolvedOptions.fallbackLocale),
    ].filter((candidate): candidate is string => Boolean(candidate));

    return Array.from(new Set(candidates));
  }

  /**
   * Matches one candidate locale to available locale keys for a rule.
   * @param candidate Locale candidate.
   * @param resolvedRule Resolved standards rule.
   * @returns Matched locale key when available.
   */
  private matchLocaleKey(
    candidate: string,
    resolvedRule: ResolvedStandardsRule,
  ): string | undefined {
    const localeKeys = Object.keys(resolvedRule.definition.localizedTemplates);
    const exactMatch = localeKeys.find(
      (localeKey) => localeKey.toLowerCase() === candidate.toLowerCase(),
    );
    if (exactMatch) {
      return exactMatch;
    }

    const candidateBase = this.toLanguageBase(candidate);
    if (!candidateBase) {
      return undefined;
    }

    return localeKeys.find((localeKey) => {
      const localeBase = this.toLanguageBase(localeKey);
      return localeBase?.toLowerCase() === candidateBase.toLowerCase();
    });
  }

  /**
   * Applies interpolation values with lightweight token replacement.
   * @param template Raw template text.
   * @param interpolation Optional interpolation map.
   * @returns Rendered text.
   */
  private applyInterpolation(template: string, interpolation?: Record<string, string>): string {
    if (!interpolation || Object.keys(interpolation).length === 0) {
      return template;
    }

    let renderedText = template;
    // Why this exists:
    // rule templates only need deterministic placeholder replacement and should
    // avoid pulling heavy formatting runtime into stage-4 baseline.
    for (const [key, value] of Object.entries(interpolation)) {
      const normalizedKey = readRequiredString(
        key,
        "interpolation.key",
        GovernorErrorCode.RULE_RENDER_INVALID,
      );
      const normalizedValue = readRequiredString(
        value,
        `interpolation.${key}`,
        GovernorErrorCode.RULE_RENDER_INVALID,
      );
      const tokenPattern = new RegExp(
        `\\{\\{\\s*${this.escapeRegExp(normalizedKey)}\\s*\\}\\}`,
        "g",
      );
      renderedText = renderedText.replace(tokenPattern, normalizedValue);
    }

    return renderedText;
  }

  /**
   * Escapes regexp-special characters from one interpolation key.
   * @param value Raw key text.
   * @returns Escaped key text.
   */
  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Validates one render-target enum value.
   * @param value Raw value.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized target value.
   */
  private readRenderTarget(value: unknown, fieldName: string): RuleRendererRenderInput["target"] {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    if (!STANDARDS_RENDER_TARGET_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        `Field "${fieldName}" contains unsupported target value.`,
        {
          value: normalizedValue,
          allowedValues: Array.from(STANDARDS_RENDER_TARGET_VALUES),
        },
      );
    }

    return normalizedValue as RuleRendererRenderInput["target"];
  }

  /**
   * Collapses locale code to language base.
   * @param locale Locale code.
   * @returns Language base value.
   */
  private toLanguageBase(locale: string | undefined): string | undefined {
    if (!locale) {
      return undefined;
    }

    const normalizedLocale = locale.trim();
    if (!normalizedLocale) {
      return undefined;
    }

    return normalizedLocale.split("-")[0];
  }
}
