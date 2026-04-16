import {
  AdapterSurface,
  DEFAULT_I18N_LOCALE,
  DEFAULT_I18N_RUNTIME_CONFIG,
  GovernorErrorCode,
  I18nRuntime,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME,
  SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID,
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_DELIVERY_WORKFLOW_VERSION,
  SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS,
  SESSION_MAIN_CAPABILITY_ID,
  SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY,
  SESSION_MAIN_INTERACTION_MODE,
  SESSION_MAIN_RESPONSE_MODE,
} from './constants/index.js';
import { LocalOrchestrationServiceSessionMainCapabilityAvailabilityResolver } from './local-orchestration-service-session-main-capability-availability-resolver.js';
import { LocalOrchestrationServiceSessionMainCapabilityCatalog } from './local-orchestration-service-session-main-capability-catalog.js';
import { LocalOrchestrationServiceSessionMainCapabilityExplainer } from './local-orchestration-service-session-main-capability-explainer.js';
import { LocalOrchestrationServiceSessionMainSkillRegistry } from './local-orchestration-service-session-main-skill-registry.js';
import type {
  SessionMainCapabilityAvailability,
  SessionMainCapabilityId,
  SessionMainSupervisorRuntimeContract,
  SessionMainSupervisorTurnContext,
  SessionMainSupervisorTurnOutcome,
} from './types/index.js';

const SESSION_MAIN_FAILURE_KEYWORDS = ['simulate failure', 'force failure'];
const SESSION_MAIN_CANCEL_KEYWORDS = ['cancel this turn', 'simulate cancel'];
const SESSION_MAIN_FALLBACK_ANSWER_DELTA_MAX_LENGTH = 80;
const SESSION_MAIN_ROLE_MENTION_PATTERN = /(^|[\s([{])@[a-z0-9_.-]+/giu;
const SESSION_MAIN_ROLE_MENTION_PRESENCE_PATTERN = /(^|[\s([{])@[a-z0-9_.-]+/iu;
const SESSION_MAIN_IMPLICIT_PLANNER_ROLE_ID = 'planner';
const SESSION_MAIN_GREETING_PATTERN =
  /^(?:(?:hi|hello|hey|greetings)(?:\s+(?:governor|agent|there))?|你好|您好|哈喽|嗨|早上好|下午好|晚上好)[!,.? ]*$/iu;
const SESSION_MAIN_FOLLOW_UP_PATTERN =
  /^(?:(?:继续|然后呢|下一步|接下来呢)|(?:next|what next|and then)\??)$|^(?:继续说|再继续一下)$|^(?:那然后呢)$|^(?:next step\??)$/iu;
const SESSION_MAIN_SPLIT_INTENT_SEGMENT_SEPARATOR =
  /\s*(?:,|，|;|；|然后|顺便|再帮我|再替我|接着|and then|then)\s*/iu;
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
  private readonly capabilityCatalog = new LocalOrchestrationServiceSessionMainCapabilityCatalog();

  private readonly capabilityAvailabilityResolver =
    new LocalOrchestrationServiceSessionMainCapabilityAvailabilityResolver();

  private readonly capabilityExplainer =
    new LocalOrchestrationServiceSessionMainCapabilityExplainer();

  private readonly skillRegistry = new LocalOrchestrationServiceSessionMainSkillRegistry();

  private readonly translateRuntimeCache = new Map<string, Promise<I18nRuntime>>();

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
    const normalizedMessageWithoutRoleMentions = this.stripRoleMentions(normalizedMessage);
    const normalizedLowerMessageWithoutRoleMentions =
      normalizedMessageWithoutRoleMentions.toLowerCase();
    const hasAnyRoleMention = SESSION_MAIN_ROLE_MENTION_PRESENCE_PATTERN.test(
      turnContext.userMessage,
    );
    const resolvedRoleMentionId =
      this.sessionMainSupervisorRuntime?.resolveMentionedRoleId?.(turnContext.userMessage) ?? null;
    const configuredRoleMentionPresent = typeof resolvedRoleMentionId === 'string';
    const sessionRoutingPreference = this.readOptionalString(
      turnContext.metadata?.sessionRoutingPreference,
    );
    const preferredSurface = this.resolvePreferredSurface(sessionRoutingPreference);
    const selectionMetadata = this.resolveSelectionMetadata(preferredSurface);
    const splitIntentSkillPlan = this.resolveSplitIntentSkillPlan(
      normalizedMessageWithoutRoleMentions,
      {
        preferredSurface,
        configuredRoleMentionPresent,
      },
    );

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

    const provisionalCapabilityAnswer = await this.capabilityExplainer.resolveAnswer(
      normalizedMessageWithoutRoleMentions,
      {
        locale: turnContext.locale,
      },
    );
    if (provisionalCapabilityAnswer) {
      const bridgeCapabilityId = splitIntentSkillPlan
        ? this.resolveCapabilityIdFromSlashCommand(splitIntentSkillPlan.suggestedSlashCommand)
        : null;
      const availabilityOverlay = await this.resolveCapabilityAvailability(
        turnContext,
        [
          ...provisionalCapabilityAnswer.referencedCapabilityIds,
          ...(bridgeCapabilityId ? [bridgeCapabilityId] : []),
        ],
        selectionMetadata,
      );
      const capabilityAnswer =
        (await this.capabilityExplainer.resolveAnswer(normalizedMessageWithoutRoleMentions, {
          locale: turnContext.locale,
          availabilityOverlay,
        })) ?? provisionalCapabilityAnswer;
      if (
        splitIntentSkillPlan &&
        bridgeCapabilityId &&
        this.isCapabilityBridgeAvailabilityReady(availabilityOverlay, bridgeCapabilityId) &&
        this.sessionMainSupervisorRuntime &&
        !hasAnyRoleMention
      ) {
        const implicitRoleDelegateId = this.resolveImplicitRoleDelegateId(
          splitIntentSkillPlan.executionIntent,
        );
        if (implicitRoleDelegateId) {
          return this.sessionMainSupervisorRuntime.resolveTurn({
            ...turnContext,
            selectedSurface: selectionMetadata.selectedSurface,
            selectedBy: selectionMetadata.selectedBy,
            sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
            metadata: {
              ...(turnContext.metadata ? { ...turnContext.metadata } : {}),
              [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: implicitRoleDelegateId,
            },
          });
        }
      }
      const bridgeCandidate =
        splitIntentSkillPlan && bridgeCapabilityId
          ? await this.resolveCapabilityBridgeOutcome(
              capabilityAnswer,
              availabilityOverlay,
              bridgeCapabilityId,
              splitIntentSkillPlan,
              turnContext,
              selectionMetadata,
            )
          : null;
      if (bridgeCandidate) {
        return bridgeCandidate;
      }

      return {
        responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
        interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
        assistantDelta: capabilityAnswer.assistantDelta,
        assistantMessage: capabilityAnswer.assistantMessage,
        capabilityAnswerKind: capabilityAnswer.answerKind,
        referencedCapabilityIds: [...capabilityAnswer.referencedCapabilityIds],
        suggestedActions: capabilityAnswer.suggestedActions.map((suggestedAction) => ({
          ...suggestedAction,
        })),
        routerDecisionReason: capabilityAnswer.routerDecisionReason,
        executionIntent: 'session.capability_explainer',
        requiresConfirmation: false,
        selectedSurface: selectionMetadata.selectedSurface,
        selectedBy: selectionMetadata.selectedBy,
        sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
        invokedRoleIds: [],
      };
    }

    const skillPlan = this.skillRegistry.resolvePlan(normalizedMessageWithoutRoleMentions, {
      preferredSurface,
      configuredRoleMentionPresent,
    });
    if (skillPlan && this.isDeliverWorkflowIntent(skillPlan.executionIntent)) {
      return this.createDeliverWorkflowOutcome({
        turnContext,
        selectionMetadata,
        skillPlan,
      });
    }
    const implicitRoleDelegateId =
      skillPlan && !hasAnyRoleMention
        ? this.resolveImplicitRoleDelegateId(skillPlan.executionIntent)
        : null;
    if (implicitRoleDelegateId && this.sessionMainSupervisorRuntime) {
      return this.sessionMainSupervisorRuntime.resolveTurn({
        ...turnContext,
        selectedSurface: selectionMetadata.selectedSurface,
        selectedBy: selectionMetadata.sessionRoutingPreferenceApplied
          ? 'session.main.preference.default'
          : 'session.main.default',
        sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
        metadata: {
          ...(turnContext.metadata ? { ...turnContext.metadata } : {}),
          [SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY]: implicitRoleDelegateId,
        },
      });
    }
    if (skillPlan) {
      return this.createCommandSuggestionResult({
        suggestedSlashCommand: skillPlan.suggestedSlashCommand,
        executionIntent: skillPlan.executionIntent,
        routerDecisionReason: skillPlan.routerDecisionReason,
        handoffCommandPreview: skillPlan.handoffCommandPreview,
        requiresConfirmation: skillPlan.handoffExecutionMode === 'preview_confirm',
        skillId: skillPlan.skillId,
        skillVersion: skillPlan.skillVersion,
        handoffExecutionMode: skillPlan.handoffExecutionMode,
        commandBatches: skillPlan.commandBatches,
        handoffBacklinks: skillPlan.handoffBacklinks,
        ...selectionMetadata,
      });
    }

    if (
      this.isFollowUpContinuation(normalizedLowerMessageWithoutRoleMentions) &&
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
    requiresConfirmation: boolean;
    assistantMessage?: string;
    skillId?: string;
    skillVersion?: string;
    handoffExecutionMode?: 'preview_confirm' | 'direct_execute';
    commandBatches?: Array<{
      slashQuery: string;
      bridgeArgv: string[];
      previewCommandLine: string;
    }>;
    handoffBacklinks?: Array<{
      kind: 'slash_command' | 'execution_intent' | 'command_preview' | 'artifact';
      label: string;
      target: string;
    }>;
    selectedSurface: string;
    selectedBy: string;
    sessionRoutingPreferenceApplied: boolean;
  }): SessionMainSupervisorTurnOutcome {
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.COMMAND_HANDOFF_PREVIEW,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.COMMAND_HANDOFF,
      assistantDelta: options.suggestedSlashCommand,
      ...(options.assistantMessage ? { assistantMessage: options.assistantMessage } : {}),
      routerDecisionReason: options.routerDecisionReason,
      suggestedSlashCommand: options.suggestedSlashCommand,
      executionIntent: options.executionIntent,
      requiresConfirmation: options.requiresConfirmation,
      selectedSurface: options.selectedSurface,
      selectedBy: options.selectedBy,
      sessionRoutingPreferenceApplied: options.sessionRoutingPreferenceApplied,
      ...(options.skillId ? { skillId: options.skillId } : {}),
      ...(options.skillVersion ? { skillVersion: options.skillVersion } : {}),
      ...(options.handoffExecutionMode
        ? { handoffExecutionMode: options.handoffExecutionMode }
        : {}),
      ...(options.commandBatches
        ? {
            commandBatches: options.commandBatches.map((commandBatch) => ({
              ...commandBatch,
              bridgeArgv: [...commandBatch.bridgeArgv],
            })),
          }
        : {}),
      handoffCommandPreview: options.handoffCommandPreview,
      handoffBacklinks: options.handoffBacklinks ?? [
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

  private async resolveCapabilityAvailability(
    turnContext: SessionMainSupervisorTurnContext,
    capabilityIds: readonly SessionMainCapabilityId[],
    selectionMetadata: {
      selectedSurface: string;
      selectedBy: string;
      sessionRoutingPreferenceApplied: boolean;
    },
  ): Promise<SessionMainCapabilityAvailability[]> {
    const uniqueCapabilityIds = [...new Set(capabilityIds)];
    if (uniqueCapabilityIds.length === 0) {
      return [];
    }

    const runtimeAvailability =
      (await this.sessionMainSupervisorRuntime?.resolveCapabilityAvailability?.(
        {
          ...turnContext,
          selectedSurface: selectionMetadata.selectedSurface,
          selectedBy: selectionMetadata.selectedBy,
          sessionRoutingPreferenceApplied: selectionMetadata.sessionRoutingPreferenceApplied,
        },
        uniqueCapabilityIds,
      )) ?? [];

    return this.capabilityAvailabilityResolver.resolveAvailability(uniqueCapabilityIds, {
      runtimeAvailability,
      selectedSurface: selectionMetadata.selectedSurface,
      selectedBy: selectionMetadata.selectedBy,
    });
  }

  private async resolveCapabilityBridgeOutcome(
    capabilityAnswer: {
      assistantMessage: string;
    },
    availabilityOverlay: readonly SessionMainCapabilityAvailability[],
    capabilityId: SessionMainCapabilityId,
    skillPlan: {
      suggestedSlashCommand: string;
      executionIntent: string;
      routerDecisionReason: string;
      handoffCommandPreview: string;
      handoffExecutionMode: 'preview_confirm' | 'direct_execute';
      commandBatches: Array<{
        slashQuery: string;
        bridgeArgv: string[];
        previewCommandLine: string;
      }>;
      handoffBacklinks: Array<{
        kind: 'slash_command' | 'execution_intent' | 'command_preview' | 'artifact';
        label: string;
        target: string;
      }>;
      skillId: string;
      skillVersion: string;
    },
    turnContext: SessionMainSupervisorTurnContext,
    selectionMetadata: {
      selectedSurface: string;
      selectedBy: string;
      sessionRoutingPreferenceApplied: boolean;
    },
  ): Promise<SessionMainSupervisorTurnOutcome | null> {
    if (
      capabilityId === SESSION_MAIN_CAPABILITY_ID.DELIVER &&
      this.isDeliverWorkflowIntent(skillPlan.executionIntent)
    ) {
      return this.createDeliverWorkflowOutcome({
        turnContext,
        selectionMetadata,
        skillPlan,
        assistantMessagePrefix: capabilityAnswer.assistantMessage,
      });
    }

    if (!this.isCapabilityBridgeAvailabilityReady(availabilityOverlay, capabilityId)) {
      return null;
    }

    return this.createCommandSuggestionResult({
      suggestedSlashCommand: skillPlan.suggestedSlashCommand,
      executionIntent: skillPlan.executionIntent,
      routerDecisionReason: skillPlan.routerDecisionReason.replace(
        'session.main.router.',
        'session.main.router.capability_bridge.',
      ),
      handoffCommandPreview: skillPlan.handoffCommandPreview,
      requiresConfirmation: skillPlan.handoffExecutionMode === 'preview_confirm',
      assistantMessage: capabilityAnswer.assistantMessage,
      skillId: skillPlan.skillId,
      skillVersion: skillPlan.skillVersion,
      handoffExecutionMode: skillPlan.handoffExecutionMode,
      commandBatches: skillPlan.commandBatches,
      handoffBacklinks: skillPlan.handoffBacklinks,
      ...selectionMetadata,
    });
  }

  private isCapabilityBridgeAvailabilityReady(
    availabilityOverlay: readonly SessionMainCapabilityAvailability[],
    capabilityId: SessionMainCapabilityId,
  ): boolean {
    const availability = availabilityOverlay.find(
      (candidateAvailability) => candidateAvailability.capabilityId === capabilityId,
    );
    return availability?.status === SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE;
  }

  private resolveSplitIntentSkillPlan(
    userMessage: string,
    options: {
      preferredSurface: AdapterSurface | null;
      configuredRoleMentionPresent: boolean;
    },
  ) {
    const segments = userMessage
      .split(SESSION_MAIN_SPLIT_INTENT_SEGMENT_SEPARATOR)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
    if (segments.length < 2) {
      return null;
    }

    for (const segment of segments.slice(1)) {
      const plan = this.skillRegistry.resolvePlan(segment, options);
      if (plan) {
        return plan;
      }
    }

    return null;
  }

  private resolveCapabilityIdFromSlashCommand(
    suggestedSlashCommand: string,
  ): SessionMainCapabilityId | null {
    const descriptorSeed =
      this.capabilityCatalog
        .listDescriptorSeeds()
        .find(
          (candidateDescriptorSeed) =>
            candidateDescriptorSeed.suggestedSlashCommand === suggestedSlashCommand,
        ) ?? null;
    return descriptorSeed?.capabilityId ?? null;
  }

  private async createDeliverWorkflowOutcome(options: {
    turnContext: SessionMainSupervisorTurnContext;
    selectionMetadata: {
      selectedSurface: string;
      selectedBy: string;
      sessionRoutingPreferenceApplied: boolean;
    };
    skillPlan: {
      executionIntent: string;
      handoffExecutionMode: 'preview_confirm' | 'direct_execute';
      skillId: string;
      skillVersion: string;
    };
    assistantMessagePrefix?: string;
  }): Promise<SessionMainSupervisorTurnOutcome> {
    const translate = await this.resolveTranslate(options.turnContext.locale);
    const deliveryWorkflowStateResolution = this.resolveDeliverWorkflowState(options.turnContext);
    const deliveryWorkflowState = deliveryWorkflowStateResolution.state;
    const assistantMessageSuffix = deliveryWorkflowStateResolution.reusedExistingState
      ? deliveryWorkflowState.pendingAction
        ? translate('sessionMainDispatcher.deliver.resumedMessageWithAction', {
            phase: deliveryWorkflowState.currentPhase,
            pendingAction: deliveryWorkflowState.pendingAction,
          })
        : translate('sessionMainDispatcher.deliver.resumedMessage', {
            phase: deliveryWorkflowState.currentPhase,
          })
      : translate('sessionMainDispatcher.deliver.startedMessage');
    const assistantMessage = [options.assistantMessagePrefix, assistantMessageSuffix]
      .filter((candidate): candidate is string => Boolean(candidate))
      .join('\n\n');

    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      assistantDelta: translate(
        deliveryWorkflowStateResolution.reusedExistingState
          ? 'sessionMainDispatcher.deliver.resumedDelta'
          : 'sessionMainDispatcher.deliver.startedDelta',
      ),
      assistantMessage,
      routerDecisionReason: 'session.main.router.delivery_workflow.start',
      executionIntent: options.skillPlan.executionIntent,
      requiresConfirmation: false,
      selectedSurface: options.selectionMetadata.selectedSurface,
      selectedBy: options.selectionMetadata.selectedBy,
      sessionRoutingPreferenceApplied: options.selectionMetadata.sessionRoutingPreferenceApplied,
      referencedCapabilityIds: [SESSION_MAIN_CAPABILITY_ID.DELIVER],
      skillId: options.skillPlan.skillId,
      skillVersion: options.skillPlan.skillVersion,
      handoffExecutionMode: options.skillPlan.handoffExecutionMode,
      deliveryWorkflowState,
      invokedRoleIds: [],
    };
  }

  private resolveImplicitRoleDelegateId(executionIntent: string): string | null {
    if (executionIntent === 'plan.generate') {
      return SESSION_MAIN_IMPLICIT_PLANNER_ROLE_ID;
    }
    return null;
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
      'The direct-answer supervisor seam is active. Ask a specific repo question to continue, or request a governed command such as connect, doctor, plan, review, workflow, or run.',
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

  private isDeliverWorkflowIntent(executionIntent: string): boolean {
    return executionIntent === 'deliver.requirement_to_cr';
  }

  private resolveDeliverWorkflowState(turnContext: SessionMainSupervisorTurnContext): {
    state: NonNullable<SessionMainSupervisorTurnContext['deliveryWorkflowState']>;
    reusedExistingState: boolean;
  } {
    const existingState = turnContext.deliveryWorkflowState;
    if (
      existingState?.capabilityId === SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER &&
      existingState.currentPhase !== SESSION_DELIVERY_WORKFLOW_PHASE.RESOLVED &&
      existingState.currentPhase !== SESSION_DELIVERY_WORKFLOW_PHASE.BLOCKED
    ) {
      return {
        state: {
          ...existingState,
          requirementReviewGate: {
            ...existingState.requirementReviewGate,
          },
          relatedArtifactPaths: [...existingState.relatedArtifactPaths],
          childWorkflowBacklinks: existingState.childWorkflowBacklinks.map((backlink) => ({
            ...backlink,
          })),
        },
        reusedExistingState: true,
      };
    }

    return {
      state: {
        version: SESSION_DELIVERY_WORKFLOW_VERSION,
        workflowId: `delivery-workflow-${turnContext.sessionId}-${turnContext.turnId}`,
        capabilityId: SESSION_DELIVERY_WORKFLOW_CAPABILITY_ID.DELIVER,
        currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REQUIREMENT_CAPTURE,
        requirementReviewGate: {
          outcome: SESSION_DELIVERY_REQUIREMENT_REVIEW_OUTCOME.PENDING,
          evidenceArtifactPath: null,
        },
        approvedDeliveryBriefPath: null,
        pendingAction: 'capture_requirement_or_attach_approved_brief',
        selectedTargetStream: null,
        relatedArtifactPaths: [],
        childWorkflowBacklinks: [],
        blockedReason: null,
        resultSummary: null,
      },
      reusedExistingState: false,
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

  private async resolveTranslate(
    requestedLocale?: string,
  ): Promise<(translationKey: string, interpolation?: Record<string, string>) => string> {
    const runtime = await this.resolveTranslateRuntime(requestedLocale);
    return (translationKey: string, interpolation?: Record<string, string>) =>
      runtime.t(translationKey, interpolation);
  }

  private resolveTranslateRuntime(requestedLocale?: string): Promise<I18nRuntime> {
    const cacheKey = requestedLocale?.trim() || DEFAULT_I18N_LOCALE;
    const cachedRuntime = this.translateRuntimeCache.get(cacheKey);
    if (cachedRuntime) {
      return cachedRuntime;
    }

    const runtimePromise = (async () => {
      const runtime = new I18nRuntime();
      await runtime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, cacheKey);
      return runtime;
    })().catch((error) => {
      this.translateRuntimeCache.delete(cacheKey);
      throw error;
    });

    this.translateRuntimeCache.set(cacheKey, runtimePromise);
    return runtimePromise;
  }

  private readOptionalString(candidate: unknown): string | undefined {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }

    return undefined;
  }

  private stripRoleMentions(message: string): string {
    return message
      .replaceAll(SESSION_MAIN_ROLE_MENTION_PATTERN, '$1')
      .replace(/\s{2,}/gu, ' ')
      .trim();
  }

  private isConversationalGreeting(message: string): boolean {
    return SESSION_MAIN_GREETING_PATTERN.test(message.trim());
  }

  private isFollowUpContinuation(message: string): boolean {
    return SESSION_MAIN_FOLLOW_UP_PATTERN.test(message.trim());
  }
}
