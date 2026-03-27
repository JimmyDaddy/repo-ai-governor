import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { ResolvedWorkspace } from '@repo-ai-governor/config';
import type { ChangeRiskEvaluationResult } from '@repo-ai-governor/core-change-risk';
import type { PolicyGateEvaluationResult } from '@repo-ai-governor/core-policy';
import type { RuntimeExecutionResult } from '@repo-ai-governor/core-runtime';
import type { ExecutionReport, ReplayExplainResult } from '@repo-ai-governor/reporting';
import type { CliDeliveryRehearsalAction } from '../../constants/cli-task-driven-run.constant.js';
import type { CliReplayExplainResolution } from '../presentation/replay-explain-builder.js';

/**
 * Owns CLI-local artifact persistence so command orchestration no longer writes JSON/text payloads directly.
 */
export class CliRuntimeArtifactWriter {
  public constructor(
    private readonly workspace: Pick<ResolvedWorkspace, 'workspaceId' | 'workspaceRoot' | 'mode'>,
    private readonly toRfc3339SecondsTimestamp: (value: Date) => string,
  ) {}

  /**
   * Writes one UTF-8 text artifact and ensures parent directory exists.
   * @param filePath Absolute file path.
   * @param content UTF-8 content.
   * @returns Void.
   */
  public async writeTextArtifact(filePath: string, content: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
  }

  /**
   * Writes one JSON artifact with deterministic indentation.
   * @param filePath Absolute file path.
   * @param payload JSON payload.
   * @returns Void.
   */
  public async writeJsonArtifact(filePath: string, payload: unknown): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  /**
   * Safely reads JSON payload from artifact file.
   * @param filePath Absolute file path.
   * @returns Parsed object, or null when parsing fails.
   */
  public async safeReadJson(filePath: string): Promise<Record<string, unknown> | null> {
    try {
      const rawContent = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(rawContent) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Persists execution report and replay-explain artifacts for one run command.
   * @param options Report/replay persistence inputs.
   * @returns Written report and replay paths.
   */
  public async writeExecutionReportArtifacts(options: {
    executionId: string;
    executionReport: ExecutionReport;
    replayExplainResult: ReplayExplainResult;
  }): Promise<{
    reportPath: string;
    replayPath: string;
  }> {
    const reportPath = resolve(
      this.workspace.workspaceRoot,
      'context',
      'reports',
      `${options.executionId}.report.json`,
    );
    const replayPath = resolve(
      this.workspace.workspaceRoot,
      'context',
      'replay',
      `${options.executionId}.replay.json`,
    );

    await this.writeJsonArtifact(reportPath, options.executionReport);
    await this.writeJsonArtifact(replayPath, options.replayExplainResult);

    return {
      reportPath,
      replayPath,
    };
  }

  /**
   * Persists one controlled delivery rehearsal artifact for audit/replay consumption.
   * @param options Delivery rehearsal payload context.
   * @returns Written artifact path.
   */
  public async writeDeliveryRehearsalArtifact(options: {
    executionId: string;
    rehearsalAction: CliDeliveryRehearsalAction;
    payload: Record<string, unknown>;
  }): Promise<string> {
    const rehearsalPath = resolve(
      this.workspace.workspaceRoot,
      'context',
      'delivery',
      'rehearsal',
      `${options.executionId}.${options.rehearsalAction}.json`,
    );
    await this.writeJsonArtifact(rehearsalPath, options.payload);
    return rehearsalPath;
  }

  /**
   * Writes one layered diagnostics trace artifact for run execution.
   * @param options Run execution context.
   * @returns Trace artifact path.
   */
  public async writeRunDiagnosticsTraceArtifact(options: {
    executionId: string;
    executionSessionId: string;
    runtimeResult: RuntimeExecutionResult;
    policyResult: PolicyGateEvaluationResult;
    riskEvaluation: ChangeRiskEvaluationResult;
    reportPath: string;
    replayPath: string;
    runtimeDebugOptions: {
      dryRun: boolean;
      trace: boolean;
    };
    rootCause: string;
    nextActions: string[];
  }): Promise<string> {
    const tracePath = resolve(
      this.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'trace',
      `${options.executionId}.trace.json`,
    );
    const errorContext = options.runtimeResult.stageResults
      .filter((stageResult) => Boolean(stageResult.errorMessage))
      .map((stageResult) => ({
        stageId: stageResult.stageId,
        nodeId: stageResult.nodeId,
        status: stageResult.status,
        errorMessage: stageResult.errorMessage ?? null,
      }));
    const adapterInvocationSummary = options.runtimeResult.stageResults.map((stageResult) => {
      const output =
        stageResult.output && typeof stageResult.output === 'object' ? stageResult.output : null;

      return {
        stageId: stageResult.stageId,
        nodeId: stageResult.nodeId,
        handledBy:
          output && typeof output.handledBy === 'string' ? output.handledBy : 'unknown_handler',
        routeKey: output && typeof output.routeKey === 'string' ? output.routeKey : 'unknown_route',
        selectedSurface:
          output && typeof output.selectedSurface === 'string'
            ? output.selectedSurface
            : 'unknown_surface',
        adapterSurface:
          output && typeof output.adapterSurface === 'string'
            ? output.adapterSurface
            : 'unknown_surface',
        localFallbackActivated:
          output && typeof output.localFallbackActivated === 'boolean'
            ? output.localFallbackActivated
            : false,
        restrictedReason:
          output && typeof output.restrictedReason === 'string' ? output.restrictedReason : null,
      };
    });

    await this.writeJsonArtifact(tracePath, {
      diagnosticsId: `trace-${options.executionId}`,
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: this.workspace.workspaceId,
        workspaceRoot: this.workspace.workspaceRoot,
        workspaceMode: this.workspace.mode,
      },
      mode: {
        dryRun: options.runtimeDebugOptions.dryRun,
        trace: options.runtimeDebugOptions.trace,
        replay: false,
      },
      summary: {
        executionId: options.executionId,
        executionSessionId: options.executionSessionId,
        runtimeStatus: options.runtimeResult.status,
        policyOutcome: options.policyResult.policyOutcome,
        riskLevel: options.riskEvaluation.riskLevel,
        rootCause: options.rootCause,
      },
      keyEvents: [
        {
          eventId: 'compile',
          status: 'succeeded',
          detail: 'Compiled IR snapshot generated.',
        },
        ...options.runtimeResult.stageResults.map((stageResult) => ({
          eventId: stageResult.stageId,
          status: stageResult.status,
          detail: `duration_ms=${stageResult.durationMs}`,
        })),
        {
          eventId: 'policy',
          status: options.policyResult.policyOutcome === 'allow' ? 'allow' : 'requires_attention',
          detail: `matched_rules=${options.policyResult.matchedRuleIds.join('|') || 'none'}`,
        },
        {
          eventId: 'report_replay_persisted',
          status: 'succeeded',
          detail: `report=${options.reportPath} replay=${options.replayPath}`,
        },
      ],
      stageTimings: options.runtimeResult.stageResults.map((stageResult) => ({
        stageId: stageResult.stageId,
        nodeId: stageResult.nodeId,
        status: stageResult.status,
        startedAt: stageResult.startedAt,
        endedAt: stageResult.endedAt,
        durationMs: stageResult.durationMs,
      })),
      policyDecision: {
        outcome: options.policyResult.policyOutcome,
        matchedRuleIds: options.policyResult.matchedRuleIds,
        matchedPolicies: options.policyResult.matchedPolicies,
        riskReasons: options.riskEvaluation.riskReasons.map((reason) => reason.code),
      },
      adapterInvocationSummary,
      errorContext: {
        stageErrors: errorContext,
        interruption: options.runtimeResult.interruption ?? null,
      },
      nextActions: options.nextActions,
    });

    return tracePath;
  }

  /**
   * Writes replay diagnostics artifact and optional trace artifact for one replay run.
   * @param options Replay diagnostics context.
   * @returns Paths written during replay diagnostics persistence.
   */
  public async writeReplayDiagnosticsArtifacts(options: {
    replayPath: string;
    replayResolution: CliReplayExplainResolution;
    locale: string;
    runtimeDebugOptions: {
      dryRun: boolean;
      trace: boolean;
    };
    nextActions: string[];
  }): Promise<{
    diagnosticsId: string;
    diagnosticsPath: string;
    tracePath: string | null;
  }> {
    const diagnosticsId = `replay-diagnostics-${Date.now()}`;
    const diagnosticsPath = resolve(
      this.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'replay',
      `${diagnosticsId}.json`,
    );

    await this.writeJsonArtifact(diagnosticsPath, {
      diagnosticsId,
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: this.workspace.workspaceId,
        workspaceRoot: this.workspace.workspaceRoot,
        workspaceMode: this.workspace.mode,
      },
      replay: {
        sourcePath: options.replayPath,
        sourceType: options.replayResolution.sourceType,
        executionId: options.replayResolution.executionId,
      },
      summary: {
        matchedCount: options.replayResolution.explainResult.matchedCount,
        outputLocale: options.locale,
        nextActions: options.nextActions,
        ...(options.replayResolution.memorySemantics
          ? {
              memorySemantics: {
                contextSelectedCount: options.replayResolution.memorySemantics.contextSelectedCount,
                contextAssemblyOutcome:
                  options.replayResolution.memorySemantics.contextAssemblyOutcome,
                policyOverallAction: options.replayResolution.memorySemantics.policyOverallAction,
                warningRecordCount: options.replayResolution.memorySemantics.warningRecordCount,
                redactedRecordCount: options.replayResolution.memorySemantics.redactedRecordCount,
                blockedRecordCount: options.replayResolution.memorySemantics.blockedRecordCount,
                promotionOutcome: options.replayResolution.memorySemantics.promotionOutcome,
                plannedMergeCount: options.replayResolution.memorySemantics.plannedMergeCount,
                mergedCount: options.replayResolution.memorySemantics.mergedCount,
                sessionSummaryProjectionKey:
                  options.replayResolution.memorySemantics.sessionSummaryProjectionKey,
              },
            }
          : {}),
      },
      explain: options.replayResolution.explainResult,
    });

    let tracePath: string | null = null;
    if (options.runtimeDebugOptions.trace) {
      tracePath = resolve(
        this.workspace.workspaceRoot,
        'context',
        'diagnostics',
        'trace',
        `${diagnosticsId}.trace.json`,
      );
      await this.writeJsonArtifact(tracePath, {
        diagnosticsId,
        generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
        mode: {
          dryRun: options.runtimeDebugOptions.dryRun,
          trace: options.runtimeDebugOptions.trace,
          replay: true,
        },
        keyEvents: [
          {
            eventId: 'replay_input_resolved',
            status: 'succeeded',
            detail: `source_type=${options.replayResolution.sourceType}`,
          },
          {
            eventId: 'replay_explain_resolved',
            status: 'succeeded',
            detail: `matched_count=${options.replayResolution.explainResult.matchedCount}`,
          },
        ],
        nextActions: options.nextActions,
      });
    }

    return {
      diagnosticsId,
      diagnosticsPath,
      tracePath,
    };
  }
}
