export enum StandardsCategoryEnum {
  Code = "code",
  Engineering = "engineering",
  Process = "process",
  Quality = "quality",
  Collaboration = "collaboration",
}

export const STANDARDS_CATEGORIES = Object.freeze(
  Object.values(StandardsCategoryEnum),
) as readonly `${StandardsCategoryEnum}`[];

export enum StandardsRuleLevelEnum {
  Required = "required",
  Recommended = "recommended",
}

export const STANDARDS_RULE_LEVELS = Object.freeze(
  Object.values(StandardsRuleLevelEnum),
) as readonly `${StandardsRuleLevelEnum}`[];

export enum StandardsConsumerEnum {
  Init = "init",
  Plan = "plan",
  Check = "check",
  Review = "review",
  ReviewVerify = "review-verify",
  Report = "report",
}

export const STANDARDS_CONSUMERS = Object.freeze(
  Object.values(StandardsConsumerEnum),
) as readonly `${StandardsConsumerEnum}`[];

export enum StandardsAutomationSeverityEnum {
  Error = "error",
  Warn = "warn",
  Info = "info",
}

export const STANDARDS_AUTOMATION_SEVERITIES = Object.freeze(
  Object.values(StandardsAutomationSeverityEnum),
) as readonly `${StandardsAutomationSeverityEnum}`[];

export enum StandardsRuleViewEnum {
  Ai = "ai",
  Human = "human",
}

export const STANDARDS_RULE_VIEWS = Object.freeze(
  Object.values(StandardsRuleViewEnum),
) as readonly `${StandardsRuleViewEnum}`[];

export enum StandardsPackageKindEnum {
  StandardsPackage = "standards-package",
}

export const STANDARDS_PACKAGE_KINDS = Object.freeze(
  Object.values(StandardsPackageKindEnum),
) as readonly `${StandardsPackageKindEnum}`[];

export enum StandardsPackageSchemaVersionEnum {
  V1 = "1",
}

export const STANDARDS_PACKAGE_SCHEMA_VERSIONS = Object.freeze(
  Object.values(StandardsPackageSchemaVersionEnum),
) as readonly `${StandardsPackageSchemaVersionEnum}`[];
