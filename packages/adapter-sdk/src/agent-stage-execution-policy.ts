import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
} from './constants/index.js';
import type { AgentStageExecutionPolicy } from './types/index.js';

/**
 * Resolves one optional stage-level execution policy from canonical stage input.
 *
 * Why this exists:
 * runtimes and adapters need one shared parser for machine-readable execution constraints so
 * policy hints do not drift into surface-specific magic property handling.
 */
export function resolveAgentStageExecutionPolicy(
  input: Record<string, unknown>,
): AgentStageExecutionPolicy | undefined {
  const candidate = input[AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return undefined;
  }

  const interactionMode =
    Object.values(AgentStageExecutionMode).find(
      (value) =>
        value ===
        (
          candidate as {
            interactionMode?: unknown;
          }
        ).interactionMode,
    ) ?? undefined;
  const toolUsePolicy =
    Object.values(AgentStageToolUsePolicy).find(
      (value) =>
        value ===
        (
          candidate as {
            toolUsePolicy?: unknown;
          }
        ).toolUsePolicy,
    ) ?? undefined;

  if (!interactionMode && !toolUsePolicy) {
    return undefined;
  }

  return {
    ...(interactionMode ? { interactionMode } : {}),
    ...(toolUsePolicy ? { toolUsePolicy } : {}),
  };
}
