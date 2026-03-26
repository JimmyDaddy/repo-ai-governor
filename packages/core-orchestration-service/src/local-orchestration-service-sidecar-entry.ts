import type { MemoryRuntimeConfig } from "@repo-ai-governor/shared";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { LOCAL_ORCHESTRATION_SERVICE_SIDECAR_MEMORY_CONFIG_ENV } from "./constants/index.js";
import { LocalOrchestrationServiceSidecarHost } from "./local-orchestration-service-sidecar-host.js";

function resolveWorkspaceRoot(argv: string[]): string {
  const workspaceRootIndex = argv.indexOf("--workspace-root");
  if (workspaceRootIndex === -1 || workspaceRootIndex === argv.length - 1) {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      "Local orchestration sidecar entry requires --workspace-root.",
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
      "Local orchestration sidecar entry received invalid memory config JSON.",
      undefined,
      error,
    );
  }

  if (!parsedConfig || typeof parsedConfig !== "object" || Array.isArray(parsedConfig)) {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      "Local orchestration sidecar entry requires memory config to be an object.",
    );
  }

  const storeEngine = (parsedConfig as { storeEngine?: unknown }).storeEngine;
  const storeRoot = (parsedConfig as { storeRoot?: unknown }).storeRoot;
  if (typeof storeEngine !== "string" || typeof storeRoot !== "string") {
    throw new RuntimeError(
      GovernorErrorCode.MEMORY_SESSION_PAYLOAD_INVALID,
      "Local orchestration sidecar entry requires memory config storeEngine/storeRoot strings.",
    );
  }

  return parsedConfig as MemoryRuntimeConfig;
}

const workspaceRoot = resolveWorkspaceRoot(process.argv);
const host = new LocalOrchestrationServiceSidecarHost({
  workspaceRoot,
  memoryConfig: resolveMemoryConfig(process.env),
});
host.attachToCurrentProcess();
