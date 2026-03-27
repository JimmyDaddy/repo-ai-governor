import type {
  ChangeRiskLevel,
  ChangeRiskReasonCode,
  ChangeRiskRequiredAction,
} from '../../constants/index.js';
import type {
  ChangeRiskFileCategoryValue,
  ChangeRiskReviewerRole,
  ChangeRiskReviewerRoleMatrix,
} from '../aliases/index.js';

/**
 * Describes minimal change facts consumed by risk evaluator.
 */
export interface ChangeRiskFactsInput {
  changedPaths: string[];
  fileCategories: ChangeRiskFileCategoryValue[];
  requestedPermissions: string[];
  commandClass: string;
  lockfileDelta: boolean;
  migrationDetected: boolean;
  ciWorkflowChanged: boolean;
  releaseScriptChanged: boolean;
}

/**
 * Describes one normalized risk reason row.
 */
export interface ChangeRiskReason {
  code: ChangeRiskReasonCode;
  message: string;
  evidence: string[];
}

/**
 * Describes structured risk evaluation output consumed by policy gate.
 */
export interface ChangeRiskEvaluationResult {
  riskLevel: ChangeRiskLevel;
  riskReasons: ChangeRiskReason[];
  requiredAction: ChangeRiskRequiredAction;
  requiredReviewerRoles: ChangeRiskReviewerRole[];
  matchedPolicies: string[];
}

/**
 * Describes evaluator options used to adapt baseline policy signals.
 */
export interface ChangeRiskEvaluatorOptions {
  sensitivePathSegments?: string[];
  highRiskFileCategories?: ChangeRiskFileCategoryValue[];
  highRiskPermissionPrefixes?: string[];
  highRiskCommandClasses?: string[];
  policyPrefix?: string;
  reviewerRoleMatrix?: ChangeRiskReviewerRoleMatrix;
}
