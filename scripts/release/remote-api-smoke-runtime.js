import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';

export const REMOTE_API_SMOKE_OPENAI_KEY = 'openai-cleanroom-key';
export const REMOTE_API_SMOKE_ANTHROPIC_KEY = 'anthropic-cleanroom-key';
export const REMOTE_API_SMOKE_OPENAI_MODEL = 'gpt-5.4-mini';
export const REMOTE_API_SMOKE_ANTHROPIC_MODEL = 'claude-3-7-sonnet-20250219';

/**
 * Builds one repo-local config payload that routes Codex/Claude Code through remote APIs.
 * @param {{openAiEndpoint: string; anthropicEndpoint: string}} endpoints Remote API endpoints.
 * @returns {string}
 */
export function createRemoteApiSmokeConfigContent(endpoints) {
  return [
    'schemaVersion: "1.1"',
    'workspace:',
    '  mode: repo_local',
    '  migrationPolicy: copy_verify_switch_rollback',
    'i18n:',
    '  runtimeEngine: i18next',
    '  defaultLocale: zh-CN',
    '  fallbackLocale: en-US',
    '  supportedLocales:',
    '    - zh-CN',
    '    - en-US',
    'adapters:',
    '  roles:',
    '    - roleId: planner',
    '      roleProfileId: planner-default',
    '      requiredCapabilities:',
    '        - structured_output',
    '      required: true',
    '    - roleId: coder',
    '      roleProfileId: coder-default',
    '      requiredCapabilities:',
    '        - tool_calling',
    '      required: true',
    '  routing:',
    '    roleBindings:',
    '      planner:',
    '        primarySurface: codex',
    '        fallbackSurfaces:',
    '          - claude-code',
    '      coder:',
    '        primarySurface: claude-code',
    '        fallbackSurfaces:',
    '          - codex',
    '  tools:',
    '    - toolId: codex',
    '      enabled: true',
    '      availability: available',
    '      transport: remote_api',
    '      remoteApi:',
    '        provider: openai',
    '        vendorBinding: openai_responses',
    `        model: ${REMOTE_API_SMOKE_OPENAI_MODEL}`,
    '        credentialEnvVar: OPENAI_API_KEY',
    `        endpoint: ${endpoints.openAiEndpoint}`,
    '        requestTimeoutMs: 5000',
    '        maxRetries: 1',
    '    - toolId: claude-code',
    '      enabled: true',
    '      availability: available',
    '      transport: remote_api',
    '      remoteApi:',
    '        provider: anthropic',
    '        vendorBinding: anthropic_messages',
    `        model: ${REMOTE_API_SMOKE_ANTHROPIC_MODEL}`,
    '        credentialEnvVar: ANTHROPIC_API_KEY',
    `        endpoint: ${endpoints.anthropicEndpoint}`,
    '        requestTimeoutMs: 5000',
    '        maxRetries: 1',
    '',
  ].join('\n');
}

/**
 * Writes repo-local remote-api smoke config into the target repository.
 * @param {string} repositoryPath Target repository path.
 * @param {{openAiEndpoint: string; anthropicEndpoint: string}} endpoints Remote API endpoints.
 * @returns {string}
 */
export function writeRemoteApiSmokeConfig(repositoryPath, endpoints) {
  const configPath = resolve(repositoryPath, '.repo-ai-governor', 'governor.yaml');
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, createRemoteApiSmokeConfigContent(endpoints), 'utf8');
  return configPath;
}

/**
 * Starts one in-process stub server for OpenAI Responses and Anthropic Messages smoke traffic.
 * @returns {Promise<{
 *   baseUrl: string;
 *   openAiEndpoint: string;
 *   anthropicEndpoint: string;
 *   requests: Array<Record<string, unknown>>;
 *   close: () => Promise<void>;
 * }>}
 */
export async function startRemoteApiSmokeServer() {
  /** @type {Array<Record<string, unknown>>} */
  const requests = [];
  let requestSequence = 0;

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const rawBody = await readRequestBody(request);
    let parsedBody = null;
    if (rawBody.trim().length > 0) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        response.writeHead(400, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: { message: 'invalid json body' } }));
        return;
      }
    }

    const requestId = `${Date.now()}-${++requestSequence}`;
    if (url.pathname === '/openai/v1/responses') {
      requests.push({
        requestId,
        provider: 'openai',
        method: request.method ?? 'GET',
        path: url.pathname,
        stream: parsedBody?.stream === true,
        model: parsedBody?.model ?? null,
        authorization: request.headers.authorization ?? null,
      });
      if (request.headers.authorization !== `Bearer ${REMOTE_API_SMOKE_OPENAI_KEY}`) {
        response.writeHead(401, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: { message: 'unauthorized' } }));
        return;
      }
      if (parsedBody?.stream === true) {
        writeOpenAiStream(response, requestId);
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          id: `resp-${requestId}`,
          output_text: 'OK',
          usage: {
            input_tokens: 1,
            output_tokens: 1,
            total_tokens: 2,
          },
        }),
      );
      return;
    }

    if (url.pathname === '/anthropic/v1/messages') {
      requests.push({
        requestId,
        provider: 'anthropic',
        method: request.method ?? 'GET',
        path: url.pathname,
        stream: parsedBody?.stream === true,
        model: parsedBody?.model ?? null,
        apiKeyPresent: typeof request.headers['x-api-key'] === 'string',
      });
      if (request.headers['x-api-key'] !== REMOTE_API_SMOKE_ANTHROPIC_KEY) {
        response.writeHead(401, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: { message: 'unauthorized' } }));
        return;
      }
      if (parsedBody?.stream === true) {
        writeAnthropicStream(response, requestId);
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          id: `msg-${requestId}`,
          content: [
            {
              type: 'text',
              text: 'OK',
            },
          ],
          usage: {
            input_tokens: 1,
            output_tokens: 1,
          },
        }),
      );
      return;
    }

    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: { message: 'not found' } }));
  });

  await new Promise((resolvePromise, rejectPromise) => {
    const onError = (error) => {
      server.off('error', onError);
      rejectPromise(error);
    };
    server.on('error', onError);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', onError);
      resolvePromise(undefined);
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Remote API smoke server did not expose a usable address.');
  }

  const baseUrl = `http://127.0.0.1:${String(address.port)}`;
  return {
    baseUrl,
    openAiEndpoint: `${baseUrl}/openai/v1/responses`,
    anthropicEndpoint: `${baseUrl}/anthropic/v1/messages`,
    requests,
    close: async () => {
      await new Promise((resolvePromise, rejectPromise) => {
        server.close((error) => {
          if (error) {
            rejectPromise(error);
            return;
          }
          resolvePromise(undefined);
        });
      });
    },
  };
}

/**
 * Reads raw UTF-8 request body.
 * @param {import('node:http').IncomingMessage} request Incoming request.
 * @returns {Promise<string>}
 */
async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Writes one minimal OpenAI SSE completion.
 * @param {import('node:http').ServerResponse} response Server response.
 * @param {string} requestId Unique request id.
 */
function writeOpenAiStream(response, requestId) {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  for (const payload of [
    {
      type: 'response.created',
      response: { id: `resp-${requestId}` },
    },
    {
      type: 'response.output_text.delta',
      delta: 'OK',
    },
    {
      type: 'response.completed',
      response: { id: `resp-${requestId}` },
    },
  ]) {
    response.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
  response.write('data: [DONE]\n\n');
  response.end();
}

/**
 * Writes one minimal Anthropic SSE completion.
 * @param {import('node:http').ServerResponse} response Server response.
 * @param {string} requestId Unique request id.
 */
function writeAnthropicStream(response, requestId) {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  for (const entry of [
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: { id: `msg-${requestId}` },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        delta: {
          type: 'text_delta',
          text: 'OK',
        },
      },
    },
    {
      event: 'message_stop',
      data: {
        type: 'message_stop',
        message: { id: `msg-${requestId}` },
      },
    },
  ]) {
    response.write(`event: ${entry.event}\n`);
    response.write(`data: ${JSON.stringify(entry.data)}\n\n`);
  }
  response.write('data: [DONE]\n\n');
  response.end();
}
