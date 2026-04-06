import {
  OrchestrationSessionRouteId,
  OrchestrationSessionTranscriptRole,
} from '@repo-ai-governor/orchestration-service-client';
import { DesktopSessionBridge } from '../src/runtime/desktop-session-bridge.js';

describe('DesktopSessionBridge', () => {
  it('routes session bridge calls through the shared desktop runtime contract', async () => {
    const calls: Array<{ method: string; payload?: Record<string, unknown> }> = [];
    const runtime = {
      startSession: async (request: Record<string, unknown>) => {
        calls.push({ method: 'startSession', payload: request });
        return {
          created: true,
          session: {
            sessionId: 'session-1',
            status: 'open',
            openedAt: '2026-04-04T00:00:00.000Z',
            latestEventSequence: 0,
            nextCursor: '0',
            eventCount: 0,
            context: {},
          },
          latestEventSequence: 0,
          nextCursor: '0',
        };
      },
      resumeSession: async (request: Record<string, unknown>) => {
        calls.push({ method: 'resumeSession', payload: request });
        return {
          session: {
            sessionId: 'session-1',
            status: 'open',
            openedAt: '2026-04-04T00:00:00.000Z',
            latestEventSequence: 0,
            nextCursor: '0',
            eventCount: 0,
            context: {},
          },
          resumeSelector: 'latest',
          latestEventSequence: 0,
          nextCursor: '0',
        };
      },
      sendSessionTurn: async (request: Record<string, unknown>) => {
        calls.push({ method: 'sendSessionTurn', payload: request });
        return {
          session: {
            sessionId: 'session-1',
            status: 'open',
            openedAt: '2026-04-04T00:00:00.000Z',
            latestEventSequence: 1,
            nextCursor: '1',
            eventCount: 1,
            context: {},
          },
          turnId: 'turn-1',
          routeId: OrchestrationSessionRouteId.MAIN,
          acceptedAt: '2026-04-04T00:00:00.000Z',
          latestEventSequence: 1,
          nextCursor: '1',
        };
      },
      appendSessionMessage: async (request: Record<string, unknown>) => {
        calls.push({ method: 'appendSessionMessage', payload: request });
        return {
          session: {
            sessionId: 'session-1',
            status: 'open',
            openedAt: '2026-04-04T00:00:00.000Z',
            latestEventSequence: 2,
            nextCursor: '2',
            eventCount: 2,
            context: {},
          },
          latestEventSequence: 2,
          nextCursor: '2',
          event: {
            eventId: 'event-2',
            sequence: 2,
            streamCursor: '2',
            sessionId: 'session-1',
            type: 'message_appended',
            createdAt: '2026-04-04T00:00:00.000Z',
            payload: {},
          },
        };
      },
      listSessions: async () => {
        calls.push({ method: 'listSessions' });
        return {
          sessions: [],
          returnedCount: 0,
          totalMatchedCount: 0,
        };
      },
      subscribeSession: async (request: Record<string, unknown>) => {
        calls.push({ method: 'subscribeSession', payload: request });
        return {
          session: {
            sessionId: 'session-1',
            status: 'open',
            openedAt: '2026-04-04T00:00:00.000Z',
            latestEventSequence: 2,
            nextCursor: '2',
            eventCount: 2,
            context: {},
          },
          latestEventSequence: 2,
          nextCursor: '2',
          events: [],
        };
      },
    } as const;

    const bridge = new DesktopSessionBridge(runtime as never, { locale: 'en-US' });

    await bridge.startSession();
    await bridge.resumeSession('session-1');
    await bridge.sendMainTurn('session-1', 'hello');
    await bridge.appendMessage('session-1', OrchestrationSessionTranscriptRole.ASSISTANT, ['hi']);
    await bridge.listSessions();
    await bridge.subscribeSession({ sessionId: 'session-1' });

    expect(calls).toEqual([
      {
        method: 'startSession',
        payload: {
          routeId: OrchestrationSessionRouteId.MAIN,
        },
      },
      {
        method: 'resumeSession',
        payload: {
          sessionId: 'session-1',
          preferLatest: true,
        },
      },
      {
        method: 'sendSessionTurn',
        payload: {
          sessionId: 'session-1',
          routeId: OrchestrationSessionRouteId.MAIN,
          userMessage: 'hello',
          metadata: {
            locale: 'en-US',
          },
        },
      },
      {
        method: 'appendSessionMessage',
        payload: {
          sessionId: 'session-1',
          role: 'assistant',
          routeId: OrchestrationSessionRouteId.MAIN,
          lines: ['hi'],
        },
      },
      {
        method: 'listSessions',
      },
      {
        method: 'subscribeSession',
        payload: {
          sessionId: 'session-1',
        },
      },
    ]);
  });
});
