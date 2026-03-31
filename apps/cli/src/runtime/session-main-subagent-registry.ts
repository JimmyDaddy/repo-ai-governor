import type { AdaptersConfig, ResolvedWorkspace } from '@repo-ai-governor/config';
import { AgentProjectionService } from '@repo-ai-governor/core-agent-projection';
import type { SessionMainSupervisorTurnContext } from '@repo-ai-governor/core-orchestration-service';
import type { SessionMainSubagentDescriptor } from '../types/index.js';

const SESSION_MAIN_SUBAGENT_MENTION_PATTERN = /@([a-z0-9_.-]+)/giu;

/**
 * Resolves explicit role mentions into projected subagent descriptors for `session.main`.
 *
 * Why this exists:
 * the foreground supervisor must consume projection truth without turning `CliSessionMainSupervisorRuntime`
 * into a second projection owner or a cross-layer God object.
 */
export class CliSessionMainSubagentRegistry {
  private readonly roleIdByToken: Map<string, string>;

  public constructor(
    private readonly options: {
      adaptersConfig: AdaptersConfig;
      workspace: Pick<ResolvedWorkspace, 'workspaceId' | 'mode'>;
      projectionService?: AgentProjectionService;
    },
  ) {
    this.roleIdByToken = new Map<string, string>();
    for (const role of options.adaptersConfig.roles) {
      this.roleIdByToken.set(role.roleId.toLowerCase(), role.roleId);
      this.roleIdByToken.set(role.roleProfileId.toLowerCase(), role.roleId);
    }
  }

  /**
   * Resolves the first explicit `@role` or `@roleProfileId` mention from one user message.
   * @param userMessage Raw session.main user text.
   * @returns Normalized role id when one explicit role mention is present.
   */
  public resolveMentionedRoleId(userMessage: string): string | null {
    for (const match of userMessage.matchAll(SESSION_MAIN_SUBAGENT_MENTION_PATTERN)) {
      const roleId = this.roleIdByToken.get((match[1] ?? '').toLowerCase());
      if (roleId) {
        return roleId;
      }
    }
    return null;
  }

  /**
   * Projects one configured role into the minimal subagent descriptor consumed by the supervisor.
   * @param options Role resolution inputs derived from the current foreground turn.
   * @returns Minimal projected subagent descriptor, or `null` when the role is unknown.
   */
  public resolveSubagentDescriptor(options: {
    roleId: string;
    turnContext: Pick<SessionMainSupervisorTurnContext, 'sessionId' | 'turnId'>;
  }): SessionMainSubagentDescriptor | null {
    const role = this.options.adaptersConfig.roles.find(
      (candidate) => candidate.roleId === options.roleId,
    );
    if (!role) {
      return null;
    }

    const routeKey = this.createRouteKey(role.roleId);
    const stageId = this.createStageId(role.roleId);
    const projectionService = this.options.projectionService ?? new AgentProjectionService();
    try {
      const descriptor = projectionService.project({
        roleId: role.roleId,
        roleProfileId: role.roleProfileId,
        routeKey,
        stageId,
        adaptersConfig: this.options.adaptersConfig,
        requiredCapabilities: [...role.requiredCapabilities],
        workspaceId: this.options.workspace.workspaceId,
        workspaceMode: this.options.workspace.mode,
        executionId: options.turnContext.turnId,
        sessionId: options.turnContext.sessionId,
        projectionStatus: 'session_main_delegate',
      });

      return {
        roleId: descriptor.agentRole,
        roleProfileId: descriptor.roleProfileId,
        agentId: descriptor.agentId,
        routeKey,
        stageId,
        permissionLevel: descriptor.permissionLevel,
        requiredCapabilities: [...descriptor.capabilities],
        primarySurface: String(descriptor.primarySurface),
        fallbackSurfaces: descriptor.fallbackSurfaces.map((surface) => String(surface)),
        projectionStatus: descriptor.projectionStatus,
        selectedSurface:
          descriptor.selectedSurface === null ? null : String(descriptor.selectedSurface),
        selectedBy: descriptor.selectedBy,
      };
    } catch {
      return null;
    }
  }

  private createRouteKey(roleId: string): string {
    return `session.main.role.${roleId}`;
  }

  private createStageId(roleId: string): string {
    return `stage-session-main-role-${roleId}`;
  }
}
