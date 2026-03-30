import { ProcessNodeType } from '@repo-ai-governor/core-process';
import { GovernorErrorCode } from '@repo-ai-governor/shared';
import {
  LangGraphAgentDescriptorSupervisor,
  type LangGraphCompiledGraphPlan,
} from '../src/index.js';

function createGraphPlan(): LangGraphCompiledGraphPlan {
  return {
    processId: 'process-001',
    executionId: 'exec-001',
    irVersion: 'process_ir_v1',
    entryNodeId: 'node-plan',
    nodes: [
      {
        nodeId: 'node-plan',
        stageId: 'stage-plan',
        nodeType: ProcessNodeType.SEQUENTIAL,
        behavior: 'invoke_stage',
        routeKey: 'plan',
        roleProfileId: 'planner-default',
        inputSchemaRef: 'schemas/input.json',
        outputSchemaRef: 'schemas/output.json',
        retryPolicyRef: 'policy/retry-default',
        timeoutPolicyRef: 'policy/timeout-default',
        budgetPolicyRef: 'policy/budget-default',
        incomingEdgeIds: [],
        outgoingEdgeIds: [],
      },
    ],
    edges: [],
    terminalNodeIds: ['node-plan'],
    reducedStateKeys: ['execution.cursor'],
    checkpointerStateKeys: ['execution.session_id'],
    compileWarnings: [],
  };
}

describe('LangGraphAgentDescriptorSupervisor', () => {
  it('binds projected descriptors onto compiled graph nodes', () => {
    const supervisor = new LangGraphAgentDescriptorSupervisor();
    const plan = supervisor.createPlan({
      graphPlan: createGraphPlan(),
      agentDescriptors: [
        {
          agentId: 'stage-plan:planner:plan',
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
          workspaceId: 'workspace-001',
          workspaceMode: 'repo_local',
          executionId: 'exec-001',
          sessionId: 'shared-exec-001',
          selectedBy: 'primary',
          selectedSurface: 'codex',
          projectionStatus: 'planned',
          failureReasons: [],
        },
      ],
    });

    expect(plan.nodeBindings[0]).toEqual(
      expect.objectContaining({
        nodeId: 'node-plan',
        stageId: 'stage-plan',
        routeKey: 'plan',
      }),
    );
    expect(plan.nodeBindings[0]?.agentDescriptor.agentId).toBe('stage-plan:planner:plan');
  });

  it('binds descriptors for custom role profile ids by matching stage/profile/route', () => {
    const supervisor = new LangGraphAgentDescriptorSupervisor();
    const graphPlan = createGraphPlan();
    graphPlan.nodes[0] = {
      ...graphPlan.nodes[0],
      roleProfileId: 'roles.product.planner',
    };

    const plan = supervisor.createPlan({
      graphPlan,
      agentDescriptors: [
        {
          agentId: 'stage-plan:planner:plan',
          agentRole: 'planner',
          roleProfileId: 'roles.product.planner',
          roleSource: 'custom',
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
          workspaceId: 'workspace-001',
          workspaceMode: 'repo_local',
          executionId: 'exec-001',
          sessionId: 'shared-exec-001',
          selectedBy: 'primary',
          selectedSurface: 'codex',
          projectionStatus: 'planned',
          failureReasons: [],
        },
      ],
    });

    expect(plan.nodeBindings[0]?.agentDescriptor.roleProfileId).toBe('roles.product.planner');
    expect(plan.nodeBindings[0]?.agentDescriptor.agentId).toBe('stage-plan:planner:plan');
  });

  it('fails closed when one node cannot be mapped to a descriptor', () => {
    const supervisor = new LangGraphAgentDescriptorSupervisor();

    expect(() =>
      supervisor.createPlan({
        graphPlan: createGraphPlan(),
        agentDescriptors: [],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.PROCESS_RUNTIME_NODE_NOT_FOUND,
      }),
    );
  });
});
