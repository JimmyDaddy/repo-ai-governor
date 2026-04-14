import type { AgentHealthCheckDiagnostic } from '@repo-ai-governor/adapter-sdk';
import type { AdapterRequestCancellationMode } from '@repo-ai-governor/shared';
import { expect } from 'vitest';

import { hasAgentHealthDiagnostic } from './native-cli-exec-compatibility-harness.js';

interface ProbeLaunchTruthProjectionExpectation {
  selectedEntrypoint: string | null | undefined;
  requestCancellationMode: AdapterRequestCancellationMode | null | undefined;
  diagnostics: AgentHealthCheckDiagnostic[] | null | undefined;
  expectedEntrypoint: string;
  expectedRequestCancellationMode: AdapterRequestCancellationMode;
  expectedShellWrapped: boolean;
  expectedProcessTreePolicy?: string;
  expectedSpawnErrorCode?: string | null;
}

interface InvokeLaunchTruthProjectionExpectation {
  details: Record<string, unknown> | null | undefined;
  expectedEntrypoint: string;
  expectedShellWrapped: boolean;
  expectedProcessTreePolicy: string;
}

interface FallbackEntrypointProjectionExpectation {
  attemptedEntrypoints: string[];
  expectedAttemptOrder: string[];
  projectedEntrypoint: string | null | undefined;
}

/**
 * Keeps probe-surface launch-authoring assertions centralized so adapters prove the same ownership
 * boundary instead of open-coding selected-entrypoint and cancellation-mode checks independently.
 */
export function expectProbeLaunchTruthProjected(
  expectation: ProbeLaunchTruthProjectionExpectation,
): void {
  expect(expectation.selectedEntrypoint).toBe(expectation.expectedEntrypoint);
  expect(expectation.requestCancellationMode).toBe(expectation.expectedRequestCancellationMode);
  expect(
    hasAgentHealthDiagnostic(
      expectation.diagnostics,
      'install.entrypoint_resolution',
      expectation.expectedEntrypoint,
    ),
  ).toBe(true);
  expect(
    hasAgentHealthDiagnostic(
      expectation.diagnostics,
      'protocol.shell_wrapped',
      String(expectation.expectedShellWrapped),
    ),
  ).toBe(true);

  if (typeof expectation.expectedSpawnErrorCode === 'string') {
    expect(
      hasAgentHealthDiagnostic(
        expectation.diagnostics,
        'install.spawn_error_code',
        expectation.expectedSpawnErrorCode,
      ),
    ).toBe(true);
    return;
  }

  expect(
    hasAgentHealthDiagnostic(
      expectation.diagnostics,
      'protocol.process_tree_policy',
      expectation.expectedProcessTreePolicy,
    ),
  ).toBe(true);
}

/**
 * Keeps invoke-surface launch-authoring assertions centralized across shared runtime and adapters.
 */
export function expectInvokeLaunchTruthProjected(
  expectation: InvokeLaunchTruthProjectionExpectation,
): void {
  expect(expectation.details?.selectedEntrypoint).toBe(expectation.expectedEntrypoint);
  expect(expectation.details?.shellWrapped).toBe(expectation.expectedShellWrapped);
  expect(expectation.details?.processTreePolicy).toBe(expectation.expectedProcessTreePolicy);
}

/**
 * Keeps fallback-entrypoint projection coverage expressed in one shared vocabulary.
 */
export function expectFallbackEntrypointProjection(
  expectation: FallbackEntrypointProjectionExpectation,
): void {
  expect(expectation.attemptedEntrypoints).toEqual(expectation.expectedAttemptOrder);
  expect(expectation.projectedEntrypoint).toBe(
    expectation.expectedAttemptOrder[expectation.expectedAttemptOrder.length - 1],
  );
}
