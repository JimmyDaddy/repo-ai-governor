import { once } from 'node:events';
import { createServer } from 'node:http';

import { NotificationChannel } from '@repo-ai-governor/notification-dispatcher';
import { ChatImNotificationProvider } from '../src/index.js';

function createRequestFixture() {
  return {
    channel: NotificationChannel.CHAT_IM,
    attempt: 1,
    message: {
      title: 'HITL escalation required',
      body: 'fallback chat notification',
      metadata: {
        executionId: 'exec-chat-001',
      },
    },
    payload: {
      executionId: 'exec-chat-001',
      stageId: 'stage-hitl',
      routeKey: 'policy.gate.cli.run.notification',
      riskLevel: 'low',
      requiredAction: 'confirm',
      deadlineAt: '2026-03-28T12:00:00Z',
      policyOutcome: 'confirm',
      reason: 'fallback chat notification',
      matchedPolicies: ['policy.risk.action.confirm'],
      requiredReviewerRoles: ['Maintainer'],
    },
  };
}

describe('ChatImNotificationProvider integration', () => {
  it('posts chat-oriented payload to the configured incoming webhook endpoint', async () => {
    let receivedBody: Record<string, unknown> = {};
    const server = createServer((request, response) => {
      let requestBody = '';
      request.on('data', (chunk) => {
        requestBody += chunk.toString();
      });
      request.on('end', () => {
        receivedBody = JSON.parse(requestBody) as Record<string, unknown>;
        response.writeHead(200, {
          'content-type': 'application/json',
        });
        response.end(JSON.stringify({ messageId: 'chat-msg-001' }));
      });
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    try {
      const address = server.address();
      const provider = new ChatImNotificationProvider({
        endpointUrl: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/notify`,
      });

      const receipt = await provider.send(createRequestFixture());

      expect(receipt.delivered).toBe(true);
      expect(receipt.providerMessageId).toBe('chat-msg-001');
      expect(receivedBody.channel).toBe('chat_im');
      expect(receivedBody.text).toBe('HITL escalation required\nfallback chat notification');
    } finally {
      await new Promise<void>((resolveServer) => server.close(() => resolveServer()));
    }
  });

  it('returns delivered=false when the chat-im endpoint responds with one non-2xx status', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(429, {
        'content-type': 'application/json',
      });
      response.end(JSON.stringify({ error: 'rate limited' }));
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    try {
      const address = server.address();
      const provider = new ChatImNotificationProvider({
        endpointUrl: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/notify`,
      });

      const receipt = await provider.send(createRequestFixture());

      expect(receipt.delivered).toBe(false);
      expect(receipt.errorMessage).toBe('Chat-im endpoint returned HTTP 429.');
      expect(receipt.metadata?.statusCode).toBe(429);
    } finally {
      await new Promise<void>((resolveServer) => server.close(() => resolveServer()));
    }
  });
});
