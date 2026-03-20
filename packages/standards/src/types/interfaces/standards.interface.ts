import type {
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from "../../constants/index.js";
import type {
  StandardsRenderInterpolation,
  StandardsRuleLocalizedTemplateMap,
} from "../aliases/index.js";

/**
 * Defines one standards rule with semantic identity and localized templates.
 */
export interface StandardsRuleDefinition {
  ruleId: string;
  semanticKey: string;
  severity: StandardsRuleSeverity;
  enabled: boolean;
  localizedTemplates: StandardsRuleLocalizedTemplateMap;
  metadata?: Record<string, string>;
}

/**
 * Defines one standards pack payload stored in registry.
 */
export interface StandardsPack {
  packId: string;
  packVersion: string;
  packSource: StandardsPackSource;
  scope: StandardsPackScope;
  mergePrecedence: number;
  status: StandardsPackStatus;
  rules: StandardsRuleDefinition[];
}

/**
 * Defines options used to initialize standards pack registry.
 */
export interface StandardsPackRegistryOptions {
  packs?: StandardsPack[];
}

/**
 * Defines pack-list filters used by registry queries.
 */
export interface StandardsPackListOptions {
  scope?: StandardsPackScope;
  status?: StandardsPackStatus;
  includeDeprecated?: boolean;
}

/**
 * Defines rule resolution filters consumed by registry and renderer.
 */
export interface StandardsRuleResolveOptions {
  scope?: StandardsPackScope;
  includeDeprecated?: boolean;
}

/**
 * Defines one resolved rule entry with provenance metadata.
 */
export interface ResolvedStandardsRule {
  sourcePackId: string;
  sourcePackVersion: string;
  sourcePackSource: StandardsPackSource;
  sourcePackPrecedence: number;
  definition: StandardsRuleDefinition;
}

/**
 * Defines minimal reader contract required by rule renderer.
 */
export interface StandardsPackRegistryReader {
  resolveRules(options?: StandardsRuleResolveOptions): ResolvedStandardsRule[];
}

/**
 * Defines options used to initialize rule renderer.
 */
export interface RuleRendererOptions {
  registry: StandardsPackRegistryReader;
  defaultLocale?: string;
  fallbackLocale?: string;
}

/**
 * Defines input payload for rendering standards rules.
 */
export interface RuleRendererRenderInput {
  target: StandardsRenderTarget;
  locale?: string;
  scope?: StandardsPackScope;
  interpolationByRuleId?: Record<string, StandardsRenderInterpolation>;
  interpolationBySemanticKey?: Record<string, StandardsRenderInterpolation>;
}

/**
 * Defines one rendered rule row emitted by renderer.
 */
export interface RenderedStandardsRule {
  ruleId: string;
  semanticKey: string;
  severity: StandardsRuleSeverity;
  target: StandardsRenderTarget;
  locale: string;
  text: string;
  sourcePackId: string;
  sourcePackVersion: string;
}

/**
 * Defines structured renderer output payload.
 */
export interface RuleRendererRenderResult {
  target: StandardsRenderTarget;
  locale: string;
  renderedRules: RenderedStandardsRule[];
}
