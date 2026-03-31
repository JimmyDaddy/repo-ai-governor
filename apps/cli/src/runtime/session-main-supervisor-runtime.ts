import type { ClaudeCodeExecRunner } from '@repo-ai-governor/adapter-claude-code';
import type { CodexExecRunner } from '@repo-ai-governor/adapter-codex';
import type { GithubCopilotExecRunner } from '@repo-ai-governor/adapter-github-copilot';
import {
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
} from '@repo-ai-governor/adapter-sdk';
import type { AdaptersConfig, ResolvedWorkspace } from '@repo-ai-governor/config';
import {
  SESSION_MAIN_INTERACTION_MODE,
  SESSION_MAIN_RESPONSE_MODE,
} from '@repo-ai-governor/core-orchestration-service/constants';
import type {
  SessionMainSupervisorRuntimeContract,
  SessionMainSupervisorTurnContext,
  SessionMainSupervisorTurnOutcome,
} from '@repo-ai-governor/core-orchestration-service/types';
import { AdapterSurface } from '@repo-ai-governor/shared';
import type { SessionMainSubagentDescriptor } from '../types/index.js';
import { CliAdapterRoutingRuntime } from './adapter-routing-runtime.js';
import { CliSessionMainSubagentRegistry } from './session-main-subagent-registry.js';

const SESSION_MAIN_ANSWER_ROUTE_KEY = 'session.main.answer';
const SESSION_MAIN_ANSWER_STAGE_ID = 'stage-session-main-answer';
const SESSION_MAIN_FALLBACK_DELTA_MAX_LENGTH = 80;
const SESSION_MAIN_GUARDED_DIRECT_ANSWER_SURFACE = 'guarded-direct-answer';
const SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE = 'guarded-role-delegate';
const SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX = 'session.role_delegate.';

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
    const mentionedRoleId = this.subagentRegistry.resolveMentionedRoleId(context.userMessage);
    if (mentionedRoleId) {
      return this.resolveSingleRoleDelegateTurn(
        context,
        mentionedRoleId,
        protocolBySurface,
        toolConfigBySurface,
      );
    }
    const trackedSurfaces =
      this.adapterRoutingRuntime.resolveTrackedAdapterSurfaces(toolConfigBySurface);
    const safeCandidateSurfaces = await this.resolveSafeCandidateSurfaces(
      this.resolveCandidateSurfaces(context.selectedSurface, trackedSurfaces),
      SESSION_MAIN_ANSWER_ROUTE_KEY,
      protocolBySurface,
    );
    if (safeCandidateSurfaces.length === 0) {
      return this.createGuardedFallbackOutcome(context);
    }
    const routeRunner = this.createRouteRunner({
      routeKey: SESSION_MAIN_ANSWER_ROUTE_KEY,
      protocolBySurface,
      safeCandidateSurfaces,
      toolConfigBySurface,
    });
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
      subagentCount: 0,
    };
  }

  public resolveMentionedRoleId(userMessage: string): string | null {
    return this.subagentRegistry.resolveMentionedRoleId(userMessage);
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
  ): Promise<AdapterSurface[]> {
    const safeCandidateSurfaces: AdapterSurface[] = [];
    for (const surface of candidateSurfaces) {
      const protocol = protocolBySurface[surface];
      if (!protocol) {
        continue;
      }
      const probeResult = await protocol.probe({
        routeKey,
        ...(capabilityRequirement
          ? {
              requiredCapabilities: capabilityRequirement.requiredCapabilities,
            }
          : {}),
      });
      if (
        probeResult.availabilityStatus === AgentAvailabilityStatus.UNAVAILABLE ||
        !this.isSafeDirectAnswerSurface(probeResult)
      ) {
        continue;
      }
      if (capabilityRequirement) {
        const capabilityEvaluation = this.capabilityEvaluator.evaluate(
          probeResult.capabilityMatrix,
          capabilityRequirement,
        );
        if (!capabilityEvaluation.isSatisfied) {
          continue;
        }
      }
      safeCandidateSurfaces.push(surface);
    }
    return safeCandidateSurfaces;
  }

  private async resolveSingleRoleDelegateTurn(
    context: SessionMainSupervisorTurnContext,
    roleId: string,
    protocolBySurface: Record<string, AgentProtocolContract>,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
  ): Promise<SessionMainSupervisorTurnOutcome> {
    const subagentDescriptor = this.subagentRegistry.resolveSubagentDescriptor({
      roleId,
      turnContext: context,
    });
    if (!subagentDescriptor) {
      return this.createUnknownRoleDelegateOutcome(context, roleId);
    }
    const capabilityRequirement = this.resolveCapabilityRequirement(
      subagentDescriptor.requiredCapabilities,
    );

    const safeCandidateSurfaces = await this.resolveSafeCandidateSurfaces(
      this.resolveRoleDelegateCandidateSurfaces(
        context.selectedSurface,
        subagentDescriptor,
        toolConfigBySurface,
      ),
      subagentDescriptor.routeKey,
      protocolBySurface,
      capabilityRequirement,
    );
    if (safeCandidateSurfaces.length === 0) {
      return this.createGuardedRoleDelegateOutcome(context, subagentDescriptor);
    }

    const routeRunner = this.createRouteRunner({
      routeKey: subagentDescriptor.routeKey,
      protocolBySurface,
      safeCandidateSurfaces,
      toolConfigBySurface,
      capabilityRequirement,
    });
    const dispatchResult = await routeRunner.dispatchStage({
      processId: context.sessionId,
      executionId: context.turnId,
      stageId: subagentDescriptor.stageId,
      routeKey: subagentDescriptor.routeKey,
      input: this.createRoleDelegateInput(context, subagentDescriptor),
      runtimeContext: {
        networkMode: AgentNetworkMode.STANDARD,
      },
    });
    const assistantMessage = this.resolveRoleAssistantMessage(
      dispatchResult.invokeResult.output,
      context,
      subagentDescriptor,
    );
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SINGLE_ROLE_DELEGATE,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${subagentDescriptor.roleId}`,
      requiresConfirmation: false,
      selectedSurface: dispatchResult.selectedSurface,
      selectedBy: this.resolveRoleDelegateSelectedBy(
        dispatchResult.auditRecord.selectedBy,
        context.sessionRoutingPreferenceApplied,
        !safeCandidateSurfaces.includes(context.selectedSurface as AdapterSurface),
      ),
      sessionRoutingPreferenceApplied: context.sessionRoutingPreferenceApplied,
      invokedRoleIds: [subagentDescriptor.roleId],
      subagentCount: 1,
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

  private resolveRoleDelegateCandidateSurfaces(
    preferredSurface: string,
    descriptor: SessionMainSubagentDescriptor,
    toolConfigBySurface: Map<AdapterSurface, NonNullable<AdaptersConfig['tools']>[number]>,
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
      this.adapterRoutingRuntime.resolveLocalModelFallbackSurface(toolConfigBySurface);
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
      governorInstructions: this.localizeText(
        'Answer the user directly in concise markdown. Do not execute commands or pretend a command already ran. If the input is ambiguous, ask one short clarifying question.',
        '请直接用简洁的 Markdown 回复用户。不要执行命令，也不要假装命令已经运行完成；如果输入有歧义，只问一个简短的澄清问题。',
      ),
      ...(context.metadata ? { metadata: { ...context.metadata } } : {}),
    };
  }

  private createRoleDelegateInput(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): Record<string, unknown> {
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
      governorInstructions: this.localizeText(
        `You are the ${descriptor.roleId} role subagent for Repo AI Governor. Respond from this role's perspective in concise markdown. Do not execute commands, modify files, or claim that governed commands already ran. If the user is really asking to run connect, doctor, verify, review, or run, keep the response advisory and tell the supervisor to use preview plus confirm handoff instead.`,
        `你现在是 Repo AI Governor 的 ${descriptor.roleId} 角色子代理。请用这个角色的视角输出简洁的 Markdown。不要执行命令、不要修改文件，也不要声称受治理命令已经执行。如果用户真正想运行 connect、doctor、verify、review 或 run，请仅给出建议，并明确需要由 supervisor 走 preview + confirm 交接。`,
      ),
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
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText('## Session Main Answer', '## 主会话回答'),
      '',
      this.localizeText(
        'Direct-answer bootstrap is currently restricted to no-tool surfaces.',
        '当前 direct-answer bootstrap 只允许走无工具调用的 surface。',
      ),
      '',
      this.localizeText(
        `I did not dispatch "${context.userMessage}" to a tool-capable adapter because that would bypass the governed preview + confirm handoff boundary.`,
        `我没有把「${context.userMessage}」派发给支持工具调用的 adapter，因为那会绕过受治理的 preview + confirm handoff 边界。`,
      ),
      '',
      this.localizeText(
        'Use a governed command such as `/connect`, `/doctor`, `/verify`, `/review`, or `/run`, or activate a no-tool local-model surface before retrying a free-form direct answer.',
        '请改用 `/connect`、`/doctor`、`/verify`、`/review`、`/run` 等受治理命令，或先启用一个无工具调用的本地模型 surface，再重试自由对话回答。',
      ),
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
      subagentCount: 0,
    };
  }

  private createGuardedRoleDelegateOutcome(
    context: SessionMainSupervisorTurnContext,
    descriptor: SessionMainSubagentDescriptor,
  ): SessionMainSupervisorTurnOutcome {
    const assistantMessage = [
      this.localizeText(
        `## ${this.formatRoleHeading(descriptor.roleId)} Delegate`,
        `## ${descriptor.roleId} 委派`,
      ),
      '',
      this.localizeText(
        `I did not delegate "${context.userMessage}" to the ${descriptor.roleId} role because every currently configured surface for that role is tool-capable, unavailable, or missing one required capability.`,
        `我没有把「${context.userMessage}」委派给 ${descriptor.roleId} 角色，因为这个角色当前配置的 surface 要么支持工具调用、要么不可用、要么缺少必需能力。`,
      ),
      '',
      this.localizeText(
        'The bootstrap collaboration path is currently restricted to no-tool surfaces so that front-stage role delegation does not bypass the governed handoff boundary.',
        '当前 bootstrap 协作路径只允许走无工具调用的 surface，这样前台 role delegate 才不会绕过受治理的 handoff 边界。',
      ),
    ].join('\n');
    return {
      responseMode: SESSION_MAIN_RESPONSE_MODE.ROLE_COLLABORATION,
      interactionMode: SESSION_MAIN_INTERACTION_MODE.SINGLE_ROLE_DELEGATE,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      assistantMessage,
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${descriptor.roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.role_delegate.guard',
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
      executionIntent: `${SESSION_MAIN_ROLE_EXECUTION_INTENT_PREFIX}${roleId}`,
      requiresConfirmation: false,
      selectedSurface: SESSION_MAIN_GUARDED_ROLE_DELEGATE_SURFACE,
      selectedBy: 'session.main.role_delegate.unresolved',
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

  private stripRoleMentions(userMessage: string): string {
    const sanitizedMessage = userMessage.replaceAll(/@[a-z0-9_.-]+/giu, '').trim();
    return sanitizedMessage.length > 0 ? sanitizedMessage : userMessage.trim();
  }

  private formatRoleHeading(roleId: string): string {
    return roleId
      .replaceAll(/[-_]/gu, ' ')
      .replace(/\b\w/gu, (character) => character.toUpperCase());
  }

  private localizeText(english: string, chinese: string): string {
    return this.options.locale.toLowerCase().startsWith('zh') ? chinese : english;
  }
}
