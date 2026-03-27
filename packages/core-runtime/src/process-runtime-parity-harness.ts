import type { RuntimeExecutionResult } from './types/index.js';
import type {
  ProcessRuntimeParityCompareOptions,
  ProcessRuntimeParityDiff,
  ProcessRuntimeParityDimension,
  ProcessRuntimeParityExecutionSnapshot,
  ProcessRuntimeParityPreparedProfileSnapshot,
  ProcessRuntimeParityReport,
  ProcessRuntimeParitySnapshot,
  ProcessRuntimePreparedExecutionProfile,
} from './types/index.js';

function sortStrings(values?: string[]): string[] | undefined {
  return values ? [...values].sort((left, right) => left.localeCompare(right)) : undefined;
}

function stableClone(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableClone(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, stableClone(nestedValue)]),
    );
  }

  return value;
}

export class ProcessRuntimeParityHarness {
  public createPreparedProfileSnapshot(
    profile: ProcessRuntimePreparedExecutionProfile,
  ): ProcessRuntimeParityPreparedProfileSnapshot {
    return {
      entryNodeId: profile.entryNodeId,
      currentStatus: profile.currentStatus,
      nodeCount: profile.nodeCount,
      edgeCount: profile.edgeCount,
      initialNodeIds: [...profile.initialNodeIds],
      supportedInterruptKinds: [...profile.supportedInterruptKinds],
      supportedTerminalStatuses: [...profile.supportedTerminalStatuses],
    };
  }

  public createExecutionSnapshot(
    runtimeResult: RuntimeExecutionResult,
  ): ProcessRuntimeParityExecutionSnapshot {
    return {
      status: runtimeResult.status,
      ...(runtimeResult.interruption?.reason
        ? { interruptionReason: runtimeResult.interruption.reason }
        : {}),
      visitedNodeIds: [...runtimeResult.visitedNodeIds],
      stageResults: runtimeResult.stageResults.map((stageResult) => ({
        stageId: stageResult.stageId,
        status: stageResult.status,
      })),
    };
  }

  public compare(options: ProcessRuntimeParityCompareOptions): ProcessRuntimeParityReport {
    const comparedDimensions = new Set<ProcessRuntimeParityDimension>();
    const blockingDiffs: ProcessRuntimeParityDiff[] = [];
    const advisoryDiffs: ProcessRuntimeParityDiff[] = [];

    this.compareValue(
      'prepared_execution_profile',
      'preparedProfile',
      this.normalizePreparedProfile(options.candidate.preparedProfile),
      this.normalizePreparedProfile(options.baseline.preparedProfile),
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'output_contract',
      'prettyOutput',
      this.normalizeObject(options.candidate.prettyOutput),
      this.normalizeObject(options.baseline.prettyOutput),
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'output_contract',
      'plainOutput',
      options.candidate.plainOutput,
      options.baseline.plainOutput,
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'output_contract',
      'jsonOutput',
      this.normalizeObject(options.candidate.jsonOutput),
      this.normalizeObject(options.baseline.jsonOutput),
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'artifact_state',
      'artifactPaths',
      sortStrings(options.candidate.artifactPaths),
      sortStrings(options.baseline.artifactPaths),
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'audit_state',
      'auditRecordIds',
      sortStrings(options.candidate.auditRecordIds),
      sortStrings(options.baseline.auditRecordIds),
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'review_state',
      'reviewState',
      options.candidate.reviewState,
      options.baseline.reviewState,
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'hitl_state',
      'hitlState',
      options.candidate.hitlState,
      options.baseline.hitlState,
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'recovery_state',
      'recoveryState',
      options.candidate.recoveryState,
      options.baseline.recoveryState,
      comparedDimensions,
      blockingDiffs,
    );
    this.compareValue(
      'execution_state',
      'execution',
      this.normalizeExecution(options.candidate.execution),
      this.normalizeExecution(options.baseline.execution),
      comparedDimensions,
      blockingDiffs,
    );

    return {
      pass: blockingDiffs.length === 0,
      baselineBackend: options.baseline.backend,
      candidateBackend: options.candidate.backend,
      comparedDimensions: [...comparedDimensions],
      blockingDiffs,
      advisoryDiffs,
    };
  }

  private normalizeObject(value?: Record<string, unknown>): unknown {
    return value ? stableClone(value) : undefined;
  }

  private normalizePreparedProfile(
    value?: ProcessRuntimeParitySnapshot['preparedProfile'],
  ): ProcessRuntimeParityPreparedProfileSnapshot | undefined {
    if (!value) {
      return undefined;
    }

    return {
      entryNodeId: value.entryNodeId,
      currentStatus: value.currentStatus,
      nodeCount: value.nodeCount,
      edgeCount: value.edgeCount,
      initialNodeIds: [...value.initialNodeIds],
      supportedInterruptKinds: sortStrings(value.supportedInterruptKinds) ?? [],
      supportedTerminalStatuses: sortStrings(value.supportedTerminalStatuses) ?? [],
    };
  }

  private normalizeExecution(
    value?: ProcessRuntimeParitySnapshot['execution'],
  ): ProcessRuntimeParityExecutionSnapshot | undefined {
    if (!value) {
      return undefined;
    }

    return {
      status: value.status,
      ...(value.interruptionReason ? { interruptionReason: value.interruptionReason } : {}),
      ...(value.visitedNodeIds ? { visitedNodeIds: [...value.visitedNodeIds] } : {}),
      ...(value.stageResults
        ? {
            stageResults: [...value.stageResults].sort((left, right) => {
              const leftKey = `${left.stageId}:${left.status}`;
              const rightKey = `${right.stageId}:${right.status}`;
              return leftKey.localeCompare(rightKey);
            }),
          }
        : {}),
    };
  }

  private compareValue(
    dimension: ProcessRuntimeParityDimension,
    field: string,
    candidateValue: unknown,
    baselineValue: unknown,
    comparedDimensions: Set<ProcessRuntimeParityDimension>,
    blockingDiffs: ProcessRuntimeParityDiff[],
  ): void {
    if (candidateValue === undefined && baselineValue === undefined) {
      return;
    }

    comparedDimensions.add(dimension);
    if (JSON.stringify(candidateValue) === JSON.stringify(baselineValue)) {
      return;
    }

    blockingDiffs.push({
      dimension,
      field,
      severity: 'blocking',
      candidateValue,
      baselineValue,
      message: `Parity drift detected for ${dimension}.${field}.`,
    });
  }
}
