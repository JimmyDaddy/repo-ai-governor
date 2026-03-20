import type { GovernanceReviewerRole } from "@repo-ai-governor/shared";
import type { ChangeRiskFileCategory, ChangeRiskRequiredAction } from "../../constants/index.js";

/**
 * Defines file-category identifiers consumed by risk evaluator.
 *
 * Why this exists:
 * baseline file categories should be enum-backed while still allowing extensible domain tags.
 */
export type ChangeRiskFileCategoryValue = ChangeRiskFileCategory | (string & {});

/**
 * Defines reviewer role identifiers returned by evaluator.
 *
 * Why this exists:
 * default roles are shared via enum, while keeping room for repo-specific role_profile_id values.
 */
export type ChangeRiskReviewerRole = GovernanceReviewerRole | (string & {});

/**
 * Defines customizable reviewer-role matrix keyed by required action.
 */
export type ChangeRiskReviewerRoleMatrix = Partial<
  Record<ChangeRiskRequiredAction, ChangeRiskReviewerRole[]>
>;
