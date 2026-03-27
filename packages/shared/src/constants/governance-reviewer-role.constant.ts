/**
 * Defines baseline reviewer roles used by governance decisions.
 *
 * Why this exists:
 * a shared enum keeps default role identifiers consistent across core packages.
 */
export enum GovernanceReviewerRole {
  MAINTAINER = 'maintainer',
  SECURITY_REVIEWER = 'security_reviewer',
}
