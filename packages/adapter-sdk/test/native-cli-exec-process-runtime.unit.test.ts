import type { ChildProcess } from 'node:child_process';

import { expectNativeCliExecPreservedFacts } from '../../../test/native-cli-exec-compatibility-harness.js';
import {
  AgentCliExecOperation,
  AgentCliExecOperationsRuntime,
  type AgentCliResolvedLaunchPlan,
  NativeCliExecProcessRuntime,
} from '../src/index.js';

function createRuntime(): NativeCliExecProcessRuntime {
  return new NativeCliExecProcessRuntime(new AgentCliExecOperationsRuntime('codex', 1, 1));
}

function createLaunchPlan(
  overrides: Partial<AgentCliResolvedLaunchPlan> = {},
): AgentCliResolvedLaunchPlan {
  return {
    surfaceId: 'codex',
    operation: AgentCliExecOperation.INVOKE,
    command: process.execPath,
    commandArguments: ['-e', "process.stdout.write('hello'); process.stderr.write('warn');"],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 5000,
    stdinMode: 'ignore',
    launchDiagnostics: {
      selectedEntrypoint: process.execPath,
      shellWrapped: false,
      processTreePolicy: 'process_only',
      ...(overrides.launchDiagnostics ?? {}),
    },
    ...overrides,
  };
}

describe('NativeCliExecProcessRuntime', () => {
  it('streams stdout and stderr through the shared runtime', async () => {
    const runtime = createRuntime();
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    const result = await runtime.execute(
      createLaunchPlan({
        onStdoutChunk: (chunk) => stdoutChunks.push(chunk),
        onStderrChunk: (chunk) => stderrChunks.push(chunk),
      }),
    );

    expect(result.stdout).toBe('hello');
    expect(result.stderr).toBe('warn');
    expect(stdoutChunks.join('')).toBe('hello');
    expect(stderrChunks.join('')).toBe('warn');
    expect(result.launchDiagnostics).toEqual(
      expect.objectContaining({
        selectedEntrypoint: process.execPath,
        shellWrapped: false,
        processTreePolicy: 'process_only',
        spawnErrorCode: null,
      }),
    );
  });

  it('rejects non-zero child exits instead of resolving them as success', async () => {
    const runtime = createRuntime();

    const thrownError = await runtime
      .execute(
        createLaunchPlan({
          commandArguments: ['-e', "process.stdout.write('partial'); process.exit(7);"],
        }),
      )
      .then(() => null)
      .catch((error) => error as { details?: Record<string, unknown>; message: string });

    expect(thrownError).toMatchObject({
      message: 'codex invoke exited with code 7.',
      details: expect.objectContaining({
        surface: 'codex',
        operation: AgentCliExecOperation.INVOKE,
        stdout: 'partial',
        exitCode: 7,
        signal: null,
        selectedEntrypoint: process.execPath,
        shellWrapped: false,
        processTreePolicy: 'process_only',
      }),
    });
    const details = thrownError?.details ?? {};
    expectNativeCliExecPreservedFacts('non_zero_exit', {
      launch_diagnostics_preserved:
        details.selectedEntrypoint === process.execPath &&
        details.processTreePolicy === 'process_only',
      adapter_launch_truth_projected:
        details.selectedEntrypoint === process.execPath &&
        details.shellWrapped === false &&
        details.processTreePolicy === 'process_only',
    });
  });

  it('preserves launch diagnostics when spawn fails before the child process starts', async () => {
    const runtime = createRuntime();
    const missingCommand = `${process.cwd()}/missing-native-cli-exec-${Date.now().toString()}`;

    const thrownError = await runtime
      .execute(
        createLaunchPlan({
          command: missingCommand,
          launchDiagnostics: {
            selectedEntrypoint: missingCommand,
            shellWrapped: false,
            processTreePolicy: 'process_only',
          },
        }),
      )
      .then(() => null)
      .catch((error) => error as { details?: Record<string, unknown>; message: string });

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toContain('failed to spawn');
    expect(thrownError?.details).toEqual(
      expect.objectContaining({
        selectedEntrypoint: missingCommand,
        shellWrapped: false,
        processTreePolicy: 'process_only',
        spawnErrorCode: expect.any(String),
      }),
    );
    const details = thrownError?.details ?? {};
    expectNativeCliExecPreservedFacts('spawn_failed', {
      launch_diagnostics_preserved:
        details.selectedEntrypoint === missingCommand &&
        details.processTreePolicy === 'process_only' &&
        typeof details.spawnErrorCode === 'string',
      adapter_launch_truth_projected:
        details.selectedEntrypoint === missingCommand &&
        details.shellWrapped === false &&
        details.processTreePolicy === 'process_only',
    });
  });

  it.runIf(process.platform !== 'win32')(
    'preserves adapter-authored launch truth when the child exits due to signal',
    async () => {
      const runtime = createRuntime();

      const thrownError = await runtime
        .execute(
          createLaunchPlan({
            command: '/bin/sh',
            commandArguments: ['-c', 'kill -TERM $$'],
          }),
        )
        .then(() => null)
        .catch((error) => error as { details?: Record<string, unknown>; message: string });

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toContain('exited due to signal SIGTERM');
      expect(thrownError?.details).toEqual(
        expect.objectContaining({
          selectedEntrypoint: process.execPath,
          shellWrapped: false,
          processTreePolicy: 'process_only',
          signal: 'SIGTERM',
        }),
      );
      const details = thrownError?.details ?? {};
      expectNativeCliExecPreservedFacts('signal_exit', {
        launch_diagnostics_preserved:
          details.selectedEntrypoint === process.execPath &&
          details.processTreePolicy === 'process_only',
        adapter_launch_truth_projected:
          details.selectedEntrypoint === process.execPath &&
          details.shellWrapped === false &&
          details.processTreePolicy === 'process_only',
      });
    },
  );

  it('prefers Unix process-group termination when the launch plan requests tree handling', () => {
    const runtime = createRuntime();
    const originalPlatform = process.platform;
    const killSpy = vi.spyOn(process, 'kill').mockReturnValue(true);
    const childProcess = {
      pid: 321,
      kill: vi.fn(),
    } as unknown as ChildProcess;

    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'darwin',
    });

    try {
      (
        runtime as unknown as {
          terminateChildProcess: (
            childProcess: ChildProcess,
            processTreePolicy: 'process_only' | 'process_group_best_effort',
            signal: NodeJS.Signals,
          ) => void;
        }
      ).terminateChildProcess(childProcess, 'process_group_best_effort', 'SIGTERM');

      expect(killSpy).toHaveBeenCalledWith(-321, 'SIGTERM');
      expect(childProcess.kill).not.toHaveBeenCalled();
    } finally {
      killSpy.mockRestore();
      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('uses Windows taskkill fallback before hard-killing the child process tree', () => {
    const runtime = createRuntime();
    const originalPlatform = process.platform;
    const childProcess = {
      pid: 654,
      kill: vi.fn(),
    } as unknown as ChildProcess;
    const taskkillSpy = vi
      .spyOn(
        runtime as unknown as {
          tryTerminateWindowsProcessTree: (pid: number) => void;
        },
        'tryTerminateWindowsProcessTree',
      )
      .mockImplementation(() => undefined);

    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    });

    try {
      (
        runtime as unknown as {
          terminateChildProcess: (
            childProcess: ChildProcess,
            processTreePolicy: 'process_only' | 'process_group_best_effort',
            signal: NodeJS.Signals,
          ) => void;
        }
      ).terminateChildProcess(childProcess, 'process_group_best_effort', 'SIGKILL');

      expect(taskkillSpy).toHaveBeenCalledWith(654);
      expect(childProcess.kill).toHaveBeenCalledWith('SIGKILL');
    } finally {
      taskkillSpy.mockRestore();
      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('preserves partial output and graceful termination semantics when the child exits during timeout handling', async () => {
    const runtime = createRuntime();
    const gracefulInterrupts: string[] = [];
    const hardInterrupts: string[] = [];
    const command = process.execPath;
    const commandArguments = [
      '-e',
      [
        "process.on('SIGTERM', () => process.exit(0));",
        "process.stdout.write('partial');",
        'setInterval(() => {}, 1000);',
      ].join(' '),
    ];

    const thrownError = await runtime
      .execute(
        createLaunchPlan({
          command,
          commandArguments,
          timeoutMs: 200,
          launchDiagnostics: {
            selectedEntrypoint: command,
            shellWrapped: false,
            processTreePolicy: 'process_only',
          },
          onGracefulInterruptStart: (cancelMechanism) => gracefulInterrupts.push(cancelMechanism),
          onHardTerminateStart: (cancelMechanism) => hardInterrupts.push(cancelMechanism),
        }),
      )
      .then(() => null)
      .catch((error) => error as { details?: Record<string, unknown>; message: string });

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toContain('timed out');
    expect(thrownError?.details).toEqual(
      expect.objectContaining({
        stdout: 'partial',
        selectedEntrypoint: command,
        shellWrapped: false,
        processTreePolicy: 'process_only',
      }),
    );
    expect(gracefulInterrupts).toEqual(['process_signal']);
    expect(hardInterrupts).toEqual([]);
    const details = thrownError?.details ?? {};
    expectNativeCliExecPreservedFacts('timeout_soft_terminated', {
      launch_diagnostics_preserved:
        details.selectedEntrypoint === command && details.processTreePolicy === 'process_only',
      adapter_launch_truth_projected:
        details.selectedEntrypoint === command &&
        details.shellWrapped === false &&
        details.processTreePolicy === 'process_only',
      terminate_phase_preserved:
        gracefulInterrupts.includes('process_signal') && hardInterrupts.length === 0,
      partial_output_preserved_when_available: details.stdout === 'partial',
    });
  });

  it('emits graceful and hard termination hooks when timeout escalation occurs', async () => {
    const runtime = createRuntime();
    const gracefulInterrupts: string[] = [];
    const hardInterrupts: string[] = [];
    const command = process.platform === 'win32' ? process.execPath : '/bin/sh';
    const commandArguments =
      process.platform === 'win32'
        ? [
            '-e',
            [
              "process.on('SIGTERM', () => {});",
              "process.stdout.write('partial');",
              'setInterval(() => {}, 1000);',
            ].join(' '),
          ]
        : ['-c', "trap '' TERM; printf partial; while :; do sleep 1; done"];

    const thrownError = await runtime
      .execute({
        ...createLaunchPlan(),
        command,
        commandArguments,
        timeoutMs: 40,
        terminateGraceMs: 20,
        onGracefulInterruptStart: (cancelMechanism) => gracefulInterrupts.push(cancelMechanism),
        onHardTerminateStart: (cancelMechanism) => hardInterrupts.push(cancelMechanism),
      })
      .then(() => null)
      .catch((error) => error as { details?: Record<string, unknown>; message: string });

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toContain('timed out');
    expect(gracefulInterrupts).toEqual(['process_signal']);
    expect(hardInterrupts).toEqual(['process_signal']);
    const details = thrownError?.details ?? {};
    expectNativeCliExecPreservedFacts('timeout_hard_terminated', {
      launch_diagnostics_preserved:
        details.selectedEntrypoint === process.execPath &&
        details.processTreePolicy === 'process_only',
      adapter_launch_truth_projected:
        details.selectedEntrypoint === process.execPath &&
        details.shellWrapped === false &&
        details.processTreePolicy === 'process_only',
      terminate_phase_preserved:
        gracefulInterrupts.includes('process_signal') && hardInterrupts.includes('process_signal'),
      partial_output_preserved_when_available: details.stdout === 'partial',
    });
  });

  it('preserves partial output and graceful termination semantics when abort exits cleanly', async () => {
    const runtime = createRuntime();
    const gracefulInterrupts: string[] = [];
    const hardInterrupts: string[] = [];
    const abortController = new AbortController();
    const command = process.execPath;
    const commandArguments = [
      '-e',
      [
        "process.on('SIGTERM', () => process.exit(0));",
        "process.stdout.write('partial');",
        'setInterval(() => {}, 1000);',
      ].join(' '),
    ];

    const thrownError = await runtime
      .execute(
        createLaunchPlan({
          command,
          commandArguments,
          timeoutMs: 5000,
          signal: abortController.signal,
          launchDiagnostics: {
            selectedEntrypoint: command,
            shellWrapped: false,
            processTreePolicy: 'process_only',
          },
          onStarted: () => {
            setTimeout(() => abortController.abort(), 200);
          },
          onGracefulInterruptStart: (cancelMechanism) => gracefulInterrupts.push(cancelMechanism),
          onHardTerminateStart: (cancelMechanism) => hardInterrupts.push(cancelMechanism),
        }),
      )
      .then(() => null)
      .catch((error) => error as { details?: Record<string, unknown>; message: string });

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toContain('aborted');
    expect(thrownError?.details).toEqual(
      expect.objectContaining({
        stdout: 'partial',
        aborted: true,
        selectedEntrypoint: command,
        processTreePolicy: 'process_only',
      }),
    );
    expect(gracefulInterrupts).toEqual(['abort_signal']);
    expect(hardInterrupts).toEqual([]);
    const details = thrownError?.details ?? {};
    expectNativeCliExecPreservedFacts('abort_soft_terminated', {
      launch_diagnostics_preserved:
        details.selectedEntrypoint === command && details.processTreePolicy === 'process_only',
      adapter_launch_truth_projected:
        details.selectedEntrypoint === command &&
        details.shellWrapped === false &&
        details.processTreePolicy === 'process_only',
      terminate_phase_preserved:
        gracefulInterrupts.includes('abort_signal') && hardInterrupts.length === 0,
      partial_output_preserved_when_available: details.stdout === 'partial',
    });
  });

  it('keeps the hard-terminate fuse alive for aborts until the child actually exits', async () => {
    const runtime = createRuntime();
    const gracefulInterrupts: string[] = [];
    const hardInterrupts: string[] = [];
    const abortController = new AbortController();
    const command = process.platform === 'win32' ? process.execPath : '/bin/sh';
    const commandArguments =
      process.platform === 'win32'
        ? [
            '-e',
            [
              "process.on('SIGTERM', () => {});",
              "process.stdout.write('partial');",
              'setInterval(() => {}, 1000);',
            ].join(' '),
          ]
        : ['-c', "trap '' TERM; printf partial; while :; do sleep 1; done"];

    const thrownError = await runtime
      .execute(
        createLaunchPlan({
          command,
          commandArguments,
          timeoutMs: 5000,
          terminateGraceMs: 20,
          signal: abortController.signal,
          launchDiagnostics: {
            selectedEntrypoint: command,
            shellWrapped: false,
            processTreePolicy: 'process_only',
          },
          onStarted: () => {
            setTimeout(() => abortController.abort(), 120);
          },
          onGracefulInterruptStart: (cancelMechanism) => gracefulInterrupts.push(cancelMechanism),
          onHardTerminateStart: (cancelMechanism) => hardInterrupts.push(cancelMechanism),
        }),
      )
      .then(() => null)
      .catch((error) => error as { details?: Record<string, unknown>; message: string });

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toContain('aborted');
    expect(thrownError?.details).toEqual(
      expect.objectContaining({
        stdout: 'partial',
        aborted: true,
        hardTerminated: true,
        selectedEntrypoint: command,
        processTreePolicy: 'process_only',
      }),
    );
    expect(gracefulInterrupts).toEqual(['abort_signal']);
    expect(hardInterrupts).toEqual(['abort_signal']);
    const details = thrownError?.details ?? {};
    expectNativeCliExecPreservedFacts('abort_hard_terminated', {
      launch_diagnostics_preserved:
        details.selectedEntrypoint === command && details.processTreePolicy === 'process_only',
      adapter_launch_truth_projected:
        details.selectedEntrypoint === command &&
        details.shellWrapped === false &&
        details.processTreePolicy === 'process_only',
      terminate_phase_preserved:
        gracefulInterrupts.includes('abort_signal') && hardInterrupts.includes('abort_signal'),
      partial_output_preserved_when_available: details.stdout === 'partial',
    });
  });
});
