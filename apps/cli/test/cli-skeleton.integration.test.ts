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

    const exitCode = await runCli(['node', 'repo-ai-governor', '--locale', 'en-US', '--help'], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdoutBuffer.join('')).toContain('connect');
    expect(stdoutBuffer.join('')).toContain('review-verify');
    expect(stdoutBuffer.join('')).not.toContain('\n  verify');
    expect(stdoutBuffer.join('')).toContain('adopt');
    expect(stdoutBuffer.join('')).toContain('host');
    expect(stdoutBuffer.join('')).toContain('upgrade');
    expect(stdoutBuffer.join('')).toContain('set-ui-theme');
    expect(stdoutBuffer.join('')).toContain('workspace');
    expect(stdoutBuffer.join('')).toContain('workflow');
    expect(stdoutBuffer.join('')).toContain('Governed capability catalog:');
    expect(stdoutBuffer.join('')).toContain('/review verify');
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

  it('shows explicit host export/verify/pack subcommands in host help', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(['node', 'repo-ai-governor', 'host', '--help'], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdoutBuffer.join('')).toContain('export');
    expect(stdoutBuffer.join('')).toContain('verify');
    expect(stdoutBuffer.join('')).toContain('pack');
  });

  it('shows explicit adopt subcommands in adopt help', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo();

    const exitCode = await runCli(['node', 'repo-ai-governor', 'adopt', '--help'], io);

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdoutBuffer.join('')).toContain('list');
    expect(stdoutBuffer.join('')).toContain('apply');
    expect(stdoutBuffer.join('')).toContain('diff');
    expect(stdoutBuffer.join('')).toContain('verify');
    expect(stdoutBuffer.join('')).toContain('upgrade');
    expect(stdoutBuffer.join('')).toContain('remove');
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
