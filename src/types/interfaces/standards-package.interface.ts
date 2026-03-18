import type { Locale } from "../aliases/locale.type.js";
import type {
  StandardsAutomationSeverity,
  StandardsCategoryId,
  StandardsConsumer,
  StandardsPackageKind,
  StandardsPackageSchemaVersion,
  StandardsRuleLevel,
  StandardsRuleView,
} from "../aliases/standards.type.js";

export interface LocalizedText extends Record<Locale, string> {}

export interface StandardsCategory {
  id: StandardsCategoryId;
  name: LocalizedText;
  description: LocalizedText;
}

export interface StandardsAppliesTo {
  languages: string[];
  frameworks: string[];
  paths: string[];
  tags: string[];
}

export interface StandardsAutomation {
  blockOnViolation: boolean;
  severity: StandardsAutomationSeverity;
  stages: string[];
}

export interface StandardsAiView {
  instruction: LocalizedText;
  verification?: LocalizedText;
}

export interface StandardsHumanView {
  summary: LocalizedText;
  rationale?: LocalizedText;
  remediation?: LocalizedText;
}

export interface StandardsRuleViews {
  ai: StandardsAiView;
  human: StandardsHumanView;
}

export interface StandardsRule {
  id: string;
  category: StandardsCategoryId;
  level: StandardsRuleLevel;
  title: LocalizedText;
  statement: LocalizedText;
  appliesTo?: StandardsAppliesTo;
  consumers: StandardsConsumer[];
  automation?: StandardsAutomation;
  views: StandardsRuleViews;
}

export interface StandardsPackageMeta {
  name: LocalizedText;
  description?: LocalizedText;
  preset?: string;
}

export interface StandardsPackageLocales {
  default: string;
  supported: string[];
}

export interface StandardsPackage {
  id: string;
  version: StandardsPackageSchemaVersion;
  kind: StandardsPackageKind;
  meta: StandardsPackageMeta;
  locales: StandardsPackageLocales;
  categories: StandardsCategory[];
  rules: StandardsRule[];
}

export interface RenderRuleViewOptions {
  locale?: string;
  view?: StandardsRuleView;
}

export interface AiRuleView {
  id: string;
  category: StandardsCategoryId;
  level: StandardsRuleLevel;
  consumers: StandardsConsumer[];
  instruction: string | null;
  verification: string | null;
  blockOnViolation: boolean;
  severity: StandardsAutomationSeverity;
}

export interface HumanRuleView {
  id: string;
  category: StandardsCategoryId;
  level: StandardsRuleLevel;
  title: string | null;
  summary: string | null;
  rationale: string | null;
  remediation: string | null;
}
