import {
  DESKTOP_ARTIFACT_PANE_DEFERRED_REASON,
  DESKTOP_ARTIFACT_PANE_READY_NOTE,
  DESKTOP_SESSION_BRIDGE_OPERATIONS,
  DESKTOP_SHELL_COMPONENT_OWNERS,
  DESKTOP_SHELL_PACKAGE_NAME,
  DesktopArtifactQueryGateState,
  DesktopOrchestrationRuntimeMode,
} from '../constants/index.js';
import type {
  DesktopLifecycleSnapshot,
  DesktopPreloadBridgeApi,
  DesktopShellBaseline,
  DesktopShellBootstrapDependencies,
  DesktopShellBootstrapSnapshot,
} from '../types/interfaces/index.js';
import { DesktopGovernanceConsoleViewModelBuilder } from './desktop-governance-console-view-model-builder.js';
import { DesktopOrchestrationServiceRuntime } from './desktop-orchestration-service-runtime.js';
import { DesktopPreloadBridge } from './desktop-preload-bridge.js';
import { DesktopRuntimeLifecycleGuard } from './desktop-runtime-lifecycle-guard.js';
import { DesktopSessionBridge } from './desktop-session-bridge.js';

/**
 * Owns the desktop shell bootstrap chain, typed preload bridge, and restart lifecycle guard.
 *
 * Why this exists:
 * the desktop MVP foundation needs one real package-local entrypoint that freezes ownership
 * between main/preload/renderer/utility-process without importing CLI runtime internals.
 */
export class DesktopShellBootstrap {
  private readonly orchestrationRuntime: DesktopOrchestrationServiceRuntime;
  private readonly sessionBridge: DesktopSessionBridge;
  private readonly lifecycleGuard: DesktopRuntimeLifecycleGuard;
  private readonly governanceConsoleBuilder = new DesktopGovernanceConsoleViewModelBuilder();
  private readonly preloadBridge: DesktopPreloadBridge;

  public constructor(
    private readonly workspaceRoot: string,
    private readonly dependencies: DesktopShellBootstrapDependencies = {},
  ) {
    this.orchestrationRuntime = new DesktopOrchestrationServiceRuntime(workspaceRoot, {
      runtimeMode: DesktopOrchestrationRuntimeMode.SIDECAR_IPC,
      ...dependencies.runtimeDependencies,
    });
    this.sessionBridge = new DesktopSessionBridge(this.orchestrationRuntime, {
      locale: dependencies.locale,
    });
    this.lifecycleGuard = new DesktopRuntimeLifecycleGuard(
      dependencies.artifactQueryGateState ?? DesktopArtifactQueryGateState.READY,
    );
    this.preloadBridge = new DesktopPreloadBridge(
      this.orchestrationRuntime,
      this.sessionBridge,
      this.lifecycleGuard,
      this.governanceConsoleBuilder,
      () => this.bootstrap(),
      (reason) => this.restartServiceHost(reason),
    );
  }

  /**
   * Returns the frozen shell-baseline contract for desktop MVP foundation work.
   * @returns Desktop shell ownership baseline.
   */
  public describeBaseline(): DesktopShellBaseline {
    return {
      packageName: DESKTOP_SHELL_PACKAGE_NAME,
      runtimeMode: this.orchestrationRuntime.getRuntimeMode(),
      componentOwners: { ...DESKTOP_SHELL_COMPONENT_OWNERS },
      sessionBridgeOperations: [...DESKTOP_SESSION_BRIDGE_OPERATIONS],
      artifactQueryGateState:
        this.dependencies.artifactQueryGateState ?? DesktopArtifactQueryGateState.READY,
      ...((this.dependencies.artifactQueryGateState ?? DesktopArtifactQueryGateState.READY) ===
      DesktopArtifactQueryGateState.BLOCKED
        ? {
            artifactPaneDeferredReason: DESKTOP_ARTIFACT_PANE_DEFERRED_REASON,
          }
        : {
            artifactPaneDeferredReason: DESKTOP_ARTIFACT_PANE_READY_NOTE,
          }),
    };
  }

  /**
   * Verifies service readiness and returns one bootstrap snapshot for smoke or renderer setup.
   * @returns Bootstrap snapshot with baseline, health, and lifecycle state.
   */
  public async bootstrap(): Promise<DesktopShellBootstrapSnapshot> {
    const health = await this.orchestrationRuntime.getHealth();
    return {
      baseline: this.describeBaseline(),
      health,
      lifecycle: this.lifecycleGuard.getSnapshot(health.lifecycleStatus),
    };
  }

  /**
   * Returns the typed preload bridge exposed to future renderer consumers.
   * @returns Desktop preload bridge implementation.
   */
  public getPreloadBridge(): DesktopPreloadBridgeApi {
    return this.preloadBridge;
  }

  /**
   * Exposes the service runtime for privileged host-side callers such as smoke/integration tests.
   * @returns Desktop orchestration runtime.
   */
  public getRuntime(): DesktopOrchestrationServiceRuntime {
    return this.orchestrationRuntime;
  }

  /**
   * Disposes the current service host process.
   * @returns Void promise.
   */
  public async dispose(): Promise<void> {
    await this.orchestrationRuntime.dispose();
  }

  private async restartServiceHost(reason: string): Promise<DesktopLifecycleSnapshot> {
    await this.orchestrationRuntime.dispose();
    const health = await this.orchestrationRuntime.getHealth();
    return this.lifecycleGuard.recordServiceRestart(reason, health.lifecycleStatus);
  }
}
