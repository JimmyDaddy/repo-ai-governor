import type { AgentHealthCheckDiagnostic } from '@repo-ai-governor/adapter-sdk';
import { expect } from 'vitest';

export const NATIVE_CLI_EXEC_COMPATIBILITY_SCENARIO_CLASSES = [
  'spawn_failed',
  'probe_protocol_parse_failed',
  'invoke_protocol_parse_failed',
  'non_zero_exit',
  'signal_exit',
  'timeout_soft_terminated',
  'timeout_hard_terminated',
  'abort_soft_terminated',
  'abort_hard_terminated',
] as const;

export type NativeCliExecCompatibilityScenarioClass =
  (typeof NATIVE_CLI_EXEC_COMPATIBILITY_SCENARIO_CLASSES)[number];

export const NATIVE_CLI_EXEC_PRESERVED_FACTS = [
  'launch_diagnostics_preserved',
  'adapter_launch_truth_projected',
  'terminate_phase_preserved',
  'partial_output_preserved_when_available',
] as const;

export type NativeCliExecPreservedFact = (typeof NATIVE_CLI_EXEC_PRESERVED_FACTS)[number];

export const NATIVE_CLI_EXEC_REQUIRED_PRESERVED_FACTS_BY_SCENARIO_CLASS = {
  spawn_failed: ['launch_diagnostics_preserved', 'adapter_launch_truth_projected'],
  probe_protocol_parse_failed: ['launch_diagnostics_preserved', 'adapter_launch_truth_projected'],
  invoke_protocol_parse_failed: ['launch_diagnostics_preserved', 'adapter_launch_truth_projected'],
  non_zero_exit: ['launch_diagnostics_preserved', 'adapter_launch_truth_projected'],
  signal_exit: ['launch_diagnostics_preserved', 'adapter_launch_truth_projected'],
  timeout_soft_terminated: [
    'launch_diagnostics_preserved',
    'adapter_launch_truth_projected',
    'terminate_phase_preserved',
    'partial_output_preserved_when_available',
  ],
  timeout_hard_terminated: [
    'launch_diagnostics_preserved',
    'adapter_launch_truth_projected',
    'terminate_phase_preserved',
    'partial_output_preserved_when_available',
  ],
  abort_soft_terminated: [
    'launch_diagnostics_preserved',
    'adapter_launch_truth_projected',
    'terminate_phase_preserved',
    'partial_output_preserved_when_available',
  ],
  abort_hard_terminated: [
    'launch_diagnostics_preserved',
    'adapter_launch_truth_projected',
    'terminate_phase_preserved',
    'partial_output_preserved_when_available',
  ],
} as const satisfies Record<
  NativeCliExecCompatibilityScenarioClass,
  readonly NativeCliExecPreservedFact[]
>;

/**
 * Keeps scenario-class expectations centralized so cross-adapter tests speak one vocabulary.
 * Individual tests still decide how each fact is observed on their own surface.
 */
export function expectNativeCliExecPreservedFacts(
  scenarioClass: NativeCliExecCompatibilityScenarioClass,
  observedFacts: Partial<Record<NativeCliExecPreservedFact, boolean>>,
): void {
  const requiredFacts = NATIVE_CLI_EXEC_REQUIRED_PRESERVED_FACTS_BY_SCENARIO_CLASS[scenarioClass];

  for (const requiredFact of requiredFacts) {
    expect(observedFacts[requiredFact], `${scenarioClass} must preserve ${requiredFact}`).toBe(
      true,
    );
  }
}

/**
 * Reads one health-check diagnostic row from adapter probe surfaces without re-encoding matcher logic.
 */
export function hasAgentHealthDiagnostic(
  diagnostics: AgentHealthCheckDiagnostic[] | null | undefined,
  code: string,
  detail?: string,
): boolean {
  return (
    diagnostics?.some(
      (diagnostic) =>
        diagnostic.code === code && (detail === undefined || diagnostic.detail === detail),
    ) ?? false
  );
}

/**
 * Collects normalized status values from streamed adapter events for timeout / abort compatibility checks.
 */
export function collectStreamEventStatuses(
  events: Array<{ payload: Record<string, unknown> }>,
): string[] {
  return events
    .map((event) => event.payload.status)
    .filter((status): status is string => typeof status === 'string');
}
