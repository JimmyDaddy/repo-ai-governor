import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import type { ArtifactRegistry } from "./artifact-registry.js";
import {
  ALL_ARTIFACT_FAILURE_ACTIONS,
  ALL_ARTIFACT_RESOLUTION_POLICIES,
  ARTIFACT_DEPENDENCY_EXPRESSION_PATTERN,
  ARTIFACT_FAILURE_ACTION_SEVERITY,
  ArtifactDependencyFailureAction,
  ArtifactDependencyResolutionPolicy,
  ArtifactDependencyResolutionStatus,
  ArtifactDependencyUnresolvedReason,
  RESOLVABLE_ARTIFACT_STATUSES,
} from "./constants/index.js";
import type {
  ArtifactDependencyResolutionResult,
  ArtifactDependencyUnresolvedItem,
  ArtifactRegistryRecord,
  ParsedArtifactDependency,
  ResolveArtifactDependenciesOptions,
} from "./types/index.js";

/**
 * Resolves task dependency artifacts using policy-driven version matching rules.
 *
 * Why this exists:
 * runtime orchestration needs one deterministic place to map missing/version issues
 * into `block/escalate/warn` actions and audit-ready resolution outputs.
 */
export class ArtifactDependencyResolver {
  public constructor(private readonly artifactRegistry: ArtifactRegistry) {}

  /**
   * Resolves declared dependency expressions into artifact records.
   * @param options Dependency resolution options.
   * @returns Resolution result with resolved rows, unresolved rows, and audit fields.
   */
  public async resolve(
    options: ResolveArtifactDependenciesOptions,
  ): Promise<ArtifactDependencyResolutionResult> {
    if (!options || typeof options !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
        "Dependency resolution options must be an object.",
      );
    }

    const consumerTaskId = this.readRequiredString(options.consumerTaskId, "consumerTaskId");
    const resolutionPolicy = this.readResolutionPolicy(options.resolutionPolicy);
    const missingArtifactAction = this.readFailureAction(
      options.missingArtifactAction,
      "missingArtifactAction",
      ArtifactDependencyFailureAction.BLOCK,
    );
    const versionMismatchAction = this.readFailureAction(
      options.versionMismatchAction,
      "versionMismatchAction",
      ArtifactDependencyFailureAction.ESCALATE,
    );
    const parsedDependencies = this.parseDependencyExpressions(options.dependsOnArtifacts);

    const resolvedArtifacts: ArtifactRegistryRecord[] = [];
    const unresolved: ArtifactDependencyUnresolvedItem[] = [];

    for (const dependency of parsedDependencies) {
      const resolvedOrUnresolved = await this.resolveOneDependency(
        dependency,
        resolutionPolicy,
        missingArtifactAction,
        versionMismatchAction,
      );

      if (this.isResolvedArtifact(resolvedOrUnresolved)) {
        resolvedArtifacts.push(resolvedOrUnresolved);
      } else {
        unresolved.push(resolvedOrUnresolved);
      }
    }

    const requiredAction = this.resolveRequiredAction(unresolved);
    const resolutionStatus = this.resolveTerminalStatus(requiredAction);
    const messages = unresolved.map((unresolvedItem) => unresolvedItem.message);

    return {
      consumerTaskId,
      resolutionPolicy,
      resolutionStatus,
      requiredAction,
      resolvedArtifacts,
      unresolved,
      messages,
      auditFields: {
        dependencyResolutionStatus: resolutionStatus,
        requiredAction,
        consumerTaskId,
        resolutionPolicy,
        resolvedArtifactIds: resolvedArtifacts.map((artifact) => artifact.artifactId),
        unresolvedDependencies: unresolved.map((item) => item.dependency.rawExpression),
      },
    };
  }

  /**
   * Resolves one dependency expression into artifact row or unresolved diagnostics.
   * @param dependency Parsed dependency expression.
   * @param resolutionPolicy Resolution policy.
   * @param missingArtifactAction Action for missing or non-resolvable statuses.
   * @param versionMismatchAction Action for version mismatches.
   * @returns Resolved artifact row or unresolved payload.
   */
  private async resolveOneDependency(
    dependency: ParsedArtifactDependency,
    resolutionPolicy: ArtifactDependencyResolutionPolicy,
    missingArtifactAction: ArtifactDependencyFailureAction,
    versionMismatchAction: ArtifactDependencyFailureAction,
  ): Promise<ArtifactRegistryRecord | ArtifactDependencyUnresolvedItem> {
    const artifactVersions = await this.artifactRegistry.listArtifactVersions(
      dependency.artifactId,
    );
    if (artifactVersions.length === 0) {
      return {
        dependency,
        reason: ArtifactDependencyUnresolvedReason.MISSING,
        action: missingArtifactAction,
        message: `Dependency artifact "${dependency.rawExpression}" is missing in registry.`,
      };
    }

    const resolvableVersions = artifactVersions.filter((artifact) =>
      RESOLVABLE_ARTIFACT_STATUSES.has(artifact.artifactStatus),
    );
    if (resolvableVersions.length === 0) {
      return {
        dependency,
        reason: ArtifactDependencyUnresolvedReason.STATUS_NOT_RESOLVABLE,
        action: missingArtifactAction,
        message:
          `Dependency artifact "${dependency.rawExpression}" has no resolvable versions ` +
          `(allowed statuses: ${Array.from(RESOLVABLE_ARTIFACT_STATUSES).join(", ")}).`,
      };
    }

    const matchedArtifact = this.matchArtifactVersion(
      dependency,
      resolutionPolicy,
      resolvableVersions,
    );
    if (matchedArtifact) {
      return matchedArtifact;
    }

    const reason =
      resolutionPolicy === ArtifactDependencyResolutionPolicy.STRICT && !dependency.constraint
        ? ArtifactDependencyUnresolvedReason.AMBIGUOUS_MATCH
        : ArtifactDependencyUnresolvedReason.VERSION_INCOMPATIBLE;

    return {
      dependency,
      reason,
      action: versionMismatchAction,
      message:
        `Dependency artifact "${dependency.rawExpression}" cannot be resolved by policy ` +
        `"${resolutionPolicy}" with available versions ${resolvableVersions
          .map((artifact) => artifact.artifactVersion)
          .join(", ")}.`,
    };
  }

  /**
   * Matches one artifact version from candidates by resolution policy.
   * @param dependency Parsed dependency expression.
   * @param resolutionPolicy Resolution policy.
   * @param candidates Candidate versions sorted high to low.
   * @returns Matched artifact row when available.
   */
  private matchArtifactVersion(
    dependency: ParsedArtifactDependency,
    resolutionPolicy: ArtifactDependencyResolutionPolicy,
    candidates: ArtifactRegistryRecord[],
  ): ArtifactRegistryRecord | undefined {
    if (resolutionPolicy === ArtifactDependencyResolutionPolicy.LATEST) {
      return candidates[0];
    }

    if (resolutionPolicy === ArtifactDependencyResolutionPolicy.STRICT) {
      if (!dependency.constraint) {
        return candidates.length === 1 ? candidates[0] : undefined;
      }

      return candidates.find((candidate) => candidate.artifactVersion === dependency.constraint);
    }

    if (!dependency.constraint) {
      return candidates[0];
    }

    if (dependency.constraint.startsWith("^")) {
      const major = this.parseMajorVersion(dependency.constraint.slice(1));
      return candidates.find(
        (candidate) => this.parseMajorVersion(candidate.artifactVersion) === major,
      );
    }

    const targetMajor = this.parseMajorVersion(dependency.constraint);
    return candidates.find(
      (candidate) => this.parseMajorVersion(candidate.artifactVersion) === targetMajor,
    );
  }

  /**
   * Parses dependency expressions into normalized tokens.
   * @param dependsOnArtifacts Raw dependency expression list.
   * @returns Parsed dependency expressions.
   */
  private parseDependencyExpressions(dependsOnArtifacts: string[]): ParsedArtifactDependency[] {
    if (!Array.isArray(dependsOnArtifacts)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
        'Field "dependsOnArtifacts" must be a string array.',
      );
    }

    return dependsOnArtifacts.map((rawExpression, index) => {
      if (typeof rawExpression !== "string" || rawExpression.trim().length === 0) {
        throw new RuntimeError(
          GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
          `Field "dependsOnArtifacts[${index}]" must be a non-empty string.`,
        );
      }

      const expression = rawExpression.trim();
      const matched = expression.match(ARTIFACT_DEPENDENCY_EXPRESSION_PATTERN);
      if (!matched?.groups) {
        throw new RuntimeError(
          GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
          `Dependency expression "${expression}" is invalid.`,
          {
            expression,
            expectedPattern: ARTIFACT_DEPENDENCY_EXPRESSION_PATTERN.source,
          },
        );
      }

      const artifactId = this.readRequiredString(matched.groups.artifactId, "artifactId");
      const constraint = matched.groups.constraint?.trim();

      return {
        rawExpression: expression,
        artifactId,
        ...(constraint ? { constraint } : {}),
      };
    });
  }

  /**
   * Reads one resolution policy value with default fallback.
   * @param candidate Raw value.
   * @returns Resolution policy.
   */
  private readResolutionPolicy(
    candidate?: ArtifactDependencyResolutionPolicy,
  ): ArtifactDependencyResolutionPolicy {
    if (!candidate) {
      return ArtifactDependencyResolutionPolicy.COMPATIBLE;
    }

    if (!ALL_ARTIFACT_RESOLUTION_POLICIES.has(candidate)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
        `resolutionPolicy must be one of ${Array.from(ALL_ARTIFACT_RESOLUTION_POLICIES).join(", ")}.`,
        {
          value: candidate,
        },
      );
    }

    return candidate;
  }

  /**
   * Reads one failure action value with fallback.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @param fallback Default action.
   * @returns Failure action.
   */
  private readFailureAction(
    candidate: ArtifactDependencyFailureAction | undefined,
    fieldName: string,
    fallback: ArtifactDependencyFailureAction,
  ): ArtifactDependencyFailureAction {
    if (!candidate) {
      return fallback;
    }

    if (!ALL_ARTIFACT_FAILURE_ACTIONS.has(candidate)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
        `Field "${fieldName}" must be one of ${Array.from(ALL_ARTIFACT_FAILURE_ACTIONS).join(", ")}.`,
        {
          fieldName,
          value: candidate,
        },
      );
    }

    return candidate;
  }

  /**
   * Merges unresolved actions into one required action.
   * @param unresolved Unresolved dependency rows.
   * @returns Final action.
   */
  private resolveRequiredAction(
    unresolved: ArtifactDependencyUnresolvedItem[],
  ): ArtifactDependencyFailureAction {
    if (unresolved.length === 0) {
      return ArtifactDependencyFailureAction.ALLOW;
    }

    let currentAction: ArtifactDependencyFailureAction = ArtifactDependencyFailureAction.ALLOW;
    for (const unresolvedItem of unresolved) {
      const currentSeverity = ARTIFACT_FAILURE_ACTION_SEVERITY[currentAction];
      const nextSeverity = ARTIFACT_FAILURE_ACTION_SEVERITY[unresolvedItem.action];
      if (nextSeverity > currentSeverity) {
        currentAction = unresolvedItem.action;
      }
    }

    return currentAction;
  }

  /**
   * Resolves terminal status from required action.
   * @param action Required action.
   * @returns Terminal resolution status.
   */
  private resolveTerminalStatus(
    action: ArtifactDependencyFailureAction,
  ): ArtifactDependencyResolutionStatus {
    if (action === ArtifactDependencyFailureAction.BLOCK) {
      return ArtifactDependencyResolutionStatus.BLOCKED;
    }

    if (action === ArtifactDependencyFailureAction.ESCALATE) {
      return ArtifactDependencyResolutionStatus.ESCALATED;
    }

    if (action === ArtifactDependencyFailureAction.WARN) {
      return ArtifactDependencyResolutionStatus.WARNED;
    }

    return ArtifactDependencyResolutionStatus.RESOLVED;
  }

  /**
   * Validates one required string field.
   * @param candidate Raw value.
   * @param fieldName Field path for diagnostics.
   * @returns Trimmed string.
   */
  private readRequiredString(candidate: unknown, fieldName: string): string {
    if (typeof candidate !== "string" || candidate.trim().length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
        `Field "${fieldName}" must be a non-empty string.`,
        {
          fieldName,
          value: candidate,
        },
      );
    }

    return candidate.trim();
  }

  /**
   * Parses major version number from one artifact version token.
   * @param version Version token.
   * @returns Major version number.
   */
  private parseMajorVersion(version: string): number {
    const normalizedVersion = version.trim().replace(/^v/u, "");
    const majorToken = normalizedVersion.split(".")[0] ?? "0";
    const majorVersion = Number.parseInt(majorToken, 10);

    if (!Number.isFinite(majorVersion)) {
      throw new RuntimeError(
        GovernorErrorCode.ARTIFACT_DEPENDENCY_EXPRESSION_INVALID,
        `Version token "${version}" cannot be parsed.`,
      );
    }

    return majorVersion;
  }

  /**
   * Checks whether one result row is resolved artifact payload.
   * @param row Resolver row candidate.
   * @returns True when row is resolved artifact.
   */
  private isResolvedArtifact(
    row: ArtifactRegistryRecord | ArtifactDependencyUnresolvedItem,
  ): row is ArtifactRegistryRecord {
    return "artifactId" in row;
  }
}
