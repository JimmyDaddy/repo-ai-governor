import { execFile } from 'node:child_process';
import { constants as FsConstants, existsSync } from 'node:fs';
import { access, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { AgentCapability, AgentNetworkMode, AgentRouteRunner } from '@repo-ai-governor/adapter-sdk';
import { type AdaptersConfig, SchemaValidator } from '@repo-ai-governor/config';
import { AgentSessionRegistry } from '@repo-ai-governor/core-agent-projection';
import {
  ChangeRiskEvaluator,
  ChangeRiskFileCategory,
  type ChangeRiskFileCategoryValue,
  ChangeRiskRequiredAction,
} from '@repo-ai-governor/core-change-risk';
import { MemoryManager, MemoryScope } from '@repo-ai-governor/core-memory';
import {
  MemoryContextAssembler,
  type MemoryPromotionResult,
  MemoryPromotionService,
  MemoryRecallService,
} from '@repo-ai-governor/core-memory-semantics';
import { PolicyGateEngine } from '@repo-ai-governor/core-policy';
import { ProcessCompiler, type ProcessIrNode } from '@repo-ai-governor/core-process';
import {
  ProcessRuntimeEngine,
  ProcessRuntimeFacade,
  type RuntimeExecutionResult,
  RuntimeExecutionStatus,
  type RuntimeStageContext,
  type RuntimeStageInputMap,
  RuntimeStageStatus,
  RuntimeTimeoutScope,
} from '@repo-ai-governor/core-runtime';
import {
  CompiledIrGraphAdapter,
  LangGraphAgentDescriptorSupervisor,
  LangGraphRuntimeBackend,
} from '@repo-ai-governor/core-runtime-langgraph';
import {
  AuditOutputMode,
  AuditRecordStatus,
  AuditRecorder,
  SessionStatus,
  SharedSessionManager,
} from '@repo-ai-governor/core-session';
import { MemoryStoreAdapter } from '@repo-ai-governor/memory-store-adapter';
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
} from '@repo-ai-governor/orchestration-service-client';
import { ReportBuilder } from '@repo-ai-governor/reporting';
import {
  AdapterAvailability,
  AdapterSurface,
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  ErrorOutputEnvironment,
  ExecutionProgressStage,
  GovernorErrorCode,
  RuntimeError,
  WorkspaceMigrationPolicy,
} from '@repo-ai-governor/shared';
import { CliCheckCommand } from './commands/check-command.js';
import { CliCommandRegistry } from './commands/cli-command-registry.js';
import { CliConnectCommand } from './commands/connect-command.js';
import { CliDoctorCommand } from './commands/doctor-command.js';
import { CliInitCommand } from './commands/init-command.js';
import { CliPlanCommand } from './commands/plan-command.js';
import { CliReviewCommand } from './commands/review-command.js';
import { CliReviewVerifyCommand } from './commands/review-verify-command.js';
import { CliRunCommand } from './commands/run-command.js';
import { CliUpgradeCommand } from './commands/upgrade-command.js';
import { CliVerifyCommand } from './commands/verify-command.js';
import { CliWorkflowCommand } from './commands/workflow-command.js';
import { CliWorkspaceCommand } from './commands/workspace-command.js';
import { CliAgentOnboardingPreset } from './constants/cli-agent-onboarding.constant.js';
import { CliCommandName } from './constants/cli-command.constant.js';
import { CliConnectAction, CliConnectWriteMode } from './constants/cli-connect.constant.js';
import {
  CLI_CHANGE_RISK_FILE_CATEGORY_PATTERNS,
  CLI_DIAGNOSTIC_ROOT_CAUSE,
  CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS,
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
} from './constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from './constants/cli-interactive-shell.constant.js';
import { DEFAULT_CLI_REACT_THEME_PRESET } from './constants/cli-react-theme.constant.js';
import {
  CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS,
  CliDeliveryRehearsalAction,
  CliDeliveryRehearsalSkipReason,
  CliDeliveryRehearsalStatus,
  CliHitlResumeAction,
  CliInlineReviewChainSkipReason,
  CliInlineReviewChainStatus,
} from './constants/cli-task-driven-run.constant.js';
import { CliWorkspaceAction, CliWorkspaceThemeScope } from './constants/cli-workspace.constant.js';
import { CliAdapterDiagnosticsRuntime } from './runtime/adapter-diagnostics-runtime.js';
import { CliAdapterRoutingRuntime } from './runtime/adapter-routing-runtime.js';
import { CliAdapterVerificationRuntime } from './runtime/adapter-verification-runtime.js';
import { CliAgentOnboardingRuntime } from './runtime/agent-onboarding-runtime.js';
import { CliAgentProjectionRuntime } from './runtime/agent-projection-runtime.js';
import { CliReviewQueueRuntime } from './runtime/artifacts/review-queue-runtime.js';
import { CliRuntimeArtifactWriter } from './runtime/artifacts/runtime-artifact-writer.js';
import { CliDeliveryRehearsalRuntime } from './runtime/delivery-rehearsal-runtime.js';
import { CliHitlRuntime } from './runtime/hitl-runtime.js';
import { CliLocalModelProbeRuntime } from './runtime/local-model-probe-runtime.js';
import { CliOrchestrationServiceRuntime } from './runtime/orchestration-service-runtime.js';
import { CliCommandExperienceBuilder } from './runtime/presentation/command-experience-builder.js';
import { CliReplayExplainBuilder } from './runtime/presentation/replay-explain-builder.js';
import { CliTaskDrivenRunRuntime } from './runtime/task-driven-run-runtime.js';
import type {
  CliAdapterVerificationResolution,
  CliCheckTotals,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliExecutionStreamMetadata,
  CliGovernanceCommandExecutionOptions,
  CliGovernanceCommandResult,
  CliGovernanceRuntimeOptions,
  CliNormalizedRuntimeDebugOptions,
  CliTaskDrivenRunAssembly,
} from './types/index.js';

const execFileAsync = promisify(execFile);

interface CliLangGraphCheckpointState {
  checkpointPath: string | null;
  checkpointSource: string | null;
  recoveryState: 'not_requested' | 'recovered';
  recoveredNextNodeIds: string[];
  pendingInterruptKind: string | null;
}

/**
 * Implements Stage-9 CLI command semantics with a minimal governance execution chain.
 *
 * Why this exists:
 * command runtime behavior must be centralized so `init/connect/doctor/check/run/review/review-verify/verify/plan/upgrade/workspace/workflow`
 * stay deterministic across CLI entrypoints and output modes.
 */
export class CliGovernanceRuntime {
  private readonly commandRegistry: CliCommandRegistry;
  private readonly schemaValidator: SchemaValidator;
  private readonly memoryManager: MemoryManager;
  private readonly sharedSessionManager: SharedSessionManager;
  private readonly localModelProbeRuntime: CliLocalModelProbeRuntime;
  private readonly onboardingRuntime: CliAgentOnboardingRuntime;
  private readonly agentProjectionRuntime: CliAgentProjectionRuntime;
  private readonly agentSessionRegistry: AgentSessionRegistry;
  private readonly langGraphAgentDescriptorSupervisor: LangGraphAgentDescriptorSupervisor;
  private readonly adapterRoutingRuntime: CliAdapterRoutingRuntime;
  private readonly adapterVerificationRuntime: CliAdapterVerificationRuntime;
  private readonly adapterDiagnosticsRuntime: CliAdapterDiagnosticsRuntime;
  private readonly artifactWriter: CliRuntimeArtifactWriter;
  private readonly reviewQueueRuntime: CliReviewQueueRuntime;
  private readonly orchestrationServiceRuntime: CliOrchestrationServiceRuntime;
  private readonly deliveryRehearsalRuntime: CliDeliveryRehearsalRuntime;
  private readonly hitlRuntime: CliHitlRuntime;
  private readonly commandExperienceBuilder: CliCommandExperienceBuilder;
  private readonly replayExplainBuilder: CliReplayExplainBuilder;
  private readonly taskDrivenRunRuntime: CliTaskDrivenRunRuntime;

  public constructor(private readonly options: CliGovernanceRuntimeOptions) {
    this.schemaValidator = new SchemaValidator();
    this.memoryManager = new MemoryManager(
      new MemoryStoreAdapter(this.options.memoryStoreProvider),
    );
    this.sharedSessionManager = new SharedSessionManager(this.memoryManager);
    this.onboardingRuntime = new CliAgentOnboardingRuntime();
    this.agentProjectionRuntime = new CliAgentProjectionRuntime();
    this.agentSessionRegistry = new AgentSessionRegistry(this.sharedSessionManager);
    this.langGraphAgentDescriptorSupervisor = new LangGraphAgentDescriptorSupervisor();
    this.localModelProbeRuntime = new CliLocalModelProbeRuntime(
      this.options.adapterLocalProbeOverrides,
      this.options.commandProbeExecutor,
      (error) => this.formatExecFailureDetail(error),
    );
    this.adapterRoutingRuntime = new CliAdapterRoutingRuntime(this.options.adaptersConfig, {
      claudeCodeExecRunner: this.options.claudeCodeExecRunner,
      codexExecRunner: this.options.codexExecRunner,
      githubCopilotExecRunner: this.options.githubCopilotExecRunner,
    });
    this.adapterVerificationRuntime = new CliAdapterVerificationRuntime(
      this.options.adaptersConfig,
      (key, interpolation) => this.options.translate?.(key, interpolation) ?? key,
      (error) => this.formatExecFailureDetail(error),
      this.adapterRoutingRuntime,
      this.localModelProbeRuntime,
    );
    this.adapterDiagnosticsRuntime = new CliAdapterDiagnosticsRuntime(
      (key, interpolation) => this.options.translate?.(key, interpolation) ?? key,
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
    this.orchestrationServiceRuntime = new CliOrchestrationServiceRuntime(
      this.options.workspace.workspaceRoot,
      this.options.orchestrationServiceRuntimeDependencies,
    );
    this.deliveryRehearsalRuntime = new CliDeliveryRehearsalRuntime({
      workspace: this.options.workspace,
      artifactWriter: this.artifactWriter,
      toRfc3339SecondsTimestamp: (value: Date) => this.toRfc3339SecondsTimestamp(value),
    });
    this.hitlRuntime = new CliHitlRuntime({
      workspace: this.options.workspace,
      artifactWriter: this.artifactWriter,
      toRfc3339SecondsTimestamp: (value: Date) => this.toRfc3339SecondsTimestamp(value),
      toDisplayTimestamp: (value: string) => this.toDisplayTimestamp(value),
      notificationProviders: this.options.notificationProviders,
      notificationPolicyMatrix: this.options.notificationPolicyMatrix,
    });
    this.commandExperienceBuilder = new CliCommandExperienceBuilder();
    this.replayExplainBuilder = new CliReplayExplainBuilder();
    this.taskDrivenRunRuntime = new CliTaskDrivenRunRuntime(
      this.options.workspace.workspaceRoot,
      new MemoryRecallService(this.memoryManager),
      new MemoryContextAssembler(),
    );
    this.commandRegistry = new CliCommandRegistry([
      new CliInitCommand(),
      new CliConnectCommand(),
      new CliDoctorCommand(),
      new CliCheckCommand(),
      new CliVerifyCommand(),
      new CliPlanCommand(),
      new CliRunCommand(),
      new CliReviewCommand(),
      new CliReviewVerifyCommand(),
      new CliUpgradeCommand(),
      new CliWorkspaceCommand(),
      new CliWorkflowCommand(),
    ]);
  }

  /**
   * Executes one CLI command with deterministic runtime semantics.
   * @param commandName Command name selected by CLI parser.
   * @returns Command result message and structured output payload.
   */
  public async execute(
    commandName: CliCommandName,
    executionOptions?: CliGovernanceCommandExecutionOptions,
  ): Promise<CliGovernanceCommandResult> {
    if (commandName !== CliCommandName.INIT && this.shouldEnsureWorkspaceBootstrap(commandName)) {
      await this.ensureWorkspaceBootstrap();
    }

    const extractedCommandExecutor = this.commandRegistry.resolve(commandName);
    if (extractedCommandExecutor) {
      return extractedCommandExecutor.execute(
        this.createCommandExecutorContext(undefined, executionOptions),
      );
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
   * Resolves whether the current command still needs workspace auto-bootstrap.
   * @param commandName Parsed CLI command name.
   * @returns True when baseline workspace files should be auto-created before execution.
   */
  private shouldEnsureWorkspaceBootstrap(commandName: CliCommandName): boolean {
    if (commandName !== CliCommandName.WORKSPACE) {
      return true;
    }

    const workspaceAction = this.options.workspaceCommandOptions?.action?.trim().toLowerCase();
    if (workspaceAction === CliWorkspaceAction.CLEAR_CONFIG) {
      return false;
    }

    const themeScope = this.options.workspaceCommandOptions?.themeScope?.trim().toLowerCase();
    return !(
      workspaceAction === CliWorkspaceAction.SET_UI_THEME &&
      themeScope === CliWorkspaceThemeScope.GLOBAL
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
   * @param runtimeDebugOptionsOverride Optional normalized debug-option override for nested flows.
   * @returns Command executor context.
   */
  private createCommandExecutorContext(
    runtimeDebugOptionsOverride?: CliNormalizedRuntimeDebugOptions,
    executionOptions?: CliGovernanceCommandExecutionOptions,
  ) {
    const runtimeTranslate = this.options.translate;
    return {
      options: this.options,
      progressSink: executionOptions?.progressSink,
      abortSignal: executionOptions?.abortSignal,
      artifactWriter: this.artifactWriter,
      onboardingRuntime: this.onboardingRuntime,
      agentProjectionRuntime: this.agentProjectionRuntime,
      adapterDiagnosticsRuntime: this.adapterDiagnosticsRuntime,
      reviewQueueRuntime: this.reviewQueueRuntime,
      orchestrationServiceRuntime: this.orchestrationServiceRuntime,
      commandExperienceBuilder: this.commandExperienceBuilder,
      executeRunCommand: async () => this.executeRunCommand(),
      calculateCheckTotals: (checks: CliCommandResultCheck[]) => this.calculateCheckTotals(checks),
      buildDefaultConfigContent: () => this.buildDefaultConfigContent(),
      toRfc3339SecondsTimestamp: (value: Date) => this.toRfc3339SecondsTimestamp(value),
      formatExecFailureDetail: (error: unknown) => this.formatExecFailureDetail(error),
      resolveRuntimeDebugOptions: () =>
        runtimeDebugOptionsOverride ?? this.resolveRuntimeDebugOptions(),
      resolveExecutionStreamMetadata: async () => this.resolveExecutionStreamMetadata(),
      resolveAdapterVerification: async (abortSignal?: AbortSignal) =>
        this.resolveAdapterVerification(abortSignal),
      resolveAdapterVerificationForConfig: async (
        adaptersConfig: AdaptersConfig,
        abortSignal?: AbortSignal,
      ) => this.resolveAdapterVerificationForConfig(adaptersConfig, abortSignal),
      validateGovernorConfig: (candidate: unknown) =>
        this.schemaValidator.validateOrThrow(candidate),
      canWritePath: async (filePath: string) => this.canWritePath(filePath),
      localizeText: (english: string, _chinese: string) => english,
      translate: (key: string, interpolation?: Record<string, string>) =>
        runtimeTranslate?.(key, interpolation) ?? key,
      runNodeScript: async (scriptPath: string, args: string[] = []) =>
        execFileAsync(process.execPath, [scriptPath, ...args], {
          cwd: this.options.currentWorkingDirectory,
          maxBuffer: 5 * 1024 * 1024,
          encoding: 'utf8',
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
    const executionSessionId = `session-${executionId}`;
    const sharedSessionId = `shared-${executionId}`;
    const processCompiler = new ProcessCompiler();
    const processRuntimeEngine = new ProcessRuntimeEngine(processCompiler);
    const langGraphRuntimeBackend = new LangGraphRuntimeBackend();
    const processRuntimeFacade = new ProcessRuntimeFacade({
      legacyRuntimeEngine: processRuntimeEngine,
      langgraphRuntimeBackend: langGraphRuntimeBackend,
    });
    const streamMetadata = await this.resolveExecutionStreamMetadata();
    const runAssembly = await this.taskDrivenRunRuntime.buildRunAssembly({
      executionId,
      taskId: runtimeDebugOptions.taskId,
      adaptersConfig: this.options.adaptersConfig,
      streamMetadata,
    });
    const processDefinition = runAssembly.processDefinition;
    const compiledIr = processCompiler.compile(processDefinition);
    const orchestrationService = this.orchestrationServiceRuntime;

    if (compiledIr.compileErrors.length > 0) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_IR_CONTAINS_COMPILE_ERRORS,
        'Run command failed because compile errors are present in generated process IR.',
        {
          executionId,
          compileErrorCount: compiledIr.compileErrors.length,
        },
      );
    }

    const agentDescriptors = this.agentProjectionRuntime.createDescriptorsFromProcessNodes({
      nodes: compiledIr.nodes,
      adaptersConfig: this.options.adaptersConfig,
      workspace: this.options.workspace,
      executionId,
      sessionId: sharedSessionId,
    });
    const graphPlan = new CompiledIrGraphAdapter().adapt(compiledIr);
    const langGraphSupervisorPlan = this.langGraphAgentDescriptorSupervisor.createPlan({
      graphPlan,
      agentDescriptors,
    });
    const langGraphSupervisorPath = resolve(
      this.options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'run',
      'agent-supervisor',
      `${executionId}.json`,
    );
    await this.artifactWriter.writeJsonArtifact(langGraphSupervisorPath, langGraphSupervisorPlan);
    await this.sharedSessionManager.openSession({
      sessionId: sharedSessionId,
      executionId,
      processId: compiledIr.processId,
      initialContext: {
        workspace_id: this.options.workspace.workspaceId,
        process_id: compiledIr.processId,
        task_id: runAssembly.taskContext?.taskId ?? runtimeDebugOptions.taskId ?? null,
        agent_ids: agentDescriptors.map((descriptor) => descriptor.agentId),
      },
    });
    await this.sharedSessionManager.appendEvent({
      sessionId: sharedSessionId,
      type: 'execution.started',
      payload: {
        executionId,
        processId: compiledIr.processId,
        agentDescriptorCount: agentDescriptors.length,
      },
    });

    const orchestrationExecution = await orchestrationService.startExecution(
      {
        workspaceId: this.options.workspace.workspaceId,
        workspaceRoot: this.options.workspace.workspaceRoot,
        executionKind: OrchestrationExecutionKind.RUN,
        clientSurface: OrchestrationClientSurface.CLI,
        locale: this.options.locale,
        outputMode: this.options.outputMode,
        ...(runAssembly.taskContext?.taskId
          ? { taskId: runAssembly.taskContext.taskId }
          : runtimeDebugOptions.taskId
            ? { taskId: runtimeDebugOptions.taskId }
            : {}),
        ...streamMetadata,
      },
      {
        executionId,
        executionSessionId,
        processId: compiledIr.processId,
      },
    );

    const compiledIrSnapshotPath = processCompiler.persistCompiledIrSnapshot(
      this.options.workspace.workspaceRoot,
      compiledIr,
    );
    const changedPaths = await this.collectGitChangedPaths();
    const { riskEvaluation, policyResult } = this.evaluateRunRiskAndPolicy(
      changedPaths,
      executionId,
    );
    const hitlPreview = this.hitlRuntime.previewRunHitl({
      policyResult,
      runtimeDebugOptions,
    });
    const effectivePolicyOutcome = hitlPreview.effectivePolicyOutcome;
    const nodeById = new Map<string, ProcessIrNode>(
      compiledIr.nodes.map((node) => [node.nodeId, node] as const),
    );
    const routeRunner = this.createRunRouteRunner(compiledIr.nodes, {
      includeLocalModelFallbackCandidate: !runtimeDebugOptions.restrictedNetwork,
    });
    const runtimeExecution = await processRuntimeFacade.execute(
      compiledIr,
      async (stageContext) =>
        this.isInlineReviewSubchainStage(stageContext.stageId)
          ? this.dispatchInlineReviewSubchainStage(stageContext, runtimeDebugOptions, {
              effectivePolicyOutcome,
              riskLevel: riskEvaluation.riskLevel,
            })
          : this.isDeliveryRehearsalStage(stageContext.stageId)
            ? this.dispatchDeliveryRehearsalStage(
                executionId,
                stageContext,
                runtimeDebugOptions,
                {
                  effectivePolicyOutcome,
                  riskLevel: riskEvaluation.riskLevel,
                },
                streamMetadata,
              )
            : {
                ...(await this.dispatchRunStageWithAdapterRoute(
                  routeRunner,
                  stageContext,
                  runtimeDebugOptions,
                )),
              },
      {
        stageInputs: runAssembly.stageInputs as RuntimeStageInputMap,
      },
    );
    const runtimeResult = runtimeExecution.runtimeResult;

    const auditRecorder = new AuditRecorder(this.memoryManager);

    for (const stageResult of runtimeResult.stageResults) {
      const node = nodeById.get(stageResult.nodeId);
      const recordedAt = stageResult.endedAt;
      const stageOutput = this.resolveStageOutputRecord(stageResult.output);
      const stageArtifactId = this.readStageOutputString(stageOutput, 'artifactId');
      await orchestrationService.publishEvent({
        executionId,
        type: OrchestrationServiceEventType.STAGE_COMPLETED,
        status: this.resolveOrchestrationStageStatus(stageResult.status),
        stageId: stageResult.stageId,
        ...(stageArtifactId ? { artifactId: stageArtifactId } : {}),
        message: `Stage "${stageResult.stageId}" completed with status=${stageResult.status}.`,
      });
      await auditRecorder.recordEvent({
        recordId: `${executionId}-${stageResult.nodeId}-${stageResult.attempt}`,
        recordedAt,
        event: {
          executionId,
          stageId: stageResult.stageId,
          routeKey: node?.routeKey ?? `route.${stageResult.nodeId}`,
          surface: 'cli',
          agentRole: 'governor_runtime',
          roleProfileId: node?.roleProfileId ?? 'role.default.runtime',
          roleSource: 'default',
          policyOutcome: effectivePolicyOutcome,
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
          ...(runAssembly.taskContext?.taskId
            ? { consumerTaskId: runAssembly.taskContext.taskId }
            : {}),
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
          ...(stageArtifactId ? { artifactId: stageArtifactId } : {}),
          ...(stageResult.errorMessage ? { error: stageResult.errorMessage } : {}),
        },
      });
    }

    await auditRecorder.recordEvent({
      recordId: `${executionId}-policy`,
      recordedAt: this.toRfc3339SecondsTimestamp(new Date()),
      event: {
        executionId,
        stageId: 'stage-policy-gate',
        routeKey: 'policy.gate.cli.run',
        surface: 'cli',
        agentRole: 'governor_runtime',
        roleProfileId: 'role.default.runtime',
        roleSource: 'default',
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
        ...(runAssembly.taskContext?.taskId
          ? { consumerTaskId: runAssembly.taskContext.taskId }
          : {}),
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

    const hitlResolution = await this.hitlRuntime.processRunHitl({
      executionId,
      executionSessionId,
      policyResult,
      runtimeDebugOptions,
      preview: hitlPreview,
      auditRecorder,
      outputMode: this.resolveAuditOutputMode(this.options.outputMode),
      outputLocale: this.options.locale,
      isTty: this.options.isTty,
      consumerTaskId: runAssembly.taskContext?.taskId,
      projectId: streamMetadata.projectId,
      sprintId: streamMetadata.sprintId,
    });
    const resolvedPolicyOutcome = hitlResolution.effectivePolicyOutcome;
    if (hitlResolution.required) {
      await orchestrationService.publishEvent({
        executionId,
        type: OrchestrationServiceEventType.HITL_REQUIRED,
        status: OrchestrationExecutionStatus.HITL_REQUIRED,
        message: `HITL decision is required with outcome=${resolvedPolicyOutcome}.`,
      });
      if (
        hitlResolution.decision &&
        hitlResolution.resumeAction &&
        hitlResolution.decisionReceiptPath &&
        !runtimeDebugOptions.dryRun
      ) {
        await orchestrationService.submitHitlDecision({
          executionId,
          executionSessionId,
          decision: hitlResolution.decision,
          resumeAction: hitlResolution.resumeAction,
          actor: runtimeDebugOptions.hitlDecidedBy ?? 'cli-runtime',
          ...(runtimeDebugOptions.hitlDecisionReason
            ? { reason: runtimeDebugOptions.hitlDecisionReason }
            : {}),
          ...(runtimeDebugOptions.hitlConstraints.length > 0
            ? {
                constraints: {
                  values: [...runtimeDebugOptions.hitlConstraints],
                },
              }
            : {}),
          decisionReceiptArtifactPath: hitlResolution.decisionReceiptPath,
        });
      }
    }

    const memoryPromotionResult =
      runAssembly.memoryContext && runAssembly.taskContext
        ? await new MemoryPromotionService(this.memoryManager).promote({
            contextSummary: runAssembly.memoryContext.contractSafeSummary,
            sessionId: executionSessionId,
            persist: !runtimeDebugOptions.dryRun,
            promotedBy: 'cli-governance-runtime',
          })
        : null;

    await this.sharedSessionManager.updateContext({
      sessionId: sharedSessionId,
      contextPatch: {
        runtime_status: runtimeResult.status,
        policy_outcome: resolvedPolicyOutcome,
        visited_node_ids: runtimeResult.visitedNodeIds,
      },
    });
    await this.sharedSessionManager.appendEvent({
      sessionId: sharedSessionId,
      type: 'execution.completed',
      payload: {
        runtimeStatus: runtimeResult.status,
        policyOutcome: resolvedPolicyOutcome,
        stageResultCount: runtimeResult.stageResults.length,
      },
    });
    if (!hitlResolution.awaitingDecision) {
      await this.sharedSessionManager.finalizeSession({
        sessionId: sharedSessionId,
        status:
          runtimeResult.status === RuntimeExecutionStatus.SUCCEEDED
            ? SessionStatus.COMPLETED
            : runtimeResult.status === RuntimeExecutionStatus.CANCELLED
              ? SessionStatus.CANCELLED
              : SessionStatus.FAILED,
      });
    }
    const agentView = this.agentProjectionRuntime.createCliAgentView({
      descriptors: agentDescriptors,
      sessionProjection: await this.agentSessionRegistry.project({
        sessionId: sharedSessionId,
        descriptors: agentDescriptors,
      }),
    });

    const reportBuilder = new ReportBuilder(auditRecorder);
    const executionReport = await reportBuilder.buildExecutionReport({
      executionId,
      includeRecords: false,
      agentView,
      memorySemantics: this.createExecutionReportMemorySemanticsSummary(
        runAssembly,
        memoryPromotionResult,
      ),
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
    const inlineReviewChainSummary = this.resolveInlineReviewChainSummary(runtimeResult);
    const deliveryRehearsalSummary = this.resolveDeliveryRehearsalSummary(runtimeResult);

    const artifacts: CliCommandResultArtifact[] = [
      {
        id: 'compiled_ir_snapshot',
        path: compiledIrSnapshotPath,
      },
      {
        id: 'langgraph_supervisor',
        path: langGraphSupervisorPath,
      },
      {
        id: 'execution_report',
        path: reportPath,
      },
      {
        id: 'replay_explain',
        path: replayPath,
      },
    ];
    if (inlineReviewChainSummary.reviewRequestPath) {
      artifacts.push({
        id: 'inline_review_request',
        path: inlineReviewChainSummary.reviewRequestPath,
      });
    }
    if (inlineReviewChainSummary.reviewVerifyPath) {
      artifacts.push({
        id: 'inline_review_verify_result',
        path: inlineReviewChainSummary.reviewVerifyPath,
      });
    }
    if (inlineReviewChainSummary.ledgerBackfillPath) {
      artifacts.push({
        id: 'inline_review_ledger_backfill',
        path: inlineReviewChainSummary.ledgerBackfillPath,
      });
    }
    if (deliveryRehearsalSummary.rehearsalPath) {
      artifacts.push({
        id: 'delivery_rehearsal',
        path: deliveryRehearsalSummary.rehearsalPath,
      });
    }
    if (hitlResolution.notificationArtifactPath) {
      artifacts.push({
        id: 'hitl_notification',
        path: hitlResolution.notificationArtifactPath,
      });
    }
    if (hitlResolution.decisionReceiptPath) {
      artifacts.push({
        id: 'hitl_decision_receipt',
        path: hitlResolution.decisionReceiptPath,
      });
    }
    const langGraphCheckpointState = await this.captureLangGraphCheckpointState({
      orchestrationService,
      compiledIr,
      runtimeExecution,
      runtimeResult,
      executionSessionId,
      taskId: runAssembly.taskContext?.taskId ?? runtimeDebugOptions.taskId ?? undefined,
      artifactReferenceIds: artifacts.map((artifact) => artifact.id),
      hitlResolution,
      policyResult,
    });
    if (langGraphCheckpointState.checkpointPath) {
      artifacts.push({
        id: 'langgraph_checkpoint',
        path: langGraphCheckpointState.checkpointPath,
      });
    }
    for (const artifact of artifacts) {
      await orchestrationService.publishEvent({
        executionId,
        type: OrchestrationServiceEventType.ARTIFACT_READY,
        status: hitlResolution.awaitingDecision
          ? OrchestrationExecutionStatus.HITL_REQUIRED
          : this.resolveOrchestrationExecutionStatus(runtimeResult.status),
        artifactId: artifact.id,
        message: `Artifact "${artifact.id}" is ready.`,
      });
    }
    const checks: CliCommandResultCheck[] = [
      this.createRunAssemblyCheck(runAssembly, runtimeDebugOptions.taskId),
      this.createMemoryPolicyCheck(runAssembly),
      {
        id: 'runtime_backend',
        status: CliGovernanceCheckStatus.PASS,
        detail: `primary=${runtimeExecution.selection.primaryBackend} comparison=${runtimeExecution.selection.comparisonBackend ?? 'none'} parity_mode=${runtimeExecution.selection.parityMode}`,
      },
      {
        id: 'compile',
        status: CliGovernanceCheckStatus.PASS,
        detail: `warnings=${compiledIr.compileWarnings.length} errors=${compiledIr.compileErrors.length}`,
      },
      {
        id: 'runtime',
        status:
          runtimeResult.status === RuntimeExecutionStatus.SUCCEEDED
            ? CliGovernanceCheckStatus.PASS
            : CliGovernanceCheckStatus.WARN,
        detail: `status=${runtimeResult.status} stages=${runtimeResult.stageResults.length}`,
      },
      {
        id: 'policy',
        status: this.resolvePolicyCheckStatus(resolvedPolicyOutcome),
        detail: `outcome=${resolvedPolicyOutcome} matched_rules=${policyResult.matchedRuleIds.length}`,
      },
      {
        id: 'report',
        status: CliGovernanceCheckStatus.PASS,
        detail: `records=${executionReport.totalRecords} stage_summaries=${executionReport.stageSummaries.length}`,
      },
      {
        id: 'agent_projection',
        status: CliGovernanceCheckStatus.PASS,
        detail: `descriptors=${agentDescriptors.length} session_status=${agentView.sessionProjection?.sessionStatus ?? 'none'} supervisor=${langGraphSupervisorPath}`,
      },
    ];
    if (langGraphCheckpointState.checkpointPath) {
      checks.push({
        id: 'recovery',
        status: CliGovernanceCheckStatus.PASS,
        detail: `source=${langGraphCheckpointState.checkpointSource ?? 'unknown'} state=${langGraphCheckpointState.recoveryState} next_nodes=${langGraphCheckpointState.recoveredNextNodeIds.join('|') || 'none'} pending_interrupt=${langGraphCheckpointState.pendingInterruptKind ?? 'none'}`,
      });
    }
    if (hitlResolution.required) {
      checks.push({
        id: 'hitl',
        status:
          resolvedPolicyOutcome === ChangeRiskRequiredAction.ALLOW
            ? CliGovernanceCheckStatus.PASS
            : hitlResolution.awaitingDecision
              ? CliGovernanceCheckStatus.WARN
              : CliGovernanceCheckStatus.FAIL,
        detail: `notification=${hitlResolution.notificationResult?.dispatchStatus ?? 'none'} decision=${hitlResolution.decision ?? 'pending'} resume_action=${hitlResolution.resumeAction ?? 'none'} effective_outcome=${resolvedPolicyOutcome}`,
      });
    }
    if (inlineReviewChainSummary.enabled) {
      checks.push({
        id: 'review_chain',
        status:
          inlineReviewChainSummary.status === CliInlineReviewChainStatus.APPLIED
            ? CliGovernanceCheckStatus.PASS
            : inlineReviewChainSummary.status === CliInlineReviewChainStatus.FAILED
              ? CliGovernanceCheckStatus.FAIL
              : CliGovernanceCheckStatus.WARN,
        detail: `status=${inlineReviewChainSummary.status} skip_reason=${inlineReviewChainSummary.skipReason ?? 'none'} request=${inlineReviewChainSummary.reviewRequestPath ? 'present' : 'missing'} verify=${inlineReviewChainSummary.reviewVerifyPath ? 'present' : 'missing'} ledger_backfill=${inlineReviewChainSummary.ledgerBackfillPath ? 'present' : 'missing'}`,
      });
    }
    if (deliveryRehearsalSummary.enabled) {
      checks.push({
        id: 'delivery_rehearsal',
        status:
          deliveryRehearsalSummary.status === CliDeliveryRehearsalStatus.APPLIED
            ? CliGovernanceCheckStatus.PASS
            : deliveryRehearsalSummary.status === CliDeliveryRehearsalStatus.FAILED
              ? CliGovernanceCheckStatus.FAIL
              : CliGovernanceCheckStatus.WARN,
        detail: `status=${deliveryRehearsalSummary.status} action=${deliveryRehearsalSummary.rehearsalAction ?? 'none'} skip_reason=${deliveryRehearsalSummary.skipReason ?? 'none'} artifact=${deliveryRehearsalSummary.rehearsalPath ? 'present' : 'missing'}`,
      });
    }
    if (runtimeDebugOptions.dryRun || runtimeDebugOptions.trace) {
      checks.push({
        id: 'debug_mode',
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
              policyOutcome: resolvedPolicyOutcome,
              runtimeStatus: runtimeResult.status,
            }),
            nextActions: this.commandExperienceBuilder.resolveDiagnosticNextActions({
              rootCause: this.commandExperienceBuilder.resolveRunDiagnosticRootCause({
                policyOutcome: resolvedPolicyOutcome,
                runtimeStatus: runtimeResult.status,
              }),
              policyOutcome: resolvedPolicyOutcome,
              runtimeStatus: runtimeResult.status,
            }),
          })
        : null;

    if (diagnosticsTracePath) {
      artifacts.push({
        id: 'diagnostics_trace',
        path: diagnosticsTracePath,
      });
    }

    const checkTotals = this.calculateCheckTotals(checks);
    const experience = this.commandExperienceBuilder.createRunCommandExperience({
      executionId,
      runtimeResult,
      policyResult: {
        ...policyResult,
        policyOutcome: resolvedPolicyOutcome,
      },
      reportPath,
      replayPath,
      diagnosticsTracePath,
      reviewChain: inlineReviewChainSummary,
      deliveryRehearsal: deliveryRehearsalSummary,
      memoryPolicy: runAssembly.memoryContext
        ? {
            overallAction: runAssembly.memoryContext.policySummary.overallAction,
            warningRecordCount: runAssembly.memoryContext.policySummary.warningRecordCount,
            redactedRecordCount: runAssembly.memoryContext.policySummary.redactedRecordCount,
            blockedRecordCount: runAssembly.memoryContext.policySummary.blockedRecordCount,
          }
        : null,
      memoryPromotion: memoryPromotionResult
        ? {
            outcome: memoryPromotionResult.outcome,
            plannedMergeCount: memoryPromotionResult.summary.plannedMergeCount,
            mergedCount: memoryPromotionResult.summary.mergedCount,
            sessionSummaryProjectionKey: memoryPromotionResult.persistedRecord?.key ?? null,
          }
        : null,
    });
    if (resolvedPolicyOutcome !== ChangeRiskRequiredAction.ALLOW) {
      await orchestrationService.publishEvent({
        executionId,
        type: OrchestrationServiceEventType.EXECUTION_INTERRUPTED,
        status: hitlResolution.awaitingDecision
          ? OrchestrationExecutionStatus.HITL_REQUIRED
          : OrchestrationExecutionStatus.INTERRUPTED,
        message: `Execution paused by policy outcome=${resolvedPolicyOutcome}.`,
      });
    }
    this.throwForNonAllowPolicyOutcome({
      executionId,
      policyOutcome: resolvedPolicyOutcome,
      matchedRuleIds: policyResult.matchedRuleIds,
      reportPath,
      replayPath,
      checkTotals,
      hitlNotificationPath: hitlResolution.notificationArtifactPath,
      hitlDecisionReceiptPath: hitlResolution.decisionReceiptPath,
      hitlResumeAction: hitlResolution.resumeAction,
      awaitingDecision: hitlResolution.awaitingDecision,
      terminalDecision: hitlResolution.terminalDecision,
      runtimeBackend: runtimeExecution.selection.primaryBackend,
      runtimeCheckpointPath: langGraphCheckpointState.checkpointPath,
      runtimeRecoveryState: langGraphCheckpointState.recoveryState,
    });
    await orchestrationService.publishEvent({
      executionId,
      type:
        runtimeResult.status === RuntimeExecutionStatus.SUCCEEDED
          ? OrchestrationServiceEventType.EXECUTION_COMPLETED
          : OrchestrationServiceEventType.EXECUTION_FAILED,
      status: this.resolveOrchestrationExecutionStatus(runtimeResult.status),
      message: `Execution completed with runtime_status=${runtimeResult.status}.`,
    });
    const orchestrationSummary = await orchestrationService.getExecution(executionId);

    const message = `Run completed with execution_id=${executionId} and policy_outcome=${resolvedPolicyOutcome}${runtimeDebugOptions.dryRun ? ' (dry_run=true)' : ''}${runAssembly.memoryContext ? ` memory_policy=${runAssembly.memoryContext.policySummary.overallAction} warn=${runAssembly.memoryContext.policySummary.warningRecordCount} redact=${runAssembly.memoryContext.policySummary.redactedRecordCount} block=${runAssembly.memoryContext.policySummary.blockedRecordCount}` : ''}${memoryPromotionResult ? ` memory_promotion=${memoryPromotionResult.outcome} merged=${memoryPromotionResult.summary.mergedCount} session_projection=${memoryPromotionResult.persistedRecord?.key ?? 'none'}` : ''}.`;
    return {
      message,
      commandResult: {
        operation: CLI_RUNTIME_OPERATION.GOVERNANCE_RUN,
        summary: message,
        check_totals: checkTotals,
        checks,
        artifacts,
        experience,
        agentView,
        details: {
          execution_id: executionId,
          runtime_status: runtimeResult.status,
          runtime_backend: runtimeExecution.selection.primaryBackend,
          runtime_comparison_backend: runtimeExecution.selection.comparisonBackend ?? null,
          runtime_parity_mode: runtimeExecution.selection.parityMode,
          runtime_selection_reason: runtimeExecution.selection.reason,
          risk_level: riskEvaluation.riskLevel,
          original_policy_outcome: policyResult.policyOutcome,
          effective_policy_outcome: resolvedPolicyOutcome,
          replay_matched_count: replayExplainResult.matchedCount,
          assembly_mode: runAssembly.assemblyMode,
          assembly_reason: runAssembly.assemblyReason,
          task_id: runAssembly.taskContext?.taskId ?? runtimeDebugOptions.taskId,
          assembly_node_count: runAssembly.processDefinition.nodes.length,
          input_reference_count: runAssembly.taskContext?.inputReferences.length ?? 0,
          input_artifact_count: runAssembly.taskContext?.inputArtifacts.length ?? 0,
          dependency_task_count: runAssembly.taskContext?.dependsOnTaskIds.length ?? 0,
          memory_context_selected_count:
            runAssembly.memoryContext?.contractSafeSummary.selectedRecordCount ?? 0,
          memory_policy_action: runAssembly.memoryContext?.policySummary.overallAction ?? null,
          memory_policy_warning_count:
            runAssembly.memoryContext?.policySummary.warningRecordCount ?? null,
          memory_policy_redacted_count:
            runAssembly.memoryContext?.policySummary.redactedRecordCount ?? null,
          memory_policy_blocked_count:
            runAssembly.memoryContext?.policySummary.blockedRecordCount ?? null,
          memory_promotion_outcome: memoryPromotionResult?.outcome ?? null,
          memory_promotion_planned_merge_count:
            memoryPromotionResult?.summary.plannedMergeCount ?? null,
          memory_promotion_merged_count: memoryPromotionResult?.summary.mergedCount ?? null,
          memory_promotion_session_projection_key:
            memoryPromotionResult?.persistedRecord?.key ?? null,
          inline_review_chain_enabled: inlineReviewChainSummary.enabled,
          inline_review_chain_status: inlineReviewChainSummary.status,
          inline_review_chain_skip_reason: inlineReviewChainSummary.skipReason,
          inline_review_request_path: inlineReviewChainSummary.reviewRequestPath,
          inline_review_verify_path: inlineReviewChainSummary.reviewVerifyPath,
          inline_review_ledger_backfill_path: inlineReviewChainSummary.ledgerBackfillPath,
          delivery_rehearsal_enabled: deliveryRehearsalSummary.enabled,
          delivery_rehearsal_status: deliveryRehearsalSummary.status,
          delivery_rehearsal_skip_reason: deliveryRehearsalSummary.skipReason,
          delivery_rehearsal_action: deliveryRehearsalSummary.rehearsalAction,
          delivery_rehearsal_path: deliveryRehearsalSummary.rehearsalPath,
          hitl_required: hitlResolution.required,
          hitl_notification_path: hitlResolution.notificationArtifactPath,
          hitl_notification_status: hitlResolution.notificationResult?.dispatchStatus ?? null,
          hitl_decision_receipt_path: hitlResolution.decisionReceiptPath,
          hitl_decision: hitlResolution.decision,
          hitl_resume_action: hitlResolution.resumeAction,
          langgraph_checkpoint_path: langGraphCheckpointState.checkpointPath,
          langgraph_checkpoint_source: langGraphCheckpointState.checkpointSource,
          langgraph_recovery_state: langGraphCheckpointState.recoveryState,
          langgraph_recovery_next_node_ids:
            langGraphCheckpointState.recoveredNextNodeIds.join('|') || null,
          langgraph_pending_interrupt_kind: langGraphCheckpointState.pendingInterruptKind,
          orchestration_event_stream_token: orchestrationExecution.eventStreamToken,
          orchestration_status: orchestrationSummary?.status ?? null,
          orchestration_service_host_kind: orchestrationSummary?.serviceHostKind ?? null,
          orchestration_service_transport_kind: orchestrationSummary?.serviceTransportKind ?? null,
          orchestration_latest_event_sequence: orchestrationSummary?.latestEventSequence ?? null,
          orchestration_next_cursor: orchestrationSummary?.nextCursor ?? null,
          agent_descriptor_count: agentDescriptors.length,
          agent_session_status: agentView.sessionProjection?.sessionStatus ?? null,
          langgraph_supervisor_path: langGraphSupervisorPath,
          dry_run: runtimeDebugOptions.dryRun,
          trace_enabled: runtimeDebugOptions.trace,
          diagnostics_trace_path: diagnosticsTracePath,
        },
      },
    };
  }

  private async captureLangGraphCheckpointState(options: {
    orchestrationService: CliOrchestrationServiceRuntime;
    compiledIr: ReturnType<ProcessCompiler['compile']>;
    runtimeExecution: Awaited<ReturnType<ProcessRuntimeFacade['execute']>>;
    runtimeResult: RuntimeExecutionResult;
    executionSessionId: string;
    taskId?: string;
    artifactReferenceIds: string[];
    hitlResolution: Awaited<ReturnType<CliHitlRuntime['processRunHitl']>>;
    policyResult: ReturnType<PolicyGateEngine['evaluate']>;
  }): Promise<CliLangGraphCheckpointState> {
    if (options.runtimeExecution.selection.primaryBackend !== 'langgraph') {
      return {
        checkpointPath: null,
        checkpointSource: null,
        recoveryState: 'not_requested',
        recoveredNextNodeIds: [],
        pendingInterruptKind: null,
      };
    }

    const graphPlan = new CompiledIrGraphAdapter().adapt(options.compiledIr);
    const pendingInterrupt = options.hitlResolution.awaitingDecision
      ? {
          kind: 'hitl' as const,
          recordedAt: this.toRfc3339SecondsTimestamp(new Date()),
          reason: options.policyResult.reason,
          payload: {
            decision: options.hitlResolution.decision,
            resumeAction: options.hitlResolution.resumeAction,
            notificationArtifactPath: options.hitlResolution.notificationArtifactPath,
            decisionReceiptPath: options.hitlResolution.decisionReceiptPath,
          },
        }
      : undefined;
    const reducedState = {
      'execution.cursor':
        options.runtimeResult.visitedNodeIds.at(-1) ?? options.runtimeExecution.primary.entryNodeId,
      'execution.visited_nodes': options.runtimeResult.visitedNodeIds,
      'execution.stage_results': options.runtimeResult.stageResults.map((stageResult) => ({
        nodeId: stageResult.nodeId,
        stageId: stageResult.stageId,
        status: stageResult.status,
        attempt: stageResult.attempt,
      })),
      ...(pendingInterrupt ? { 'execution.pending_interrupt': pendingInterrupt } : {}),
    };
    const activeNodeIds =
      pendingInterrupt && options.runtimeResult.visitedNodeIds.length > 0
        ? [
            options.runtimeResult.visitedNodeIds.at(-1) ??
              options.runtimeExecution.primary.entryNodeId,
          ]
        : [];
    const recoveredExecution = await options.orchestrationService.saveCheckpoint({
      executionId: options.compiledIr.executionId,
      plan: graphPlan,
      executionSessionId: options.executionSessionId,
      activeNodeIds,
      visitedNodeIds: options.runtimeResult.visitedNodeIds,
      reducedState,
      artifactReferenceIds: options.artifactReferenceIds,
      ...(options.taskId ? { taskReferenceId: options.taskId } : {}),
      ...(pendingInterrupt ? { pendingInterrupt } : {}),
    });
    const serviceExecution = await options.orchestrationService.getExecution(
      options.compiledIr.executionId,
    );
    const recoveryResult =
      serviceExecution &&
      [
        OrchestrationExecutionStatus.COMPLETED,
        OrchestrationExecutionStatus.FAILED,
        OrchestrationExecutionStatus.CANCELLED,
      ].includes(serviceExecution.status)
        ? null
        : await options.orchestrationService.recoverExecution({
            executionId: options.compiledIr.executionId,
          });

    return {
      checkpointPath: serviceExecution?.checkpointPath ?? null,
      checkpointSource: serviceExecution?.checkpointSource ?? null,
      recoveryState:
        recoveryResult?.recovered || recoveredExecution ? 'recovered' : 'not_requested',
      recoveredNextNodeIds:
        recoveryResult?.nextNodeIds ??
        serviceExecution?.recoveredNextNodeIds ??
        recoveredExecution?.nextNodeIds ??
        [],
      pendingInterruptKind: recoveredExecution?.pendingInterrupt?.kind ?? null,
    };
  }

  private resolveOrchestrationStageStatus(
    status: RuntimeStageStatus,
  ): OrchestrationExecutionStatus {
    switch (status) {
      case RuntimeStageStatus.SUCCEEDED:
        return OrchestrationExecutionStatus.RUNNING;
      case RuntimeStageStatus.CANCELLED:
        return OrchestrationExecutionStatus.CANCELLED;
      case RuntimeStageStatus.TIMEOUT:
        return OrchestrationExecutionStatus.INTERRUPTED;
      default:
        return OrchestrationExecutionStatus.FAILED;
    }
  }

  private resolveOrchestrationExecutionStatus(
    status: RuntimeExecutionStatus,
  ): OrchestrationExecutionStatus {
    switch (status) {
      case RuntimeExecutionStatus.SUCCEEDED:
        return OrchestrationExecutionStatus.COMPLETED;
      case RuntimeExecutionStatus.CANCELLED:
        return OrchestrationExecutionStatus.CANCELLED;
      case RuntimeExecutionStatus.TIMEOUT:
        return OrchestrationExecutionStatus.INTERRUPTED;
      default:
        return OrchestrationExecutionStatus.FAILED;
    }
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
        'Replay mode requires a replay source path.',
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
        id: 'replay_source',
        path: replayPath,
      },
      {
        id: 'replay_diagnostics',
        path: diagnosticsPath,
      },
    ];

    if (tracePath) {
      artifacts.push({
        id: 'diagnostics_trace',
        path: tracePath,
      });
    }

    const checks: CliCommandResultCheck[] = [
      {
        id: 'replay_source',
        status: CliGovernanceCheckStatus.PASS,
        detail: replayResolution.sourceType,
      },
      {
        id: 'replay_explain',
        status: CliGovernanceCheckStatus.PASS,
        detail: `matched=${replayResolution.explainResult.matchedCount}`,
      },
      ...(replayResolution.memorySemantics
        ? [
            {
              id: 'memory_policy',
              status:
                replayResolution.memorySemantics.policyOverallAction === 'allow'
                  ? CliGovernanceCheckStatus.PASS
                  : CliGovernanceCheckStatus.WARN,
              detail: `action=${replayResolution.memorySemantics.policyOverallAction} warn=${replayResolution.memorySemantics.warningRecordCount} redact=${replayResolution.memorySemantics.redactedRecordCount} block=${replayResolution.memorySemantics.blockedRecordCount}`,
            } satisfies CliCommandResultCheck,
          ]
        : []),
    ];

    if (runtimeDebugOptions.trace) {
      checks.push({
        id: 'debug_mode',
        status: CliGovernanceCheckStatus.PASS,
        detail: 'trace=true replay=true',
      });
    }

    const experience = this.commandExperienceBuilder.createReplayCommandExperience({
      replayPath,
      diagnosticsPath,
      replayResolution,
    });
    const message = `Replay diagnostics completed from ${replayPath}${replayResolution.memorySemantics ? ` memory_policy=${replayResolution.memorySemantics.policyOverallAction} warn=${replayResolution.memorySemantics.warningRecordCount} redact=${replayResolution.memorySemantics.redactedRecordCount} block=${replayResolution.memorySemantics.blockedRecordCount} memory_promotion=${replayResolution.memorySemantics.promotionOutcome ?? 'none'} merged=${replayResolution.memorySemantics.mergedCount} session_projection=${replayResolution.memorySemantics.sessionSummaryProjectionKey ?? 'none'}` : ''}.`;
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
          replay_memory_policy_action:
            replayResolution.memorySemantics?.policyOverallAction ?? null,
          replay_memory_policy_warning_count:
            replayResolution.memorySemantics?.warningRecordCount ?? null,
          replay_memory_policy_redacted_count:
            replayResolution.memorySemantics?.redactedRecordCount ?? null,
          replay_memory_policy_blocked_count:
            replayResolution.memorySemantics?.blockedRecordCount ?? null,
          replay_memory_promotion_outcome:
            replayResolution.memorySemantics?.promotionOutcome ?? null,
          replay_memory_promotion_merged_count:
            replayResolution.memorySemantics?.mergedCount ?? null,
          replay_memory_session_projection_key:
            replayResolution.memorySemantics?.sessionSummaryProjectionKey ?? null,
          trace_enabled: runtimeDebugOptions.trace,
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
      'workspace:',
      `  mode: ${this.options.workspace.mode}`,
      `  migrationPolicy: ${WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK}`,
      'i18n:',
      '  runtimeEngine: i18next',
      `  defaultLocale: ${DEFAULT_I18N_LOCALE}`,
      `  fallbackLocale: ${DEFAULT_I18N_FALLBACK_LOCALE}`,
      '  supportedLocales:',
      `    - ${DEFAULT_I18N_LOCALE}`,
      `    - ${DEFAULT_I18N_FALLBACK_LOCALE}`,
      'ui:',
      '  react:',
      `    theme: ${DEFAULT_CLI_REACT_THEME_PRESET}`,
      'memory:',
      `  storeEngine: ${this.options.memoryConfig.storeEngine}`,
      `  storeRoot: ${this.options.memoryConfig.storeRoot}`,
      'adapters:',
      '  roles:',
      '    - roleId: planner',
      '      roleProfileId: planner-default',
      '      requiredCapabilities:',
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      '      required: true',
      '    - roleId: architect',
      '      roleProfileId: architect-default',
      '      requiredCapabilities:',
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      '      required: true',
      '    - roleId: coder',
      '      roleProfileId: coder-default',
      '      requiredCapabilities:',
      `        - ${AgentCapability.TOOL_CALLING}`,
      '      required: true',
      '    - roleId: tester',
      '      roleProfileId: tester-default',
      '      requiredCapabilities:',
      `        - ${AgentCapability.TOOL_CALLING}`,
      '      required: true',
      '    - roleId: reviewer',
      '      roleProfileId: reviewer-default',
      '      requiredCapabilities:',
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      '      required: true',
      '    - roleId: verifier',
      '      roleProfileId: verifier-default',
      '      requiredCapabilities:',
      `        - ${AgentCapability.STRUCTURED_OUTPUT}`,
      '      required: true',
      '  routing:',
      '    roleBindings:',
      '      planner:',
      `        primarySurface: ${AdapterSurface.CODEX}`,
      '        fallbackSurfaces:',
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      '      architect:',
      `        primarySurface: ${AdapterSurface.CODEX}`,
      '        fallbackSurfaces:',
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      '      coder:',
      `        primarySurface: ${AdapterSurface.CODEX}`,
      '        fallbackSurfaces:',
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      '      tester:',
      `        primarySurface: ${AdapterSurface.GITHUB_COPILOT}`,
      '        fallbackSurfaces:',
      `          - ${AdapterSurface.CODEX}`,
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      '      reviewer:',
      `        primarySurface: ${AdapterSurface.CLAUDE_CODE}`,
      '        fallbackSurfaces:',
      `          - ${AdapterSurface.CODEX}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      '      verifier:',
      `        primarySurface: ${AdapterSurface.CODEX}`,
      '        fallbackSurfaces:',
      `          - ${AdapterSurface.CLAUDE_CODE}`,
      `          - ${AdapterSurface.GITHUB_COPILOT}`,
      '  tools:',
      `    - toolId: ${AdapterSurface.CODEX}`,
      '      enabled: true',
      `      availability: ${AdapterAvailability.AVAILABLE}`,
      `    - toolId: ${AdapterSurface.GITHUB_COPILOT}`,
      '      enabled: true',
      `      availability: ${AdapterAvailability.AVAILABLE}`,
      `    - toolId: ${AdapterSurface.CLAUDE_CODE}`,
      '      enabled: true',
      `      availability: ${AdapterAvailability.AVAILABLE}`,
      '',
    ].join('\n');
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
      'context',
      'current-context.md',
    );
    if (!existsSync(currentContextPath)) {
      return {};
    }

    try {
      const currentContextContent = await readFile(currentContextPath, 'utf8');
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
      interactive: this.options.runtimeDebugOptions?.interactive === true,
      requestedUiMode: this.options.runtimeDebugOptions?.requestedUiMode ?? null,
      requestedUiTheme: this.options.runtimeDebugOptions?.requestedUiTheme ?? null,
      uiMode: this.options.runtimeDebugOptions?.uiMode ?? CliInteractiveUiMode.NONE,
      uiTheme: this.options.runtimeDebugOptions?.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET,
      uiFallbackBehavior: this.options.runtimeDebugOptions?.uiFallbackBehavior ?? null,
      inputTty: this.options.runtimeDebugOptions?.inputTty === true,
      stderrTty: this.options.runtimeDebugOptions?.stderrTty === true,
      dryRun: this.options.runtimeDebugOptions?.dryRun === true,
      trace: this.options.runtimeDebugOptions?.trace === true,
      replayPath:
        typeof this.options.runtimeDebugOptions?.replayPath === 'string' &&
        this.options.runtimeDebugOptions.replayPath.trim().length > 0
          ? this.options.runtimeDebugOptions.replayPath.trim()
          : null,
      adapters: this.options.runtimeDebugOptions?.adapters === true,
      fix: this.options.runtimeDebugOptions?.fix === true,
      connectAction:
        this.options.runtimeDebugOptions?.connectAction === CliConnectAction.DIFF ||
        this.options.runtimeDebugOptions?.connectAction === CliConnectAction.APPLY
          ? this.options.runtimeDebugOptions.connectAction
          : CliConnectAction.GENERATE,
      connectCandidatePath:
        typeof this.options.runtimeDebugOptions?.connectCandidatePath === 'string' &&
        this.options.runtimeDebugOptions.connectCandidatePath.trim().length > 0
          ? this.options.runtimeDebugOptions.connectCandidatePath.trim()
          : null,
      connectLatest: this.options.runtimeDebugOptions?.connectLatest === true,
      connectForce: this.options.runtimeDebugOptions?.connectForce === true,
      connectRollbackEnabled: this.options.runtimeDebugOptions?.connectRollbackEnabled !== false,
      connectWriteMode:
        this.options.runtimeDebugOptions?.connectWriteMode === CliConnectWriteMode.OVERWRITE
          ? CliConnectWriteMode.OVERWRITE
          : CliConnectWriteMode.MERGE,
      presetId:
        typeof this.options.runtimeDebugOptions?.presetId === 'string' &&
        this.options.runtimeDebugOptions.presetId.trim().length > 0
          ? (this.options.runtimeDebugOptions.presetId.trim() as CliNormalizedRuntimeDebugOptions['presetId'])
          : CliAgentOnboardingPreset.MULTI_TOOL_DEFAULT,
      requestedTools: Array.isArray(this.options.runtimeDebugOptions?.requestedTools)
        ? this.options.runtimeDebugOptions.requestedTools.filter(
            (surface): surface is AdapterSurface =>
              typeof surface === 'string' && surface.trim().length > 0,
          )
        : [],
      overwrite: this.options.runtimeDebugOptions?.overwrite === true,
      singleToolAllRoles: this.options.runtimeDebugOptions?.singleToolAllRoles === true,
      roleBindingOverrides: Array.isArray(this.options.runtimeDebugOptions?.roleBindingOverrides)
        ? this.options.runtimeDebugOptions.roleBindingOverrides.filter(
            (
              override,
            ): override is CliNormalizedRuntimeDebugOptions['roleBindingOverrides'][number] =>
              typeof override?.roleId === 'string' &&
              override.roleId.trim().length > 0 &&
              typeof override.primarySurface === 'string' &&
              override.primarySurface.trim().length > 0,
          )
        : [],
      recordLedger: this.options.runtimeDebugOptions?.recordLedger === true,
      taskId:
        typeof this.options.runtimeDebugOptions?.taskId === 'string' &&
        this.options.runtimeDebugOptions.taskId.trim().length > 0
          ? this.options.runtimeDebugOptions.taskId.trim()
          : null,
      restrictedNetwork: this.options.runtimeDebugOptions?.restrictedNetwork === true,
      restrictedReason:
        typeof this.options.runtimeDebugOptions?.restrictedReason === 'string' &&
        this.options.runtimeDebugOptions.restrictedReason.trim().length > 0
          ? this.options.runtimeDebugOptions.restrictedReason.trim()
          : null,
      allowLocalFallback: this.options.runtimeDebugOptions?.allowLocalFallback !== false,
      hitlDecision:
        typeof this.options.runtimeDebugOptions?.hitlDecision === 'string' &&
        this.options.runtimeDebugOptions.hitlDecision.trim().length > 0
          ? this.options.runtimeDebugOptions.hitlDecision.trim()
          : null,
      hitlDecisionReason:
        typeof this.options.runtimeDebugOptions?.hitlDecisionReason === 'string' &&
        this.options.runtimeDebugOptions.hitlDecisionReason.trim().length > 0
          ? this.options.runtimeDebugOptions.hitlDecisionReason.trim()
          : null,
      hitlResumeAction:
        this.options.runtimeDebugOptions?.hitlResumeAction === CliHitlResumeAction.RESUME ||
        this.options.runtimeDebugOptions?.hitlResumeAction === CliHitlResumeAction.TERMINATE ||
        this.options.runtimeDebugOptions?.hitlResumeAction === CliHitlResumeAction.DEGRADE
          ? this.options.runtimeDebugOptions.hitlResumeAction
          : null,
      hitlDecidedBy:
        typeof this.options.runtimeDebugOptions?.hitlDecidedBy === 'string' &&
        this.options.runtimeDebugOptions.hitlDecidedBy.trim().length > 0
          ? this.options.runtimeDebugOptions.hitlDecidedBy.trim()
          : null,
      hitlConstraints: Array.isArray(this.options.runtimeDebugOptions?.hitlConstraints)
        ? this.options.runtimeDebugOptions.hitlConstraints.filter(
            (constraint): constraint is string =>
              typeof constraint === 'string' && constraint.trim().length > 0,
          )
        : [],
    };
  }

  /**
   * @deprecated Legacy localizeText bridge retained for backward-compatibility during migration.
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
    return this.options.locale.trim().toLowerCase().startsWith('zh');
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
      handledBy: 'adapter-route-runner',
      nodeId: stageContext.nodeId,
      stageId: stageContext.stageId,
      routeKey: stageContext.routeKey,
      roleProfileId: stageContext.roleProfileId,
      selectedSurface: dispatchResult.selectedSurface,
      selectedBy: dispatchResult.auditRecord.selectedBy ?? 'unknown',
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
   * Checks whether one task-driven stage is handled by the internal managed review subchain.
   * @param stageId Runtime stage id.
   * @returns True when the stage should bypass adapter dispatch.
   */
  private isInlineReviewSubchainStage(stageId: string): boolean {
    return (
      stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REVIEW.stageId ||
      stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REVIEW_VERIFY.stageId
    );
  }

  /**
   * Checks whether one task-driven stage is handled by the internal controlled delivery rehearsal runtime.
   * @param stageId Runtime stage id.
   * @returns True when the stage should bypass adapter dispatch.
   */
  private isDeliveryRehearsalStage(stageId: string): boolean {
    return stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.DELIVERY_REHEARSAL.stageId;
  }

  /**
   * Executes managed review subchain stages inline inside `run`.
   * @param stageContext Runtime stage context.
   * @param runtimeDebugOptions Normalized runtime debug options.
   * @returns Structured stage output for audit/report consumption.
   */
  private async dispatchInlineReviewSubchainStage(
    stageContext: RuntimeStageContext,
    runtimeDebugOptions: CliNormalizedRuntimeDebugOptions,
    hitlPolicyContext: {
      effectivePolicyOutcome: ChangeRiskRequiredAction;
      riskLevel: string | null;
    },
  ): Promise<Record<string, unknown>> {
    const taskId =
      typeof stageContext.input.taskId === 'string' && stageContext.input.taskId.trim().length > 0
        ? stageContext.input.taskId.trim()
        : runtimeDebugOptions.taskId;
    const inlineRuntimeDebugOptions: CliNormalizedRuntimeDebugOptions = {
      ...runtimeDebugOptions,
      taskId,
      recordLedger: Boolean(taskId),
    };
    const inlineReviewExecutionGuard = await this.resolveInlineReviewExecutionGuard(
      inlineRuntimeDebugOptions,
      hitlPolicyContext,
    );
    if (!inlineReviewExecutionGuard.allowExecution) {
      return {
        handledBy: 'inline-review-subchain',
        stageId: stageContext.stageId,
        taskId,
        managedLedgerBackfill: false,
        reviewChainStatus: inlineReviewExecutionGuard.status,
        reviewChainSkipReason: inlineReviewExecutionGuard.skipReason,
        policyOutcome: inlineReviewExecutionGuard.policyOutcome,
        riskLevel: inlineReviewExecutionGuard.riskLevel,
      };
    }
    const commandContext = this.createCommandExecutorContext(inlineRuntimeDebugOptions);

    if (stageContext.stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REVIEW.stageId) {
      const commandResult = await new CliReviewCommand().execute(commandContext);
      const reviewRequestPath =
        commandResult.commandResult.artifacts?.find((artifact) => artifact.id === 'review_request')
          ?.path ?? null;
      return {
        handledBy: 'inline-review-subchain',
        stageId: stageContext.stageId,
        taskId,
        managedLedgerBackfill: inlineRuntimeDebugOptions.recordLedger,
        reviewChainStatus: CliInlineReviewChainStatus.APPLIED,
        reviewRequestPath,
      };
    }

    const commandResult = await new CliReviewVerifyCommand().execute(commandContext);
    const verifyArtifactPath =
      commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_verify_result',
      )?.path ?? null;
    const ledgerBackfillPath =
      commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === 'review_ledger_backfill',
      )?.path ?? null;
    return {
      handledBy: 'inline-review-subchain',
      stageId: stageContext.stageId,
      taskId,
      managedLedgerBackfill: inlineRuntimeDebugOptions.recordLedger,
      reviewChainStatus: CliInlineReviewChainStatus.APPLIED,
      reviewVerifyPath: verifyArtifactPath,
      ledgerBackfillPath,
    };
  }

  /**
   * Executes controlled delivery rehearsal inline so delivery planning stays on the same audit/replay chain.
   * @param executionId Current run execution id.
   * @param stageContext Runtime stage context.
   * @param runtimeDebugOptions Normalized runtime debug options.
   * @param resolvedPolicyContext Effective policy outcome for current run.
   * @param streamMetadata Active stream metadata used for artifact tagging.
   * @returns Structured stage output for audit/report consumption.
   */
  private async dispatchDeliveryRehearsalStage(
    executionId: string,
    stageContext: RuntimeStageContext,
    runtimeDebugOptions: CliNormalizedRuntimeDebugOptions,
    resolvedPolicyContext: {
      effectivePolicyOutcome: ChangeRiskRequiredAction;
      riskLevel: string | null;
    },
    streamMetadata?: CliExecutionStreamMetadata,
  ): Promise<Record<string, unknown>> {
    const rehearsalActionValue =
      typeof stageContext.input.deliveryRehearsalAction === 'string'
        ? stageContext.input.deliveryRehearsalAction
        : CliDeliveryRehearsalAction.COMMIT;
    const rehearsalAction =
      rehearsalActionValue === CliDeliveryRehearsalAction.PR_DRAFT
        ? CliDeliveryRehearsalAction.PR_DRAFT
        : CliDeliveryRehearsalAction.COMMIT;
    const taskId =
      typeof stageContext.input.taskId === 'string' && stageContext.input.taskId.trim().length > 0
        ? stageContext.input.taskId.trim()
        : runtimeDebugOptions.taskId;
    const taskTitle =
      typeof stageContext.input.taskTitle === 'string' && stageContext.input.taskTitle.length > 0
        ? stageContext.input.taskTitle
        : null;

    return this.deliveryRehearsalRuntime.executeDeliveryRehearsal({
      executionId,
      stageId: stageContext.stageId,
      taskId,
      taskTitle,
      rehearsalAction,
      runtimeDebugOptions,
      policyOutcome: resolvedPolicyContext.effectivePolicyOutcome,
      riskLevel: resolvedPolicyContext.riskLevel,
      projectId: streamMetadata?.projectId,
      sprintId: streamMetadata?.sprintId,
    });
  }

  /**
   * Resolves whether inline review-chain execution is allowed to produce side effects.
   * @param runtimeDebugOptions Normalized runtime debug options for current `run`.
   * @returns Guard decision for the inline review subchain.
   */
  private async resolveInlineReviewExecutionGuard(
    runtimeDebugOptions: CliNormalizedRuntimeDebugOptions,
    resolvedPolicyContext?: {
      effectivePolicyOutcome: ChangeRiskRequiredAction;
      riskLevel: string | null;
    },
  ): Promise<{
    allowExecution: boolean;
    status: CliInlineReviewChainStatus;
    skipReason: CliInlineReviewChainSkipReason | null;
    policyOutcome: ChangeRiskRequiredAction | null;
    riskLevel: string | null;
  }> {
    if (runtimeDebugOptions.dryRun) {
      return {
        allowExecution: false,
        status: CliInlineReviewChainStatus.DRY_RUN,
        skipReason: CliInlineReviewChainSkipReason.DRY_RUN,
        policyOutcome: null,
        riskLevel: null,
      };
    }

    const effectivePolicyOutcome =
      resolvedPolicyContext?.effectivePolicyOutcome ??
      this.evaluateRunRiskAndPolicy(await this.collectGitChangedPaths()).policyResult.policyOutcome;
    if (effectivePolicyOutcome === ChangeRiskRequiredAction.ALLOW) {
      return {
        allowExecution: true,
        status: CliInlineReviewChainStatus.APPLIED,
        skipReason: null,
        policyOutcome: effectivePolicyOutcome,
        riskLevel: resolvedPolicyContext?.riskLevel ?? null,
      };
    }

    return {
      allowExecution: false,
      status: CliInlineReviewChainStatus.DEFERRED,
      skipReason: this.resolveInlineReviewSkipReason(effectivePolicyOutcome),
      policyOutcome: effectivePolicyOutcome,
      riskLevel: resolvedPolicyContext?.riskLevel ?? null,
    };
  }

  /**
   * Maps policy outcomes to stable inline review-chain skip reasons.
   * @param policyOutcome Policy outcome evaluated at inline review boundary.
   * @returns Stable skip reason enum.
   */
  private resolveInlineReviewSkipReason(
    policyOutcome: ChangeRiskRequiredAction,
  ): CliInlineReviewChainSkipReason {
    if (policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      return CliInlineReviewChainSkipReason.POLICY_BLOCK;
    }
    if (policyOutcome === ChangeRiskRequiredAction.ESCALATE) {
      return CliInlineReviewChainSkipReason.POLICY_ESCALATE;
    }
    return CliInlineReviewChainSkipReason.POLICY_CONFIRM;
  }

  /**
   * Resolves one normalized inline review-chain summary from runtime stage outputs.
   * @param runtimeResult Runtime execution result for current `run`.
   * @returns Inline review-chain status and artifact paths for CLI output shaping.
   */
  private resolveInlineReviewChainSummary(runtimeResult: RuntimeExecutionResult): {
    enabled: boolean;
    status: CliInlineReviewChainStatus;
    skipReason: CliInlineReviewChainSkipReason | null;
    reviewRequestPath: string | null;
    reviewVerifyPath: string | null;
    ledgerBackfillPath: string | null;
    reviewStageStatus: RuntimeStageStatus | null;
    reviewVerifyStageStatus: RuntimeStageStatus | null;
  } {
    const reviewStageResult =
      runtimeResult.stageResults.find(
        (stageResult) =>
          stageResult.stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REVIEW.stageId,
      ) ?? null;
    const reviewVerifyStageResult =
      runtimeResult.stageResults.find(
        (stageResult) =>
          stageResult.stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REVIEW_VERIFY.stageId,
      ) ?? null;
    const reviewOutput = this.resolveStageOutputRecord(reviewStageResult?.output);
    const reviewVerifyOutput = this.resolveStageOutputRecord(reviewVerifyStageResult?.output);
    const reviewRequestPath = this.readStageOutputString(reviewOutput, 'reviewRequestPath');
    const reviewVerifyPath = this.readStageOutputString(reviewVerifyOutput, 'reviewVerifyPath');
    const ledgerBackfillPath = this.readStageOutputString(reviewVerifyOutput, 'ledgerBackfillPath');
    const enabled = reviewStageResult !== null || reviewVerifyStageResult !== null;

    if (!enabled) {
      return {
        enabled: false,
        status: CliInlineReviewChainStatus.DISABLED,
        skipReason: null,
        reviewRequestPath,
        reviewVerifyPath,
        ledgerBackfillPath,
        reviewStageStatus: null,
        reviewVerifyStageStatus: null,
      };
    }

    const reviewStageStatus = reviewStageResult?.status ?? null;
    const reviewVerifyStageStatus = reviewVerifyStageResult?.status ?? null;
    const reviewChainStatus = this.resolveInlineReviewChainStatus(reviewOutput, reviewVerifyOutput);
    const reviewChainSkipReason = this.resolveInlineReviewChainSkipReason(
      reviewOutput,
      reviewVerifyOutput,
    );
    const failed =
      reviewStageStatus === RuntimeStageStatus.FAILED ||
      reviewStageStatus === RuntimeStageStatus.TIMEOUT ||
      reviewVerifyStageStatus === RuntimeStageStatus.FAILED ||
      reviewVerifyStageStatus === RuntimeStageStatus.TIMEOUT;
    const applied =
      reviewStageStatus === RuntimeStageStatus.SUCCEEDED &&
      reviewVerifyStageStatus === RuntimeStageStatus.SUCCEEDED &&
      reviewRequestPath !== null &&
      reviewVerifyPath !== null &&
      ledgerBackfillPath !== null;

    return {
      enabled: true,
      status: failed
        ? CliInlineReviewChainStatus.FAILED
        : (reviewChainStatus ??
          (applied ? CliInlineReviewChainStatus.APPLIED : CliInlineReviewChainStatus.PARTIAL)),
      skipReason: reviewChainSkipReason,
      reviewRequestPath,
      reviewVerifyPath,
      ledgerBackfillPath,
      reviewStageStatus,
      reviewVerifyStageStatus,
    };
  }

  /**
   * Resolves one normalized delivery rehearsal summary from runtime stage outputs.
   * @param runtimeResult Runtime execution result for current `run`.
   * @returns Delivery rehearsal status and artifact paths for CLI output shaping.
   */
  private resolveDeliveryRehearsalSummary(runtimeResult: RuntimeExecutionResult): {
    enabled: boolean;
    status: CliDeliveryRehearsalStatus;
    skipReason: CliDeliveryRehearsalSkipReason | null;
    rehearsalAction: CliDeliveryRehearsalAction | null;
    rehearsalPath: string | null;
    stageStatus: RuntimeStageStatus | null;
  } {
    const deliveryRehearsalStageResult =
      runtimeResult.stageResults.find(
        (stageResult) =>
          stageResult.stageId === CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.DELIVERY_REHEARSAL.stageId,
      ) ?? null;
    const enabled = deliveryRehearsalStageResult !== null;
    const deliveryOutput = this.resolveStageOutputRecord(deliveryRehearsalStageResult?.output);
    const rehearsalPath = this.readStageOutputString(deliveryOutput, 'deliveryRehearsalPath');
    const rehearsalActionValue = this.readStageOutputString(
      deliveryOutput,
      'deliveryRehearsalAction',
    );
    const rehearsalAction =
      rehearsalActionValue === CliDeliveryRehearsalAction.PR_DRAFT
        ? CliDeliveryRehearsalAction.PR_DRAFT
        : rehearsalActionValue === CliDeliveryRehearsalAction.COMMIT
          ? CliDeliveryRehearsalAction.COMMIT
          : null;
    const stageStatus = deliveryRehearsalStageResult?.status ?? null;

    if (!enabled) {
      return {
        enabled: false,
        status: CliDeliveryRehearsalStatus.DISABLED,
        skipReason: null,
        rehearsalAction,
        rehearsalPath,
        stageStatus,
      };
    }

    const statusValue = this.readStageOutputString(deliveryOutput, 'deliveryRehearsalStatus');
    const skipReasonValue = this.readStageOutputString(
      deliveryOutput,
      'deliveryRehearsalSkipReason',
    );
    const skipReason =
      skipReasonValue === CliDeliveryRehearsalSkipReason.DRY_RUN
        ? CliDeliveryRehearsalSkipReason.DRY_RUN
        : skipReasonValue === CliDeliveryRehearsalSkipReason.POLICY_CONFIRM
          ? CliDeliveryRehearsalSkipReason.POLICY_CONFIRM
          : skipReasonValue === CliDeliveryRehearsalSkipReason.POLICY_ESCALATE
            ? CliDeliveryRehearsalSkipReason.POLICY_ESCALATE
            : skipReasonValue === CliDeliveryRehearsalSkipReason.POLICY_BLOCK
              ? CliDeliveryRehearsalSkipReason.POLICY_BLOCK
              : null;
    const failed =
      stageStatus === RuntimeStageStatus.FAILED || stageStatus === RuntimeStageStatus.TIMEOUT;
    const status = failed
      ? CliDeliveryRehearsalStatus.FAILED
      : statusValue === CliDeliveryRehearsalStatus.DRY_RUN
        ? CliDeliveryRehearsalStatus.DRY_RUN
        : statusValue === CliDeliveryRehearsalStatus.DEFERRED
          ? CliDeliveryRehearsalStatus.DEFERRED
          : rehearsalPath
            ? CliDeliveryRehearsalStatus.APPLIED
            : CliDeliveryRehearsalStatus.DEFERRED;

    return {
      enabled: true,
      status,
      skipReason,
      rehearsalAction,
      rehearsalPath,
      stageStatus,
    };
  }

  /**
   * Resolves stable inline review-chain status from stage outputs.
   * @param reviewOutput Review-stage output payload.
   * @param reviewVerifyOutput Review-verify-stage output payload.
   * @returns Stable status when explicitly emitted.
   */
  private resolveInlineReviewChainStatus(
    reviewOutput: Record<string, unknown> | null,
    reviewVerifyOutput: Record<string, unknown> | null,
  ): CliInlineReviewChainStatus | null {
    const statusValue =
      this.readStageOutputString(reviewVerifyOutput, 'reviewChainStatus') ??
      this.readStageOutputString(reviewOutput, 'reviewChainStatus');
    if (!statusValue) {
      return null;
    }

    return Object.values(CliInlineReviewChainStatus).includes(
      statusValue as CliInlineReviewChainStatus,
    )
      ? (statusValue as CliInlineReviewChainStatus)
      : null;
  }

  /**
   * Resolves stable inline review-chain skip reason from stage outputs.
   * @param reviewOutput Review-stage output payload.
   * @param reviewVerifyOutput Review-verify-stage output payload.
   * @returns Stable skip reason when explicitly emitted.
   */
  private resolveInlineReviewChainSkipReason(
    reviewOutput: Record<string, unknown> | null,
    reviewVerifyOutput: Record<string, unknown> | null,
  ): CliInlineReviewChainSkipReason | null {
    const skipReasonValue =
      this.readStageOutputString(reviewVerifyOutput, 'reviewChainSkipReason') ??
      this.readStageOutputString(reviewOutput, 'reviewChainSkipReason');
    if (!skipReasonValue) {
      return null;
    }

    return Object.values(CliInlineReviewChainSkipReason).includes(
      skipReasonValue as CliInlineReviewChainSkipReason,
    )
      ? (skipReasonValue as CliInlineReviewChainSkipReason)
      : null;
  }

  /**
   * Normalizes one stage output payload into a plain record shape.
   * @param output Raw runtime stage output.
   * @returns Output as record when possible.
   */
  private resolveStageOutputRecord(output: unknown): Record<string, unknown> | null {
    return output && typeof output === 'object' ? (output as Record<string, unknown>) : null;
  }

  /**
   * Reads one string field from normalized stage output.
   * @param output Stage output record.
   * @param fieldName Field name to read.
   * @returns Trimmed string or null.
   */
  private readStageOutputString(
    output: Record<string, unknown> | null,
    fieldName: string,
  ): string | null {
    return output && typeof output[fieldName] === 'string' && output[fieldName].trim().length > 0
      ? output[fieldName].trim()
      : null;
  }

  /**
   * Resolves one role config row used by run-command node routing.
   * @param node Run-command process node.
   * @returns Matching role config when found.
   */
  private resolveRunRoleConfig(
    node: Pick<ProcessIrNode, 'routeKey' | 'roleProfileId' | 'stageId'>,
  ): AdaptersConfig['roles'][number] | undefined {
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
    node: Pick<ProcessIrNode, 'routeKey' | 'roleProfileId' | 'stageId'>,
  ): string {
    const normalizedProfileRoleId = node.roleProfileId.endsWith('-default')
      ? node.roleProfileId.slice(0, Math.max(0, node.roleProfileId.length - '-default'.length))
      : node.roleProfileId.includes('.')
        ? (node.roleProfileId.split('.').pop() ?? node.roleProfileId)
        : node.roleProfileId;
    if (this.options.adaptersConfig.routing.roleBindings[normalizedProfileRoleId]) {
      return normalizedProfileRoleId;
    }

    if (node.routeKey === 'route.prepare' || node.stageId === 'stage-prepare') {
      return 'planner';
    }
    if (node.routeKey === 'route.execute' || node.stageId === 'stage-execute') {
      return 'coder';
    }
    if (node.routeKey === 'route.report' || node.stageId === 'stage-report') {
      return 'reviewer';
    }

    return normalizedProfileRoleId;
  }

  /**
   * Resolves adapters/routing verification summary used by connect/doctor/verify commands.
   * @returns Adapter verification resolution.
   */
  private async resolveAdapterVerification(
    abortSignal?: AbortSignal,
  ): Promise<CliAdapterVerificationResolution> {
    return this.adapterVerificationRuntime.resolveAdapterVerification(abortSignal);
  }

  private async resolveAdapterVerificationForConfig(
    adaptersConfig: AdaptersConfig,
    abortSignal?: AbortSignal,
  ): Promise<CliAdapterVerificationResolution> {
    const adapterRoutingRuntime = new CliAdapterRoutingRuntime(adaptersConfig, {
      claudeCodeExecRunner: this.options.claudeCodeExecRunner,
      codexExecRunner: this.options.codexExecRunner,
      githubCopilotExecRunner: this.options.githubCopilotExecRunner,
    });
    const adapterVerificationRuntime = new CliAdapterVerificationRuntime(
      adaptersConfig,
      (key, interpolation) => this.options.translate?.(key, interpolation) ?? key,
      (error) => this.formatExecFailureDetail(error),
      adapterRoutingRuntime,
      this.localModelProbeRuntime,
    );

    return adapterVerificationRuntime.resolveAdapterVerification(abortSignal);
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
   * Evaluates current worktree risk and policy facts for `run` lifecycle gates.
   * @param changedPaths Changed paths observed from current worktree snapshot.
   * @param executionId Execution id used in policy evaluation context.
   * @returns Risk evaluation and policy result tuple.
   */
  private evaluateRunRiskAndPolicy(
    changedPaths: string[],
    executionId = 'cli-run-policy-evaluation',
  ): {
    riskEvaluation: ReturnType<ChangeRiskEvaluator['evaluate']>;
    policyResult: ReturnType<PolicyGateEngine['evaluate']>;
  } {
    const changeRiskEvaluator = new ChangeRiskEvaluator();
    const policyGateEngine = new PolicyGateEngine();
    const fileCategories = this.resolveRiskFileCategories(changedPaths);
    const riskEvaluation = changeRiskEvaluator.evaluate({
      changedPaths,
      fileCategories,
      requestedPermissions: [],
      commandClass: 'code_edit',
      lockfileDelta: changedPaths.some((path) => path.endsWith('pnpm-lock.yaml')),
      migrationDetected: changedPaths.some(
        (path) => path.includes('migration') || path.includes('migrations'),
      ),
      ciWorkflowChanged: changedPaths.some((path) => path.includes('.github/workflows/')),
      releaseScriptChanged: changedPaths.some((path) => path.includes('scripts/release')),
    });
    const policyResult = policyGateEngine.evaluate({
      riskEvaluation,
      context: {
        executionId,
        stageId: 'stage-policy-gate',
        routeKey: 'policy.gate.cli.run',
        proposalApproved: true,
        reviewVerifyConsecutiveFailures: 0,
      },
    });

    return {
      riskEvaluation,
      policyResult,
    };
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
    hitlNotificationPath?: string | null;
    hitlDecisionReceiptPath?: string | null;
    hitlResumeAction?: CliHitlResumeAction | null;
    awaitingDecision?: boolean;
    terminalDecision?: boolean;
    runtimeBackend?: string;
    runtimeCheckpointPath?: string | null;
    runtimeRecoveryState?: string;
  }): void {
    if (options.policyOutcome === ChangeRiskRequiredAction.ALLOW) {
      return;
    }

    if (options.policyOutcome === ChangeRiskRequiredAction.BLOCK) {
      throw new RuntimeError(
        GovernorErrorCode.POLICY_GATE_EVALUATION_FAILED,
        options.terminalDecision
          ? `Run terminated by HITL decision for execution_id=${options.executionId}.`
          : `Run blocked by policy gate for execution_id=${options.executionId}.`,
        {
          executionId: options.executionId,
          policyOutcome: options.policyOutcome,
          matchedRuleIds: options.matchedRuleIds,
          reportPath: options.reportPath,
          replayPath: options.replayPath,
          checkTotals: options.checkTotals,
          ...(options.awaitingDecision
            ? { pendingStatus: ExecutionProgressStage.POLICY_WAITING }
            : {}),
          ...(options.hitlNotificationPath
            ? { hitlNotificationPath: options.hitlNotificationPath }
            : {}),
          ...(options.hitlDecisionReceiptPath
            ? { hitlDecisionReceiptPath: options.hitlDecisionReceiptPath }
            : {}),
          ...(options.hitlResumeAction ? { hitlResumeAction: options.hitlResumeAction } : {}),
          ...(options.runtimeBackend ? { runtimeBackend: options.runtimeBackend } : {}),
          ...(options.runtimeCheckpointPath
            ? { runtimeCheckpointPath: options.runtimeCheckpointPath }
            : {}),
          ...(options.runtimeRecoveryState
            ? { runtimeRecoveryState: options.runtimeRecoveryState }
            : {}),
        },
      );
    }

    throw new RuntimeError(
      GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID,
      options.hitlDecisionReceiptPath
        ? `Run requires further HITL follow-up after decision receipt for execution_id=${options.executionId} (policy_outcome=${options.policyOutcome}).`
        : `Run requires HITL confirmation before completion for execution_id=${options.executionId} (policy_outcome=${options.policyOutcome}).`,
      {
        executionId: options.executionId,
        policyOutcome: options.policyOutcome,
        matchedRuleIds: options.matchedRuleIds,
        reportPath: options.reportPath,
        replayPath: options.replayPath,
        checkTotals: options.checkTotals,
        pendingStatus: ExecutionProgressStage.HUMAN_CONFIRMATION,
        ...(options.hitlNotificationPath
          ? { hitlNotificationPath: options.hitlNotificationPath }
          : {}),
        ...(options.hitlDecisionReceiptPath
          ? { hitlDecisionReceiptPath: options.hitlDecisionReceiptPath }
          : {}),
        ...(options.hitlResumeAction ? { hitlResumeAction: options.hitlResumeAction } : {}),
        ...(options.runtimeBackend ? { runtimeBackend: options.runtimeBackend } : {}),
        ...(options.runtimeCheckpointPath
          ? { runtimeCheckpointPath: options.runtimeCheckpointPath }
          : {}),
        ...(options.runtimeRecoveryState
          ? { runtimeRecoveryState: options.runtimeRecoveryState }
          : {}),
      },
    );
  }

  /**
   * Collects changed paths from `git status --porcelain`.
   * @returns Unique changed paths; empty list when git is unavailable.
   */
  private async collectGitChangedPaths(): Promise<string[]> {
    try {
      const result = await execFileAsync('git', ['status', '--porcelain'], {
        cwd: this.options.currentWorkingDirectory,
        maxBuffer: 2 * 1024 * 1024,
        encoding: 'utf8',
      });
      const changedPaths = result.stdout
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 3)
        .map((line) => line.slice(3))
        .map((line) => {
          const renameArrowIndex = line.indexOf(' -> ');
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
   * Creates one assembly-status check row for task-driven run planning.
   * @param runAssembly Resolved run assembly payload.
   * @param requestedTaskId Raw task id requested by CLI flags.
   * @returns One check row rendered in run-command output.
   */
  private createRunAssemblyCheck(
    runAssembly: CliTaskDrivenRunAssembly,
    requestedTaskId: string | null,
  ): CliCommandResultCheck {
    const taskIdLabel = runAssembly.taskContext?.taskId ?? requestedTaskId ?? 'none';
    const contractSafeSummary = runAssembly.memoryContext?.contractSafeSummary;
    return {
      id: 'assembly',
      status:
        runAssembly.assemblyMode === 'task_id_fallback'
          ? CliGovernanceCheckStatus.WARN
          : CliGovernanceCheckStatus.PASS,
      detail: `mode=${runAssembly.assemblyMode} reason=${runAssembly.assemblyReason} task_id=${taskIdLabel} nodes=${runAssembly.processDefinition.nodes.length} input_references=${runAssembly.taskContext?.inputReferences.length ?? 0} input_artifacts=${runAssembly.taskContext?.inputArtifacts.length ?? 0} memory_context_selected=${contractSafeSummary?.selectedRecordCount ?? 0} memory_context_execution=${contractSafeSummary?.layerCounts.execution ?? 0} memory_context_session=${contractSafeSummary?.layerCounts.session ?? 0} memory_context_outcome=${runAssembly.memoryContext?.assemblyOutcome ?? 'none'}`,
    };
  }

  private createMemoryPolicyCheck(runAssembly: CliTaskDrivenRunAssembly): CliCommandResultCheck {
    const policySummary = runAssembly.memoryContext?.policySummary;
    return {
      id: 'memory_policy',
      status:
        !policySummary || policySummary.overallAction === 'allow'
          ? CliGovernanceCheckStatus.PASS
          : CliGovernanceCheckStatus.WARN,
      detail: `action=${policySummary?.overallAction ?? 'allow'} warn=${policySummary?.warningRecordCount ?? 0} redact=${policySummary?.redactedRecordCount ?? 0} block=${policySummary?.blockedRecordCount ?? 0}`,
    };
  }

  /**
   * Creates one report-safe memory-semantics block for execution-report consumers.
   * @param runAssembly Resolved task-driven run assembly.
   * @param memoryPromotionResult Optional promotion pipeline result.
   * @returns Execution-report augmentation or null when memory semantics are unavailable.
   */
  private createExecutionReportMemorySemanticsSummary(
    runAssembly: CliTaskDrivenRunAssembly,
    memoryPromotionResult: MemoryPromotionResult | null,
  ) {
    const contractSafeSummary = runAssembly.memoryContext?.contractSafeSummary;
    if (!contractSafeSummary) {
      return null;
    }

    return {
      contextSummary: {
        queryIntent: contractSafeSummary.queryIntent,
        assemblyOutcome: contractSafeSummary.assemblyOutcome,
        selectedRecordCount: contractSafeSummary.selectedRecordCount,
        sourceRefCount: contractSafeSummary.sourceRefCount,
        recordsMissingExplicitSourceRefs: contractSafeSummary.recordsMissingExplicitSourceRefs,
        truncationReason: contractSafeSummary.truncationReason,
        layerCounts: { ...contractSafeSummary.layerCounts },
        memoryKindCounts: { ...contractSafeSummary.memoryKindCounts },
        safetyNotes: [...contractSafeSummary.safetyNotes],
        policySummary: {
          overallAction: contractSafeSummary.policySummary.overallAction,
          actionCounts: { ...contractSafeSummary.policySummary.actionCounts },
          allowedRecordCount: contractSafeSummary.policySummary.allowedRecordCount,
          warningRecordCount: contractSafeSummary.policySummary.warningRecordCount,
          redactedRecordCount: contractSafeSummary.policySummary.redactedRecordCount,
          blockedRecordCount: contractSafeSummary.policySummary.blockedRecordCount,
        },
      },
      promotion: memoryPromotionResult
        ? {
            outcome: memoryPromotionResult.outcome,
            candidateCount: memoryPromotionResult.summary.candidateCount,
            promotableCount: memoryPromotionResult.summary.promotableCount,
            plannedMergeCount: memoryPromotionResult.summary.plannedMergeCount,
            mergedCount: memoryPromotionResult.summary.mergedCount,
            skippedCount: memoryPromotionResult.summary.skippedCount,
            rejectedCount: memoryPromotionResult.summary.rejectedCount,
            targetLayerCounts: { ...memoryPromotionResult.summary.targetLayerCounts },
            failureReasonCounts: { ...memoryPromotionResult.summary.failureReasonCounts },
            phaseResults: memoryPromotionResult.phaseResults.map((phaseResult) => ({
              phase: phaseResult.phase,
              status: phaseResult.status,
              candidateCount: phaseResult.candidateCount,
              detail: phaseResult.detail,
            })),
            sessionSummaryProjection: memoryPromotionResult.persistedRecord
              ? {
                  scope: memoryPromotionResult.persistedRecord.scope,
                  key: memoryPromotionResult.persistedRecord.key,
                  promotedRecordIds: [...memoryPromotionResult.persistedRecord.promotedRecordIds],
                  updatedAt: memoryPromotionResult.persistedRecord.updatedAt,
                }
              : null,
          }
        : null,
    };
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
    return value.toISOString().replace(/\.\d{3}Z$/u, 'Z');
  }

  /**
   * Formats RFC3339 timestamp into display format expected by audit recorder.
   * @param timestamp RFC3339 timestamp.
   * @returns Display timestamp in `YYYY-MM-DD HH:mm:ss UTC+00:00`.
   */
  private toDisplayTimestamp(timestamp: string): string {
    const normalizedTimestamp = timestamp.trim();
    const datePart = normalizedTimestamp.slice(0, 19).replace('T', ' ');
    if (normalizedTimestamp.endsWith('Z')) {
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
    if (!error || typeof error !== 'object') {
      return 'failed';
    }

    const candidate = error as {
      code?: number | string;
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    const output = [candidate.stdout?.trim(), candidate.stderr?.trim()]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' | ');
    if (output.length > 0) {
      return output;
    }

    if (candidate.code !== undefined) {
      return `exit_code=${candidate.code}`;
    }

    return candidate.message?.trim() || 'failed';
  }
}
