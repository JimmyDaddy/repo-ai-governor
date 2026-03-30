import type {
  OrchestrationAppendSessionMessageResponse,
  OrchestrationListSessionsRequest,
  OrchestrationListSessionsResponse,
  OrchestrationResumeSessionResponse,
  OrchestrationSessionTranscriptRole,
  OrchestrationStartSessionResponse,
  OrchestrationSubscribeSessionRequest,
  OrchestrationSubscribeSessionResponse,
} from '@repo-ai-governor/orchestration-service-client';
import type { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import type {
  CliSessionShellExitReason,
  CliSessionShellHandoffState,
  CliSessionShellInputMode,
  CliSessionShellMode,
  CliSessionShellPersistenceOwner,
  CliSessionTranscriptRole,
} from '../../constants/cli-session-shell.constant.js';

/**
 * Defines one transcript item rendered inside the session-shell transcript pane.
 */
export interface CliSessionShellTranscriptItem {
  id: string;
  role: CliSessionTranscriptRole;
  label: string;
  lines: string[];
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
  title: string;
  subtitle: string;
  promptBarTitle: string;
  promptBarLines: string[];
  themePreset?: CliReactThemePreset;
}

/**
 * Defines the prompt-adapter seam used by the readline-backed session shell runner.
 */
export interface CliSessionShellPromptAdapter {
  readLine(prompt: string): Promise<string | null>;
  readMultiline?(prompt: string, terminator: string): Promise<string | null>;
  close(): void;
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
  sendMainTurn(sessionId: string, userMessage: string): Promise<unknown>;
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
}

/**
 * Defines the localization and runtime context consumed by the session-shell runner.
 */
export interface CliSessionShellRunOptions {
  sessionClient: CliSessionShellServiceClientLike;
  commandExecutor?: CliSessionShellCommandExecutor;
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
