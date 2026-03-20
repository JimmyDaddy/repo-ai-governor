import type { StandardsRenderTarget } from "../../constants/index.js";

/**
 * Defines one interpolation payload used by rule rendering.
 */
export type StandardsRenderInterpolation = Record<string, string>;

/**
 * Defines locale-target template map for one semantic standards rule.
 */
export type StandardsRuleLocalizedTemplateMap = Record<
  string,
  Record<StandardsRenderTarget, string>
>;
