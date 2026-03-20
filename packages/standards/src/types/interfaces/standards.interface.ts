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

/**
 * Defines minimal renderer contract required by agents projector.
 */
export interface StandardsRuleRendererReader {
  /**
   * Renders rules for one target under optional scope/locale constraints.
   * @param input Render request payload.
   * @returns Structured render result.
   */
  render(input: RuleRendererRenderInput): RuleRendererRenderResult;
}

/**
 * Defines one projected source-pack reference entry.
 */
export interface AgentsProjectionSourcePackRef {
  packId: string;
  packVersion: string;
}

/**
 * Defines one parity mismatch record between target projections.
 */
export interface StandardsProjectionParityViolation {
  semanticKey: string;
  target: StandardsRenderTarget;
  reason: string;
  expectedRuleId?: string;
  actualRuleId?: string;
  expectedSourcePackId?: string;
  actualSourcePackId?: string;
  expectedSourcePackVersion?: string;
  actualSourcePackVersion?: string;
}

/**
 * Defines parity-check result between human/ai/agents projections.
 */
export interface StandardsProjectionParityResult {
  isAligned: boolean;
  violations: StandardsProjectionParityViolation[];
}

/**
 * Defines minimal clock contract consumed by agents projector.
 */
export interface AgentsProjectionNowProviderContract {
  /**
   * Samples one timestamp for projection metadata.
   * @returns Current clock value as a Date instance.
   */
  now(): Date;
}

/**
 * Defines options used to initialize agents projector.
 */
export interface AgentsProjectorOptions {
  renderer: StandardsRuleRendererReader;
  defaultProjectionTarget?: string;
  nowProvider?: AgentsProjectionNowProviderContract;
}

/**
 * Defines input payload for one agents projection execution.
 */
export interface AgentsProjectorProjectInput {
  projectionTarget?: string;
  locale?: string;
  scope?: StandardsPackScope;
  enforceParity?: boolean;
  interpolationByRuleId?: Record<string, StandardsRenderInterpolation>;
  interpolationBySemanticKey?: Record<string, StandardsRenderInterpolation>;
}

/**
 * Defines structured result payload returned by agents projector.
 */
export interface AgentsProjectorProjectResult {
  projectionTarget: string;
  projectedAt: string;
  locale: string;
  sourcePackRefs: AgentsProjectionSourcePackRef[];
  parity: StandardsProjectionParityResult;
  renderedRules: RenderedStandardsRule[];
  projectedContent: string;
}
