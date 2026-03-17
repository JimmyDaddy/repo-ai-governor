import { validateSchemaDocument } from "../config/schema/validator.js";
import {
  STANDARDS_CATEGORIES,
  STANDARDS_CONSUMERS,
  STANDARDS_RULE_LEVELS,
  type StandardsCategoryEnum,
  type StandardsConsumerEnum,
  type StandardsRuleLevelEnum,
} from "../constants/standards-package.js";
import { cloneValue } from "../utils/common.js";

export type LocalizedText = {
  "zh-CN": string;
  "en-US": string;
};

export const STANDARDS_PACKAGE_ID = "official-base";
export const STANDARDS_PACKAGE_PRESET = "official/base";
export { STANDARDS_CATEGORIES, STANDARDS_RULE_LEVELS, STANDARDS_CONSUMERS };

export type StandardsCategoryId = `${StandardsCategoryEnum}`;

export type StandardsRuleLevel = `${StandardsRuleLevelEnum}`;

export type StandardsConsumer = `${StandardsConsumerEnum}`;

export type StandardsCategory = {
  id: StandardsCategoryId;
  name: LocalizedText;
  description: LocalizedText;
};

export type StandardsAppliesTo = {
  languages: string[];
  frameworks: string[];
  paths: string[];
  tags: string[];
};

export type StandardsAutomation = {
  blockOnViolation: boolean;
  severity: "error" | "warn" | "info";
  stages: string[];
};

export type StandardsAiView = {
  instruction: LocalizedText;
  verification?: LocalizedText;
};

export type StandardsHumanView = {
  summary: LocalizedText;
  rationale?: LocalizedText;
  remediation?: LocalizedText;
};

export type StandardsRuleViews = {
  ai: StandardsAiView;
  human: StandardsHumanView;
};

export type StandardsRule = {
  id: string;
  category: StandardsCategoryId;
  level: StandardsRuleLevel;
  title: LocalizedText;
  statement: LocalizedText;
  appliesTo?: StandardsAppliesTo;
  consumers: StandardsConsumer[];
  automation?: StandardsAutomation;
  views: StandardsRuleViews;
};

export type StandardsPackage = {
  id: string;
  version: "1";
  kind: "standards-package";
  meta: {
    name: LocalizedText;
    description?: LocalizedText;
    preset?: string;
  };
  locales: {
    default: string;
    supported: string[];
  };
  categories: StandardsCategory[];
  rules: StandardsRule[];
};

export type RenderRuleViewOptions = {
  locale?: string;
  view?: "ai" | "human";
};

export type AiRuleView = {
  id: string;
  category: StandardsCategoryId;
  level: StandardsRuleLevel;
  consumers: StandardsConsumer[];
  instruction: string | null;
  verification: string | null;
  blockOnViolation: boolean;
  severity: "error" | "warn" | "info";
};

export type HumanRuleView = {
  id: string;
  category: StandardsCategoryId;
  level: StandardsRuleLevel;
  title: string | null;
  summary: string | null;
  rationale: string | null;
  remediation: string | null;
};

export type RenderedRuleView = AiRuleView | HumanRuleView;

function createLocalizedText(zhCN: string, enUS: string): LocalizedText {
  return {
    "zh-CN": zhCN,
    "en-US": enUS,
  };
}

function createCategory(
  id: StandardsCategoryId,
  zhCNName: string,
  enUSName: string,
  zhCNDescription: string,
  enUSDescription: string,
): StandardsCategory {
  return {
    id,
    name: createLocalizedText(zhCNName, enUSName),
    description: createLocalizedText(zhCNDescription, enUSDescription),
  };
}

export function validateStandardsPackage(standardsPackage: unknown): StandardsPackage {
  const candidate = validateSchemaDocument(
    "standardsPackage",
    standardsPackage,
  ) as StandardsPackage;
  const categoryIds = new Set<string>();
  const ruleIds = new Set<string>();

  for (const category of candidate.categories) {
    if (categoryIds.has(category.id)) {
      throw new TypeError(`Duplicate standards category id: ${category.id}`);
    }

    categoryIds.add(category.id);
  }

  for (const rule of candidate.rules) {
    if (ruleIds.has(rule.id)) {
      throw new TypeError(`Duplicate standards rule id: ${rule.id}`);
    }

    if (!categoryIds.has(rule.category)) {
      throw new TypeError(
        `Unknown standards rule category "${rule.category}" for rule "${rule.id}"`,
      );
    }

    ruleIds.add(rule.id);
  }

  return candidate;
}

export const OFFICIAL_BASE_PACKAGE_SKELETON = Object.freeze(
  validateStandardsPackage({
    id: STANDARDS_PACKAGE_ID,
    version: "1",
    kind: "standards-package",
    meta: {
      name: createLocalizedText("官方基础规范包", "Official Base Standards Package"),
      description: createLocalizedText(
        "提供代码、工程、流程、质量、协作五类规范的数据模型骨架。",
        "Provides the model skeleton for code, engineering, process, quality, and collaboration standards.",
      ),
      preset: STANDARDS_PACKAGE_PRESET,
    },
    locales: {
      default: "zh-CN",
      supported: ["zh-CN", "en-US"],
    },
    categories: [
      createCategory(
        "code",
        "代码规范",
        "Code Standards",
        "定义代码风格、目录、注释与测试要求。",
        "Defines code style, structure, comments, and testing expectations.",
      ),
      createCategory(
        "engineering",
        "工程规范",
        "Engineering Standards",
        "定义提交、依赖、发布与 CI 约定。",
        "Defines commit, dependency, release, and CI conventions.",
      ),
      createCategory(
        "process",
        "流程规范",
        "Process Standards",
        "定义方案、拆解、实现、自测与评审流程。",
        "Defines planning, breakdown, implementation, self-check, and review workflow expectations.",
      ),
      createCategory(
        "quality",
        "质量规范",
        "Quality Standards",
        "定义 lint、类型检查、测试、安全与回归要求。",
        "Defines lint, type check, test, security, and regression expectations.",
      ),
      createCategory(
        "collaboration",
        "协作规范",
        "Collaboration Standards",
        "定义沟通、风险提示、PR 描述与回滚信息。",
        "Defines communication, risk callouts, PR descriptions, and rollback information.",
      ),
    ],
    rules: [],
  }),
);

export function createStandardsRule(rule: StandardsRule): StandardsRule {
  return validateStandardsPackage({
    ...cloneValue(OFFICIAL_BASE_PACKAGE_SKELETON),
    rules: [rule],
  }).rules[0];
}

export function listStandardsCategoryIds(
  standardsPackage: StandardsPackage = OFFICIAL_BASE_PACKAGE_SKELETON as StandardsPackage,
): StandardsCategoryId[] {
  return standardsPackage.categories.map((category) => category.id);
}

export function groupRulesByCategory(
  standardsPackage: StandardsPackage,
): Array<StandardsCategory & { rules: StandardsRule[] }> {
  const validatedPackage = validateStandardsPackage(standardsPackage);

  return validatedPackage.categories.map((category) => ({
    ...category,
    rules: validatedPackage.rules.filter((rule) => rule.category === category.id),
  }));
}

function localizedValue(text: LocalizedText | undefined, locale: string): string | null {
  if (!text) {
    return null;
  }

  return text[locale as keyof LocalizedText] ?? null;
}

export function renderRuleView(
  rule: StandardsRule,
  options: RenderRuleViewOptions = {},
): RenderedRuleView {
  const locale = options.locale ?? "zh-CN";
  const view = options.view ?? "human";

  if (view === "ai") {
    const aiView = rule.views.ai;

    return {
      id: rule.id,
      category: rule.category,
      level: rule.level,
      consumers: rule.consumers,
      instruction: localizedValue(aiView.instruction, locale),
      verification: localizedValue(aiView.verification, locale),
      blockOnViolation: rule.automation?.blockOnViolation ?? false,
      severity: rule.automation?.severity ?? "warn",
    };
  }

  if (view !== "human") {
    throw new TypeError(`Unsupported standards view: ${view}`);
  }

  const humanView = rule.views.human;

  return {
    id: rule.id,
    category: rule.category,
    level: rule.level,
    title: localizedValue(rule.title, locale),
    summary: localizedValue(humanView.summary, locale),
    rationale: localizedValue(humanView.rationale, locale),
    remediation: localizedValue(humanView.remediation, locale),
  };
}
