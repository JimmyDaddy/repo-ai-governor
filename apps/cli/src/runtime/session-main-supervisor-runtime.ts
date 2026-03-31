import type { ClaudeCodeExecRunner } from '@repo-ai-governor/adapter-claude-code';
import type { CodexExecRunner } from '@repo-ai-governor/adapter-codex';
import type { GithubCopilotExecRunner } from '@repo-ai-governor/adapter-github-copilot';
import {
  AgentAvailabilityStatus,
  AgentCapability,
  AgentCapabilitySupportLevel,
  AgentNetworkMode,
  type AgentProbeResult,
  type AgentProtocolContract,
  AgentRouteRunner,
  AgentRouteSelectionSource,
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig } from '@repo-ai-governor/config';
import {
  SESSION_MAIN_INTERACTION_MODE,
  SESSION_MAIN_RESPONSE_MODE,
  type SessionMainSupervisorRuntimeContract,
  type SessionMainSupervisorTurnContext,
  type SessionMainSupervisorTurnOutcome,
} from '@repo-ai-governor/core-orchestration-service';
import { AdapterSurface } from '@repo-ai-governor/shared';
import { CliAdapterRoutingRuntime } from './adapter-routing-runtime.js';

const SESSION_MAIN_ANSWER_ROUTE_KEY = 'session.main.answer';
const SESSION_MAIN_ANSWER_STAGE_ID = 'stage-session-main-answer';
const SESSION_MAIN_FALLBACK_DELTA_MAX_LENGTH = 80;
const SESSION_MAIN_GUARDED_DIRECT_ANSWER_SURFACE = 'guarded-direct-answer';

/**
 * Owns the CLI-side direct-answer runtime used by the service-owned `session.main` supervisor.
 *
 * Why this exists:
 * `core-orchestration-service` must stay runtime-owner only, while real adapter route selection
 * and protocol construction still live in CLI-local adapter routing code during the bootstrap phase.
 */
export class CliSessionMainSupervisorRuntime implements SessionMainSupervisorRuntimeContract {
  private readonly adapterRoutingRuntime: CliAdapterRoutingRuntime;

  public constructor(
    private readonly options: {
      workspaceRoot: string;
      currentWorkingDirectory: string;
      locale: string;
      adaptersConfig: AdaptersConfig;
      adapterRoutingRuntime?: CliAdapterRoutingRuntime;
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
    const trackedSurfaces =
      this.adapterRoutingRuntime.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    const safeCandidateSurfaces = await this.resolveSafeCandidateSurfaces(
      context.selectedSurface,
      trackedSurfaces,
      protocolBySurface,
    );
    if (safeCandidateSurfaces.length === 0) {
      return this.createGuardedFallbackOutcome(context);
    }
    const routeRunner = this.createAnswerRouteRunner(
      protocolBySurface,
      safeCandidateSurfaces,
      toolConfigBySurface,
    );
    const dispatchResult = await routeRunner.dispatchStage({
      processId: context.sessionId,
      executionId: context.turnId,
      stageId: SESSION_MAIN_ANSWER_STAGE_ID,
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      input: this.createAnswerInput(context),
      runtimeContext: {
        networkMode: AgentNetworkMode.STANDARD,
      },
    });
    const assistantMessage = this.resolveAssistantMessage(
      dispatchResult.invokeResult.output,
      context,
    );
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: dispatchResult.selectedSurface,
      selectedBy: this.resolveSelectedBy(
        dispatchResult.auditRecord.selectedBy,
        context.sessionRoutingPreferenceApplied,
        !safeCandidateSurfaces.includes(context.selectedSurface as AdapterSurface),
      ),
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
    };
  }

  private createAnswerRouteRunner(
    protocolBySurface: Record<string, AgentProtocolContract>,
    candidateSurfaces: AdapterSurface[],
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): AgentRouteRunner {
    return new AgentRouteRunner({
      routePolicies: [
        {
          routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
          primarySurface: candidateSurfaces[0] ?? AdapterSurface.CODEX,
          ...(candidateSurfaces.slice(1).length > 0
            ? {
                fallbackSurfaces: candidateSurfaces.slice(1),
              }
            : {}),
        },
      ],
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

  private async resolveSafeCandidateSurfaces(
    preferredSurface: string,
    trackedSurfaces: AdapterSurface[],
    protocolBySurface: Record<string, AgentProtocolContract>,
  ): Promise<AdapterSurface[]> {
    const candidateSurfaces = this.resolveCandidateSurfaces(preferredSurface, trackedSurfaces);
    const safeCandidateSurfaces: AdapterSurface[] = [];
    for (const surface of candidateSurfaces) {
      const protocol = protocolBySurface[surface];
      if (!protocol) {
        continue;
      }
      const probeResult = await protocol.probe({
        routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      });
      if (
        probeResult.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE ||
        !this.isSafeDirectAnswerSurface(probeResult)
      ) {
        continue;
      }
      safeCandidateSurfaces.push(surface);
    }
    return safeCandidateSurfaces;
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

  private isSafeDirectAnswerSurface(probeResult: AgentProbeResult): boolean {
    const toolCallingState = probeResult.capabilityMatrix.capabilityStates.find(
      (capabilityState) => capabilityState.capability === AgentCapability.TOOL_CALLING,
    );
    return toolCallingState?.supportLevel === AgentCapabilitySupportLevel.UNSUPPORTED;
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
      governorInstructions:
        'Answer the user directly in concise markdown. Do not execute commands or pretend a command already ran. If the input is ambiguous, ask one short clarifying question.',
      ...(context.metadata ? { metadata: { ...context.metadata } } : {}),
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
      '## Session Main Answer',
      '',
      `I received your request: "${context.userMessage}".`,
      '',
      'The selected surface returned no textual response payload, so the supervisor kept the turn in direct-answer mode and preserved the routing metadata for follow-up troubleshooting.',
    ].join('\n');
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

  private createGuardedFallbackOutcome(
    context: SessionMainSupervisorTurnContext,
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      '## Session Main Answer',
      '',
      'Direct-answer bootstrap is currently restricted to no-tool surfaces.',
      '',
      `I did not dispatch "${context.userMessage}" to a tool-capable adapter because that would bypass the governed preview + confirm handoff boundary.`,
      '',
      'Use a governed command such as `/connect`, `/doctor`, `/verify`, `/review`, or `/run`, or activate a no-tool local-model surface before retrying a free-form direct answer.',
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ANSWER,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.DIRECT_ANSWER,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      executionIntent: 'session.answer',
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_DIRECT_ANSWER_SURFACE,
      selectedBy: 'session.main.answer.guard',
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [],
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
}
