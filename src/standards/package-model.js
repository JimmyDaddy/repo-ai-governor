import { validateSchemaDocument } from "../config/schema/validator.js";
import { cloneValue } from "../utils/common.js";

export const STANDARDS_PACKAGE_ID = "official-base";
export const STANDARDS_PACKAGE_PRESET = "official/base";
export const STANDARDS_CATEGORIES = Object.freeze([
  "code",
  "engineering",
  "process",
  "quality",
  "collaboration"
]);
export const STANDARDS_RULE_LEVELS = Object.freeze(["required", "recommended"]);
export const STANDARDS_CONSUMERS = Object.freeze([
  "init",
  "plan",
  "check",
  "review",
  "review-verify",
  "report"
]);

function createLocalizedText(zhCN, enUS) {
  return {
    "zh-CN": zhCN,
    "en-US": enUS
  };
}

function createCategory(id, zhCNName, enUSName, zhCNDescription, enUSDescription) {
  return {
    id,
    name: createLocalizedText(zhCNName, enUSName),
    description: createLocalizedText(zhCNDescription, enUSDescription)
  };
}

export function validateStandardsPackage(standardsPackage) {
  const candidate = validateSchemaDocument("standardsPackage", standardsPackage);
  const categoryIds = new Set();
  const ruleIds = new Set();

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
      throw new TypeError(`Unknown standards rule category "${rule.category}" for rule "${rule.id}"`);
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
        "Provides the model skeleton for code, engineering, process, quality, and collaboration standards."
      ),
      preset: STANDARDS_PACKAGE_PRESET
    },
    locales: {
      default: "zh-CN",
      supported: ["zh-CN", "en-US"]
    },
    categories: [
      createCategory("code", "代码规范", "Code Standards", "定义代码风格、目录、注释与测试要求。", "Defines code style, structure, comments, and testing expectations."),
      createCategory("engineering", "工程规范", "Engineering Standards", "定义提交、依赖、发布与 CI 约定。", "Defines commit, dependency, release, and CI conventions."),
      createCategory("process", "流程规范", "Process Standards", "定义方案、拆解、实现、自测与评审流程。", "Defines planning, breakdown, implementation, self-check, and review workflow expectations."),
      createCategory("quality", "质量规范", "Quality Standards", "定义 lint、类型检查、测试、安全与回归要求。", "Defines lint, type check, test, security, and regression expectations."),
      createCategory("collaboration", "协作规范", "Collaboration Standards", "定义沟通、风险提示、PR 描述与回滚信息。", "Defines communication, risk callouts, PR descriptions, and rollback information.")
    ],
    rules: []
  })
);

export function createStandardsRule(rule) {
  return validateStandardsPackage({
    ...cloneValue(OFFICIAL_BASE_PACKAGE_SKELETON),
    rules: [rule]
  }).rules[0];
}

export function listStandardsCategoryIds(standardsPackage = OFFICIAL_BASE_PACKAGE_SKELETON) {
  return standardsPackage.categories.map((category) => category.id);
}

export function groupRulesByCategory(standardsPackage) {
  const validatedPackage = validateStandardsPackage(standardsPackage);

  return validatedPackage.categories.map((category) => ({
    ...category,
    rules: validatedPackage.rules.filter((rule) => rule.category === category.id)
  }));
}

export function renderRuleView(rule, options = {}) {
  const locale = options.locale ?? "zh-CN";
  const view = options.view ?? "human";
  const selectedView = rule.views[view];

  if (!selectedView) {
    throw new TypeError(`Unsupported standards view: ${view}`);
  }

  if (view === "ai") {
    return {
      id: rule.id,
      category: rule.category,
      level: rule.level,
      consumers: rule.consumers,
      instruction: selectedView.instruction[locale],
      verification: selectedView.verification?.[locale] ?? null,
      blockOnViolation: rule.automation.blockOnViolation,
      severity: rule.automation.severity
    };
  }

  return {
    id: rule.id,
    category: rule.category,
    level: rule.level,
    title: rule.title[locale],
    summary: selectedView.summary[locale],
    rationale: selectedView.rationale?.[locale] ?? null,
    remediation: selectedView.remediation?.[locale] ?? null
  };
}
