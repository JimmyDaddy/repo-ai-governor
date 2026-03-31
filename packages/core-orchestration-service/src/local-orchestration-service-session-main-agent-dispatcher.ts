import { AdapterSurface, GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { SESSION_MAIN_INTERACTION_MODE, SESSION_MAIN_RESPONSE_MODE } from './constants/index.js';
import type {
  SessionMainSupervisorRuntimeContract,
  SessionMainSupervisorTurnContext,
  SessionMainSupervisorTurnOutcome,
} from './types/index.js';

const SESSION_MAIN_CONNECT_KEYWORDS = ['connect', 'adapter', 'adapters', 'tool', 'tools'];
const SESSION_MAIN_DOCTOR_KEYWORDS = ['doctor', 'diagnose', 'health', 'check environment'];
const SESSION_MAIN_VERIFY_KEYWORDS = ['verify', 'validation', 'validate'];
const SESSION_MAIN_PLAN_KEYWORDS = ['plan', 'planning', 'break down', 'task breakdown'];
const SESSION_MAIN_REVIEW_KEYWORDS = ['review', 'cr', 'code review'];
const SESSION_MAIN_RUN_KEYWORDS = ['run', 'execute', 'ship', 'implement'];
const SESSION_MAIN_FAILURE_KEYWORDS = ['simulate failure', 'force failure'];
const SESSION_MAIN_CANCEL_KEYWORDS = ['cancel this turn', 'simulate cancel'];
const SESSION_MAIN_MIN_FOLLOW_UP_LENGTH = 10;
const SESSION_MAIN_FALLBACK_ANSWER_DELTA_MAX_LENGTH = 80;
const SESSION_MAIN_ROLE_MENTION_PATTERN = /@[a-z0-9_.-]+/giu;
const SESSION_MAIN_GREETING_PATTERN =
  /^(?:(?:hi|hello|hey|greetings)(?:\s+(?:governor|agent|there))?|你好|您好|哈喽|嗨|早上好|下午好|晚上好)[!,.? ]*$/iu;
const SESSION_MAIN_ROUTING_PREFERENCE_ALIASES: Record<string, AdapterSurface> = {
  claude: AdapterSurface.CLAUDE_CODE,
  'claude-code': AdapterSurface.CLAUDE_CODE,
  codex: AdapterSurface.CODEX,
  copilot: AdapterSurface.GITHUB_COPILOT,
  'github-copilot': AdapterSurface.GITHUB_COPILOT,
  ollama: AdapterSurface.OLLAMA,
};

/**
 * Resolves one foreground `session.main` user turn into structured assistant semantics.
 *
 * Why this exists:
 * Path A needs a real service-owned main-agent dispatcher so session turns stop terminating in
 * `baseline_ack`, while keeping the implementation local, deterministic, and presenter-friendly.
 */
export class LocalOrchestrationServiceSessionMainAgentDispatcher {
  public constructor(
    private readonly sessionMainSupervisorRuntime?: SessionMainSupervisorRuntimeContract,
  ) {}

  /**
   * Resolves one plain-text user turn into structured assistant output and handoff metadata.
   * @param turnContext Service-owned turn context.
   * @returns Structured main-agent dispatch result.
   */
  public async dispatch(
    turnContext: SessionMainSupervisorTurnContext,
  ): Promise<SessionMainSupervisorTurnOutcome> {
    const normalizedMessage = turnContext.userMessage.trim();
    const normalizedLowerMessage = normalizedMessage.toLowerCase();
    const normalizedLowerMessageWithoutRoleMentions =
      this.stripRoleMentions(normalizedLowerMessage);
    const resolvedRoleMentionId =
      this.sessionMainSupervisorRuntime?.resolveMentionedRoleId?.(turnContext.userMessage) ?? null;
    const configuredRoleMentionPresent = typeof resolvedRoleMentionId === 'string';
    const sessionRoutingPreference = this.readOptionalString(
      turnContext.metadata?.sessionRoutingPreference,
    );
    const preferredSurface = this.resolvePreferredSurface(sessionRoutingPreference);
    const selectionMetadata = this.resolveSelectionMetadata(preferredSurface);

    if (
      this.includesAnyKeyword(
        normalizedLowerMessageWithoutRoleMentions,
        SESSION_MAIN_CANCEL_KEYWORDS,
      )
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        'The main-agent turn was cancelled before completion.',
      );
    }

    if (
      this.includesAnyKeyword(
        normalizedLowerMessageWithoutRoleMentions,
        SESSION_MAIN_FAILURE_KEYWORDS,
      )
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED,
        'The main-agent dispatcher rejected the turn during intent resolution.',
      );
    }

    if (
      this.includesAnyKeyword(
        normalizedLowerMessageWithoutRoleMentions,
        SESSION_MAIN_CONNECT_KEYWORDS,
      )
    ) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/connect',
        executionIntent: 'connect.adapters.bootstrap',
        routerDecisionReason: 'session.main.router.command_handoff_preview.connect',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor connect --preset multi-tool-default --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (
      this.includesAnyKeyword(
        normalizedLowerMessageWithoutRoleMentions,
        SESSION_MAIN_DOCTOR_KEYWORDS,
      )
    ) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/doctor',
        executionIntent: 'doctor.adapters',
        routerDecisionReason: 'session.main.router.command_handoff_preview.doctor',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor doctor --adapters --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (
      this.includesAnyKeyword(
        normalizedLowerMessageWithoutRoleMentions,
        SESSION_MAIN_VERIFY_KEYWORDS,
      )
    ) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/verify',
        executionIntent: 'verify.adapters',
        routerDecisionReason: 'session.main.router.command_handoff_preview.verify',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor verify --adapters --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (
      !configuredRoleMentionPresent &&
      this.includesAnyKeyword(normalizedLowerMessageWithoutRoleMentions, SESSION_MAIN_PLAN_KEYWORDS)
    ) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/plan',
        executionIntent: 'plan.generate',
        routerDecisionReason: 'session.main.router.command_handoff_preview.plan',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor plan --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (
      !configuredRoleMentionPresent &&
      this.includesAnyKeyword(
        normalizedLowerMessageWithoutRoleMentions,
        SESSION_MAIN_REVIEW_KEYWORDS,
      )
    ) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/review',
        executionIntent: 'review.start',
        routerDecisionReason: 'session.main.router.command_handoff_preview.review',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor review --output pretty',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (
      this.includesAnyKeyword(normalizedLowerMessageWithoutRoleMentions, SESSION_MAIN_RUN_KEYWORDS)
    ) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: '/run',
        executionIntent: 'run.task',
        routerDecisionReason: 'session.main.router.command_handoff_preview.run',
        handoffCommandPreview: this.createCommandPreview(
          'repo-ai-governor run --dry-run --trace',
          preferredSurface,
        ),
        ...selectionMetadata,
      });
    }

    if (
      normalizedLowerMessageWithoutRoleMentions.length < SESSION_MAIN_MIN_FOLLOW_UP_LENGTH &&
      !this.isConversationalGreeting(normalizedLowerMessageWithoutRoleMentions) &&
      !configuredRoleMentionPresent
    ) {
      return {
        responseMode: SESSION_MAIN_RESPONSE_MODE.FOLLOW_UP_QUESTION,
        interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
        assistantDelta: '?',
        routerDecisionReason: 'session.main.router.follow_up.short_input',
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

    if (this.sessionMainSupervisorRuntime) {
      return this.sessionMainSupervisorRuntime.resolveTurn({
        ...turnContext,
        selectedSurface: selectionMetadata.selectedSurface,
        selectedBy: selectionMetadata.sessionRoutingPreferenceApplied
          ? 'session.main.preference.default'
          : 'session.main.default',
        sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
      });
    }

    return this.createFallbackAnswerResult(normalizedMessage, selectionMetadata);
  }

  private createCommandSuggestionResult(options: {
    suggestedSlashCommand: string;
    executionIntent: string;
    routerDecisionReason: string;
    handoffCommandPreview: string;
    selectedSurface: string;
    selectedBy: string;
    sessionRoutingPreferenceApplied: boolean;
  }): SessionMainSupervisorTurnOutcome {
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.COMMAND_HANDOFF_PREVIEW,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.COMMAND_HANDOFF,
      assistantDelta: options.suggestedSlashCommand,
      routerDecisionReason: options.routerDecisionReason,
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

  private createFallbackAnswerResult(
    normalizedMessage: string,
    selectionMetadata: {
      selectedSurface: string;
      selectedBy: string;
      sessionRoutingPreferenceApplied: boolean;
    },
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      '## Session Main Answer',
      '',
      `I received your request: "${normalizedMessage}".`,
      '',
      `Selected surface: \`${selectionMetadata.selectedSurface}\`.`,
      '',
      'The direct-answer supervisor seam is active. Ask a specific repo question to continue, or request a governed command such as connect, doctor, verify, review, or run.',
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: 'session.main.router.direct_answer.fallback',
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: selectionMetadata.selectedSurface,
      selectedBy: selectionMetadata.sessionRoutingPreferenceApplied
        ? 'session.main.preference.default'
        : 'session.main.default',
      sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
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

  private createAssistantDelta(assistantMessage: string): string {
    const firstNonEmptyLine = assistantMessage
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    if (!firstNonEmptyLine) {
      return 'answer';
    }
    return firstNonEmptyLine.slice(0, SESSION_MAIN_FALLBACK_ANSWER_DELTA_MAX_LENGTH);
  }

  private readOptionalString(candidate: unknown): string | undefined {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }

    return undefined;
  }

  private stripRoleMentions(message: string): string {
    return message.replaceAll(SESSION_MAIN_ROLE_MENTION_PATTERN, '').trim();
  }

  private isConversationalGreeting(message: string): boolean {
    return SESSION_MAIN_GREETING_PATTERN.test(message.trim());
  }
}
