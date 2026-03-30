import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type {
  AgentDescriptor,
  AgentSessionProjection,
  AgentSessionRegistryReader,
} from './types/index.js';

/**
 * Projects shared-session facts into one agent-facing replay view without creating a new source.
 */
export class AgentSessionRegistry {
  public constructor(private readonly sessionReader: AgentSessionRegistryReader) {}

  public async project(options: {
    sessionId: string | null;
    descriptors: AgentDescriptor[];
  }): Promise<AgentSessionProjection> {
    if (!Array.isArray(options.descriptors)) {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        'AgentSessionRegistry requires descriptors array input.',
      );
    }

    if (!options.sessionId) {
      return {
        sessionId: null,
        executionId: options.descriptors[0]?.executionId ?? null,
        sessionStatus: null,
        openedAt: null,
        closedAt: null,
        totalEventCount: 0,
        agentEntries: options.descriptors.map((descriptor) => ({
          agentId: descriptor.agentId,
          agentRole: descriptor.agentRole,
          roleProfileId: descriptor.roleProfileId,
          sessionId: descriptor.sessionId,
          executionId: descriptor.executionId,
          sessionStatus: null,
          sessionEventCount: 0,
          lastEventAt: null,
          contextKeys: [],
        })),
      };
    }

    const session = await this.sessionReader.getSession(options.sessionId);
    const contextKeys = Object.keys(session.context).sort((left, right) =>
      left.localeCompare(right),
    );
    const lastEventAt =
      session.events.length > 0
        ? (session.events[session.events.length - 1]?.createdAt ?? null)
        : null;

    return {
      sessionId: session.sessionId,
      executionId: session.executionId ?? options.descriptors[0]?.executionId ?? null,
      sessionStatus: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt ?? null,
      totalEventCount: session.events.length,
      agentEntries: options.descriptors.map((descriptor) => ({
        agentId: descriptor.agentId,
        agentRole: descriptor.agentRole,
        roleProfileId: descriptor.roleProfileId,
        sessionId: descriptor.sessionId ?? session.sessionId,
        executionId: descriptor.executionId ?? session.executionId ?? null,
        sessionStatus: session.status,
        sessionEventCount: session.events.length,
        lastEventAt,
        contextKeys,
      })),
    };
  }
}
