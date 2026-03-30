import type { ClaudeCodeExecRunner } from '@repo-ai-governor/adapter-claude-code';
import type { CodexExecRunner } from '@repo-ai-governor/adapter-codex';
import type { GithubCopilotExecRunner } from '@repo-ai-governor/adapter-github-copilot';
import type { AdaptersConfig, GovernorConfig, ResolvedWorkspace } from '@repo-ai-governor/config';
import type { MemoryStoreProvider } from '@repo-ai-governor/memory-store-adapter';
import type {
  NotificationProvider,
  NotificationRiskLevelPolicyMatrix,
} from '@repo-ai-governor/notification-dispatcher';
import type { AdapterSurface } from '@repo-ai-governor/shared';
import type { ErrorOutputEnvironment, MemoryRuntimeConfig } from '@repo-ai-governor/shared';
import type { CliAgentOnboardingPreset } from '../../constants/cli-agent-onboarding.constant.js';
import type {
  CliConnectAction,
  CliConnectWriteMode,
} from '../../constants/cli-connect.constant.js';
import type {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveUiMode,
} from '../../constants/cli-interactive-shell.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import type { CliHitlResumeAction } from '../../constants/cli-task-driven-run.constant.js';
import type { ReactCliViewModel } from '../../react-cli/index.js';
import type { CliAdapterDiagnosticsRuntime } from '../../runtime/adapter-diagnostics-runtime.js';
import type { CliAgentOnboardingRuntime } from '../../runtime/agent-onboarding-runtime.js';
import type { CliAgentProjectionRuntime } from '../../runtime/agent-projection-runtime.js';
import type { CliReviewQueueRuntime } from '../../runtime/artifacts/review-queue-runtime.js';
import type { CliOrchestrationServiceRuntime } from '../../runtime/orchestration-service-runtime.js';
import type { CliCommandExperienceBuilder } from '../../runtime/presentation/command-experience-builder.js';
import type { CliLocalAdapterProbeOverride } from './cli-adapter-verification.interface.js';
import type { CliAdapterVerificationResolution } from './cli-adapter-verification.interface.js';
import type { CliCommandProgressSink } from './cli-command-progress.interface.js';
import type { CliOrchestrationServiceRuntimeDependencies } from './cli-orchestration-service-runtime.interface.js';
import type {
  CliCommandExecutionResultPayload,
  CliCommandResultCheck,
} from './cli-output.interface.js';
import type {
  CliConnectRoleBindingOverride,
  CliRuntimeDebugOptions,
} from './cli-runtime-debug.interface.js';
import type { CliWorkflowCommandOptions } from './cli-workflow-command.interface.js';
import type { CliWorkspaceCommandOptions } from './cli-workspace-command.interface.js';

/**
 * Defines CLI runtime constructor options shared by the facade and extracted command executors.
 */
export interface CliGovernanceRuntimeOptions {
  currentWorkingDirectory: string;
  workspace: ResolvedWorkspace;
  config: GovernorConfig;
  configSource: 'default' | 'file';
  profileId: string | null;
  locale: string;
  translate?: (key: string, interpolation?: Record<string, string>) => string;
  outputMode: ErrorOutputEnvironment;
  isTty: boolean;
  memoryConfig: MemoryRuntimeConfig;
  memoryStoreRoot: string;
  memoryStoreProviderName: string;
  memoryStoreProvider: MemoryStoreProvider;
  adaptersConfig: AdaptersConfig;
  workspaceCommandOptions?: CliWorkspaceCommandOptions;
  workflowCommandOptions?: CliWorkflowCommandOptions;
  runtimeDebugOptions?: CliRuntimeDebugOptions;
  adapterLocalProbeOverrides?: Partial<Record<AdapterSurface, CliLocalAdapterProbeOverride>>;
  commandProbeExecutor?: (
    command: string,
    args: readonly string[],
    abortSignal?: AbortSignal,
  ) => Promise<void>;
  claudeCodeExecRunner?: ClaudeCodeExecRunner;
  codexExecRunner?: CodexExecRunner;
  githubCopilotExecRunner?: GithubCopilotExecRunner;
  notificationProviders?: NotificationProvider[];
  notificationPolicyMatrix?: NotificationRiskLevelPolicyMatrix;
  orchestrationServiceRuntimeDependencies?: CliOrchestrationServiceRuntimeDependencies;
}

/**
 * Defines one normalized command result returned by runtime/command executors.
 */
export interface CliGovernanceCommandResult {
  message: string;
  commandResult: CliCommandExecutionResultPayload;
  reactCliViewModel?: ReactCliViewModel;
}

/**
 * Defines pass/warn/fail aggregate totals used by command result payloads.
 */
export interface CliCheckTotals {
  pass: number;
  warn: number;
  fail: number;
}

/**
 * Defines optional project/sprint metadata resolved from workspace current-context.
 */
export interface CliExecutionStreamMetadata {
  projectId?: string;
  sprintId?: string;
}

/**
 * Defines normalized runtime debug flags after deterministic defaulting.
 */
export interface CliNormalizedRuntimeDebugOptions {
  interactive: boolean;
  requestedUiMode: CliInteractiveUiMode | null;
  requestedUiTheme: CliReactThemePreset | null;
  uiMode: CliInteractiveUiMode;
  uiTheme?: CliReactThemePreset;
  uiFallbackBehavior: CliInteractiveShellFallbackBehavior | null;
  inputTty: boolean;
  stderrTty: boolean;
  dryRun: boolean;
  trace: boolean;
  replayPath: string | null;
  adapters: boolean;
  fix: boolean;
  connectAction: CliConnectAction;
  connectCandidatePath: string | null;
  connectLatest: boolean;
  connectForce: boolean;
  connectRollbackEnabled: boolean;
  connectWriteMode: CliConnectWriteMode | null;
  presetId: CliAgentOnboardingPreset;
  requestedTools: AdapterSurface[];
  overwrite: boolean;
  singleToolAllRoles: boolean;
  roleBindingOverrides: CliConnectRoleBindingOverride[];
  recordLedger: boolean;
  taskId: string | null;
  restrictedNetwork: boolean;
  restrictedReason: string | null;
  allowLocalFallback: boolean;
  hitlDecision: string | null;
  hitlDecisionReason: string | null;
  hitlResumeAction: CliHitlResumeAction | null;
  hitlDecidedBy: string | null;
  hitlConstraints: string[];
}

/**
 * Defines one artifact writer contract consumed by extracted command executors.
 */
export interface CliArtifactWriter {
  writeTextArtifact(filePath: string, content: string): Promise<void>;
  writeJsonArtifact(filePath: string, payload: unknown): Promise<void>;
  safeReadJson(filePath: string): Promise<Record<string, unknown> | null>;
}

/**
 * Defines one execution context passed to extracted CLI command executors.
 */
export interface CliCommandExecutorContext {
  options: CliGovernanceRuntimeOptions;
  progressSink?: CliCommandProgressSink;
  abortSignal?: AbortSignal;
  artifactWriter: CliArtifactWriter;
  onboardingRuntime: CliAgentOnboardingRuntime;
  agentProjectionRuntime: CliAgentProjectionRuntime;
  adapterDiagnosticsRuntime: CliAdapterDiagnosticsRuntime;
  reviewQueueRuntime: CliReviewQueueRuntime;
  orchestrationServiceRuntime: CliOrchestrationServiceRuntime;
  commandExperienceBuilder: CliCommandExperienceBuilder;
  executeRunCommand(): Promise<CliGovernanceCommandResult>;
  calculateCheckTotals(checks: CliCommandResultCheck[]): CliCheckTotals;
  buildDefaultConfigContent(): string;
  toRfc3339SecondsTimestamp(value: Date): string;
  formatExecFailureDetail(error: unknown): string;
  resolveRuntimeDebugOptions(): CliNormalizedRuntimeDebugOptions;
  resolveExecutionStreamMetadata(): Promise<CliExecutionStreamMetadata>;
  resolveAdapterVerification(abortSignal?: AbortSignal): Promise<CliAdapterVerificationResolution>;
  resolveAdapterVerificationForConfig(
    adaptersConfig: AdaptersConfig,
    abortSignal?: AbortSignal,
  ): Promise<CliAdapterVerificationResolution>;
  validateGovernorConfig(candidate: unknown): GovernorConfig;
  canWritePath(filePath: string): Promise<boolean>;
  /** @deprecated Use translate instead. Retained for backward-compatibility during migration. */
  localizeText(english: string, chinese: string): string;
  translate: (key: string, interpolation?: Record<string, string>) => string;
  runNodeScript(
    scriptPath: string,
    args?: string[],
  ): Promise<{
    stdout: string;
    stderr: string;
  }>;
}
