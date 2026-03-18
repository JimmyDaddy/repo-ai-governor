import type {
  STANDARDS_AUTOMATION_SEVERITIES,
  STANDARDS_CATEGORIES,
  STANDARDS_CONSUMERS,
  STANDARDS_PACKAGE_KINDS,
  STANDARDS_PACKAGE_SCHEMA_VERSIONS,
  STANDARDS_RULE_LEVELS,
  STANDARDS_RULE_VIEWS,
} from "../../constants/standards-package.js";
import type { AiRuleView, HumanRuleView } from "../interfaces/standards-package.interface.js";

export type StandardsCategoryId = (typeof STANDARDS_CATEGORIES)[number];

export type StandardsRuleLevel = (typeof STANDARDS_RULE_LEVELS)[number];

export type StandardsConsumer = (typeof STANDARDS_CONSUMERS)[number];

export type StandardsAutomationSeverity = (typeof STANDARDS_AUTOMATION_SEVERITIES)[number];

export type StandardsRuleView = (typeof STANDARDS_RULE_VIEWS)[number];

export type StandardsPackageKind = (typeof STANDARDS_PACKAGE_KINDS)[number];

export type StandardsPackageSchemaVersion = (typeof STANDARDS_PACKAGE_SCHEMA_VERSIONS)[number];

export type RenderedRuleView = AiRuleView | HumanRuleView;
