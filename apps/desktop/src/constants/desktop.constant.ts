export enum DesktopOrchestrationRuntimeMode {
  SIDECAR_IPC = 'sidecar_ipc',
}

export enum DesktopArtifactQueryGateState {
  BLOCKED = 'blocked',
  READY = 'ready',
}

export const DESKTOP_SHELL_PACKAGE_NAME = '@repo-ai-governor/desktop';
export const DESKTOP_CONSOLE_DEFAULT_EXECUTION_LIMIT = 5;

export const DESKTOP_SESSION_BRIDGE_OPERATIONS = [
  'getHealth',
  'startExecution',
  'listExecutions',
  'subscribeExecution',
  'startSession',
  'sendMainTurn',
  'appendMessage',
  'resumeSession',
  'listSessions',
  'subscribeSession',
  'getLifecycleSnapshot',
  'requestWindowWake',
  'registerNotification',
  'restartServiceHost',
  'buildGovernanceConsoleSnapshot',
] as const;

export const DESKTOP_SHELL_COMPONENT_OWNERS = {
  main: 'desktop shell lifecycle bootstrap',
  preload: 'typed DTO/event bridge only',
  renderer: 'governance console view-model consumer',
  utilityProcess: 'local orchestration service sidecar host',
} as const;

export const DESKTOP_ARTIFACT_PANE_DEFERRED_REASON =
  'service-owned artifact query contract is not ready; filesystem bypass remains blocked.';
