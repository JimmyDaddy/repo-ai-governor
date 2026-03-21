import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { AgentCapability, AgentCapabilityFallbackAction } from "./constants/index.js";
import type {
  AgentCapabilityFallbackRule,
  AgentCapabilityRequirement,
  AgentRoutePolicy,
  AgentRouteRegistryOptions,
  AgentRouteResolvedPolicy,
} from "./types/index.js";

/**
 * Maintains routeKey -> primary/fallback surface routing policy definitions.
 *
 * Why this exists:
 * centralizing route policy normalization prevents runtime/adapter modules from
 * re-implementing routeKey parsing and fallback ordering inconsistently.
 */
export class AgentRouteRegistry {
  private readonly policyByRouteKey = new Map<string, AgentRouteResolvedPolicy>();
  private readonly capabilitySet = new Set<string>(Object.values(AgentCapability));
  private readonly fallbackActionSet = new Set<string>(
    Object.values(AgentCapabilityFallbackAction),
  );

  /**
   * Creates a route registry from route policy rows.
   * @param options Route registry options.
   */
  public constructor(options: AgentRouteRegistryOptions) {
    this.assertOptions(options);
    for (const [index, policy] of options.routePolicies.entries()) {
      const pointer = `routePolicies[${index}]`;
      const normalizedPolicy = this.normalizePolicy(policy, pointer);
      if (this.policyByRouteKey.has(normalizedPolicy.routeKey)) {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
          `Duplicate routeKey "${normalizedPolicy.routeKey}" is not allowed.`,
          {
            pointer,
            routeKey: normalizedPolicy.routeKey,
          },
        );
      }
      this.policyByRouteKey.set(normalizedPolicy.routeKey, normalizedPolicy);
    }
  }

  /**
   * Lists normalized route policies.
   * @returns Route policy list snapshot.
   */
  public listRoutes(): AgentRouteResolvedPolicy[] {
    return Array.from(this.policyByRouteKey.values()).map((policy) => ({
      ...policy,
      fallbackSurfaces: [...policy.fallbackSurfaces],
      candidateSurfaces: [...policy.candidateSurfaces],
      ...(policy.capabilityRequirement
        ? {
            capabilityRequirement: this.cloneCapabilityRequirement(policy.capabilityRequirement),
          }
        : {}),
    }));
  }

  /**
   * Resolves one route policy by routeKey.
   * @param routeKey Route identifier.
   * @returns Normalized route policy.
   */
  public resolveRoute(routeKey: string): AgentRouteResolvedPolicy {
    const normalizedRouteKey = this.readRequiredString(routeKey, "routeKey");
    const policy = this.policyByRouteKey.get(normalizedRouteKey);
    if (!policy) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_KEY_NOT_FOUND,
        `Route policy "${normalizedRouteKey}" is not registered.`,
        {
          routeKey: normalizedRouteKey,
        },
      );
    }
    return {
      ...policy,
      fallbackSurfaces: [...policy.fallbackSurfaces],
      candidateSurfaces: [...policy.candidateSurfaces],
      ...(policy.capabilityRequirement
        ? {
            capabilityRequirement: this.cloneCapabilityRequirement(policy.capabilityRequirement),
          }
        : {}),
    };
  }

  /**
   * Validates constructor options.
   * @param options Route registry options.
   */
  private assertOptions(options: AgentRouteRegistryOptions): void {
    if (!options || typeof options !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        "Route registry options must be an object.",
      );
    }
    if (!Array.isArray(options.routePolicies)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        "Route registry options must provide routePolicies array.",
      );
    }
  }

  /**
   * Normalizes one route policy.
   * @param policy Route policy row.
   * @param pointer Error pointer for diagnostics.
   * @returns Normalized route policy.
   */
  private normalizePolicy(policy: AgentRoutePolicy, pointer: string): AgentRouteResolvedPolicy {
    if (!policy || typeof policy !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be an object.`,
        {
          pointer,
        },
      );
    }

    const routeKey = this.readRequiredString(policy.routeKey, `${pointer}.routeKey`);
    const primarySurface = this.readRequiredString(
      policy.primarySurface,
      `${pointer}.primarySurface`,
    );
    const fallbackSurfaces = this.normalizeStringArray(
      policy.fallbackSurfaces ?? [],
      `${pointer}.fallbackSurfaces`,
    ).filter((surface) => surface !== primarySurface);
    const candidateSurfaces = [primarySurface, ...fallbackSurfaces];
    const capabilityRequirement = this.normalizeOptionalCapabilityRequirement(policy, pointer);

    if (candidateSurfaces.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must provide at least one candidate surface.`,
        {
          pointer,
          routeKey,
        },
      );
    }

    return {
      routeKey,
      primarySurface,
      fallbackSurfaces,
      candidateSurfaces,
      ...(capabilityRequirement
        ? {
            capabilityRequirement,
          }
        : {}),
    };
  }

  /**
   * Normalizes optional capability requirement and validates nested shape.
   * @param policy Route policy row.
   * @param pointer Error pointer for diagnostics.
   * @returns Normalized requirement when provided.
   */
  private normalizeOptionalCapabilityRequirement(
    policy: AgentRoutePolicy,
    pointer: string,
  ): AgentCapabilityRequirement | undefined {
    if (!Object.hasOwn(policy, "capabilityRequirement")) {
      return undefined;
    }
    if (policy.capabilityRequirement === undefined) {
      return undefined;
    }
    return this.normalizeCapabilityRequirement(
      policy.capabilityRequirement,
      `${pointer}.capabilityRequirement`,
    );
  }

  /**
   * Normalizes one capability requirement row and validates nested fields.
   * @param requirement Raw capability requirement.
   * @param pointer Error pointer for diagnostics.
   * @returns Normalized capability requirement.
   */
  private normalizeCapabilityRequirement(
    requirement: unknown,
    pointer: string,
  ): AgentCapabilityRequirement {
    if (!requirement || typeof requirement !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be an object.`,
        {
          pointer,
          actualType: requirement === null ? "null" : typeof requirement,
        },
      );
    }

    const requirementRecord = requirement as AgentCapabilityRequirement;
    const requiredCapabilities = this.normalizeCapabilityArray(
      requirementRecord.requiredCapabilities,
      `${pointer}.requiredCapabilities`,
    );
    if (requiredCapabilities.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer}.requiredCapabilities must include at least one value.`,
        {
          pointer: `${pointer}.requiredCapabilities`,
        },
      );
    }

    const allowDegradedCapabilities =
      requirementRecord.allowDegradedCapabilities !== undefined
        ? this.normalizeCapabilityArray(
            requirementRecord.allowDegradedCapabilities,
            `${pointer}.allowDegradedCapabilities`,
          )
        : undefined;
    const fallbackRules =
      requirementRecord.fallbackRules !== undefined
        ? this.normalizeFallbackRules(requirementRecord.fallbackRules, `${pointer}.fallbackRules`)
        : undefined;

    return {
      requiredCapabilities,
      ...(allowDegradedCapabilities !== undefined
        ? {
            allowDegradedCapabilities,
          }
        : {}),
      ...(fallbackRules !== undefined
        ? {
            fallbackRules,
          }
        : {}),
    };
  }

  /**
   * Normalizes one capability enum array and removes duplicates.
   * @param values Raw capability list.
   * @param pointer Error pointer for diagnostics.
   * @returns Normalized unique capability list.
   */
  private normalizeCapabilityArray(values: unknown, pointer: string): AgentCapability[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be an array.`,
        {
          pointer,
        },
      );
    }
    const normalizedValues: AgentCapability[] = [];
    const valueSet = new Set<AgentCapability>();
    for (const [index, value] of values.entries()) {
      const normalizedValue = this.readCapability(value, `${pointer}[${index}]`);
      if (valueSet.has(normalizedValue)) {
        continue;
      }
      valueSet.add(normalizedValue);
      normalizedValues.push(normalizedValue);
    }
    return normalizedValues;
  }

  /**
   * Normalizes fallback rules and validates nested enum values.
   * @param values Raw fallback rules list.
   * @param pointer Error pointer for diagnostics.
   * @returns Normalized fallback rules.
   */
  private normalizeFallbackRules(values: unknown, pointer: string): AgentCapabilityFallbackRule[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be an array.`,
        {
          pointer,
        },
      );
    }

    return values.map((value, index) => {
      if (!value || typeof value !== "object") {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
          `${pointer}[${index}] must be an object.`,
          {
            pointer: `${pointer}[${index}]`,
            actualType: value === null ? "null" : typeof value,
          },
        );
      }
      const fallbackRule = value as AgentCapabilityFallbackRule;
      const capability = this.readCapability(
        fallbackRule.capability,
        `${pointer}[${index}].capability`,
      );
      const onUnsupported = this.readFallbackAction(
        fallbackRule.onUnsupported,
        `${pointer}[${index}].onUnsupported`,
      );
      const onDegraded = this.readFallbackAction(
        fallbackRule.onDegraded,
        `${pointer}[${index}].onDegraded`,
      );
      if (fallbackRule.note !== undefined && typeof fallbackRule.note !== "string") {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
          `${pointer}[${index}].note must be a string when provided.`,
          {
            pointer: `${pointer}[${index}].note`,
            actualType: fallbackRule.note === null ? "null" : typeof fallbackRule.note,
          },
        );
      }
      const normalizedNote = fallbackRule.note?.trim();

      return {
        capability,
        onUnsupported,
        onDegraded,
        ...(normalizedNote
          ? {
              note: normalizedNote,
            }
          : {}),
      };
    });
  }

  /**
   * Reads one capability enum value from unknown input.
   * @param value Raw value.
   * @param pointer Error pointer for diagnostics.
   * @returns Capability enum value.
   */
  private readCapability(value: unknown, pointer: string): AgentCapability {
    if (typeof value !== "string" || !this.capabilitySet.has(value)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be one of AgentCapability values.`,
        {
          pointer,
          actualType: value === null ? "null" : typeof value,
        },
      );
    }
    return value as AgentCapability;
  }

  /**
   * Reads one fallback action enum value from unknown input.
   * @param value Raw value.
   * @param pointer Error pointer for diagnostics.
   * @returns Fallback action enum value.
   */
  private readFallbackAction(value: unknown, pointer: string): AgentCapabilityFallbackAction {
    if (typeof value !== "string" || !this.fallbackActionSet.has(value)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be one of AgentCapabilityFallbackAction values.`,
        {
          pointer,
          actualType: value === null ? "null" : typeof value,
        },
      );
    }
    return value as AgentCapabilityFallbackAction;
  }

  /**
   * Clones capability requirement to keep route snapshots immutable.
   * @param requirement Capability requirement.
   * @returns Deep-cloned requirement.
   */
  private cloneCapabilityRequirement(
    requirement: AgentCapabilityRequirement,
  ): AgentCapabilityRequirement {
    return {
      requiredCapabilities: [...requirement.requiredCapabilities],
      ...(requirement.allowDegradedCapabilities
        ? {
            allowDegradedCapabilities: [...requirement.allowDegradedCapabilities],
          }
        : {}),
      ...(requirement.fallbackRules
        ? {
            fallbackRules: requirement.fallbackRules.map((fallbackRule) => ({
              ...fallbackRule,
            })),
          }
        : {}),
    };
  }

  /**
   * Normalizes one string array with deduplicated non-empty values.
   * @param values Raw string values.
   * @param pointer Error pointer for diagnostics.
   * @returns Normalized unique string array.
   */
  private normalizeStringArray(values: string[], pointer: string): string[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be an array.`,
        {
          pointer,
        },
      );
    }
    const normalizedValues: string[] = [];
    const valueSet = new Set<string>();
    for (const [index, value] of values.entries()) {
      const normalizedValue = this.readRequiredString(value, `${pointer}[${index}]`);
      if (valueSet.has(normalizedValue)) {
        continue;
      }
      valueSet.add(normalizedValue);
      normalizedValues.push(normalizedValue);
    }
    return normalizedValues;
  }

  /**
   * Reads one required non-empty string value.
   * @param value Raw value.
   * @param pointer Error pointer for diagnostics.
   * @returns Normalized string.
   */
  private readRequiredString(value: unknown, pointer: string): string {
    if (typeof value !== "string") {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must be a string.`,
        {
          pointer,
          actualType: value === null ? "null" : typeof value,
        },
      );
    }
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_CONFIG_INVALID,
        `${pointer} must not be empty.`,
        {
          pointer,
        },
      );
    }
    return normalizedValue;
  }
}
