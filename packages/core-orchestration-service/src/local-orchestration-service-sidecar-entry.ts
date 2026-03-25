import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
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

const workspaceRoot = resolveWorkspaceRoot(process.argv);
const host = new LocalOrchestrationServiceSidecarHost({
  workspaceRoot,
});
host.attachToCurrentProcess();
