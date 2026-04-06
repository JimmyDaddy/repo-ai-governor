import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { runCli } from '../src/main.js';

function createBufferedIo(currentWorkingDirectory: string): {
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
      cwd: () => currentWorkingDirectory,
    },
  };
}

async function createHostFixtureRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-host-cli-'));
  await mkdir(resolve(repositoryRoot, '.codex', 'skills', 'sample-host-skill'), {
    recursive: true,
  });
  await writeFile(
    resolve(repositoryRoot, 'AGENTS.md'),
    '# Fixture Workspace\n\nThis repository exists for host distribution CLI integration tests.\n',
    'utf8',
  );
  await writeFile(
    resolve(repositoryRoot, '.codex', 'skills', 'sample-host-skill', 'SKILL.md'),
    [
      '---',
      'name: sample-host-skill',
      'description: Sample host skill used by CLI integration tests.',
      '---',
      '',
      '# Sample Host Skill',
      '',
      'This fixture verifies staged export, apply, and verify behavior.',
      '',
    ].join('\n'),
    'utf8',
  );

  return repositoryRoot;
}

describe('host command integration', () => {
  it('exports and verifies repo-local GitHub Copilot assets inside a temporary repository', async () => {
    const repositoryRoot = await createHostFixtureRepository();

    try {
      const exportIo = createBufferedIo(repositoryRoot);
      const exportExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'export',
          '--host',
          'github-copilot',
          '--mode',
          'project-local',
          '--copilot-target',
          'repo-local',
          '--output-dir',
          '.repo-ai-governor/generated/hosts/github-copilot',
          '--apply-to-repo',
          '.repo-ai-governor/generated/applied/github-copilot',
        ],
        exportIo.io,
      );

      expect(exportExitCode).toBe(0);
      expect(exportIo.stderrBuffer.join('')).toBe('');

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'verify',
          '--manifest',
          '.repo-ai-governor/generated/hosts/github-copilot/host-export.manifest.json',
        ],
        verifyIo.io,
      );

      expect(verifyExitCode).toBe(0);
      expect(verifyIo.stderrBuffer.join('')).toBe('');
      expect(verifyIo.stdoutBuffer.join('')).toContain('host verify');

      const verificationSummaryPath = resolve(
        repositoryRoot,
        '.repo-ai-governor/generated/hosts/github-copilot/host-verification.summary.json',
      );
      const verificationSummary = JSON.parse(await readFile(verificationSummaryPath, 'utf8')) as {
        status: string;
      };

      expect(verificationSummary.status).toBe('pass');
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor/generated/applied/github-copilot/.github/copilot-instructions.md',
          ),
        ),
      ).toBe(true);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('returns a non-zero exit code before applying a reserved GitHub.com agent target into a repo', async () => {
    const repositoryRoot = await createHostFixtureRepository();

    try {
      const exportIo = createBufferedIo(repositoryRoot);
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'export',
          '--host',
          'github-copilot',
          '--mode',
          'project-local',
          '--copilot-target',
          'github-com-agent',
          '--output-dir',
          '.repo-ai-governor/generated/hosts/github-com-agent',
          '--apply-to-repo',
          '.repo-ai-governor/generated/applied/github-com-agent',
        ],
        exportIo.io,
      );

      expect(exitCode).toBe(1);
      expect(exportIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');
      expect(exportIo.stderrBuffer.join('')).toContain('不支持 --apply-to-repo');
      expect(
        existsSync(
          resolve(
            repositoryRoot,
            '.repo-ai-governor/generated/applied/github-com-agent/.github/copilot-instructions.md',
          ),
        ),
      ).toBe(false);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('fails host verify for a reserved GitHub.com agent manifest even when staged export succeeded', async () => {
    const repositoryRoot = await createHostFixtureRepository();

    try {
      const exportIo = createBufferedIo(repositoryRoot);
      const exportExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'export',
          '--host',
          'github-copilot',
          '--mode',
          'project-local',
          '--copilot-target',
          'github-com-agent',
          '--output-dir',
          '.repo-ai-governor/generated/hosts/github-com-agent-verify',
        ],
        exportIo.io,
      );

      expect(exportExitCode).toBe(1);
      expect(exportIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'verify',
          '--manifest',
          '.repo-ai-governor/generated/hosts/github-com-agent-verify/host-export.manifest.json',
        ],
        verifyIo.io,
      );

      expect(verifyExitCode).toBe(1);
      expect(verifyIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');

      const verificationSummaryPath = resolve(
        repositoryRoot,
        '.repo-ai-governor/generated/hosts/github-com-agent-verify/host-verification.summary.json',
      );
      const verificationSummary = JSON.parse(await readFile(verificationSummaryPath, 'utf8')) as {
        status: string;
      };

      expect(verificationSummary.status).toBe('fail');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('fails host verify when the manifest declares an apply report that no longer exists', async () => {
    const repositoryRoot = await createHostFixtureRepository();

    try {
      const exportIo = createBufferedIo(repositoryRoot);
      const exportExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'export',
          '--host',
          'github-copilot',
          '--mode',
          'project-local',
          '--copilot-target',
          'repo-local',
          '--output-dir',
          '.repo-ai-governor/generated/hosts/github-copilot-missing-apply-report',
          '--apply-to-repo',
          '.repo-ai-governor/generated/applied/github-copilot-missing-apply-report',
        ],
        exportIo.io,
      );

      expect(exportExitCode).toBe(0);

      await rm(
        resolve(
          repositoryRoot,
          '.repo-ai-governor/generated/hosts/github-copilot-missing-apply-report/host-apply.report.json',
        ),
        {
          force: true,
        },
      );

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'verify',
          '--manifest',
          '.repo-ai-governor/generated/hosts/github-copilot-missing-apply-report/host-export.manifest.json',
        ],
        verifyIo.io,
      );

      expect(verifyExitCode).toBe(1);
      expect(verifyIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');

      const verificationSummaryPath = resolve(
        repositoryRoot,
        '.repo-ai-governor/generated/hosts/github-copilot-missing-apply-report/host-verification.summary.json',
      );
      const verificationSummary = JSON.parse(await readFile(verificationSummaryPath, 'utf8')) as {
        status: string;
      };

      expect(verificationSummary.status).toBe('fail');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('fails host verify when the manifest declares a pack report that no longer exists', async () => {
    const repositoryRoot = await createHostFixtureRepository();

    try {
      const packIo = createBufferedIo(repositoryRoot);
      const packExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'pack',
          '--host',
          'codex',
          '--mode',
          'plugin-bundle',
          '--output-dir',
          '.repo-ai-governor/generated/hosts/codex-plugin-missing-pack-report',
          '--bundle-dir',
          '.repo-ai-governor/generated/bundles/codex-plugin-missing-pack-report',
        ],
        packIo.io,
      );

      expect(packExitCode).toBe(0);

      await rm(
        resolve(
          repositoryRoot,
          '.repo-ai-governor/generated/hosts/codex-plugin-missing-pack-report/host-pack.report.json',
        ),
        {
          force: true,
        },
      );

      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          'host',
          'verify',
          '--manifest',
          '.repo-ai-governor/generated/hosts/codex-plugin-missing-pack-report/host-export.manifest.json',
        ],
        verifyIo.io,
      );

      expect(verifyExitCode).toBe(1);
      expect(verifyIo.stderrBuffer.join('')).toContain('STANDARDS_PACK_INVALID');

      const verificationSummaryPath = resolve(
        repositoryRoot,
        '.repo-ai-governor/generated/hosts/codex-plugin-missing-pack-report/host-verification.summary.json',
      );
      const verificationSummary = JSON.parse(await readFile(verificationSummaryPath, 'utf8')) as {
        status: string;
      };

      expect(verificationSummary.status).toBe('fail');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('localizes host runtime validation errors for zh-CN locale', async () => {
    const repositoryRoot = await createHostFixtureRepository();

    try {
      const verifyIo = createBufferedIo(repositoryRoot);
      const verifyExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'zh-CN', 'host', 'verify'],
        verifyIo.io,
      );

      expect(verifyExitCode).toBe(1);
      expect(verifyIo.stderrBuffer.join('')).toContain(
        'host verify 需要 --manifest 或 --output-dir',
      );
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
