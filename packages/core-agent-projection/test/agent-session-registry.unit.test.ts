import { WorkspaceMode } from '@repo-ai-governor/config';
import { AdapterSurface, GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { AgentDescriptor, AgentSessionRegistryReader } from '../src/index.js';
import { AgentSessionRegistry } from '../src/index.js';

function createDescriptor(overrides: Partial<AgentDescriptor> = {}): AgentDescriptor {
  return {
    agentId: 'stage-coder:coder:route.coder',
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
    workspaceId: 'workspace-001',
    workspaceMode: WorkspaceMode.REPO_LOCAL,
    executionId: 'exec-001',
    sessionId: 'shared-exec-001',
    selectedBy: null,
    selectedSurface: AdapterSurface.CODEX,
    projectionStatus: 'running',
    failureReasons: [],
    ...overrides,
    unsupportedCapabilities: overrides.unsupportedCapabilities ?? [],
    degradedCapabilities: overrides.degradedCapabilities ?? [],
  };
}

describe('AgentSessionRegistry', () => {
  it('projects shared-session facts onto every agent entry', async () => {
    const sessionReader: AgentSessionRegistryReader = {
      getSession: async () => ({
        sessionId: 'shared-exec-001',
        executionId: 'exec-001',
        status: 'completed',
        openedAt: '2026-03-30T01:00:00Z',
        closedAt: '2026-03-30T01:05:00Z',
        context: {
          workspace_id: 'workspace-001',
          policy_outcome: 'allow',
        },
        events: [
          {
            eventId: 'event-1',
            type: 'execution.started',
            createdAt: '2026-03-30T01:00:00Z',
            payload: {},
          },
          {
            eventId: 'event-2',
            type: 'execution.completed',
            createdAt: '2026-03-30T01:05:00Z',
            payload: {},
          },
        ],
      }),
    };

    const registry = new AgentSessionRegistry(sessionReader);
    const projection = await registry.project({
      sessionId: 'shared-exec-001',
      descriptors: [createDescriptor()],
    });

    expect(projection.sessionStatus).toBe('completed');
    expect(projection.totalEventCount).toBe(2);
    expect(projection.agentEntries[0]).toEqual(
      expect.objectContaining({
        agentId: 'stage-coder:coder:route.coder',
        sessionEventCount: 2,
        lastEventAt: '2026-03-30T01:05:00Z',
        contextKeys: ['policy_outcome', 'workspace_id'],
      }),
    );
  });

  it('returns one empty projection when no shared session id is present', async () => {
    const registry = new AgentSessionRegistry({
      getSession: async () => {
        throw new RuntimeError(
          GovernorErrorCode.MEMORY_SESSION_NOT_FOUND,
          'getSession should not be called without session id',
        );
      },
    });

    const projection = await registry.project({
      sessionId: null,
      descriptors: [createDescriptor({ sessionId: null })],
    });

    expect(projection).toEqual(
      expect.objectContaining({
        sessionId: null,
        totalEventCount: 0,
      }),
    );
    expect(projection.agentEntries[0]?.sessionEventCount).toBe(0);
  });
});
