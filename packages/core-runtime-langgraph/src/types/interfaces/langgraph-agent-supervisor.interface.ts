import type { AgentDescriptor } from '@repo-ai-governor/core-agent-projection';

export interface LangGraphSupervisorNodeBinding {
  nodeId: string;
  stageId: string;
  routeKey: string;
  roleProfileId: string;
  agentDescriptor: AgentDescriptor;
}

export interface LangGraphSupervisorPlan {
  processId: string;
  executionId: string;
  entryNodeId: string;
  generatedAt: string;
  terminalNodeIds: string[];
  nodeBindings: LangGraphSupervisorNodeBinding[];
}
