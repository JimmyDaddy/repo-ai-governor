import type {
  ErrorOutputEnvironment,
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
} from '@repo-ai-governor/shared';
import type {
  CliDoctorAttachMode,
  CliGovernanceCheckStatus,
  CliRuntimeOperation,
} from '../../constants/cli-governance-runtime.constant.js';
import type {
  CliNextAction,
  CliOutputStatus,
  CliVerbosity,
} from '../../constants/cli-output.constant.js';

/**
 * Defines runtime output context resolved from CLI flags and terminal state.
 */
export interface CliResolvedOutputContext {
  outputMode: ErrorOutputEnvironment;
  verbosity: CliVerbosity;
  compact: boolean;
  noColor: boolean;
  isTty: boolean;
  colorEnabled: boolean;
  downgradedFrom: ErrorOutputEnvironment | null;
}

/**
 * Defines one command execution diagnostics snapshot rendered in CLI output.
 */
export interface CliCommandDiagnostics {
  configSource: 'default' | 'file';
  locale: string;
  profile: string;
  workspaceMode: string;
  workspaceModeSource: string;
  workspaceId: string;
  workspaceRoot: string;
  memoryStoreEngine: string;
  memoryStoreRoot: string;
  memoryStoreProvider: string;
  memoryStoreProviderId?: string;
  memoryStoreProviderModule?: string;
  memoryStoreDistributionMode?: string;
  memoryStoreResolutionSource?: string;
  memoryStoreHostSurface?: string;
  memoryStoreRuntimeMode?: string;
  entrySurface?: string;
  standardsProfileId?: string;
  standardsSourceIds?: string[];
  codexExecFixture?: string | null;
  githubCopilotExecFixture?: string | null;
}

/**
 * Defines one command-level governance check row.
 */
export interface CliCommandResultCheck {
  id: string;
  status: CliGovernanceCheckStatus;
  detail: string;
}

/**
 * Defines one command-level artifact reference generated during execution.
 */
export interface CliCommandResultArtifact {
  id: string;
  path: string;
}

/**
 * Defines one progress-to-audit/replay backlink entry.
 */
export interface CliProgressBacklink {
  executionId?: string;
  stageId?: string;
  routeKey?: string;
  reportPath?: string;
  replayPath?: string;
  artifactPath?: string;
}

/**
 * Defines one role/stage progress row shown in command outputs.
 */
export interface CliRoleStageProgress {
  roleId: string;
  stage: ExecutionProgressStage;
  status: ExecutionProgressStatus;
  category: ExecutionInteractionCategory;
  summary: string;
  detail?: string;
  backlink?: CliProgressBacklink;
}

/**
 * Defines one human-facing interaction prompt.
 */
export interface CliInteractionPrompt {
  category: ExecutionInteractionCategory;
  stage: ExecutionProgressStage;
  title: string;
  action: string;
  blocking: boolean;
}

/**
 * Defines one layered log payload used by summary and verbose renderers.
 */
export interface CliLayeredLogs {
  summary: string[];
  detailed: string[];
}

/**
 * Defines one human-friendly command experience block.
 */
export interface CliCommandExperiencePayload {
  statusDictionary: Record<ExecutionProgressStatus, string>;
  roleProgress: CliRoleStageProgress[];
  layeredLogs: CliLayeredLogs;
  interactionPrompts: CliInteractionPrompt[];
}

/**
 * Defines one command execution summary payload shared by pretty/plain/json outputs.
 */
export interface CliCommandExecutionResultPayload {
  operation: CliRuntimeOperation;
  summary: string;
  attach_mode?: CliDoctorAttachMode;
  check_totals?: {
    pass: number;
    warn: number;
    fail: number;
  };
  checks?: CliCommandResultCheck[];
  artifacts?: CliCommandResultArtifact[];
  experience?: CliCommandExperiencePayload;
  details?: Record<string, boolean | number | string | null>;
}

/**
 * Defines one successful CLI output payload in stable machine-readable shape.
 */
export interface CliSuccessOutputPayload {
  schema_version: string;
  status: CliOutputStatus;
  output_mode: ErrorOutputEnvironment;
  verbosity: CliVerbosity;
  command: string;
  message: string;
  runtime: {
    is_tty: boolean;
    color_enabled: boolean;
    compact: boolean;
    downgraded_from: ErrorOutputEnvironment | null;
  };
  diagnostics: CliCommandDiagnostics;
  command_result?: CliCommandExecutionResultPayload;
}

/**
 * Defines one failed CLI output payload in stable machine-readable shape.
 */
export interface CliErrorOutputPayload {
  schema_version: string;
  status: CliOutputStatus;
  output_mode: ErrorOutputEnvironment;
  verbosity: CliVerbosity;
  command: string;
  message: string;
  error_code: GovernorErrorCode;
  hint: string;
  next_action: CliNextAction;
  error_details?: {
    report_path?: string;
    replay_path?: string;
    pending_status?: string;
  };
  runtime: {
    is_tty: boolean;
    color_enabled: boolean;
    compact: boolean;
    downgraded_from: ErrorOutputEnvironment | null;
  };
}
