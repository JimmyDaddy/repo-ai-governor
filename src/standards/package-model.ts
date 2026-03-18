import { validateSchemaDocument } from "../config/schema/validator.js";
import { LocaleEnum } from "../constants/locale.js";
import {
  STANDARDS_AUTOMATION_SEVERITIES,
  STANDARDS_CATEGORIES,
  STANDARDS_CONSUMERS,
  STANDARDS_PACKAGE_KINDS,
  STANDARDS_PACKAGE_SCHEMA_VERSIONS,
  STANDARDS_RULE_LEVELS,
  STANDARDS_RULE_VIEWS,
  StandardsAutomationSeverityEnum,
  StandardsCategoryEnum,
  StandardsPackageKindEnum,
  StandardsPackageSchemaVersionEnum,
  StandardsRuleViewEnum,
} from "../constants/standards-package.js";
import type {
  RenderedRuleView,
  StandardsCategoryId,
  StandardsRuleLevel,
} from "../types/aliases/standards.type.js";
import type {
  AiRuleView,
  HumanRuleView,
  LocalizedText,
  RenderRuleViewOptions,
  StandardsCategory,
  StandardsPackage,
  StandardsRule,
} from "../types/interfaces/standards-package.interface.js";
import { cloneValue } from "../utils/common.js";
export type {
  StandardsCategoryId,
  StandardsRuleLevel,
  StandardsConsumer,
  StandardsAutomationSeverity,
  StandardsRuleView,
  RenderedRuleView,
} from "../types/aliases/standards.type.js";
export type {
  LocalizedText,
  StandardsCategory,
  StandardsAppliesTo,
  StandardsAutomation,
  StandardsAiView,
  StandardsHumanView,
  StandardsRuleViews,
  StandardsRule,
  StandardsPackage,
  RenderRuleViewOptions,
  AiRuleView,
  HumanRuleView,
} from "../types/interfaces/standards-package.interface.js";

export const STANDARDS_PACKAGE_ID = "official-base";
export const STANDARDS_PACKAGE_PRESET = "official/base";
export {
  STANDARDS_CATEGORIES,
  STANDARDS_RULE_LEVELS,
  STANDARDS_CONSUMERS,
  STANDARDS_AUTOMATION_SEVERITIES,
  STANDARDS_RULE_VIEWS,
  STANDARDS_PACKAGE_KINDS,
  STANDARDS_PACKAGE_SCHEMA_VERSIONS,
};

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
    version: StandardsPackageSchemaVersionEnum.V1,
    kind: StandardsPackageKindEnum.StandardsPackage,
    meta: {
      name: createLocalizedText("官方基础规范包", "Official Base Standards Package"),
      description: createLocalizedText(
        "提供代码、工程、流程、质量、协作五类规范的数据模型骨架。",
        "Provides the model skeleton for code, engineering, process, quality, and collaboration standards.",
      ),
      preset: STANDARDS_PACKAGE_PRESET,
    },
    locales: {
      default: LocaleEnum.ZhCN,
      supported: [LocaleEnum.ZhCN, LocaleEnum.EnUS],
    },
    categories: [
      createCategory(
        StandardsCategoryEnum.Code,
        "代码规范",
        "Code Standards",
        "定义代码风格、目录、注释与测试要求。",
        "Defines code style, structure, comments, and testing expectations.",
      ),
      createCategory(
        StandardsCategoryEnum.Engineering,
        "工程规范",
        "Engineering Standards",
        "定义提交、依赖、发布与 CI 约定。",
        "Defines commit, dependency, release, and CI conventions.",
      ),
      createCategory(
        StandardsCategoryEnum.Process,
        "流程规范",
        "Process Standards",
        "定义方案、拆解、实现、自测与评审流程。",
        "Defines planning, breakdown, implementation, self-check, and review workflow expectations.",
      ),
      createCategory(
        StandardsCategoryEnum.Quality,
        "质量规范",
        "Quality Standards",
        "定义 lint、类型检查、测试、安全与回归要求。",
        "Defines lint, type check, test, security, and regression expectations.",
      ),
      createCategory(
        StandardsCategoryEnum.Collaboration,
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
  const locale = options.locale ?? LocaleEnum.ZhCN;
  const view = options.view ?? StandardsRuleViewEnum.Human;

  if (view === StandardsRuleViewEnum.Ai) {
    const aiView = rule.views.ai;

    return {
      id: rule.id,
      category: rule.category,
      level: rule.level,
      consumers: rule.consumers,
      instruction: localizedValue(aiView.instruction, locale),
      verification: localizedValue(aiView.verification, locale),
      blockOnViolation: rule.automation?.blockOnViolation ?? false,
      severity: rule.automation?.severity ?? StandardsAutomationSeverityEnum.Warn,
    };
  }

  if (view !== StandardsRuleViewEnum.Human) {
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
