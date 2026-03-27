import { type ExecFileException, execFile } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const REPOSITORY_ROOT_PATH = resolve(fileURLToPath(new URL('..', import.meta.url)));

/**
 * Creates a fake `pnpm` executable so gate-runner tests can assert wrapper
 * behavior without executing the full repository gate graph.
 * @param options Script exit behavior override.
 * @returns {Promise<string>}
 */
async function createFakePnpmBinDirectory(
  options: { exitCode?: number; stderrMessage?: string } = {},
) {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'gate-runner-pnpm-'));
  const fakePnpmPath = resolve(tempRoot, 'pnpm');
  const exitCode = options.exitCode ?? 0;
  const stderrMessage = options.stderrMessage ?? '';

  await writeFile(
    fakePnpmPath,
    `#!/bin/sh
if [ "$1" = "run" ]; then
  if [ ${exitCode} -ne 0 ]; then
    cat >&2 <<'__REPO_AI_GOVERNOR_FAKE_PNPM_STDERR__'
${stderrMessage}
__REPO_AI_GOVERNOR_FAKE_PNPM_STDERR__
  fi
  exit ${exitCode}
fi
echo "unexpected pnpm args: $*" >&2
exit 1
`,
    'utf8',
  );
  await chmod(fakePnpmPath, 0o755);

  return tempRoot;
}

describe('gate runner wrappers', () => {
  it('prints pure JSON to stdout for repo-global json output mode', async () => {
    const fakePnpmBinDirectory = await createFakePnpmBinDirectory();

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        ['./scripts/ci/run-repo-global-gates.js', '--group', 'governance', '--output', 'json'],
        {
          cwd: REPOSITORY_ROOT_PATH,
          env: {
            ...process.env,
            PATH: `${fakePnpmBinDirectory}:${process.env.PATH ?? ''}`,
          },
        },
      );

      expect(stderr).toBe('');
      expect(stdout.trimStart().startsWith('{')).toBe(true);

      const summary = JSON.parse(stdout) as {
        group: string;
        profile: string;
        total: number;
        gates: Array<{ status: string }>;
      };

      expect(summary.profile).toBe('repo-global');
      expect(summary.group).toBe('governance');
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.gates.every((gate) => gate.status === 'passed')).toBe(true);
    } finally {
      await rm(fakePnpmBinDirectory, { recursive: true, force: true });
    }
  });

  it('routes affected profile to the real planner instead of deferred stderr', async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        './scripts/ci/run-gate-check.js',
        '--profile',
        'affected',
        '--dry-run',
        '--changed-file',
        'packages/shared/src/index.ts',
      ],
      {
        cwd: REPOSITORY_ROOT_PATH,
      },
    );

    expect(stderr).toBe('');
    expect(stdout).toContain('[gate-check] profile=affected');
    expect(stdout).toContain('[gate-check] profile=affected status=PASSED');
    expect(stdout).not.toContain('reserved but not implemented');
  });

  it('selects package-local pilot mode for affected package changes in JSON dry-run mode', async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        './scripts/ci/run-affected-check.js',
        '--dry-run',
        '--output',
        'json',
        '--changed-file',
        'packages/shared/src/index.ts',
      ],
      {
        cwd: REPOSITORY_ROOT_PATH,
      },
    );

    const payload = JSON.parse(stdout) as {
      profile: string;
      selection_mode: string;
      commands: string[];
    };

    expect(stderr).toBe('');
    expect(payload.profile).toBe('affected');
    expect(payload.selection_mode).toBe('package_local_pilot');
    expect(payload.commands).toContain('pnpm run check:package-local:pilot:incremental');
    expect(payload.commands).toContain('pnpm run check:package-local:pilot');
  });

  it('treats .codex skill docs as fast-only changes in JSON dry-run mode', async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        './scripts/ci/run-affected-check.js',
        '--dry-run',
        '--output',
        'json',
        '--changed-file',
        '.codex/skills/workspace-code-review-workflow/SKILL.md',
      ],
      {
        cwd: REPOSITORY_ROOT_PATH,
      },
    );

    const payload = JSON.parse(stdout) as {
      profile: string;
      selection_mode: string;
      commands: string[];
    };

    expect(stderr).toBe('');
    expect(payload.profile).toBe('affected');
    expect(payload.selection_mode).toBe('fast_only');
    expect(payload.commands).toEqual(['pnpm run check:fast']);
  });

  it('keeps extended stderr context in repo-global JSON failure output', async () => {
    const longStderr = Array.from({ length: 40 }, (_, index) => {
      return `gate failure line ${String(index).padStart(2, '0')} ${'x'.repeat(48)}`;
    }).join('\n');
    const fakePnpmBinDirectory = await createFakePnpmBinDirectory({
      exitCode: 1,
      stderrMessage: longStderr,
    });

    try {
      await execFileAsync(
        process.execPath,
        ['./scripts/ci/run-repo-global-gates.js', '--group', 'governance', '--output', 'json'],
        {
          cwd: REPOSITORY_ROOT_PATH,
          env: {
            ...process.env,
            PATH: `${fakePnpmBinDirectory}:${process.env.PATH ?? ''}`,
          },
        },
      );
      expect.unreachable('Expected repo-global gate wrapper to exit non-zero.');
    } catch (error) {
      const execError = error as ExecFileException & { stderr: string; stdout: string };
      const summary = JSON.parse(execError.stdout) as {
        failed: number;
        gates: Array<{ status: string; error?: string }>;
      };
      const firstFailedGate = summary.gates.find((gate) => gate.status === 'failed');

      expect(execError.code).toBe(1);
      expect(execError.stderr).toBe('');
      expect(summary.failed).toBeGreaterThan(0);
      expect(firstFailedGate?.error).toContain('gate failure line 00');
      expect(firstFailedGate?.error).toContain('gate failure line 10');
      expect(firstFailedGate?.error).toContain('gate failure line 20');
    }
  });
});
