import { execFile } from "node:child_process";
import { constants as FsConstants, existsSync } from "node:fs";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

import { ClaudeCodeAgentAdapter } from "@repo-ai-governor/adapter-claude-code";
import { CodexAgentAdapter } from "@repo-ai-governor/adapter-codex";
import { GithubCopilotAgentAdapter } from "@repo-ai-governor/adapter-github-copilot";
import { LocalModelAgentAdapter } from "@repo-ai-governor/adapter-local-model";
import {
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilitySupportLevel,
  type AgentProbeResult,
  type AgentProtocolContract,
  AgentRouteRunner,
} from "@repo-ai-governor/adapter-sdk";
import {
  type AdaptersConfig,
  ConfigLoader,
  GovernorSchemaVersion,
  type ResolvedWorkspace,
  UpgradeSchemaDiffService,
} from "@repo-ai-governor/config";
import {
  type ChangeRiskEvaluationResult,
  ChangeRiskEvaluator,
  ChangeRiskFileCategory,
  type ChangeRiskFileCategoryValue,
  ChangeRiskRequiredAction,
} from "@repo-ai-governor/core-change-risk";
import { MemoryManager, MemoryScope } from "@repo-ai-governor/core-memory";
import { PolicyGateEngine, type PolicyGateEvaluationResult } from "@repo-ai-governor/core-policy";
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
import {
  type ExecutionReport,
  type ReplayExplainResult,
  ReplayExplainer,
  ReportBuilder,
} from "@repo-ai-governor/reporting";
import {
  AdapterAvailability,
  AdapterSurface,
  DefaultRoleProfileId,
  EXECUTION_PROGRESS_STATUS_LABELS,
  ErrorOutputEnvironment,
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  type MemoryRuntimeConfig,
  RuntimeError,
  WorkspaceMigrationPolicy,
} from "@repo-ai-governor/shared";
import { CliCommandName } from "./constants/cli-command.constant.js";
import {
  CLI_BASELINE_DOC_PATHS,
  CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS,
  CLI_DIAGNOSTIC_ROOT_CAUSE,
  CLI_DOCTOR_ATTACH_MODE,
  CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS,
  CLI_OPTIONAL_GOVERNANCE_SCRIPT_PATHS,
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_REVIEW_REQUEST_STATUS,
  CLI_RUNTIME_OPERATION,
  CLI_RUN_REPLAY_SOURCE_TYPE,
  CliGovernanceCheckStatus,
} from "./constants/cli-governance-runtime.constant.js";
import type {
  CliCommandExecutionResultPayload,
  CliCommandExperiencePayload,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliInteractionPrompt,
  CliLayeredLogs,
  CliRoleStageProgress,
  CliRuntimeDebugOptions,
} from "./types/index.js";

const execFileAsync = promisify(execFile);
const CLI_ADAPTER_LOCAL_PROBE_TIMEOUT_MS = 5000;
const CLI_ADAPTER_LOCAL_PROBE_MAX_BUFFER_BYTES = 65536;
const CLI_CLAUDE_CODE_COMMAND_CANDIDATES = [
  {
    command: "claude",
    args: ["--version"],
  },
  {
    command: "claude-code",
    args: ["--version"],
  },
] as const;

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
  adaptersConfig: AdaptersConfig;
  runtimeDebugOptions?: CliRuntimeDebugOptions;
  adapterLocalProbeOverrides?: Partial<
    Record<
      AdapterSurface,
      {
        availabilityStatus: AgentAvailabilityStatus;
        unavailableReasons: string[];
      }
    >
  >;
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

interface CliNormalizedRuntimeDebugOptions {
  dryRun: boolean;
  trace: boolean;
  replayPath: string | null;
  adapters: boolean;
  fix: boolean;
  recordLedger: boolean;
  taskId: string | null;
}

interface CliAdapterToolProbeSnapshot {
  toolId: AdapterSurface;
  enabled: boolean;
  configuredAvailability: AdapterAvailability | null;
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
  capabilitySupportByCapability: Map<string, AgentCapabilitySupportLevel>;
}

interface CliAdapterRoleEvaluation {
  roleId: string;
  roleProfileId: string;
  required: boolean;
  primarySurface: AdapterSurface;
  selectedSurface: AdapterSurface | null;
  selectedBy: "primary" | "fallback" | "none";
  unsupportedCapabilities: string[];
  degradedCapabilities: string[];
  unavailableReasons: string[];
  status: CliGovernanceCheckStatus;
}

interface CliAdapterVerificationResolution {
  overallStatus: CliGovernanceCheckStatus;
  tools: CliAdapterToolProbeSnapshot[];
  roleEvaluations: CliAdapterRoleEvaluation[];
  requiredRoleCount: number;
  requiredRoleFailedCount: number;
  degradedRoleCount: number;
  fallbackRoleCount: number;
  nextActions: string[];
}

interface CliLocalAdapterProbeResolution {
  availabilityStatus: AgentAvailabilityStatus;
  unavailableReasons: string[];
}

interface CliReplayExplainResolution {
  sourceType: string;
  executionId: string;
  explainResult: ReplayExplainResult;
}

interface CliBuildExperienceOptions {
  roleProgress: CliRoleStageProgress[];
  layeredLogs: CliLayeredLogs;
  interactionPrompts?: CliInteractionPrompt[];
}

/**
 * Implements Stage-9 CLI command semantics with a minimal governance execution chain.
 *
 * Why this exists:
 * command runtime behavior must be centralized so `init/connect/doctor/check/run/review/review-verify/verify/plan/upgrade`
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
    if (commandName !== CliCommandName.INIT) {
      await this.ensureWorkspaceBootstrap();
    }

    if (commandName === CliCommandName.INIT) {
      return this.executeInitCommand();
    }

    if (commandName === CliCommandName.CONNECT) {
      return this.executeConnectCommand();
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

    if (commandName === CliCommandName.VERIFY) {
      return this.executeVerifyCommand();
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
      await this.writeTextArtifact(configPath, this.buildDefaultConfigContent());
    }
  }

  /**
   * Generates adapter-connect diagnostics and optional ledger-backfill artifact.
   * @returns Runtime command result.
   */
  private async executeConnectCommand(): Promise<CliGovernanceCommandResult> {
    const runtimeDebugOptions = this.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.recordLedger && !runtimeDebugOptions.taskId) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        "connect --record-ledger requires --task-id <id>.",
        {
          command: CliCommandName.CONNECT,
          option: "--task-id",
        },
      );
    }

    const adapterVerification = await this.resolveAdapterVerification();
    const connectId = `connect-${Date.now()}`;
    const diagnosticsArtifactPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "diagnostics",
      "connect",
      `${connectId}.json`,
    );

    await this.writeJsonArtifact(diagnosticsArtifactPath, {
      connectId,
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: this.options.workspace.workspaceId,
        workspaceRoot: this.options.workspace.workspaceRoot,
        workspaceMode: this.options.workspace.mode,
      },
      adapters: this.options.adaptersConfig,
      verification: this.createAdapterVerificationArtifactPayload(adapterVerification),
      nextActions: adapterVerification.nextActions,
      behavior: {
        recordLedger: runtimeDebugOptions.recordLedger,
        taskId: runtimeDebugOptions.taskId,
      },
    });

    const checks: CliCommandResultCheck[] = [
      {
        id: "adapter_verification",
        status: adapterVerification.overallStatus,
        detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
      },
      {
        id: "diagnostics_artifact",
        status: CliGovernanceCheckStatus.PASS,
        detail: diagnosticsArtifactPath,
      },
    ];
    const artifacts: CliCommandResultArtifact[] = [
      {
        id: "connect_diagnostics",
        path: diagnosticsArtifactPath,
      },
    ];

    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      const ledgerBackfillPath = resolve(
        this.options.workspace.workspaceRoot,
        "context",
        "ledger-backfill",
        "connect",
        `${connectId}.json`,
      );
      await this.writeJsonArtifact(ledgerBackfillPath, {
        ledgerBackfillId: `ledger-backfill-${connectId}`,
        status: CLI_REVIEW_LEDGER_BACKFILL_STATUS.PENDING,
        createdAt: this.toRfc3339SecondsTimestamp(new Date()),
        taskId: runtimeDebugOptions.taskId,
        connectId,
        diagnosticsArtifactPath,
        attribution: {
          chain: "connect->doctor->verify",
          chainStep: "connect",
        },
      });
      checks.push({
        id: "ledger_backfill",
        status: CliGovernanceCheckStatus.PASS,
        detail: `task_id=${runtimeDebugOptions.taskId}`,
      });
      artifacts.push({
        id: "connect_ledger_backfill",
        path: ledgerBackfillPath,
      });
    } else if (runtimeDebugOptions.taskId) {
      checks.push({
        id: "ledger_backfill",
        status: CliGovernanceCheckStatus.WARN,
        detail: "--task-id ignored because --record-ledger is not set",
      });
    }

    const roleProgress = this.createAdapterRoleProgressRows({
      verification: adapterVerification,
      stage: ExecutionProgressStage.CONNECT,
      diagnosticsPath: diagnosticsArtifactPath,
      executionId: connectId,
    });
    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      roleProgress.push({
        roleId: "ledger-backfill",
        stage: ExecutionProgressStage.LEDGER_BACKFILL,
        status: ExecutionProgressStatus.WAITING,
        category: ExecutionInteractionCategory.NONE,
        summary: "Ledger backfill artifact is ready for task-record consumption.",
        detail: `task_id=${runtimeDebugOptions.taskId}`,
        backlink: {
          executionId: connectId,
          stageId: ExecutionProgressStage.LEDGER_BACKFILL,
          artifactPath: diagnosticsArtifactPath,
        },
      });
    }
    const interactionPrompts = this.createAdapterInteractionPrompts({
      verification: adapterVerification,
      stage: ExecutionProgressStage.CONNECT,
    });
    if (runtimeDebugOptions.recordLedger && runtimeDebugOptions.taskId) {
      interactionPrompts.push({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.LEDGER_BACKFILL,
        title: this.localizeText("Consume ledger backfill", "处理台账回填产物"),
        action: this.localizeText(
          "Resolve context/ledger-backfill/connect artifact into tasks/checklist/tasks.csv.",
          "将 context/ledger-backfill/connect 产物回填到 tasks/checklist/tasks.csv。",
        ),
        blocking: false,
      });
    }
    const experience = this.buildExperiencePayload({
      roleProgress,
      interactionPrompts,
      layeredLogs: {
        summary: [
          `connect_id=${connectId}`,
          `adapter_status=${adapterVerification.overallStatus}`,
          `required_failures=${adapterVerification.requiredRoleFailedCount}`,
        ],
        detailed: [
          `diagnostics_path=${diagnosticsArtifactPath}`,
          `fallback_roles=${adapterVerification.fallbackRoleCount}`,
          `degraded_roles=${adapterVerification.degradedRoleCount}`,
          `record_ledger=${runtimeDebugOptions.recordLedger}`,
        ],
      },
    });
    const message = this.localizeText(
      `Connect completed with adapter_status=${adapterVerification.overallStatus}; diagnostics=${diagnosticsArtifactPath}.`,
      `连接已完成，adapter_status=${adapterVerification.overallStatus}；诊断文件=${diagnosticsArtifactPath}。`,
    );
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_CONNECT,
        summary: message,
        check_totals: this.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          adapter_status: adapterVerification.overallStatus,
          required_roles: adapterVerification.requiredRoleCount,
          required_role_failures: adapterVerification.requiredRoleFailedCount,
          diagnostics_path: diagnosticsArtifactPath,
          record_ledger: runtimeDebugOptions.recordLedger,
          task_id: runtimeDebugOptions.taskId,
        },
      },
    };
  }

  /**
   * Probes environment health with read-only-safe diagnostics.
   * @returns Runtime command result.
   */
  private async executeDoctorCommand(): Promise<CliGovernanceCommandResult> {
    const runtimeDebugOptions = this.resolveRuntimeDebugOptions();
    const checks: CliCommandResultCheck[] = [];
    const artifacts: CliCommandResultArtifact[] = [];
    const nextActions: string[] = [];
    let safeLocalFixCount = 0;

    let workspaceRootExists = existsSync(this.options.workspace.workspaceRoot);
    if (!workspaceRootExists && runtimeDebugOptions.fix) {
      await mkdir(this.options.workspace.workspaceRoot, { recursive: true });
      workspaceRootExists = true;
      safeLocalFixCount += 1;
    }
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

    let configExists = existsSync(this.options.workspace.configPath);
    if (!configExists && runtimeDebugOptions.fix) {
      await this.writeTextArtifact(
        this.options.workspace.configPath,
        this.buildDefaultConfigContent(),
      );
      configExists = true;
      safeLocalFixCount += 1;
    }
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

    let memoryRootExists = existsSync(this.options.memoryStoreRoot);
    if (!memoryRootExists && runtimeDebugOptions.fix) {
      await mkdir(this.options.memoryStoreRoot, { recursive: true });
      memoryRootExists = true;
      safeLocalFixCount += 1;
    }
    checks.push({
      id: "memory_store_root",
      status: memoryRootExists ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
      detail: memoryRootExists
        ? this.options.memoryStoreRoot
        : `missing=${this.options.memoryStoreRoot}`,
    });

    let adapterStatus: CliGovernanceCheckStatus | null = null;
    let adapterVerificationSnapshot: CliAdapterVerificationResolution | null = null;
    if (runtimeDebugOptions.adapters) {
      const adapterVerification = await this.resolveAdapterVerification();
      adapterVerificationSnapshot = adapterVerification;
      adapterStatus = adapterVerification.overallStatus;
      checks.push({
        id: "adapter_verification",
        status: adapterStatus,
        detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
      });
      for (const toolSnapshot of adapterVerification.tools) {
        checks.push({
          id: `adapter_tool_${toolSnapshot.toolId}`,
          status: this.resolveToolProbeCheckStatus(toolSnapshot),
          detail: this.resolveToolProbeCheckDetail(toolSnapshot),
        });
      }
      if (adapterVerification.nextActions.length > 0) {
        nextActions.push(...adapterVerification.nextActions);
      }

      const diagnosticsArtifactPath = resolve(
        this.options.workspace.workspaceRoot,
        "context",
        "diagnostics",
        "doctor",
        `doctor-${Date.now()}.json`,
      );
      await this.writeJsonArtifact(diagnosticsArtifactPath, {
        generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
        workspace: {
          workspaceId: this.options.workspace.workspaceId,
          workspaceRoot: this.options.workspace.workspaceRoot,
          workspaceMode: this.options.workspace.mode,
        },
        attachMode,
        options: {
          adapters: runtimeDebugOptions.adapters,
          fix: runtimeDebugOptions.fix,
        },
        checks,
        verification: this.createAdapterVerificationArtifactPayload(adapterVerification),
        nextActions,
      });
      artifacts.push({
        id: "doctor_diagnostics",
        path: diagnosticsArtifactPath,
      });
    }

    if (runtimeDebugOptions.fix) {
      checks.push({
        id: "safe_local_fix",
        status:
          safeLocalFixCount > 0 ? CliGovernanceCheckStatus.PASS : CliGovernanceCheckStatus.WARN,
        detail:
          safeLocalFixCount > 0 ? `applied=${safeLocalFixCount}` : "no_safe_local_changes_applied",
      });
    }
    if (nextActions.length > 0) {
      checks.push({
        id: "next_action_hint",
        status: CliGovernanceCheckStatus.WARN,
        detail: nextActions[0] ?? "review adapter diagnostics for next action",
      });
    }

    const doctorStatus =
      !workspaceRootExists || !configExists
        ? ExecutionProgressStatus.FAILED
        : workspaceWritable && memoryRootExists
          ? ExecutionProgressStatus.COMPLETED
          : ExecutionProgressStatus.WARNING;
    const roleProgress: CliRoleStageProgress[] = [
      {
        roleId: "workspace",
        stage: ExecutionProgressStage.DOCTOR,
        status: doctorStatus,
        category:
          doctorStatus === ExecutionProgressStatus.FAILED
            ? ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION
            : ExecutionInteractionCategory.NONE,
        summary: `Attach mode resolved as ${attachMode}.`,
        detail: `workspace_root_exists=${workspaceRootExists} writable=${workspaceWritable} config_exists=${configExists} memory_root_exists=${memoryRootExists}`,
        backlink: {
          stageId: ExecutionProgressStage.DOCTOR,
          executionId: `doctor-${Date.now()}`,
        },
      },
    ];
    if (adapterVerificationSnapshot) {
      roleProgress.push(
        ...this.createAdapterRoleProgressRows({
          verification: adapterVerificationSnapshot,
          stage: ExecutionProgressStage.VERIFY,
          diagnosticsPath:
            artifacts.find((artifact) => artifact.id === "doctor_diagnostics")?.path ?? "n/a",
          executionId: `doctor-${Date.now()}`,
        }),
      );
    }
    const interactionPrompts: CliInteractionPrompt[] = [];
    if (attachMode === CLI_DOCTOR_ATTACH_MODE.READ_ONLY) {
      interactionPrompts.push({
        category: ExecutionInteractionCategory.PERMISSION_CONFIRMATION,
        stage: ExecutionProgressStage.DOCTOR,
        title: "Workspace is read-only",
        action: "Switch to writable attach mode if you need to create/update governance artifacts.",
        blocking: false,
      });
    }
    if (adapterVerificationSnapshot) {
      interactionPrompts.push(
        ...this.createAdapterInteractionPrompts({
          verification: adapterVerificationSnapshot,
          stage: ExecutionProgressStage.VERIFY,
        }),
      );
    }
    const experience = this.buildExperiencePayload({
      roleProgress,
      interactionPrompts,
      layeredLogs: {
        summary: [
          `attach_mode=${attachMode}`,
          `adapter_probe=${runtimeDebugOptions.adapters}`,
          `safe_local_fix_applied=${safeLocalFixCount}`,
        ],
        detailed: [
          `workspace_root=${this.options.workspace.workspaceRoot}`,
          `memory_root=${this.options.memoryStoreRoot}`,
          `next_actions=${nextActions.length}`,
        ],
      },
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
        ...(artifacts.length > 0 ? { artifacts } : {}),
        experience,
        details: {
          config_source: this.options.configSource,
          profile: this.options.profileId ?? "none",
          memory_store_provider: this.options.memoryStoreProviderName,
          adapters_enabled: runtimeDebugOptions.adapters,
          safe_local_fix_applied: safeLocalFixCount,
          adapter_status: adapterStatus,
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
    const routeRunner = this.createRunRouteRunner(compiledIr.nodes);
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
    if (runtimeDebugOptions.dryRun || runtimeDebugOptions.trace) {
      checks.push({
        id: "debug_mode",
        status: CliGovernanceCheckStatus.PASS,
        detail: `dry_run=${runtimeDebugOptions.dryRun} trace=${runtimeDebugOptions.trace}`,
      });
    }

    const diagnosticsTracePath =
      runtimeDebugOptions.dryRun || runtimeDebugOptions.trace
        ? await this.writeRunDiagnosticsTraceArtifact({
            executionId,
            executionSessionId,
            runtimeResult,
            policyResult,
            riskEvaluation,
            reportPath,
            replayPath,
            runtimeDebugOptions,
          })
        : null;

    if (diagnosticsTracePath) {
      artifacts.push({
        id: "diagnostics_trace",
        path: diagnosticsTracePath,
      });
    }

    const checkTotals = this.calculateCheckTotals(checks);
    const experience = this.createRunCommandExperience({
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

    const replayPayload = await this.safeReadJson(replayPath);
    if (!replayPayload) {
      throw new RuntimeError(
        GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
        `Replay source payload is invalid JSON object: ${replayPath}.`,
        {
          replayPath,
        },
      );
    }

    const replayExplainer = new ReplayExplainer();
    const replayResolution = this.resolveReplayExplainPayload({
      replayPath,
      replayPayload,
      replayExplainer,
    });
    const diagnosticsId = `replay-diagnostics-${Date.now()}`;
    const diagnosticsPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "diagnostics",
      "replay",
      `${diagnosticsId}.json`,
    );

    await this.writeJsonArtifact(diagnosticsPath, {
      diagnosticsId,
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: this.options.workspace.workspaceId,
        workspaceRoot: this.options.workspace.workspaceRoot,
        workspaceMode: this.options.workspace.mode,
      },
      replay: {
        sourcePath: replayPath,
        sourceType: replayResolution.sourceType,
        executionId: replayResolution.executionId,
      },
      summary: {
        matchedCount: replayResolution.explainResult.matchedCount,
        outputLocale: this.options.locale,
        nextActions: this.resolveDiagnosticNextActions({
          rootCause: CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
          policyOutcome: null,
          runtimeStatus: null,
        }),
      },
      explain: replayResolution.explainResult,
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

    if (runtimeDebugOptions.trace) {
      const tracePath = resolve(
        this.options.workspace.workspaceRoot,
        "context",
        "diagnostics",
        "trace",
        `${diagnosticsId}.trace.json`,
      );
      await this.writeJsonArtifact(tracePath, {
        diagnosticsId,
        generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
        mode: {
          dryRun: runtimeDebugOptions.dryRun,
          trace: runtimeDebugOptions.trace,
          replay: true,
        },
        keyEvents: [
          {
            eventId: "replay_input_resolved",
            status: "succeeded",
            detail: `source_type=${replayResolution.sourceType}`,
          },
          {
            eventId: "replay_explain_resolved",
            status: "succeeded",
            detail: `matched_count=${replayResolution.explainResult.matchedCount}`,
          },
        ],
        nextActions: this.resolveDiagnosticNextActions({
          rootCause: CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
          policyOutcome: null,
          runtimeStatus: null,
        }),
      });
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

    const experience = this.buildExperiencePayload({
      roleProgress: [
        {
          roleId: "replay",
          stage: ExecutionProgressStage.REPLAY,
          status: ExecutionProgressStatus.COMPLETED,
          category: ExecutionInteractionCategory.NONE,
          summary: "Replay diagnostics resolved from source payload.",
          detail: `source_type=${replayResolution.sourceType}`,
          backlink: {
            executionId: replayResolution.executionId,
            stageId: ExecutionProgressStage.REPLAY,
            replayPath,
            artifactPath: diagnosticsPath,
          },
        },
      ],
      interactionPrompts: this.resolveDiagnosticNextActions({
        rootCause: CLI_DIAGNOSTIC_ROOT_CAUSE.NONE,
        policyOutcome: null,
        runtimeStatus: null,
      }).map((nextAction) => ({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.REPLAY,
        title: "Next action",
        action: nextAction,
        blocking: false,
      })),
      layeredLogs: {
        summary: [
          `source_type=${replayResolution.sourceType}`,
          `matched_count=${replayResolution.explainResult.matchedCount}`,
        ],
        detailed: [`source_path=${replayPath}`, `diagnostics_path=${diagnosticsPath}`],
      },
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
    const reviewQueueDirectories = this.resolveReviewQueueDirectories();
    const requestId = `review-${Date.now()}`;
    const requestPath = resolve(reviewQueueDirectories.requestDirectoryPath, `${requestId}.json`);
    const correlationId = `review-chain-${requestId}`;
    await this.writeJsonArtifact(requestPath, {
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
    const experience = this.buildExperiencePayload({
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

    await this.writeJsonArtifact(ledgerBackfillPath, {
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

    await this.writeJsonArtifact(verifyPath, {
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

    await this.writeJsonArtifact(latestQueuedRequest.filePath, {
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
    const experience = this.buildExperiencePayload({
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
   * Verifies adapter routing matrix and emits pass/warn/fail diagnostics.
   * @returns Runtime command result.
   */
  private async executeVerifyCommand(): Promise<CliGovernanceCommandResult> {
    const runtimeDebugOptions = this.resolveRuntimeDebugOptions();
    const adapterVerification = await this.resolveAdapterVerification();
    const checks: CliCommandResultCheck[] = [];

    if (!runtimeDebugOptions.adapters) {
      checks.push({
        id: "adapters_flag",
        status: CliGovernanceCheckStatus.WARN,
        detail: "--adapters not set; verify still executed with adapters baseline by default",
      });
    }
    checks.push({
      id: "adapter_verification",
      status: adapterVerification.overallStatus,
      detail: `required_roles=${adapterVerification.requiredRoleCount} required_failures=${adapterVerification.requiredRoleFailedCount} degraded_roles=${adapterVerification.degradedRoleCount} fallback_roles=${adapterVerification.fallbackRoleCount}`,
    });
    for (const roleEvaluation of adapterVerification.roleEvaluations) {
      checks.push({
        id: `role_${roleEvaluation.roleId}`,
        status: roleEvaluation.status,
        detail: this.resolveRoleEvaluationDetail(roleEvaluation),
      });
    }

    const diagnosticsArtifactPath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "diagnostics",
      "verify",
      `verify-${Date.now()}.json`,
    );
    await this.writeJsonArtifact(diagnosticsArtifactPath, {
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: this.options.workspace.workspaceId,
        workspaceRoot: this.options.workspace.workspaceRoot,
        workspaceMode: this.options.workspace.mode,
      },
      adapters: this.options.adaptersConfig,
      verification: this.createAdapterVerificationArtifactPayload(adapterVerification),
      nextActions: adapterVerification.nextActions,
    });

    const artifacts: CliCommandResultArtifact[] = [
      {
        id: "verify_diagnostics",
        path: diagnosticsArtifactPath,
      },
    ];
    const checkTotals = this.calculateCheckTotals(checks);
    const experience = this.buildExperiencePayload({
      roleProgress: this.createAdapterRoleProgressRows({
        verification: adapterVerification,
        stage: ExecutionProgressStage.VERIFY,
        diagnosticsPath: diagnosticsArtifactPath,
        executionId: `verify-${Date.now()}`,
      }),
      interactionPrompts: this.createAdapterInteractionPrompts({
        verification: adapterVerification,
        stage: ExecutionProgressStage.VERIFY,
      }),
      layeredLogs: {
        summary: [
          `adapter_status=${adapterVerification.overallStatus}`,
          `required_roles=${adapterVerification.requiredRoleCount}`,
          `required_failures=${adapterVerification.requiredRoleFailedCount}`,
        ],
        detailed: [
          `fallback_roles=${adapterVerification.fallbackRoleCount}`,
          `degraded_roles=${adapterVerification.degradedRoleCount}`,
          `diagnostics_path=${diagnosticsArtifactPath}`,
        ],
      },
    });
    const message = `Verify completed with adapters_status=${adapterVerification.overallStatus}.`;

    if (adapterVerification.overallStatus === CliGovernanceCheckStatus.FAIL) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_ROUTE_NO_AVAILABLE_SURFACE,
        `verify failed because required adapter roles are unavailable or capability gaps exist. diagnostics=${diagnosticsArtifactPath}`,
        {
          reportPath: diagnosticsArtifactPath,
          adapterStatus: adapterVerification.overallStatus,
          requiredRoleCount: adapterVerification.requiredRoleCount,
          requiredRoleFailedCount: adapterVerification.requiredRoleFailedCount,
          degradedRoleCount: adapterVerification.degradedRoleCount,
          fallbackRoleCount: adapterVerification.fallbackRoleCount,
          checkTotals,
        },
      );
    }

    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.ADAPTER_VERIFY,
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        experience,
        details: {
          adapters_status: adapterVerification.overallStatus,
          required_roles: adapterVerification.requiredRoleCount,
          required_role_failures: adapterVerification.requiredRoleFailedCount,
          degraded_roles: adapterVerification.degradedRoleCount,
          fallback_roles: adapterVerification.fallbackRoleCount,
          diagnostics_path: diagnosticsArtifactPath,
        },
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
    };
  }

  /**
   * Resolves adapter tool-level check status from probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Check status used by doctor output.
   */
  private resolveToolProbeCheckStatus(
    snapshot: CliAdapterToolProbeSnapshot,
  ): CliGovernanceCheckStatus {
    if (!snapshot.enabled) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return CliGovernanceCheckStatus.WARN;
    }
    if (snapshot.availabilityStatus === AgentAvailabilityStatus.DEGRADED) {
      return CliGovernanceCheckStatus.WARN;
    }
    return CliGovernanceCheckStatus.PASS;
  }

  /**
   * Resolves adapter tool-level check detail text from probe snapshot.
   * @param snapshot Adapter tool probe snapshot.
   * @returns Human-readable detail text.
   */
  private resolveToolProbeCheckDetail(snapshot: CliAdapterToolProbeSnapshot): string {
    if (!snapshot.enabled) {
      return this.localizeText("disabled_by_config", "由配置禁用");
    }

    const readableReasons =
      snapshot.unavailableReasons.length > 0
        ? this.humanizeToolUnavailableReasons(snapshot.unavailableReasons)
        : ["none"];
    const availabilityLabel = this.localizeText("availability", "可用性");
    const reasonsLabel = this.localizeText("reasons", "原因");
    return `${availabilityLabel}=${snapshot.availabilityStatus} ${reasonsLabel}=${readableReasons.join(" | ")}`;
  }

  /**
   * Resolves role-level check detail text from adapter role evaluation.
   * @param roleEvaluation One role evaluation row.
   * @returns Human-readable detail text.
   */
  private resolveRoleEvaluationDetail(roleEvaluation: CliAdapterRoleEvaluation): string {
    const unsupported =
      roleEvaluation.unsupportedCapabilities.length > 0
        ? roleEvaluation.unsupportedCapabilities.join("|")
        : "none";
    const degraded =
      roleEvaluation.degradedCapabilities.length > 0
        ? roleEvaluation.degradedCapabilities.join("|")
        : "none";
    const unavailableReasons =
      roleEvaluation.unavailableReasons.length > 0
        ? roleEvaluation.unavailableReasons.join("|")
        : "none";
    return `required=${roleEvaluation.required} selected=${roleEvaluation.selectedSurface ?? "none"} selected_by=${roleEvaluation.selectedBy} unsupported=${unsupported} degraded=${degraded} reasons=${unavailableReasons}`;
  }

  /**
   * Converts machine-readable unavailable reasons into human-friendly diagnostics text.
   * @param reasons Raw unavailable reasons.
   * @returns Human-friendly reason lines.
   */
  private humanizeToolUnavailableReasons(reasons: string[]): string[] {
    return reasons.map((reason) => this.humanizeToolUnavailableReason(reason));
  }

  /**
   * Converts one unavailable reason code into human-friendly diagnostics text.
   * @param reason Raw unavailable reason.
   * @returns Human-friendly reason line.
   */
  private humanizeToolUnavailableReason(reason: string): string {
    if (reason.startsWith("command_missing:")) {
      const [, surface, command] = reason.split(":", 3);
      return this.localizeText(
        `missing command "${command}" for surface "${surface}"`,
        `surface "${surface}" 缺少本地命令 "${command}"`,
      );
    }

    if (reason.startsWith("command_probe_failed:")) {
      const [, surface, command, ...detailParts] = reason.split(":");
      const detail = detailParts.join(":");
      return this.localizeText(
        `command exists but check failed for surface "${surface}" via "${command}" (${detail})`,
        `surface "${surface}" 命令 "${command}" 可执行但探测失败（${detail}）`,
      );
    }

    if (reason.startsWith("probe_failed:")) {
      const [, ...detailParts] = reason.split(":");
      const detail = detailParts.join(":");
      return this.localizeText(`adapter probe failed (${detail})`, `adapter 探测失败（${detail}）`);
    }

    if (reason.startsWith("disabled_by_config:")) {
      const [, surface] = reason.split(":", 2);
      return this.localizeText(
        `disabled by config for surface "${surface}"`,
        `surface "${surface}" 已被配置禁用`,
      );
    }

    return reason;
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
   * Converts adapter verification resolution into JSON-serializable payload.
   * @param verification Adapter verification resolution.
   * @returns Artifact payload.
   */
  private createAdapterVerificationArtifactPayload(
    verification: CliAdapterVerificationResolution,
  ): Record<string, unknown> {
    return {
      overallStatus: verification.overallStatus,
      requiredRoleCount: verification.requiredRoleCount,
      requiredRoleFailedCount: verification.requiredRoleFailedCount,
      degradedRoleCount: verification.degradedRoleCount,
      fallbackRoleCount: verification.fallbackRoleCount,
      tools: verification.tools.map((tool) => ({
        toolId: tool.toolId,
        enabled: tool.enabled,
        configuredAvailability: tool.configuredAvailability,
        availabilityStatus: tool.availabilityStatus,
        unavailableReasons: tool.unavailableReasons,
        capabilitySupportByCapability: Object.fromEntries(
          tool.capabilitySupportByCapability.entries(),
        ),
      })),
      roles: verification.roleEvaluations.map((role) => ({
        roleId: role.roleId,
        roleProfileId: role.roleProfileId,
        required: role.required,
        primarySurface: role.primarySurface,
        selectedSurface: role.selectedSurface,
        selectedBy: role.selectedBy,
        unsupportedCapabilities: role.unsupportedCapabilities,
        degradedCapabilities: role.degradedCapabilities,
        unavailableReasons: role.unavailableReasons,
        status: role.status,
      })),
    };
  }

  /**
   * Creates route runner for run-command stage dispatch using adapters/routing config.
   * @param nodes Runtime process nodes.
   * @returns Route runner instance bound to configured surfaces and role bindings.
   */
  private createRunRouteRunner(nodes: ProcessIrNode[]): AgentRouteRunner {
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

      return {
        routeKey: node.routeKey,
        primarySurface: roleBinding.primarySurface,
        ...(roleBinding.fallbackSurfaces
          ? {
              fallbackSurfaces: [...roleBinding.fallbackSurfaces],
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
      protocolBySurface: this.createProtocolBySurface(),
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
    });

    return {
      handledBy: "adapter-route-runner",
      nodeId: stageContext.nodeId,
      stageId: stageContext.stageId,
      routeKey: stageContext.routeKey,
      roleProfileId: stageContext.roleProfileId,
      adapterSurface: dispatchResult.selectedSurface,
      selectedBy: dispatchResult.auditRecord.selectedBy ?? "unknown",
      fallbackTriggered: dispatchResult.auditRecord.fallbackTriggered,
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
   * Creates protocol map for all built-in adapter surfaces using tool config overrides.
   * @returns Surface -> protocol instance map.
   */
  private createProtocolBySurface(): Record<string, AgentProtocolContract> {
    const toolConfigBySurface = new Map<
      AdapterSurface,
      NonNullable<AdaptersConfig["tools"]>[number]
    >();
    for (const toolConfig of this.options.adaptersConfig.tools ?? []) {
      toolConfigBySurface.set(toolConfig.toolId, toolConfig);
    }

    const protocolBySurface: Record<string, AgentProtocolContract> = {};
    const surfaces = this.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    for (const surface of surfaces) {
      const toolConfig = toolConfigBySurface.get(surface);
      const enabled = toolConfig?.enabled ?? true;
      const configuredAvailability = enabled
        ? (toolConfig?.availability ?? null)
        : AdapterAvailability.UNAVAILABLE;
      const unavailableReasons = [...(toolConfig?.unavailableReasons ?? [])];
      if (!enabled) {
        unavailableReasons.push(`disabled_by_config:${surface}`);
      }
      const availabilityStatus = enabled
        ? this.resolveAdapterAvailabilityStatus(configuredAvailability)
        : AgentAvailabilityStatus.UNAVAILABLE;
      const adapterOptions = {
        availabilityStatus,
        unavailableReasons,
      };
      protocolBySurface[surface] =
        surface === AdapterSurface.CODEX
          ? new CodexAgentAdapter(adapterOptions)
          : surface === AdapterSurface.GITHUB_COPILOT
            ? new GithubCopilotAgentAdapter(adapterOptions)
            : surface === AdapterSurface.CLAUDE_CODE
              ? new ClaudeCodeAgentAdapter(adapterOptions)
              : new LocalModelAgentAdapter(adapterOptions);
    }

    return protocolBySurface;
  }

  /**
   * Resolves adapter surfaces that should be tracked by runtime diagnostics/routing.
   * @param toolConfigBySurface Optional tool config lookup map.
   * @returns Deduplicated surface list derived from routing/tool contracts.
   */
  private resolveTrackedAdapterSurfaces(
    toolConfigBySurface?: Map<AdapterSurface, NonNullable<AdaptersConfig["tools"]>[number]>,
  ): AdapterSurface[] {
    const surfaceSet = new Set<AdapterSurface>();
    if (toolConfigBySurface) {
      for (const surface of toolConfigBySurface.keys()) {
        surfaceSet.add(surface);
      }
    }
    for (const roleBinding of Object.values(this.options.adaptersConfig.routing.roleBindings)) {
      surfaceSet.add(roleBinding.primarySurface);
      for (const fallbackSurface of roleBinding.fallbackSurfaces ?? []) {
        surfaceSet.add(fallbackSurface);
      }
    }

    if (surfaceSet.size > 0) {
      return Array.from(surfaceSet.values());
    }

    return [AdapterSurface.CODEX, AdapterSurface.GITHUB_COPILOT, AdapterSurface.CLAUDE_CODE];
  }

  /**
   * Builds one human-friendly experience payload from progress/log/prompt primitives.
   * @param options Experience payload source blocks.
   * @returns Stable command experience object.
   */
  private buildExperiencePayload(options: CliBuildExperienceOptions): CliCommandExperiencePayload {
    return {
      statusDictionary: { ...EXECUTION_PROGRESS_STATUS_LABELS },
      roleProgress: options.roleProgress,
      layeredLogs: options.layeredLogs,
      interactionPrompts: options.interactionPrompts ?? [],
    };
  }

  /**
   * Maps command check status to normalized progress status.
   * @param status Command check status.
   * @returns Progress status consumed by output experience payload.
   */
  private resolveProgressStatusFromCheck(
    status: CliGovernanceCheckStatus,
  ): ExecutionProgressStatus {
    if (status === CliGovernanceCheckStatus.PASS) {
      return ExecutionProgressStatus.COMPLETED;
    }
    if (status === CliGovernanceCheckStatus.WARN) {
      return ExecutionProgressStatus.WARNING;
    }
    return ExecutionProgressStatus.FAILED;
  }

  /**
   * Converts adapter role evaluations into role/stage progress rows.
   * @param options Stage context and adapter verification snapshot.
   * @returns Role progress rows for command experience output.
   */
  private createAdapterRoleProgressRows(options: {
    verification: CliAdapterVerificationResolution;
    stage: ExecutionProgressStage;
    diagnosticsPath: string;
    executionId: string;
  }): CliRoleStageProgress[] {
    return options.verification.roleEvaluations.map((roleEvaluation) => ({
      roleId: roleEvaluation.roleId,
      stage: options.stage,
      status: this.resolveProgressStatusFromCheck(roleEvaluation.status),
      category:
        roleEvaluation.status === CliGovernanceCheckStatus.FAIL
          ? ExecutionInteractionCategory.RUNTIME_FAILURE
          : ExecutionInteractionCategory.NONE,
      summary: `Role ${roleEvaluation.roleId} routed via ${roleEvaluation.selectedSurface ?? "none"} (${roleEvaluation.selectedBy}).`,
      detail: this.resolveRoleEvaluationDetail(roleEvaluation),
      backlink: {
        executionId: options.executionId,
        stageId: options.stage,
        artifactPath: options.diagnosticsPath,
      },
    }));
  }

  /**
   * Builds adapter follow-up prompts from verification diagnostics.
   * @param options Adapter verification context.
   * @returns Ordered interaction prompts.
   */
  private createAdapterInteractionPrompts(options: {
    verification: CliAdapterVerificationResolution;
    stage: ExecutionProgressStage;
  }): CliInteractionPrompt[] {
    return options.verification.nextActions.map((nextAction) => ({
      category:
        options.verification.overallStatus === CliGovernanceCheckStatus.FAIL
          ? ExecutionInteractionCategory.RUNTIME_FAILURE
          : ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
      stage: options.stage,
      title:
        options.verification.overallStatus === CliGovernanceCheckStatus.FAIL
          ? this.localizeText("Adapter route blocked", "Adapter 路由已阻断")
          : this.localizeText("Adapter route attention", "Adapter 路由需要关注"),
      action: nextAction,
      blocking: options.verification.overallStatus === CliGovernanceCheckStatus.FAIL,
    }));
  }

  /**
   * Resolves adapters/routing verification summary used by connect/doctor/verify commands.
   * @returns Adapter verification resolution.
   */
  private async resolveAdapterVerification(): Promise<CliAdapterVerificationResolution> {
    const toolSnapshots = await this.collectAdapterToolSnapshots();
    const toolSnapshotBySurface = new Map<AdapterSurface, CliAdapterToolProbeSnapshot>(
      toolSnapshots.map((snapshot) => [snapshot.toolId, snapshot]),
    );
    const routingByRole = this.options.adaptersConfig.routing.roleBindings;
    const fallbackPrimarySurface =
      this.options.adaptersConfig.tools?.[0]?.toolId ?? AdapterSurface.CODEX;
    const roleEvaluations = this.options.adaptersConfig.roles.map<CliAdapterRoleEvaluation>(
      (role) => {
        const roleBinding = routingByRole[role.roleId];
        if (!roleBinding) {
          return {
            roleId: role.roleId,
            roleProfileId: role.roleProfileId,
            required: role.required,
            primarySurface: fallbackPrimarySurface,
            selectedSurface: null,
            selectedBy: "none",
            unsupportedCapabilities: [],
            degradedCapabilities: [],
            unavailableReasons: [`missing_role_binding:${role.roleId}`],
            status: role.required ? CliGovernanceCheckStatus.FAIL : CliGovernanceCheckStatus.WARN,
          };
        }

        const candidateSurfaces = [
          roleBinding.primarySurface,
          ...(roleBinding.fallbackSurfaces ?? []),
        ].filter((surface, index, list) => list.indexOf(surface) === index);
        const unavailableReasons: string[] = [];

        for (const candidateSurface of candidateSurfaces) {
          const toolSnapshot = toolSnapshotBySurface.get(candidateSurface);
          if (!toolSnapshot) {
            unavailableReasons.push(`missing_tool_snapshot:${candidateSurface}`);
            continue;
          }
          if (!toolSnapshot.enabled) {
            unavailableReasons.push(`tool_disabled:${candidateSurface}`);
            continue;
          }
          if (toolSnapshot.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
            unavailableReasons.push(
              `surface_unavailable:${candidateSurface}:${toolSnapshot.unavailableReasons.join("|") || "unavailable"}`,
            );
            continue;
          }

          const unsupportedCapabilities: string[] = [];
          const degradedCapabilities: string[] = [];
          for (const requiredCapability of role.requiredCapabilities) {
            const supportLevel =
              toolSnapshot.capabilitySupportByCapability.get(requiredCapability) ??
              AgentCapabilitySupportLevel.UNSUPPORTED;
            if (supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED) {
              unsupportedCapabilities.push(requiredCapability);
              continue;
            }
            if (supportLevel === AgentCapabilitySupportLevel.DEGRADED) {
              degradedCapabilities.push(requiredCapability);
            }
          }
          if (unsupportedCapabilities.length > 0) {
            unavailableReasons.push(
              `capability_gap:${candidateSurface}:${unsupportedCapabilities.join("|")}`,
            );
            continue;
          }

          const selectedBy =
            candidateSurface === roleBinding.primarySurface ? "primary" : ("fallback" as const);
          const degraded =
            toolSnapshot.availabilityStatus === AgentAvailabilityStatus.DEGRADED ||
            degradedCapabilities.length > 0;
          return {
            roleId: role.roleId,
            roleProfileId: role.roleProfileId,
            required: role.required,
            primarySurface: roleBinding.primarySurface,
            selectedSurface: candidateSurface,
            selectedBy,
            unsupportedCapabilities: [],
            degradedCapabilities,
            unavailableReasons,
            status:
              selectedBy === "fallback" || degraded
                ? CliGovernanceCheckStatus.WARN
                : CliGovernanceCheckStatus.PASS,
          };
        }

        return {
          roleId: role.roleId,
          roleProfileId: role.roleProfileId,
          required: role.required,
          primarySurface: roleBinding.primarySurface,
          selectedSurface: null,
          selectedBy: "none",
          unsupportedCapabilities: [],
          degradedCapabilities: [],
          unavailableReasons:
            unavailableReasons.length > 0
              ? unavailableReasons
              : [`surface_unavailable:${roleBinding.primarySurface}`],
          status: role.required ? CliGovernanceCheckStatus.FAIL : CliGovernanceCheckStatus.WARN,
        };
      },
    );

    const requiredRoleCount = roleEvaluations.filter((role) => role.required).length;
    const requiredRoleFailedCount = roleEvaluations.filter(
      (role) => role.required && role.status === CliGovernanceCheckStatus.FAIL,
    ).length;
    const degradedRoleCount = roleEvaluations.filter(
      (role) => role.status === CliGovernanceCheckStatus.WARN,
    ).length;
    const fallbackRoleCount = roleEvaluations.filter(
      (role) => role.selectedBy === "fallback",
    ).length;
    const hasToolLevelWarning = toolSnapshots.some(
      (tool) => this.resolveToolProbeCheckStatus(tool) === CliGovernanceCheckStatus.WARN,
    );

    let overallStatus = CliGovernanceCheckStatus.PASS;
    if (requiredRoleCount === 0 || requiredRoleFailedCount > 0) {
      overallStatus = CliGovernanceCheckStatus.FAIL;
    } else if (degradedRoleCount > 0 || hasToolLevelWarning) {
      overallStatus = CliGovernanceCheckStatus.WARN;
    }

    const nextActions: string[] = [];
    if (requiredRoleCount === 0) {
      nextActions.push(
        this.localizeText(
          "Define at least one adapters.roles item with required=true.",
          "至少定义一个 adapters.roles 且 required=true 的角色。",
        ),
      );
    }
    if (requiredRoleFailedCount > 0) {
      nextActions.push(
        this.localizeText(
          "Check adapters.routing.roleBindings primary/fallback surfaces and ensure required roles have at least one available surface.",
          "请检查 adapters.routing.roleBindings 的主备 surface，确保必需角色至少有一个可用 surface。",
        ),
      );
    }
    const unavailableToolIds = toolSnapshots
      .filter((tool) => tool.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE)
      .map((tool) => tool.toolId);
    const missingCommands = this.collectMissingCommandsFromToolSnapshots(toolSnapshots);
    const failedProbeCommands = this.collectFailedProbeCommandsFromToolSnapshots(toolSnapshots);
    if (
      unavailableToolIds.length > 0 &&
      missingCommands.length === 0 &&
      failedProbeCommands.length === 0
    ) {
      nextActions.push(
        this.localizeText(
          `Probe/login dependencies are unavailable for: ${unavailableToolIds.join(", ")}.`,
          `以下工具的探测或登录依赖不可用：${unavailableToolIds.join(", ")}。`,
        ),
      );
    }
    if (missingCommands.length > 0) {
      nextActions.push(
        this.localizeText(
          `Install missing local commands before connect/verify: ${missingCommands.join(", ")}.`,
          `请先安装缺失的本地命令后再执行 connect/verify：${missingCommands.join(", ")}。`,
        ),
      );
    }
    if (failedProbeCommands.length > 0) {
      nextActions.push(
        this.localizeText(
          `Some commands exist but probe failed (${failedProbeCommands.join(", ")}). Run them manually to verify login/extension status.`,
          `部分命令可执行但探测失败（${failedProbeCommands.join(", ")}），请手动执行命令确认登录/扩展状态。`,
        ),
      );
    }
    if (fallbackRoleCount > 0 || degradedRoleCount > 0) {
      nextActions.push(
        this.localizeText(
          "Primary surfaces are degraded or fallback is in use; review cost/latency/risk routing priorities before unattended execution.",
          "当前使用降级或 fallback 路由，建议在无人值守执行前复核成本/时延/风险优先级。",
        ),
      );
    }

    return {
      overallStatus,
      tools: toolSnapshots,
      roleEvaluations,
      requiredRoleCount,
      requiredRoleFailedCount,
      degradedRoleCount,
      fallbackRoleCount,
      nextActions,
    };
  }

  /**
   * Probes all built-in adapter tools and resolves tool-level availability snapshots.
   * @returns Tool-level probe snapshots.
   */
  private async collectAdapterToolSnapshots(): Promise<CliAdapterToolProbeSnapshot[]> {
    const toolConfigBySurface = new Map<
      AdapterSurface,
      NonNullable<AdaptersConfig["tools"]>[number]
    >();
    for (const toolConfig of this.options.adaptersConfig.tools ?? []) {
      toolConfigBySurface.set(toolConfig.toolId, toolConfig);
    }
    const protocolBySurface = this.createProtocolBySurface();

    const snapshots: CliAdapterToolProbeSnapshot[] = [];
    const surfaces = this.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    for (const surface of surfaces) {
      const toolConfig = toolConfigBySurface.get(surface);
      const enabled = toolConfig?.enabled ?? true;
      const configuredAvailability = enabled
        ? (toolConfig?.availability ?? null)
        : AdapterAvailability.UNAVAILABLE;
      const configuredUnavailableReasons = [...(toolConfig?.unavailableReasons ?? [])];
      const protocol = protocolBySurface[surface];
      const localProbeResolution = enabled
        ? await this.probeLocalAdapterAvailability(surface)
        : {
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            unavailableReasons: [`disabled_by_config:${surface}`],
          };
      try {
        const probeResult = await protocol.probe({
          routeKey: `cli.adapter.probe.${surface}`,
          requiredCapabilities: [],
        });
        snapshots.push({
          toolId: surface,
          enabled,
          configuredAvailability,
          availabilityStatus: this.mergeAvailabilityStatus(
            probeResult.availabilityStatus,
            localProbeResolution.availabilityStatus,
          ),
          unavailableReasons: [
            ...configuredUnavailableReasons,
            ...probeResult.unavailableReasons,
            ...localProbeResolution.unavailableReasons,
          ].filter((reason, index, list) => list.indexOf(reason) === index),
          capabilitySupportByCapability: this.createCapabilitySupportMap(probeResult),
        });
      } catch (error) {
        const standardizedError = this.formatExecFailureDetail(error);
        const disabledReasons = enabled ? [] : [`disabled_by_config:${surface}`];
        snapshots.push({
          toolId: surface,
          enabled,
          configuredAvailability,
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [
            ...configuredUnavailableReasons,
            ...disabledReasons,
            `probe_failed:${standardizedError}`,
          ].filter((reason, index, list) => list.indexOf(reason) === index),
          capabilitySupportByCapability: new Map(),
        });
      }
    }

    return snapshots;
  }

  /**
   * Probes local machine readiness for one adapter surface.
   * @param surface Adapter surface id.
   * @returns Runtime availability and reasons from local probe.
   */
  private async probeLocalAdapterAvailability(
    surface: AdapterSurface,
  ): Promise<CliLocalAdapterProbeResolution> {
    const overrideResolution = this.options.adapterLocalProbeOverrides?.[surface];
    if (overrideResolution) {
      return {
        availabilityStatus: overrideResolution.availabilityStatus,
        unavailableReasons: [...overrideResolution.unavailableReasons],
      };
    }

    if (surface === AdapterSurface.CODEX) {
      return this.probeSingleCommandAvailability(surface, "codex", ["--version"]);
    }

    if (surface === AdapterSurface.CLAUDE_CODE) {
      const unavailableReasons: string[] = [];
      for (const candidate of CLI_CLAUDE_CODE_COMMAND_CANDIDATES) {
        const probeResult = await this.probeSingleCommandAvailability(
          surface,
          candidate.command,
          candidate.args,
        );
        if (probeResult.availabilityStatus === AgentAvailabilityStatus.AVAILABLE) {
          return probeResult;
        }
        unavailableReasons.push(...probeResult.unavailableReasons);
      }
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: unavailableReasons.filter(
          (reason, index, list) => list.indexOf(reason) === index,
        ),
      };
    }

    if (surface === AdapterSurface.OLLAMA) {
      return this.probeSingleCommandAvailability(surface, "ollama", ["--version"]);
    }

    const githubCliProbe = await this.probeSingleCommandAvailability(surface, "gh", ["--version"]);
    if (githubCliProbe.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      return githubCliProbe;
    }

    return this.probeSingleCommandAvailability(surface, "gh", ["copilot", "--help"]);
  }

  /**
   * Executes one command probe and translates process result into availability status.
   * @param surface Adapter surface that owns this probe.
   * @param command Command name.
   * @param args Command arguments.
   * @returns Probe resolution for this command.
   */
  private async probeSingleCommandAvailability(
    surface: AdapterSurface,
    command: string,
    args: readonly string[],
  ): Promise<CliLocalAdapterProbeResolution> {
    try {
      await execFileAsync(command, [...args], {
        timeout: CLI_ADAPTER_LOCAL_PROBE_TIMEOUT_MS,
        maxBuffer: CLI_ADAPTER_LOCAL_PROBE_MAX_BUFFER_BYTES,
      });
      return {
        availabilityStatus: AgentAvailabilityStatus.AVAILABLE,
        unavailableReasons: [],
      };
    } catch (error) {
      if (this.isMissingCommandFailure(error)) {
        return {
          availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
          unavailableReasons: [`command_missing:${surface}:${command}`],
        };
      }
      return {
        availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
        unavailableReasons: [
          `command_probe_failed:${surface}:${command}:${this.formatExecFailureDetail(error)}`,
        ],
      };
    }
  }

  /**
   * Checks whether one command-probe failure indicates executable-not-found.
   * @param error Unknown probe failure.
   * @returns True when process failed because command is missing.
   */
  private isMissingCommandFailure(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }
    const errorCode = (error as { code?: unknown }).code;
    return errorCode === "ENOENT";
  }

  /**
   * Merges adapter-protocol status with local command probe status.
   * @param protocolStatus Availability resolved by adapter protocol probe.
   * @param localStatus Availability resolved by local command probe.
   * @returns Merged availability status.
   */
  private mergeAvailabilityStatus(
    protocolStatus: AgentAvailabilityStatus,
    localStatus: AgentAvailabilityStatus,
  ): AgentAvailabilityStatus {
    if (
      protocolStatus === AgentAvailabilityStatus.UNAVAILABLE ||
      localStatus === AgentAvailabilityStatus.UNAVAILABLE
    ) {
      return AgentAvailabilityStatus.UNAVAILABLE;
    }
    if (
      protocolStatus === AgentAvailabilityStatus.DEGRADED ||
      localStatus === AgentAvailabilityStatus.DEGRADED
    ) {
      return AgentAvailabilityStatus.DEGRADED;
    }
    return AgentAvailabilityStatus.AVAILABLE;
  }

  /**
   * Collects missing command names from adapter tool snapshots.
   * @param toolSnapshots Tool-level snapshots.
   * @returns Unique command names that are missing locally.
   */
  private collectMissingCommandsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const commands: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith("command_missing:")) {
          continue;
        }
        const [, , command] = reason.split(":", 3);
        if (command && !commands.includes(command)) {
          commands.push(command);
        }
      }
    }
    return commands;
  }

  /**
   * Collects command probes that failed despite command presence.
   * @param toolSnapshots Tool-level snapshots.
   * @returns Unique `<surface>:<command>` command probe identifiers.
   */
  private collectFailedProbeCommandsFromToolSnapshots(
    toolSnapshots: CliAdapterToolProbeSnapshot[],
  ): string[] {
    const failedCommands: string[] = [];
    for (const snapshot of toolSnapshots) {
      for (const reason of snapshot.unavailableReasons) {
        if (!reason.startsWith("command_probe_failed:")) {
          continue;
        }
        const [, surface, command] = reason.split(":", 4);
        if (!surface || !command) {
          continue;
        }
        const failedCommandId = `${surface}:${command}`;
        if (!failedCommands.includes(failedCommandId)) {
          failedCommands.push(failedCommandId);
        }
      }
    }
    return failedCommands;
  }

  /**
   * Converts optional config availability override into adapter-sdk availability enum.
   * @param availability Optional config-level availability override.
   * @returns Adapter availability status used by adapter constructor options.
   */
  private resolveAdapterAvailabilityStatus(
    availability: AdapterAvailability | null,
  ): AgentAvailabilityStatus {
    if (availability === AdapterAvailability.DEGRADED) {
      return AgentAvailabilityStatus.DEGRADED;
    }
    if (availability === AdapterAvailability.UNAVAILABLE) {
      return AgentAvailabilityStatus.UNAVAILABLE;
    }
    return AgentAvailabilityStatus.AVAILABLE;
  }

  /**
   * Creates capability support lookup map from one probe result.
   * @param probeResult Adapter probe result.
   * @returns Capability -> support level lookup.
   */
  private createCapabilitySupportMap(
    probeResult: AgentProbeResult,
  ): Map<string, AgentCapabilitySupportLevel> {
    return new Map(
      probeResult.capabilityMatrix.capabilityStates.map((capabilityState) => [
        capabilityState.capability,
        capabilityState.supportLevel,
      ]),
    );
  }

  /**
   * Writes one layered diagnostics trace artifact for `run` execution.
   * @param options Run execution context.
   * @returns Trace artifact path.
   */
  private async writeRunDiagnosticsTraceArtifact(options: {
    executionId: string;
    executionSessionId: string;
    runtimeResult: RuntimeExecutionResult;
    policyResult: PolicyGateEvaluationResult;
    riskEvaluation: ChangeRiskEvaluationResult;
    reportPath: string;
    replayPath: string;
    runtimeDebugOptions: CliNormalizedRuntimeDebugOptions;
  }): Promise<string> {
    const tracePath = resolve(
      this.options.workspace.workspaceRoot,
      "context",
      "diagnostics",
      "trace",
      `${options.executionId}.trace.json`,
    );
    const rootCause = this.resolveRunDiagnosticRootCause({
      policyOutcome: options.policyResult.policyOutcome,
      runtimeStatus: options.runtimeResult.status,
    });
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
        stageResult.output && typeof stageResult.output === "object" ? stageResult.output : null;

      return {
        stageId: stageResult.stageId,
        nodeId: stageResult.nodeId,
        handledBy:
          output && typeof output.handledBy === "string" ? output.handledBy : "unknown_handler",
        routeKey: output && typeof output.routeKey === "string" ? output.routeKey : "unknown_route",
      };
    });

    await this.writeJsonArtifact(tracePath, {
      diagnosticsId: `trace-${options.executionId}`,
      generatedAt: this.toRfc3339SecondsTimestamp(new Date()),
      workspace: {
        workspaceId: this.options.workspace.workspaceId,
        workspaceRoot: this.options.workspace.workspaceRoot,
        workspaceMode: this.options.workspace.mode,
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
        rootCause,
      },
      keyEvents: [
        {
          eventId: "compile",
          status: "succeeded",
          detail: "Compiled IR snapshot generated.",
        },
        ...options.runtimeResult.stageResults.map((stageResult) => ({
          eventId: stageResult.stageId,
          status: stageResult.status,
          detail: `duration_ms=${stageResult.durationMs}`,
        })),
        {
          eventId: "policy",
          status:
            options.policyResult.policyOutcome === ChangeRiskRequiredAction.ALLOW
              ? "allow"
              : "requires_attention",
          detail: `matched_rules=${options.policyResult.matchedRuleIds.join("|") || "none"}`,
        },
        {
          eventId: "report_replay_persisted",
          status: "succeeded",
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
      nextActions: this.resolveDiagnosticNextActions({
        rootCause,
        policyOutcome: options.policyResult.policyOutcome,
        runtimeStatus: options.runtimeResult.status,
      }),
    });

    return tracePath;
  }

  /**
   * Builds run-command human-friendly experience payload from runtime/policy/report facts.
   * @param options Run command result context.
   * @returns Command experience payload.
   */
  private createRunCommandExperience(options: {
    executionId: string;
    runtimeResult: RuntimeExecutionResult;
    policyResult: PolicyGateEvaluationResult;
    reportPath: string;
    replayPath: string;
    diagnosticsTracePath: string | null;
  }): CliCommandExperiencePayload {
    const rootCause = this.resolveRunDiagnosticRootCause({
      policyOutcome: options.policyResult.policyOutcome,
      runtimeStatus: options.runtimeResult.status,
    });
    const interactionCategory = this.resolveInteractionCategoryFromRootCause(rootCause);
    const roleProgress: CliRoleStageProgress[] = [
      {
        roleId: "compiler",
        stage: ExecutionProgressStage.RUN_COMPILE,
        status: ExecutionProgressStatus.COMPLETED,
        category: ExecutionInteractionCategory.NONE,
        summary: "Process IR compile completed.",
        detail: `execution_id=${options.executionId}`,
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.RUN_COMPILE,
        },
      },
      ...options.runtimeResult.stageResults.map((stageResult) => ({
        roleId: stageResult.stageId,
        stage: ExecutionProgressStage.RUN_RUNTIME,
        status: this.resolveRuntimeStageProgressStatus(stageResult.status),
        category:
          this.resolveRuntimeStageProgressStatus(stageResult.status) ===
          ExecutionProgressStatus.FAILED
            ? ExecutionInteractionCategory.RUNTIME_FAILURE
            : ExecutionInteractionCategory.NONE,
        summary: `Stage ${stageResult.stageId} finished with ${stageResult.status}.`,
        detail: `duration_ms=${stageResult.durationMs}`,
        backlink: {
          executionId: options.executionId,
          stageId: stageResult.stageId,
        },
      })),
      {
        roleId: "policy-gate",
        stage: ExecutionProgressStage.POLICY_WAITING,
        status: this.resolvePolicyProgressStatus(options.policyResult.policyOutcome),
        category: interactionCategory,
        summary: `Policy outcome resolved as ${options.policyResult.policyOutcome}.`,
        detail: `matched_rules=${options.policyResult.matchedRuleIds.join("|") || "none"}`,
        backlink: {
          executionId: options.executionId,
          stageId: "stage-policy-gate",
          reportPath: options.reportPath,
          replayPath: options.replayPath,
        },
      },
      {
        roleId: "reporting",
        stage: ExecutionProgressStage.REPORT,
        status: ExecutionProgressStatus.COMPLETED,
        category: ExecutionInteractionCategory.NONE,
        summary: "Execution report artifact persisted.",
        detail: options.reportPath,
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.REPORT,
          reportPath: options.reportPath,
        },
      },
      {
        roleId: "replay",
        stage: ExecutionProgressStage.REPLAY,
        status: ExecutionProgressStatus.COMPLETED,
        category: ExecutionInteractionCategory.NONE,
        summary: "Replay explain artifact persisted.",
        detail: options.replayPath,
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.REPLAY,
          replayPath: options.replayPath,
        },
      },
    ];

    if (
      options.policyResult.policyOutcome === ChangeRiskRequiredAction.CONFIRM ||
      options.policyResult.policyOutcome === ChangeRiskRequiredAction.ESCALATE
    ) {
      roleProgress.push({
        roleId: "human-reviewer",
        stage: ExecutionProgressStage.HUMAN_CONFIRMATION,
        status: ExecutionProgressStatus.WAITING,
        category: ExecutionInteractionCategory.HUMAN_CONFIRMATION,
        summary: "Awaiting human confirmation before unattended chain can continue.",
        detail: "Run review/review-verify and provide explicit confirmation decision.",
        backlink: {
          executionId: options.executionId,
          stageId: ExecutionProgressStage.HUMAN_CONFIRMATION,
          reportPath: options.reportPath,
          replayPath: options.replayPath,
        },
      });
    }

    const nextActions = this.resolveDiagnosticNextActions({
      rootCause,
      policyOutcome: options.policyResult.policyOutcome,
      runtimeStatus: options.runtimeResult.status,
    });
    const interactionPrompts: CliInteractionPrompt[] = nextActions.map((nextAction) => ({
      category: interactionCategory,
      stage:
        interactionCategory === ExecutionInteractionCategory.HUMAN_CONFIRMATION
          ? ExecutionProgressStage.HUMAN_CONFIRMATION
          : ExecutionProgressStage.POLICY_WAITING,
      title: "Next action",
      action: nextAction,
      blocking:
        interactionCategory === ExecutionInteractionCategory.POLICY_WAITING ||
        interactionCategory === ExecutionInteractionCategory.HUMAN_CONFIRMATION ||
        interactionCategory === ExecutionInteractionCategory.RUNTIME_FAILURE,
    }));

    return this.buildExperiencePayload({
      roleProgress,
      interactionPrompts,
      layeredLogs: {
        summary: [
          `runtime_status=${options.runtimeResult.status}`,
          `policy_outcome=${options.policyResult.policyOutcome}`,
          `root_cause=${rootCause}`,
        ],
        detailed: [
          `report_path=${options.reportPath}`,
          `replay_path=${options.replayPath}`,
          `diagnostics_trace_path=${options.diagnosticsTracePath ?? "none"}`,
        ],
      },
    });
  }

  /**
   * Resolves runtime stage status into one progress status value.
   * @param status Runtime stage status.
   * @returns Normalized progress status.
   */
  private resolveRuntimeStageProgressStatus(status: RuntimeStageStatus): ExecutionProgressStatus {
    if (status === RuntimeStageStatus.SUCCEEDED) {
      return ExecutionProgressStatus.COMPLETED;
    }
    return ExecutionProgressStatus.FAILED;
  }

  /**
   * Resolves policy outcome into progress status for policy-waiting stage.
   * @param policyOutcome Policy gate outcome.
   * @returns Normalized progress status.
   */
  private resolvePolicyProgressStatus(
    policyOutcome: ChangeRiskRequiredAction,
  ): ExecutionProgressStatus {
    if (policyOutcome === ChangeRiskRequiredAction.ALLOW) {
      return ExecutionProgressStatus.COMPLETED;
    }
    if (policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      return ExecutionProgressStatus.FAILED;
    }
    return ExecutionProgressStatus.WAITING;
  }

  /**
   * Resolves interaction category from diagnostic root-cause.
   * @param rootCause Root-cause value.
   * @returns Normalized interaction category.
   */
  private resolveInteractionCategoryFromRootCause(rootCause: string): ExecutionInteractionCategory {
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_HITL_REQUIRED) {
      return ExecutionInteractionCategory.HUMAN_CONFIRMATION;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_BLOCKED) {
      return ExecutionInteractionCategory.POLICY_WAITING;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.ENVIRONMENT_PRECONDITION) {
      return ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.PERMISSION_CONFIRMATION) {
      return ExecutionInteractionCategory.PERMISSION_CONFIRMATION;
    }
    if (rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.RUNTIME_FAILURE) {
      return ExecutionInteractionCategory.RUNTIME_FAILURE;
    }
    return ExecutionInteractionCategory.NONE;
  }

  /**
   * Resolves diagnostics root-cause for run-command execution outputs.
   * @param options Run-command result status context.
   * @returns Root-cause category.
   */
  private resolveRunDiagnosticRootCause(options: {
    policyOutcome: ChangeRiskRequiredAction;
    runtimeStatus: RuntimeExecutionStatus;
  }): string {
    if (options.policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      return CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_BLOCKED;
    }

    if (
      options.policyOutcome === ChangeRiskRequiredAction.CONFIRM ||
      options.policyOutcome === ChangeRiskRequiredAction.ESCALATE
    ) {
      return CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_HITL_REQUIRED;
    }

    if (options.runtimeStatus !== RuntimeExecutionStatus.SUCCEEDED) {
      return CLI_DIAGNOSTIC_ROOT_CAUSE.RUNTIME_FAILURE;
    }

    return CLI_DIAGNOSTIC_ROOT_CAUSE.NONE;
  }

  /**
   * Resolves operator-facing next actions by diagnostics root-cause category.
   * @param options Root-cause and execution-state context.
   * @returns Ordered next-action list.
   */
  private resolveDiagnosticNextActions(options: {
    rootCause: string;
    policyOutcome: ChangeRiskRequiredAction | null;
    runtimeStatus: RuntimeExecutionStatus | null;
  }): string[] {
    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_BLOCKED) {
      return [
        "Inspect matched policy rules and reduce high-risk changes before retrying run.",
        "Re-run with --trace and review diagnostics trace for blocked rule evidence.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.POLICY_HITL_REQUIRED) {
      return [
        "Trigger review/review-verify flow and complete required human confirmation.",
        "Use diagnostics trace to explain why policy outcome is not allow.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.RUNTIME_FAILURE) {
      return [
        "Inspect stage-level errorContext in diagnostics trace and fix runtime stage failures.",
        "Replay diagnostics with --replay <report-or-replay-path> after fixes.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.ENVIRONMENT_PRECONDITION) {
      return [
        "Run doctor/check to verify local prerequisites before rerunning the command.",
        "Compare workspace mode and memory provider diagnostics across environments.",
      ];
    }

    if (options.rootCause === CLI_DIAGNOSTIC_ROOT_CAUSE.PERMISSION_CONFIRMATION) {
      return [
        "Complete the required permission/approval workflow before continuing execution.",
        "Record confirmation evidence in review and ledger-backfill artifacts.",
      ];
    }

    const summary = [
      "Persist replay diagnostics for reproducibility and share with follow-up tasks.",
      "Keep using --trace in local debugging to preserve stage/policy attribution.",
    ];
    if (options.policyOutcome && options.runtimeStatus) {
      summary.push(
        `Current state: policy_outcome=${options.policyOutcome}, runtime_status=${options.runtimeStatus}.`,
      );
    }
    return summary;
  }

  /**
   * Resolves replay explain result from one accepted replay source payload.
   * @param options Replay source context.
   * @returns Replay explain resolution payload.
   */
  private resolveReplayExplainPayload(options: {
    replayPath: string;
    replayPayload: unknown;
    replayExplainer: ReplayExplainer;
  }): CliReplayExplainResolution {
    if (this.isExecutionReportPayload(options.replayPayload)) {
      const snapshot = options.replayExplainer.createSnapshot({
        report: options.replayPayload,
      });
      const explainResult = options.replayExplainer.explain({
        snapshot,
        limit: 10,
      });

      return {
        sourceType: CLI_RUN_REPLAY_SOURCE_TYPE.EXECUTION_REPORT,
        executionId: options.replayPayload.executionId,
        explainResult,
      };
    }

    if (this.isReplayExplainPayload(options.replayPayload)) {
      return {
        sourceType: CLI_RUN_REPLAY_SOURCE_TYPE.REPLAY_EXPLAIN,
        executionId: options.replayPayload.executionId,
        explainResult: options.replayPayload,
      };
    }

    throw new RuntimeError(
      GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID,
      `Replay source payload is unsupported: ${options.replayPath}.`,
      {
        replayPath: options.replayPath,
      },
    );
  }

  /**
   * Determines whether one payload matches execution report shape.
   * @param payload Replay source payload candidate.
   * @returns True when payload can be treated as execution report.
   */
  private isExecutionReportPayload(payload: unknown): payload is ExecutionReport {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.executionId === "string" &&
      Array.isArray(candidate.stageSummaries) &&
      Array.isArray(candidate.replayPointers) &&
      typeof candidate.generatedAt === "string"
    );
  }

  /**
   * Determines whether one payload matches replay-explain result shape.
   * @param payload Replay source payload candidate.
   * @returns True when payload can be treated as replay-explain result.
   */
  private isReplayExplainPayload(payload: unknown): payload is ReplayExplainResult {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.executionId === "string" &&
      typeof candidate.matchedCount === "number" &&
      Array.isArray(candidate.pointers) &&
      Array.isArray(candidate.explainLines) &&
      candidate.query !== null &&
      typeof candidate.query === "object"
    );
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
