import { CliAgentProjectionPresenter } from '../../src/runtime/presentation/agent-projection-presenter.js';

describe('CliAgentProjectionPresenter', () => {
  it('summarizes fallback and capability-gap facts for CLI surfaces', () => {
    const presenter = new CliAgentProjectionPresenter();
    const agentView = {
      descriptors: [
        {
          agentId: 'planner:planner:planner',
          agentRole: 'planner',
          roleProfileId: 'planner-default',
          roleSource: 'default',
          primarySurface: 'codex',
          fallbackSurfaces: ['claude-code'],
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
          workspaceMode: 'repo_local',
          executionId: 'execution-1',
          sessionId: null,
          selectedBy: 'primary',
          selectedSurface: 'codex',
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
          primarySurface: 'codex',
          fallbackSurfaces: ['github-copilot'],
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
          workspaceMode: 'repo_local',
          executionId: 'execution-1',
          sessionId: null,
          selectedBy: 'fallback',
          selectedSurface: 'github-copilot',
          projectionStatus: 'warn',
          failureReasons: ['primary_surface_unavailable'],
          unsupportedCapabilities: [],
          degradedCapabilities: ['tool_calling'],
        },
      ],
      sessionProjection: null,
    };

    expect(presenter.buildSummaryLine(agentView, 'en-US')).toContain('fallback=1');
    expect(presenter.buildSummaryLine(agentView, 'en-US')).toContain('gaps=1');
    expect(presenter.buildHighlightLines(agentView, 'en-US')).toEqual([
      'coder: surface=github-copilot selected_by=fallback status=warn gap=degraded:tool_calling reasons=primary_surface_unavailable',
    ]);
  });
});
