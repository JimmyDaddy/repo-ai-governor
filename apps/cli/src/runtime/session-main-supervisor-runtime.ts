import type { ClaudeCodeExecRunner } from '@repo-ai-governor/adapter-claude-code';
import type { CodexExecRunner } from '@repo-ai-governor/adapter-codex';
import type { GithubCopilotExecRunner } from '@repo-ai-governor/adapter-github-copilot';
import {
  AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY,
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilityEvaluator,
  type AgentCapabilityRequirement,
  AgentCapabilitySupportLevel,
  AgentNetworkMode,
  type AgentProbeResult,
  type AgentProtocolContract,
  AgentRouteRunner,
  AgentRouteSelectionSource,
  AgentStageExecutionMode,
  AgentStageToolUsePolicy,
  AgentStreamEventType,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig, ResolvedWorkspace } from '@repo-ai-governor/config';
import {
  SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS,
  SESSION_MAIN_CAPABILITY_ID,
  SESSION_MAIN_INTERACTION_MODE,
  SESSION_MAIN_RESPONSE_MODE,
} from '@repo-ai-governor/core-orchestration-service/constants';
import type {
  SessionMainCapabilityAvailability,
  SessionMainCapabilityId,
  SessionMainSupervisorInvokeLiveness,
  SessionMainSupervisorInvokedRole,
  SessionMainSupervisorRuntimeContract,
  SessionMainSupervisorStreamEvent,
  SessionMainSupervisorTurnContext,
  SessionMainSupervisorTurnOutcome,
} from '@repo-ai-governor/core-orchestration-service/types';
import { AdapterSurface, standardizeError } from '@repo-ai-governor/shared';
import type { SessionMainSubagentDescriptor } from '../types/index.js';
import { CliAdapterRoutingRuntime } from './adapter-routing-runtime.js';
import { CliSessionMainSubagentRegistry } from './session-main-subagent-registry.js';

const SESSION_MAIN_ANSWER_ROUTE_KEY = 'session.main.answer';
const SESSION_MAIN_ANSWER_STAGE_ID = 'stage-session-main-answer';
const SESSION_MAIN_ANSWER_PREFLIGHT_ACTIVITY_KEY = 'session.main.answer.preflight';
const SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY = 'implicitRoleDelegateRoleId';
const SESSION_MAIN_REPOSITORY_REVIEW_SCOPE = 'uncommitted_changes';
const SESSION_MAIN_FALLBACK_DELTA_MAX_LENGTH = 80;
const SESSION_MAIN_GUARDED_DIRECT_ANSWER_SURFACE = 'guarded-direct-answer';
const SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE = 'guarded-role-delegate';
const SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX = 'session.role_delegate.';
const SESSION_MAIN_ROUTER_REASON_DIRECT_ANSWER = 'session.main.router.direct_answer.default';
const SESSION_MAIN_ROUTER_REASON_DIRECT_ANSWER_SURFACE_AVAILABILITY =
  'session.main.router.direct_answer.surface_availability_probe';
const SESSION_MAIN_ROUTER_REASON_DIRECT_ANSWER_GUARD = 'session.main.router.direct_answer.guard';
const SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_DELEGATE =
  'session.main.router.single_role_delegate.explicit_role';
const SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_DELEGATE_IMPLICIT =
  'session.main.router.single_role_delegate.implicit_role';
const SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_GUARD =
  'session.main.router.single_role_delegate.guard';
const SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_UNRESOLVED =
  'session.main.router.single_role_delegate.unresolved';
const SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_COLLABORATION =
  'session.main.router.serial_role_collaboration.explicit_roles';
const SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_GUARD =
  'session.main.router.serial_role_collaboration.guard';
const SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_OVERFLOW =
  'session.main.router.serial_role_collaboration.overflow';
const SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_UNRESOLVED =
  'session.main.router.serial_role_collaboration.unresolved';
const SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_FANOUT =
  'session.main.router.parallel_role_fanout.explicit_roles';
const SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_GUARD =
  'session.main.router.parallel_role_fanout.guard';
const SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_OVERFLOW =
  'session.main.router.parallel_role_fanout.overflow';
const SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_UNRESOLVED =
  'session.main.router.parallel_role_fanout.unresolved';
const SESSION_MAIN_PARALLEL_ANALYSIS_SYNTHESIS_MODE = 'parallel_analysis';
const SESSION_MAIN_SERIAL_ROLE_COLLABORATION_LIMIT = 2;
const SESSION_MAIN_PARALLEL_ROLE_FANOUT_LIMIT = 3;
const SESSION_MAIN_SURFACE_AVAILABILITY_SELECTED_BY =
  'session.main.answer.surface_availability_probe';
const SESSION_MAIN_SURFACE_AVAILABILITY_EXECUTION_INTENT = 'session.answer.surface_availability';
const SESSION_MAIN_REPOSITORY_REVIEW_CAPABLE_SURFACES = new Set<AdapterSurface>([
  AdapterSurface.CODEX,
  AdapterSurface.CLAUDE_CODE,
  AdapterSurface.GITHUB_COPILOT,
]);
// `plan` / `review_verify` remain local CLI flows and should stay available without adapter setup.
const SESSION_MAIN_SURFACE_DEPENDENT_CAPABILITY_IDS = new Set<SessionMainCapabilityId>([
  SESSION_MAIN_CAPABILITY_ID.REVIEW,
  SESSION_MAIN_CAPABILITY_ID.RUN,
]);

interface SessionMainCapabilitySurfaceAvailabilityFact {
  surface: AdapterSurface;
  availabilityStatus: AgentAvailabilityStatus;
  detail: string | null;
}

interface PreparedRoleDispatch {
  descriptor: SessionMainSubagentDescriptor;
  capabilityRequirement?: AgentCapabilityRequirement;
  safeCandidateSurfaces: AdapterSurface[];
}

interface ExecutedRoleDispatch {
  descriptor: SessionMainSubagentDescriptor;
  assistantMessage: string;
  selectedSurface: string;
  selectedBy: string;
}

interface ProtocolStreamRelayState {
  emittedCount: number;
  sawLifecycle: boolean;
  sawToken: boolean;
  sawToolCall: boolean;
}

interface SurfaceProbeStreamContext {
  context: SessionMainSupervisorTurnContext;
  title: string;
  stageId: string;
  routeKey: string;
  roleId?: string;
}

interface CandidateSurfaceEvaluation {
  surface: AdapterSurface;
  safe: boolean;
  executionDetailsLine?: string;
}

interface SurfaceAvailabilityInspectionIntent {
  surface: AdapterSurface;
  displayName: string;
}

/**
 * Owns the CLI-side direct-answer runtime used by the service-owned `session.main` supervisor.
 *
 * Why this exists:
 * `core-orchestration-service` must stay runtime-owner only, while real adapter route selection
 * and protocol construction still live in CLI-local adapter routing code during the bootstrap phase.
 */
export class CliSessionMainSupervisorRuntime implements SessionMainSupervisorRuntimeContract {
  private readonly adapterRoutingRuntime: CliAdapterRoutingRuntime;
  private readonly subagentRegistry: CliSessionMainSubagentRegistry;
  private readonly capabilityEvaluator = new AgentCapabilityEvaluator();

  public constructor(
    private readonly options: {
      workspaceRoot: string;
      currentWorkingDirectory: string;
      workspace: Pick<ResolvedWorkspace, 'workspaceId' | 'mode'>;
      locale: string;
      adaptersConfig: AdaptersConfig;
      adapterRoutingRuntime?: CliAdapterRoutingRuntime;
      adapterRoutingRuntimeCacheNamespace?: string;
      subagentRegistry?: CliSessionMainSubagentRegistry;
      claudeCodeExecRunner?: ClaudeCodeExecRunner;
      codexExecRunner?: CodexExecRunner;
      githubCopilotExecRunner?: GithubCopilotExecRunner;
    },
  ) {
    this.adapterRoutingRuntime =
      options.adapterRoutingRuntime ??
      new CliAdapterRoutingRuntime(options.adaptersConfig, {
        claudeCodeExecRunner: options.claudeCodeExecRunner,
        codexExecRunner: options.codexExecRunner,
        githubCopilotExecRunner: options.githubCopilotExecRunner,
        sharedProtocolCacheNamespace: options.adapterRoutingRuntimeCacheNamespace,
      });
    this.subagentRegistry =
      options.subagentRegistry ??
      new CliSessionMainSubagentRegistry({
        adaptersConfig: options.adaptersConfig,
        workspace: options.workspace,
      });
  }

  /**
   * Resolves one direct-answer turn by dispatching it through the CLI adapter route runner.
   * @param context Service-owned turn context.
   * @returns Direct-answer supervisor outcome projected into shared session truth.
   */
  public async resolveTurn(
    context: SessionMainSupervisorTurnContext,
  ): Promise<SessionMainSupervisorTurnOutcome> {
    const toolConfigBySurface = this.adapterRoutingRuntime.createToolConfigBySurfaceMap();
    const protocolBySurface =
      this.adapterRoutingRuntime.createProtocolBySurface(toolConfigBySurface);
    const mentionedRoleIds = this.subagentRegistry.resolveMentionedRoleIds(context.userMessage);
    const implicitRoleDelegateId = this.readOptionalString(
      context.metadata?.[SESSION_MAIN_IMPLICIT_ROLE_DELEGATE_METADATA_KEY],
    );
    const parallelAnalysisRequest = this.isParallelAnalysisRequest(context.userMessage);
    if (mentionedRoleIds.length >= 2) {
      if (
        parallelAnalysisRequest &&
        mentionedRoleIds.length > SESSION_MAIN_PARALLEL_ROLE_FANOUT_LIMIT
      ) {
        return this.createOverflowParallelRoleFanoutOutcome(context, mentionedRoleIds);
      }
      if (parallelAnalysisRequest) {
        return this.resolveParallelRoleFanoutTurn(
          context,
          mentionedRoleIds.slice(0, SESSION_MAIN_PARALLEL_ROLE_FANOUT_LIMIT),
          protocolBySurface,
          toolConfigBySurface,
        );
      }
      if (mentionedRoleIds.length > SESSION_MAIN_SERIAL_ROLE_COLLABORATION_LIMIT) {
        return this.createOverflowSerialRoleCollaborationOutcome(context, mentionedRoleIds);
      }
      return this.resolveSerialRoleCollaborationTurn(
        context,
        mentionedRoleIds.slice(0, SESSION_MAIN_SERIAL_ROLE_COLLABORATION_LIMIT),
        protocolBySurface,
        toolConfigBySurface,
      );
    }
    const mentionedRoleId = mentionedRoleIds[0] ?? null;
    if (mentionedRoleId) {
      return this.resolveSingleRoleDelegateTurn(
        context,
        mentionedRoleId,
        protocolBySurface,
        toolConfigBySurface,
      );
    }
    if (implicitRoleDelegateId) {
      return this.resolveSingleRoleDelegateTurn(
        context,
        implicitRoleDelegateId,
        protocolBySurface,
        toolConfigBySurface,
        {
          allowToolCapableSurfaces: true,
          routerDecisionReason: SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_DELEGATE_IMPLICIT,
        },
      );
    }
    const surfaceAvailabilityInspectionIntent = this.resolveSurfaceAvailabilityInspectionIntent(
      context.userMessage,
    );
    if (surfaceAvailabilityInspectionIntent) {
      return this.resolveSurfaceAvailabilityInspectionTurn(
        context,
        surfaceAvailabilityInspectionIntent,
        protocolBySurface,
        toolConfigBySurface,
      );
    }
    const trackedSurfaces =
      this.adapterRoutingRuntime.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'started',
      title: this.localizeText('Session Main Answer', '主会话回答'),
      detail: this.localizeText(
        'The supervisor is checking available direct-answer surfaces.',
        'supervisor 正在检查可用的 direct-answer surface。',
      ),
      activityKey: SESSION_MAIN_ANSWER_PREFLIGHT_ACTIVITY_KEY,
      stageId: SESSION_MAIN_ANSWER_STAGE_ID,
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      ...(context.selectedSurface.trim().length > 0
        ? {
            selectedSurface: context.selectedSurface,
          }
        : {}),
    });
    const directAnswerCandidateSurfaces = this.resolveCandidateSurfaces(
      context.selectedSurface,
      trackedSurfaces,
    );
    const directAnswerPreflightStartedAtMs = Date.now();
    const directAnswerSurfaceEvaluation = await this.evaluateCandidateSurfaces(
      directAnswerCandidateSurfaces,
      SESSION_MAIN_ANSWER_ROUTE_KEY,
      protocolBySurface,
      undefined,
      {
        allowToolCapableSurfaces: true,
        streamContext: {
          context,
          title: this.localizeText('Session Main Answer', '主会话回答'),
          stageId: SESSION_MAIN_ANSWER_STAGE_ID,
          routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
        },
      },
    );
    const directAnswerPreflightElapsedMs = Math.max(
      Date.now() - directAnswerPreflightStartedAtMs,
      0,
    );
    const preflightExecutionDetailsLines = this.buildDirectAnswerPreflightExecutionDetailsLines({
      candidateSurfaceCount: directAnswerCandidateSurfaces.length,
      eligibleSurfaceCount: directAnswerSurfaceEvaluation.safeCandidateSurfaces.length,
      elapsedMs: directAnswerPreflightElapsedMs,
      probeDetailsLines: directAnswerSurfaceEvaluation.executionDetailsLines,
    });
    const safeCandidateSurfaces = directAnswerSurfaceEvaluation.safeCandidateSurfaces;
    if (safeCandidateSurfaces.length === 0) {
      await this.publishStreamEvent(context, {
        kind: 'lifecycle',
        state: 'failed',
        title: this.localizeText('Session Main Answer', '主会话回答'),
        detail: this.localizeText(
          'No eligible direct-answer surface passed preflight checks.',
          '没有任何 direct-answer surface 通过本轮预检。',
        ),
        activityKey: SESSION_MAIN_ANSWER_PREFLIGHT_ACTIVITY_KEY,
        stageId: SESSION_MAIN_ANSWER_STAGE_ID,
        routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      });
      return this.createGuardedFallbackOutcome(context, preflightExecutionDetailsLines);
    }
    const routeRunner = this.createRouteRunner({
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      protocolBySurface,
      safeCandidateSurfaces,
      toolConfigBySurface,
    });
    const answerInput = this.createAnswerInput(context);
    const primaryAnswerSurface = safeCandidateSurfaces[0] ?? AdapterSurface.CODEX;
    const relayState = this.createProtocolStreamRelayState();
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'running',
      title: this.localizeText('Session Main Answer', '主会话回答'),
      detail: this.localizeText(
        'The supervisor is preparing a direct answer.',
        'supervisor 正在准备 direct answer。',
      ),
      activityKey: SESSION_MAIN_ANSWER_PREFLIGHT_ACTIVITY_KEY,
      stageId: SESSION_MAIN_ANSWER_STAGE_ID,
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      selectedSurface: primaryAnswerSurface,
    });
    const dispatchRequest = {
      processId: context.sessionId,
      executionId: context.turnId,
      stageId: SESSION_MAIN_ANSWER_STAGE_ID,
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      input: answerInput,
      runtimeContext: {
        networkMode: AgentNetworkMode.STANDARD,
      },
    };
    const relayPromise = this.relayProtocolStreamEvents(
      context,
      protocolBySurface[primaryAnswerSurface],
      dispatchRequest,
      relayState,
    );
    const directAnswerInvokeStartedAtMs = Date.now();
    let dispatchResult: Awaited<ReturnType<typeof routeRunner.dispatchStage>>;
    try {
      dispatchResult = await routeRunner.dispatchStage(dispatchRequest);
    } catch (error) {
      await relayPromise;
      await this.publishStreamEvent(context, {
        kind: 'lifecycle',
        state: 'failed',
        title: this.localizeText('Session Main Answer', '主会话回答'),
        detail: this.localizeText(
          'The direct-answer stage failed before completion.',
          'direct-answer 阶段在完成前失败。',
        ),
        stageId: SESSION_MAIN_ANSWER_STAGE_ID,
        routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      });
      throw error;
    }
    await relayPromise;
    const assistantMessage = this.resolveAssistantMessage(
      dispatchResult.invokeResult.output,
      context,
    );
    if (!relayState.sawToken) {
      await this.publishAssistantTokenStream(context, assistantMessage, {
        title: this.localizeText('Assistant Draft', '回答草稿'),
        stageId: SESSION_MAIN_ANSWER_STAGE_ID,
        routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
        selectedSurface: dispatchResult.selectedSurface,
        selectedBy: this.resolveSelectedBy(
          dispatchResult.auditRecord.selectedBy,
          context.sessionRoutingPreferenceApplied,
          !safeCandidateSurfaces.includes(context.selectedSurface as AdapterSurface),
        ),
      });
    }
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'completed',
      title: this.localizeText('Session Main Answer', '主会话回答'),
      detail: this.localizeText('The direct-answer stage is ready.', 'direct-answer 阶段已完成。'),
      stageId: SESSION_MAIN_ANSWER_STAGE_ID,
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      selectedSurface: dispatchResult.selectedSurface,
    });
    const directAnswerInvokeElapsedMs =
      typeof dispatchResult.invokeResult.elapsedMs === 'number'
        ? Math.max(dispatchResult.invokeResult.elapsedMs, 0)
        : Math.max(Date.now() - directAnswerInvokeStartedAtMs, 0);
    const resolvedSelectedBy = this.resolveSelectedBy(
      dispatchResult.auditRecord.selectedBy,
      context.sessionRoutingPreferenceApplied,
      !safeCandidateSurfaces.includes(context.selectedSurface as AdapterSurface),
    );
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      executionDetailsLines: this.buildDirectAnswerExecutionDetailsLines({
        preflightExecutionDetailsLines,
        invokeElapsedMs: directAnswerInvokeElapsedMs,
        selectedSurface: dispatchResult.selectedSurface,
      }),
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_DIRECT_ANSWER,
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: dispatchResult.selectedSurface,
      selectedBy: resolvedSelectedBy,
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      invokedRoles: [],
      subagentCount: 0,
    };
  }

  public resolveMentionedRoleId(userMessage: string): string | null {
    return this.subagentRegistry.resolveMentionedRoleId(userMessage);
  }

  public async resolveCapabilityAvailability(
    context: SessionMainSupervisorTurnContext,
    capabilityIds: readonly SessionMainCapabilityId[],
  ): Promise<readonly SessionMainCapabilityAvailability[]> {
    const toolConfigBySurface = this.adapterRoutingRuntime.createToolConfigBySurfaceMap();
    const protocolBySurface =
      this.adapterRoutingRuntime.createProtocolBySurface(toolConfigBySurface);
    const trackedSurfaces =
      this.adapterRoutingRuntime.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    const surfaceAvailabilityFacts = await this.probeSurfaceAvailabilityFacts(
      trackedSurfaces,
      protocolBySurface,
      SESSION_MAIN_ANSWER_ROUTE_KEY,
    );
    const selectedSurfacePreference = this.readOptionalAdapterSurface(context.selectedSurface);

    return capabilityIds.map((capabilityId) =>
      this.createCapabilityAvailabilityOverlay(
        capabilityId,
        surfaceAvailabilityFacts,
        selectedSurfacePreference,
        context,
      ),
    );
  }

  private async probeSurfaceAvailabilityFacts(
    surfaces: AdapterSurface[],
    protocolBySurface: Record<string, AgentProtocolContract>,
    routeKey: string,
  ): Promise<SessionMainCapabilitySurfaceAvailabilityFact[]> {
    return Promise.all(
      surfaces.map(async (surface) => {
        const protocol = protocolBySurface[surface];
        if (!protocol) {
          return {
            surface,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            detail: this.localizeText(
              'No protocol implementation is registered for this surface.',
              '这个 surface 当前没有注册协议实现。',
            ),
          };
        }

        try {
          const probeResult = await protocol.probe({
            routeKey,
          });
          return {
            surface,
            availabilityStatus: probeResult.availabilityStatus,
            detail:
              probeResult.availabilityStatus === AgentAvailabilityStatus.AVAILABLE
                ? null
                : this.readProbeUnavailableReason(probeResult),
          };
        } catch (error) {
          return {
            surface,
            availabilityStatus: AgentAvailabilityStatus.UNAVAILABLE,
            detail: this.readProbeFailureReason(error),
          };
        }
      }),
    );
  }

  private createCapabilityAvailabilityOverlay(
    capabilityId: SessionMainCapabilityId,
    surfaceAvailabilityFacts: readonly SessionMainCapabilitySurfaceAvailabilityFact[],
    selectedSurfacePreference: AdapterSurface | null,
    context: SessionMainSupervisorTurnContext,
  ): SessionMainCapabilityAvailability {
    if (capabilityId === SESSION_MAIN_CAPABILITY_ID.CONNECT) {
      return {
        capabilityId,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      };
    }

    if (
      capabilityId === SESSION_MAIN_CAPABILITY_ID.HELP ||
      capabilityId === SESSION_MAIN_CAPABILITY_ID.DOCTOR ||
      capabilityId === SESSION_MAIN_CAPABILITY_ID.VERIFY ||
      capabilityId === SESSION_MAIN_CAPABILITY_ID.WORKFLOW
    ) {
      return {
        capabilityId,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      };
    }

    if (!SESSION_MAIN_SURFACE_DEPENDENT_CAPABILITY_IDS.has(capabilityId)) {
      return {
        capabilityId,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      };
    }

    const candidateFacts =
      capabilityId === SESSION_MAIN_CAPABILITY_ID.REVIEW ||
      capabilityId === SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY
        ? surfaceAvailabilityFacts.filter((fact) =>
            SESSION_MAIN_REPOSITORY_REVIEW_CAPABLE_SURFACES.has(fact.surface),
          )
        : [...surfaceAvailabilityFacts];
    const availableFacts = candidateFacts.filter(
      (fact) => fact.availabilityStatus !== AgentAvailabilityStatus.UNAVAILABLE,
    );
    const preferredFact =
      selectedSurfacePreference === null
        ? null
        : (candidateFacts.find((fact) => fact.surface === selectedSurfacePreference) ?? null);
    const preferredAvailable =
      preferredFact?.availabilityStatus !== AgentAvailabilityStatus.UNAVAILABLE
        ? preferredFact
        : null;
    const selectedFact = preferredAvailable ?? availableFacts[0] ?? null;

    if (!selectedFact) {
      return {
        capabilityId,
        status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.SETUP_REQUIRED,
        requiresSetup: true,
        suggestedNextStep: '/connect',
        reason:
          preferredFact?.detail ??
          this.localizeText(
            'No governed execution surface passed the local readiness checks for this capability.',
            '当前没有任何受治理执行 surface 通过这个能力所需的本地就绪检查。',
          ),
      };
    }

    const selectedBy =
      preferredAvailable && selectedSurfacePreference
        ? context.selectedBy || 'session.main.preference'
        : context.sessionRoutingPreferenceApplied
          ? 'session.main.availability.fallback'
          : 'session.main.availability.default';
    const fallbackReason =
      preferredFact &&
      preferredFact.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE &&
      preferredFact.detail
        ? this.localizeText(
            `Preferred surface ${preferredFact.surface} is unavailable right now; ${selectedFact.surface} is the next governed option. ${preferredFact.detail}`,
            `首选 surface ${preferredFact.surface} 当前不可用；已改用下一个受治理候选 ${selectedFact.surface}。${preferredFact.detail}`,
          )
        : undefined;

    return {
      capabilityId,
      status: SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE,
      selectedSurface: selectedFact.surface,
      selectedBy,
      ...(fallbackReason ? { reason: fallbackReason } : {}),
    };
  }

  private createRouteRunner(options: {
    routeKey: string;
    protocolBySurface: Record<string, AgentProtocolContract>;
    safeCandidateSurfaces: AdapterSurface[];
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>;
    capabilityRequirement?: AgentCapabilityRequirement;
  }): AgentRouteRunner {
    return new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: options.routeKey,
          primarySurface: options.safeCandidateSurfaces[0] ?? AdapterSurface.CODEX,
          ...(options.safeCandidateSurfaces.slice(1).length > 0
            ? {
                fallbackSurfaces: options.safeCandidateSurfaces.slice(1),
              }
            : {}),
          ...(options.capabilityRequirement
            ? {
                capabilityRequirement: options.capabilityRequirement,
              }
            : {}),
        },
      ],
      protocolBySurface: options.protocolBySurface,
      surfaceNetworkRequirementBySurface:
        this.adapterRoutingRuntime.createSurfaceNetworkRequirementMap(options.toolConfigBySurface),
      restrictedNetworkFallbackHandler:
        this.adapterRoutingRuntime.createRestrictedNetworkFallbackHandler(
          options.toolConfigBySurface,
          options.protocolBySurface,
        ),
    });
  }

  private async resolveSafeCandidateSurfaces(
    candidateSurfaces: AdapterSurface[],
    routeKey: string,
    protocolBySurface: Record<string, AgentProtocolContract>,
    capabilityRequirement?: AgentCapabilityRequirement,
    options?: {
      allowToolCapableSurfaces?: boolean;
      streamContext?: SurfaceProbeStreamContext;
    },
  ): Promise<AdapterSurface[]> {
    return (
      await this.evaluateCandidateSurfaces(
        candidateSurfaces,
        routeKey,
        protocolBySurface,
        capabilityRequirement,
        options,
      )
    ).safeCandidateSurfaces;
  }

  private async evaluateCandidateSurfaces(
    candidateSurfaces: AdapterSurface[],
    routeKey: string,
    protocolBySurface: Record<string, AgentProtocolContract>,
    capabilityRequirement?: AgentCapabilityRequirement,
    options?: {
      allowToolCapableSurfaces?: boolean;
      streamContext?: SurfaceProbeStreamContext;
    },
  ): Promise<{
    safeCandidateSurfaces: AdapterSurface[];
    executionDetailsLines: string[];
  }> {
    const executionDetailsLines: string[] = [
      this.localizeText(
        'Surface probe diagnostics for this turn:',
        '本轮 turn 的 surface 探针诊断：',
      ),
    ];
    const evaluations = await Promise.all(
      candidateSurfaces.map((surface) =>
        this.evaluateCandidateSurface(
          surface,
          routeKey,
          protocolBySurface,
          capabilityRequirement,
          options,
        ),
      ),
    );
    const safeCandidateSurfaces: AdapterSurface[] = [];
    for (const evaluation of evaluations) {
      if (evaluation.safe) {
        safeCandidateSurfaces.push(evaluation.surface);
      }
      if (evaluation.executionDetailsLine) {
        executionDetailsLines.push(evaluation.executionDetailsLine);
      }
    }
    return {
      safeCandidateSurfaces,
      executionDetailsLines,
    };
  }

  private async evaluateCandidateSurface(
    surface: AdapterSurface,
    routeKey: string,
    protocolBySurface: Record<string, AgentProtocolContract>,
    capabilityRequirement: AgentCapabilityRequirement | undefined,
    options:
      | {
          allowToolCapableSurfaces?: boolean;
          streamContext?: SurfaceProbeStreamContext;
        }
      | undefined,
  ): Promise<CandidateSurfaceEvaluation> {
    const protocol = protocolBySurface[surface];
    if (!protocol) {
      await this.publishSurfaceProbeEvent(options?.streamContext, surface, {
        detail: this.localizeText(
          `${surface} skipped because no protocol implementation is registered.`,
          `${surface} 已跳过，因为当前没有注册协议实现。`,
        ),
      });
      return {
        surface,
        safe: false,
        executionDetailsLine: this.localizeText(
          `${surface} · skipped · no protocol implementation is registered.`,
          `${surface} · 已跳过 · 当前没有注册协议实现。`,
        ),
      };
    }
    await this.publishSurfaceProbeEvent(options?.streamContext, surface, {
      detail: this.localizeText(
        `Probing ${surface} availability and route eligibility.`,
        `正在探测 ${surface} 的可用性与路由资格。`,
      ),
    });
    let probeResult: AgentProbeResult;
    try {
      probeResult = await protocol.probe({
        routeKey,
        ...(capabilityRequirement
          ? {
              requiredCapabilities: capabilityRequirement.requiredCapabilities,
            }
          : {}),
      });
    } catch (error) {
      const probeFailureReason = this.readProbeFailureReason(error);
      await this.publishSurfaceProbeEvent(options?.streamContext, surface, {
        detail: this.localizeText(
          `${surface} probe failed for this turn: ${probeFailureReason}`,
          `${surface} 在本轮 turn 中的 probe 执行失败：${probeFailureReason}`,
        ),
      });
      return {
        surface,
        safe: false,
        executionDetailsLine: this.formatSurfaceEligibilityFailureLine(surface, probeFailureReason),
      };
    }
    if (probeResult.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE) {
      const unavailableReason = this.readProbeUnavailableReason(probeResult);
      await this.publishSurfaceProbeEvent(options?.streamContext, surface, {
        detail: this.localizeText(
          `${surface} is unavailable for this turn: ${unavailableReason}`,
          `${surface} 在本轮 turn 中不可用：${unavailableReason}`,
        ),
      });
      return {
        surface,
        safe: false,
        executionDetailsLine: this.formatSurfaceEligibilityFailureLine(surface, unavailableReason),
      };
    }
    if (!this.isSafeDirectAnswerSurface(probeResult, options)) {
      const rejectionReason = this.localizeText(
        'route eligibility rejected this surface for the current turn.',
        '当前 turn 的路由资格检查拒绝了这个 surface。',
      );
      await this.publishSurfaceProbeEvent(options?.streamContext, surface, {
        detail: this.localizeText(
          `${surface} failed the current route eligibility checks.`,
          `${surface} 没有通过当前路由资格检查。`,
        ),
      });
      return {
        surface,
        safe: false,
        executionDetailsLine: this.formatSurfaceEligibilityFailureLine(surface, rejectionReason),
      };
    }
    if (capabilityRequirement) {
      const capabilityEvaluation = this.capabilityEvaluator.evaluate(
        probeResult.capabilityMatrix,
        capabilityRequirement,
      );
      if (!capabilityEvaluation.isSatisfied) {
        const capabilityGapReason = this.localizeText(
          `missing required capabilities: ${capabilityEvaluation.capabilityGaps.map((gap) => gap.capability).join(', ')}`,
          `缺少必需能力：${capabilityEvaluation.capabilityGaps.map((gap) => gap.capability).join('、')}`,
        );
        await this.publishSurfaceProbeEvent(options?.streamContext, surface, {
          detail: this.localizeText(
            `${surface} is missing required capabilities for this turn.`,
            `${surface} 缺少本轮 turn 所需的必需能力。`,
          ),
        });
        return {
          surface,
          safe: false,
          executionDetailsLine: this.formatSurfaceEligibilityFailureLine(
            surface,
            capabilityGapReason,
          ),
        };
      }
    }
    await this.publishSurfaceProbeEvent(options?.streamContext, surface, {
      detail: this.localizeText(
        `${surface} is eligible for this turn.`,
        `${surface} 已通过本轮 turn 的资格检查。`,
      ),
    });
    return {
      surface,
      safe: true,
    };
  }

  private async publishSurfaceProbeEvent(
    streamContext: SurfaceProbeStreamContext | undefined,
    surface: AdapterSurface,
    payload: {
      detail: string;
    },
  ): Promise<void> {
    if (!streamContext) {
      return;
    }

    await this.publishStreamEvent(streamContext.context, {
      kind: 'lifecycle',
      state: 'running',
      title: streamContext.title,
      detail: payload.detail,
      activityKey: `surface-probe:${streamContext.routeKey}:${streamContext.roleId ?? 'session.main'}:${surface}`,
      ...(streamContext.roleId ? { roleId: streamContext.roleId } : {}),
      stageId: streamContext.stageId,
      routeKey: streamContext.routeKey,
      selectedSurface: surface,
    });
  }

  private async resolveAvailableCandidateSurfaces(
    candidateSurfaces: AdapterSurface[],
    routeKey: string,
    protocolBySurface: Record<string, AgentProtocolContract>,
  ): Promise<AdapterSurface[]> {
    const availabilityResults = await Promise.all(
      candidateSurfaces.map(async (surface) => {
        const protocol = protocolBySurface[surface];
        if (!protocol) {
          return null;
        }
        try {
          const probeResult = await protocol.probe({
            routeKey,
          });
          return probeResult.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE
            ? null
            : surface;
        } catch {
          return null;
        }
      }),
    );
    return availabilityResults.filter((surface): surface is AdapterSurface => surface !== null);
  }

  private async resolveSingleRoleDelegateTurn(
    context: SessionMainSupervisorTurnContext,
    roleId: string,
    protocolBySurface: Record<string, AgentProtocolContract>,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
    options?: {
      allowToolCapableSurfaces?: boolean;
      routerDecisionReason?: string;
    },
  ): Promise<SessionMainSupervisorTurnOutcome> {
    const preparedDispatch = await this.prepareRoleDispatch(
      context,
      roleId,
      protocolBySurface,
      toolConfigBySurface,
      {
        allowToolCapableSurfaces: options?.allowToolCapableSurfaces,
      },
    );
    if (!preparedDispatch) {
      return this.createUnknownRoleDelegateOutcome(context, roleId);
    }
    if (preparedDispatch.safeCandidateSurfaces.length === 0) {
      return this.createGuardedRoleDelegateOutcome(context, preparedDispatch.descriptor);
    }

    const executedDispatch = await this.executeRoleDispatch(
      context,
      preparedDispatch,
      protocolBySurface,
      toolConfigBySurface,
    );
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SINGLE_ROLE_DELEGATE,
      assistantDelta: this.createAssistantDelta(executedDispatch.assistantMessage),
      assistantMessage: executedDispatch.assistantMessage,
      routerDecisionReason:
        options?.routerDecisionReason ?? SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_DELEGATE,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${executedDispatch.descriptor.roleId}`,
      requiresConfirmation: false,
      selectedSurface: executedDispatch.selectedSurface,
      selectedBy: executedDispatch.selectedBy,
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [executedDispatch.descriptor.roleId],
      invokedRoles: [this.createInvokedRoleDescriptor(executedDispatch)],
      subagentCount: 1,
    };
  }

  private async resolveSerialRoleCollaborationTurn(
    context: SessionMainSupervisorTurnContext,
    roleIds: string[],
    protocolBySurface: Record<string, AgentProtocolContract>,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): Promise<SessionMainSupervisorTurnOutcome> {
    const preparedDispatches: PreparedRoleDispatch[] = [];
    for (const roleId of roleIds) {
      const preparedDispatch = await this.prepareRoleDispatch(
        context,
        roleId,
        protocolBySurface,
        toolConfigBySurface,
      );
      if (!preparedDispatch) {
        return this.createUnknownSerialRoleCollaborationOutcome(context, roleId);
      }
      if (preparedDispatch.safeCandidateSurfaces.length === 0) {
        return this.createGuardedSerialRoleCollaborationOutcome(
          context,
          preparedDispatch.descriptor,
        );
      }
      preparedDispatches.push(preparedDispatch);
    }

    const executedDispatches: ExecutedRoleDispatch[] = [];
    for (const preparedDispatch of preparedDispatches) {
      const executedDispatch = await this.executeRoleDispatch(
        context,
        preparedDispatch,
        protocolBySurface,
        toolConfigBySurface,
        {
          priorRoleOutputs: executedDispatches.map((candidate) => ({
            roleId: candidate.descriptor.roleId,
            assistantMessage: candidate.assistantMessage,
          })),
          roleOrder: preparedDispatches.map((candidate) => candidate.descriptor.roleId),
        },
      );
      executedDispatches.push(executedDispatch);
    }

    const assistantMessage = this.createSerialRoleCollaborationAssistantMessage(executedDispatches);
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SERIAL_ROLE_COLLABORATION,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_COLLABORATION,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${executedDispatches.map((candidate) => candidate.descriptor.roleId).join('.')}`,
      requiresConfirmation: false,
      selectedSurface: executedDispatches
        .map((candidate) => `${candidate.descriptor.roleId}:${candidate.selectedSurface}`)
        .join(' -> '),
      selectedBy: executedDispatches
        .map((candidate) => `${candidate.descriptor.roleId}:${candidate.selectedBy}`)
        .join(' -> '),
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: executedDispatches.map((candidate) => candidate.descriptor.roleId),
      invokedRoles: executedDispatches.map((candidate) =>
        this.createInvokedRoleDescriptor(candidate),
      ),
      subagentCount: executedDispatches.length,
    };
  }

  private async resolveParallelRoleFanoutTurn(
    context: SessionMainSupervisorTurnContext,
    roleIds: string[],
    protocolBySurface: Record<string, AgentProtocolContract>,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): Promise<SessionMainSupervisorTurnOutcome> {
    const preparedDispatches: PreparedRoleDispatch[] = [];
    for (const roleId of roleIds) {
      const preparedDispatch = await this.prepareRoleDispatch(
        context,
        roleId,
        protocolBySurface,
        toolConfigBySurface,
      );
      if (!preparedDispatch) {
        return this.createUnknownParallelRoleFanoutOutcome(context, roleId);
      }
      if (preparedDispatch.safeCandidateSurfaces.length === 0) {
        return this.createGuardedParallelRoleFanoutOutcome(context, preparedDispatch.descriptor);
      }
      preparedDispatches.push(preparedDispatch);
    }

    const executedDispatches = await Promise.all(
      preparedDispatches.map((preparedDispatch) =>
        this.executeRoleDispatch(
          context,
          preparedDispatch,
          protocolBySurface,
          toolConfigBySurface,
          {
            customInput: this.createParallelRoleInput(
              context,
              preparedDispatch.descriptor,
              preparedDispatches.map((candidate) => candidate.descriptor.roleId),
            ),
          },
        ),
      ),
    );

    const assistantMessage = this.createParallelRoleFanoutAssistantMessage(executedDispatches);
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.PARALLEL_ROLE_FANOUT,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_FANOUT,
      synthesisMode: SESSION_MAIN_PARALLEL_ANALYSIS_SYNTHESIS_MODE,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}parallel.${executedDispatches.map((candidate) => candidate.descriptor.roleId).join('.')}`,
      requiresConfirmation: false,
      selectedSurface: executedDispatches
        .map((candidate) => `${candidate.descriptor.roleId}:${candidate.selectedSurface}`)
        .join(' | '),
      selectedBy: executedDispatches
        .map((candidate) => `${candidate.descriptor.roleId}:${candidate.selectedBy}`)
        .join(' | '),
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: executedDispatches.map((candidate) => candidate.descriptor.roleId),
      invokedRoles: executedDispatches.map((candidate) =>
        this.createInvokedRoleDescriptor(candidate),
      ),
      subagentCount: executedDispatches.length,
    };
  }

  private resolveCandidateSurfaces(
    preferredSurface: string,
    trackedSurfaces: AdapterSurface[],
  ): AdapterSurface[] {
    const candidateSurfaces: AdapterSurface[] = [];
    if (this.isKnownAdapterSurface(preferredSurface)) {
      candidateSurfaces.push(preferredSurface);
    }
    for (const surface of trackedSurfaces) {
      if (!candidateSurfaces.includes(surface)) {
        candidateSurfaces.push(surface);
      }
    }
    if (candidateSurfaces.length === 0) {
      return [AdapterSurface.CODEX, AdapterSurface.GITHUB_COPILOT, AdapterSurface.CLAUDE_CODE];
    }
    return candidateSurfaces;
  }

  private resolveSurfaceAvailabilityInspectionIntent(
    userMessage: string,
  ): SurfaceAvailabilityInspectionIntent | null {
    if (!this.isSurfaceAvailabilityQuestion(userMessage)) {
      return null;
    }

    const matches: SurfaceAvailabilityInspectionIntent[] = [];
    if (/\bcodex\b/iu.test(userMessage)) {
      matches.push({
        surface: AdapterSurface.CODEX,
        displayName: 'Codex CLI',
      });
    }
    if (/(?:github[\s-]*copilot|copilot\s+cli|\bcopilot\b)/iu.test(userMessage)) {
      matches.push({
        surface: AdapterSurface.GITHUB_COPILOT,
        displayName: 'GitHub Copilot CLI',
      });
    }
    if (/(?:claude\s*code|\bclaude\b)/iu.test(userMessage)) {
      matches.push({
        surface: AdapterSurface.CLAUDE_CODE,
        displayName: 'Claude Code',
      });
    }
    if (/\bollama\b|local model|本地模型/iu.test(userMessage)) {
      matches.push({
        surface: AdapterSurface.OLLAMA,
        displayName: 'Ollama',
      });
    }

    return matches.length === 1 ? matches[0] : null;
  }

  private isSurfaceAvailabilityQuestion(userMessage: string): boolean {
    return /(?:是否可用|可用性|能否(?:使用|可用)|能不能(?:使用|用)|可不可用|available|availability|usable|working|health(?:\s|-)?check|probe|探测|探针|健康检查)/iu.test(
      userMessage,
    );
  }

  private resolveRoleDelegateCandidateSurfaces(
    preferredSurface: string,
    descriptor: SessionMainSubagentDescriptor,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
    options?: {
      includeLocalModelFallbackCandidate?: boolean;
    },
  ): AdapterSurface[] {
    const candidateSurfaces = this.resolveKnownCandidateSurfaces([
      descriptor.primarySurface,
      ...descriptor.fallbackSurfaces,
    ]);
    const orderedCandidateSurfaces: AdapterSurface[] = [];
    if (
      this.isKnownAdapterSurface(preferredSurface) &&
      candidateSurfaces.includes(preferredSurface)
    ) {
      orderedCandidateSurfaces.push(preferredSurface);
    }
    for (const surface of candidateSurfaces) {
      if (!orderedCandidateSurfaces.includes(surface)) {
        orderedCandidateSurfaces.push(surface);
      }
    }
    const localFallbackSurface =
      options?.includeLocalModelFallbackCandidate === false
        ? null
        : this.adapterRoutingRuntime.resolveLocalModelFallbackSurface(toolConfigBySurface);
    if (localFallbackSurface && !orderedCandidateSurfaces.includes(localFallbackSurface)) {
      orderedCandidateSurfaces.push(localFallbackSurface);
    }
    return orderedCandidateSurfaces;
  }

  private resolveKnownCandidateSurfaces(surfaceHints: string[]): AdapterSurface[] {
    const candidateSurfaces: AdapterSurface[] = [];
    for (const surfaceHint of surfaceHints) {
      if (this.isKnownAdapterSurface(surfaceHint) && !candidateSurfaces.includes(surfaceHint)) {
        candidateSurfaces.push(surfaceHint);
      }
    }
    return candidateSurfaces;
  }

  private async prepareRoleDispatch(
    context: SessionMainSupervisorTurnContext,
    roleId: string,
    protocolBySurface: Record<string, AgentProtocolContract>,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
    options?: {
      allowToolCapableSurfaces?: boolean;
    },
  ): Promise<PreparedRoleDispatch | null> {
    const descriptor = this.subagentRegistry.resolveSubagentDescriptor({
      roleId,
      turnContext: context,
    });
    if (!descriptor) {
      return null;
    }
    const capabilityRequirement = this.resolveRoleDelegateCapabilityRequirement(
      context,
      descriptor,
    );
    const repositoryReviewRoleDispatch = this.isRepositoryReviewRoleDispatch(context, descriptor);
    const roleDelegateCandidateSurfaces = this.resolveRoleDelegateCandidateSurfaces(
      context.selectedSurface,
      descriptor,
      toolConfigBySurface,
      {
        includeLocalModelFallbackCandidate: !repositoryReviewRoleDispatch,
      },
    );
    const eligibleRoleDelegateCandidateSurfaces = repositoryReviewRoleDispatch
      ? roleDelegateCandidateSurfaces.filter((surface) =>
          SESSION_MAIN_REPOSITORY_REVIEW_CAPABLE_SURFACES.has(surface),
        )
      : roleDelegateCandidateSurfaces;
    const roleDelegateStreamContext = this.createRoleDelegateSurfaceProbeStreamContext(
      context,
      descriptor,
    );
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'started',
      title: roleDelegateStreamContext.title,
      detail: this.localizeText(
        `The supervisor is checking available ${descriptor.roleId} surfaces.`,
        `supervisor 正在检查可用的 ${descriptor.roleId} surface。`,
      ),
      activityKey: `role-preflight:${descriptor.routeKey}:${descriptor.roleId}`,
      roleId: descriptor.roleId,
      stageId: descriptor.stageId,
      routeKey: descriptor.routeKey,
      ...(eligibleRoleDelegateCandidateSurfaces[0]
        ? {
            selectedSurface: eligibleRoleDelegateCandidateSurfaces[0],
          }
        : {}),
    });
    let safeCandidateSurfaces = await this.resolveSafeCandidateSurfaces(
      eligibleRoleDelegateCandidateSurfaces,
      descriptor.routeKey,
      protocolBySurface,
      capabilityRequirement,
      {
        allowToolCapableSurfaces: options?.allowToolCapableSurfaces,
        streamContext: roleDelegateStreamContext,
      },
    );
    if (repositoryReviewRoleDispatch && safeCandidateSurfaces.length === 0) {
      safeCandidateSurfaces = await this.resolveAvailableCandidateSurfaces(
        eligibleRoleDelegateCandidateSurfaces,
        descriptor.routeKey,
        protocolBySurface,
      );
    }
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: safeCandidateSurfaces.length > 0 ? 'completed' : 'failed',
      title: roleDelegateStreamContext.title,
      detail:
        safeCandidateSurfaces.length > 0
          ? this.localizeText(
              `${descriptor.roleId} preflight checks completed; preparing dispatch.`,
              `${descriptor.roleId} 角色预检已完成，正在准备调度。`,
            )
          : this.localizeText(
              `No eligible ${descriptor.roleId} surface passed preflight checks.`,
              `没有任何 ${descriptor.roleId} surface 通过预检。`,
            ),
      activityKey: `role-preflight:${descriptor.routeKey}:${descriptor.roleId}`,
      roleId: descriptor.roleId,
      stageId: descriptor.stageId,
      routeKey: descriptor.routeKey,
      ...(safeCandidateSurfaces[0]
        ? {
            selectedSurface: safeCandidateSurfaces[0],
          }
        : {}),
    });
    return {
      descriptor,
      capabilityRequirement,
      safeCandidateSurfaces,
    };
  }

  private async resolveSurfaceAvailabilityInspectionTurn(
    context: SessionMainSupervisorTurnContext,
    intent: SurfaceAvailabilityInspectionIntent,
    protocolBySurface: Record<string, AgentProtocolContract>,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): Promise<SessionMainSupervisorTurnOutcome> {
    const toolConfig = toolConfigBySurface.get(intent.surface);
    const protocol = protocolBySurface[intent.surface];
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'started',
      title: this.localizeText('Session Main Answer', '主会话回答'),
      detail: this.localizeText(
        `The supervisor is checking ${intent.displayName} availability locally.`,
        `supervisor 正在本地检查 ${intent.displayName} 的可用性。`,
      ),
      activityKey: SESSION_MAIN_ANSWER_PREFLIGHT_ACTIVITY_KEY,
      stageId: SESSION_MAIN_ANSWER_STAGE_ID,
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      selectedSurface: intent.surface,
    });

    const probeStartedAtMs = Date.now();
    let availabilityStatus = AgentAvailabilityStatus.UNAVAILABLE;
    let detail: string | null = null;
    let entrypoint: string | null = null;
    if (!protocol) {
      detail =
        toolConfig === undefined
          ? this.localizeText(
              'this surface is not currently tracked by the active adapters config.',
              '当前激活的 adapters 配置没有追踪这个 surface。',
            )
          : this.localizeText(
              'no protocol implementation is currently registered for this surface.',
              '当前没有为这个 surface 注册协议实现。',
            );
    } else {
      try {
        const probeResult = await protocol.probe({
          routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
        });
        availabilityStatus = probeResult.availabilityStatus;
        entrypoint =
          probeResult.healthCheck?.selectedEntrypoint ?? probeResult.identity.surface ?? null;
        detail =
          probeResult.availabilityStatus === AgentAvailabilityStatus.AVAILABLE
            ? null
            : this.readProbeUnavailableReason(probeResult);
      } catch (error) {
        detail = this.readProbeFailureReason(error);
      }
    }
    const probeElapsedMs = Math.max(Date.now() - probeStartedAtMs, 0);
    const assistantMessage = this.createSurfaceAvailabilityAssistantMessage({
      displayName: intent.displayName,
      surface: intent.surface,
      availabilityStatus,
      detail,
      entrypoint,
    });
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'completed',
      title: this.localizeText('Session Main Answer', '主会话回答'),
      detail: this.localizeText(
        `${intent.displayName} local availability check finished.`,
        `${intent.displayName} 的本地可用性检查已完成。`,
      ),
      activityKey: SESSION_MAIN_ANSWER_PREFLIGHT_ACTIVITY_KEY,
      stageId: SESSION_MAIN_ANSWER_STAGE_ID,
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      selectedSurface: intent.surface,
      selectedBy: SESSION_MAIN_SURFACE_AVAILABILITY_SELECTED_BY,
    });

    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      executionDetailsLines: this.buildSurfaceAvailabilityExecutionDetailsLines({
        displayName: intent.displayName,
        surface: intent.surface,
        availabilityStatus,
        detail,
        elapsedMs: probeElapsedMs,
      }),
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_DIRECT_ANSWER_SURFACE_AVAILABILITY,
      executionIntent: SESSION_MAIN_SURFACE_AVAILABILITY_EXECUTION_INTENT,
      requiresConfirmation: false,
      selectedSurface: intent.surface,
      selectedBy: SESSION_MAIN_SURFACE_AVAILABILITY_SELECTED_BY,
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      invokedRoles: [],
      subagentCount: 0,
    };
  }

  private async executeRoleDispatch(
    context: SessionMainSupervisorTurnContext,
    preparedDispatch: PreparedRoleDispatch,
    protocolBySurface: Record<string, AgentProtocolContract>,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
    options?: {
      priorRoleOutputs?: Array<{ roleId: string; assistantMessage: string }>;
      roleOrder?: string[];
      customInput?: Record<string, unknown>;
    },
  ): Promise<ExecutedRoleDispatch> {
    const dispatchInput = options?.customInput
      ? options.customInput
      : options?.priorRoleOutputs && options.priorRoleOutputs.length > 0
        ? this.createSerialRoleInput(
            context,
            preparedDispatch.descriptor,
            options.priorRoleOutputs,
            options.roleOrder ?? [preparedDispatch.descriptor.roleId],
          )
        : this.createRoleDelegateInput(context, preparedDispatch.descriptor);
    const routeRunner = this.createRouteRunner({
      routeKey: preparedDispatch.descriptor.routeKey,
      protocolBySurface,
      safeCandidateSurfaces: preparedDispatch.safeCandidateSurfaces,
      toolConfigBySurface,
      capabilityRequirement: preparedDispatch.capabilityRequirement,
    });
    const relayState = this.createProtocolStreamRelayState();
    const primaryRoleSurface = preparedDispatch.safeCandidateSurfaces[0] ?? AdapterSurface.CODEX;
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'started',
      title: this.localizeText(
        `${this.formatRoleHeading(preparedDispatch.descriptor.roleId)} Delegate`,
        `${preparedDispatch.descriptor.roleId} 角色委派`,
      ),
      detail: this.localizeText(
        `Dispatching the ${preparedDispatch.descriptor.roleId} role.`,
        `正在调度 ${preparedDispatch.descriptor.roleId} 角色。`,
      ),
      roleId: preparedDispatch.descriptor.roleId,
      stageId: preparedDispatch.descriptor.stageId,
      routeKey: preparedDispatch.descriptor.routeKey,
      selectedSurface: primaryRoleSurface,
    });
    const dispatchRequest = {
      processId: context.sessionId,
      executionId: context.turnId,
      stageId: preparedDispatch.descriptor.stageId,
      routeKey: preparedDispatch.descriptor.routeKey,
      input: dispatchInput,
      runtimeContext: {
        networkMode: AgentNetworkMode.STANDARD,
      },
    };
    const relayPromise = this.relayProtocolStreamEvents(
      context,
      protocolBySurface[primaryRoleSurface],
      dispatchRequest,
      relayState,
      {
        roleId: preparedDispatch.descriptor.roleId,
      },
    );
    let dispatchResult: Awaited<ReturnType<typeof routeRunner.dispatchStage>>;
    try {
      dispatchResult = await routeRunner.dispatchStage(dispatchRequest);
    } catch (error) {
      await relayPromise;
      await this.publishStreamEvent(context, {
        kind: 'lifecycle',
        state: 'failed',
        title: this.localizeText(
          `${this.formatRoleHeading(preparedDispatch.descriptor.roleId)} Delegate`,
          `${preparedDispatch.descriptor.roleId} 角色委派`,
        ),
        detail: this.localizeText(
          `The ${preparedDispatch.descriptor.roleId} role failed before completion.`,
          `${preparedDispatch.descriptor.roleId} 角色在完成前失败。`,
        ),
        roleId: preparedDispatch.descriptor.roleId,
        stageId: preparedDispatch.descriptor.stageId,
        routeKey: preparedDispatch.descriptor.routeKey,
      });
      throw error;
    }
    await relayPromise;
    const assistantMessage = this.resolveRoleAssistantMessage(
      dispatchResult.invokeResult.output,
      context,
      preparedDispatch.descriptor,
    );
    const selectedBy = this.resolveRoleDelegateSelectedBy(
      dispatchResult.auditRecord.selectedBy,
      context.sessionRoutingPreferenceApplied,
      !preparedDispatch.safeCandidateSurfaces.includes(context.selectedSurface as AdapterSurface),
    );
    if (!relayState.sawToken) {
      await this.publishAssistantTokenStream(context, assistantMessage, {
        title: this.localizeText(
          `${this.formatRoleHeading(preparedDispatch.descriptor.roleId)} Draft`,
          `${preparedDispatch.descriptor.roleId} 草稿`,
        ),
        roleId: preparedDispatch.descriptor.roleId,
        stageId: preparedDispatch.descriptor.stageId,
        routeKey: preparedDispatch.descriptor.routeKey,
        selectedSurface: dispatchResult.selectedSurface,
        selectedBy,
      });
    }
    await this.publishStreamEvent(context, {
      kind: 'lifecycle',
      state: 'completed',
      title: this.localizeText(
        `${this.formatRoleHeading(preparedDispatch.descriptor.roleId)} Delegate`,
        `${preparedDispatch.descriptor.roleId} 角色委派`,
      ),
      detail: this.localizeText(
        `The ${preparedDispatch.descriptor.roleId} role finished responding.`,
        `${preparedDispatch.descriptor.roleId} 角色已完成回复。`,
      ),
      roleId: preparedDispatch.descriptor.roleId,
      stageId: preparedDispatch.descriptor.stageId,
      routeKey: preparedDispatch.descriptor.routeKey,
      selectedSurface: dispatchResult.selectedSurface,
      selectedBy,
    });
    return {
      descriptor: preparedDispatch.descriptor,
      assistantMessage,
      selectedSurface: dispatchResult.selectedSurface,
      selectedBy,
    };
  }

  private createProtocolStreamRelayState(): ProtocolStreamRelayState {
    return {
      emittedCount: 0,
      sawLifecycle: false,
      sawToken: false,
      sawToolCall: false,
    };
  }

  private async relayProtocolStreamEvents(
    context: SessionMainSupervisorTurnContext,
    protocol: AgentProtocolContract | undefined,
    request: {
      processId: string;
      executionId: string;
      stageId: string;
      routeKey: string;
      input: Record<string, unknown>;
      agentInvocationTimeoutMs?: number;
      stageTimeoutMs?: number;
      flowTimeoutMs?: number;
      signal?: AbortSignal;
    },
    relayState: ProtocolStreamRelayState,
    metadata: {
      roleId?: string;
    } = {},
  ): Promise<void> {
    if (!protocol || !context.publishStreamEvent) {
      return;
    }

    try {
      for await (const event of protocol.streamEvents(request)) {
        relayState.emittedCount += 1;
        if (
          event.eventType === AgentStreamEventType.STATUS ||
          event.eventType === AgentStreamEventType.COMPLETED ||
          event.eventType === AgentStreamEventType.FAILED
        ) {
          relayState.sawLifecycle = true;
        }
        if (event.eventType === AgentStreamEventType.TOKEN) {
          relayState.sawToken = true;
        }
        if (event.eventType === AgentStreamEventType.TOOL_CALL) {
          relayState.sawToolCall = true;
        }
        await this.publishStreamEvent(context, {
          kind:
            event.eventType === AgentStreamEventType.TOKEN
              ? 'token'
              : event.eventType === AgentStreamEventType.TOOL_CALL
                ? 'tool_call'
                : 'lifecycle',
          state:
            event.eventType === AgentStreamEventType.COMPLETED
              ? 'completed'
              : event.eventType === AgentStreamEventType.FAILED
                ? 'failed'
                : 'running',
          title: this.readOptionalString(event.payload.title),
          detail:
            this.readOptionalString(event.payload.detail) ??
            this.readOptionalString(event.payload.status) ??
            this.readOptionalString(event.payload.message),
          detailOrigin:
            this.readOptionalString(event.payload.detailOrigin) === 'system' ? 'system' : undefined,
          activityKey: this.readOptionalString(event.payload.activityKey),
          chunkText:
            this.readOptionalString(event.payload.chunkText) ??
            this.readOptionalString(event.payload.text) ??
            this.readOptionalString(event.payload.delta),
          accumulatedText:
            this.readOptionalString(event.payload.accumulatedText) ??
            this.readOptionalString(event.payload.responseText),
          roleId: metadata.roleId,
          stageId: request.stageId,
          routeKey: request.routeKey,
          selectedSurface: this.readOptionalString(event.payload.surface),
          toolName:
            this.readOptionalString(event.payload.toolName) ??
            this.readOptionalString(event.payload.name),
          toolCallId: this.readOptionalString(event.payload.toolCallId),
          invokeLiveness: this.readInvokeLiveness(event.payload),
        });
      }
    } catch {
      return;
    }
  }

  private async publishAssistantTokenStream(
    context: SessionMainSupervisorTurnContext,
    assistantMessage: string,
    metadata: {
      title: string;
      roleId?: string;
      stageId: string;
      routeKey: string;
      selectedSurface?: string;
      selectedBy?: string;
    },
  ): Promise<void> {
    if (!context.publishStreamEvent) {
      return;
    }

    const normalizedMessage = assistantMessage.trim();
    if (normalizedMessage.length === 0) {
      return;
    }

    await this.publishStreamEvent(context, {
      kind: 'token',
      state: 'running',
      title: metadata.title,
      detail: normalizedMessage.split(/\r?\n/u)[0] ?? normalizedMessage,
      chunkText: normalizedMessage.slice(0, 240),
      accumulatedText: normalizedMessage.slice(0, 240),
      ...(metadata.roleId ? { roleId: metadata.roleId } : {}),
      stageId: metadata.stageId,
      routeKey: metadata.routeKey,
      ...(metadata.selectedSurface ? { selectedSurface: metadata.selectedSurface } : {}),
      ...(metadata.selectedBy ? { selectedBy: metadata.selectedBy } : {}),
    });
  }

  private async publishStreamEvent(
    context: SessionMainSupervisorTurnContext,
    event: SessionMainSupervisorStreamEvent,
  ): Promise<void> {
    await context.publishStreamEvent?.(event);
  }

  private readInvokeLiveness(
    payload: Record<string, unknown>,
  ): SessionMainSupervisorInvokeLiveness | undefined {
    const candidate = payload.invokeLiveness;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return undefined;
    }

    const record = candidate as Record<string, unknown>;
    const suspectReasonCodes = Array.isArray(record.suspectReasonCodes)
      ? record.suspectReasonCodes.filter((value): value is string => typeof value === 'string')
      : undefined;

    return {
      adapterId: this.readOptionalString(record.adapterId),
      surfaceId: this.readOptionalString(record.surfaceId),
      routeKey: this.readOptionalString(record.routeKey),
      roleId: this.readOptionalString(record.roleId),
      startedAt: this.readOptionalString(record.startedAt),
      status: this.readOptionalString(record.status),
      lastTransportActivityAt: this.readOptionalString(record.lastTransportActivityAt),
      lastSemanticProgressAt: this.readOptionalString(record.lastSemanticProgressAt),
      lastTerminalSignalAt: this.readOptionalString(record.lastTerminalSignalAt),
      latestEventAt: this.readOptionalString(record.latestEventAt),
      latestEventType: this.readOptionalString(record.latestEventType),
      latestTextPreview: this.readOptionalString(record.latestTextPreview),
      activeOperationKind: this.readOptionalString(record.activeOperationKind),
      activeOperationStartedAt: this.readOptionalString(record.activeOperationStartedAt),
      ...(typeof record.partialOutputPreserved === 'boolean'
        ? { partialOutputPreserved: record.partialOutputPreserved }
        : {}),
      transportKind: this.readOptionalString(record.transportKind),
      vendorBindingKind: this.readOptionalString(record.vendorBindingKind),
      ...(record.remoteRequestId === null
        ? { remoteRequestId: null }
        : this.readOptionalString(record.remoteRequestId)
          ? { remoteRequestId: this.readOptionalString(record.remoteRequestId) }
          : {}),
      cancelMechanism: this.readOptionalString(record.cancelMechanism),
      ...(suspectReasonCodes && suspectReasonCodes.length > 0 ? { suspectReasonCodes } : {}),
    };
  }

  private createInvokedRoleDescriptor(
    executedDispatch: ExecutedRoleDispatch,
  ): SessionMainSupervisorInvokedRole {
    return {
      roleId: executedDispatch.descriptor.roleId,
      roleProfileId: executedDispatch.descriptor.roleProfileId,
      agentId: executedDispatch.descriptor.agentId,
      selectedSurface: executedDispatch.selectedSurface,
      selectedBy: executedDispatch.selectedBy,
      dispatchBoundary: executedDispatch.descriptor.dispatchBoundary,
      transportKind: executedDispatch.descriptor.transportKind,
    };
  }

  private createRoleDelegateSurfaceProbeStreamContext(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): SurfaceProbeStreamContext {
    return {
      context,
      title: this.localizeText(
        `${this.formatRoleHeading(descriptor.roleId)} Delegate`,
        `${descriptor.roleId} 角色委派`,
      ),
      stageId: descriptor.stageId,
      routeKey: descriptor.routeKey,
      roleId: descriptor.roleId,
    };
  }

  private resolveCapabilityRequirement(
    capabilityHints: string[],
  ): AgentCapabilityRequirement | undefined {
    const requiredCapabilities = capabilityHints.filter((candidate): candidate is AgentCapability =>
      Object.values(AgentCapability).includes(candidate as AgentCapability),
    );
    if (requiredCapabilities.length === 0) {
      return undefined;
    }
    return {
      requiredCapabilities,
    };
  }

  private resolveRoleDelegateCapabilityRequirement(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): AgentCapabilityRequirement | undefined {
    if (this.isRepositoryReviewRoleDispatch(context, descriptor)) {
      return undefined;
    }
    return this.resolveCapabilityRequirement(descriptor.requiredCapabilities);
  }

  private isRepositoryReviewRoleDispatch(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): boolean {
    return descriptor.roleId === 'reviewer' && this.isRepositoryReviewRequest(context.userMessage);
  }

  private isSafeDirectAnswerSurface(
    probeResult: AgentProbeResult,
    options?: {
      allowToolCapableSurfaces?: boolean;
    },
  ): boolean {
    // Free-form chatability is guarded by the shared chat-only/tool-forbidden execution
    // policy, not by whether the probe returned a TOOL_CALLING capability row.
    const toolCallingState = probeResult.capabilityMatrix.capabilityStates.find(
      (capabilityState) => capabilityState.capability === AgentCapability.TOOL_CALLING,
    );
    if (options?.allowToolCapableSurfaces) {
      return true;
    }
    return toolCallingState?.supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED;
  }

  private readProbeUnavailableReason(probeResult: AgentProbeResult): string {
    const healthCheckDiagnostics = probeResult.healthCheck?.diagnostics;
    if (healthCheckDiagnostics && healthCheckDiagnostics.length > 0) {
      return healthCheckDiagnostics
        .map((diagnostic) =>
          diagnostic.detail ? `${diagnostic.code}:${diagnostic.detail}` : diagnostic.code,
        )
        .join(' | ');
    }
    if (probeResult.unavailableReasons.length > 0) {
      return probeResult.unavailableReasons.join(' | ');
    }
    return this.localizeText(
      'the probe reported this surface as unavailable.',
      'probe 将这个 surface 标记为不可用。',
    );
  }

  private readProbeFailureReason(error: unknown): string {
    const standardizedError = standardizeError(error);
    return standardizedError.message;
  }

  private formatSurfaceEligibilityFailureLine(surface: string, reason: string): string {
    return this.localizeText(
      `${surface} · not eligible · ${reason}`,
      `${surface} · 未通过资格检查 · ${reason}`,
    );
  }

  private createAnswerInput(context: SessionMainSupervisorTurnContext): Record<string, unknown> {
    return {
      userMessage: context.userMessage,
      locale: this.options.locale,
      outputStyle: 'markdown',
      workspaceRoot: this.options.workspaceRoot,
      currentWorkingDirectory: this.options.currentWorkingDirectory,
      sessionId: context.sessionId,
      routeId: context.routeId,
      turnId: context.turnId,
      turnIndex: context.turnIndex,
      selectedSurfaceHint: context.selectedSurface,
      selectedByHint: context.selectedBy,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      governorInstructions: this.localizeText(
        'Answer the user directly in concise markdown. Do not execute commands or pretend a command already ran. If the input is ambiguous, ask one short clarifying question.',
        '请直接用简洁的 Markdown 回复用户。不要执行命令，也不要假装命令已经运行完成；如果输入有歧义，只问一个简短的澄清问题。',
      ),
      [AGENT_STAGE_EXECUTION_POLICY_INPUT_KEY]: {
        interactionMode: AgentStageExecutionMode.CHAT_ONLY,
        toolUsePolicy: AgentStageToolUsePolicy.FORBIDDEN,
      },
      ...(context.metadata ? { metadata: { ...context.metadata } } : {}),
    };
  }

  private createRoleDelegateInput(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): Record<string, unknown> {
    const repositoryReviewScope = this.isRepositoryReviewRoleDispatch(context, descriptor)
      ? SESSION_MAIN_REPOSITORY_REVIEW_SCOPE
      : null;
    return {
      userMessage: this.stripRoleMentions(context.userMessage),
      locale: this.options.locale,
      outputStyle: 'markdown',
      workspaceRoot: this.options.workspaceRoot,
      currentWorkingDirectory: this.options.currentWorkingDirectory,
      workspaceId: this.options.workspace.workspaceId,
      routeId: context.routeId,
      sessionId: context.sessionId,
      turnId: context.turnId,
      turnIndex: context.turnIndex,
      roleId: descriptor.roleId,
      roleProfileId: descriptor.roleProfileId,
      permissionLevel: descriptor.permissionLevel,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SINGLE_ROLE_DELEGATE,
      governorInstructions: this.createRoleDelegateGovernorInstructions(context, descriptor),
      ...(repositoryReviewScope ? { reviewScope: repositoryReviewScope } : {}),
      ...(context.metadata ? { metadata: { ...context.metadata } } : {}),
    };
  }

  private isRepositoryReviewRequest(userMessage: string): boolean {
    return /(?:\breview\b|\bcr\b|code review|worktree|diff|changes?|审查|评审|复核|改动|代码)/iu.test(
      userMessage,
    );
  }

  private createSurfaceAvailabilityAssistantMessage(options: {
    displayName: string;
    surface: AdapterSurface;
    availabilityStatus: AgentAvailabilityStatus;
    detail: string | null;
    entrypoint: string | null;
  }): string {
    const summary =
      options.availabilityStatus === AgentAvailabilityStatus.AVAILABLE
        ? this.localizeText(
            `${options.displayName} is currently available on this machine.`,
            `${options.displayName} 当前在这台机器上可用。`,
          )
        : options.availabilityStatus === AgentAvailabilityStatus.DEGRADED
          ? this.localizeText(
              `${options.displayName} is currently degraded on this machine.`,
              `${options.displayName} 当前在这台机器上处于降级可用状态。`,
            )
          : this.localizeText(
              `${options.displayName} is currently unavailable on this machine.`,
              `${options.displayName} 当前在这台机器上不可用。`,
            );
    return [
      this.localizeText(
        `## ${options.displayName} Availability`,
        `## ${options.displayName} 可用性`,
      ),
      '',
      summary,
      '',
      `- Surface: \`${options.surface}\``,
      `- Status: \`${options.availabilityStatus}\``,
      ...(options.entrypoint ? [`- Entrypoint: \`${options.entrypoint}\``] : []),
      ...(options.detail ? [`- Detail: ${options.detail}`] : []),
      `- ${this.localizeText(
        'Scope: local adapter availability probe only; no answer-stage model invocation was dispatched.',
        '范围：仅执行本地 adapter 可用性探测；没有调度 answer-stage 模型调用。',
      )}`,
    ].join('\n');
  }

  private createRoleDelegateGovernorInstructions(
    _context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): string {
    if (descriptor.roleId === 'reviewer') {
      return this.localizeText(
        'You are the reviewer role subagent for Repo AI Governor. When the user asks for a code review of the current worktree, diff, or repository changes, inspect the repository in a read-only manner and produce findings-first concise markdown with concrete file references when possible. Do not modify files, do not run governed CLI commands, and do not claim that commands already ran. If the user is really asking to run connect, doctor, verify, or run, keep the response advisory and tell the supervisor to use governed handoff instead.',
        '你现在是 Repo AI Governor 的 reviewer 角色子代理。当用户请求审查当前 worktree、diff 或仓库改动时，请以只读方式检查仓库，并优先输出 findings-first 的简洁 Markdown；在可能时给出具体文件引用。不要修改文件，不要执行受治理的 CLI 命令，也不要声称命令已经执行完成。如果用户真正想运行 connect、doctor、verify 或 run，请仅给出建议，并明确需要由 supervisor 走受治理交接。',
      );
    }

    return this.localizeText(
      `You are the ${descriptor.roleId} role subagent for Repo AI Governor. Respond from this role's perspective in concise markdown. Do not execute commands, modify files, or claim that governed commands already ran. If the user is really asking to run connect, doctor, verify, review, or run, keep the response advisory and tell the supervisor to use preview plus confirm handoff instead.`,
      `你现在是 Repo AI Governor 的 ${descriptor.roleId} 角色子代理。请用这个角色的视角输出简洁的 Markdown。不要执行命令、不要修改文件，也不要声称受治理命令已经执行。如果用户真正想运行 connect、doctor、verify、review 或 run，请仅给出建议，并明确需要由 supervisor 走 preview + confirm 交接。`,
    );
  }

  private createSerialRoleInput(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
    priorRoleOutputs: Array<{ roleId: string; assistantMessage: string }>,
    roleOrder: string[],
  ): Record<string, unknown> {
    return {
      ...this.createRoleDelegateInput(context, descriptor),
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SERIAL_ROLE_COLLABORATION,
      collaborationRoleOrder: [...roleOrder],
      priorRoleOutputs: priorRoleOutputs.map((candidate) => ({
        roleId: candidate.roleId,
        assistantMessage: candidate.assistantMessage,
      })),
      governorInstructions: this.localizeText(
        `You are the ${descriptor.roleId} role subagent in a serial collaboration for Repo AI Governor. Read the upstream role outputs carefully, then continue the collaboration from this role's perspective in concise markdown. Do not execute commands, modify files, or claim that governed commands already ran.`,
        `你现在是 Repo AI Governor 串行协作中的 ${descriptor.roleId} 角色子代理。请认真阅读上游角色输出，再从当前角色视角继续协作，并输出简洁的 Markdown。不要执行命令、不要修改文件，也不要声称受治理命令已经执行。`,
      ),
    };
  }

  private createParallelRoleInput(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
    roleOrder: string[],
  ): Record<string, unknown> {
    return {
      ...this.createRoleDelegateInput(context, descriptor),
      interactionMode: SESSION_MAIN_INTERACTION_MODE.PARALLEL_ROLE_FANOUT,
      collaborationRoleOrder: [...roleOrder],
      synthesisMode: SESSION_MAIN_PARALLEL_ANALYSIS_SYNTHESIS_MODE,
      governorInstructions: this.localizeText(
        `You are the ${descriptor.roleId} role subagent in a parallel analysis for Repo AI Governor. Work independently from the other roles and contribute one concise markdown analysis from this role's perspective. Do not execute commands, modify files, or claim that governed commands already ran.`,
        `你现在是 Repo AI Governor 并行分析中的 ${descriptor.roleId} 角色子代理。请独立工作，并从当前角色视角输出一份简洁的 Markdown 分析。不要执行命令、不要修改文件，也不要声称受治理命令已经执行。`,
      ),
    };
  }

  private resolveAssistantMessage(
    output: Record<string, unknown>,
    context: SessionMainSupervisorTurnContext,
  ): string {
    const responseText =
      typeof output.responseText === 'string' && output.responseText.trim().length > 0
        ? output.responseText.trim()
        : null;
    if (responseText) {
      return responseText;
    }

    return [
      this.localizeText('## Session Main Answer', '## 主会话回答'),
      '',
      this.localizeText(
        `I received your request: "${context.userMessage}".`,
        `我已经收到你的请求：「${context.userMessage}」。`,
      ),
      '',
      this.localizeText(
        'The selected surface returned no textual response payload, so the supervisor kept the turn in direct-answer mode and preserved the routing metadata for follow-up troubleshooting.',
        '选中的 surface 没有返回可渲染的文本内容，因此 supervisor 保持了 direct-answer 模式，并保留了路由元数据供后续排查。',
      ),
    ].join('\n');
  }

  private resolveRoleAssistantMessage(
    output: Record<string, unknown>,
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): string {
    const responseText =
      typeof output.responseText === 'string' && output.responseText.trim().length > 0
        ? output.responseText.trim()
        : null;
    if (responseText) {
      return responseText;
    }

    return [
      this.localizeText(
        `## ${this.formatRoleHeading(descriptor.roleId)} Perspective`,
        `## ${descriptor.roleId} 角色视角`,
      ),
      '',
      this.localizeText(
        `The ${descriptor.roleId} role accepted your request: "${this.stripRoleMentions(context.userMessage)}".`,
        `${descriptor.roleId} 角色已接收你的请求：「${this.stripRoleMentions(context.userMessage)}」。`,
      ),
      '',
      this.localizeText(
        'The selected surface returned no textual response payload, so the supervisor preserved the delegate metadata for follow-up troubleshooting.',
        '选中的 surface 没有返回可渲染的文本内容，因此 supervisor 保留了这次 delegate 的元数据供后续排查。',
      ),
    ].join('\n');
  }

  private createSerialRoleCollaborationAssistantMessage(
    executedDispatches: ExecutedRoleDispatch[],
  ): string {
    const lines: string[] = [
      this.localizeText(
        `## ${executedDispatches.map((candidate) => this.formatRoleHeading(candidate.descriptor.roleId)).join(' -> ')} Collaboration`,
        `## ${executedDispatches.map((candidate) => `${candidate.descriptor.roleId} 角色`).join(' -> ')} 协作`,
      ),
    ];
    for (const executedDispatch of executedDispatches) {
      lines.push('');
      lines.push(`### ${this.formatRoleHeading(executedDispatch.descriptor.roleId)}`);
      lines.push('');
      lines.push(executedDispatch.assistantMessage);
    }
    return lines.join('\n');
  }

  private createParallelRoleFanoutAssistantMessage(
    executedDispatches: ExecutedRoleDispatch[],
  ): string {
    const lines: string[] = [
      this.localizeText(
        `## ${executedDispatches.map((candidate) => this.formatRoleHeading(candidate.descriptor.roleId)).join(' + ')} Parallel Analysis`,
        `## ${executedDispatches.map((candidate) => `${candidate.descriptor.roleId} 角色`).join(' + ')} 并行分析`,
      ),
      '',
      this.localizeText(
        'The supervisor fanned out this analysis in parallel and then synthesized the role outputs into one foreground answer.',
        'supervisor 已将这次分析并行分发给多个角色，并把各角色输出综合为一条前台回答。',
      ),
    ];
    for (const executedDispatch of executedDispatches) {
      lines.push('');
      lines.push(`### ${this.formatRoleHeading(executedDispatch.descriptor.roleId)}`);
      lines.push('');
      lines.push(executedDispatch.assistantMessage);
    }
    return lines.join('\n');
  }

  private resolveSelectedBy(
    selectedBy: string | undefined,
    sessionRoutingPreferenceApplied: boolean,
    preferredSurfaceRejectedByGuard: boolean,
  ): string {
    if (preferredSurfaceRejectedByGuard) {
      return sessionRoutingPreferenceApplied
        ? 'session.main.preference.safe_fallback'
        : 'session.main.answer.safe_fallback';
    }
    if (selectedBy === AgentRouteSelectionSource.LOCAL_FALLBACK) {
      return 'session.main.answer.local_fallback';
    }
    if (selectedBy === AgentRouteSelectionSource.FALLBACK) {
      return 'session.main.answer.fallback';
    }
    if (sessionRoutingPreferenceApplied) {
      return 'session.main.preference.answer';
    }
    return 'session.main.answer.primary';
  }

  private resolveRoleDelegateSelectedBy(
    selectedBy: string | undefined,
    sessionRoutingPreferenceApplied: boolean,
    preferredSurfaceRejectedByGuard: boolean,
  ): string {
    if (preferredSurfaceRejectedByGuard) {
      return sessionRoutingPreferenceApplied
        ? 'session.main.role_delegate.preference.safe_fallback'
        : 'session.main.role_delegate.safe_fallback';
    }
    if (selectedBy === AgentRouteSelectionSource.LOCAL_FALLBACK) {
      return 'session.main.role_delegate.local_fallback';
    }
    if (selectedBy === AgentRouteSelectionSource.FALLBACK) {
      return 'session.main.role_delegate.fallback';
    }
    if (sessionRoutingPreferenceApplied) {
      return 'session.main.role_delegate.preference';
    }
    return 'session.main.role_delegate.primary';
  }

  private createGuardedFallbackOutcome(
    context: SessionMainSupervisorTurnContext,
    executionDetailsLines?: string[],
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText('## Session Main Answer', '## 主会话回答'),
      '',
      this.localizeText(
        'No eligible direct-answer surface is currently available for this turn.',
        '当前没有可用于这次 direct-answer 的合格 surface。',
      ),
      '',
      this.localizeText(
        `I could not dispatch "${context.userMessage}" because every candidate surface is unavailable or failed route eligibility checks.`,
        `我无法派发「${context.userMessage}」，因为所有候选 surface 要么不可用，要么没有通过当前路由资格检查。`,
      ),
      '',
      this.localizeText(
        'Reconnect or verify an eligible surface, then retry the free-form answer or switch to a governed command such as `/connect`, `/doctor`, `/verify`, `/review`, or `/run`.',
        '请先恢复或校验可用 surface，然后再重试自由对话回答，或者改用 `/connect`、`/doctor`、`/verify`、`/review`、`/run` 等受治理命令。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      ...(executionDetailsLines && executionDetailsLines.length > 0
        ? { executionDetailsLines: [...executionDetailsLines] }
        : {}),
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_DIRECT_ANSWER_GUARD,
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_DIRECT_ANSWER_SURFACE,
      selectedBy: 'session.main.answer.guard',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private buildDirectAnswerPreflightExecutionDetailsLines(options: {
    candidateSurfaceCount: number;
    eligibleSurfaceCount: number;
    elapsedMs: number;
    probeDetailsLines: string[];
  }): string[] {
    return [
      this.localizeText(
        `Performance: direct-answer preflight probes finished in ${String(options.elapsedMs)}ms across ${String(options.candidateSurfaceCount)} candidate surfaces (${String(options.eligibleSurfaceCount)} eligible).`,
        `性能：direct-answer 预检探针耗时 ${String(options.elapsedMs)}ms，候选 surface 共 ${String(options.candidateSurfaceCount)} 个，其中 ${String(options.eligibleSurfaceCount)} 个合格。`,
      ),
      ...options.probeDetailsLines,
    ];
  }

  private buildDirectAnswerExecutionDetailsLines(options: {
    preflightExecutionDetailsLines: string[];
    invokeElapsedMs: number;
    selectedSurface: string;
  }): string[] {
    return [
      ...options.preflightExecutionDetailsLines,
      this.localizeText(
        `Performance: direct-answer invoke completed in ${String(options.invokeElapsedMs)}ms on ${options.selectedSurface}.`,
        `性能：direct-answer 调用在 ${options.selectedSurface} 上耗时 ${String(options.invokeElapsedMs)}ms 完成。`,
      ),
    ];
  }

  private buildSurfaceAvailabilityExecutionDetailsLines(options: {
    displayName: string;
    surface: AdapterSurface;
    availabilityStatus: AgentAvailabilityStatus;
    detail: string | null;
    elapsedMs: number;
  }): string[] {
    return [
      this.localizeText(
        `Performance: local availability probe for ${options.displayName} finished in ${String(options.elapsedMs)}ms.`,
        `性能：${options.displayName} 的本地可用性探测耗时 ${String(options.elapsedMs)}ms。`,
      ),
      this.localizeText(
        `${options.surface} · availability=${options.availabilityStatus}${options.detail ? ` · ${options.detail}` : ''}`,
        `${options.surface} · 可用性=${options.availabilityStatus}${options.detail ? ` · ${options.detail}` : ''}`,
      ),
    ];
  }

  private createGuardedRoleDelegateOutcome(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): SessionMainSupervisorTurnOutcome {
    const repositoryReviewRequest = this.isRepositoryReviewRoleDispatch(context, descriptor);
    const assistantMessage = [
      this.localizeText(
        `## ${this.formatRoleHeading(descriptor.roleId)} Delegate`,
        `## ${descriptor.roleId} 委派`,
      ),
      '',
      repositoryReviewRequest
        ? this.localizeText(
            `I did not delegate "${context.userMessage}" to the ${descriptor.roleId} role because every currently configured reviewer surface is either unavailable or failed repository-review preflight checks.`,
            `我没有把「${context.userMessage}」委派给 ${descriptor.roleId} 角色，因为当前配置的 reviewer surface 要么不可用、要么没有通过仓库评审所需的预检。`,
          )
        : this.localizeText(
            `I did not delegate "${context.userMessage}" to the ${descriptor.roleId} role because every currently configured surface for that role is tool-capable, unavailable, or missing one required capability.`,
            `我没有把「${context.userMessage}」委派给 ${descriptor.roleId} 角色，因为这个角色当前配置的 surface 要么支持工具调用、要么不可用、要么缺少必需能力。`,
          ),
      '',
      repositoryReviewRequest
        ? this.localizeText(
            'No currently available reviewer surface passed the active availability and governance checks for repository review. Restore one usable reviewer surface or rerun adapter diagnostics, then try again.',
            '当前没有可用的 reviewer surface 通过仓库评审所需的 availability 与治理检查。请先恢复一个可用的 reviewer surface，或重新执行适配器诊断后再试。',
          )
        : this.localizeText(
            'The bootstrap collaboration path is currently restricted to no-tool surfaces so that front-stage role delegation does not bypass the governed handoff boundary.',
            '当前 bootstrap 协作路径只允许走无工具调用的 surface，这样前台 role delegate 才不会绕过受治理的 handoff 边界。',
          ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SINGLE_ROLE_DELEGATE,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_GUARD,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${descriptor.roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.role_delegate.guard',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createGuardedSerialRoleCollaborationOutcome(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText(
        `## ${this.formatRoleHeading(descriptor.roleId)} Collaboration Blocked`,
        `## ${descriptor.roleId} 协作已阻断`,
      ),
      '',
      this.localizeText(
        `I did not start serial collaboration for "${context.userMessage}" because the ${descriptor.roleId} role has no currently safe surface that satisfies the collaboration guard and capability contract.`,
        `我没有为「${context.userMessage}」启动串行协作，因为 ${descriptor.roleId} 角色当前没有同时满足协作 guard 与能力契约的安全 surface。`,
      ),
      '',
      this.localizeText(
        'Serial role collaboration currently requires every role in the chain to have one safe no-tool surface that also satisfies its required capabilities before the supervisor starts invoking any stage.',
        '当前串行角色协作要求链路中的每个角色都先具备一个同时满足 required capabilities 的安全无工具 surface，supervisor 才会开始实际调用。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SERIAL_ROLE_COLLABORATION,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_GUARD,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${descriptor.roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.serial_role_collaboration.guard',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createGuardedParallelRoleFanoutOutcome(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText(
        `## ${this.formatRoleHeading(descriptor.roleId)} Parallel Analysis Blocked`,
        `## ${descriptor.roleId} 并行分析已阻断`,
      ),
      '',
      this.localizeText(
        `I did not start parallel role fan-out for "${context.userMessage}" because the ${descriptor.roleId} role has no currently safe surface that satisfies the collaboration guard and capability contract.`,
        `我没有为「${context.userMessage}」启动并行角色分析，因为 ${descriptor.roleId} 角色当前没有同时满足协作 guard 与能力契约的安全 surface。`,
      ),
      '',
      this.localizeText(
        'Parallel role analysis currently requires every role in the fan-out set to have one safe no-tool surface that also satisfies its required capabilities before the supervisor starts any parallel dispatch.',
        '当前并行角色分析要求 fan-out 集合中的每个角色都先具备一个同时满足 required capabilities 的安全无工具 surface，supervisor 才会开始任何并行分发。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.PARALLEL_ROLE_FANOUT,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_GUARD,
      synthesisMode: SESSION_MAIN_PARALLEL_ANALYSIS_SYNTHESIS_MODE,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}parallel.${descriptor.roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.parallel_role_fanout.guard',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createOverflowSerialRoleCollaborationOutcome(
    context: SessionMainSupervisorTurnContext,
    roleIds: string[],
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText('## Serial Collaboration', '## 串行协作'),
      '',
      this.localizeText(
        `I did not start serial collaboration for "${context.userMessage}" because the current pilot supports at most ${String(SESSION_MAIN_SERIAL_ROLE_COLLABORATION_LIMIT)} explicit roles per turn, but you mentioned ${String(roleIds.length)} roles: ${this.formatRoleMentionList(roleIds)}.`,
        `我没有为「${context.userMessage}」启动串行协作，因为当前试点每个 turn 最多只支持 ${String(SESSION_MAIN_SERIAL_ROLE_COLLABORATION_LIMIT)} 个显式角色，但你这次提到了 ${String(roleIds.length)} 个角色：${this.formatRoleMentionList(roleIds)}。`,
      ),
      '',
      this.localizeText(
        'Retry with up to two explicit roles for serial collaboration, or switch to an explicit parallel analysis request when you want up to three independent role viewpoints.',
        '如果你想走串行协作，请把显式角色限制在两个以内；如果你想要最多三个独立角色并行给出视角，请改成显式 parallel analysis 请求。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SERIAL_ROLE_COLLABORATION,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_OVERFLOW,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${roleIds.join('.')}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.serial_role_collaboration.overflow',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createOverflowParallelRoleFanoutOutcome(
    context: SessionMainSupervisorTurnContext,
    roleIds: string[],
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText('## Parallel Analysis', '## 并行分析'),
      '',
      this.localizeText(
        `I did not start parallel role fan-out for "${context.userMessage}" because the current pilot supports at most ${String(SESSION_MAIN_PARALLEL_ROLE_FANOUT_LIMIT)} explicit roles per turn, but you mentioned ${String(roleIds.length)} roles: ${this.formatRoleMentionList(roleIds)}.`,
        `我没有为「${context.userMessage}」启动并行角色分析，因为当前试点每个 turn 最多只支持 ${String(SESSION_MAIN_PARALLEL_ROLE_FANOUT_LIMIT)} 个显式角色，但你这次提到了 ${String(roleIds.length)} 个角色：${this.formatRoleMentionList(roleIds)}。`,
      ),
      '',
      this.localizeText(
        'Retry with up to three explicit roles for parallel analysis so the supervisor can preserve every requested role in the fan-out set.',
        '如果你要并行分析，请把显式角色限制在三个以内，这样 supervisor 才能在 fan-out 集合里完整保留你请求的每个角色。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.PARALLEL_ROLE_FANOUT,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_OVERFLOW,
      synthesisMode: SESSION_MAIN_PARALLEL_ANALYSIS_SYNTHESIS_MODE,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}parallel.${roleIds.join('.')}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.parallel_role_fanout.overflow',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createUnknownRoleDelegateOutcome(
    context: SessionMainSupervisorTurnContext,
    roleId: string,
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText('## Role Delegate', '## 角色委派'),
      '',
      this.localizeText(
        `The supervisor could not resolve a connected role named "${roleId}" from the current adapters configuration.`,
        `supervisor 无法从当前 adapters 配置中解析名为「${roleId}」的已连接角色。`,
      ),
      '',
      this.localizeText(
        'Use `connect` / `connect apply` first, or mention one of the configured roles such as `@planner`, `@architect`, `@reviewer`, or `@verifier`.',
        '请先执行 `connect` / `connect apply`，或者显式提及一个已配置角色，例如 `@planner`、`@architect`、`@reviewer` 或 `@verifier`。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SINGLE_ROLE_DELEGATE,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_SINGLE_ROLE_UNRESOLVED,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.role_delegate.unresolved',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createUnknownSerialRoleCollaborationOutcome(
    context: SessionMainSupervisorTurnContext,
    roleId: string,
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText('## Serial Collaboration', '## 串行协作'),
      '',
      this.localizeText(
        `The supervisor could not resolve one configured role named "${roleId}" while building the serial collaboration chain.`,
        `supervisor 在构建串行协作链时，无法解析名为「${roleId}」的已配置角色。`,
      ),
      '',
      this.localizeText(
        'Check the active role bindings first, then retry with explicit configured roles such as `@planner @reviewer`.',
        '请先检查当前激活的角色绑定，再使用例如 `@planner @reviewer` 这样的已配置角色重试。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SERIAL_ROLE_COLLABORATION,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_SERIAL_ROLE_UNRESOLVED,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.serial_role_collaboration.unresolved',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createUnknownParallelRoleFanoutOutcome(
    context: SessionMainSupervisorTurnContext,
    roleId: string,
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText('## Parallel Analysis', '## 并行分析'),
      '',
      this.localizeText(
        `The supervisor could not resolve one configured role named "${roleId}" while building the parallel fan-out set.`,
        `supervisor 在构建并行 fan-out 集合时，无法解析名为「${roleId}」的已配置角色。`,
      ),
      '',
      this.localizeText(
        'Check the active role bindings first, then retry with explicit configured roles such as `@architect @reviewer @verifier parallel analyze this change`.',
        '请先检查当前激活的角色绑定，再使用例如 `@architect @reviewer @verifier parallel analyze this change` 这样的已配置角色重试。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.PARALLEL_ROLE_FANOUT,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      routerDecisionReason: SESSION_MAIN_ROUTER_REASON_PARALLEL_ROLE_UNRESOLVED,
      synthesisMode: SESSION_MAIN_PARALLEL_ANALYSIS_SYNTHESIS_MODE,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}parallel.${roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.parallel_role_fanout.unresolved',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
      subagentCount: 0,
    };
  }

  private createAssistantDelta(assistantMessage: string): string {
    const firstNonEmptyLine = assistantMessage
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    if (!firstNonEmptyLine) {
      return 'answer';
    }
    return firstNonEmptyLine.slice(0, SESSION_MAIN_FALLBACK_DELTA_MAX_LENGTH);
  }

  private isKnownAdapterSurface(candidate: string): candidate is AdapterSurface {
    return Object.values(AdapterSurface).includes(candidate as AdapterSurface);
  }

  private readOptionalAdapterSurface(candidate: unknown): AdapterSurface | null {
    const normalizedCandidate = this.readOptionalString(candidate);
    return normalizedCandidate && this.isKnownAdapterSurface(normalizedCandidate)
      ? normalizedCandidate
      : null;
  }

  private stripRoleMentions(userMessage: string): string {
    const sanitizedMessage = userMessage.replaceAll(/@[a-z0-9_.-]+/giu, '').trim();
    return sanitizedMessage.length > 0 ? sanitizedMessage : userMessage.trim();
  }

  private isParallelAnalysisRequest(userMessage: string): boolean {
    return /(?:\bparallel\b|\bcompare\b|\bindependent\b|并行|分别|不同视角|同时分析)/iu.test(
      userMessage,
    );
  }

  private formatRoleHeading(roleId: string): string {
    return roleId
      .replaceAll(/[-_]/gu, ' ')
      .replace(/\b\w/gu, (character) => character.toUpperCase());
  }

  private formatRoleMentionList(roleIds: string[]): string {
    return roleIds.map((roleId) => `@${roleId}`).join(' ');
  }

  private localizeText(english: string, chinese: string): string {
    return this.options.locale.toLowerCase().startsWith('zh') ? chinese : english;
  }

  private readOptionalString(candidate: unknown): string | undefined {
    return typeof candidate === 'string' && candidate.trim().length > 0
      ? candidate.trim()
      : undefined;
  }
}
