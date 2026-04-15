import { spawn } from 'node:child_process';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import type { AgentCliExecOperationsRuntime } from './agent-cli-exec-operations-runtime.js';
import { AgentCliExecOperation } from './constants/index.js';
import { NativeCliExecInternalAcpExtensionSeam } from './native-cli-exec-internal-acp-extension-seam.js';
import type {
  AgentCliExecRunnerResult,
  AgentCliProcessTreePolicy,
  AgentCliResolvedLaunchPlan,
} from './types/index.js';

/**
 * Owns the shared native child-process lifecycle for CLI-backed adapter execution.
 */
export class NativeCliExecProcessRuntime {
  private readonly internalAcpExtensionSeam = new NativeCliExecInternalAcpExtensionSeam();

  public constructor(private readonly cliExecOperationsRuntime: AgentCliExecOperationsRuntime) {}

  /**
   * Executes one adapter-authored launch plan and streams raw transport activity through hooks.
   * @param plan Adapter-authored launch plan.
   * @returns Captured process result plus additive launch diagnostics.
   */
  public async execute(plan: AgentCliResolvedLaunchPlan): Promise<AgentCliExecRunnerResult> {
    return await new Promise<AgentCliExecRunnerResult>((resolve, reject) => {
      const startedAtMs = Date.now();
      const shouldPipeStdin = (plan.stdinMode ?? 'pipe') === 'pipe';
      const processTreePolicy = plan.launchDiagnostics.processTreePolicy;
      const internalAcpContext = this.internalAcpExtensionSeam.createContext(plan);
      this.internalAcpExtensionSeam.observeLifecycleEvent(internalAcpContext, {
        phase: 'launch_plan_resolved',
      });
      let childProcess: ReturnType<typeof spawn>;
      try {
        childProcess = spawn(plan.command, [...plan.commandArguments], {
          cwd: plan.cwd,
          env: plan.env,
          stdio: [shouldPipeStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
          ...(this.shouldUseDetachedProcessGroup(processTreePolicy) ? { detached: true } : {}),
        });
      } catch (error) {
        this.internalAcpExtensionSeam.observeLifecycleEvent(internalAcpContext, {
          phase: 'spawn_failed',
          detail: standardizeError(error).message,
        });
        reject(this.createSpawnRuntimeError(plan, error, '', ''));
        return;
      }

      let stdout = '';
      let stderr = '';
      let settled = false;
      let timedOut = false;
      let abortRequested = false;
      let hardTerminated = false;
      let gracefulInterruptNotified = false;
      let hardTerminateNotified = false;
      let hardTerminateHandle: NodeJS.Timeout | null = null;

      const startedAt = new Date(startedAtMs).toISOString();
      plan.onStarted?.(startedAt);
      this.internalAcpExtensionSeam.observeLifecycleEvent(internalAcpContext, {
        phase: 'process_started',
        occurredAt: startedAt,
      });

      const notifyGracefulInterrupt = (
        cancelMechanism: 'process_signal' | 'abort_signal',
      ): void => {
        if (gracefulInterruptNotified) {
          return;
        }
        gracefulInterruptNotified = true;
        plan.onGracefulInterruptStart?.(cancelMechanism);
        this.internalAcpExtensionSeam.observeLifecycleEvent(internalAcpContext, {
          phase: 'graceful_interrupting',
          cancelMechanism,
        });
      };

      const notifyHardTerminate = (cancelMechanism: 'process_signal' | 'abort_signal'): void => {
        if (hardTerminateNotified) {
          return;
        }
        hardTerminateNotified = true;
        plan.onHardTerminateStart?.(cancelMechanism);
        this.internalAcpExtensionSeam.observeLifecycleEvent(internalAcpContext, {
          phase: 'hard_terminating',
          cancelMechanism,
        });
      };

      const clearTerminationTimers = (): void => {
        clearTimeout(timeoutHandle);
        if (hardTerminateHandle) {
          clearTimeout(hardTerminateHandle);
          hardTerminateHandle = null;
        }
      };

      const startHardTerminationFuse = (
        cancelMechanism: 'process_signal' | 'abort_signal',
      ): void => {
        if (hardTerminateHandle) {
          return;
        }
        hardTerminateHandle = setTimeout(
          () => {
            hardTerminated = true;
            notifyHardTerminate(cancelMechanism);
            this.terminateChildProcess(childProcess, processTreePolicy, 'SIGKILL');
          },
          this.resolveTerminateGraceMs(plan.timeoutMs, plan.terminateGraceMs),
        );
      };

      const finishReject = (error: unknown): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTerminationTimers();
        plan.signal?.removeEventListener('abort', onAbortSignal);
        reject(error);
      };

      const onAbortSignal = () => {
        abortRequested = true;
        notifyGracefulInterrupt('abort_signal');
        this.terminateChildProcess(childProcess, processTreePolicy, 'SIGTERM');
        startHardTerminationFuse('abort_signal');
      };

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        notifyGracefulInterrupt('process_signal');
        this.terminateChildProcess(childProcess, processTreePolicy, 'SIGTERM');
        startHardTerminationFuse('process_signal');
      }, plan.timeoutMs);

      plan.signal?.addEventListener('abort', onAbortSignal, { once: true });
      if (plan.signal?.aborted) {
        onAbortSignal();
      }

      childProcess.on('error', (error) => {
        this.internalAcpExtensionSeam.observeLifecycleEvent(internalAcpContext, {
          phase: 'spawn_failed',
          detail: standardizeError(error).message,
        });
        finishReject(this.createSpawnRuntimeError(plan, error, stdout, stderr));
      });

      childProcess.stdout?.setEncoding('utf8');
      childProcess.stdout?.on('data', (chunk: string) => {
        stdout += chunk;
        plan.onStdoutChunk?.(chunk);
      });

      childProcess.stderr?.setEncoding('utf8');
      childProcess.stderr?.on('data', (chunk: string) => {
        stderr += chunk;
        plan.onStderrChunk?.(chunk);
      });

      childProcess.on('close', (exitCode, signal) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTerminationTimers();
        plan.signal?.removeEventListener('abort', onAbortSignal);
        this.internalAcpExtensionSeam.observeLifecycleEvent(internalAcpContext, {
          phase: 'process_closed',
          exitCode,
          signal,
        });

        if (timedOut) {
          reject(
            new RuntimeError(
              this.resolveOperationErrorCode(plan.operation),
              hardTerminated
                ? `${plan.surfaceId} ${plan.operation} timed out after ${plan.timeoutMs}ms and exceeded graceful interrupt window.`
                : `${plan.surfaceId} ${plan.operation} timed out after ${plan.timeoutMs}ms.`,
              this.cliExecOperationsRuntime.createRedactedProcessDetails({
                surface: plan.surfaceId,
                operation: plan.operation,
                timeoutMs: plan.timeoutMs,
                stdout,
                stderr,
                exitCode,
                signal,
                selectedEntrypoint: plan.launchDiagnostics.selectedEntrypoint,
                shellWrapped: plan.launchDiagnostics.shellWrapped,
                processTreePolicy,
                ...(hardTerminated ? { hardTerminated: true } : {}),
              }),
            ),
          );
          return;
        }

        if (abortRequested) {
          reject(
            new RuntimeError(
              this.resolveOperationErrorCode(plan.operation),
              hardTerminated
                ? `${plan.surfaceId} ${plan.operation} aborted and exceeded graceful interrupt window.`
                : `${plan.surfaceId} ${plan.operation} aborted before completion.`,
              this.cliExecOperationsRuntime.createRedactedProcessDetails({
                surface: plan.surfaceId,
                operation: plan.operation,
                timeoutMs: plan.timeoutMs,
                stdout,
                stderr,
                exitCode,
                signal,
                aborted: true,
                selectedEntrypoint: plan.launchDiagnostics.selectedEntrypoint,
                shellWrapped: plan.launchDiagnostics.shellWrapped,
                processTreePolicy,
                ...(hardTerminated ? { hardTerminated: true } : {}),
              }),
            ),
          );
          return;
        }

        if (signal || exitCode !== 0) {
          reject(
            new RuntimeError(
              this.resolveOperationErrorCode(plan.operation),
              signal
                ? `${plan.surfaceId} ${plan.operation} exited due to signal ${signal}.`
                : `${plan.surfaceId} ${plan.operation} exited with code ${String(exitCode)}.`,
              this.cliExecOperationsRuntime.createRedactedProcessDetails({
                surface: plan.surfaceId,
                operation: plan.operation,
                stdout,
                stderr,
                exitCode,
                signal,
                selectedEntrypoint: plan.launchDiagnostics.selectedEntrypoint,
                shellWrapped: plan.launchDiagnostics.shellWrapped,
                processTreePolicy,
              }),
            ),
          );
          return;
        }

        resolve({
          stdout,
          stderr,
          exitCode,
          signal,
          elapsedMs: Date.now() - startedAtMs,
          launchDiagnostics: {
            ...plan.launchDiagnostics,
            spawnErrorCode: null,
          },
        });
      });

      if (shouldPipeStdin) {
        childProcess.stdin?.end(plan.stdinPayload ?? '');
      }
    });
  }

  /**
   * Applies the adapter-authored process-tree policy during termination.
   * @param childProcess Spawned child process.
   * @param processTreePolicy Adapter-authored termination policy.
   * @param signal Termination signal.
   */
  private terminateChildProcess(
    childProcess: ReturnType<typeof spawn>,
    processTreePolicy: AgentCliProcessTreePolicy,
    signal: NodeJS.Signals,
  ): void {
    if (
      processTreePolicy === 'process_group_best_effort' &&
      childProcess.pid &&
      process.platform !== 'win32'
    ) {
      try {
        process.kill(-childProcess.pid, signal);
        return;
      } catch {
        // Fall through to child-only kill when the detached process group is unavailable.
      }
    }

    if (
      processTreePolicy === 'process_group_best_effort' &&
      childProcess.pid &&
      signal === 'SIGKILL'
    ) {
      this.tryTerminateWindowsProcessTree(childProcess.pid);
    }
    childProcess.kill(signal);
  }

  /**
   * Best-effort Windows tree termination for spawned CLI processes.
   * @param pid Child process identifier.
   */
  private tryTerminateWindowsProcessTree(pid: number): void {
    if (process.platform !== 'win32') {
      return;
    }
    try {
      const taskkill = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      taskkill.unref();
    } catch {
      // Best effort only; caller still falls back to child.kill().
    }
  }

  /**
   * Creates one structured spawn failure runtime error.
   * @param plan Adapter-authored launch plan.
   * @param error Spawn failure payload.
   * @param stdout Captured stdout prior to failure.
   * @param stderr Captured stderr prior to failure.
   * @returns Structured runtime error.
   */
  private createSpawnRuntimeError(
    plan: AgentCliResolvedLaunchPlan,
    error: unknown,
    stdout: string,
    stderr: string,
  ): RuntimeError {
    const standardizedError = standardizeError(error);
    const spawnErrorCode = this.resolveSpawnErrorCode(error);
    return new RuntimeError(
      this.resolveOperationErrorCode(plan.operation),
      `${plan.surfaceId} ${plan.operation} failed to spawn ${plan.command}: ${standardizedError.message}`,
      this.cliExecOperationsRuntime.createRedactedProcessDetails({
        surface: plan.surfaceId,
        operation: plan.operation,
        stdout,
        stderr,
        selectedEntrypoint: plan.launchDiagnostics.selectedEntrypoint,
        shellWrapped: plan.launchDiagnostics.shellWrapped,
        processTreePolicy: plan.launchDiagnostics.processTreePolicy,
        spawnErrorCode,
      }),
    );
  }

  /**
   * Reads best-effort process spawn error codes from raw child-process failures.
   * @param error Unknown spawn error payload.
   * @returns Stable spawn error code when present.
   */
  private resolveSpawnErrorCode(error: unknown): string | null {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    ) {
      return (error as { code: string }).code;
    }
    return null;
  }

  /**
   * Resolves the interrupt grace window used before escalating to hard termination.
   * @param timeoutMs Total timeout budget.
   * @param explicitGraceMs Optional adapter-authored override.
   * @returns Grace duration in milliseconds.
   */
  private resolveTerminateGraceMs(timeoutMs: number, explicitGraceMs?: number): number {
    if (typeof explicitGraceMs === 'number' && Number.isFinite(explicitGraceMs)) {
      return Math.max(250, Math.floor(explicitGraceMs));
    }
    return Math.max(250, Math.min(2000, Math.floor(timeoutMs / 10)));
  }

  /**
   * Decides whether the child process should own a detached process group.
   * @param processTreePolicy Adapter-authored process-tree policy.
   * @returns True when a detached process group should be created.
   */
  private shouldUseDetachedProcessGroup(processTreePolicy: AgentCliProcessTreePolicy): boolean {
    return processTreePolicy === 'process_group_best_effort' && process.platform !== 'win32';
  }

  /**
   * Maps CLI operation kinds to standardized protocol error codes.
   * @param operation Probe/invoke operation label.
   * @returns Standardized runtime error code.
   */
  private resolveOperationErrorCode(operation: AgentCliExecOperation): GovernorErrorCode {
    return operation === AgentCliExecOperation.PROBE
      ? GovernorErrorCode.ADAPTER_PROTOCOL_PROBE_FAILED
      : GovernorErrorCode.ADAPTER_PROTOCOL_INVOKE_FAILED;
  }
}
