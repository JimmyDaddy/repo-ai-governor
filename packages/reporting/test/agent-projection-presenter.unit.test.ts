import { WorkspaceMode } from '@repo-ai-governor/config';
import { AdapterSurface } from '@repo-ai-governor/shared';
import { AgentProjectionPresenter } from '../src/agent-projection-presenter.js';
import type { ExecutionReportAgentView } from '../src/index.js';

describe('AgentProjectionPresenter', () => {
  it('summarizes fallback and capability-gap facts for shared surfaces', () => {
    const presenter = new AgentProjectionPresenter();
    const agentView: ExecutionReportAgentView = {
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

    expect(presenter.buildSummaryLine(agentView, 'en-US')).toContain('fallback=1');
    expect(presenter.buildSummaryLine(agentView, 'en-US')).toContain('gaps=1');
    expect(presenter.buildHighlightLines(agentView, 'en-US')).toEqual([
      'coder: surface=github-copilot selected_by=fallback status=warn gap=degraded:tool_calling reasons=primary_surface_unavailable',
    ]);
  });
});
