import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const SCRIPT_PATH = resolve(process.cwd(), 'scripts/ci/run-cli-exec-compatibility-profile.js');

/**
 * Runs the compatibility-profile router in JSON mode.
 * @param args Extra CLI arguments.
 * @param cwd Working directory used to execute the router.
 * @returns {{
 *   profileId: string | null;
 *   reason: string;
 *   adapterId: string | null;
 *   changedFiles: string[];
 *   touchedAdapters: string[];
 *   command: string | null;
 *   source: string;
 * }}
 */
function runCompatibilityProfileJson(args: string[], cwd = process.cwd()) {
  const stdout = execFileSync(process.execPath, [SCRIPT_PATH, '--output', 'json', ...args], {
    cwd,
    encoding: 'utf8',
  });

  return JSON.parse(stdout) as {
    profileId: string | null;
    reason: string;
    adapterId: string | null;
    changedFiles: string[];
    touchedAdapters: string[];
    command: string | null;
    source: string;
  };
}

function runGit(tempRepoPath: string, args: string[]) {
  execFileSync('git', args, {
    cwd: tempRepoPath,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

describe('cli exec compatibility profile runner', () => {
  it('renders the full profile command for explicit profile selection', () => {
    const payload = runCompatibilityProfileJson(['--profile', 'cli_exec_compatibility_full']);

    expect(payload.profileId).toBe('cli_exec_compatibility_full');
    expect(payload.reason).toBe('explicit_profile');
    expect(payload.command).toContain(
      'packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts',
    );
    expect(payload.command).toContain(
      'packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts',
    );
    expect(payload.command).toContain('apps/cli/test/connect-phase2.integration.test.ts');
  });

  it('renders the adapter-slice command for explicit profile selection with adapter input', () => {
    const payload = runCompatibilityProfileJson([
      '--profile',
      'cli_exec_compatibility_adapter_slice',
      '--adapter',
      'codex',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_adapter_slice');
    expect(payload.reason).toBe('explicit_profile');
    expect(payload.adapterId).toBe('codex');
    expect(payload.command).toContain(
      'packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts',
    );
  });

  it('routes shared runtime consumer changes to the full profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'apps/cli/src/runtime/adapter-verification-runtime.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_full');
    expect(payload.reason).toBe('shared_runtime_or_consumer_changed');
  });

  it('routes compatibility router surfaces to the full profile', () => {
    for (const changedFile of [
      'package.json',
      'scripts/ci/run-cli-exec-compatibility-profile.js',
      'test/cli-exec-compatibility-profile.integration.test.ts',
    ]) {
      const payload = runCompatibilityProfileJson(['--changed-file', changedFile]);

      expect(payload.profileId).toBe('cli_exec_compatibility_full');
      expect(payload.reason).toBe('shared_runtime_or_consumer_changed');
    }
  });

  it('routes shared runtime owner changes to the full profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_full');
    expect(payload.reason).toBe('shared_runtime_or_consumer_changed');
  });

  it('routes the internal acp seam to the full profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_full');
    expect(payload.reason).toBe('shared_runtime_or_consumer_changed');
  });

  it('routes shared cli exec operations runtime changes to the full profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_full');
    expect(payload.reason).toBe('shared_runtime_or_consumer_changed');
  });

  it('routes cross-adapter changes to the runtime-foundation profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapters/codex/src/codex-agent-adapter.ts',
      '--changed-file',
      'packages/adapters/claude-code/src/claude-code-agent-adapter.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_runtime_foundation');
    expect(payload.reason).toBe('cross_adapter_slice_changed');
    expect(payload.touchedAdapters).toEqual(['codex', 'claude-code']);
  });

  it('routes shared runtime test changes to the runtime-foundation profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_runtime_foundation');
    expect(payload.reason).toBe('shared_runtime_foundation_changed');
  });

  it('routes the internal acp seam unit test to the runtime-foundation profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_runtime_foundation');
    expect(payload.reason).toBe('shared_runtime_foundation_changed');
  });

  it('routes the shared compatibility harness to the runtime-foundation profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'test/native-cli-exec-compatibility-harness.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_runtime_foundation');
    expect(payload.reason).toBe('shared_runtime_foundation_changed');
  });

  it.each([
    'packages/adapter-sdk/src/agent-capability-evaluator.ts',
    'packages/adapter-sdk/src/agent-route-runner.ts',
    'packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts',
    'packages/adapter-sdk/test/layered-health-check-runtime.unit.test.ts',
  ])('does not route unrelated shared adapter-sdk surfaces: %s', (changedFile) => {
    const payload = runCompatibilityProfileJson(['--changed-file', changedFile]);

    expect(payload.profileId).toBeNull();
    expect(payload.reason).toBe('no_cli_exec_runtime_change_detected');
    expect(payload.command).toBeNull();
  });

  it('routes single-adapter changes to the adapter-slice profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts',
    ]);

    expect(payload.profileId).toBe('cli_exec_compatibility_adapter_slice');
    expect(payload.reason).toBe('single_adapter_slice_changed');
    expect(payload.adapterId).toBe('github-copilot');
    expect(payload.command).toContain(
      'packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts',
    );
  });

  it('reports docs-only changes as no compatibility-profile trigger', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      '.repo-ai-governor/context/current-context.md',
    ]);

    expect(payload.profileId).toBeNull();
    expect(payload.reason).toBe('docs_only_change');
    expect(payload.command).toBeNull();
  });

  it('does not route adapter package docs to the adapter-slice profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapters/codex/README.md',
    ]);

    expect(payload.profileId).toBeNull();
    expect(payload.reason).toBe('no_cli_exec_runtime_change_detected');
    expect(payload.command).toBeNull();
  });

  it('does not route host-renderer changes to the adapter-slice profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapters/codex/src/codex-host-renderer.ts',
    ]);

    expect(payload.profileId).toBeNull();
    expect(payload.reason).toBe('no_cli_exec_runtime_change_detected');
    expect(payload.command).toBeNull();
  });

  it('does not route adapter constants to the adapter-slice profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapters/codex/src/constants/codex-agent-adapter.constant.ts',
    ]);

    expect(payload.profileId).toBeNull();
    expect(payload.reason).toBe('no_cli_exec_runtime_change_detected');
    expect(payload.command).toBeNull();
  });

  it('does not route adapter interfaces to the adapter-slice profile', () => {
    const payload = runCompatibilityProfileJson([
      '--changed-file',
      'packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts',
    ]);

    expect(payload.profileId).toBeNull();
    expect(payload.reason).toBe('no_cli_exec_runtime_change_detected');
    expect(payload.command).toBeNull();
  });

  it('routes git-range shared-runtime changes to the full profile', () => {
    const tempRepoPath = mkdtempSync(resolve(tmpdir(), 'cli-exec-compatibility-profile-'));

    try {
      runGit(tempRepoPath, ['init']);
      runGit(tempRepoPath, ['config', 'user.name', 'AI Agent']);
      runGit(tempRepoPath, ['config', 'user.email', 'ai-agent@example.com']);

      mkdirSync(resolve(tempRepoPath, 'packages/adapter-sdk/src'), { recursive: true });
      writeFileSync(
        resolve(tempRepoPath, 'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts'),
        'export const runtime = 1;\n',
        'utf8',
      );
      runGit(tempRepoPath, ['add', '.']);
      runGit(tempRepoPath, ['commit', '-m', 'baseline']);

      writeFileSync(
        resolve(tempRepoPath, 'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts'),
        'export const runtime = 2;\n',
        'utf8',
      );
      runGit(tempRepoPath, ['add', '.']);
      runGit(tempRepoPath, ['commit', '-m', 'shared runtime change']);

      const payload = runCompatibilityProfileJson(
        ['--base-ref', 'HEAD~1', '--head-ref', 'HEAD'],
        tempRepoPath,
      );

      expect(payload.profileId).toBe('cli_exec_compatibility_full');
      expect(payload.reason).toBe('shared_runtime_or_consumer_changed');
      expect(payload.source).toBe('git_range');
      expect(payload.changedFiles).toEqual([
        'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts',
      ]);
    } finally {
      rmSync(tempRepoPath, { recursive: true, force: true });
    }
  });

  it('fails fast when an explicit base ref cannot be resolved', () => {
    const tempRepoPath = mkdtempSync(resolve(tmpdir(), 'cli-exec-compatibility-profile-'));

    try {
      runGit(tempRepoPath, ['init']);
      runGit(tempRepoPath, ['config', 'user.name', 'AI Agent']);
      runGit(tempRepoPath, ['config', 'user.email', 'ai-agent@example.com']);

      mkdirSync(resolve(tempRepoPath, 'packages/adapter-sdk/src'), { recursive: true });
      writeFileSync(
        resolve(tempRepoPath, 'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts'),
        'export const runtime = 1;\n',
        'utf8',
      );
      runGit(tempRepoPath, ['add', '.']);
      runGit(tempRepoPath, ['commit', '-m', 'baseline']);

      expect(() =>
        runCompatibilityProfileJson(
          ['--base-ref', 'missing-ref', '--head-ref', 'HEAD'],
          tempRepoPath,
        ),
      ).toThrow('Explicit base ref "missing-ref" could not be resolved locally.');
    } finally {
      rmSync(tempRepoPath, { recursive: true, force: true });
    }
  });

  it('fails fast for an explicit invalid base ref even when an env fallback resolves', () => {
    const tempRepoPath = mkdtempSync(resolve(tmpdir(), 'cli-exec-compatibility-profile-'));
    const previousBaseRef = process.env.REPO_AI_GOVERNOR_AFFECTED_BASE_REF;

    try {
      runGit(tempRepoPath, ['init']);
      runGit(tempRepoPath, ['config', 'user.name', 'AI Agent']);
      runGit(tempRepoPath, ['config', 'user.email', 'ai-agent@example.com']);

      mkdirSync(resolve(tempRepoPath, 'packages/adapter-sdk/src'), { recursive: true });
      writeFileSync(
        resolve(tempRepoPath, 'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts'),
        'export const runtime = 1;\n',
        'utf8',
      );
      runGit(tempRepoPath, ['add', '.']);
      runGit(tempRepoPath, ['commit', '-m', 'baseline']);

      writeFileSync(
        resolve(tempRepoPath, 'packages/adapter-sdk/src/native-cli-exec-process-runtime.ts'),
        'export const runtime = 2;\n',
        'utf8',
      );
      runGit(tempRepoPath, ['add', '.']);
      runGit(tempRepoPath, ['commit', '-m', 'shared runtime change']);

      process.env.REPO_AI_GOVERNOR_AFFECTED_BASE_REF = 'HEAD~1';

      expect(() =>
        runCompatibilityProfileJson(
          ['--base-ref', 'missing-ref', '--head-ref', 'HEAD'],
          tempRepoPath,
        ),
      ).toThrow('Explicit base ref "missing-ref" could not be resolved locally.');
    } finally {
      if (typeof previousBaseRef === 'string') {
        process.env.REPO_AI_GOVERNOR_AFFECTED_BASE_REF = previousBaseRef;
      } else {
        process.env.REPO_AI_GOVERNOR_AFFECTED_BASE_REF = undefined;
      }
      rmSync(tempRepoPath, { recursive: true, force: true });
    }
  });
});
