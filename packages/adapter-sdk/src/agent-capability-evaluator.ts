import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  AgentCapability,
  AgentCapabilityFallbackAction,
  AgentCapabilitySupportLevel,
} from './constants/index.js';
import type {
  AgentCapabilityEvaluationResult,
  AgentCapabilityFallbackRule,
  AgentCapabilityGap,
  AgentCapabilityMatrix,
  AgentCapabilityRequirement,
  AgentCapabilityState,
} from './types/index.js';

/**
 * Evaluates route-level capability requirements against adapter capability matrix.
 *
 * Why this exists:
 * runtime fallback policy should be computed from one deterministic evaluator
 * instead of duplicating capability-gap logic in each adapter implementation.
 */
export class AgentCapabilityEvaluator {
  private readonly capabilitySet = new Set<string>(Object.values(AgentCapability));
  private readonly fallbackActionSet = new Set<string>(
    Object.values(AgentCapabilityFallbackAction),
  );

  /**
   * Evaluates required capabilities and returns normalized fallback decisions.
   * @param capabilityMatrix Adapter capability matrix from probe.
   * @param requirement Route-level capability requirement.
   * @returns Capability evaluation result consumed by runtime routing.
   */
  public evaluate(
    capabilityMatrix: AgentCapabilityMatrix,
    requirement: AgentCapabilityRequirement,
  ): AgentCapabilityEvaluationResult {
    this.assertCapabilityMatrix(capabilityMatrix);
    this.assertCapabilityRequirement(requirement);

    const unsupportedCapabilities: AgentCapabilityEvaluationResult['unsupportedCapabilities'] = [];
    const degradedCapabilities: AgentCapabilityEvaluationResult['degradedCapabilities'] = [];
    const capabilityGaps: AgentCapabilityGap[] = [];
    const requiredFallbackActionSet = new Set<AgentCapabilityFallbackAction>();
    const allowedDegradedSet = new Set(requirement.allowDegradedCapabilities ?? []);
    const fallbackRules = requirement.fallbackRules ?? [];

    for (const capability of requirement.requiredCapabilities) {
      const supportLevel = this.resolveSupportLevel(capabilityMatrix.capabilityStates, capability);

      if (supportLevel === AgentCapabilitySupportLevel.SUPPORTED) {
        continue;
      }
      if (
        supportLevel === AgentCapabilitySupportLevel.DEGRADED &&
        allowedDegradedSet.has(capability)
      ) {
        continue;
      }

      const fallbackAction = this.resolveFallbackAction(capability, supportLevel, fallbackRules);
      if (supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED) {
        unsupportedCapabilities.push(capability);
      } else {
        degradedCapabilities.push(capability);
      }

      requiredFallbackActionSet.add(fallbackAction);
      capabilityGaps.push({
        capability,
        supportLevel,
        fallbackAction,
        note: this.resolveFallbackNote(capability, fallbackRules),
      });
    }

    return {
      isSatisfied: unsupportedCapabilities.length === 0 && degradedCapabilities.length === 0,
      unsupportedCapabilities,
      degradedCapabilities,
      requiredFallbackActions: Array.from(requiredFallbackActionSet),
      capabilityGaps,
    };
  }

  /**
   * Resolves one capability support level from matrix rows.
   * @param capabilityStates Capability rows in matrix.
   * @param capability Required capability id.
   * @returns Resolved support level, defaulting to unsupported when absent.
   */
  private resolveSupportLevel(
    capabilityStates: AgentCapabilityState[],
    capability: AgentCapabilityState['capability'],
  ): AgentCapabilitySupportLevel {
    const matchedState = capabilityStates.find((state) => state.capability === capability);
    return matchedState?.supportLevel ?? AgentCapabilitySupportLevel.UNSUPPORTED;
  }

  /**
   * Resolves fallback action by capability and support level.
   * @param capability Required capability id.
   * @param supportLevel Current support level from matrix.
   * @param fallbackRules Optional custom fallback rules.
   * @returns Fallback action used by runtime route decisions.
   */
  private resolveFallbackAction(
    capability: AgentCapabilityState['capability'],
    supportLevel: AgentCapabilitySupportLevel,
    fallbackRules: AgentCapabilityFallbackRule[],
  ): AgentCapabilityFallbackAction {
    const matchedRule = fallbackRules.find((rule) => rule.capability === capability);
    if (supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED) {
      return matchedRule?.onUnsupported ?? AgentCapabilityFallbackAction.ESCALATE;
    }
    return matchedRule?.onDegraded ?? AgentCapabilityFallbackAction.REQUIRE_CONFIRMATION;
  }

  /**
   * Resolves fallback note from custom rule set for audit readability.
   * @param capability Required capability id.
   * @param fallbackRules Optional custom fallback rules.
   * @returns Optional fallback note.
   */
  private resolveFallbackNote(
    capability: AgentCapabilityState['capability'],
    fallbackRules: AgentCapabilityFallbackRule[],
  ): string | undefined {
    const matchedRule = fallbackRules.find((rule) => rule.capability === capability);
    return matchedRule?.note;
  }

  /**
   * Validates capability matrix baseline fields before evaluation.
   * @param capabilityMatrix Adapter capability matrix.
   */
  private assertCapabilityMatrix(capabilityMatrix: AgentCapabilityMatrix): void {
    if (!capabilityMatrix || typeof capabilityMatrix !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_MATRIX_INVALID,
        'Capability matrix must be an object.',
      );
    }
    if (!Array.isArray(capabilityMatrix.capabilityStates)) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_MATRIX_INVALID,
        'Capability matrix must provide capabilityStates array.',
      );
    }
    if (!capabilityMatrix.timeout || typeof capabilityMatrix.timeout !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_MATRIX_INVALID,
        'Capability matrix must provide timeout contract.',
      );
    }
    if (!capabilityMatrix.cancellation || typeof capabilityMatrix.cancellation !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_MATRIX_INVALID,
        'Capability matrix must provide cancellation contract.',
      );
    }
    if (!capabilityMatrix.contextWindow || typeof capabilityMatrix.contextWindow !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_MATRIX_INVALID,
        'Capability matrix must provide contextWindow contract.',
      );
    }
  }

  /**
   * Validates capability requirement baseline fields before evaluation.
   * @param requirement Route capability requirement.
   */
  private assertCapabilityRequirement(requirement: AgentCapabilityRequirement): void {
    if (!requirement || typeof requirement !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
        'Capability requirement must be an object.',
      );
    }
    if (
      !Array.isArray(requirement.requiredCapabilities) ||
      requirement.requiredCapabilities.length === 0
    ) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
        'Capability requirement must define at least one required capability.',
      );
    }
    for (const [index, capability] of requirement.requiredCapabilities.entries()) {
      this.assertCapabilityValue(capability, `requiredCapabilities[${index}]`);
    }

    if (requirement.allowDegradedCapabilities !== undefined) {
      if (!Array.isArray(requirement.allowDegradedCapabilities)) {
        throw new RuntimeError(
          GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
          'Capability requirement allowDegradedCapabilities must be an array.',
        );
      }
      for (const [index, capability] of requirement.allowDegradedCapabilities.entries()) {
        this.assertCapabilityValue(capability, `allowDegradedCapabilities[${index}]`);
      }
    }

    if (requirement.fallbackRules !== undefined) {
      if (!Array.isArray(requirement.fallbackRules)) {
        throw new RuntimeError(
          GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
          'Capability requirement fallbackRules must be an array.',
        );
      }

      for (const [index, fallbackRule] of requirement.fallbackRules.entries()) {
        if (!fallbackRule || typeof fallbackRule !== 'object') {
          throw new RuntimeError(
            GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
            `Capability requirement fallbackRules[${index}] must be an object.`,
          );
        }

        this.assertCapabilityValue(fallbackRule.capability, `fallbackRules[${index}].capability`);
        this.assertFallbackActionValue(
          fallbackRule.onUnsupported,
          `fallbackRules[${index}].onUnsupported`,
        );
        this.assertFallbackActionValue(
          fallbackRule.onDegraded,
          `fallbackRules[${index}].onDegraded`,
        );
        if (fallbackRule.note !== undefined && typeof fallbackRule.note !== 'string') {
          throw new RuntimeError(
            GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
            `Capability requirement fallbackRules[${index}].note must be a string when provided.`,
          );
        }
      }
    }
  }

  /**
   * Validates one capability enum value used by requirement fields.
   * @param value Raw capability value.
   * @param pointer Requirement pointer for diagnostics.
   */
  private assertCapabilityValue(value: unknown, pointer: string): void {
    if (typeof value !== 'string' || !this.capabilitySet.has(value)) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
        `${pointer} must be one of AgentCapability values.`,
      );
    }
  }

  /**
   * Validates one fallback action enum value used by requirement rules.
   * @param value Raw fallback action value.
   * @param pointer Requirement pointer for diagnostics.
   */
  private assertFallbackActionValue(value: unknown, pointer: string): void {
    if (typeof value !== 'string' || !this.fallbackActionSet.has(value)) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_CAPABILITY_REQUIREMENT_INVALID,
        `${pointer} must be one of AgentCapabilityFallbackAction values.`,
      );
    }
  }
}
