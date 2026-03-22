import { execFile } from "node:child_process";
import { constants as FsConstants, existsSync } from "node:fs";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

import {
  ConfigLoader,
  GovernorSchemaVersion,
  type ResolvedWorkspace,
  UpgradeSchemaDiffService,
} from "@repo-ai-governor/config";
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
  RuntimeExecutionStatus,
  RuntimeStageStatus,
  RuntimeTimeoutScope,
} from "@repo-ai-governor/core-runtime";
import { AuditOutputMode, AuditRecordStatus, AuditRecorder } from "@repo-ai-governor/core-session";
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from "@repo-ai-governor/memory-store-adapter";
import { ReplayExplainer, ReportBuilder } from "@repo-ai-governor/reporting";
import {
  ErrorOutputEnvironment,
  GovernorErrorCode,
  type MemoryRuntimeConfig,
  RuntimeError,
  WorkspaceMigrationPolicy,
} from "@repo-ai-governor/shared";
import { CliCommandName } from "./constants/cli-command.constant.js";
import {
  CLI_BASELINE_DOC_PATHS,
  CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS,
  CLI_DOCTOR_ATTACH_MODE,
  CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS,
  CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS,
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from "./constants/cli-governance-runtime.constant.js";
import type {
  CliCommandExecutionResultPayload,
  CliCommandResultArtifact,
  CliCommandResultCheck,
} from "./types/index.js";

const execFileAsync = promisify(execFile);

interface CliGovernanceRuntimeOptions {
  currentWorkingDirectory: string;
  workspace: ResolvedWorkspace;
  configSource: "default" | "file";
  profileId: string | null;
  locale: string;
  outputMode: ErrorOutputEnvironment;
  isTty: boolean;
  memoryConfig: MemoryRuntimeConfig;
  memoryStoreRoot: string;
  memoryStoreProviderName: string;
  memoryStoreProvider: MemoryStoreProvider;
}

interface CliGovernanceCommandResult {
  message: string;
  commandResult: CliCommandExecutionResultPayload;
}

interface CliCheckTotals {
  pass: number;
  warn: number;
  fail: number;
}

interface CliExecutionStreamMetadata {
  projectId?: string;
  sprintId?: string;
}

interface CliQueuedReviewRequestArtifact {
  fileName: string;
  filePath: string;
  requestId: string;
}

interface CliReviewQueueDirectorySet {
  requestDirectoryPath: string;
  resultDirectoryPath: string;
  legacyQueueDirectoryPath: string;
}

/**
 * Implements Stage-9 CLI command semantics with a minimal governance execution chain.
 *
 * Why this exists:
 * command runtime behavior must be centralized so `init/doctor/check/run/review/review-verify/plan/upgrade`
 * stay deterministic across CLI entrypoints and output modes.
 */
export class CliGovernanceRuntime {
  public constructor(private readonly options: CliGovernanceRuntimeOptions) {}

  /**
   * Executes one CLI command with deterministic runtime semantics.
   * @param commandName Command name selected by CLI parser.
   * @returns Command result message and structured output payload.
   */
  public async execute(commandName: CliCommandName): Promise<CliGovernanceCommandResult> {
    if (commandName === CliCommandName.INIT) {
      return this.executeInitCommand();
    }

    if (commandName === CliCommandName.DOCTOR) {
      return this.executeDoctorCommand();
    }

    if (commandName === CliCommandName.CHECK) {
      return this.executeCheckCommand();
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

    if (commandName === CliCommandName.PLAN) {
      return this.executePlanCommand();
    }

    if (commandName === CliCommandName.UPGRADE) {
      return this.executeUpgradeCommand();
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
   * Bootstraps workspace directories and baseline config.
   * @returns Runtime command result.
   */
  private async executeInitCommand(): Promise<CliGovernanceCommandResult> {
    const checks: CliCommandResultCheck[] = [];
    const artifacts: CliCommandResultArtifact[] = [];
    const ensuredDirectoryPaths: string[] = [];
    const createdDirectoryPaths: string[] = [];

    for (const segments of CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS) {
      const directoryPath = resolve(this.options.workspace.workspaceRoot, ...segments);
      const directoryExisted = existsSync(directoryPath);
      await mkdir(directoryPath, { recursive: true });
      ensuredDirectoryPaths.push(directoryPath);
      if (!directoryExisted) {
        createdDirectoryPaths.push(directoryPath);
      }
    }

    checks.push({
      id: "workspace_directories",
      status: CliGovernanceCheckStatus.PASS,
      detail: `ensured=${ensuredDirectoryPaths.length} created=${createdDirectoryPaths.length}`,
    });

    const configPath = this.options.workspace.configPath;
    const configCreated = !existsSync(configPath);
    if (configCreated) {
      await this.writeTextArtifact(configPath, this.buildDefaultConfigContent());
    }

    checks.push({
      id: "workspace_config",
      status: CliGovernanceCheckStatus.PASS,
      detail: configCreated ? `created=${configPath}` : `reused=${configPath}`,
    });
    artifacts.push({
      id: "workspace_config",
      path: configPath,
    });

    const initManifestPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "bootstrap",
      "init-manifest.json",
    );
    await this.writeJsonArtifact(initManifestPath, {
      initializedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: this.options.workspace.workspaceId,
      workspaceRoot: this.options.workspace.workspaceRoot,
      workspaceMode: this.options.workspace.mode,
      configPath,
      configSource: this.options.configSource,
      profileId: this.options.profileId,
      locale: this.options.locale,
      memoryStoreEngine: this.options.memoryConfig.storeEngine,
      memoryStoreRoot: this.options.memoryStoreRoot,
    });
    artifacts.push({
      id: "init_manifest",
      path: initManifestPath,
    });

    const message = `Initialized workspace at ${this.options.workspace.workspaceRoot}; config ${configCreated ? "created" : "reused"}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.WORKSPACE_INIT,
        summary: message,
        check_totals: this.calculateCheckTotals(checks),
        checks,
        artifacts,
        details: {
          workspace_mode: this.options.workspace.mode,
          workspace_mode_source: this.options.workspace.modeSource,
        },
      },
    };
  }

  /**
   * Probes environment health with read-only-safe diagnostics.
   * @returns Runtime command result.
   */
  private async executeDoctorCommand(): Promise<CliGovernanceCommandResult> {
    const checks: CliCommandResultCheck[] = [];

    const workspaceRootExists = existsSync(this.options.workspace.workspaceRoot);
    checks.push({
      id: "workspace_root_exists",
      status: workspaceRootExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.FAIL,
      detail: workspaceRootExists
        ? this.options.workspace.workspaceRoot
        : `missing=${this.options.workspace.workspaceRoot}`,
    });

    const workspaceWritable = await this.canWritePath(this.options.workspace.workspaceRoot);
    checks.push({
      id: "workspace_write_access",
      status: workspaceWritable ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail: workspaceWritable ? "writeable" : "read_only_attach_mode_enabled",
    });
    const attachMode = workspaceWritable
      ? CLI_DOCTOR_ATTACH_MODE.READ_WRITE
      : CLI_DOCTOR_ATTACH_MODE.READ_ONLY;

    const configExists = existsSync(this.options.workspace.configPath);
    checks.push({
      id: "workspace_config_exists",
      status: configExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail: configExists ? this.options.workspace.configPath : "missing; run `init` first",
    });

    const docs = CLI_BASELINE_DOC_PATHS.map((relativePath) => ({
      relativePath,
      exists: existsSync(resolve(this.options.currentWorkingDirectory, relativePath)),
    }));
    const missingDocCount = docs.filter((item) => !item.exists).length;
    checks.push({
      id: "baseline_docs",
      status: missingDocCount === 0 ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail:
        missingDocCount === 0
          ? `all_found=${docs.length}`
          : `missing=${missingDocCount}/${docs.length}`,
    });

    const memoryRootExists = existsSync(this.options.memoryStoreRoot);
    checks.push({
      id: "memory_store_root",
      status: memoryRootExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail: memoryRootExists
        ? this.options.memoryStoreRoot
        : `missing=${this.options.memoryStoreRoot}`,
    });

    const message = `Doctor completed with attach_mode=${attachMode}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ENV_DOCTOR,
        summary: message,
        attach_mode: attachMode,
        check_totals: this.calculateCheckTotals(checks),
        checks,
        details: {
          config_source: this.options.configSource,
          profile: this.options.profileId ?? "none",
          memory_store_provider: this.options.memoryStoreProviderName,
        },
      },
    };
  }

  /**
   * Executes optional governance checks when scripts exist in current repository.
   * @returns Runtime command result.
   */
  private async executeCheckCommand(): Promise<CliGovernanceCommandResult> {
    const checks: CliCommandResultCheck[] = [];
    const failedChecks: string[] = [];

    checks.push({
      id: "config_source",
      status:
        this.options.configSource === "file"
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
      detail:
        this.options.configSource === "file"
          ? "repository config loaded"
          : "default config in use; run `init` for explicit config",
    });

    for (const scriptPath of CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS) {
      const absoluteScriptPath = resolve(this.options.currentWorkingDirectory, scriptPath);
      const checkId = scriptPath.replace("scripts/governance/", "").replace(".js", "");

      if (!existsSync(absoluteScriptPath)) {
        checks.push({
          id: checkId,
          status: CliGovernanceCheckStatus.WARN,
          detail: "script_not_found",
        });
        continue;
      }

      try {
        const result = await execFileAsync(process.execPath, [absoluteScriptPath], {
          cwd: this.options.currentWorkingDirectory,
          maxBuffer: 5 * 1024 * 1024,
          encoding: "utf8",
        });
        const summary = [result.stdout.trim(), result.stderr.trim()]
          .filter((value) => value.length > 0)
          .join(" | ");
        checks.push({
          id: checkId,
          status: CliGovernanceCheckStatus.PASS,
          detail: summary.length > 0 ? summary : "passed",
        });
      } catch (error) {
        const detail = this.formatExecFailureDetail(error);
        failedChecks.push(checkId);
        checks.push({
          id: checkId,
          status: CliGovernanceCheckStatus.FAIL,
          detail,
        });
      }
    }

    const totals = this.calculateCheckTotals(checks);
    if (totals.fail > 0) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        `Governance checks failed: ${failedChecks.join(", ")}.`,
        {
          failedChecks,
          totals,
        },
      );
    }

    const message = `Governance checks completed: pass=${totals.pass} warn=${totals.warn} fail=${totals.fail}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.GOVERNANCE_CHECK,
        summary: message,
        check_totals: totals,
        checks,
      },
    };
  }

  /**
   * Executes compiler -> runtime -> policy -> audit/report minimal chain.
   * @returns Runtime command result.
   */
  private async executeRunCommand(): Promise<CliGovernanceCommandResult> {
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
    const runtimeResult = await processRuntimeEngine.execute(compiledIr, async (stageContext) => ({
      handledBy: "cli-governance-runtime",
      nodeId: stageContext.nodeId,
      stageId: stageContext.stageId,
      routeKey: stageContext.routeKey,
      locale: this.options.locale,
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
    const replayExplainer = new ReplayExplainer();
    const replaySnapshot = replayExplainer.createSnapshot({
      report: executionReport,
    });
    const replayExplainResult = replayExplainer.explain({
      snapshot: replaySnapshot,
      limit: 1,
    });

    const reportPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "reports",
      `${executionId}.report.json`,
    );
    const replayPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "replay",
      `${executionId}.replay.json`,
    );
    await this.writeJsonArtifact(reportPath, executionReport);
    await this.writeJsonArtifact(replayPath, replayExplainResult);

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
    const checkTotals = this.calculateCheckTotals(checks);
    this.throwForNonAllowPolicyOutcome({
      executionId,
      policyOutcome: policyResult.policyOutcome,
      matchedRuleIds: policyResult.matchedRuleIds,
      reportPath,
      replayPath,
      checkTotals,
    });

    const message = `Run completed with execution_id=${executionId} and policy_outcome=${policyResult.policyOutcome}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.GOVERNANCE_RUN,
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        details: {
          execution_id: executionId,
          runtime_status: runtimeResult.status,
          risk_level: riskEvaluation.riskLevel,
          replay_matched_count: replayExplainResult.matchedCount,
        },
      },
    };
  }

  /**
   * Creates one review-request artifact for downstream review flows.
   * @returns Runtime command result.
   */
  private async executeReviewCommand(): Promise<CliGovernanceCommandResult> {
    const reviewQueueDirectories = this.resolveReviewQueueDirectories();
    const requestId = `review-${Date.now()}`;
    const requestPath = resolve(reviewQueueDirectories.requestDirectoryPath, `${requestId}.json`);
    await this.writeJsonArtifact(requestPath, {
      requestId,
      status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
      createdAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspaceId: this.options.workspace.workspaceId,
      workspaceRoot: this.options.workspace.workspaceRoot,
      locale: this.options.locale,
      outputMode: this.options.outputMode,
    });

    const message = `Review request queued at ${requestPath}.`;
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
      },
    };
  }

  /**
   * Verifies the latest queued review request and writes verification artifact.
   * @returns Runtime command result.
   */
  private async executeReviewVerifyCommand(): Promise<CliGovernanceCommandResult> {
    const reviewQueueDirectories = this.resolveReviewQueueDirectories();
    await mkdir(reviewQueueDirectories.requestDirectoryPath, { recursive: true });
    await mkdir(reviewQueueDirectories.resultDirectoryPath, { recursive: true });

    const queuedRequestArtifacts =
      await this.collectQueuedReviewRequestArtifacts(reviewQueueDirectories);

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
    const requestPayload = await this.safeReadJson(latestQueuedRequest.filePath);

    await this.writeJsonArtifact(verifyPath, {
      verifyId,
      status: CLI_REVIEW_REQUEST_STATUS.VERIFIED,
      verifiedAt: this.toRfc3339SecondsTimestamp(new Date()),
      sourceRequestPath: latestQueuedRequest.filePath,
      sourceRequestId:
        typeof requestPayload?.requestId === "string"
          ? requestPayload.requestId
          : latestQueuedRequest.requestId,
    });

    const message = `Review request verified from ${latestQueuedRequest.filePath}.`;
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
        ],
      },
    };
  }

  /**
   * Writes one plan snapshot artifact that captures current command contract context.
   * @returns Runtime command result.
   */
  private async executePlanCommand(): Promise<CliGovernanceCommandResult> {
    const planId = `plan-${Date.now()}`;
    const planPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "plan",
      `${planId}.json`,
    );
    await this.writeJsonArtifact(planPath, {
      planId,
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: this.options.workspace.workspaceId,
        workspaceRoot: this.options.workspace.workspaceRoot,
        workspaceMode: this.options.workspace.mode,
      },
      commandContract: {
        stage9aHardExit: ["init", "doctor", "check"],
        minimalRuntimeChain: ["compiler", "runtime", "policy", "audit", "report"],
      },
      profileId: this.options.profileId,
      locale: this.options.locale,
      outputMode: this.options.outputMode,
    });

    const message = `Plan snapshot written to ${planPath}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.PLAN_SNAPSHOT,
        summary: message,
        check_totals: {
          pass: 1,
          warn: 0,
          fail: 0,
        },
        checks: [
          {
            id: "plan_snapshot",
            status: CliGovernanceCheckStatus.PASS,
            detail: planId,
          },
        ],
        artifacts: [
          {
            id: "plan_snapshot",
            path: planPath,
          },
        ],
      },
    };
  }

  /**
   * Analyzes schema-upgrade impact for existing config and writes upgrade diff artifact.
   * @returns Runtime command result.
   */
  private async executeUpgradeCommand(): Promise<CliGovernanceCommandResult> {
    if (!existsSync(this.options.workspace.configPath)) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `upgrade requires config file at ${this.options.workspace.configPath}; run \`init\` first.`,
        {
          configPath: this.options.workspace.configPath,
        },
      );
    }

    const configLoader = new ConfigLoader();
    const upgradeSchemaDiffService = new UpgradeSchemaDiffService();
    const sourceConfig = configLoader.loadFromFile(this.options.workspace.configPath);
    const upgradeDiffResult = upgradeSchemaDiffService.analyze({
      sourceConfig,
      targetVersion: GovernorSchemaVersion.V1_1,
    });
    const reportPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "upgrade",
      `upgrade-diff-${Date.now()}.json`,
    );
    await this.writeJsonArtifact(reportPath, upgradeDiffResult);

    const warningCount =
      upgradeDiffResult.confirmationDecision === "allow"
        ? 0
        : upgradeDiffResult.confirmationItems.length;
    const message = `Upgrade analysis completed with decision=${upgradeDiffResult.confirmationDecision}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.SCHEMA_UPGRADE_ANALYZE,
        summary: message,
        check_totals: {
          pass: 1,
          warn: warningCount,
          fail: 0,
        },
        checks: [
          {
            id: "upgrade_schema_diff",
            status:
              upgradeDiffResult.confirmationDecision === "allow"
                ? CliGovernanceCheckStatus.PASS
                : CliGovernanceCheckStatus.WARN,
            detail: `diffs=${upgradeDiffResult.diffs.length} suggestions=${upgradeDiffResult.suggestions.length}`,
          },
        ],
        artifacts: [
          {
            id: "upgrade_diff_report",
            path: reportPath,
          },
        ],
        details: {
          source_version: upgradeDiffResult.sourceVersion,
          target_version: upgradeDiffResult.targetVersion,
          confirmation_decision: upgradeDiffResult.confirmationDecision,
        },
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
   * Writes one UTF-8 text artifact and ensures parent directory exists.
   * @param filePath Absolute file path.
   * @param content UTF-8 content.
   * @returns Void.
   */
  private async writeTextArtifact(filePath: string, content: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }

  /**
   * Writes one JSON artifact with deterministic indentation.
   * @param filePath Absolute file path.
   * @param payload JSON payload.
   * @returns Void.
   */
  private async writeJsonArtifact(filePath: string, payload: unknown): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }

  /**
   * Safely reads JSON payload from artifact file.
   * @param filePath Absolute file path.
   * @returns Parsed object, or null when parsing fails.
   */
  private async safeReadJson(filePath: string): Promise<Record<string, unknown> | null> {
    try {
      const rawContent = await readFile(filePath, "utf8");
      const parsed = JSON.parse(rawContent) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves review-queue request/result directories.
   * Why this exists:
   * request artifacts and verify artifacts should be isolated to avoid lifecycle cross-pollution.
   * @returns Normalized review-queue directories.
   */
  private resolveReviewQueueDirectories(): CliReviewQueueDirectorySet {
    const legacyQueueDirectoryPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "review-queue",
    );

    return {
      requestDirectoryPath: resolve(legacyQueueDirectoryPath, "requests"),
      resultDirectoryPath: resolve(legacyQueueDirectoryPath, "results"),
      legacyQueueDirectoryPath,
    };
  }

  /**
   * Collects queued review-request artifacts from request/legacy directories.
   * Why this exists:
   * verify flow must only consume queued requests, never previously generated verify results.
   * @param reviewQueueDirectories Resolved review-queue directories.
   * @returns Sorted queued request artifacts.
   */
  private async collectQueuedReviewRequestArtifacts(
    reviewQueueDirectories: CliReviewQueueDirectorySet,
  ): Promise<CliQueuedReviewRequestArtifact[]> {
    const queuedRequests = new Map<string, CliQueuedReviewRequestArtifact>();
    const candidateDirectories = [
      reviewQueueDirectories.requestDirectoryPath,
      reviewQueueDirectories.legacyQueueDirectoryPath,
    ];

    for (const candidateDirectoryPath of candidateDirectories) {
      if (!existsSync(candidateDirectoryPath)) {
        continue;
      }

      const fileNames = (await readdir(candidateDirectoryPath))
        .filter(
          (fileName) =>
            fileName.startsWith("review-") &&
            fileName.endsWith(".json") &&
            !fileName.startsWith("review-verify-"),
        )
        .sort((left, right) => left.localeCompare(right));

      for (const fileName of fileNames) {
        const filePath = resolve(candidateDirectoryPath, fileName);
        const payload = await this.safeReadJson(filePath);
        if (!payload) {
          continue;
        }

        if (payload.status !== CLI_REVIEW_REQUEST_STATUS.QUEUED) {
          continue;
        }

        const requestId =
          typeof payload.requestId === "string" && payload.requestId.trim().length > 0
            ? payload.requestId.trim()
            : fileName.replace(/\.json$/u, "");
        queuedRequests.set(filePath, {
          fileName,
          filePath,
          requestId,
        });
      }
    }

    return Array.from(queuedRequests.values()).sort((left, right) =>
      left.fileName.localeCompare(right.fileName),
    );
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
        pendingStatus: "hitl_required",
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
          roleProfileId: "role.default.planner",
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
          roleProfileId: "role.default.coder",
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
          roleProfileId: "role.default.reviewer",
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
