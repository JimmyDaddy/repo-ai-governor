import { runCli } from '../src/main.js';

/**
 * Creates in-memory IO adapters for CLI integration tests.
 * @returns Buffers and io adapters used by the CLI runtime.
 */
function createBufferedIo(): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
  };
} {
  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];

  return {
    stdoutBuffer,
    stderrBuffer,
    io: {
      stdout: (value: string) => {
        stdoutBuffer.push(value);
      },
      stderr: (value: string) => {
        stderrBuffer.push(value);
      },
      cwd: () => process.cwd(),
    },
  };
}

describe('CLI command integration', () => {
  it('prints executable init output for workspace bootstrap', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(['node', 'repo-ai-governor', '--locale', 'en-US', 'init'], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdoutBuffer.join('')).toContain('Initialized workspace at');
    expect(stdoutBuffer.join('')).toContain('operation=workspace_init');
    expect(stdoutBuffer.join('')).toContain('outputMode=plain');
    expect(stdoutBuffer.join('')).toContain('verbosity=normal');
  });

  it('shows help with all Stage-1 commands', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(['node', 'repo-ai-governor', '--help'], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdoutBuffer.join('')).toContain('connect');
    expect(stdoutBuffer.join('')).toContain('review-verify');
    expect(stdoutBuffer.join('')).toContain('verify');
    expect(stdoutBuffer.join('')).toContain('upgrade');
    expect(stdoutBuffer.join('')).toContain('set-ui-theme');
    expect(stdoutBuffer.join('')).toContain('workspace');
    expect(stdoutBuffer.join('')).toContain('workflow');
  });

  it('shows explicit workflow create/edit/preview subcommands in workflow help', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(['node', 'repo-ai-governor', 'workflow', '--help'], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdoutBuffer.join('')).toContain('create');
    expect(stdoutBuffer.join('')).toContain('edit');
    expect(stdoutBuffer.join('')).toContain('preview');
  });

  it('shows workspace action shorthand in workspace help', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(['node', 'repo-ai-governor', 'workspace', '--help'], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdoutBuffer.join('')).toContain('[action]');
    expect(stdoutBuffer.join('')).toContain('[value]');
    expect(stdoutBuffer.join('')).toContain('--theme-scope <scope>');
    expect(stdoutBuffer.join('')).toContain('workspace clear-config');
    expect(stdoutBuffer.join('')).toContain('set-ui-theme calm');
  });
});
