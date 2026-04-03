#!/usr/bin/env node

import { startRemoteApiSmokeServer } from './remote-api-smoke-runtime.js';

const server = await startRemoteApiSmokeServer();
process.stdout.write(
  `${JSON.stringify({
    status: 'ready',
    baseUrl: server.baseUrl,
    openAiEndpoint: server.openAiEndpoint,
    anthropicEndpoint: server.anthropicEndpoint,
  })}\n`,
);

async function shutdown(exitCode) {
  try {
    await server.close();
  } finally {
    process.exit(exitCode);
  }
}

process.on('SIGINT', () => {
  void shutdown(0);
});
process.on('SIGTERM', () => {
  void shutdown(0);
});
