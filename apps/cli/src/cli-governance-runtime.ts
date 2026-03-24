import { execFile } from "node:child_process";
import { constants as FsConstants, existsSync } from "node:fs";
import { access, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { ClaudeCodeAgentAdapter } from "@repo-ai-governor/adapter-claude-code";
import { CodexAgentAdapter } from "@repo-ai-governor/adapter-codex";
import { GithubCopilotAgentAdapter } from "@repo-ai-governor/adapter-github-copilot";
import { LocalModelAgentAdapter } from "@repo-ai-governor/adapter-local-model";
import { AgentCapability, AgentNetworkMode, AgentRouteRunner } from "@repo-ai-governor/adapter-sdk";
import type { AdaptersConfig, ResolvedWorkspace } from "@repo-ai-governor/config";
import {
  ChangeRiskEvaluator,
  ChangeRiskFileCategory,
  type ChangeRiskFileCategoryValue,
  ChangeRiskRequiredAction,
} from "@repo-ai-governor/core-change-risk";
import { MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
import { PolicyGateEngine } from "@repo-ai-governor/core-policy";
import {
  ProcessCompiler,
  type ProcessDslDefinition,
  type ProcessIrNode,
  ProcessNodeType,
} from "@repo-ai-governor/core-process";
import {
  ProcessRuntimeEngine,
  type RuntimeExecutionResult,
  RuntimeExecutionStatus,
  type RuntimeStageContext,
  RuntimeStageStatus,
  RuntimeTimeoutScope,
} from "@repo-ai-governor/core-runtime";
import { AuditOutputMode, AuditRecordStatus, AuditRecorder } from "@repo-ai-governor/core-session";
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from "@repo-ai-governor/memory-store-adapter";
import { ReportBuilder } from "@repo-ai-governor/reporting";
import {
  AdapterAvailability,
  AdapterSurface,
  DefaultRoleProfileId,
  ErrorOutputEnvironment,
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  type MemoryRuntimeConfig,
  RuntimeError,
  WorkspaceMigrationPolicy,
} from "@repo-ai-governor/shared";
import { CliCheckCommand } from "./commands/check-command.js";
import { CliCommandRegistry } from "./commands/cli-command-registry.js";
import { CliConnectCommand } from "./commands/connect-command.js";
import { CliDoctorCommand } from "./commands/doctor-command.js";
import { CliInitCommand } from "./commands/init-command.js";
import { CliPlanCommand } from "./commands/plan-command.js";
import { CliUpgradeCommand } from "./commands/upgrade-command.js";
import { CliVerifyCommand } from "./commands/verify-command.js";
import { CliCommandName } from "./constants/cli-command.constant.js";
import {
  CLI_ADAPTER_FAILURE_ATTRIBUTION,
  CLI_BASELINE_DOC_PATHS,
  CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS,
  CLI_DIAGNOSTIC_ROOT_CAUSE,
  CLI_DOCTOR_ATTACH_MODE,
  CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS,
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "./constants/cli-governance-runtime.constant.js";
import { CliAdapterDiagnosticsRuntime } from "./runtime/adapter-diagnostics-runtime.js";
import { CliAdapterRoutingRuntime } from "./runtime/adapter-routing-runtime.js";
import { CliAdapterVerificationRuntime } from "./runtime/adapter-verification-runtime.js";
import { CliReviewQueueRuntime } from "./runtime/artifacts/review-queue-runtime.js";
import { CliRuntimeArtifactWriter } from "./runtime/artifacts/runtime-artifact-writer.js";
import { CliLocalModelProbeRuntime } from "./runtime/local-model-probe-runtime.js";
import { CliCommandExperienceBuilder } from "./runtime/presentation/command-experience-builder.js";
import { CliReplayExplainBuilder } from "./runtime/presentation/replay-explain-builder.js";
import type {
  CliAdapterVerificationResolution,
  CliCheckTotals,
  CliCommandExecutionResultPayload,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliGovernanceCommandResult,
  CliGovernanceRuntimeOptions,
  CliInteractionPrompt,
  CliLocalAdapterProbeOverride,
  CliNormalizedRuntimeDebugOptions,
  CliRoleStageProgress,
  CliRuntimeDebugOptions,
} from "./types/index.js";

const execFileAsync = promisify(execFile);

interface CliExecutionStreamMetadata {
  projectId?: string;
  sprintId?: string;
}

/**
 * Implements Stage-9 CLI command semantics with a minimal governance execution chain.
 *
 * Why this exists:
 * command runtime behavior must be centralized so `init/connect/doctor/check/run/review/review-verify/verify/plan/upgrade`
 * stay deterministic across CLI entrypoints and output modes.
 */
export class CliGovernanceRuntime {
  private readonly commandRegistry: CliCommandRegistry;
  private readonly localModelProbeRuntime: CliLocalModelProbeRuntime;
  private readonly adapterRoutingRuntime: CliAdapterRoutingRuntime;
  private readonly adapterVerificationRuntime: CliAdapterVerificationRuntime;
  private readonly adapterDiagnosticsRuntime: CliAdapterDiagnosticsRuntime;
  private readonly artifactWriter: CliRuntimeArtifactWriter;
  private readonly reviewQueueRuntime: CliReviewQueueRuntime;
  private readonly commandExperienceBuilder: CliCommandExperienceBuilder;
  private readonly replayExplainBuilder: CliReplayExplainBuilder;

  public constructor(private readonly options: CliGovernanceRuntimeOptions) {
    this.localModelProbeRuntime = new CliLocalModelProbeRuntime(
      this.options.adapterLocalProbeOverrides,
      this.options.commandProbeExecutor,
      (error) => this.formatExecFailureDetail(error),
    );
    this.adapterRoutingRuntime = new CliAdapterRoutingRuntime(this.options.adaptersConfig);
    this.adapterVerificationRuntime = new CliAdapterVerificationRuntime(
      this.options.adaptersConfig,
      (english, chinese) => this.localizeText(english, chinese),
      (error) => this.formatExecFailureDetail(error),
      this.adapterRoutingRuntime,
      this.localModelProbeRuntime,
    );
    this.adapterDiagnosticsRuntime = new CliAdapterDiagnosticsRuntime(
      (english, chinese) => this.localizeText(english, chinese),
      (verification) =>
        this.adapterVerificationRuntime.createFailureAttributionSummary(verification),
    );
    this.artifactWriter = new CliRuntimeArtifactWriter(this.options.workspace, (value) =>
      this.toRfc3339SecondsTimestamp(value),
    );
    this.reviewQueueRuntime = new CliReviewQueueRuntime(
      this.options.workspace.workspaceRoot,
      (filePath) => this.artifactWriter.safeReadJson(filePath),
    );
    this.commandExperienceBuilder = new CliCommandExperienceBuilder();
    this.replayExplainBuilder = new CliReplayExplainBuilder();
    this.commandRegistry = new CliCommandRegistry([
      new CliInitCommand(),
      new CliConnectCommand(),
      new CliDoctorCommand(),
      new CliCheckCommand(),
      new CliVerifyCommand(),
      new CliPlanCommand(),
      new CliUpgradeCommand(),
    ]);
  }

  /**
   * Executes one CLI command with deterministic runtime semantics.
   * @param commandName Command name selected by CLI parser.
   * @returns Command result message and structured output payload.
   */
  public async execute(commandName: CliCommandName): Promise<CliGovernanceCommandResult> {
    if (commandName !== CliCommandName.INIT) {
      await this.ensureWorkspaceBootstrap();
    }

    const extractedCommandExecutor = this.commandRegistry.resolve(commandName);
    if (extractedCommandExecutor) {
      return extractedCommandExecutor.execute(this.createCommandExecutorContext());
    }

    if (commandName === CliCommandName.RUN) {
      return this.executeRunCommand();
    }

    if (commandName === CliCommandName.REVIEW) {
      return this.executeReviewCommand();
    }

    if (commandName === CliCommandName.REVIEW_VERIFY) {
      return this.executeReviewVerifyCommand();
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Unsupported CLI command "${commandName}".`,
      {
        commandName,
      },
    );
  }

  /**
   * Ensures baseline workspace directories and config exist for non-init commands.
   *
   * Why this exists:
   * global/local CLI usage should match user expectation that first command execution
   * can self-bootstrap workspace state without requiring a separate explicit init step.
   */
  private async ensureWorkspaceBootstrap(): Promise<void> {
    for (const segments of CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS) {
      const directoryPath = resolve(this.options.workspace.workspaceRoot, ...segments);
      await mkdir(directoryPath, { recursive: true });
    }

    const configPath = this.options.workspace.configPath;
    if (!existsSync(configPath)) {
      await this.artifactWriter.writeTextArtifact(configPath, this.buildDefaultConfigContent());
    }
  }

  /**
   * Creates one stable context object for extracted command executors.
   * @returns Command executor context.
   */
  private createCommandExecutorContext() {
    return {
      options: this.options,
      artifactWriter: this.artifactWriter,
      adapterDiagnosticsRuntime: this.adapterDiagnosticsRuntime,
      commandExperienceBuilder: this.commandExperienceBuilder,
      calculateCheckTotals: (checks: CliCommandResultCheck[]) => this.calculateCheckTotals(checks),
      buildDefaultConfigContent: () => this.buildDefaultConfigContent(),
      toRfc3339SecondsTimestamp: (value: Date) => this.toRfc3339SecondsTimestamp(value),
      formatExecFailureDetail: (error: unknown) => this.formatExecFailureDetail(error),
      resolveRuntimeDebugOptions: () => this.resolveRuntimeDebugOptions(),
      resolveAdapterVerification: async () => this.resolveAdapterVerification(),
      canWritePath: async (filePath: string) => this.canWritePath(filePath),
      localizeText: (english: string, chinese: string) => this.localizeText(english, chinese),
      runNodeScript: async (scriptPath: string) =>
        execFileAsync(process.execPath, [scriptPath], {
          cwd: this.options.currentWorkingDirectory,
          maxBuffer: 5 * 1024 * 1024,
          encoding: "utf8",
        }),
    };
  }

  /**
   * Executes compiler -> runtime -> policy -> audit/report minimal chain.
   * @returns Runtime command result.
   */
  private async executeRunCommand(): Promise<CliGovernanceCommandResult> {
    const runtimeDebugOptions = this.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.replayPath) {
      return this.executeRunReplayCommand(runtimeDebugOptions);
    }

    const executionId = `cli-run-${Date.now()}`;
    const processCompiler = new ProcessCompiler();
    const processRuntimeEngine = new ProcessRuntimeEngine(processCompiler);
    const changeRiskEvaluator = new ChangeRiskEvaluator();
    const policyGateEngine = new PolicyGateEngine();
    const processDefinition = this.createCliRunProcessDefinition(executionId);
    const compiledIr = processCompiler.compile(processDefinition);

    if (compiledIr.compileErrors.length > 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_IR_CONTAINS_COMPILE_ERRORS,
        "Run command failed because compile errors are present in generated process IR.",
        {
          executionId,
          compileErrorCount: compiledIr.compileErrors.length,
        },
      );
    }

    const compiledIrSnapshotPath = processCompiler.persistCompiledIrSnapshot(
      this.options.workspace.workspaceRoot,
      compiledIr,
    );
    const nodeById = new Map<string, ProcessIrNode>(
      compiledIr.nodes.map((node) => [node.nodeId, node] as const),
    );
    const routeRunner = this.createRunRouteRunner(compiledIr.nodes, {
      includeLocalModelFallbackCandidate: !runtimeDebugOptions.restrictedNetwork,
    });
    const runtimeResult = await processRuntimeEngine.execute(compiledIr, async (stageContext) => ({
      ...(await this.dispatchRunStageWithAdapterRoute(
        routeRunner,
        stageContext,
        runtimeDebugOptions,
      )),
    }));

    const changedPaths = await this.collectGitChangedPaths();
    const fileCategories = this.resolveRiskFileCategories(changedPaths);
    const riskEvaluation = changeRiskEvaluator.evaluate({
      changedPaths,
      fileCategories,
      requestedPermissions: [],
      commandClass: "code_edit",
      lockfileDelta: changedPaths.some((path) => path.endsWith("pnpm-lock.yaml")),
      migrationDetected: changedPaths.some(
        (path) => path.includes("migration") || path.includes("migrations"),
      ),
      ciWorkflowChanged: changedPaths.some((path) => path.includes(".github/workflows/")),
      releaseScriptChanged: changedPaths.some((path) => path.includes("scripts/release")),
    });
    const policyResult = policyGateEngine.evaluate({
      riskEvaluation,
      context: {
        executionId,
        stageId: "stage-policy-gate",
        routeKey: "policy.gate.cli.run",
        proposalApproved: true,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    const memoryManager = new MemoryManager(
      new MemoryStoreAdapter(this.options.memoryStoreProvider),
    );
    const auditRecorder = new AuditRecorder(memoryManager);
    const executionSessionId = `session-${executionId}`;
    const streamMetadata = await this.resolveExecutionStreamMetadata();

    for (const stageResult of runtimeResult.stageResults) {
      const node = nodeById.get(stageResult.nodeId);
      const recordedAt = stageResult.endedAt;
      await auditRecorder.recordEvent({
        recordId: `${executionId}-${stageResult.nodeId}-${stageResult.attempt}`,
        recordedAt,
        event: {
          executionId,
          stageId: stageResult.stageId,
          routeKey: node?.routeKey ?? `route.${stageResult.nodeId}`,
          surface: "cli",
          agentRole: "governor_runtime",
          roleProfileId: node?.roleProfileId ?? "role.default.runtime",
          roleSource: "default",
          policyOutcome: policyResult.policyOutcome,
          status: this.resolveAuditRecordStatus(stageResult.status),
          startedAt: stageResult.startedAt,
          endedAt: stageResult.endedAt,
          startedAtDisplay: this.toDisplayTimestamp(stageResult.startedAt),
          endedAtDisplay: this.toDisplayTimestamp(stageResult.endedAt),
          executionSessionId,
          memoryScope: MemoryScope.EXECUTION,
          memoryDelta: {
            output: stageResult.output ?? {},
            durationMs: stageResult.durationMs,
          },
          workspaceId: this.options.workspace.workspaceId,
          workspaceMode: this.options.workspace.mode,
          workspaceRoot: this.options.workspace.workspaceRoot,
          ...streamMetadata,
          riskLevel: riskEvaluation.riskLevel,
          riskReasons: riskEvaluation.riskReasons.map((reason) => reason.code),
          requiredAction: riskEvaluation.requiredAction,
          matchedPolicies: policyResult.matchedPolicies,
          outputMode: this.resolveAuditOutputMode(this.options.outputMode),
          isTty: this.options.isTty,
          outputLocale: this.options.locale,
          timeoutIndicator: stageResult.status === RuntimeStageStatus.TIMEOUT,
          ...(stageResult.status === RuntimeStageStatus.TIMEOUT
            ? { timeoutScope: RuntimeTimeoutScope.STAGE }
            : {}),
          ...(stageResult.errorMessage ? { error: stageResult.errorMessage } : {}),
        },
      });
    }

    await auditRecorder.recordEvent({
      recordId: `${executionId}-policy`,
      recordedAt: this.toRfc3339SecondsTimestamp(new Date()),
      event: {
        executionId,
        stageId: "stage-policy-gate",
        routeKey: "policy.gate.cli.run",
        surface: "cli",
        agentRole: "governor_runtime",
        roleProfileId: "role.default.runtime",
        roleSource: "default",
        policyOutcome: policyResult.policyOutcome,
        status: this.resolvePolicyAuditRecordStatus(policyResult.policyOutcome),
        startedAt: runtimeResult.startedAt,
        endedAt: runtimeResult.endedAt,
        startedAtDisplay: this.toDisplayTimestamp(runtimeResult.startedAt),
        endedAtDisplay: this.toDisplayTimestamp(runtimeResult.endedAt),
        executionSessionId,
        memoryScope: MemoryScope.EXECUTION,
        memoryDelta: {
          policyOutcome: policyResult.policyOutcome,
          matchedRuleIds: policyResult.matchedRuleIds,
        },
        workspaceId: this.options.workspace.workspaceId,
        workspaceMode: this.options.workspace.mode,
        workspaceRoot: this.options.workspace.workspaceRoot,
        ...streamMetadata,
        riskLevel: riskEvaluation.riskLevel,
        riskReasons: riskEvaluation.riskReasons.map((reason) => reason.code),
        requiredAction: riskEvaluation.requiredAction,
        matchedPolicies: policyResult.matchedPolicies,
        outputMode: this.resolveAuditOutputMode(this.options.outputMode),
        isTty: this.options.isTty,
        outputLocale: this.options.locale,
      },
    });

    const reportBuilder = new ReportBuilder(auditRecorder);
    const executionReport = await reportBuilder.buildExecutionReport({
      executionId,
      includeRecords: false,
    });
    const replayExplainResult = this.replayExplainBuilder.buildFromExecutionReport(
      executionReport,
      1,
    );
    const { reportPath, replayPath } = await this.artifactWriter.writeExecutionReportArtifacts({
      executionId,
      executionReport,
      replayExplainResult,
    });

    const artifacts: CliCommandResultArtifact[] = [
      {
        id: "compiled_ir_snapshot",
        path: compiledIrSnapshotPath,
      },
      {
        id: "execution_report",
        path: reportPath,
      },
      {
        id: "replay_explain",
        path: replayPath,
      },
    ];
    const checks: CliCommandResultCheck[] = [
      {
        id: "compile",
        status: CliGovernanceCheckStatus.PASS,
        detail: `warnings=${compiledIr.compileWarnings.length} errors=${compiledIr.compileErrors.length}`,
      },
      {
        id: "runtime",
        status:
          runtimeResult.status === RuntimeExecutionStatus.SUCCEEDED
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: `status=${runtimeResult.status} stages=${runtimeResult.stageResults.length}`,
      },
      {
        id: "policy",
        status: this.resolvePolicyCheckStatus(policyResult.policyOutcome),
        detail: `outcome=${policyResult.policyOutcome} matched_rules=${policyResult.matchedRuleIds.length}`,
      },
      {
        id: "report",
        status: CliGovernanceCheckStatus.PASS,
        detail: `records=${executionReport.totalRecords} stage_summaries=${executionReport.stageSummaries.length}`,
      },
    ];
    if (runtimeDebugOptions.dryRun || runtimeDebugOptions.trace) {
      checks.push({
        id: "debug_mode",
        status: CliGovernanceCheckStatus.PASS,
        detail: `dry_run=${runtimeDebugOptions.dryRun} trace=${runtimeDebugOptions.trace}`,
      });
    }

    const diagnosticsTracePath =
      runtimeDebugOptions.dryRun || runtimeDebugOptions.trace
        ? await this.artifactWriter.writeRunDiagnosticsTraceArtifact({
            executionId,
            executionSessionId,
            runtimeResult,
            policyResult,
            riskEvaluation,
            reportPath,
            replayPath,
            runtimeDebugOptions,
            rootCause: this.commandExperienceBuilder.resolveRunDiagnosticRootCause({
              policyOutcome: policyResult.policyOutcome,
              runtimeStatus: runtimeResult.status,
            }),
            nextActions: this.commandExperienceBuilder.resolveDiagnosticNextActions({
              rootCause: this.commandExperienceBuilder.resolveRunDiagnosticRootCause({
                policyOutcome: policyResult.policyOutcome,
                runtimeStatus: runtimeResult.status,
              }),
              policyOutcome: policyResult.policyOutcome,
              runtimeStatus: runtimeResult.status,
            }),
          })
        : null;

    if (diagnosticsTracePath) {
      artifacts.push({
        id: "diagnostics_trace",
        path: diagnosticsTracePath,
      });
    }

    const checkTotals = this.calculateCheckTotals(checks);
    const experience = this.commandExperienceBuilder.createRunCommandExperience({
      executionId,
      runtimeResult,
      policyResult,
      reportPath,
      replayPath,
      diagnosticsTracePath,
    });
    this.throwForNonAllowPolicyOutcome({
      executionId,
      policyOutcome: policyResult.policyOutcome,
      matchedRuleIds: policyResult.matchedRuleIds,
      reportPath,
      replayPath,
      checkTotals,
    });

    const message = `Run completed with execution_id=${executionId} and policy_outcome=${policyResult.policyOutcome}${runtimeDebugOptions.dryRun ? " (dry_run=true)" : ""}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.GOVERNANCE_RUN,
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        experience,
        details: {
          execution_id: executionId,
          runtime_status: runtimeResult.status,
          risk_level: riskEvaluation.riskLevel,
          replay_matched_count: replayExplainResult.matchedCount,
          dry_run: runtimeDebugOptions.dryRun,
          trace_enabled: runtimeDebugOptions.trace,
          diagnostics_trace_path: diagnosticsTracePath,
        },
      },
    };
  }

  /**
   * Replays diagnostics from existing report/replay artifacts.
   * @param runtimeDebugOptions Debug options resolved from CLI flags.
   * @returns Runtime command result.
   */
  private async executeRunReplayCommand(
    runtimeDebugOptions: CliNormalizedRuntimeDebugOptions,
  ): Promise<CliGovernanceCommandResult> {
    const replayPath = runtimeDebugOptions.replayPath;
    if (!replayPath) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        "Replay mode requires a replay source path.",
      );
    }

    if (!existsSync(replayPath)) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        `Replay source path not found: ${replayPath}.`,
        {
          replayPath,
        },
      );
    }

    const replayPayload = await this.artifactWriter.safeReadJson(replayPath);
    if (!replayPayload) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        `Replay source payload is invalid JSON object: ${replayPath}.`,
        {
          replayPath,
        },
      );
    }

    const replayResolution = this.replayExplainBuilder.resolveReplayExplainPayload({
      replayPath,
      replayPayload,
    });
    const replayNextActions = this.commandExperienceBuilder.resolveDiagnosticNextActions({
      rootCause: CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
      policyOutcome: null,
      runtimeStatus: null,
    });
    const { diagnosticsPath, tracePath } =
      await this.artifactWriter.writeReplayDiagnosticsArtifacts({
        replayPath,
        replayResolution,
        locale: this.options.locale,
        runtimeDebugOptions,
        nextActions: replayNextActions,
      });

    const artifacts: CliCommandResultArtifact[] = [
      {
        id: "replay_source",
        path: replayPath,
      },
      {
        id: "replay_diagnostics",
        path: diagnosticsPath,
      },
    ];

    if (tracePath) {
      artifacts.push({
        id: "diagnostics_trace",
        path: tracePath,
      });
    }

    const checks: CliCommandResultCheck[] = [
      {
        id: "replay_source",
        status: CliGovernanceCheckStatus.PASS,
        detail: replayResolution.sourceType,
      },
      {
        id: "replay_explain",
        status: CliGovernanceCheckStatus.PASS,
        detail: `matched=${replayResolution.explainResult.matchedCount}`,
      },
    ];

    if (runtimeDebugOptions.trace) {
      checks.push({
        id: "debug_mode",
        status: CliGovernanceCheckStatus.PASS,
        detail: "trace=true replay=true",
      });
    }

    const experience = this.commandExperienceBuilder.createReplayCommandExperience({
      replayPath,
      diagnosticsPath,
      replayResolution,
    });
    const message = `Replay diagnostics completed from ${replayPath}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.GOVERNANCE_RUN_REPLAY,
        summary: message,
        check_totals: this.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          replay_source_path: replayPath,
          replay_source_type: replayResolution.sourceType,
          replay_execution_id: replayResolution.executionId,
          replay_matched_count: replayResolution.explainResult.matchedCount,
          trace_enabled: runtimeDebugOptions.trace,
        },
      },
    };
  }

  /**
   * Creates one review-request artifact for downstream review flows.
   * @returns Runtime command result.
   */
  private async executeReviewCommand(): Promise<CliGovernanceCommandResult> {
    const reviewQueueDirectories = this.reviewQueueRuntime.resolveReviewQueueDirectories();
    const requestId = `review-${Date.now()}`;
    const requestPath = resolve(reviewQueueDirectories.requestDirectoryPath, `${requestId}.json`);
    const correlationId = `review-chain-${requestId}`;
    await this.artifactWriter.writeJsonArtifact(requestPath, {
      requestId,
      status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
      createdAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: this.options.workspace.workspaceId,
      workspaceRoot: this.options.workspace.workspaceRoot,
      locale: this.options.locale,
      outputMode: this.options.outputMode,
      diagnosticContext: {
        correlationId,
        queueStage: "review",
        chain: "review->review-verify->ledger-backfill",
      },
    });

    const message = `Review request queued at ${requestPath}.`;
    const experience = this.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: "reviewer",
          stage: ExecutionProgressStage.REVIEW,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: "Review request artifact queued.",
          detail: `request_id=${requestId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW,
            artifactPath: requestPath,
          },
        },
        {
          roleId: "verifier",
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          status: ExecutionProgressStatus.QUEUED,
          category: ExecutionInteractionCategory.POLICY_WAITING,
          summary: "Awaiting review-verify consumption.",
          detail: `chain=${correlationId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: requestPath,
          },
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.POLICY_WAITING,
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          title: "Run review-verify",
          action: "Execute `repo-ai-governor review-verify` to consume queued review request.",
          blocking: true,
        },
      ],
      layeredLogs: {
        summary: [`review_request=${requestId}`, "chain=review->review-verify->ledger-backfill"],
        detailed: [`request_path=${requestPath}`, `correlation_id=${correlationId}`],
      },
    });
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.REVIEW_QUEUE,
        summary: message,
        check_totals: {
          pass: 1,
          warn: 0,
          fail: 0,
        },
        checks: [
          {
            id: "review_request",
            status: CliGovernanceCheckStatus.PASS,
            detail: requestId,
          },
        ],
        artifacts: [
          {
            id: "review_request",
            path: requestPath,
          },
        ],
        experience,
      },
    };
  }

  /**
   * Verifies the latest queued review request and writes verification artifact.
   * @returns Runtime command result.
   */
  private async executeReviewVerifyCommand(): Promise<CliGovernanceCommandResult> {
    const reviewQueueDirectories = this.reviewQueueRuntime.resolveReviewQueueDirectories();
    await mkdir(reviewQueueDirectories.requestDirectoryPath, { recursive: true });
    await mkdir(reviewQueueDirectories.resultDirectoryPath, { recursive: true });

    const queuedRequestArtifacts =
      await this.reviewQueueRuntime.collectQueuedReviewRequestArtifacts(reviewQueueDirectories);

    if (queuedRequestArtifacts.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        "review-verify requires at least one queued review request artifact.",
      );
    }

    const latestQueuedRequest =
      queuedRequestArtifacts[queuedRequestArtifacts.length - 1] ?? queuedRequestArtifacts[0];
    if (!latestQueuedRequest) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        "review-verify failed to resolve queued request artifact.",
      );
    }

    const verifyId = `review-verify-${Date.now()}`;
    const verifyPath = resolve(reviewQueueDirectories.resultDirectoryPath, `${verifyId}.json`);
    const requestPayload = await this.artifactWriter.safeReadJson(latestQueuedRequest.filePath);
    const sourceRequestId =
      typeof requestPayload?.requestId === "string"
        ? requestPayload.requestId
        : latestQueuedRequest.requestId;
    const diagnosticContext =
      requestPayload &&
      typeof requestPayload.diagnosticContext === "object" &&
      requestPayload.diagnosticContext
        ? (requestPayload.diagnosticContext as Record<string, unknown>)
        : null;
    const correlationId =
      diagnosticContext && typeof diagnosticContext.correlationId === "string"
        ? diagnosticContext.correlationId
        : `review-chain-${sourceRequestId}`;
    const ledgerBackfillPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "ledger-backfill",
      "review-verify",
      `${verifyId}.json`,
    );
    const verifiedAt = this.toRfc3339SecondsTimestamp(new Date());

    await this.artifactWriter.writeJsonArtifact(ledgerBackfillPath, {
      ledgerBackfillId: `ledger-backfill-${verifyId}`,
      status: CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING,
      createdAt: verifiedAt,
      verifyId,
      sourceRequestId,
      sourceRequestPath: latestQueuedRequest.filePath,
      workspaceId: this.options.workspace.workspaceId,
      workspaceRoot: this.options.workspace.workspaceRoot,
      attribution: {
        correlationId,
        chain: "review->review-verify->ledger-backfill",
        chainStep: "ledger-backfill",
      },
      diagnostics: {
        rootCause: CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
        note: "Ready for tasks/checklist/csv backfill consumption.",
      },
    });

    await this.artifactWriter.writeJsonArtifact(verifyPath, {
      verifyId,
      status: CLI_REVIEW_REQUEST_STATUS.VERIFIED,
      verifiedAt,
      sourceRequestPath: latestQueuedRequest.filePath,
      sourceRequestId,
      ledgerBackfillPath,
      diagnosticAttribution: {
        correlationId,
        chain: "review->review-verify->ledger-backfill",
        chainStep: "review-verify",
      },
    });

    await this.artifactWriter.writeJsonArtifact(latestQueuedRequest.filePath, {
      ...(requestPayload ?? {}),
      requestId: sourceRequestId,
      status: CLI_REVIEW_REQUEST_STATUS.VERIFIED,
      verifiedAt,
      consumedAt: verifiedAt,
      consumedByVerifyId: verifyId,
      ledgerBackfillPath,
      diagnosticContext: {
        ...(diagnosticContext ?? {}),
        correlationId,
        queueStage: "review-verify-consumed",
        chain: "review->review-verify->ledger-backfill",
      },
    });

    const message = `Review request verified from ${latestQueuedRequest.filePath}.`;
    const experience = this.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: "verifier",
          stage: ExecutionProgressStage.REVIEW_VERIFY,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: "Review verification artifact persisted.",
          detail: `verify_id=${verifyId}`,
          backlink: {
            stageId: ExecutionProgressStage.REVIEW_VERIFY,
            artifactPath: verifyPath,
          },
        },
        {
          roleId: "ledger-backfill",
          stage: ExecutionProgressStage.LEDGER_BACKFILL,
          status: ExecutionProgressStatus.WAITING,
          category: ExecutionInteractionCategory.POLICY_WAITING,
          summary: "Ledger backfill pending downstream task ledger consumption.",
          detail: `source_request_id=${sourceRequestId}`,
          backlink: {
            stageId: ExecutionProgressStage.LEDGER_BACKFILL,
            artifactPath: ledgerBackfillPath,
          },
        },
      ],
      interactionPrompts: [
        {
          category: ExecutionInteractionCategory.POLICY_WAITING,
          stage: ExecutionProgressStage.LEDGER_BACKFILL,
          title: "Consume ledger-backfill artifact",
          action:
            "Apply ledger-backfill payload into tasks/checklist/tasks.csv to close review chain.",
          blocking: true,
        },
      ],
      layeredLogs: {
        summary: [`verify_id=${verifyId}`, "chain=review->review-verify->ledger-backfill"],
        detailed: [
          `verify_path=${verifyPath}`,
          `ledger_backfill_path=${ledgerBackfillPath}`,
          `source_request_path=${latestQueuedRequest.filePath}`,
        ],
      },
    });
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.REVIEW_VERIFY,
        summary: message,
        check_totals: {
          pass: 1,
          warn: 0,
          fail: 0,
        },
        checks: [
          {
            id: "review_verify",
            status: CliGovernanceCheckStatus.PASS,
            detail: latestQueuedRequest.fileName,
          },
        ],
        artifacts: [
          {
            id: "review_verify_result",
            path: verifyPath,
          },
          {
            id: "review_ledger_backfill",
            path: ledgerBackfillPath,
          },
        ],
        experience,
      },
    };
  }

  /**
   * Builds default config content for first-time workspace initialization.
   * @returns YAML text content.
   */
  private buildDefaultConfigContent(): string {
    return [
      'schemaVersion: "1.1"',
      "workspace:",
      `  mode: ${this.options.workspace.mode}`,
      `  migrationPolicy: ${WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK}`,
      "i18n:",
      "  runtimeEngine: i18next",
      "  defaultLocale: zh-CN",
      "  fallbackLocale: en-US",
      "  supportedLocales:",
      "    - zh-CN",
      "    - en-US",
      "memory:",
      `  storeEngine: ${this.options.memoryConfig.storeEngine}`,
      `  storeRoot: ${this.options.memoryConfig.storeRoot}`,
      "adapters:",
      "  roles:",
      "    - roleId: planner",
      "      roleProfileId: planner-default",
      "      requiredCapabilities:",
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      "      required: true",
      "    - roleId: architect",
      "      roleProfileId: architect-default",
      "      requiredCapabilities:",
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      "      required: true",
      "    - roleId: coder",
      "      roleProfileId: coder-default",
      "      requiredCapabilities:",
      `        - ${AgentCapability.TOOL_CALLING}`,
      "      required: true",
      "    - roleId: tester",
      "      roleProfileId: tester-default",
      "      requiredCapabilities:",
      `        - ${AgentCapability.TOOL_CALLING}`,
      "      required: true",
      "    - roleId: reviewer",
      "      roleProfileId: reviewer-default",
      "      requiredCapabilities:",
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      "      required: true",
      "    - roleId: verifier",
      "      roleProfileId: verifier-default",
      "      requiredCapabilities:",
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      "      required: true",
      "  routing:",
      "    roleBindings:",
      "      planner:",
      `        primarySurface: ${AdapterSurface.CODEX}`,
      "        fallbackSurfaces:",
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      "      architect:",
      `        primarySurface: ${AdapterSurface.CODEX}`,
      "        fallbackSurfaces:",
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      "      coder:",
      `        primarySurface: ${AdapterSurface.CODEX}`,
      "        fallbackSurfaces:",
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      "      tester:",
      `        primarySurface: ${AdapterSurface.GITHUB_COPILOT}`,
      "        fallbackSurfaces:",
      `          - ${AdapterSurface.CODEX}`,
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      "      reviewer:",
      `        primarySurface: ${AdapterSurface.CLAUDE_CODE}`,
      "        fallbackSurfaces:",
      `          - ${AdapterSurface.CODEX}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      "      verifier:",
      `        primarySurface: ${AdapterSurface.CODEX}`,
      "        fallbackSurfaces:",
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      "  tools:",
      `    - toolId: ${AdapterSurface.CODEX}`,
      "      enabled: true",
      `      availability: ${AdapterAvailability.AVAILABLE}`,
      `    - toolId: ${AdapterSurface.GITHUB_COPILOT}`,
      "      enabled: true",
      `      availability: ${AdapterAvailability.AVAILABLE}`,
      `    - toolId: ${AdapterSurface.CLAUDE_CODE}`,
      "      enabled: true",
      `      availability: ${AdapterAvailability.AVAILABLE}`,
      "",
    ].join("\n");
  }

  /**
   * Checks whether current process can write one path.
   * @param targetPath Absolute path to probe.
   * @returns True when write access is available.
   */
  private async canWritePath(targetPath: string): Promise<boolean> {
    try {
      await access(targetPath, FsConstants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolves project/sprint metadata from workspace current-context when available.
   * Why this exists:
   * audit records should follow target-repository context instead of embedding self-hosting constants.
   * @returns Optional project/sprint metadata for audit tagging.
   */
  private async resolveExecutionStreamMetadata(): Promise<CliExecutionStreamMetadata> {
    const currentContextPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "current-context.md",
    );
    if (!existsSync(currentContextPath)) {
      return {};
    }

    try {
      const currentContextContent = await readFile(currentContextPath, "utf8");
      const projectId = currentContextContent.match(/^- Project:\s*`([^`]+)`/mu)?.[1]?.trim();
      const sprintId = currentContextContent.match(/^- Sprint:\s*`([^`]+)`/mu)?.[1]?.trim();

      return {
        ...(projectId ? { projectId } : {}),
        ...(sprintId ? { sprintId } : {}),
      };
    } catch {
      return {};
    }
  }

  /**
   * Resolves normalized runtime debug options with deterministic defaults.
   * @returns Normalized debug options.
   */
  private resolveRuntimeDebugOptions(): CliNormalizedRuntimeDebugOptions {
    return {
      dryRun: this.options.runtimeDebugOptions?.dryRun === true,
      trace: this.options.runtimeDebugOptions?.trace === true,
      replayPath:
        typeof this.options.runtimeDebugOptions?.replayPath === "string" &&
        this.options.runtimeDebugOptions.replayPath.trim().length > 0
          ? this.options.runtimeDebugOptions.replayPath.trim()
          : null,
      adapters: this.options.runtimeDebugOptions?.adapters === true,
      fix: this.options.runtimeDebugOptions?.fix === true,
      recordLedger: this.options.runtimeDebugOptions?.recordLedger === true,
      taskId:
        typeof this.options.runtimeDebugOptions?.taskId === "string" &&
        this.options.runtimeDebugOptions.taskId.trim().length > 0
          ? this.options.runtimeDebugOptions.taskId.trim()
          : null,
      restrictedNetwork: this.options.runtimeDebugOptions?.restrictedNetwork === true,
      restrictedReason:
        typeof this.options.runtimeDebugOptions?.restrictedReason === "string" &&
        this.options.runtimeDebugOptions.restrictedReason.trim().length > 0
          ? this.options.runtimeDebugOptions.restrictedReason.trim()
          : null,
      allowLocalFallback: this.options.runtimeDebugOptions?.allowLocalFallback !== false,
    };
  }

  /**
   * Resolves locale-aware text from English/Chinese variants.
   * @param english English fallback text.
   * @param chinese Simplified-Chinese variant.
   * @returns Locale-aware text.
   */
  private localizeText(english: string, chinese: string): string {
    return this.isZhCnLocale() ? chinese : english;
  }

  /**
   * Checks whether current runtime locale belongs to zh-CN family.
   * @returns True when current locale starts with `zh`.
   */
  private isZhCnLocale(): boolean {
    return this.options.locale.trim().toLowerCase().startsWith("zh");
  }

  /**
   * Creates route runner for run-command stage dispatch using adapters/routing config.
   * @param nodes Runtime process nodes.
   * @returns Route runner instance bound to configured surfaces and role bindings.
   */
  private createRunRouteRunner(
    nodes: ProcessIrNode[],
    options: {
      includeLocalModelFallbackCandidate: boolean;
    } = {
      includeLocalModelFallbackCandidate: true,
    },
  ): AgentRouteRunner {
    const toolConfigBySurface = this.adapterRoutingRuntime.createToolConfigBySurfaceMap();
    const protocolBySurface =
      this.adapterRoutingRuntime.createProtocolBySurface(toolConfigBySurface);
    const routeNodeByRouteKey = new Map<string, ProcessIrNode>();
    for (const node of nodes) {
      if (!routeNodeByRouteKey.has(node.routeKey)) {
        routeNodeByRouteKey.set(node.routeKey, node);
      }
    }

    const routePolicies = Array.from(routeNodeByRouteKey.values()).map((node) => {
      const roleConfig = this.resolveRunRoleConfig(node);
      const roleId = roleConfig?.roleId ?? this.resolveFallbackRunRoleId(node);
      const roleBinding = this.options.adaptersConfig.routing.roleBindings[roleId];
      if (!roleBinding) {
        throw new RuntimeError(
          GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
          `run route "${node.routeKey}" is missing adapters.routing.roleBindings entry for role "${roleId}".`,
          {
            routeKey: node.routeKey,
            stageId: node.stageId,
            roleId,
            roleProfileId: node.roleProfileId,
          },
        );
      }

      const candidateSurfaces = this.adapterRoutingRuntime.resolveRoleBindingCandidateSurfaces(
        roleBinding,
        toolConfigBySurface,
        options.includeLocalModelFallbackCandidate,
      );
      return {
        routeKey: node.routeKey,
        primarySurface: candidateSurfaces[0] ?? roleBinding.primarySurface,
        ...(candidateSurfaces.slice(1).length > 0
          ? {
              fallbackSurfaces: candidateSurfaces.slice(1),
            }
          : {}),
        ...(roleConfig && roleConfig.requiredCapabilities.length > 0
          ? {
              capabilityRequirement: {
                requiredCapabilities: roleConfig.requiredCapabilities as AgentCapability[],
              },
            }
          : {}),
      };
    });

    return new AgentRouteRunner({
      routePolicies,
      protocolBySurface,
      surfaceNetworkRequirementBySurface:
        this.adapterRoutingRuntime.createSurfaceNetworkRequirementMap(toolConfigBySurface),
      restrictedNetworkFallbackHandler:
        this.adapterRoutingRuntime.createRestrictedNetworkFallbackHandler(
          toolConfigBySurface,
          protocolBySurface,
        ),
    });
  }

  /**
   * Dispatches one run-command stage through adapter route runner.
   * @param routeRunner Route runner bound to adapters/routing config.
   * @param stageContext Runtime stage context.
   * @param runtimeDebugOptions Runtime debug options.
   * @returns Adapter-backed stage output payload.
   */
  private async dispatchRunStageWithAdapterRoute(
    routeRunner: AgentRouteRunner,
    stageContext: RuntimeStageContext,
    runtimeDebugOptions: CliNormalizedRuntimeDebugOptions,
  ): Promise<Record<string, unknown>> {
    const dispatchResult = await routeRunner.dispatchStage({
      processId: stageContext.processId,
      executionId: stageContext.executionId,
      stageId: stageContext.stageId,
      routeKey: stageContext.routeKey,
      input: {
        ...stageContext.input,
        locale: this.options.locale,
        dryRun: runtimeDebugOptions.dryRun,
        traceEnabled: runtimeDebugOptions.trace,
        roleProfileId: stageContext.roleProfileId,
        nodeId: stageContext.nodeId,
      },
      runtimeContext: {
        networkMode: runtimeDebugOptions.restrictedNetwork
          ? AgentNetworkMode.RESTRICTED
          : AgentNetworkMode.STANDARD,
        allowLocalFallback: runtimeDebugOptions.allowLocalFallback,
        ...(runtimeDebugOptions.restrictedReason
          ? {
              restrictedReason: runtimeDebugOptions.restrictedReason,
            }
          : {}),
      },
    });

    return {
      handledBy: "adapter-route-runner",
      nodeId: stageContext.nodeId,
      stageId: stageContext.stageId,
      routeKey: stageContext.routeKey,
      roleProfileId: stageContext.roleProfileId,
      selectedSurface: dispatchResult.selectedSurface,
      selectedBy: dispatchResult.auditRecord.selectedBy ?? "unknown",
      fallbackTriggered: dispatchResult.auditRecord.fallbackTriggered,
      localFallbackActivated: dispatchResult.auditRecord.localFallbackActivated,
      restrictedNetworkTriggered: dispatchResult.auditRecord.restrictedNetworkTriggered,
      networkMode: dispatchResult.auditRecord.networkMode,
      restrictedReason: dispatchResult.auditRecord.restrictedReason ?? null,
      evaluatedSurfaceCount: dispatchResult.auditRecord.evaluatedSurfaces.length,
      ...dispatchResult.invokeResult.output,
    };
  }

  /**
   * Resolves one role config row used by run-command node routing.
   * @param node Run-command process node.
   * @returns Matching role config when found.
   */
  private resolveRunRoleConfig(
    node: Pick<ProcessIrNode, "routeKey" | "roleProfileId" | "stageId">,
  ): AdaptersConfig["roles"][number] | undefined {
    const byProfileId = this.options.adaptersConfig.roles.find(
      (role) => role.roleProfileId === node.roleProfileId,
    );
    if (byProfileId) {
      return byProfileId;
    }

    const fallbackRoleId = this.resolveFallbackRunRoleId(node);
    return this.options.adaptersConfig.roles.find((role) => role.roleId === fallbackRoleId);
  }

  /**
   * Resolves fallback role id from run-command node metadata.
   * @param node Run-command process node.
   * @returns Role id candidate used by route-binding lookup.
   */
  private resolveFallbackRunRoleId(
    node: Pick<ProcessIrNode, "routeKey" | "roleProfileId" | "stageId">,
  ): string {
    const normalizedProfileRoleId = node.roleProfileId.endsWith("-default")
      ? node.roleProfileId.slice(0, Math.max(0, node.roleProfileId.length - "-default".length))
      : node.roleProfileId.includes(".")
        ? (node.roleProfileId.split(".").pop() ?? node.roleProfileId)
        : node.roleProfileId;
    if (this.options.adaptersConfig.routing.roleBindings[normalizedProfileRoleId]) {
      return normalizedProfileRoleId;
    }

    if (node.routeKey === "route.prepare" || node.stageId === "stage-prepare") {
      return "planner";
    }
    if (node.routeKey === "route.execute" || node.stageId === "stage-execute") {
      return "coder";
    }
    if (node.routeKey === "route.report" || node.stageId === "stage-report") {
      return "reviewer";
    }

    return normalizedProfileRoleId;
  }

  /**
   * Resolves adapters/routing verification summary used by connect/doctor/verify commands.
   * @returns Adapter verification resolution.
   */
  private async resolveAdapterVerification(): Promise<CliAdapterVerificationResolution> {
    return this.adapterVerificationRuntime.resolveAdapterVerification();
  }

  /**
   * Resolves policy-check row status from required-action outcome.
   * @param policyOutcome Evaluated policy outcome.
   * @returns Check status rendered in command output.
   */
  private resolvePolicyCheckStatus(
    policyOutcome: ChangeRiskRequiredAction,
  ): CliGovernanceCheckStatus {
    if (policyOutcome === ChangeRiskRequiredAction.ALLOW) {
      return CliGovernanceCheckStatus.PASS;
    }

    if (policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      return CliGovernanceCheckStatus.FAIL;
    }

    return CliGovernanceCheckStatus.WARN;
  }

  /**
   * Resolves audit terminal status for policy-stage event.
   * @param policyOutcome Evaluated policy outcome.
   * @returns Audit status aligned with policy result.
   */
  private resolvePolicyAuditRecordStatus(
    policyOutcome: ChangeRiskRequiredAction,
  ): AuditRecordStatus {
    if (policyOutcome === ChangeRiskRequiredAction.ALLOW) {
      return AuditRecordStatus.SUCCEEDED;
    }

    if (policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      return AuditRecordStatus.FAILED;
    }

    return AuditRecordStatus.RUNNING;
  }

  /**
   * Throws non-success outcomes for policy-gated run execution.
   * Why this exists:
   * CLI run must not expose `confirm/escalate/block` as successful completion.
   * @param options Run execution context used for error payload.
   */
  private throwForNonAllowPolicyOutcome(options: {
    executionId: string;
    policyOutcome: ChangeRiskRequiredAction;
    matchedRuleIds: string[];
    reportPath: string;
    replayPath: string;
    checkTotals: CliCheckTotals;
  }): void {
    if (options.policyOutcome === ChangeRiskRequiredAction.ALLOW) {
      return;
    }

    if (options.policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_EVALUATION_FAILED,
        `Run blocked by policy gate for execution_id=${options.executionId}.`,
        {
          executionId: options.executionId,
          policyOutcome: options.policyOutcome,
          matchedRuleIds: options.matchedRuleIds,
          reportPath: options.reportPath,
          replayPath: options.replayPath,
          checkTotals: options.checkTotals,
          pendingStatus: ExecutionProgressStage.POLICY_WAITING,
        },
      );
    }

    throw new RuntimeError(
      GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
      `Run requires HITL confirmation before completion for execution_id=${options.executionId} (policy_outcome=${options.policyOutcome}).`,
      {
        executionId: options.executionId,
        policyOutcome: options.policyOutcome,
        matchedRuleIds: options.matchedRuleIds,
        reportPath: options.reportPath,
        replayPath: options.replayPath,
        checkTotals: options.checkTotals,
        pendingStatus: ExecutionProgressStage.HUMAN_CONFIRMATION,
      },
    );
  }

  /**
   * Collects changed paths from `git status --porcelain`.
   * @returns Unique changed paths; empty list when git is unavailable.
   */
  private async collectGitChangedPaths(): Promise<string[]> {
    try {
      const result = await execFileAsync("git", ["status", "--porcelain"], {
        cwd: this.options.currentWorkingDirectory,
        maxBuffer: 2 * 1024 * 1024,
        encoding: "utf8",
      });
      const changedPaths = result.stdout
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 3)
        .map((line) => line.slice(3))
        .map((line) => {
          const renameArrowIndex = line.indexOf(" -> ");
          return renameArrowIndex >= 0 ? line.slice(renameArrowIndex + 4) : line;
        })
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      return Array.from(new Set(changedPaths));
    } catch {
      return [];
    }
  }

  /**
   * Resolves risk file categories from changed-path patterns.
   * @param changedPaths Changed paths from repository status.
   * @returns Deduplicated file categories.
   */
  private resolveRiskFileCategories(changedPaths: string[]): ChangeRiskFileCategoryValue[] {
    if (changedPaths.length === 0) {
      return [ChangeRiskFileCategory.CODE];
    }

    const categories = new Set<ChangeRiskFileCategoryValue>([ChangeRiskFileCategory.CODE]);
    for (const changedPath of changedPaths) {
      const lowerCasePath = changedPath.toLowerCase();
      for (const patternEntry of CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS) {
        if (lowerCasePath.includes(patternEntry.pattern.toLowerCase())) {
          categories.add(patternEntry.category);
        }
      }
    }

    return Array.from(categories.values());
  }

  /**
   * Creates process definition used by run-command minimal governance chain.
   * @param executionId Execution id.
   * @returns Process definition.
   */
  private createCliRunProcessDefinition(executionId: string): ProcessDslDefinition {
    return {
      processId: "cli-minimal-governance-run",
      executionId,
      entryNodeId: "node-prepare",
      nodes: [
        {
          nodeId: "node-prepare",
          stageId: "stage-prepare",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "route.prepare",
          roleProfileId: DefaultRoleProfileId.PLANNER,
          inputSchemaRef: "schemas/prepare-input.json",
          outputSchemaRef: "schemas/prepare-output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
        {
          nodeId: "node-execute",
          stageId: "stage-execute",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "route.execute",
          roleProfileId: DefaultRoleProfileId.CODER,
          inputSchemaRef: "schemas/execute-input.json",
          outputSchemaRef: "schemas/execute-output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
        {
          nodeId: "node-report",
          stageId: "stage-report",
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: "route.report",
          roleProfileId: DefaultRoleProfileId.REVIEWER,
          inputSchemaRef: "schemas/report-input.json",
          outputSchemaRef: "schemas/report-output.json",
          retryPolicyRef: "policy/retry-default",
          timeoutPolicyRef: "policy/timeout-default",
          budgetPolicyRef: "policy/budget-default",
        },
      ],
      edges: [
        {
          fromNodeId: "node-prepare",
          toNodeId: "node-execute",
        },
        {
          fromNodeId: "node-execute",
          toNodeId: "node-report",
        },
      ],
    };
  }

  /**
   * Converts runtime stage status to audit-record status.
   * @param runtimeStatus Runtime stage status.
   * @returns Audit record status.
   */
  private resolveAuditRecordStatus(runtimeStatus: RuntimeStageStatus): AuditRecordStatus {
    if (runtimeStatus === RuntimeStageStatus.SUCCEEDED) {
      return AuditRecordStatus.SUCCEEDED;
    }

    if (runtimeStatus === RuntimeStageStatus.CANCELLED) {
      return AuditRecordStatus.CANCELLED;
    }

    return AuditRecordStatus.FAILED;
  }

  /**
   * Converts output-mode contract to audit output mode enum.
   * @param outputMode CLI output mode.
   * @returns Audit output mode enum.
   */
  private resolveAuditOutputMode(outputMode: ErrorOutputEnvironment): AuditOutputMode {
    if (outputMode === ErrorOutputEnvironment.JSON) {
      return AuditOutputMode.JSON;
    }

    if (outputMode === ErrorOutputEnvironment.PRETTY) {
      return AuditOutputMode.PRETTY;
    }

    return AuditOutputMode.PLAIN;
  }

  /**
   * Formats execution timestamp into RFC3339 seconds precision.
   * @param value Date value.
   * @returns RFC3339 timestamp.
   */
  private toRfc3339SecondsTimestamp(value: Date): string {
    return value.toISOString().replace(/\.\d{3}Z$/u, "Z");
  }

  /**
   * Formats RFC3339 timestamp into display format expected by audit recorder.
   * @param timestamp RFC3339 timestamp.
   * @returns Display timestamp in `YYYY-MM-DD HH:mm:ss UTC+00:00`.
   */
  private toDisplayTimestamp(timestamp: string): string {
    const normalizedTimestamp = timestamp.trim();
    const datePart = normalizedTimestamp.slice(0, 19).replace("T", " ");
    if (normalizedTimestamp.endsWith("Z")) {
      return `${datePart} UTC+00:00`;
    }

    const offset = normalizedTimestamp.slice(-6);
    return `${datePart} UTC${offset}`;
  }

  /**
   * Calculates pass/warn/fail totals from check rows.
   * @param checks Command checks.
   * @returns Aggregate totals.
   */
  private calculateCheckTotals(checks: CliCommandResultCheck[]): CliCheckTotals {
    return checks.reduce<CliCheckTotals>(
      (totals, check) => {
        if (check.status === CliGovernanceCheckStatus.PASS) {
          totals.pass += 1;
          return totals;
        }

        if (check.status === CliGovernanceCheckStatus.WARN) {
          totals.warn += 1;
          return totals;
        }

        totals.fail += 1;
        return totals;
      },
      {
        pass: 0,
        warn: 0,
        fail: 0,
      },
    );
  }

  /**
   * Formats subprocess failure payload into compact diagnostic detail.
   * @param error Unknown subprocess error.
   * @returns Compact failure detail.
   */
  private formatExecFailureDetail(error: unknown): string {
    if (!error || typeof error !== "object") {
      return "failed";
    }

    const candidate = error as {
      code?: number | string;
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    const output = [candidate.stdout?.trim(), candidate.stderr?.trim()]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join(" | ");
    if (output.length > 0) {
      return output;
    }

    if (candidate.code !== undefined) {
      return `exit_code=${candidate.code}`;
    }

    return candidate.message?.trim() || "failed";
  }
}
