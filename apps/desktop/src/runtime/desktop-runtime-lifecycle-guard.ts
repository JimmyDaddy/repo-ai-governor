import { OrchestrationServiceLifecycleStatus } from '@repo-ai-governor/orchestration-service-client';
import { DesktopArtifactQueryGateState } from '../constants/index.js';
import type { DesktopLifecycleSnapshot } from '../types/interfaces/index.js';

/**
 * Owns lifecycle, restart, notification, and artifact-gate bookkeeping for desktop shell flows.
 *
 * Why this exists:
 * release smoke and renderer-facing preload APIs need one stable source for lifecycle guard
 * facts without letting panels accumulate private restart/window/notification state.
 */
export class DesktopRuntimeLifecycleGuard {
  private readonly windowWakeIds = new Set<string>();
  private readonly notificationIds = new Set<string>();
  private restartCount = 0;
  private lastRestartReason: string | undefined;

  public constructor(
    private readonly artifactQueryGateState: DesktopArtifactQueryGateState = DesktopArtifactQueryGateState.READY,
  ) {}

  public recordWindowWake(
    windowId: string,
    serviceLifecycleStatus: string = OrchestrationServiceLifecycleStatus.READY,
  ): DesktopLifecycleSnapshot {
    this.windowWakeIds.add(windowId);
    return this.buildSnapshot(serviceLifecycleStatus);
  }

  public recordNotification(
    notificationId: string,
    serviceLifecycleStatus: string = OrchestrationServiceLifecycleStatus.READY,
  ): DesktopLifecycleSnapshot {
    this.notificationIds.add(notificationId);
    return this.buildSnapshot(serviceLifecycleStatus);
  }

  public recordServiceRestart(
    reason: string,
    serviceLifecycleStatus: string = OrchestrationServiceLifecycleStatus.READY,
  ): DesktopLifecycleSnapshot {
    this.restartCount += 1;
    this.lastRestartReason = reason;
    return this.buildSnapshot(serviceLifecycleStatus);
  }

  public getSnapshot(
    serviceLifecycleStatus: string = OrchestrationServiceLifecycleStatus.READY,
  ): DesktopLifecycleSnapshot {
    return this.buildSnapshot(serviceLifecycleStatus);
  }

  private buildSnapshot(serviceLifecycleStatus: string): DesktopLifecycleSnapshot {
    return {
      serviceLifecycleStatus,
      restartCount: this.restartCount,
      ...(this.lastRestartReason
        ? {
            lastRestartReason: this.lastRestartReason,
          }
        : {}),
      windowWakeCount: this.windowWakeIds.size,
      notificationCount: this.notificationIds.size,
      artifactQueryGateState: this.artifactQueryGateState,
    };
  }
}
