import { once } from "node:events";
import { createServer } from "node:http";
import type { IncomingHttpHeaders } from "node:http";

import { NotificationChannel } from "@repo-ai-governor/notification-dispatcher";
import { WebhookNotificationProvider } from "../src/index.js";

function createRequestFixture() {
  return {
    channel: NotificationChannel.WEBHOOK,
    attempt: 1,
    message: {
      title: "HITL confirmation required",
      body: "manual review required",
      metadata: {
        executionId: "exec-webhook-001",
      },
    },
    payload: {
      executionId: "exec-webhook-001",
      stageId: "stage-hitl",
      routeKey: "policy.gate.cli.run.notification",
      riskLevel: "low",
      requiredAction: "confirm",
      deadlineAt: "2026-03-28T12:00:00Z",
      policyOutcome: "confirm",
      reason: "manual review required",
      matchedPolicies: ["policy.risk.action.confirm"],
      requiredReviewerRoles: ["Maintainer"],
    },
  };
}

describe("WebhookNotificationProvider integration", () => {
  it("posts JSON payload to the configured webhook endpoint", async () => {
    let receivedHeaders: IncomingHttpHeaders = {};
    let receivedBody: Record<string, unknown> = {};
    const server = createServer((request, response) => {
      let requestBody = "";
      request.on("data", (chunk) => {
        requestBody += chunk.toString();
      });
      request.on("end", () => {
        receivedHeaders = request.headers;
        receivedBody = JSON.parse(requestBody) as Record<string, unknown>;
        response.writeHead(202, {
          "content-type": "application/json",
          "x-request-id": "webhook-msg-001",
        });
        response.end(JSON.stringify({ id: "webhook-msg-001" }));
      });
    });

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
      const address = server.address();
      const provider = new WebhookNotificationProvider({
        endpointUrl: `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}/notify`,
        authToken: "secret-token",
        headers: {
          "x-custom-header": "custom-value",
        },
      });

      const receipt = await provider.send(createRequestFixture());

      expect(receipt.delivered).toBe(true);
      expect(receipt.providerMessageId).toBe("webhook-msg-001");
      expect(receipt.metadata?.statusCode).toBe(202);
      expect(receivedHeaders.authorization).toBe("Bearer secret-token");
      expect(receivedHeaders["x-custom-header"]).toBe("custom-value");
      expect(receivedBody.channel).toBe("webhook");
      expect((receivedBody.payload as { executionId?: string } | undefined)?.executionId).toBe(
        "exec-webhook-001",
      );
    } finally {
      await new Promise<void>((resolveServer) => server.close(() => resolveServer()));
    }
  });

  it("returns delivered=false when the endpoint responds with one non-2xx status", async () => {
    const server = createServer((_request, response) => {
      response.writeHead(500, {
        "content-type": "application/json",
      });
      response.end(JSON.stringify({ error: "upstream failure" }));
    });

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
      const address = server.address();
      const provider = new WebhookNotificationProvider({
        endpointUrl: `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}/notify`,
      });

      const receipt = await provider.send(createRequestFixture());

      expect(receipt.delivered).toBe(false);
      expect(receipt.errorMessage).toBe("Webhook endpoint returned HTTP 500.");
      expect(receipt.metadata?.statusCode).toBe(500);
    } finally {
      await new Promise<void>((resolveServer) => server.close(() => resolveServer()));
    }
  });
});
