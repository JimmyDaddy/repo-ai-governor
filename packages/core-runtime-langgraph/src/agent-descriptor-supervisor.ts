import type { AgentDescriptor } from '@repo-ai-governor/core-agent-projection';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { LangGraphCompiledGraphPlan, LangGraphSupervisorPlan } from './types/index.js';

/**
 * Binds projected agent descriptors onto compiled LangGraph node plans.
 */
export class LangGraphAgentDescriptorSupervisor {
  public createPlan(options: {
    graphPlan: LangGraphCompiledGraphPlan;
    agentDescriptors: AgentDescriptor[];
  }): LangGraphSupervisorPlan {
    const descriptorByExactKey = new Map<string, AgentDescriptor>();
    const descriptorByProfileKey = new Map<string, AgentDescriptor>();

    for (const descriptor of options.agentDescriptors) {
      descriptorByExactKey.set(descriptor.agentId, descriptor);
      const descriptorKey = this.resolveDescriptorProfileKey(descriptor);
      if (descriptorKey) {
        descriptorByProfileKey.set(descriptorKey, descriptor);
      }
    }

    const nodeBindings = options.graphPlan.nodes.map((node) => {
      const exactDescriptor =
        descriptorByProfileKey.get(`${node.stageId}:${node.roleProfileId}:${node.routeKey}`) ??
        descriptorByExactKey.get(
          `${node.stageId}:${this.resolveRoleId(node.roleProfileId, node.routeKey, node.stageId)}:${node.routeKey}`,
        );

      if (!exactDescriptor) {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_NODE_NOT_FOUND,
          `LangGraph supervisor could not resolve agent descriptor for node "${node.nodeId}".`,
          {
            nodeId: node.nodeId,
            stageId: node.stageId,
            roleProfileId: node.roleProfileId,
            routeKey: node.routeKey,
          },
        );
      }

      return {
        nodeId: node.nodeId,
        stageId: node.stageId,
        routeKey: node.routeKey,
        roleProfileId: node.roleProfileId,
        agentDescriptor: exactDescriptor,
      };
    });

    return {
      processId: options.graphPlan.processId,
      executionId: options.graphPlan.executionId,
      entryNodeId: options.graphPlan.entryNodeId,
      generatedAt: new Date().toISOString(),
      terminalNodeIds: [...options.graphPlan.terminalNodeIds],
      nodeBindings,
    };
  }

  private resolveDescriptorProfileKey(descriptor: AgentDescriptor): string | null {
    const [stageId, , ...routeSegments] = descriptor.agentId.split(':');
    const routeKey = routeSegments.join(':');
    if (!stageId || !routeKey) {
      return null;
    }

    return `${stageId}:${descriptor.roleProfileId}:${routeKey}`;
  }

  private resolveRoleId(roleProfileId: string, routeKey: string, stageId: string): string {
    const normalizedProfileRoleId = roleProfileId.endsWith('-default')
      ? roleProfileId.slice(0, Math.max(0, roleProfileId.length - '-default'.length))
      : roleProfileId.includes('.')
        ? (roleProfileId.split('.').pop() ?? roleProfileId)
        : roleProfileId;

    if (routeKey === 'route.prepare' || stageId === 'stage-prepare') {
      return 'planner';
    }
    if (routeKey === 'route.execute' || stageId === 'stage-execute') {
      return 'coder';
    }
    if (routeKey === 'route.report' || stageId === 'stage-report') {
      return 'reviewer';
    }

    return normalizedProfileRoleId;
  }
}
