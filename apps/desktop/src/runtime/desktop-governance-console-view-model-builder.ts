import {
  OrchestrationExecutionStatus,
  OrchestrationSessionStatus,
} from '@repo-ai-governor/orchestration-service-client';
import {
  AgentProjectionPanelStatusVariant,
  AgentProjectionPanelViewModelBuilder,
} from '@repo-ai-governor/reporting';
import { DESKTOP_ARTIFACT_PANE_DEFERRED_REASON } from '../constants/index.js';
import type {
  DesktopExecutionTimelineEntryViewModel,
  DesktopGovernanceConsoleBuildOptions,
  DesktopGovernanceConsoleSectionViewModel,
  DesktopGovernanceConsoleViewModel,
} from '../types/interfaces/index.js';

/**
 * Builds one transport-neutral desktop governance-console snapshot from service-owned DTOs.
 *
 * Why this exists:
 * desktop renderer work should stay a pure consumer of service-backed data and shared reporting
 * seams instead of assembling runtime truth or CLI-only strings inside the renderer.
 */
export class DesktopGovernanceConsoleViewModelBuilder {
  public constructor(
    private readonly agentProjectionPanelBuilder: AgentProjectionPanelViewModelBuilder = new AgentProjectionPanelViewModelBuilder(),
  ) {}

  /**
   * Builds one governance-console snapshot from service-owned DTOs and lifecycle facts.
   * @param options Shared DTO payload plus locale/workspace metadata.
   * @returns Transport-neutral desktop console view-model.
   */
  public build(options: DesktopGovernanceConsoleBuildOptions): DesktopGovernanceConsoleViewModel {
    return {
      workspaceHome: this.buildWorkspaceHome(options),
      sessionLane: this.buildSessionLane(options.locale, options.sessions),
      executionTimeline: this.buildExecutionTimeline(options.locale, options.executions),
      hitlCenter: this.buildHitlCenter(
        options.locale,
        options.executions,
        options.lifecycle.restartCount,
      ),
      artifactPaneNote: this.localizeText(
        options.locale,
        DESKTOP_ARTIFACT_PANE_DEFERRED_REASON,
        'service-owned artifact query contract 尚未就绪；当前仍阻止 filesystem bypass。',
      ),
      ...(options.agentView
        ? {
            agentProjectionPanel: this.agentProjectionPanelBuilder.build({
              agentView: options.agentView,
              locale: options.locale,
              title: this.localizeText(options.locale, 'Agent projection', 'Agent 投影'),
              maxRows: 5,
            }),
          }
        : {}),
    };
  }

  private buildWorkspaceHome(
    options: DesktopGovernanceConsoleBuildOptions,
  ): DesktopGovernanceConsoleSectionViewModel {
    const memoryProviderLabel = options.health.memoryProvider?.memoryStoreProviderId ?? 'none';
    return {
      title: this.localizeText(options.locale, 'Workspace home', '工作区主页'),
      statusVariant:
        options.lifecycle.restartCount > 0
          ? AgentProjectionPanelStatusVariant.WARNING
          : AgentProjectionPanelStatusVariant.SUCCESS,
      detailLines: [
        this.localizeText(
          options.locale,
          `workspace=${options.workspaceLabel}`,
          `工作区=${options.workspaceLabel}`,
        ),
        `root=${options.health.workspaceRoot}`,
        `host=${options.health.serviceHostKind} transport=${options.health.serviceTransportKind}`,
        this.localizeText(
          options.locale,
          `memory_provider=${memoryProviderLabel}`,
          `内存提供方=${memoryProviderLabel}`,
        ),
        this.localizeText(
          options.locale,
          `lifecycle=${options.lifecycle.serviceLifecycleStatus} restarts=${options.lifecycle.restartCount}`,
          `生命周期=${options.lifecycle.serviceLifecycleStatus} 重启=${options.lifecycle.restartCount}`,
        ),
      ],
    };
  }

  private buildSessionLane(
    locale: string,
    sessions: DesktopGovernanceConsoleBuildOptions['sessions'],
  ): DesktopGovernanceConsoleSectionViewModel {
    const latestSession = sessions[0];
    if (!latestSession) {
      return {
        title: this.localizeText(locale, 'Session lane', '会话通道'),
        statusVariant: AgentProjectionPanelStatusVariant.INFO,
        detailLines: [
          this.localizeText(
            locale,
            'No persisted desktop session is available yet.',
            '当前还没有可恢复的 desktop 会话。',
          ),
        ],
      };
    }

    return {
      title: this.localizeText(locale, 'Session lane', '会话通道'),
      statusVariant:
        latestSession.status === OrchestrationSessionStatus.ACTIVE
          ? AgentProjectionPanelStatusVariant.SUCCESS
          : AgentProjectionPanelStatusVariant.INFO,
      detailLines: [
        `session=${latestSession.sessionId}`,
        `status=${latestSession.status} route=${latestSession.currentRouteId ?? 'none'}`,
        this.localizeText(
          locale,
          `events=${latestSession.eventCount} next_cursor=${latestSession.nextCursor}`,
          `事件=${latestSession.eventCount} next_cursor=${latestSession.nextCursor}`,
        ),
      ],
    };
  }

  private buildExecutionTimeline(
    locale: string,
    executions: DesktopGovernanceConsoleBuildOptions['executions'],
  ): DesktopExecutionTimelineEntryViewModel[] {
    if (executions.length === 0) {
      return [
        {
          id: 'execution:none',
          title: this.localizeText(locale, 'Execution timeline', '执行时间线'),
          statusVariant: AgentProjectionPanelStatusVariant.INFO,
          detailLines: [
            this.localizeText(
              locale,
              'No desktop executions have been recorded yet.',
              '当前还没有记录到 desktop 执行。',
            ),
          ],
        },
      ];
    }

    return executions.map((execution) => ({
      id: execution.executionId,
      title: `${execution.executionId} -> ${execution.status}`,
      statusVariant: this.resolveExecutionStatusVariant(execution.status, execution.pendingHitl),
      detailLines: [
        `workspace=${execution.workspaceId} stage=${execution.currentStageId ?? 'none'}`,
        `events=${execution.latestEventSequence ?? 0} latest=${execution.latestEventType ?? 'none'}`,
        this.localizeText(
          locale,
          `pending_hitl=${execution.pendingHitl} artifact=${execution.latestArtifactId ?? 'none'}`,
          `待处理 HITL=${execution.pendingHitl} 产物=${execution.latestArtifactId ?? 'none'}`,
        ),
      ],
    }));
  }

  private buildHitlCenter(
    locale: string,
    executions: DesktopGovernanceConsoleBuildOptions['executions'],
    restartCount: number,
  ): DesktopGovernanceConsoleSectionViewModel {
    const pendingExecution = executions.find((execution) => execution.pendingHitl);
    if (!pendingExecution) {
      return {
        title: this.localizeText(locale, 'HITL center', 'HITL 中心'),
        statusVariant:
          restartCount > 0
            ? AgentProjectionPanelStatusVariant.WARNING
            : AgentProjectionPanelStatusVariant.SUCCESS,
        detailLines: [
          this.localizeText(
            locale,
            'No pending human decision is waiting in the desktop console.',
            '当前没有待处理的人类决策。',
          ),
        ],
      };
    }

    return {
      title: this.localizeText(locale, 'HITL center', 'HITL 中心'),
      statusVariant: AgentProjectionPanelStatusVariant.WARNING,
      detailLines: [
        `execution=${pendingExecution.executionId}`,
        `status=${pendingExecution.status} latest=${pendingExecution.latestEventType ?? 'none'}`,
        this.localizeText(
          locale,
          'Desktop renderer should surface only service-owned decision facts here.',
          '这里的决策信息必须继续只消费 service-owned facts。',
        ),
      ],
    };
  }

  private resolveExecutionStatusVariant(
    status: string,
    pendingHitl: boolean,
  ): AgentProjectionPanelStatusVariant {
    if (status === OrchestrationExecutionStatus.FAILED) {
      return AgentProjectionPanelStatusVariant.ERROR;
    }

    if (pendingHitl || status === OrchestrationExecutionStatus.RUNNING) {
      return AgentProjectionPanelStatusVariant.WARNING;
    }

    if (status === OrchestrationExecutionStatus.COMPLETED) {
      return AgentProjectionPanelStatusVariant.SUCCESS;
    }

    return AgentProjectionPanelStatusVariant.INFO;
  }

  private localizeText(locale: string, english: string, chinese: string): string {
    return locale.toLowerCase() === 'zh-cn' ? chinese : english;
  }
}
