import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import type { MemoryRuntimeConfig } from '@repo-ai-governor/shared';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import {
  LOCAL_ORCHESTRATION_SERVICE_SIDECAR_LOCALE_ENV,
  LOCAL_ORCHESTRATION_SERVICE_SIDECAR_MEMORY_CONFIG_ENV,
  LOCAL_ORCHESTRATION_SERVICE_SIDECAR_REPOSITORY_ROOT_ENV,
} from './constants/index.js';
import { LocalOrchestrationServiceSidecarHost } from './local-orchestration-service-sidecar-host.js';
import type { SessionMainSupervisorRuntimeContract } from './types/index.js';

const requireFromRuntime = createRequire(import.meta.url);

function resolveWorkspaceRoot(argv: string[]): string {
  const workspaceRootIndex = argv.indexOf('--workspace-root');
  if (workspaceRootIndex === -1 || workspaceRootIndex === argv.length - 1) {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      'Local orchestration sidecar entry requires --workspace-root.',
    );
  }

  return argv[workspaceRootIndex + 1] as string;
}

function resolveMemoryConfig(environment: NodeJS.ProcessEnv): MemoryRuntimeConfig | undefined {
  const serializedConfig = environment[LOCAL_ORCHESTRATION_SERVICE_SIDECAR_MEMORY_CONFIG_ENV];
  if (!serializedConfig) {
    return undefined;
  }

  let parsedConfig: unknown;
  try {
    parsedConfig = JSON.parse(serializedConfig);
  } catch (error) {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      'Local orchestration sidecar entry received invalid memory config JSON.',
      undefined,
      error,
    );
  }

  if (!parsedConfig || typeof parsedConfig !== 'object' || Array.isArray(parsedConfig)) {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      'Local orchestration sidecar entry requires memory config to be an object.',
    );
  }

  const storeEngine = (parsedConfig as { storeEngine?: unknown }).storeEngine;
  const storeRoot = (parsedConfig as { storeRoot?: unknown }).storeRoot;
  if (typeof storeEngine !== 'string' || typeof storeRoot !== 'string') {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      'Local orchestration sidecar entry requires memory config storeEngine/storeRoot strings.',
    );
  }

  return parsedConfig as MemoryRuntimeConfig;
}

function resolveRepositoryRoot(environment: NodeJS.ProcessEnv): string | undefined {
  const repositoryRoot = environment[LOCAL_ORCHESTRATION_SERVICE_SIDECAR_REPOSITORY_ROOT_ENV];
  if (!repositoryRoot) {
    return undefined;
  }

  return repositoryRoot;
}

function resolveRequestedLocale(environment: NodeJS.ProcessEnv): string | undefined {
  const requestedLocale = environment[LOCAL_ORCHESTRATION_SERVICE_SIDECAR_LOCALE_ENV];
  if (!requestedLocale || requestedLocale.trim().length === 0) {
    return undefined;
  }

  return requestedLocale.trim();
}

async function resolveSessionMainSupervisorRuntime(options: {
  workspaceRoot: string;
  repositoryRoot?: string;
  requestedLocale?: string;
}): Promise<SessionMainSupervisorRuntimeContract | undefined> {
  let cliModulePath: string;
  try {
    cliModulePath = requireFromRuntime.resolve('@repo-ai-governor/cli');
  } catch {
    return undefined;
  }

  try {
    // dynamic-import-allowed: the sidecar entry optionally reuses the CLI-owned session-main
    // supervisor wiring when the bundled host package is available in the current installation.
    const cliModule = (await import(pathToFileURL(cliModulePath).href)) as {
      createEmbeddedSessionMainSupervisorRuntime?: (options: {
        currentWorkingDirectory: string;
        requestedLocale?: string;
        environment?: NodeJS.ProcessEnv;
        repositoryRootOverride?: string;
        workspaceRootOverride?: string;
      }) => Promise<SessionMainSupervisorRuntimeContract>;
    };
    if (typeof cliModule.createEmbeddedSessionMainSupervisorRuntime !== 'function') {
      return undefined;
    }

    return await cliModule.createEmbeddedSessionMainSupervisorRuntime({
      currentWorkingDirectory: options.repositoryRoot ?? process.cwd(),
      requestedLocale: options.requestedLocale,
      environment: process.env,
      repositoryRootOverride: options.repositoryRoot,
      workspaceRootOverride: options.workspaceRoot,
    });
  } catch (error) {
    const standardizedError = standardizeError(error);
    process.stderr.write(
      `Failed to initialize session.main supervisor runtime: ${standardizedError.message}\n`,
    );
    return undefined;
  }
}

const workspaceRoot = resolveWorkspaceRoot(process.argv);
const repositoryRoot = resolveRepositoryRoot(process.env);
const sessionMainSupervisorRuntime = await resolveSessionMainSupervisorRuntime({
  workspaceRoot,
  repositoryRoot,
  requestedLocale: resolveRequestedLocale(process.env),
});
const host = new LocalOrchestrationServiceSidecarHost({
  workspaceRoot,
  ...(repositoryRoot
    ? {
        repositoryRoot,
      }
    : {}),
  memoryConfig: resolveMemoryConfig(process.env),
  ...(sessionMainSupervisorRuntime
    ? {
        sessionMainSupervisorRuntime,
      }
    : {}),
});
host.attachToCurrentProcess();
