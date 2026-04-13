import type { ChildProcess } from 'node:child_process';

import {
  AgentCliExecOperation,
  AgentCliExecOperationsRuntime,
  NativeCliExecProcessRuntime,
} from '../src/index.js';

describe('NativeCliExecProcessRuntime', () => {
  it('streams stdout and stderr through the shared runtime', async () => {
    const operationsRuntime = new AgentCliExecOperationsRuntime('codex', 1, 1);
    const runtime = new NativeCliExecProcessRuntime(operationsRuntime);
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    const result = await runtime.execute({
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
      },
      onStdoutChunk: (chunk) => stdoutChunks.push(chunk),
      onStderrChunk: (chunk) => stderrChunks.push(chunk),
    });

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
    const operationsRuntime = new AgentCliExecOperationsRuntime('codex', 1, 1);
    const runtime = new NativeCliExecProcessRuntime(operationsRuntime);

    await expect(
      runtime.execute({
        surfaceId: 'codex',
        operation: AgentCliExecOperation.INVOKE,
        command: process.execPath,
        commandArguments: ['-e', "process.stdout.write('partial'); process.exit(7);"],
        cwd: process.cwd(),
        env: process.env,
        timeoutMs: 5000,
        stdinMode: 'ignore',
        launchDiagnostics: {
          selectedEntrypoint: process.execPath,
          shellWrapped: false,
          processTreePolicy: 'process_only',
        },
      }),
    ).rejects.toMatchObject({
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
  });

  it('prefers Unix process-group termination when the launch plan requests tree handling', () => {
    const operationsRuntime = new AgentCliExecOperationsRuntime('codex', 1, 1);
    const runtime = new NativeCliExecProcessRuntime(operationsRuntime);
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
    const operationsRuntime = new AgentCliExecOperationsRuntime('codex', 1, 1);
    const runtime = new NativeCliExecProcessRuntime(operationsRuntime);
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

  it('emits graceful and hard termination hooks when timeout escalation occurs', async () => {
    const operationsRuntime = new AgentCliExecOperationsRuntime('codex', 1, 1);
    const runtime = new NativeCliExecProcessRuntime(operationsRuntime);
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

    await expect(
      runtime.execute({
        surfaceId: 'codex',
        operation: AgentCliExecOperation.INVOKE,
        command,
        commandArguments,
        cwd: process.cwd(),
        env: process.env,
        timeoutMs: 40,
        terminateGraceMs: 20,
        stdinMode: 'ignore',
        launchDiagnostics: {
          selectedEntrypoint: process.execPath,
          shellWrapped: false,
          processTreePolicy: 'process_only',
        },
        onGracefulInterruptStart: (cancelMechanism) => gracefulInterrupts.push(cancelMechanism),
        onHardTerminateStart: (cancelMechanism) => hardInterrupts.push(cancelMechanism),
      }),
    ).rejects.toThrow(/timed out/u);

    expect(gracefulInterrupts).toEqual(['process_signal']);
    expect(hardInterrupts).toEqual(['process_signal']);
  });
});
