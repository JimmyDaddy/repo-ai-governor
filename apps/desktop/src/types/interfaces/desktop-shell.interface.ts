import type { OrchestrationServiceHealthResponse } from '@repo-ai-governor/orchestration-service-client';
import type {
  DesktopArtifactQueryGateState,
  DesktopOrchestrationRuntimeMode,
} from '../../constants/index.js';

/**
 * Defines one lifecycle snapshot surfaced to preload/renderer consumers.
 */
export interface DesktopLifecycleSnapshot {
  serviceLifecycleStatus: string;
  restartCount: number;
  lastRestartReason?: string;
  windowWakeCount: number;
  notificationCount: number;
  artifactQueryGateState: DesktopArtifactQueryGateState;
}

/**
 * Defines the frozen shell/bootstrap ownership baseline for desktop MVP foundation work.
 */
export interface DesktopShellBaseline {
  packageName: string;
  runtimeMode: DesktopOrchestrationRuntimeMode;
  componentOwners: {
    main: string;
    preload: string;
    renderer: string;
    utilityProcess: string;
  };
  sessionBridgeOperations: string[];
  artifactQueryGateState: DesktopArtifactQueryGateState;
  artifactPaneDeferredReason?: string;
}

/**
 * Defines the bootstrap snapshot returned after the desktop shell verifies service readiness.
 */
export interface DesktopShellBootstrapSnapshot {
  baseline: DesktopShellBaseline;
  health: OrchestrationServiceHealthResponse;
  lifecycle: DesktopLifecycleSnapshot;
}
