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
