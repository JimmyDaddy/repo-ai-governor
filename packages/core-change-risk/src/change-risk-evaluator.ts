import { GovernanceReviewerRole, GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  CHANGE_RISK_SCORE_THRESHOLDS,
  ChangeRiskLevel,
  ChangeRiskReasonCode,
  ChangeRiskRequiredAction,
  DEFAULT_HIGH_RISK_COMMAND_CLASSES,
  DEFAULT_HIGH_RISK_FILE_CATEGORIES,
  DEFAULT_HIGH_RISK_PERMISSION_PREFIXES,
  DEFAULT_SENSITIVE_PATH_SEGMENTS,
} from "./constants/index.js";
import type {
  ChangeRiskEvaluationResult,
  ChangeRiskEvaluatorOptions,
  ChangeRiskFactsInput,
  ChangeRiskReason,
  ChangeRiskReviewerRole,
} from "./types/index.js";

interface ResolvedEvaluatorOptions {
  sensitivePathSegments: string[];
  highRiskFileCategories: string[];
  highRiskPermissionPrefixes: string[];
  highRiskCommandClasses: string[];
  policyPrefix: string;
  reviewerRoleMatrix: Record<ChangeRiskRequiredAction, ChangeRiskReviewerRole[]>;
}

/**
 * Normalizes change facts into structured risk signals for policy consumption.
 *
 * Why this exists:
 * risk semantics should be centralized in one evaluator so adapters and runtime
 * do not duplicate risk heuristics with diverging behavior.
 */
export class ChangeRiskEvaluator {
  private readonly resolvedOptions: ResolvedEvaluatorOptions;

  public constructor(options: ChangeRiskEvaluatorOptions = {}) {
    this.resolvedOptions = this.resolveOptions(options);
  }

  /**
   * Evaluates change facts and returns normalized risk output.
   * @param rawFacts Raw change facts collected by adapter/runtime surfaces.
   * @returns Structured risk result for policy routing.
   */
  public evaluate(rawFacts: ChangeRiskFactsInput): ChangeRiskEvaluationResult {
    try {
      const facts = this.normalizeFacts(rawFacts);
      const riskReasons: ChangeRiskReason[] = [];
      let riskScore = 0;

      if (facts.lockfileDelta) {
        riskScore += 2;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.LOCKFILE_DELTA,
            "Lockfile changes can impact dependency graph integrity.",
            ["lockfile_delta=true"],
          ),
        );
      }

      if (facts.migrationDetected) {
        riskScore += 3;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.MIGRATION_DETECTED,
            "Database or schema migration changes require stricter review.",
            ["migration_detected=true"],
          ),
        );
      }

      if (facts.ciWorkflowChanged) {
        riskScore += 3;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.CI_WORKFLOW_CHANGED,
            "CI workflow modifications can alter trusted delivery behavior.",
            ["ci_workflow_changed=true"],
          ),
        );
      }

      if (facts.releaseScriptChanged) {
        riskScore += 3;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.RELEASE_SCRIPT_CHANGED,
            "Release script changes can affect deployment safety.",
            ["release_script_changed=true"],
          ),
        );
      }

      const sensitivePaths = this.collectSensitivePaths(facts.changedPaths);
      if (sensitivePaths.length > 0) {
        riskScore += 2;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.SENSITIVE_PATH_CHANGED,
            "Sensitive path changes require additional governance checks.",
            sensitivePaths,
          ),
        );
      }

      const highRiskCategories = this.collectHighRiskFileCategories(facts.fileCategories);
      if (highRiskCategories.length > 0) {
        riskScore += 2;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.HIGH_RISK_FILE_CATEGORY,
            "High-risk file categories were detected in this change set.",
            highRiskCategories,
          ),
        );
      }

      const highRiskPermissions = this.collectHighRiskPermissions(facts.requestedPermissions);
      if (highRiskPermissions.length > 0) {
        riskScore += 2;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.HIGH_RISK_PERMISSION,
            "Requested permissions exceed baseline low-risk operation set.",
            highRiskPermissions,
          ),
        );
      }

      if (this.isHighRiskCommandClass(facts.commandClass)) {
        riskScore += 2;
        riskReasons.push(
          this.createReason(
            ChangeRiskReasonCode.HIGH_RISK_COMMAND_CLASS,
            "Command class indicates high-impact execution intent.",
            [facts.commandClass],
          ),
        );
      }

      const riskLevel = this.resolveRiskLevel(riskScore);
      const requiredAction = this.resolveRequiredAction(riskLevel);
      const requiredReviewerRoles = this.resolveRequiredReviewerRoles(requiredAction);
      const matchedPolicies = this.resolveMatchedPolicies(riskReasons, requiredAction);

      return {
        riskLevel,
        riskReasons,
        requiredAction,
        requiredReviewerRoles,
        matchedPolicies,
      };
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        GovernorErrorCode.CHANGE_RISK_EVALUATION_FAILED,
        "Change risk evaluation failed unexpectedly.",
        undefined,
        error,
      );
    }
  }

  /**
   * Resolves baseline evaluator options with deterministic defaults.
   * @param options Optional evaluator override options.
   * @returns Resolved options with stable defaults.
   */
  private resolveOptions(options: ChangeRiskEvaluatorOptions): ResolvedEvaluatorOptions {
    return {
      sensitivePathSegments: this.normalizeStringList(
        options.sensitivePathSegments ?? [...DEFAULT_SENSITIVE_PATH_SEGMENTS],
      ),
      highRiskFileCategories: this.normalizeStringList(
        options.highRiskFileCategories ?? [...DEFAULT_HIGH_RISK_FILE_CATEGORIES],
      ),
      highRiskPermissionPrefixes: this.normalizeStringList(
        options.highRiskPermissionPrefixes ?? [...DEFAULT_HIGH_RISK_PERMISSION_PREFIXES],
      ),
      highRiskCommandClasses: this.normalizeStringList(
        options.highRiskCommandClasses ?? [...DEFAULT_HIGH_RISK_COMMAND_CLASSES],
      ),
      policyPrefix: (options.policyPrefix ?? "policy.risk").trim(),
      reviewerRoleMatrix: {
        [ChangeRiskRequiredAction.ALLOW]: [],
        [ChangeRiskRequiredAction.CONFIRM]: [GovernanceReviewerRole.MAINTAINER],
        [ChangeRiskRequiredAction.ESCALATE]: [
          GovernanceReviewerRole.MAINTAINER,
          GovernanceReviewerRole.SECURITY_REVIEWER,
        ],
        [ChangeRiskRequiredAction.BLOCK]: [
          GovernanceReviewerRole.MAINTAINER,
          GovernanceReviewerRole.SECURITY_REVIEWER,
        ],
        ...(options.reviewerRoleMatrix ?? {}),
      },
    };
  }

  /**
   * Validates and normalizes raw facts to stable comparer inputs.
   * @param facts Raw input facts.
   * @returns Normalized facts.
   */
  private normalizeFacts(facts: ChangeRiskFactsInput): ChangeRiskFactsInput {
    const normalizedFacts = {
      changedPaths: this.normalizeStringList(facts?.changedPaths),
      fileCategories: this.normalizeStringList(facts?.fileCategories),
      requestedPermissions: this.normalizeStringList(facts?.requestedPermissions),
      commandClass: typeof facts?.commandClass === "string" ? facts.commandClass.trim() : "",
      lockfileDelta: Boolean(facts?.lockfileDelta),
      migrationDetected: Boolean(facts?.migrationDetected),
      ciWorkflowChanged: Boolean(facts?.ciWorkflowChanged),
      releaseScriptChanged: Boolean(facts?.releaseScriptChanged),
    };

    if (!normalizedFacts.commandClass) {
      throw new RuntimeError(
        GovernorErrorCode.CHANGE_RISK_FACTS_INVALID,
        "Change risk facts require a non-empty commandClass.",
        {
          field: "commandClass",
        },
      );
    }

    return normalizedFacts;
  }

  /**
   * Normalizes list-like inputs for deterministic matching.
   * @param values Raw input list.
   * @returns Deduplicated normalized list.
   */
  private normalizeStringList(values: unknown): string[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(
        GovernorErrorCode.CHANGE_RISK_FACTS_INVALID,
        "Change risk list fields must be arrays.",
      );
    }

    const uniqueValues = new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    );

    return Array.from(uniqueValues.values());
  }

  /**
   * Creates one standardized reason row.
   * @param code Stable reason code.
   * @param message Human-readable reason message.
   * @param evidence Structured evidence snippets.
   * @returns Normalized reason row.
   */
  private createReason(
    code: ChangeRiskReasonCode,
    message: string,
    evidence: string[],
  ): ChangeRiskReason {
    return {
      code,
      message,
      evidence: this.normalizeStringList(evidence),
    };
  }

  /**
   * Collects changed paths that touch sensitive path segments.
   * @param changedPaths Normalized changed paths.
   * @returns Matched sensitive paths.
   */
  private collectSensitivePaths(changedPaths: string[]): string[] {
    return changedPaths.filter((changedPath) =>
      this.resolvedOptions.sensitivePathSegments.some((segment) => changedPath.includes(segment)),
    );
  }

  /**
   * Collects high-risk file categories.
   * @param fileCategories Normalized file categories.
   * @returns Matched categories.
   */
  private collectHighRiskFileCategories(fileCategories: string[]): string[] {
    return fileCategories.filter((category) =>
      this.resolvedOptions.highRiskFileCategories.includes(category),
    );
  }

  /**
   * Collects high-risk permission requests by prefix matching.
   * @param requestedPermissions Normalized permission list.
   * @returns Matched permission entries.
   */
  private collectHighRiskPermissions(requestedPermissions: string[]): string[] {
    return requestedPermissions.filter((permission) =>
      this.resolvedOptions.highRiskPermissionPrefixes.some((prefix) =>
        permission.startsWith(prefix),
      ),
    );
  }

  /**
   * Checks whether command class belongs to high-risk set.
   * @param commandClass Normalized command class.
   * @returns True when command class is considered high risk.
   */
  private isHighRiskCommandClass(commandClass: string): boolean {
    return this.resolvedOptions.highRiskCommandClasses.includes(commandClass);
  }

  /**
   * Resolves risk level from aggregated risk score.
   * @param riskScore Aggregated score.
   * @returns Risk level.
   */
  private resolveRiskLevel(riskScore: number): ChangeRiskLevel {
    if (riskScore <= CHANGE_RISK_SCORE_THRESHOLDS.LOW_MAX) {
      return ChangeRiskLevel.LOW;
    }

    if (riskScore <= CHANGE_RISK_SCORE_THRESHOLDS.MEDIUM_MAX) {
      return ChangeRiskLevel.MEDIUM;
    }

    if (riskScore <= CHANGE_RISK_SCORE_THRESHOLDS.HIGH_MAX) {
      return ChangeRiskLevel.HIGH;
    }

    return ChangeRiskLevel.CRITICAL;
  }

  /**
   * Maps risk level to required action hint.
   * @param riskLevel Risk level.
   * @returns Required action for downstream policy routing.
   */
  private resolveRequiredAction(riskLevel: ChangeRiskLevel): ChangeRiskRequiredAction {
    if (riskLevel === ChangeRiskLevel.CRITICAL) {
      return ChangeRiskRequiredAction.BLOCK;
    }

    if (riskLevel === ChangeRiskLevel.HIGH) {
      return ChangeRiskRequiredAction.ESCALATE;
    }

    if (riskLevel === ChangeRiskLevel.MEDIUM) {
      return ChangeRiskRequiredAction.CONFIRM;
    }

    return ChangeRiskRequiredAction.ALLOW;
  }

  /**
   * Resolves reviewer roles from required action.
   * @param requiredAction Required action.
   * @returns Reviewer role list.
   */
  private resolveRequiredReviewerRoles(
    requiredAction: ChangeRiskRequiredAction,
  ): ChangeRiskReviewerRole[] {
    const reviewerRoles = this.resolvedOptions.reviewerRoleMatrix[requiredAction] ?? [];
    return this.normalizeStringList(reviewerRoles);
  }

  /**
   * Builds matched policy ids from risk reasons and action hint.
   * @param riskReasons Normalized reasons.
   * @param requiredAction Required action hint.
   * @returns Policy ids for audit and policy engine input.
   */
  private resolveMatchedPolicies(
    riskReasons: ChangeRiskReason[],
    requiredAction: ChangeRiskRequiredAction,
  ): string[] {
    const policyIds = riskReasons.map(
      (riskReason) => `${this.resolvedOptions.policyPrefix}.${riskReason.code}`,
    );
    policyIds.push(`${this.resolvedOptions.policyPrefix}.action.${requiredAction}`);
    return this.normalizeStringList(policyIds);
  }
}
