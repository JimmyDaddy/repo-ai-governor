import { WorkspaceMode } from '@repo-ai-governor/config';
import { AdapterSurface } from '@repo-ai-governor/shared';
import { AgentProjectionPanelViewModelBuilder } from '../src/agent-projection-panel-view-model-builder.js';
import { AgentProjectionPanelStatusVariant } from '../src/constants/index.js';
import type { ExecutionReportAgentView } from '../src/index.js';

describe('AgentProjectionPanelViewModelBuilder', () => {
  it('builds one transport-neutral panel view-model from shared agentView payloads', () => {
    const builder = new AgentProjectionPanelViewModelBuilder();
    const agentView = createAgentView();

    const panel = builder.build({
      agentView,
      locale: 'en-US',
      title: 'Agent projection',
    });

    expect(panel.title).toBe('Agent projection');
    expect(panel.summaryLine).toContain('fallback=1');
    expect(panel.summaryBadges).toEqual(['fallback=1', 'degraded=1', 'blocked=0', 'session=none']);
    expect(panel.rows[0]).toMatchObject({
      title: 'coder -> github-copilot',
      statusVariant: AgentProjectionPanelStatusVariant.WARNING,
    });
    expect(panel.rows[0]?.detailLines).toContain(
      'profile=coder-default selected_by=fallback status=warn',
    );
    expect(panel.rows[0]?.detailLines).toContain('capability_gap=degraded:tool_calling');
    expect(panel.rows[0]?.detailLines).toContain('reasons=primary_surface_unavailable');
  });

  it('covers zh-CN localization and maxRows truncation for shared panel consumers', () => {
    const builder = new AgentProjectionPanelViewModelBuilder();
    const panel = builder.build({
      agentView: createAgentView(),
      locale: 'zh-CN',
      title: 'Agent 投影',
      maxRows: 1,
    });

    expect(panel.title).toBe('Agent 投影');
    expect(panel.summaryLine).toContain('agent 2 个');
    expect(panel.summaryLine).toContain('降级 1 个');
    expect(panel.summaryBadges).toEqual(['fallback=1', '降级=1', '阻断=0', 'session=none']);
    expect(panel.rows).toHaveLength(1);
    expect(panel.rows[0]?.detailLines).toContain('能力差距=degraded:tool_calling');
    expect(panel.rows[0]?.detailLines).toContain('失败原因=primary_surface_unavailable');
    expect(panel.footerNote).toBe('其余 1 个角色请查看完整 agentView 产物。');
  });
});

function createAgentView(): ExecutionReportAgentView {
  return {
    descriptors: [
      {
        agentId: 'planner:planner:planner',
        agentRole: 'planner',
        roleProfileId: 'planner-default',
        roleSource: 'default',
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE],
        capabilities: ['structured_output'],
        permissionLevel: 'read',
        inputSchemaRef: null,
        outputSchemaRef: null,
        errorContractRef: null,
        maxExecutionTimeSeconds: 300,
        stageTimeoutSeconds: 300,
        tokenBudget: null,
        costBudget: null,
        timeBudgetSeconds: null,
        retryPolicyRef: null,
        timeoutPolicyRef: null,
        budgetPolicyRef: null,
        workspaceId: 'workspace-1',
        workspaceMode: WorkspaceMode.REPO_LOCAL,
        executionId: 'execution-1',
        sessionId: null,
        selectedBy: 'primary',
        selectedSurface: AdapterSurface.CODEX,
        projectionStatus: 'pass',
        failureReasons: [],
        unsupportedCapabilities: [],
        degradedCapabilities: [],
      },
      {
        agentId: 'coder:coder:coder',
        agentRole: 'coder',
        roleProfileId: 'coder-default',
        roleSource: 'default',
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT],
        capabilities: ['tool_calling'],
        permissionLevel: 'edit',
        inputSchemaRef: null,
        outputSchemaRef: null,
        errorContractRef: null,
        maxExecutionTimeSeconds: 300,
        stageTimeoutSeconds: 300,
        tokenBudget: null,
        costBudget: null,
        timeBudgetSeconds: null,
        retryPolicyRef: null,
        timeoutPolicyRef: null,
        budgetPolicyRef: null,
        workspaceId: 'workspace-1',
        workspaceMode: WorkspaceMode.REPO_LOCAL,
        executionId: 'execution-1',
        sessionId: null,
        selectedBy: 'fallback',
        selectedSurface: AdapterSurface.GITHUB_COPILOT,
        projectionStatus: 'warn',
        failureReasons: ['primary_surface_unavailable'],
        unsupportedCapabilities: [],
        degradedCapabilities: ['tool_calling'],
      },
    ],
    sessionProjection: null,
  };
}
