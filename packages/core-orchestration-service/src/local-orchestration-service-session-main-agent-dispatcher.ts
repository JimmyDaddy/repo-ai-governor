import { AdapterSurface, GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';

const SESSION_MAIN_CONNECT_KEYWORDS = ['connect', 'adapter', 'adapters', 'tool', 'tools'];
const SESSION_MAIN_DOCTOR_KEYWORDS = ['doctor', 'diagnose', 'health', 'check environment'];
const SESSION_MAIN_VERIFY_KEYWORDS = ['verify', 'validation', 'validate'];
const SESSION_MAIN_PLAN_KEYWORDS = ['plan', 'planning', 'break down', 'task breakdown'];
const SESSION_MAIN_REVIEW_KEYWORDS = ['review', 'cr', 'code review'];
const SESSION_MAIN_RUN_KEYWORDS = ['run', 'execute', 'ship', 'implement'];
const SESSION_MAIN_FAILURE_KEYWORDS = ['simulate failure', 'force failure'];
const SESSION_MAIN_CANCEL_KEYWORDS = ['cancel this turn', 'simulate cancel'];
const SESSION_MAIN_MIN_FOLLOW_UP_LENGTH = 10;
const SESSION_MAIN_ROUTING_PREFERENCE_ALIASES: Record<string, AdapterSurface> = {
  claude: AdapterSurface.CLAUDE_CODE,
  'claude-code': AdapterSurface.CLAUDE_CODE,
  codex: AdapterSurface.CODEX,
  copilot: AdapterSurface.GITHUB_COPILOT,
  'github-copilot': AdapterSurface.GITHUB_COPILOT,
  ollama: AdapterSurface.OLLAMA,
};

export const SESSION_MAIN_RESPONSE_MODE = {
  ANSWER: 'answer',
  FOLLOW_UP_QUESTION: 'follow_up_question',
  SLASH_SUGGESTION: 'slash_suggestion',
  COMMAND_HANDOFF_PREVIEW: 'command_handoff_preview',
} as const;

export type SessionMainResponseMode =
  (typeof SESSION_MAIN_RESPONSE_MODE)[keyof typeof SESSION_MAIN_RESPONSE_MODE];

export interface SessionMainAgentDispatchResult {
  responseMode: SessionMainResponseMode;
  assistantDelta: string;
  assistantMessage?: string;
  suggestedSlashCommand?: string;
  executionIntent?: string;
  followUpQuestion?: string;
  requiresConfirmation: boolean;
  selectedSurface: string;
  selectedBy: string;
  sessionRoutingPreferenceApplied: boolean;
  handoffCommandPreview?: string;
  handoffBacklinks?: Array<{
    kind: 'slash_command' | 'execution_intent' | 'command_preview';
    label: string;
    target: string;
  }>;
}

/**
 * Resolves one foreground `session.main` user turn into structured assistant semantics.
 *
 * Why this exists:
 * Path A needs a real service-owned main-agent dispatcher so session turns stop terminating in
 * `baseline_ack`, while keeping the implementation local, deterministic, and presenter-friendly.
 */
export class LocalOrchestrationServiceSessionMainAgentDispatcher {
  /**
   * Resolves one plain-text user turn into structured assistant output and handoff metadata.
   * @param userMessage User-authored text submitted through `session.main`.
   * @param metadata Optional session-turn metadata.
   * @returns Structured main-agent dispatch result.
   */
  public dispatch(
    userMessage: string,
    metadata?: Record<string, unknown>,
  ): SessionMainAgentDispatchResult {
    const normalizedMessage = userMessage.trim();
    const normalizedLowerMessage = normalizedMessage.toLowerCase();
    const sessionRoutingPreference = this.readOptionalString(metadata?.sessionRoutingPreference);
    const preferredSurface = this.resolvePreferredSurface(sessionRoutingPreference);
    const selectionMetadata = this.resolveSelectionMetadata(preferredSurface);

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_CANCEL_KEYWORDS)) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'The main-agent turn was cancelled before completion.',
      );
    }

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_FAILURE_KEYWORDS)) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        'The main-agent dispatcher rejected the turn during intent resolution.',
      );
    }

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_CONNECT_KEYWORDS)) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/connect',
        executionIntent: 'connect.adapters.bootstrap',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor connect --preset multi-tool-default --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_DOCTOR_KEYWORDS)) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/doctor',
        executionIntent: 'doctor.adapters',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor doctor --adapters --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_VERIFY_KEYWORDS)) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/verify',
        executionIntent: 'verify.adapters',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor verify --adapters --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_PLAN_KEYWORDS)) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/plan',
        executionIntent: 'plan.generate',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor plan --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_REVIEW_KEYWORDS)) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/review',
        executionIntent: 'review.start',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor review --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (this.includesAnyKeyword(normalizedLowerMessage, SESSION_MAIN_RUN_KEYWORDS)) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/run',
        executionIntent: 'run.task',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor run --dry-run --trace',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (normalizedMessage.length < SESSION_MAIN_MIN_FOLLOW_UP_LENGTH) {
      return {
        responseMode: SESSION_MAIN_RESPONSE_MODE.FOLLOW_UP_QUESTION,
        assistantDelta: '?',
        followUpQuestion:
          'Tell me the next action you want, for example connect tools, review code, or run a task.',
        requiresConfirmation: false,
        selectedSurface: selectionMetadata.selectedSurface,
        selectedBy: selectionMetadata.sessionRoutingPreferenceApplied
          ? 'session.main.preference.follow_up'
          : 'session.main.follow_up',
        sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
      };
    }

    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      assistantDelta: 'ok',
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: selectionMetadata.selectedSurface,
      selectedBy: selectionMetadata.sessionRoutingPreferenceApplied
        ? 'session.main.preference.default'
        : 'session.main.default',
      sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
    };
  }

  private createCommandSuggestionResult(options: {
    suggestedSlashCommand: string;
    executionIntent: string;
    handoffCommandPreview: string;
    selectedSurface: string;
    selectedBy: string;
    sessionRoutingPreferenceApplied: boolean;
  }): SessionMainAgentDispatchResult {
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.COMMAND_HANDOFF_PREVIEW,
      assistantDelta: options.suggestedSlashCommand,
      suggestedSlashCommand: options.suggestedSlashCommand,
      executionIntent: options.executionIntent,
      requiresConfirmation: true,
      selectedSurface: options.selectedSurface,
      selectedBy: options.selectedBy,
      sessionRoutingPreferenceApplied: options.sessionRoutingPreferenceApplied,
      handoffCommandPreview: options.handoffCommandPreview,
      handoffBacklinks: [
        {
          kind: 'slash_command',
          label: `slash:${options.suggestedSlashCommand}`,
          target: options.suggestedSlashCommand,
        },
        {
          kind: 'execution_intent',
          label: `intent:${options.executionIntent}`,
          target: options.executionIntent,
        },
        {
          kind: 'command_preview',
          label: 'preview',
          target: options.handoffCommandPreview,
        },
      ],
    };
  }

  private resolveSelectionMetadata(preferredSurface: AdapterSurface | null): {
    selectedSurface: string;
    selectedBy: string;
    sessionRoutingPreferenceApplied: boolean;
  } {
    if (preferredSurface) {
      return {
        selectedSurface: preferredSurface,
        selectedBy: 'session.main.preference',
        sessionRoutingPreferenceApplied: true,
      };
    }

    return {
      selectedSurface: AdapterSurface.CODEX,
      selectedBy: 'session.main.intent_router',
      sessionRoutingPreferenceApplied: false,
    };
  }

  private resolvePreferredSurface(
    sessionRoutingPreference: string | undefined,
  ): AdapterSurface | null {
    if (!sessionRoutingPreference) {
      return null;
    }

    return SESSION_MAIN_ROUTING_PREFERENCE_ALIASES[sessionRoutingPreference.toLowerCase()] ?? null;
  }

  private createCommandPreview(
    baseCommand: string,
    preferredSurface: AdapterSurface | null,
  ): string {
    if (!preferredSurface) {
      return baseCommand;
    }

    return `${baseCommand} --single-tool-all-roles ${preferredSurface}`;
  }

  private includesAnyKeyword(message: string, keywords: string[]): boolean {
    return keywords.some((keyword) => message.includes(keyword));
  }

  private readOptionalString(candidate: unknown): string | undefined {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }

    return undefined;
  }
}
