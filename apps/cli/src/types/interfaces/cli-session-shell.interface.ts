import type {
  SessionMainCapabilityAnswerKind,
  SessionMainCapabilityId,
  SessionMainCapabilitySuggestedAction,
} from '@repo-ai-governor/core-orchestration-service';
import type {
  OrchestrationAppendSessionMessageResponse,
  OrchestrationArchiveSessionResponse,
  OrchestrationForkSessionResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationResumeSessionResponse,
  OrchestrationSessionTranscriptRole,
  OrchestrationStartSessionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
  OrchestrationUnarchiveSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import type { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import type {
  CliSessionShellExitReason,
  CliSessionShellForegroundFocusTarget,
  CliSessionShellForegroundInputOwner,
  CliSessionShellHandoffState,
  CliSessionShellInputActionType,
  CliSessionShellInputMode,
  CliSessionShellMode,
  CliSessionShellPersistenceOwner,
  CliSessionTranscriptRole,
} from '../../constants/cli-session-shell.constant.js';
import type { CliCommandProgressPanelViewModel } from './cli-command-progress-panel.interface.js';
import type { CliGovernanceCommandExecutionOptions } from './cli-command-progress.interface.js';

/**
 * Defines one transcript item rendered inside the session-shell transcript pane.
 */
export type CliSessionShellTranscriptRenderKind =
  | 'plain_text'
  | 'markdown'
  | 'live_markdown'
  | 'live_activity'
  | 'system_notice'
  | 'command_recap'
  | 'collaboration_recap';

/**
 * Defines one structured backlink rendered from canonical session metadata.
 */
export interface CliSessionShellTranscriptBacklink {
  kind: string;
  label: string;
  target: string;
}

/**
 * Defines one collapsible execution-details block attached to a final transcript item.
 */
export interface CliSessionShellTranscriptDetailsBlock {
  title: string;
  summaryLine: string;
  lines: string[];
  expanded: boolean;
}

/**
 * Defines one follow-up affordance block rendered beneath a capability explanation answer.
 */
export interface CliSessionShellTranscriptSuggestedActionsBlock {
  title: string;
  actions: SessionMainCapabilitySuggestedAction[];
}

/**
 * Defines one presenter-safe provider continuation summary block rendered beneath a turn result.
 */
export interface CliSessionShellTranscriptProviderContinuationBlock {
  title: string;
  lines: string[];
}

/**
 * Defines one transcript item rendered inside the session-shell transcript pane.
 */
export interface CliSessionShellTranscriptItem {
  id: string;
  role: CliSessionTranscriptRole;
  label: string;
  lines: string[];
  renderKind: CliSessionShellTranscriptRenderKind;
  summaryLine?: string;
  markdownSource?: string;
  backlinks?: CliSessionShellTranscriptBacklink[];
  details?: CliSessionShellTranscriptDetailsBlock;
  capabilityAnswerKind?: SessionMainCapabilityAnswerKind;
  referencedCapabilityIds?: SessionMainCapabilityId[];
  suggestedActionsBlock?: CliSessionShellTranscriptSuggestedActionsBlock;
  providerContinuationBlock?: CliSessionShellTranscriptProviderContinuationBlock;
}

/**
 * Defines one highlight segment used by slash-command palette rendering.
 */
export interface CliSessionSlashCommandHighlightSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Defines one slash-command metadata item shared by CLI and future desktop palettes.
 */
export interface CliSessionSlashCommandMetadata {
  command: string;
  summary: string;
}

/**
 * Defines one filtered slash-command suggestion rendered by the palette.
 */
export interface CliSessionSlashCommandSuggestion {
  command: string;
  summary: string;
  highlightSegments: CliSessionSlashCommandHighlightSegment[];
}

/**
 * Defines one presenter-safe secure-capture descriptor exposed to the live shell.
 */
export interface CliSessionShellSecureCaptureDescriptor {
  displayCommand: string;
  keyName: string;
}

/**
 * Defines the presenter-only view model consumed by the session-shell React surface.
 */
export interface CliSessionShellViewModel {
  sessionId: string;
  shellMode: CliSessionShellMode;
  inputMode: CliSessionShellInputMode;
  transcriptItems: CliSessionShellTranscriptItem[];
  transcriptTitle: string;
  composerValue: string;
  composerTitle: string;
  composerPlaceholder: string;
  slashQuery: string;
  slashPaletteVisible: boolean;
  slashSuggestions: CliSessionSlashCommandSuggestion[];
  highlightedCommand: string | null;
  slashPaletteTitle: string;
  slashPaletteEmptyState: string;
  commandPreview: string | null;
  handoffState: CliSessionShellHandoffState;
  cwd: string;
  workspaceSummary: string;
  outputContract: ErrorOutputEnvironment;
  persistenceOwner: CliSessionShellPersistenceOwner;
  resumeSelector: string;
  foregroundInputOwner: CliSessionShellForegroundInputOwner;
  foregroundFocusTarget: CliSessionShellForegroundFocusTarget;
  inputActionContract: CliSessionShellInputActionType[];
  secureCapture?: CliSessionShellSecureCaptureDescriptor | null;
  title: string;
  subtitle: string;
  commandProgressPanel?: CliCommandProgressPanelViewModel;
  promptBarTitle: string;
  promptBarLines: string[];
  themePreset?: CliReactThemePreset;
}

/**
 * Defines one foreground input action routed through the Ink-owned controller seam.
 */
export interface CliSessionShellInputAction {
  type: CliSessionShellInputActionType;
  value?: string;
}

/**
 * Defines the presenter-local effects returned after one Ink-owned input action is applied.
 */
export interface CliSessionShellInputActionResult {
  submitComposer: boolean;
  clearScreenRequested: boolean;
  exitRequested: boolean;
  systemNoticeLines?: string[];
}

/**
 * Defines the prompt-adapter seam used by the readline-backed session shell runner.
 */
export interface CliSessionShellPromptAdapter {
  readLine(prompt: string): Promise<string | null>;
  readMultiline?(prompt: string, terminator: string): Promise<string | null>;
  close(): void;
}

/**
 * Defines the minimal local secret-mutation seam that secure session-shell capture can call.
 */
export interface CliSessionShellSecureSecretMutator {
  setSecret(options: {
    keyName: string;
    value: string;
    backendId?: string | null;
    environment?: NodeJS.ProcessEnv;
  }): Promise<{
    keyName: string;
    selector: string;
    backendId: string;
    warning: string | null;
  }>;
}

export interface CliSessionShellCommandExecutionResult {
  commandLine: string;
  status: 'success' | 'error';
  message: string;
  summaryLines: string[];
  artifactPaths: string[];
}

export type CliSessionShellCommandExecutor = (
  argv: string[],
  executionOptions?: CliGovernanceCommandExecutionOptions,
) => Promise<CliSessionShellCommandExecutionResult>;

export interface CliSessionShellPassthroughResult {
  commandLine: string;
  exitCode: number;
  stdoutLines: string[];
  stderrLines: string[];
}

export type CliSessionShellPassthroughExecutor = (
  commandLine: string,
) => Promise<CliSessionShellPassthroughResult>;

/**
 * Defines the minimal service-backed session client surface required by the shell runner.
 */
export interface CliSessionShellServiceClientLike {
  startSession(): Promise<OrchestrationStartSessionResponse>;
  resumeSession(sessionId?: string): Promise<OrchestrationResumeSessionResponse>;
  sendMainTurn(
    sessionId: string,
    userMessage: string,
    options?: {
      displayUserMessage?: string;
    },
  ): Promise<unknown>;
  appendMessage(
    sessionId: string,
    role: OrchestrationSessionTranscriptRole,
    lines: string[],
    metadata?: Record<string, unknown>,
  ): Promise<OrchestrationAppendSessionMessageResponse>;
  subscribeSession(
    request: OrchestrationSubscribeSessionRequest,
  ): Promise<OrchestrationSubscribeSessionResponse>;
  listSessions(
    request?: OrchestrationListSessionsRequest,
  ): Promise<OrchestrationListSessionsResponse>;
  forkSession(
    sourceSessionId: string,
    displayName?: string,
  ): Promise<OrchestrationForkSessionResponse>;
  archiveSession(
    sessionId: string,
    archiveReasonSummary?: string,
  ): Promise<OrchestrationArchiveSessionResponse>;
  unarchiveSession(sessionId: string): Promise<OrchestrationUnarchiveSessionResponse>;
}

/**
 * Defines the localization and runtime context consumed by the session-shell runner.
 */
export interface CliSessionShellRunOptions {
  sessionClient: CliSessionShellServiceClientLike;
  commandExecutor?: CliSessionShellCommandExecutor;
  commandExecutionOptions?: CliGovernanceCommandExecutionOptions;
  secureSecretMutator?: CliSessionShellSecureSecretMutator;
  passthroughExecutor?: CliSessionShellPassthroughExecutor;
  currentWorkingDirectory: string;
  workspaceSummary: string;
  outputMode: ErrorOutputEnvironment;
  uiTheme?: CliReactThemePreset;
  resumeOnStartup?: boolean;
  requestedSessionId?: string | null;
  initialPrompt?: string | null;
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

/**
 * Defines the result returned after one session-shell lifecycle completes.
 */
export interface CliSessionShellRunResult {
  exitReason: CliSessionShellExitReason;
  transcriptItems: CliSessionShellTranscriptItem[];
}
