import type { AgentCliResolvedLaunchPlan } from './types/index.js';

type NativeCliExecInternalAcpLifecyclePhase =
  | 'launch_plan_resolved'
  | 'process_started'
  | 'graceful_interrupting'
  | 'hard_terminating'
  | 'spawn_failed'
  | 'process_closed';

interface NativeCliExecInternalAcpContext {
  surfaceId: string;
  operation: AgentCliResolvedLaunchPlan['operation'];
  selectedEntrypoint: string;
  shellWrapped: boolean;
  processTreePolicy: AgentCliResolvedLaunchPlan['launchDiagnostics']['processTreePolicy'];
}

interface NativeCliExecInternalAcpLifecycleEvent {
  phase: NativeCliExecInternalAcpLifecyclePhase;
  occurredAt?: string;
  cancelMechanism?: 'process_signal' | 'abort_signal';
  detail?: string;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
}

/**
 * Holds the provisional ACP-facing runtime seam behind an internal-only boundary.
 * Why: project-098 needs an explicit future extension point without promoting ACP into
 * canonical transport truth, public package exports, or host-facing support wording.
 */
export class NativeCliExecInternalAcpExtensionSeam {
  /**
   * Captures only adapter-authored launch facts already allowed by native cli_exec truth.
   * @param plan Shared runtime launch plan.
   * @returns Internal ACP extension context.
   */
  public createContext(plan: AgentCliResolvedLaunchPlan): NativeCliExecInternalAcpContext {
    return {
      surfaceId: plan.surfaceId,
      operation: plan.operation,
      selectedEntrypoint: plan.launchDiagnostics.selectedEntrypoint,
      shellWrapped: plan.launchDiagnostics.shellWrapped,
      processTreePolicy: plan.launchDiagnostics.processTreePolicy,
    };
  }

  /**
   * Records lifecycle checkpoints for future ACP experimentation without affecting runtime truth.
   * @param _context Internal ACP extension context.
   * @param _event Internal lifecycle event.
   */
  public observeLifecycleEvent(
    _context: NativeCliExecInternalAcpContext,
    _event: NativeCliExecInternalAcpLifecycleEvent,
  ): void {
    // Internal no-op by design until ACP earns its own technical solution and host contract.
  }
}
